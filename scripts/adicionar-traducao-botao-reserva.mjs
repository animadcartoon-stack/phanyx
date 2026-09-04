import fs from "node:fs";

const traducoes = {
  "pt-BR": {
    reservationAction:
      "Reservar",
  },

  "pt-PT": {
    reservationAction:
      "Reservar",
  },

  "en-US": {
    reservationAction:
      "Reserve",
  },

  "es-ES": {
    reservationAction:
      "Reservar",
  },

  "fr-FR": {
    reservationAction:
      "Réserver",
  },
};

for (
  const [locale, novas] of
  Object.entries(traducoes)
) {
  const arquivo =
    `messages/${locale}.json`;

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  if (!json.AdminLibraryItemUi) {
    throw new Error(
      `Namespace AdminLibraryItemUi não encontrado em ${arquivo}`
    );
  }

  Object.assign(
    json.AdminLibraryItemUi,
    novas
  );

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${locale}`
  );
}