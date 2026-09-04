import fs from "node:fs";

const arquivos = {
  "pt-BR": "./messages/pt-BR.json",
  "pt-PT": "./messages/pt-PT.json",
  "en-US": "./messages/en-US.json",
  "es-ES": "./messages/es-ES.json",
  "fr-FR": "./messages/fr-FR.json",
};

const traducoes = {
  "pt-BR": "Atualizar painel",
  "pt-PT": "Atualizar painel",
  "en-US": "Refresh dashboard",
  "es-ES": "Actualizar panel",
  "fr-FR": "Actualiser le tableau de bord",
};

for (const [locale, caminho] of Object.entries(arquivos)) {
  const json = JSON.parse(
    fs.readFileSync(
      caminho,
      "utf8"
    )
  );

  json.AdminStudentSuccess ??= {};
  json.AdminStudentSuccess.actions ??= {};

  json.AdminStudentSuccess.actions.refreshPanel =
    traducoes[locale];

  fs.writeFileSync(
    caminho,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log(
  "\nTradução de Atualizar painel adicionada."
);