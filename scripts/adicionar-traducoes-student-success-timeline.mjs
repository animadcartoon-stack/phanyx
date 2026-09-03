import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Linha do tempo do aluno",
    description:
      "Acompanhe cronologicamente as intervenções, retornos programados e encerramentos registrados.",
    loading:
      "Carregando linha do tempo...",
    error:
      "Não foi possível carregar a linha do tempo.",
    empty:
      "Ainda não existem eventos registrados para este aluno.",

    summaryInterventions:
      "Intervenções",
    summaryEvents:
      "Eventos",
    summaryOpen:
      "Abertas",
    summaryClosed:
      "Encerradas",

    registered:
      "Intervenção registrada",
    returnScheduled:
      "Retorno programado",
    closed:
      "Intervenção encerrada",

    academicSnapshot:
      "Fotografia acadêmica",
    risk:
      "Risco",
    score:
      "Pontuação",
    coverage:
      "Cobertura",
    reliability:
      "Confiabilidade",

    observation:
      "Observação",
    result:
      "Resultado",

    evolution:
      "Evolução observada",
    positive:
      "Evolução positiva",
    negative:
      "Evolução negativa",
    neutral:
      "Sem alteração acadêmica mensurável",
    notMeasurable:
      "Evolução ainda não mensurável",

    scheduledFor:
      "Programado para",
  },

  "pt-PT": {
    title: "Linha temporal do aluno",
    description:
      "Acompanhe cronologicamente as intervenções, retornos programados e encerramentos registados.",
    loading:
      "A carregar a linha temporal...",
    error:
      "Não foi possível carregar a linha temporal.",
    empty:
      "Ainda não existem eventos registados para este aluno.",

    summaryInterventions:
      "Intervenções",
    summaryEvents:
      "Eventos",
    summaryOpen:
      "Abertas",
    summaryClosed:
      "Encerradas",

    registered:
      "Intervenção registada",
    returnScheduled:
      "Retorno programado",
    closed:
      "Intervenção encerrada",

    academicSnapshot:
      "Fotografia académica",
    risk:
      "Risco",
    score:
      "Pontuação",
    coverage:
      "Cobertura",
    reliability:
      "Confiabilidade",

    observation:
      "Observação",
    result:
      "Resultado",

    evolution:
      "Evolução observada",
    positive:
      "Evolução positiva",
    negative:
      "Evolução negativa",
    neutral:
      "Sem alteração académica mensurável",
    notMeasurable:
      "Evolução ainda não mensurável",

    scheduledFor:
      "Programado para",
  },

  "en-US": {
    title: "Student timeline",
    description:
      "Follow recorded interventions, scheduled follow-ups, and closures chronologically.",
    loading:
      "Loading timeline...",
    error:
      "The timeline could not be loaded.",
    empty:
      "There are no recorded events for this student yet.",

    summaryInterventions:
      "Interventions",
    summaryEvents:
      "Events",
    summaryOpen:
      "Open",
    summaryClosed:
      "Closed",

    registered:
      "Intervention registered",
    returnScheduled:
      "Follow-up scheduled",
    closed:
      "Intervention closed",

    academicSnapshot:
      "Academic snapshot",
    risk:
      "Risk",
    score:
      "Score",
    coverage:
      "Coverage",
    reliability:
      "Reliability",

    observation:
      "Observation",
    result:
      "Result",

    evolution:
      "Observed progress",
    positive:
      "Positive progress",
    negative:
      "Negative progress",
    neutral:
      "No measurable academic change",
    notMeasurable:
      "Progress not yet measurable",

    scheduledFor:
      "Scheduled for",
  },

  "es-ES": {
    title: "Cronología del estudiante",
    description:
      "Siga cronológicamente las intervenciones, seguimientos programados y cierres registrados.",
    loading:
      "Cargando cronología...",
    error:
      "No fue posible cargar la cronología.",
    empty:
      "Todavía no hay eventos registrados para este estudiante.",

    summaryInterventions:
      "Intervenciones",
    summaryEvents:
      "Eventos",
    summaryOpen:
      "Abiertas",
    summaryClosed:
      "Cerradas",

    registered:
      "Intervención registrada",
    returnScheduled:
      "Seguimiento programado",
    closed:
      "Intervención cerrada",

    academicSnapshot:
      "Fotografía académica",
    risk:
      "Riesgo",
    score:
      "Puntuación",
    coverage:
      "Cobertura",
    reliability:
      "Confiabilidad",

    observation:
      "Observación",
    result:
      "Resultado",

    evolution:
      "Evolución observada",
    positive:
      "Evolución positiva",
    negative:
      "Evolución negativa",
    neutral:
      "Sin cambio académico medible",
    notMeasurable:
      "Evolución aún no medible",

    scheduledFor:
      "Programado para",
  },

  "fr-FR": {
    title: "Chronologie de l'élève",
    description:
      "Suivez chronologiquement les interventions, suivis programmés et clôtures enregistrés.",
    loading:
      "Chargement de la chronologie...",
    error:
      "Impossible de charger la chronologie.",
    empty:
      "Aucun événement n'est encore enregistré pour cet élève.",

    summaryInterventions:
      "Interventions",
    summaryEvents:
      "Événements",
    summaryOpen:
      "Ouvertes",
    summaryClosed:
      "Clôturées",

    registered:
      "Intervention enregistrée",
    returnScheduled:
      "Suivi programmé",
    closed:
      "Intervention clôturée",

    academicSnapshot:
      "Instantané académique",
    risk:
      "Risque",
    score:
      "Score",
    coverage:
      "Couverture",
    reliability:
      "Fiabilité",

    observation:
      "Observation",
    result:
      "Résultat",

    evolution:
      "Évolution observée",
    positive:
      "Évolution positive",
    negative:
      "Évolution négative",
    neutral:
      "Aucun changement académique mesurable",
    notMeasurable:
      "Évolution pas encore mesurable",

    scheduledFor:
      "Programmé pour",
  },
};

for (
  const [
    locale,
    timeline,
  ] of Object.entries(
    traducoes
  )
) {
  const arquivo =
    path.join(
      process.cwd(),
      "messages",
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  json.AdminStudentSuccess ??=
    {};

  json.AdminStudentSuccess
    .intervention ??=
    {};

  json.AdminStudentSuccess
    .intervention
    .timeline =
    timeline;

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
  "\n✅ Traduções da timeline concluídas."
);