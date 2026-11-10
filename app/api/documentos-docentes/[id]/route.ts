import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { documentoAutorizado, lerCampos } from "@/lib/documentos-docentes/seguranca";

export const dynamic = "force-dynamic";
type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({ error: "Documento não encontrado ou sem permissão" }, { status: 404 });
  const numero = Number(new URL(req.url).searchParams.get("versao") || auth.documento.versaoAtual);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > auth.documento.versaoAtual) return NextResponse.json({ error: "Versão inválida" }, { status: 400 });
  const [versao, mensagens, anexos, assinaturas, eventos, professor] = await Promise.all([
    prisma.documentoDocenteVersao.findUnique({ where: { documentoId_numero: { documentoId: auth.documento.id, numero } } }),
    prisma.documentoDocenteMensagem.findMany({ where: { documentoId: auth.documento.id }, orderBy: { criadoEm: "asc" }, take: 200 }),
    prisma.documentoDocenteAnexo.findMany({ where: { documentoId: auth.documento.id }, select: { id: true, versao: true, nomeOriginal: true, tamanho: true, mime: true, criadoEm: true, enviadoPorId: true, mensagemId: true }, orderBy: { criadoEm: "asc" }, take: 100 }),
    prisma.documentoDocenteAssinatura.findMany({ where: { documentoId: auth.documento.id }, select: { id: true, versao: true, papel: true, assinanteId: true, nomeAssinante: true, tipo: true, hashConteudo: true, assinadoEm: true }, orderBy: { assinadoEm: "asc" } }),
    prisma.documentoDocenteEvento.findMany({ where: { documentoId: auth.documento.id }, orderBy: { criadoEm: "asc" }, take: 250 }),
    prisma.professor.findFirst({ where: { id: auth.documento.professorId, instituicaoId: auth.ctx.instituicaoId }, select: { nome: true } }),
  ]);
  if (!versao) return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
  return NextResponse.json({ documento: auth.documento, versao, mensagens, anexos, assinaturas, eventos, professor }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({ error: "Documento não encontrado ou sem permissão" }, { status: 404 });
  const { ctx, documento } = auth;
  const body = await req.json().catch(() => null);
  const acao = String(body?.acao || "");
  const versaoEsperada = Number(body?.versaoEsperada);
  if (!Number.isSafeInteger(versaoEsperada) || versaoEsperada !== documento.versaoAtual) return NextResponse.json({ error: "Documento alterado. Atualize a página." }, { status: 409 });

  if (acao === "EDITAR") {
    if (ctx.papel !== "PROFESSOR" || !["RASCUNHO", "DEVOLVIDO", "AGUARDANDO_PROFESSOR"].includes(documento.status)) return NextResponse.json({ error: "Edição não permitida" }, { status: 403 });
    const campos = lerCampos(body?.campos);
    if (!campos) return NextResponse.json({ error: "Campos inválidos" }, { status: 400 });
    const anterior = await prisma.documentoDocenteVersao.findUnique({ where: { documentoId_numero: { documentoId: documento.id, numero: documento.versaoAtual } } });
    if (!anterior) return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
    const novaVersao = documento.versaoAtual + 1;
    const ok = await prisma.$transaction(async tx => {
      const atualizado = await tx.documentoDocente.updateMany({ where: { id: documento.id, instituicaoId: ctx.instituicaoId, professorId: ctx.professorId!, versaoAtual: versaoEsperada, status: { in: ["RASCUNHO", "DEVOLVIDO", "AGUARDANDO_PROFESSOR"] } }, data: { versaoAtual: novaVersao, status: "RASCUNHO" } });
      if (atualizado.count !== 1) return false;
      await tx.documentoDocenteVersao.create({ data: { documentoId: documento.id, numero: novaVersao, modeloSnapshot: anterior.modeloSnapshot, campos: campos as Prisma.InputJsonValue, criadoPorId: ctx.usuario.id } });
      await tx.documentoDocenteEvento.create({ data: { documentoId: documento.id, usuarioId: ctx.usuario.id, tipo: "VERSAO_CRIADA", versao: novaVersao } });
      return true;
    });
    return ok ? NextResponse.json({ ok: true, versao: novaVersao }) : NextResponse.json({ error: "Conflito de atualização" }, { status: 409 });
  }

  const regras: Record<string, { papel: "ADMIN" | "PROFESSOR"; status: string[]; novo: string }> = {
    ENVIAR: { papel: "PROFESSOR", status: ["RASCUNHO", "DEVOLVIDO", "AGUARDANDO_PROFESSOR"], novo: "ENVIADO" },
    APROVAR: { papel: "ADMIN", status: ["ENVIADO"], novo: "APROVADO" },
    DEVOLVER: { papel: "ADMIN", status: ["ENVIADO", "APROVADO"], novo: "DEVOLVIDO" },
    CONCLUIR: { papel: "ADMIN", status: ["APROVADO"], novo: "CONCLUIDO" },
  };
  const regra = regras[acao];
  if (!regra || regra.papel !== ctx.papel || !regra.status.includes(documento.status)) return NextResponse.json({ error: "Ação não permitida para o estado atual" }, { status: 403 });
  const exigeAmbasAssinaturas = ["PLANO_AULA", "RELATORIO"].includes(documento.tipo);
  if (exigeAmbasAssinaturas && (acao === "ENVIAR" || acao === "CONCLUIR")) {
    const assinaturas = await prisma.documentoDocenteAssinatura.findMany({
      where: { documentoId: documento.id, versao: documento.versaoAtual }, select: { papel: true },
    });
    const papeis = new Set(assinaturas.map(a=>a.papel));
    if (!papeis.has("PROFESSOR") || (acao === "CONCLUIR" && !papeis.has("ADMIN")))
      return NextResponse.json({ error: "É necessária a assinatura eletrônica da versão atual antes desta ação." }, { status: 409 });
  }
  if (acao === "DEVOLVER" && (typeof body?.justificativa !== "string" || !body.justificativa.trim())) return NextResponse.json({ error: "Informe o motivo da devolução" }, { status: 400 });
  const ok = await prisma.$transaction(async tx => {
    const atualizado = await tx.documentoDocente.updateMany({ where: { id: documento.id, instituicaoId: ctx.instituicaoId, versaoAtual: versaoEsperada, status: documento.status }, data: {
      status: regra.novo, ...(acao === "ENVIAR" ? { enviadoEm: new Date() } : {}), ...(acao === "CONCLUIR" ? { concluidoEm: new Date() } : {}),
    } });
    if (atualizado.count !== 1) return false;
    await tx.documentoDocenteEvento.create({ data: { documentoId: documento.id, usuarioId: ctx.usuario.id, tipo: acao, versao: versaoEsperada, descricao: acao === "DEVOLVER" ? String(body.justificativa).trim().slice(0, 3000) : null } });
    if (acao === "DEVOLVER") await tx.documentoDocenteMensagem.create({ data: { documentoId: documento.id, autorId: ctx.usuario.id, papel: ctx.papel, texto: String(body.justificativa).trim().slice(0, 3000) } });
    return true;
  });
  return ok ? NextResponse.json({ ok: true, status: regra.novo }) : NextResponse.json({ error: "Documento alterado simultaneamente" }, { status: 409 });
}
