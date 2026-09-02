import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Retornos e acompanhamentos",
    description:
      "Organize os próximos contatos e acompanhe intervenções que precisam de atenção.",

    overdue: "Atrasados",
    today: "Para hoje",
    next7Days: "Próximos 7 dias",
    unscheduled: "Sem retorno agendado",

    scheduledFor: "Retorno previsto",
    noScheduledDate: "Sem data de retorno",
    overdueLabel: "Retorno atrasado",

    empty:
      "Nenhum retorno ou acompanhamento pendente.",

    loading:
      "Carregando retornos...",

    error:
      "Não foi possível carregar os retornos.",

    viewStudent: "Ver aluno",
    update: "Atualizar",
  },

  "pt-PT": {
    title: "Retornos e acompanhamentos",
    description:
      "Organize os próximos contactos e acompanhe intervenções que necessitam de atenção.",

    overdue: "Atrasados",
    today: "Para hoje",
    next7Days: "Próximos 7 dias",
    unscheduled: "Sem retorno agendado",

    scheduledFor: "Retorno previsto",
    noScheduledDate: "Sem data de retorno",
    overdueLabel: "Retorno atrasado",

    empty:
      "Nenhum retorno ou acompanhamento pendente.",

    loading:
      "A carregar retornos...",

    error:
      "Não foi possível carregar os retornos.",

    viewStudent: "Ver aluno",
    update: "Atualizar",
  },

  "en-US": {
    title: "Returns and follow-ups",
    description:
      "Organize upcoming contacts and track interventions that need attention.",

    overdue: "Overdue",
    today: "Due today",
    next7Days: "Next 7 days",
    unscheduled: "No return scheduled",

    scheduledFor: "Scheduled return",
    noScheduledDate: "No return date",
    overdueLabel: "Overdue return",

    empty:
      "No pending returns or follow-ups.",

    loading:
      "Loading returns...",

    error:
      "Returns could not be loaded.",

    viewStudent: "View student",
    update: "Update",
  },

  "es-ES": {
    title: "Retornos y seguimientos",
    description:
      "Organiza los próximos contactos y realiza el seguimiento de las intervenciones que requieren atención.",

    overdue: "Atrasados",
    today: "Para hoy",
    next7Days: "Próximos 7 días",
    unscheduled: "Sin retorno programado",

    scheduledFor: "Retorno previsto",
    noScheduledDate: "Sin fecha de retorno",
    overdueLabel: "Retorno atrasado",

    empty:
      "No hay retornos ni seguimientos pendientes.",

    loading:
      "Cargando retornos...",

    error:
      "No se pudieron cargar los retornos.",

    viewStudent: "Ver alumno",
    update: "Actualizar",
  },

  "fr-FR": {
    title: "Retours et suivis",
    description:
      "Organisez les prochains contacts et suivez les interventions nécessitant une attention particulière.",

    overdue: "En retard",
    today: "Pour aujourd'hui",
    next7Days: "7 prochains jours",
    unscheduled: "Aucun retour programmé",

    scheduledFor: "Retour prévu",
    noScheduledDate: "Aucune date de retour",
    overdueLabel: "Retour en retard",

    empty:
      "Aucun retour ou suivi en attente.",

    loading:
      "Chargement des retours...",

    error:
      "Impossible de charger les retours.",

    viewStudent: "Voir l'étudiant",
    update: "Mettre à jour",
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

  intervention.returns =
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
  "\n✅ Traduções dos retornos concluídas."
);