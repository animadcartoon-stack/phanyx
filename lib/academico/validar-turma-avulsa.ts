// PHANYX: validacao pura dos horarios de turma avulsa sem grade.
// Compartilhada entre rota e testes; nao acessa banco.
export type HorarioAvulso = { diaSemana: number; horaInicio: string; horaFim: string };
const horarioPadrao = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutos = (valor: string): number => Number(valor.slice(0, 2)) * 60 + Number(valor.slice(3));
export class ErroCadastroTurmaAvulsa extends Error {
  constructor(public codigo: string, mensagem: string) { super(mensagem); this.name = "ErroCadastroTurmaAvulsa"; }
}
export function validarHorariosTurmaAvulsa(entrada: unknown): HorarioAvulso[] {
  if (!Array.isArray(entrada) || entrada.length < 1 || entrada.length > 30) {
    throw new ErroCadastroTurmaAvulsa("HORARIOS_OBRIGATORIOS", "Informe de 1 a 30 encontros semanais para a turma avulsa.");
  }
  const horarios: HorarioAvulso[] = entrada.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ErroCadastroTurmaAvulsa("HORARIO_INVALIDO", "Horário de aula inválido.");
    }
    const h = item as Record<string, unknown>;
    const dia = Number(h.diaSemana);
    const inicio = typeof h.horaInicio === "string" ? h.horaInicio.trim() : "";
    const fim = typeof h.horaFim === "string" ? h.horaFim.trim() : "";
    if (!Number.isInteger(dia) || dia < 0 || dia > 6 || !horarioPadrao.test(inicio) ||
        !horarioPadrao.test(fim) || minutos(inicio) >= minutos(fim)) {
      throw new ErroCadastroTurmaAvulsa("HORARIO_INVALIDO", "Informe dia da semana e horário inicial anterior ao final (HH:mm). ");
    }
    return { diaSemana: dia, horaInicio: inicio, horaFim: fim };
  });
  for (let i = 0; i < horarios.length; i++) {
    for (let j = i + 1; j < horarios.length; j++) {
      const a = horarios[i], b = horarios[j];
      if (a.diaSemana === b.diaSemana && minutos(a.horaInicio) < minutos(b.horaFim) &&
          minutos(b.horaInicio) < minutos(a.horaFim)) {
        throw new ErroCadastroTurmaAvulsa("HORARIOS_SOBREPOSTOS", "Esta turma possui horários sobrepostos no mesmo dia.");
      }
    }
  }
  return horarios.sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio));
}
export function validarCapacidadeTurmaAvulsa(valor: unknown): number {
  const numero = Number(valor);
  if (valor === "" || valor === null || valor === undefined || !Number.isInteger(numero) || numero < 1 || numero > 5000) {
    throw new ErroCadastroTurmaAvulsa("CAPACIDADE_INVALIDA", "Informe a capacidade máxima da turma (1 a 5000 alunos).");
  }
  return numero;
}
