import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validarLinksDesenvolvimento } from "@/lib/desenvolvimento-materiais";
import { contextoProfessor, dataCivil, textoCurto, turmaDoProfessor, alunoMatriculadoNaTurma } from "@/lib/acompanhamento-permissoes";
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await contextoProfessor("professor.desenvolvimento");
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const id = Number(params.id); if (!Number.isSafeInteger(id) || id<=0) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const atual = await prisma.registroDesenvolvimento.findFirst({ where: { id, instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id } });
  if (!atual) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  if (!["RASCUNHO", "DEVOLVIDO"].includes(atual.status)) return NextResponse.json({ error: "Registro bloqueado para edição" }, { status: 409 });
  const turma = await turmaDoProfessor(ctx.instituicaoId, ctx.professor.id, atual.turmaId);
  if (!turma || !await alunoMatriculadoNaTurma(ctx.instituicaoId, atual.alunoId, atual.turmaId, ctx.professor.id)) return NextResponse.json({ error: "Vínculo indisponível" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !["SALVAR", "ENVIAR"].includes(body.acao)) return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  const titulo=textoCurto(body.titulo,150), descricao=textoCurto(body.descricao,6000), conceito=textoCurto(body.conceito,100);
  if (!titulo || !descricao) return NextResponse.json({ error: "Título e descrição obrigatórios" }, { status: 400 });
  const nota=body.nota === undefined || body.nota === null || body.nota === "" ? null : Number(body.nota);
  if (nota !== null && (!Number.isFinite(nota) || nota<0 || nota>100)) return NextResponse.json({ error: "Nota inválida" }, { status:400 });
  const prazo=atual.tipo === "TAREFA" && body.prazoTarefa ? dataCivil(body.prazoTarefa) : null;
  if (atual.tipo === "TAREFA" && body.prazoTarefa && !prazo) return NextResponse.json({ error: "Prazo inválido" }, { status:400 });
  const links = body.links === undefined ? undefined : validarLinksDesenvolvimento(body.links);
  if (links === null) return NextResponse.json({ error: "Informe até 10 links HTTP ou HTTPS válidos." }, { status: 400 });
  const resultado = await prisma.registroDesenvolvimento.updateMany({ where: {
    id, instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id, status: atual.status, atualizadoEm: atual.atualizadoEm,
  }, data: {
    titulo, descricao, conceito: conceito || null, nota, prazoTarefa: prazo, links,
    status: body.acao === "ENVIAR" ? "ENVIADO" : atual.status,
  } });
  if (resultado.count !== 1) return NextResponse.json({ error: "O registro foi alterado. Atualize a página e tente novamente." }, { status: 409 });
  const registro = await prisma.registroDesenvolvimento.findUnique({ where: { id } });
  return NextResponse.json({ ok:true, registro });
}
