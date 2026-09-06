import fs from "node:fs";
import path from "node:path";

const locales = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
];

for (const locale of locales) {
  const arquivo = path.resolve(
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(
      arquivo,
      "utf8"
    )
  );

  console.log("");
  console.log(
    `=== ${locale} ===`
  );

  console.log(
    "AdminMobilityPrograms:",
    Boolean(
      json.AdminMobilityPrograms
    )
  );

  console.log(
    "title:",
    json.AdminMobilityPrograms
      ?.title ?? "AUSENTE"
  );

  console.log(
    "actions.new:",
    json.AdminMobilityPrograms
      ?.actions?.new ??
      "AUSENTE"
  );

  console.log(
    "navigation:",
    json.AdminNavigation
      ?.mobilityPrograms ??
      "AUSENTE"
  );
}
