import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoProfessor, dataCivil, periodicidadeTurma, periodoCompativel, textoCurto, turmaDoProfessor } from "@/lib/acompanhamento-permissoes";
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || !["SALVAR", "ENVIAR"].includes(body.acao)) return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  const atual = await prisma.planoRelatorioAula.findUnique({ where: { id } });
  if (!atual) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  const ctx = await contextoProfessor(atual.tipo === "RELATORIO" ? "professor.relatorios" : "professor.planejamento");
  if (!ctx || atual.instituicaoId !== ctx.instituicaoId || atual.professorId !== ctx.professor.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (!["RASCUNHO", "REVISAO"].includes(atual.status)) return NextResponse.json({ error: "Documento já enviado ou aprovado" }, { status: 409 });
  const turma = await turmaDoProfessor(ctx.instituicaoId, ctx.professor.id, atual.turmaId);
  if (!turma) return NextResponse.json({ error: "Turma não autorizada" }, { status: 403 });
  const regra = await periodicidadeTurma(ctx.instituicaoId, turma.cursoId);
  const inicio = dataCivil(body.inicioPeriodo), fim = dataCivil(body.fimPeriodo);
  if (!inicio || !fim || inicio > fim || fim.getTime()-inicio.getTime()>370*86400000) return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  if (!periodoCompativel(regra.periodicidade, inicio, fim)) return NextResponse.json({ error: "Período incompatível com a periodicidade exigida" }, { status: 400 });
  const titulo = textoCurto(body.titulo,150), objetivos=textoCurto(body.objetivos), conteudo=textoCurto(body.conteudo), metodologia=textoCurto(body.metodologia);
  if (body.acao === "ENVIAR" && (!titulo || !objetivos || !conteudo || !metodologia)) return NextResponse.json({ error: "Campos obrigatórios incompletos" }, { status: 400 });
  const alterado = await prisma.planoRelatorioAula.update({ where: { id }, data: {
    titulo, objetivos, conteudo, metodologia, inicioPeriodo: inicio, fimPeriodo: fim,
    recursos: textoCurto(body.recursos) || null, avaliacao: textoCurto(body.avaliacao) || null,
    observacoes: textoCurto(body.observacoes) || null, periodicidade: regra.periodicidade,
    status: body.acao === "ENVIAR" ? (regra.exigeAprovacao ? "ENVIADO" : "APROVADO") : atual.status,
    enviadoEm: body.acao === "ENVIAR" ? new Date() : atual.enviadoEm,
  } });
  return NextResponse.json({ ok:true, registro: alterado });
}
