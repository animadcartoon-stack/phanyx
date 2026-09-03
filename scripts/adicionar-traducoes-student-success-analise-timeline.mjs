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
    summaryAnalyses: "Análises",
    academicInitial: "Análise acadêmica inicial",
    academicManual: "Reanálise acadêmica manual",
    academicAutomatic: "Reanálise acadêmica automática",
    academicChange: "Reanálise após alteração acadêmica",
    academicAnalysis: "Análise acadêmica",
    academicIndicators: "Indicadores acadêmicos",
    classesAnalyzed: "Aulas analisadas",
    assessmentsAnalyzed: "Avaliações analisadas",
    pendingActivities: "Atividades vencidas",
    mainSignals: "Principais sinais",
    pendingSignal:
      "{count, plural, =0 {Nenhuma atividade vencida sem entrega} one {# atividade vencida sem entrega} other {# atividades vencidas sem entrega}}",
    executedBy: "Executada por",
  },

  "pt-PT": {
    summaryAnalyses: "Análises",
    academicInitial: "Análise académica inicial",
    academicManual: "Reanálise académica manual",
    academicAutomatic: "Reanálise académica automática",
    academicChange: "Reanálise após alteração académica",
    academicAnalysis: "Análise académica",
    academicIndicators: "Indicadores académicos",
    classesAnalyzed: "Aulas analisadas",
    assessmentsAnalyzed: "Avaliações analisadas",
    pendingActivities: "Atividades vencidas",
    mainSignals: "Principais sinais",
    pendingSignal:
      "{count, plural, =0 {Nenhuma atividade vencida sem entrega} one {# atividade vencida sem entrega} other {# atividades vencidas sem entrega}}",
    executedBy: "Executada por",
  },

  "en-US": {
    summaryAnalyses: "Analyses",
    academicInitial: "Initial academic analysis",
    academicManual: "Manual academic reanalysis",
    academicAutomatic: "Automatic academic reanalysis",
    academicChange: "Reanalysis after academic change",
    academicAnalysis: "Academic analysis",
    academicIndicators: "Academic indicators",
    classesAnalyzed: "Classes analyzed",
    assessmentsAnalyzed: "Assessments analyzed",
    pendingActivities: "Overdue activities",
    mainSignals: "Main signals",
    pendingSignal:
      "{count, plural, =0 {No overdue activity without submission} one {# overdue activity without submission} other {# overdue activities without submission}}",
    executedBy: "Performed by",
  },

  "es-ES": {
    summaryAnalyses: "Análisis",
    academicInitial: "Análisis académico inicial",
    academicManual: "Reanálisis académico manual",
    academicAutomatic: "Reanálisis académico automático",
    academicChange: "Reanálisis tras un cambio académico",
    academicAnalysis: "Análisis académico",
    academicIndicators: "Indicadores académicos",
    classesAnalyzed: "Clases analizadas",
    assessmentsAnalyzed: "Evaluaciones analizadas",
    pendingActivities: "Actividades vencidas",
    mainSignals: "Señales principales",
    pendingSignal:
      "{count, plural, =0 {Ninguna actividad vencida sin entrega} one {# actividad vencida sin entrega} other {# actividades vencidas sin entrega}}",
    executedBy: "Realizado por",
  },

  "fr-FR": {
    summaryAnalyses: "Analyses",
    academicInitial: "Analyse académique initiale",
    academicManual: "Réanalyse académique manuelle",
    academicAutomatic: "Réanalyse académique automatique",
    academicChange: "Réanalyse après une modification académique",
    academicAnalysis: "Analyse académique",
    academicIndicators: "Indicateurs académiques",
    classesAnalyzed: "Cours analysés",
    assessmentsAnalyzed: "Évaluations analysées",
    pendingActivities: "Activités en retard",
    mainSignals: "Signaux principaux",
    pendingSignal:
      "{count, plural, =0 {Aucune activité en retard sans remise} one {# activité en retard sans remise} other {# activités en retard sans remise}}",
    executedBy: "Effectuée par",
  },
};

for (
  const [locale, caminho]
  of Object.entries(arquivos)
) {
  const json =
    JSON.parse(
      fs.readFileSync(
        caminho,
        "utf8"
      )
    );

  json.AdminStudentSuccess ??= {};
  json.AdminStudentSuccess.intervention ??= {};
  json.AdminStudentSuccess.intervention.timeline ??= {};

  Object.assign(
    json.AdminStudentSuccess.intervention.timeline,
    traducoes[locale]
  );

  fs.writeFileSync(
    caminho,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `✓ ${locale}`
  );
}

console.log(
  "\nTraduções da análise acadêmica adicionadas."
);