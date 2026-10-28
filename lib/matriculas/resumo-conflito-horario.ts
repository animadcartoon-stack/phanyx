// Mensagem de conflito validada no servidor, nunca usada para autorizar gravacao.
type AulaConflitante = { turmaNome?: unknown; disciplinaNome?: unknown; diaSemana?: unknown; horaInicio?: unknown; horaFim?: unknown };
const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const hora = (valor: unknown) => typeof valor === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor) ? valor : "horário não informado";
const nome = (valor: unknown, fallback: string) => typeof valor === "string" && valor.trim() ? valor.trim().slice(0, 120) : fallback;
function descricao(aula: AulaConflitante) {
  return nome(aula.turmaNome, "Turma não identificada") + " (" + nome(aula.disciplinaNome, "atividade") + ", " + hora(aula.horaInicio) + "–" + hora(aula.horaFim) + ")";
}
export function mensagemConflitoHorario(detalhes: unknown): string {
  const base = "Este aluno já possui uma aula nesse dia e horário, ou as turmas escolhidas se sobrepõem. A matrícula conjunta foi bloqueada. ";
  if (!detalhes || typeof detalhes !== "object" || Array.isArray(detalhes)) return base + "Escolha outra turma ou horário.";
  const conflitos = (detalhes as { conflitos?: unknown }).conflitos;
  if (!Array.isArray(conflitos) || conflitos.length === 0) return base + "Escolha outra turma ou horário.";
  const resumos = conflitos.slice(0, 3).map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const par = item as { primeiro?: AulaConflitante; segundo?: AulaConflitante };
    if (!par.primeiro || !par.segundo) return null;
    const dia = Number(par.primeiro.diaSemana);
    const diaTexto = Number.isInteger(dia) && dia >= 0 && dia <= 6 ? dias[dia] : "dia não identificado";
    return diaTexto + ": " + descricao(par.primeiro) + " coincide com " + descricao(par.segundo) + ".";
  }).filter((x): x is string => Boolean(x));
  return base + (resumos.length ? resumos.join(" ") : "Escolha outra turma ou horário.");
}
