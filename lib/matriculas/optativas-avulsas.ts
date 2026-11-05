import { ErroModalidades, horarioValido, horariosSobrepostos, idsPositivos, type HorarioModalidade } from "./combos";

export type HorarioOptativa = { diaSemana: number; horaInicio: string; horaFim: string };
export type SessaoOptativa = HorarioOptativa & {
  id: number;
  cursoId: number;
  disciplinaId: number;
  nome: string;
  vagas: number;
  turmaIds: number[];
};

export function idsOptativas(valor: unknown) {
  return valor === undefined ? [] : idsPositivos(valor, 100).sort((a, b) => a - b);
}

export function cabeNoHorario(sessao: HorarioOptativa, horarios: (Omit<HorarioOptativa, "horaFim"> & { horaFim: string | null })[]) {
  return horarios.some(horario => horario.diaSemana === sessao.diaSemana &&
    horario.horaInicio <= sessao.horaInicio && horario.horaFim !== null && horario.horaFim >= sessao.horaFim);
}

export function selecionarOptativas(
  ids: number[],
  sessoes: SessaoOptativa[],
  turmas: { id: number; horarios: (Omit<HorarioOptativa, "horaFim"> & { horaFim: string | null })[] }[],
) {
  const escolhas = ids.map(id => {
    const sessao = sessoes.find(item => item.id === id);
    const turma = sessao && turmas.find(item => sessao.turmaIds.includes(item.id));
    if (!sessao || !turma || !cabeNoHorario(sessao, turma.horarios))
      throw new ErroModalidades("OPTATIVA_INDISPONIVEL", 409);
    if (sessao.vagas <= 0) throw new ErroModalidades("OPTATIVA_SEM_VAGAS", 409, { nome: sessao.nome });
    return { ...sessao, turmaId: turma.id };
  });
  const horarios: HorarioModalidade[] = escolhas.map(e => ({
    ...e, dataInicio: null, dataFim: null, turmaNome: "", disciplinaNome: e.nome,
  }));
  for (const [i, escolha] of escolhas.entries()) {
    if (!horarioValido(horarios[i])) throw new ErroModalidades("OPTATIVA_INDISPONIVEL", 409);
    if (escolhas.slice(0, i).some((anterior, j) =>
      (anterior.disciplinaId === escolha.disciplinaId && anterior.diaSemana === escolha.diaSemana) ||
      horariosSobrepostos(horarios[j], horarios[i]))) {
      throw new ErroModalidades("OPTATIVAS_EM_CONFLITO", 409);
    }
  }
  return escolhas;
}

export const mensagensOptativas: Record<string, string> = {
  OPTATIVA_INDISPONIVEL: "Uma atividade escolhida está indisponível para a turma ou o horário.",
  OPTATIVA_SEM_VAGAS: "Uma atividade escolhida ficou sem vagas. Revise a seleção.",
  OPTATIVAS_EM_CONFLITO: "Escolha apenas uma sessão da mesma atividade por dia e evite horários sobrepostos.",
  OPTATIVA_CONFIGURACAO_INVALIDA: "Confira a disciplina, as turmas, o horário e a capacidade.",
  OPTATIVA_COM_MATRICULAS: "A sessão possui matrículas ativas. Revise a capacidade antes de alterá-la.",
};

export function distribuirRegencia<T extends { optativas: HorarioOptativa[] }>(
  horario: HorarioOptativa, alunos: T[],
) {
  const sessoes = alunos.flatMap(a => a.optativas).filter(sessao => cabeNoHorario(sessao, [horario]));
  const limites = [...new Set([horario.horaInicio, horario.horaFim, ...sessoes.flatMap(s => [s.horaInicio, s.horaFim])])].sort();
  return limites.slice(0, -1).map((inicio, i) => {
    const fim = limites[i + 1];
    return {
      inicio, fim,
      alunos: alunos.filter(a => !a.optativas.some(s =>
        s.diaSemana === horario.diaSemana && s.horaInicio < fim && s.horaFim > inicio)),
    };
  });
}
