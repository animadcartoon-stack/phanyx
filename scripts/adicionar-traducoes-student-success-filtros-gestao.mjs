import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Filtros do acompanhamento",
    description:
      "Analise as intervenções por período, status e tipo.",

    period: "Período",
    allPeriods: "Todos os períodos",
    today: "Hoje",
    last7Days: "Últimos 7 dias",
    last30Days: "Últimos 30 dias",
    custom: "Personalizado",

    status: "Status",
    allStatuses: "Todos os status",

    type: "Tipo de intervenção",
    allTypes: "Todos os tipos",

    startDate: "Data inicial",
    endDate: "Data final",

    clear: "Limpar filtros",
  },

  "pt-PT": {
    title: "Filtros do acompanhamento",
    description:
      "Analise as intervenções por período, estado e tipo.",

    period: "Período",
    allPeriods: "Todos os períodos",
    today: "Hoje",
    last7Days: "Últimos 7 dias",
    last30Days: "Últimos 30 dias",
    custom: "Personalizado",

    status: "Estado",
    allStatuses: "Todos os estados",

    type: "Tipo de intervenção",
    allTypes: "Todos os tipos",

    startDate: "Data inicial",
    endDate: "Data final",

    clear: "Limpar filtros",
  },

  "en-US": {
    title: "Follow-up filters",
    description:
      "Analyze interventions by period, status and type.",

    period: "Period",
    allPeriods: "All periods",
    today: "Today",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    custom: "Custom",

    status: "Status",
    allStatuses: "All statuses",

    type: "Intervention type",
    allTypes: "All types",

    startDate: "Start date",
    endDate: "End date",

    clear: "Clear filters",
  },

  "es-ES": {
    title: "Filtros de seguimiento",
    description:
      "Analiza las intervenciones por período, estado y tipo.",

    period: "Período",
    allPeriods: "Todos los períodos",
    today: "Hoy",
    last7Days: "Últimos 7 días",
    last30Days: "Últimos 30 días",
    custom: "Personalizado",

    status: "Estado",
    allStatuses: "Todos los estados",

    type: "Tipo de intervención",
    allTypes: "Todos los tipos",

    startDate: "Fecha inicial",
    endDate: "Fecha final",

    clear: "Limpiar filtros",
  },

  "fr-FR": {
    title: "Filtres de suivi",
    description:
      "Analysez les interventions par période, statut et type.",

    period: "Période",
    allPeriods: "Toutes les périodes",
    today: "Aujourd'hui",
    last7Days: "7 derniers jours",
    last30Days: "30 derniers jours",
    custom: "Personnalisé",

    status: "Statut",
    allStatuses: "Tous les statuts",

    type: "Type d'intervention",
    allTypes: "Tous les types",

    startDate: "Date de début",
    endDate: "Date de fin",

    clear: "Effacer les filtres",
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

  const dashboard =
    json
      ?.AdminStudentSuccess
      ?.intervention
      ?.dashboard;

  if (!dashboard) {
    throw new Error(
      `AdminStudentSuccess.intervention.dashboard não encontrado em ${locale}.json`
    );
  }

  dashboard.filters =
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
  "\n✅ Filtros de gestão traduzidos."
);