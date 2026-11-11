import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";
import { hashVersaoDocente } from "@/lib/documentos-docentes/integridade";
import { professorPodeEditarDocumentoDocente } from "@/lib/documentos-docentes/fluxo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

async function assinaturaImagemValida(dataUri: string): Promise<boolean> {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUri) || dataUri.length > 450_000) return false;
  const bytes = Buffer.from(dataUri.slice("data:image/png;base64,".length), "base64");
  if (bytes.length < 150 || bytes.length > 320_000 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return false;
  try {
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject:true });
    if (info.width < 200 || info.width > 1500 || info.height < 70 || info.height > 700) return false;
    // Desenho realmente visível: não aceitar canvas transparente ou totalmente branco.
    let pontos = 0;
    for (let i=0; i<data.length; i+=4) if (data[i+3] > 50 && (data[i] < 180 || data[i+1] < 180 || data[i+2] < 180)) pontos++;
    return pontos >= 25;
  } catch { return false; }
}

export async function POST(req: Request, { params }: Params) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({ error:"Documento inexistente ou sem permissão." }, { status:404 });
  const { ctx, documento } = auth;
  if (ctx.papel === "PROFESSOR" && ctx.usuario.impersonacao) {
    return NextResponse.json({ error:"Entre na sua conta de professor para assinar o documento." }, { status:403 });
  }
  const body = await req.json().catch(() => null);
  const versao = Number(body?.versao);
  const hashEsperado = body?.hashEsperado;
  const tipo = body?.tipo === "DESENHO" ? "DESENHO" : body?.tipo === "DIGITAL" ? "DIGITAL" : "";
  if (versao !== documento.versaoAtual || !tipo || body?.consentimento !== true) return NextResponse.json({ error:"Confirme a versão e o consentimento antes de assinar." }, { status:400 });
  if (hashEsperado !== undefined && (typeof hashEsperado !== "string" || !/^[a-f0-9]{64}$/.test(hashEsperado))) {
    return NextResponse.json({ error:"A revisão do documento é inválida. Atualize a página." }, { status:400 });
  }
  if (documento.status === "CANCELADO" || documento.status === "CONCLUIDO") return NextResponse.json({ error:"Documento já encerrado." }, { status:409 });
  const professorAssina = ctx.papel === "PROFESSOR" && professorPodeEditarDocumentoDocente(documento.status);
  const adminAssina = ctx.papel === "ADMIN" && documento.status === "APROVADO";
  if (!professorAssina && !adminAssina) return NextResponse.json({ error:"Assinatura indisponível neste estado." }, { status:403 });
  const imagem = tipo === "DESENHO" ? (typeof body?.imagem === "string" ? body.imagem : "") : "";
  if (tipo === "DESENHO" && !(await assinaturaImagemValida(imagem))) return NextResponse.json({ error:"Desenhe uma assinatura válida antes de continuar." }, { status:400 });

  const [snapshot, anexos, existente, assinaturaProfessor] = await Promise.all([
    prisma.documentoDocenteVersao.findUnique({ where:{ documentoId_numero:{ documentoId:documento.id, numero:versao } } }),
    prisma.documentoDocenteAnexo.findMany({ where:{ documentoId:documento.id, versao:{ lte:versao } }, select:{ id:true, versao:true, nomeOriginal:true, mime:true, tamanho:true, sha256:true }, orderBy:{ id:"asc" } }),
    prisma.documentoDocenteAssinatura.findUnique({ where:{ documentoId_versao_papel:{ documentoId:documento.id, versao, papel:ctx.papel } }, select:{ id:true } }),
    ctx.papel === "ADMIN" ? prisma.documentoDocenteAssinatura.findUnique({ where:{ documentoId_versao_papel:{ documentoId:documento.id, versao, papel:"PROFESSOR" } }, select:{ id:true } }) : Promise.resolve(null),
  ]);
  if (!snapshot) return NextResponse.json({ error:"Versão não encontrada." }, { status:404 });
  if (existente) return NextResponse.json({ error:"Esta versão já foi assinada por você." }, { status:409 });
  if (adminAssina && !assinaturaProfessor) return NextResponse.json({ error:"O professor precisa assinar esta versão antes da coordenação." }, { status:409 });

  const hashConteudo = hashVersaoDocente(documento.id, snapshot, anexos);
  if (hashEsperado !== undefined && hashEsperado !== hashConteudo) {
    return NextResponse.json({ error:"O documento ou seus anexos mudaram. Atualize e revise o PDF antes de assinar." }, { status:409 });
  }
  try {
    const resultado = await prisma.$transaction(async tx => {
      // Uma atualização condicional serializa a operação com edições/alterações de estado.
      const tocado = await tx.documentoDocente.updateMany({
        where:{ id:documento.id, instituicaoId:ctx.instituicaoId, versaoAtual:versao, status:documento.status },
        data:{ atualizadoEm:new Date() },
      });
      if (tocado.count !== 1) return null;
      // Revalidar integridade dos anexos quando a assinatura adquire a trava.
      const ainda = await tx.documentoDocenteAnexo.findMany({ where:{ documentoId:documento.id, versao:{ lte:versao } }, select:{ id:true, versao:true, nomeOriginal:true, mime:true, tamanho:true, sha256:true } });
      if (hashVersaoDocente(documento.id, snapshot, ainda) !== hashConteudo) return null;
      const registro = await tx.documentoDocenteAssinatura.create({ data:{
        documentoId:documento.id, versao, papel:ctx.papel, assinanteId:ctx.usuario.id,
        nomeAssinante:(ctx.usuario.nome || ctx.usuario.email).slice(0,180), tipo, imagem, hashConteudo,
        ip:(req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim().slice(0,80),
        userAgent:(req.headers.get("user-agent") || "").slice(0,400),
      } });
      await tx.documentoDocenteEvento.create({ data:{ documentoId:documento.id, usuarioId:ctx.usuario.id, tipo:`ASSINATURA_${ctx.papel}`, versao, descricao:`Assinatura eletrônica (${tipo}); SHA-256 ${hashConteudo}` } });
      return registro.id;
    });
    if (!resultado) return NextResponse.json({ error:"Documento ou anexo alterado durante a assinatura. Atualize a página." }, { status:409 });
    return NextResponse.json({ ok:true, assinaturaId:resultado, versao, hashConteudo }, { status:201, headers:{"Cache-Control":"no-store"} });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error:"Essa versão já possui assinatura deste papel." }, { status:409 });
    console.error("Assinatura docente falhou:", e);
    return NextResponse.json({ error:"Não foi possível assinar o documento." }, { status:500 });
  }
}
