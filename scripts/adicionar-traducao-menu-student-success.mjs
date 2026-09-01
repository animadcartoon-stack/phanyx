import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": "Student Success",
  "pt-PT": "Student Success",
  "en-US": "Student Success",
  "es-ES": "Student Success",
  "fr-FR": "Student Success",
};

for (
  const [locale, texto] of
  Object.entries(traducoes)
) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(
      arquivo,
      "utf8"
    )
  );

  json.AdminNavigation = {
    ...(json.AdminNavigation ?? {}),
    studentSuccess: texto,
  };

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
    `✅ ${locale}`
  );
}

console.log(
  "\n✅ Student Success adicionado ao menu internacionalizado."
);