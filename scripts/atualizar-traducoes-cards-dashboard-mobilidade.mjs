import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    available: "Disponível",
    description:
      "Acesse as principais áreas da Mobilidade Internacional."
  },

  "pt-PT": {
    available: "Disponível",
    description:
      "Aceda às principais áreas da Mobilidade Internacional."
  },

  "en-US": {
    available: "Available",
    description:
      "Access the main areas of International Mobility."
  },

  "es-ES": {
    available: "Disponible",
    description:
      "Accede a las principales áreas de Movilidad Internacional."
  },

  "fr-FR": {
    available: "Disponible",
    description:
      "Accédez aux principaux espaces de la Mobilité Internationale."
  },
};

for (
  const [
    locale,
    valores,
  ] of Object.entries(
    traducoes
  )
) {
  const arquivo =
    path.resolve(
      "messages",
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  if (
    !json.AdminMobilityDashboard
  ) {
    throw new Error(
      `AdminMobilityDashboard ausente em ${locale}`
    );
  }

  json.AdminMobilityDashboard.actions ??=
    {};

  json.AdminMobilityDashboard.sections ??=
    {};

  json.AdminMobilityDashboard.actions.available =
    valores.available;

  json.AdminMobilityDashboard.sections.quickActionsDescription =
    valores.description;

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

console.log("");
console.log(
  "✓ CARDS DISPONÍVEIS INTERNACIONALIZADOS NOS 5 IDIOMAS"
);
