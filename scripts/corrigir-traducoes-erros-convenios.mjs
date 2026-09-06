import fs from "node:fs";
import path from "node:path";

const valores = {
  "pt-BR": [
    "Não foi possível carregar os convênios.",
    "Não foi possível salvar o convênio."
  ],
  "pt-PT": [
    "Não foi possível carregar os protocolos.",
    "Não foi possível guardar o protocolo."
  ],
  "en-US": [
    "Agreements could not be loaded.",
    "The agreement could not be saved."
  ],
  "es-ES": [
    "No se pudieron cargar los convenios.",
    "No se pudo guardar el convenio."
  ],
  "fr-FR": [
    "Impossible de charger les accords.",
    "Impossible d'enregistrer l'accord."
  ]
};

for (const [locale, [load, save]] of Object.entries(valores)) {
  const arquivo = path.resolve("messages", `${locale}.json`);
  const json = JSON.parse(fs.readFileSync(arquivo, "utf8"));

  json.AdminMobilityAgreements.errors.load = load;
  json.AdminMobilityAgreements.errors.save = save;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}
