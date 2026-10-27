import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { copySelecao } from "./selecao-disciplinas-copy";
import { ErroSelecaoDisciplinas, normalizarSelecaoDisciplinas, validarModoSelecao, validarSelecaoDisciplinas } from "./selecao-disciplinas";

export async function carregarRegrasSelecao(db: Prisma.TransactionClient, instituicaoId: number, cursoId: number) {
  const curso = await db.curso.findFirst({ where: { id: cursoId, instituicaoId, ativo: true, excluidoEm: null } });
  if (!curso) throw new ErroSelecaoDisciplinas("CURSO_SELECAO_INVALIDO", undefined, 404);
  const regras = normalizarSelecaoDisciplinas(curso.regrasSelecaoDisciplinas);
  if (regras) validarModoSelecao(curso);
  return regras;
}

export async function conferirSelecaoContratada(db: Prisma.TransactionClient, params: {
  instituicaoId: number; cursoId: number; regras: unknown;
  disciplinaIds: number[]; itens: { disciplinaId: number }[];
}) {
  const regras = validarSelecaoDisciplinas(params.regras, params.disciplinaIds);
  if (!regras) return;
  const contratadas = [...params.disciplinaIds].sort((a,b) => a-b);
  const cursadas = [...new Set(params.itens.map(i => i.disciplinaId))].sort((a,b) => a-b);
  if (JSON.stringify(contratadas) !== JSON.stringify(cursadas)) throw new ErroSelecaoDisciplinas("SELECAO_ITENS_DIVERGENTES");
  // Só as disciplinas contratadas precisam continuar disponíveis para uma edição.
  const disciplinas = await db.disciplina.findMany({ where: { id: { in: contratadas }, instituicaoId: params.instituicaoId, ativo: true }, select: { id: true } });
  if (disciplinas.length !== contratadas.length) throw new ErroSelecaoDisciplinas("GRADE_SELECAO_ALTERADA", undefined, 409);
}

export async function respostaErroSelecao(error: unknown) {
  if (!(error instanceof ErroSelecaoDisciplinas)) return null;
  const { getLocale } = await import("next-intl/server");
  const t = copySelecao(await getLocale());
  return NextResponse.json({ codigo: error.codigo, error: t.errors[error.codigo] || t.errors.REGRAS_SELECAO_INVALIDAS, detalhes: error.detalhes }, { status: error.status });
}
