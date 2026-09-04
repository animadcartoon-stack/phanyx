import fs from "node:fs";

const arquivos = {
  "pt-BR": "./messages/pt-BR.json",
  "pt-PT": "./messages/pt-PT.json",
  "en-US": "./messages/en-US.json",
  "es-ES": "./messages/es-ES.json",
  "fr-FR": "./messages/fr-FR.json",
};

const traducoes = {
  "pt-BR": {
    comparisonTitle: "Evolução desde a análise anterior",
    previousAnalysis: "Análise anterior",
    currentAnalysis: "Análise atual",
    riskEvolution: "Evolução do risco",
    scoreEvolution: "Pontuação",
    attendanceEvolution: "Frequência",
    performanceEvolution: "Desempenho",
    pendingEvolution: "Atividades vencidas",
    improved: "Evolução positiva",
    worsened: "Piora observada",
    stable: "Situação estável",
    notMeasurable: "Evolução ainda não mensurável",
  },

  "pt-PT": {
    comparisonTitle: "Evolução desde a análise anterior",
    previousAnalysis: "Análise anterior",
    currentAnalysis: "Análise atual",
    riskEvolution: "Evolução do risco",
    scoreEvolution: "Pontuação",
    attendanceEvolution: "Frequência",
    performanceEvolution: "Desempenho",
    pendingEvolution: "Atividades vencidas",
    improved: "Evolução positiva",
    worsened: "Piora observada",
    stable: "Situação estável",
    notMeasurable: "Evolução ainda não mensurável",
  },

  "en-US": {
    comparisonTitle: "Evolution since the previous analysis",
    previousAnalysis: "Previous analysis",
    currentAnalysis: "Current analysis",
    riskEvolution: "Risk evolution",
    scoreEvolution: "Score",
    attendanceEvolution: "Attendance",
    performanceEvolution: "Performance",
    pendingEvolution: "Overdue activities",
    improved: "Positive evolution",
    worsened: "Worsening observed",
    stable: "Stable situation",
    notMeasurable: "Evolution not yet measurable",
  },

  "es-ES": {
    comparisonTitle: "Evolución desde el análisis anterior",
    previousAnalysis: "Análisis anterior",
    currentAnalysis: "Análisis actual",
    riskEvolution: "Evolución del riesgo",
    scoreEvolution: "Puntuación",
    attendanceEvolution: "Asistencia",
    performanceEvolution: "Rendimiento",
    pendingEvolution: "Actividades vencidas",
    improved: "Evolución positiva",
    worsened: "Empeoramiento observado",
    stable: "Situación estable",
    notMeasurable: "Evolución aún no medible",
  },

  "fr-FR": {
    comparisonTitle: "Évolution depuis l’analyse précédente",
    previousAnalysis: "Analyse précédente",
    currentAnalysis: "Analyse actuelle",
    riskEvolution: "Évolution du risque",
    scoreEvolution: "Score",
    attendanceEvolution: "Assiduité",
    performanceEvolution: "Performance",
    pendingEvolution: "Activités en retard",
    improved: "Évolution positive",
    worsened: "Dégradation observée",
    stable: "Situation stable",
    notMeasurable: "Évolution pas encore mesurable",
  },
};

for (const [locale, caminho] of Object.entries(arquivos)) {
  const json = JSON.parse(
    fs.readFileSync(
      caminho,
      "utf8"
    )
  );

  json.AdminStudentSuccess ??= {};
  json.AdminStudentSuccess.intervention ??= {};
  json.AdminStudentSuccess.intervention.timeline ??= {};
  json.AdminStudentSuccess.intervention.timeline.analysisEvolution ??= {};

  Object.assign(
    json.AdminStudentSuccess.intervention.timeline.analysisEvolution,
    traducoes[locale]
  );

  fs.writeFileSync(
    caminho,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log(
  "\nTraduções da evolução entre análises adicionadas."
);