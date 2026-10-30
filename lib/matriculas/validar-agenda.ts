import { ErroSelecaoDisciplinas, temDisciplinaIncluidaDuplicada } from "./selecao-disciplinas";
import { Prisma } from "@prisma/client";
import {
  encontrarConflitos,
  horarioValido,
  ErroModalidades,
  type HorarioModalidade,
} from "./combos";
import { horariosAtuaisAluno } from "./modalidades-servidor";

// Usado também pela matrícula tradicional: uma nova matrícula avulsa não pode
// ignorar a agenda já ocupada por um pacote.
export async function validarAgendaMatricula(
  tx: Prisma.TransactionClient,
  params: {
    instituicaoId: number;
    alunoId: number;
    itens: { turmaId: number; disciplinaId: number }[];
    matriculaId?: number;
    inicio?: Date | null;
    fim?: Date | null;
    exigirHorarios?: boolean;
    regrasSelecaoDisciplinas?: unknown;
  },
) {
  const { instituicaoId, alunoId, itens, matriculaId, inicio, fim } = params;
  await tx.$queryRaw`SELECT "id" FROM "Aluno" WHERE "id" = ${alunoId} AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
  const ids = [...new Set(itens.map((i) => i.turmaId))].sort((a, b) => a - b);
  if (ids.length)
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Turma" WHERE "instituicaoId" = ${instituicaoId}
    AND "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`);
  if (!itens.length) return;
  const vinculos = await tx.turmaDisciplina.findMany({
    where: {
      instituicaoId,
      OR: itens.map((i) => ({
        turmaId: i.turmaId,
        disciplinaId: i.disciplinaId,
      })),
    },
    select: {
      turmaId: true,
      disciplinaId: true,
      dataInicio: true,
      dataFim: true,
      turma: { select: { nome: true, dataInicio: true, dataFim: true,
        horariosAvulsos: { where: { instituicaoId, ativo: true }, select: { diaSemana: true, horaInicio: true, horaFim: true } } } },
      disciplina: { select: { nome: true } },
      horarios: {
        where: { instituicaoId, ativo: true },
        select: { diaSemana: true, horaInicio: true, horaFim: true },
      },
    },
  });
  if (params.exigirHorarios && itens.some(i => !vinculos.some(v => v.turmaId === i.turmaId && v.disciplinaId === i.disciplinaId && (v.horarios.length || v.turma.horariosAvulsos?.length)))) throw new ErroModalidades("HORARIOS_INCOMPLETOS", 409);
  const civil = (data: Date | null | undefined) =>
    data?.toISOString().slice(0, 10) || null;
  const horarios: HorarioModalidade[] = vinculos.flatMap((v) =>
    (v.horarios.length ? v.horarios : (v.turma.horariosAvulsos || [])).map((h) => ({
      ...h,
      turmaId: v.turmaId,
      disciplinaId: v.disciplinaId,
      turmaNome: v.turma.nome,
      disciplinaNome: v.disciplina.nome,
      dataInicio:
        [civil(v.dataInicio || v.turma.dataInicio), civil(inicio)]
          .filter(Boolean)
          .sort()
          .pop() || null,
      dataFim: [civil(v.dataFim || v.turma.dataFim), civil(fim)].filter(Boolean).sort()[0] || null,
    })),
  );
  if (params.exigirHorarios && horarios.some(h => !horarioValido(h))) throw new ErroModalidades("HORARIOS_INCOMPLETOS", 409);
  const existentes = await horariosAtuaisAluno(
    tx,
    instituicaoId,
    alunoId,
    matriculaId,
  );
  const novasDisciplinas = vinculos.map(v => ({ disciplinaId: v.disciplinaId, incluida: Boolean(params.regrasSelecaoDisciplinas),
    inicio: [civil(v.dataInicio || v.turma.dataInicio), civil(inicio)].filter(Boolean).sort().pop() || null,
    fim: [civil(v.dataFim || v.turma.dataFim), civil(fim)].filter(Boolean).sort()[0] || null }));
  const existentesDisciplinas = existentes.itens.flatMap(i => {
    const periodos = i.matricula.organizacaoCurricular === "LIVRE" ? i.matricula.periodosCursoLivre : [{ dataInicio: i.matricula.dataInicioCurso || i.turma.dataInicio, dataFim: i.turma.dataFim }];
    return periodos.map(p => ({ disciplinaId: i.disciplinaId, incluida: Boolean(i.matricula.regrasSelecaoDisciplinas), inicio: civil(p.dataInicio), fim: civil(p.dataFim) }));
  });
  if (temDisciplinaIncluidaDuplicada(novasDisciplinas, existentesDisciplinas)) throw new ErroSelecaoDisciplinas("DISCIPLINA_JA_INCLUIDA", undefined, 409);
  const conflitos = encontrarConflitos(horarios, existentes.horarios);
  if (conflitos.length)
    throw new ErroModalidades("CONFLITO_HORARIO", 409, { conflitos });
}
