import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarLinksDesenvolvimento } from "@/lib/desenvolvimento-materiais";
import { alunoMatriculadoNaTurma, contextoProfessor, dataCivil, textoCurto, turmaDoProfessor } from "@/lib/acompanhamento-permissoes";
export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await contextoProfessor("professor.desenvolvimento");
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const registros = await prisma.registroDesenvolvimento.findMany({
    where: { instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id },
    include: { aluno: { select: { nome: true } }, turma: { select: { nome: true } }, imagens: { select: { id: true, nomeOriginal: true, mime: true } } },
    orderBy: { atualizadoEm: "desc" }, take: 100,
  });
  return NextResponse.json({ registros }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: Request) {
  const ctx = await contextoProfessor("professor.desenvolvimento");
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const turmaId = Number(body?.turmaId), alunoId = Number(body?.alunoId);
  if (!Number.isSafeInteger(turmaId) || turmaId<=0 || !Number.isSafeInteger(alunoId) || alunoId<=0 || !["EVOLUCAO", "AVALIACAO", "TAREFA"].includes(body?.tipo)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const turma = await turmaDoProfessor(ctx.instituicaoId, ctx.professor.id, turmaId);
  if (!turma || !await alunoMatriculadoNaTurma(ctx.instituicaoId, alunoId, turmaId, ctx.professor.id)) return NextResponse.json({ error: "Vínculo aluno/turma/professor não confirmado" }, { status: 403 });
  const titulo=textoCurto(body.titulo,150), descricao=textoCurto(body.descricao,6000), conceito=textoCurto(body.conceito,100);
  if (!titulo || !descricao) return NextResponse.json({ error: "Título e descrição são obrigatórios" }, { status: 400 });
  const nota=body.nota === undefined || body.nota === null || body.nota === "" ? null : Number(body.nota);
  if (nota !== null && (!Number.isFinite(nota) || nota < 0 || nota > 100)) return NextResponse.json({ error: "Nota fora do intervalo 0 a 100" }, { status: 400 });
  const prazo=body.tipo === "TAREFA" && body.prazoTarefa ? dataCivil(body.prazoTarefa) : null;
  if (body.tipo === "TAREFA" && body.prazoTarefa && !prazo) return NextResponse.json({ error: "Prazo inválido" }, { status: 400 });
  const links = validarLinksDesenvolvimento(body.links === undefined ? [] : body.links);
  if (!links) return NextResponse.json({ error: "Informe até 10 links HTTP ou HTTPS válidos." }, { status: 400 });
  const registro = await prisma.registroDesenvolvimento.create({ data: {
    instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id, alunoId, turmaId,
    tipo: body.tipo, titulo, descricao, conceito: conceito || null, nota, prazoTarefa: prazo, links,
    status: body.enviar === true ? "ENVIADO" : "RASCUNHO",
  } });
  return NextResponse.json({ ok: true, registro }, { status: 201 });
}
