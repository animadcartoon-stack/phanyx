import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoProfessor, dataCivil, periodicidadeTurma, periodoCompativel, textoCurto, turmaDoProfessor } from "@/lib/acompanhamento-permissoes";
export const dynamic = "force-dynamic";

async function contexto(tipo: string) {
  return contextoProfessor(tipo === "RELATORIO" ? "professor.relatorios" : "professor.planejamento");
}
export async function GET(req: Request) {
  const tipo = new URL(req.url).searchParams.get("tipo") === "RELATORIO" ? "RELATORIO" : "PLANEJAMENTO";
  const ctx = await contexto(tipo);
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const registros = await prisma.planoRelatorioAula.findMany({ where: { instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id, tipo }, orderBy: { atualizadoEm: "desc" }, take: 100, include: { turma: { select: { nome: true } } } });
  return NextResponse.json({ registros }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const tipo = body?.tipo;
  if (tipo !== "RELATORIO" && tipo !== "PLANEJAMENTO") return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  const ctx = await contexto(tipo);
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const turmaId = Number(body?.turmaId);
  const turma = Number.isSafeInteger(turmaId) && turmaId > 0 ? await turmaDoProfessor(ctx.instituicaoId, ctx.professor.id, turmaId) : null;
  if (!turma) return NextResponse.json({ error: "Turma não autorizada" }, { status: 403 });
  const inicio = dataCivil(body?.inicioPeriodo); const fim = dataCivil(body?.fimPeriodo);
  if (!inicio || !fim || inicio > fim || (fim.getTime() - inicio.getTime()) > 370*86400000) return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  const regra = await periodicidadeTurma(ctx.instituicaoId, turma.cursoId);
  if (body?.periodicidade !== regra.periodicidade) return NextResponse.json({ error: `Periodicidade exigida: ${regra.periodicidade}` }, { status: 400 });
  if (!periodoCompativel(regra.periodicidade, inicio, fim)) return NextResponse.json({ error: "Período incompatível com a periodicidade exigida" }, { status: 400 });
  const enviar = body?.enviar === true;
  const titulo = textoCurto(body?.titulo, 150);
  const objetivos = textoCurto(body?.objetivos);
  const conteudo = textoCurto(body?.conteudo);
  const metodologia = textoCurto(body?.metodologia);
  if (enviar && (!titulo || !objetivos || !conteudo || !metodologia)) return NextResponse.json({ error: "Preencha título, objetivos, conteúdo e metodologia antes de enviar" }, { status: 400 });
  const registro = await prisma.planoRelatorioAula.create({ data: {
    instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id, turmaId,
    tipo, periodicidade: regra.periodicidade, inicioPeriodo: inicio, fimPeriodo: fim,
    titulo, objetivos, conteudo, metodologia,
    recursos: textoCurto(body?.recursos) || null, avaliacao: textoCurto(body?.avaliacao) || null,
    observacoes: textoCurto(body?.observacoes) || null,
    status: enviar ? (regra.exigeAprovacao ? "ENVIADO" : "APROVADO") : "RASCUNHO", enviadoEm: enviar ? new Date() : null,
  } });
  return NextResponse.json({ ok: true, registro }, { status: 201 });
}
