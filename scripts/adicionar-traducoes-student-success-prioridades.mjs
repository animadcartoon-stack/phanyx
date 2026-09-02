import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Prioridades do acompanhamento",
    description:
      "Veja rapidamente os casos que exigem atenção da equipe.",

    today: "Ação para hoje",
    overdue: "Retornos atrasados",
    worsened: "Piora observada após intervenção",

    updatedToday:
      "Atualizado hoje",

    daysWithoutUpdate:
      "{count, plural, one {Há # dia sem atualização} other {Há # dias sem atualização}}",
    unscheduled: "Sem retorno programado",

    todayDescription:
      "Intervenções com retorno previsto para hoje.",

    overdueDescription:
      "Intervenções cuja data de retorno já passou.",

    worsenedDescription:
      "Alunos com evolução acadêmica negativa observada após uma intervenção.",

    unscheduledDescription:
      "Intervenções abertas que ainda não possuem data de retorno.",

    empty:
      "Nenhuma prioridade operacional identificada neste momento.",

    loading:
      "Carregando prioridades...",

    error:
      "Não foi possível carregar as prioridades.",

    scheduledFor:
      "Retorno previsto",

    overdueSince:
      "Retorno previsto para",

    withoutDate:
      "Sem data de retorno",

    lastUpdate:
      "Última atualização",

    completedAt:
      "Intervenção encerrada em",

    viewStudent:
      "Ver aluno",

    update:
      "Atualizar acompanhamento",

    needsReview:
      "Requer nova avaliação da equipe",

      showAll: "Mostrar todos",
  },

  "pt-PT": {
    title: "Prioridades do acompanhamento",
    description:
      "Veja rapidamente os casos que exigem atenção da equipa.",

    today: "Ação para hoje",
    overdue: "Retornos atrasados",
    worsened: "Piora observada após intervenção",

    updatedToday:
      "Atualizado hoje",

    daysWithoutUpdate:
      "{count, plural, one {Há # dia sem atualização} other {Há # dias sem atualização}}",
    unscheduled: "Sem retorno programado",

    todayDescription:
      "Intervenções com retorno previsto para hoje.",

    overdueDescription:
      "Intervenções cuja data de retorno já passou.",

    worsenedDescription:
      "Alunos com evolução académica negativa observada após uma intervenção.",

    unscheduledDescription:
      "Intervenções abertas que ainda não possuem data de retorno.",

    empty:
      "Nenhuma prioridade operacional identificada neste momento.",

    loading:
      "A carregar prioridades...",

    error:
      "Não foi possível carregar as prioridades.",

    scheduledFor:
      "Retorno previsto",

    overdueSince:
      "Retorno previsto para",

    withoutDate:
      "Sem data de retorno",

    lastUpdate:
      "Última atualização",

    completedAt:
      "Intervenção encerrada em",

    viewStudent:
      "Ver aluno",

    update:
      "Atualizar acompanhamento",

    needsReview:
      "Requer nova avaliação da equipa",

      showAll: "Mostrar todos",
  },

  "en-US": {
    title: "Follow-up priorities",
    description:
      "Quickly identify cases that require attention from the team.",

    today: "Action due today",
    overdue: "Overdue follow-ups",
    worsened: "Observed decline after intervention",

    updatedToday:
      "Updated today",

    daysWithoutUpdate:
      "{count, plural, one {# day without an update} other {# days without an update}}",
    unscheduled: "No follow-up scheduled",

    todayDescription:
      "Interventions with a follow-up scheduled for today.",

    overdueDescription:
      "Interventions whose scheduled follow-up date has passed.",

    worsenedDescription:
      "Students with observed negative academic evolution after an intervention.",

    unscheduledDescription:
      "Open interventions that do not yet have a follow-up date.",

    empty:
      "No operational priorities identified at this time.",

    loading:
      "Loading priorities...",

    error:
      "Priorities could not be loaded.",

    scheduledFor:
      "Scheduled follow-up",

    overdueSince:
      "Follow-up scheduled for",

    withoutDate:
      "No follow-up date",

    lastUpdate:
      "Last update",

    completedAt:
      "Intervention completed on",

    viewStudent:
      "View student",

    update:
      "Update follow-up",

    needsReview:
      "Requires a new team review",

      showAll: "Show all",
  },

  "es-ES": {
    title: "Prioridades de seguimiento",
    description:
      "Identifica rápidamente los casos que requieren atención del equipo.",

    today: "Acción para hoy",
    overdue: "Seguimientos atrasados",
    worsened: "Empeoramiento observado tras la intervención",

    updatedToday:
      "Actualizado hoy",

    daysWithoutUpdate:
      "{count, plural, one {# día sin actualización} other {# días sin actualización}}",
    unscheduled: "Sin seguimiento programado",

    todayDescription:
      "Intervenciones con seguimiento previsto para hoy.",

    overdueDescription:
      "Intervenciones cuya fecha de seguimiento ya ha pasado.",

    worsenedDescription:
      "Alumnos con evolución académica negativa observada después de una intervención.",

    unscheduledDescription:
      "Intervenciones abiertas que aún no tienen fecha de seguimiento.",

    empty:
      "No se identificaron prioridades operativas en este momento.",

    loading:
      "Cargando prioridades...",

    error:
      "No se pudieron cargar las prioridades.",

    scheduledFor:
      "Seguimiento previsto",

    overdueSince:
      "Seguimiento previsto para",

    withoutDate:
      "Sin fecha de seguimiento",

    lastUpdate:
      "Última actualización",

    completedAt:
      "Intervención finalizada el",

    viewStudent:
      "Ver alumno",

    update:
      "Actualizar seguimiento",

    needsReview:
      "Requiere una nueva evaluación del equipo",

      showAll: "Mostrar todos",
  },

  "fr-FR": {
    title: "Priorités de suivi",
    description:
      "Identifiez rapidement les situations nécessitant l'attention de l'équipe.",

    today: "Action pour aujourd'hui",
    overdue: "Suivis en retard",
    worsened: "Dégradation observée après intervention",

    updatedToday:
      "Mis à jour aujourd'hui",

    daysWithoutUpdate:
      "{count, plural, one {# jour sans mise à jour} other {# jours sans mise à jour}}",
    unscheduled: "Aucun suivi programmé",

    todayDescription:
      "Interventions avec un suivi prévu aujourd'hui.",

    overdueDescription:
      "Interventions dont la date de suivi prévue est dépassée.",

    worsenedDescription:
      "Élèves présentant une évolution académique négative observée après une intervention.",

    unscheduledDescription:
      "Interventions ouvertes sans date de suivi programmée.",

    empty:
      "Aucune priorité opérationnelle identifiée pour le moment.",

    loading:
      "Chargement des priorités...",

    error:
      "Impossible de charger les priorités.",

    scheduledFor:
      "Suivi prévu",

    overdueSince:
      "Suivi prévu le",

    withoutDate:
      "Aucune date de suivi",

    lastUpdate:
      "Dernière mise à jour",

    completedAt:
      "Intervention terminée le",

    viewStudent:
      "Voir l'élève",

    update:
      "Mettre à jour le suivi",

    needsReview:
      "Nécessite une nouvelle évaluation de l'équipe",

      showAll: "Tout afficher",
  },
};

const pasta =
  path.join(
    process.cwd(),
    "messages"
  );

for (
  const [
    locale,
    valores,
  ] of Object.entries(
    traducoes
  )
) {
  const arquivo =
    path.join(
      pasta,
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  const intervention =
    json
      ?.AdminStudentSuccess
      ?.intervention;

  if (!intervention) {
    throw new Error(
      `AdminStudentSuccess.intervention não encontrado em ${locale}.json`
    );
  }

  intervention.priorities =
    valores;

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(
      json,
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `✅ ${locale}.json atualizado`
  );
}

console.log(
  "\n✅ Prioridades do Student Success traduzidas."
);