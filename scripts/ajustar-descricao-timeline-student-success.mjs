import fs from "node:fs";

const arquivos = {
  "pt-BR": "./messages/pt-BR.json",
  "pt-PT": "./messages/pt-PT.json",
  "en-US": "./messages/en-US.json",
  "es-ES": "./messages/es-ES.json",
  "fr-FR": "./messages/fr-FR.json",
};

const descricoes = {
  "pt-BR":
    "Acompanhe cronologicamente as análises acadêmicas, intervenções, retornos programados e encerramentos registrados.",

  "pt-PT":
    "Acompanhe cronologicamente as análises académicas, intervenções, retornos programados e encerramentos registados.",

  "en-US":
    "Follow academic analyses, interventions, scheduled follow-ups, and recorded closures chronologically.",

  "es-ES":
    "Siga cronológicamente los análisis académicos, las intervenciones, los seguimientos programados y los cierres registrados.",

  "fr-FR":
    "Suivez chronologiquement les analyses académiques, les interventions, les suivis programmés et les clôtures enregistrées.",
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

  json.AdminStudentSuccess.intervention.timeline.description =
    descricoes[locale];

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
  "\nDescrição da timeline atualizada."
);