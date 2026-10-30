import type { Prisma } from "@prisma/client";
import { validarHorariosTurmaAvulsa, type HorarioAvulso } from "./validar-turma-avulsa";
import { ErroIntegridadeAcademica } from "./integridade-ofertas";

export function validarHorarioGeralTurma(entrada: unknown): HorarioAvulso[] {
  // A edição pode ficar sem horário; uma linha incompleta nunca é descartada.
  if (Array.isArray(entrada) && entrada.length === 0) return [];
  return validarHorariosTurmaAvulsa(entrada);
}

export function mesmosHorariosTurma(antes: HorarioAvulso[], depois: HorarioAvulso[]) {
  const chave = (lista: HorarioAvulso[]) => lista.map(h => `${h.diaSemana}|${h.horaInicio}|${h.horaFim}`).sort().join(";");
  return chave(antes) === chave(depois);
}

/** Guarda adicional para mudança do horário geral ou retirada da última oferta.
 * Executar na mesma transação Serializable que bloqueou a turma. */
export async function protegerEstruturaTurma(db: Prisma.TransactionClient, instituicaoId: number, turmaId: number) {
  const turma = await db.turma.findFirst({ where: { id: turmaId, instituicaoId }, select: {
    _count: { select: { atividades: true, aulas: true, itensMatricula: true, matriculasComoPrincipal: true,
      modulos: true, notas: true, provas: true, sessoesVideoAluno: true, eventosAprendizagemAluno: true,
      resultadosFinais: true, periodosMatriculaParticipantes: true, reunioes: true, substituicoesDocentes: true,
      destinosRecomendacoesBiblioteca: true, atividadesExternas: true, matriculasAvulsas: true } },
  } });
  if (!turma || Object.values(turma._count).some(n => n > 0)) throw new ErroIntegridadeAcademica("OFERTA_COM_HISTORICO");
  const snapshots = await db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
    WHERE "instituicaoId"=${instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ turmaId }] })}::jsonb`;
  const derivadas = await db.turma.findMany({ where: { instituicaoId, codigo: { startsWith: `OFERTA-${turmaId}-` } },
    select: { codigo: true, cursoId: true } });
  if (snapshots[0]?.total || derivadas.some(t => t.codigo === `OFERTA-${turmaId}-${t.cursoId}`)) {
    throw new ErroIntegridadeAcademica("OFERTA_COM_HISTORICO");
  }
}
