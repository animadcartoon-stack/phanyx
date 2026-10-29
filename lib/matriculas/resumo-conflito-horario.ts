// A mensagem apresenta o conflito do servidor; não autoriza a gravação.
type AulaConflitante = { turmaNome?: unknown; disciplinaNome?: unknown; diaSemana?: unknown; horaInicio?: unknown; horaFim?: unknown };
const pt = {
  base: "Este aluno já possui uma aula nesse dia e horário, ou as turmas escolhidas se sobrepõem. A matrícula foi bloqueada. ",
  escolha: "Escolha outra turma ou horário.", turma: "Turma não identificada", atividade: "atividade",
  horario: "horário não informado", dia: "dia não identificado", coincide: "coincide com",
};
const textos: Record<string, typeof pt> = {
  "pt-BR": pt, "pt-PT": pt,
  "en-US": { base: "This student already has a class at this time, or the selected classes overlap. Enrollment was blocked. ", escolha: "Choose another class or time.", turma: "Unidentified class", atividade: "activity", horario: "time not provided", dia: "unidentified day", coincide: "overlaps with" },
  "es-ES": { base: "El alumno ya tiene una clase ese día y a esa hora, o las clases elegidas se superponen. La matrícula fue bloqueada. ", escolha: "Elija otra clase u horario.", turma: "Clase no identificada", atividade: "actividad", horario: "horario no indicado", dia: "día no identificado", coincide: "coincide con" },
  "fr-FR": { base: "Cet élève a déjà un cours à cette heure, ou les classes choisies se chevauchent. L’inscription a été bloquée. ", escolha: "Choisissez une autre classe ou un autre horaire.", turma: "Classe non identifiée", atividade: "activité", horario: "horaire non renseigné", dia: "jour non identifié", coincide: "coïncide avec" },
};
const nome = (valor: unknown, fallback: string) => typeof valor === "string" && valor.trim() ? valor.trim().slice(0, 120) : fallback;
export function mensagemConflitoHorario(detalhes: unknown, locale = "pt-BR"): string {
  const texto = textos[locale] || textos["en-US"];
  const hora = (valor: unknown) => typeof valor === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor) ? valor : texto.horario;
  const descricao = (aula: AulaConflitante) => nome(aula.turmaNome, texto.turma) + " (" + nome(aula.disciplinaNome, texto.atividade) + ", " + hora(aula.horaInicio) + "–" + hora(aula.horaFim) + ")";
  if (!detalhes || typeof detalhes !== "object" || Array.isArray(detalhes)) return texto.base + texto.escolha;
  const conflitos = (detalhes as { conflitos?: unknown }).conflitos;
  if (!Array.isArray(conflitos) || conflitos.length === 0) return texto.base + texto.escolha;
  const resumos = conflitos.slice(0, 3).map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const par = item as { primeiro?: AulaConflitante; segundo?: AulaConflitante };
    if (!par.primeiro || typeof par.primeiro !== "object" || !par.segundo || typeof par.segundo !== "object") return null;
    const dia = par.primeiro.diaSemana;
    const diaTexto = typeof dia === "number" && Number.isInteger(dia) && dia >= 0 && dia <= 6
      ? new Intl.DateTimeFormat(textos[locale] ? locale : "en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + dia))) : texto.dia;
    return diaTexto + ": " + descricao(par.primeiro) + " " + texto.coincide + " " + descricao(par.segundo) + ".";
  }).filter((x): x is string => Boolean(x));
  return texto.base + (resumos.length ? resumos.join(" ") : texto.escolha);
}
