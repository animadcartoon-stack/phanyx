import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";
import { validarAnexoDocente, MAX_ANEXO_DOCENTE, MAX_QUANTIDADE_ANEXOS_DOCENTE } from "@/lib/documentos-docentes/anexo-seguro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params:{ id:string } }) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({error:"Documento inexistente ou sem permissão."},{status:404});
  const { ctx, documento } = auth;
  if (["CANCELADO","CONCLUIDO"].includes(documento.status) ||
      (ctx.papel === "PROFESSOR" && !["RASCUNHO","DEVOLVIDO","AGUARDANDO_PROFESSOR"].includes(documento.status)))
    return NextResponse.json({error:"Este documento não aceita mais anexos."},{status:409});
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket === process.env.R2_BUCKET_NAME))
    return NextResponse.json({error:"Armazenamento privado não configurado."},{status:503});
  if (Number(req.headers.get("content-length")||0) > MAX_ANEXO_DOCENTE + 120_000)
    return NextResponse.json({error:"Arquivo acima do limite de 10 MB."},{status:413});
  const [quantidade, assinaturas] = await Promise.all([
    prisma.documentoDocenteAnexo.count({where:{documentoId:documento.id}}),
    prisma.documentoDocenteAssinatura.count({where:{documentoId:documento.id,versao:documento.versaoAtual}}),
  ]);
  if (quantidade >= MAX_QUANTIDADE_ANEXOS_DOCENTE) return NextResponse.json({error:"Limite de 15 anexos alcançado."},{status:409});
  if (assinaturas) return NextResponse.json({error:"A versão já foi assinada. Para incluir arquivo, solicite uma nova versão."},{status:409});
  const form = await req.formData().catch(()=>null);
  const arquivo = form?.get("arquivo");
  const nota = String(form?.get("nota")||"").trim();
  if (!(arquivo instanceof File) || nota.length > 3000) return NextResponse.json({error:"Arquivo ou mensagem inválidos."},{status:400});
  let validado: Awaited<ReturnType<typeof validarAnexoDocente>>;
  try { validado = await validarAnexoDocente(arquivo); }
  catch (erro) { return NextResponse.json({error: erro instanceof Error ? erro.message : "Arquivo inválido."},{status:400}); }
  const sha256 = createHash("sha256").update(validado.bytes).digest("hex");
  const chaveR2 = `privado/instituicoes/${ctx.instituicaoId}/documentos-docentes/${documento.id}/${randomUUID()}`;
  try {
    await getR2Client().send(new PutObjectCommand({Bucket:bucket,Key:chaveR2,Body:validado.bytes,ContentType:validado.mime,CacheControl:"private, no-store"}));
  } catch (erro) { console.error("R2 docente upload:",erro); return NextResponse.json({error:"Falha ao gravar no armazenamento privado."},{status:503}); }
  try {
    const registro = await prisma.$transaction(async tx => {
      const tocado = await tx.documentoDocente.updateMany({
        where:{id:documento.id,instituicaoId:ctx.instituicaoId,versaoAtual:documento.versaoAtual,status:documento.status},
        data:{atualizadoEm:new Date()},
      });
      if (tocado.count!==1) return null;
      if (await tx.documentoDocenteAssinatura.count({where:{documentoId:documento.id,versao:documento.versaoAtual}})) return null;
      if (await tx.documentoDocenteAnexo.count({where:{documentoId:documento.id}}) >= MAX_QUANTIDADE_ANEXOS_DOCENTE) return null;
      const msg = nota ? await tx.documentoDocenteMensagem.create({data:{documentoId:documento.id,autorId:ctx.usuario.id,papel:ctx.papel,texto:nota}}) : null;
      const anexo = await tx.documentoDocenteAnexo.create({data:{
        documentoId:documento.id,versao:documento.versaoAtual,mensagemId:msg?.id??null,enviadoPorId:ctx.usuario.id,
        nomeOriginal:validado.nome,chaveR2,mime:validado.mime,tamanho:validado.bytes.length,sha256,
      }});
      await tx.documentoDocenteEvento.create({data:{documentoId:documento.id,usuarioId:ctx.usuario.id,tipo:"ANEXO_ENVIADO",versao:documento.versaoAtual,descricao:validado.nome}});
      return {id:anexo.id,nomeOriginal:anexo.nomeOriginal,tamanho:anexo.tamanho,versao:anexo.versao};
    });
    if (!registro) {
      await getR2Client().send(new DeleteObjectCommand({Bucket:bucket,Key:chaveR2})).catch(()=>null);
      return NextResponse.json({error:"Documento alterado ou já assinado. Atualize a página."},{status:409});
    }
    return NextResponse.json({ok:true,anexo:registro},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch(erro) {
    await getR2Client().send(new DeleteObjectCommand({Bucket:bucket,Key:chaveR2})).catch(()=>null);
    console.error("R2 docente / DB rollback:",erro);
    return NextResponse.json({error:"Não foi possível registrar o anexo."},{status:500});
  }
}
