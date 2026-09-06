import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": "Mobilidade Internacional",
  "pt-PT": "Mobilidade Internacional",
  "en-US": "International Mobility",
  "es-ES": "Movilidad Internacional",
  "fr-FR": "Mobilité Internationale",
};

for (const [locale, valor] of Object.entries(traducoes)) {
  const arquivo = path.resolve(
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  if (!json.AdminNavigation) {
    throw new Error(
      `AdminNavigation não encontrado em ${locale}`
    );
  }

  json.AdminNavigation.internationalMobility = valor;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log("✓ MENU DE MOBILIDADE TRADUZIDO NOS 5 IDIOMAS");
