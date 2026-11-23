// Une o escopo já validado das duas APIs docentes sem inventar disciplinas.
// Nunca modifica vínculos no banco. A API avulsa já restringe instituição,
// professor autenticado, atividade, horários e modalidade de matrícula direta.
export type TurmaUnificada = {
  id: number;
  turmaDisciplinaId?: number;
  nome: string;
  semestre: string;
  periodoLetivo?: string | null;
  turno?: string | null;
  modalidade?: string | null;
  statusTurma?: string | null;
  alunos: number;
  curso?: { id: number; nome: string } | null;
  disciplina?: { id: number; nome: string } | null;
  statusDisciplina?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  quantidadeAulas?: number;
  horarios?: {
    id?: number;
    diaSemana: number;
    horaInicio: string;
    horaFim?: string | null;
    ativo?: boolean;
  }[];
  semDisciplinas?: boolean;
};

export type TurmaAvulsaResumo = {
  id: number;
  nome: string;
  turno: string | null;
  periodoLetivo: string | null;
  statusTurma?: string | null;
  curso: { id: number; nome: string } | null;
  alunos: number;
  semDisciplinas?: boolean;
  horarios: Array<{ diaSemana: number; horaInicio: string; horaFim: string }>;
};

export function combinarTurmasProfessor(
  comDisciplinas: TurmaUnificada[],
  candidatasSemDisciplinas: TurmaAvulsaResumo[],
): TurmaUnificada[] {
  const turmasComGrade = new Set(comDisciplinas.map(turma => turma.id));
  const incluidas = new Set<number>();
  const semDisciplinas: TurmaUnificada[] = [];
  for (const turma of candidatasSemDisciplinas) {
    if (turma.semDisciplinas !== true || turmasComGrade.has(turma.id) || incluidas.has(turma.id)) continue;
    incluidas.add(turma.id);
    semDisciplinas.push({
      id: turma.id,
      nome: turma.nome,
      turmaDisciplinaId: undefined,
      semestre: "",
      periodoLetivo: turma.periodoLetivo,
      turno: turma.turno,
      statusTurma: turma.statusTurma,
      alunos: turma.alunos,
      curso: turma.curso,
      disciplina: null,
      quantidadeAulas: 0,
      semDisciplinas: true,
      horarios: turma.horarios.map(h => ({ ...h, ativo: true })),
    });
  }
  return [...comDisciplinas, ...semDisciplinas];
}
