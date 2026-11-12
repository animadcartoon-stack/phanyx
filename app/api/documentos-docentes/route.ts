import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoDocumentosDocentes, lerCampos, modeloDocenteValido } from "@/lib/documentos-docentes/seguranca";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await contextoDocumentosDocentes();
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const excluidos = ctx.papel === "ADMIN" && new URL(req.url).searchParams.get("excluidos") === "1";
  const documentos = await prisma.documentoDocente.findMany({
    where: {
      instituicaoId: ctx.instituicaoId,
      ...(ctx.professorId ? { professorId: ctx.professorId } : {}),
      status: excluidos ? "CANCELADO" : { not: "CANCELADO" },
    },
    include: { professor: { select: { nome: true } }, _count: { select: { anexos: true, mensagens: true, assinaturas: true } } },
    orderBy: { atualizadoEm: "desc" }, take: 150,
  });
  return NextResponse.json({ documentos }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const ctx = await contextoDocumentosDocentes();
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const titulo = typeof body?.titulo === "string" ? body.titulo.trim().slice(0, 180) : "";
  const instrucao = typeof body?.instrucao === "string" ? body.instrucao.trim().slice(0, 10000) : "";
  const modeloId = body?.modeloId === null || body?.modeloId === undefined || body?.modeloId === "" ? null : Number(body.modeloId);
  const tipo = ["PLANO_AULA", "RELATORIO", "ORIENTACAO", "ARQUIVO"].includes(body?.tipo) ? body.tipo as string : "";
  const campos = lerCampos(body?.campos);
  if (!titulo || !tipo || !campos || (modeloId !== null && (!Number.isSafeInteger(modeloId) || modeloId <= 0))) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (ctx.papel === "PROFESSOR" && tipo === "ORIENTACAO") return NextResponse.json({ error: "Tipo restrito à coordenação" }, { status: 403 });

  const modelo = modeloId ? await prisma.documentoTemplate.findFirst({ where: { id: modeloId, instituicaoId: ctx.instituicaoId } }) : null;
  if (modeloId && (!modelo || !modeloDocenteValido(modelo))) return NextResponse.json({ error: "Modelo indisponível" }, { status: 403 });
  if (ctx.papel === "PROFESSOR" && !modelo && tipo !== "ARQUIVO") return NextResponse.json({ error: "Selecione um modelo da coordenação" }, { status: 400 });
  const professoresIds: number[] = ctx.papel === "PROFESSOR" ? [ctx.professorId!] :
    Array.isArray(body?.professoresIds) ? [...new Set<number>(body.professoresIds.map((id: unknown) => Number(id)))] : [];
  if (professoresIds.length < 1 || professoresIds.length > 30 || professoresIds.some(x => !Number.isSafeInteger(x) || x <= 0)) return NextResponse.json({ error: "Selecione entre 1 e 30 professores" }, { status: 400 });
  const professores = await prisma.professor.findMany({
    where: { id: { in: professoresIds }, instituicaoId: ctx.instituicaoId, ativo: true },
    select: { id: true, userId: true },
  });
  if (professores.length !== professoresIds.length) return NextResponse.json({ error: "Professor não vinculado à instituição" }, { status: 403 });
  const status = ctx.papel === "ADMIN" ? "AGUARDANDO_PROFESSOR" : "RASCUNHO";
  const ids = await prisma.$transaction(async tx => {
    const gerados: number[] = [];
    for (const professorId of professoresIds) {
      const doc = await tx.documentoDocente.create({ data: {
        instituicaoId: ctx.instituicaoId, professorId, templateId: modelo?.id ?? null,
        titulo, tipo, origem: ctx.papel, status, criadoPorId: ctx.usuario.id,
        enviadoEm: ctx.papel === "ADMIN" ? new Date() : null,
        versoes: { create: { numero: 1, modeloSnapshot: modelo?.conteudo ?? "", campos: campos as Prisma.InputJsonValue, criadoPorId: ctx.usuario.id } },
        eventos: { create: { usuarioId: ctx.usuario.id, tipo: ctx.papel === "ADMIN" ? "INSTRUCAO_ENVIADA" : "RASCUNHO_CRIADO", versao: 1 } },
        ...(instrucao ? { mensagens: { create: { autorId: ctx.usuario.id, papel: ctx.papel, texto: instrucao } } } : {}),
      } });
      gerados.push(doc.id);
    }
    return gerados;
  });
  return NextResponse.json({ ok: true, ids }, { status: 201 });
}
