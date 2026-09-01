import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": "Atividades externas",
  "pt-PT": "Atividades externas",
  "en-US": "External activities",
  "es-ES": "Actividades externas",
  "fr-FR": "Activités extérieures",
};

for (const [locale, traducao] of Object.entries(traducoes)) {
  const arquivo = path.resolve(
    process.cwd(),
    `messages/${locale}.json`
  );

  const original = fs.readFileSync(arquivo, "utf8");

  // Confirma que o arquivo continua sendo JSON válido antes de mexer.
  const dados = JSON.parse(original);

  if (
    dados?.AdminNavigation?.externalActivities
  ) {
    console.log(
      `ℹ️ ${locale}: externalActivities já existe.`
    );
    continue;
  }

  const eol = original.includes("\r\n")
    ? "\r\n"
    : "\n";

  const marcador =
    /(\s*)"academicPublications"\s*:/;

  const encontrado = original.match(marcador);

  if (!encontrado) {
    throw new Error(
      `${locale}: chave academicPublications não encontrada.`
    );
  }

  const indentacao = encontrado[1];

  const atualizado = original.replace(
    marcador,
    `${indentacao}"externalActivities": ${JSON.stringify(
      traducao
    )},${eol}${indentacao}"academicPublications":`
  );

  JSON.parse(atualizado);

  fs.writeFileSync(
    arquivo,
    atualizado,
    "utf8"
  );

  console.log(
    `✅ ${locale}: externalActivities adicionado.`
  );
}

console.log("✅ Menu de Atividades Externas internacionalizado.");