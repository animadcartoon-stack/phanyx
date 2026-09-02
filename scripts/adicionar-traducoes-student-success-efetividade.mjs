import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    dashboard: {
      title: "Acompanhamento das intervenções",
      description:
        "Acompanhe o andamento e a efetividade das ações realizadas com os alunos.",

      total: "Total de intervenções",
      open: "Intervenções abertas",
      awaitingResponse: "Aguardando retorno",
      inProgress: "Em acompanhamento",
      resolved: "Resolvidas",

      effectivenessTitle: "Efetividade das intervenções",
      effectivenessDescription:
        "Indicadores calculados somente com intervenções e dados acadêmicos reais.",

      positiveEvolution: "Evolução positiva",
      positiveEvolutionSubtitle:
        "{count} intervenções mensuráveis",

      averageResolutionTime: "Tempo médio de resolução",
      days: "{value} dias",

      studentsWorsened: "Alunos com piora",
      studentsWorsenedSubtitle:
        "Alunos distintos após intervenção",

      notMeasurable: "Ainda não mensuráveis",
      notMeasurableSubtitle:
        "Resolvidas sem comparação acadêmica suficiente",

      measurableResolved:
        "Resolvidas mensuráveis",

      neutralEvolution:
        "Sem mudança mensurável",

      negativeEvolution:
        "Evolução negativa",

      unavailable: "—",
      loading: "Carregando indicadores...",
      error:
        "Não foi possível carregar os indicadores das intervenções.",
    },
  },

  "pt-PT": {
    dashboard: {
      title: "Acompanhamento das intervenções",
      description:
        "Acompanhe o estado e a eficácia das ações realizadas com os alunos.",

      total: "Total de intervenções",
      open: "Intervenções abertas",
      awaitingResponse: "A aguardar retorno",
      inProgress: "Em acompanhamento",
      resolved: "Resolvidas",

      effectivenessTitle: "Eficácia das intervenções",
      effectivenessDescription:
        "Indicadores calculados apenas com intervenções e dados académicos reais.",

      positiveEvolution: "Evolução positiva",
      positiveEvolutionSubtitle:
        "{count} intervenções mensuráveis",

      averageResolutionTime: "Tempo médio de resolução",
      days: "{value} dias",

      studentsWorsened: "Alunos com piora",
      studentsWorsenedSubtitle:
        "Alunos distintos após intervenção",

      notMeasurable: "Ainda não mensuráveis",
      notMeasurableSubtitle:
        "Resolvidas sem comparação académica suficiente",

      measurableResolved:
        "Resolvidas mensuráveis",

      neutralEvolution:
        "Sem alteração mensurável",

      negativeEvolution:
        "Evolução negativa",

      unavailable: "—",
      loading: "A carregar indicadores...",
      error:
        "Não foi possível carregar os indicadores das intervenções.",
    },
  },

  "en-US": {
    dashboard: {
      title: "Intervention follow-up",
      description:
        "Track the progress and effectiveness of actions taken with students.",

      total: "Total interventions",
      open: "Open interventions",
      awaitingResponse: "Awaiting response",
      inProgress: "In follow-up",
      resolved: "Resolved",

      effectivenessTitle: "Intervention effectiveness",
      effectivenessDescription:
        "Indicators calculated only from real interventions and academic data.",

      positiveEvolution: "Positive progress",
      positiveEvolutionSubtitle:
        "{count} measurable interventions",

      averageResolutionTime: "Average resolution time",
      days: "{value} days",

      studentsWorsened: "Students with decline",
      studentsWorsenedSubtitle:
        "Distinct students after intervention",

      notMeasurable: "Not yet measurable",
      notMeasurableSubtitle:
        "Resolved interventions without sufficient academic comparison",

      measurableResolved:
        "Measurable resolved",

      neutralEvolution:
        "No measurable change",

      negativeEvolution:
        "Negative progress",

      unavailable: "—",
      loading: "Loading indicators...",
      error:
        "The intervention indicators could not be loaded.",
    },
  },

  "es-ES": {
    dashboard: {
      title: "Seguimiento de intervenciones",
      description:
        "Supervisa el progreso y la efectividad de las acciones realizadas con los alumnos.",

      total: "Total de intervenciones",
      open: "Intervenciones abiertas",
      awaitingResponse: "Esperando respuesta",
      inProgress: "En seguimiento",
      resolved: "Resueltas",

      effectivenessTitle: "Efectividad de las intervenciones",
      effectivenessDescription:
        "Indicadores calculados únicamente con intervenciones y datos académicos reales.",

      positiveEvolution: "Evolución positiva",
      positiveEvolutionSubtitle:
        "{count} intervenciones medibles",

      averageResolutionTime: "Tiempo medio de resolución",
      days: "{value} días",

      studentsWorsened: "Alumnos con empeoramiento",
      studentsWorsenedSubtitle:
        "Alumnos distintos después de la intervención",

      notMeasurable: "Aún no medibles",
      notMeasurableSubtitle:
        "Intervenciones resueltas sin comparación académica suficiente",

      measurableResolved:
        "Resueltas medibles",

      neutralEvolution:
        "Sin cambios medibles",

      negativeEvolution:
        "Evolución negativa",

      unavailable: "—",
      loading: "Cargando indicadores...",
      error:
        "No se pudieron cargar los indicadores de las intervenciones.",
    },
  },

  "fr-FR": {
    dashboard: {
      title: "Suivi des interventions",
      description:
        "Suivez l'avancement et l'efficacité des actions réalisées auprès des étudiants.",

      total: "Total des interventions",
      open: "Interventions ouvertes",
      awaitingResponse: "En attente de réponse",
      inProgress: "En cours de suivi",
      resolved: "Résolues",

      effectivenessTitle: "Efficacité des interventions",
      effectivenessDescription:
        "Indicateurs calculés uniquement à partir d'interventions et de données académiques réelles.",

      positiveEvolution: "Évolution positive",
      positiveEvolutionSubtitle:
        "{count} interventions mesurables",

      averageResolutionTime: "Temps moyen de résolution",
      days: "{value} jours",

      studentsWorsened: "Étudiants en difficulté accrue",
      studentsWorsenedSubtitle:
        "Étudiants distincts après intervention",

      notMeasurable: "Pas encore mesurables",
      notMeasurableSubtitle:
        "Interventions résolues sans comparaison académique suffisante",

      measurableResolved:
        "Résolues mesurables",

      neutralEvolution:
        "Aucun changement mesurable",

      negativeEvolution:
        "Évolution négative",

      unavailable: "—",
      loading: "Chargement des indicateurs...",
      error:
        "Impossible de charger les indicateurs des interventions.",
    },
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

  intervention.dashboard =
    valores.dashboard;

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
  "\n✅ Traduções do painel de efetividade concluídas."
);