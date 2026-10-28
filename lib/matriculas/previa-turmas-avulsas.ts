import type { HorarioModalidade } from "./combos";

type DiaHora = { diaSemana: number; horaInicio: string; horaFim: string };
type TurmaDireta = { id: number; nome: string; dataInicio: Date | null; dataFim: Date | null; horariosAvulsos: DiaHora[] };

/** Uma aula do curso direto substitui uma disciplina somente na camada de horario.
 * O ID sintético zero NUNCA é gravado em ItemMatricula/Disciplina. */
export function horariosTurmaDiretaSemGrade(turma: TurmaDireta): HorarioModalidade[] {
  return turma.horariosAvulsos.map(h => ({
    ...h, turmaId: turma.id, turmaNome: turma.nome,
    disciplinaId: 0, disciplinaNome: "Aula do curso avulso",
    dataInicio: turma.dataInicio ? turma.dataInicio.toISOString().slice(0,10) : null,
    dataFim: turma.dataFim ? turma.dataFim.toISOString().slice(0,10) : null,
  }));
}

/** Conta alunos distintos, nao quantidade de registros; null requer capacidade informada. */
export function vagasTurmaDiretaSemGrade(capacidade: number | null, alunosOcupantes: number[]): number | null {
  if (!Number.isSafeInteger(capacidade) || (capacidade ?? 0) <= 0) return null;
  return Math.max(0, capacidade! - new Set(alunosOcupantes).size);
}
