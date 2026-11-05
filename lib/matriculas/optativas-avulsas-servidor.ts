import { Prisma } from "@prisma/client";
import { ErroModalidades } from "./combos";
import type { SessaoOptativa } from "./optativas-avulsas";

export const vinculoOptativaOcupante = {
  status: { in: ["A_CURSAR", "EM_CURSO"] },
  matricula: { excluidaEm: null, canceladaEm: null, status: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] } },
} satisfies Prisma.MatriculaTurmaAvulsaWhereInput;

export async function ocupacoesOptativas(db: Prisma.TransactionClient, instituicaoId: number, ids: number[], ignorarMatriculaId?: number) {
  if (!ids.length) return new Map<number, number>();
  const ocupacoes = await db.matriculaOptativaAvulsa.groupBy({
    by: ["sessaoId"],
    where: { instituicaoId, sessaoId: { in: ids }, vinculo: {
      ...vinculoOptativaOcupante,
      ...(ignorarMatriculaId ? { matriculaId: { not: ignorarMatriculaId } } : {}),
    } },
    _count: { _all: true },
  });
  return new Map(ocupacoes.map(item => [item.sessaoId, item._count._all]));
}

export async function carregarOptativas(
  db: Prisma.TransactionClient, instituicaoId: number, turmaIds: number[], sessaoIds?: number[],
): Promise<SessaoOptativa[]> {
  if (!turmaIds.length || sessaoIds?.length === 0) return [];
  const sessoes = await db.sessaoOptativaAvulsa.findMany({
    where: {
      instituicaoId, ativa: true,
      ...(sessaoIds ? { id: { in: sessaoIds } } : {}),
      curso: { matriculaDiretaTurma: true, optativasAvulsasAtivas: true, ativo: true, excluidoEm: null },
      disciplina: { ativo: true },
      turmas: { some: { turmaId: { in: turmaIds }, turma: { ativa: true } } },
    },
    select: {
      id: true, cursoId: true, disciplinaId: true, diaSemana: true, horaInicio: true, horaFim: true, capacidade: true,
      disciplina: { select: { nome: true, cursoId: true } },
      turmas: { where: { turmaId: { in: turmaIds }, turma: { ativa: true } },
        select: { turmaId: true, turma: { select: { cursoId: true } } } },
    },
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }, { id: "asc" }],
  });
  const ocupacoes = await ocupacoesOptativas(db, instituicaoId, sessoes.map(s => s.id));
  return sessoes.filter(s => s.disciplina.cursoId === s.cursoId).map(({ disciplina, capacidade, turmas, ...sessao }) => ({
    ...sessao,
    nome: disciplina.nome,
    vagas: Math.max(0, capacidade - (ocupacoes.get(sessao.id) ?? 0)),
    turmaIds: turmas.filter(t => t.turma.cursoId === sessao.cursoId).map(t => t.turmaId),
  }));
}

export async function bloquearSessoesOptativas(db: Prisma.TransactionClient, instituicaoId: number, ids: number[]) {
  if (!ids.length) return;
  const bloqueadas = await db.$queryRaw<{ id: number }[]>(Prisma.sql`
    SELECT "id" FROM "SessaoOptativaAvulsa" WHERE "instituicaoId" = ${instituicaoId}
    AND "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE
  `);
  if (bloqueadas.length !== ids.length) throw new ErroModalidades("OPTATIVA_INDISPONIVEL", 409);
}

export function possuiOptativasContratadas(snapshot: Prisma.JsonValue) {
  return Boolean(snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) &&
    Array.isArray(snapshot.optativas) && snapshot.optativas.length);
}

export async function verificarVagasOptativasParaRetorno(db: Prisma.TransactionClient, instituicaoId: number, matriculaId: number) {
  const selecoes = await db.matriculaOptativaAvulsa.findMany({
    where: { instituicaoId, vinculo: { matriculaId, status: vinculoOptativaOcupante.status } },
    select: { sessaoId: true },
  });
  const ids = [...new Set(selecoes.map(s => s.sessaoId))];
  if (!ids.length) return;
  await bloquearSessoesOptativas(db, instituicaoId, ids);
  const [sessoes, ocupacoes] = await Promise.all([
    db.sessaoOptativaAvulsa.findMany({
      where: { instituicaoId, id: { in: ids }, ativa: true }, select: { id: true, capacidade: true },
    }),
    ocupacoesOptativas(db, instituicaoId, ids, matriculaId),
  ]);
  if (sessoes.length !== ids.length) throw new ErroModalidades("OPTATIVA_INDISPONIVEL", 409);
  if (sessoes.some(s => (ocupacoes.get(s.id) ?? 0) >= s.capacidade))
    throw new ErroModalidades("OPTATIVA_SEM_VAGAS", 409);
}
