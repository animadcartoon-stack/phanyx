import fs from "node:fs";
import path from "node:path";

const valores = {
  "pt-BR": "Programas inativos",
  "pt-PT": "Programas inativos",
  "en-US": "Inactive programs",
  "es-ES": "Programas inactivos",
  "fr-FR": "Programmes inactifs",
};

for (const [locale, valor] of Object.entries(valores)) {
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

  if (!json.AdminMobilityPrograms?.summary) {
    throw new Error(
      `AdminMobilityPrograms.summary ausente em ${locale}`
    );
  }

  json.AdminMobilityPrograms.summary.inactive =
    valor;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log(
  "✓ CARD DE PROGRAMAS INATIVOS CORRIGIDO NOS 5 IDIOMAS"
);
