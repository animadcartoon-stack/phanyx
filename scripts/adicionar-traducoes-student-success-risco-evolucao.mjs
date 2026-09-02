import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    score: "Pontuação de risco",
    riskImproved: "Nível de risco melhorou",
    riskIncreased: "Nível de risco aumentou",
    scoreReduced: "Pontuação de risco reduziu",
    scoreIncreased: "Pontuação de risco aumentou",
  },

  "pt-PT": {
    score: "Pontuação de risco",
    riskImproved: "O nível de risco melhorou",
    riskIncreased: "O nível de risco aumentou",
    scoreReduced: "A pontuação de risco diminuiu",
    scoreIncreased: "A pontuação de risco aumentou",
  },

  "en-US": {
    score: "Risk score",
    riskImproved: "Risk level improved",
    riskIncreased: "Risk level increased",
    scoreReduced: "Risk score decreased",
    scoreIncreased: "Risk score increased",
  },

  "es-ES": {
    score: "Puntuación de riesgo",
    riskImproved: "El nivel de riesgo mejoró",
    riskIncreased: "El nivel de riesgo aumentó",
    scoreReduced: "La puntuación de riesgo disminuyó",
    scoreIncreased: "La puntuación de riesgo aumentó",
  },

  "fr-FR": {
    score: "Score de risque",
    riskImproved: "Le niveau de risque s'est amélioré",
    riskIncreased: "Le niveau de risque a augmenté",
    scoreReduced: "Le score de risque a diminué",
    scoreIncreased: "Le score de risque a augmenté",
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

  const comparison =
    json
      ?.AdminStudentSuccess
      ?.intervention
      ?.comparison;

  if (!comparison) {
    throw new Error(
      `AdminStudentSuccess.intervention.comparison não encontrado em ${locale}.json`
    );
  }

  Object.assign(
    comparison,
    valores
  );

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
  "\n✅ Traduções da evolução de risco concluídas."
);