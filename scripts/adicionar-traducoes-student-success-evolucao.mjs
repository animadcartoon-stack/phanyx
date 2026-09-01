import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Evolução acadêmica",
    registration: "No registro",
    closure: "No encerramento",
    risk: "Situação",
    coverage: "Cobertura",
    attendance: "Frequência",
    performance: "Desempenho",
    pending: "Atividades pendentes",
    evolution: "Evolução",
    noMeasurableChange:
      "Sem alteração acadêmica mensurável no período.",
    coverageImproved:
      "Cobertura de dados aumentou",
    coverageReduced:
      "Cobertura de dados diminuiu",
    pendingReduced:
      "Atividades pendentes diminuíram",
    pendingIncreased:
      "Atividades pendentes aumentaram",
    attendanceImproved:
      "Frequência melhorou",
    attendanceReduced:
      "Frequência diminuiu",
    performanceImproved:
      "Desempenho melhorou",
    performanceReduced:
      "Desempenho diminuiu",
    percentagePoints: "p.p.",
  },

  "pt-PT": {
    title: "Evolução académica",
    registration: "No registo",
    closure: "No encerramento",
    risk: "Situação",
    coverage: "Cobertura",
    attendance: "Assiduidade",
    performance: "Desempenho",
    pending: "Atividades pendentes",
    evolution: "Evolução",
    noMeasurableChange:
      "Sem alteração académica mensurável no período.",
    coverageImproved:
      "A cobertura de dados aumentou",
    coverageReduced:
      "A cobertura de dados diminuiu",
    pendingReduced:
      "As atividades pendentes diminuíram",
    pendingIncreased:
      "As atividades pendentes aumentaram",
    attendanceImproved:
      "A assiduidade melhorou",
    attendanceReduced:
      "A assiduidade diminuiu",
    performanceImproved:
      "O desempenho melhorou",
    performanceReduced:
      "O desempenho diminuiu",
    percentagePoints: "p.p.",
  },

  "en-US": {
    title: "Academic progress",
    registration: "At registration",
    closure: "At closure",
    risk: "Status",
    coverage: "Data coverage",
    attendance: "Attendance",
    performance: "Performance",
    pending: "Pending activities",
    evolution: "Progress",
    noMeasurableChange:
      "No measurable academic change during this period.",
    coverageImproved:
      "Data coverage increased",
    coverageReduced:
      "Data coverage decreased",
    pendingReduced:
      "Pending activities decreased",
    pendingIncreased:
      "Pending activities increased",
    attendanceImproved:
      "Attendance improved",
    attendanceReduced:
      "Attendance decreased",
    performanceImproved:
      "Performance improved",
    performanceReduced:
      "Performance decreased",
    percentagePoints: "pp",
  },

  "es-ES": {
    title: "Evolución académica",
    registration: "Al registrar",
    closure: "Al finalizar",
    risk: "Situación",
    coverage: "Cobertura",
    attendance: "Asistencia",
    performance: "Rendimiento",
    pending: "Actividades pendientes",
    evolution: "Evolución",
    noMeasurableChange:
      "Sin cambios académicos mensurables durante el período.",
    coverageImproved:
      "La cobertura de datos aumentó",
    coverageReduced:
      "La cobertura de datos disminuyó",
    pendingReduced:
      "Las actividades pendientes disminuyeron",
    pendingIncreased:
      "Las actividades pendientes aumentaron",
    attendanceImproved:
      "La asistencia mejoró",
    attendanceReduced:
      "La asistencia disminuyó",
    performanceImproved:
      "El rendimiento mejoró",
    performanceReduced:
      "El rendimiento disminuyó",
    percentagePoints: "p.p.",
  },

  "fr-FR": {
    title: "Évolution académique",
    registration: "À l'enregistrement",
    closure: "À la clôture",
    risk: "Situation",
    coverage: "Couverture",
    attendance: "Assiduité",
    performance: "Performance",
    pending: "Activités en attente",
    evolution: "Évolution",
    noMeasurableChange:
      "Aucun changement académique mesurable sur cette période.",
    coverageImproved:
      "La couverture des données a augmenté",
    coverageReduced:
      "La couverture des données a diminué",
    pendingReduced:
      "Les activités en attente ont diminué",
    pendingIncreased:
      "Les activités en attente ont augmenté",
    attendanceImproved:
      "L'assiduité s'est améliorée",
    attendanceReduced:
      "L'assiduité a diminué",
    performanceImproved:
      "La performance s'est améliorée",
    performanceReduced:
      "La performance a diminué",
    percentagePoints: "pts",
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
    comparison,
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

  intervention.comparison =
    comparison;

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
  "\n✅ Traduções da evolução acadêmica concluídas."
);