const fs = require("fs");

const traducoes = {
  "pt-BR": {
    label: "Visualização",
    cards: "Cards",
    list: "Lista"
  },

  "pt-PT": {
    label: "Visualização",
    cards: "Cartões",
    list: "Lista"
  },

  "en-US": {
    label: "View",
    cards: "Cards",
    list: "List"
  },

  "es-ES": {
    label: "Vista",
    cards: "Tarjetas",
    list: "Lista"
  },

  "fr-FR": {
    label: "Affichage",
    cards: "Cartes",
    list: "Liste"
  }
};

for (const [locale, view] of Object.entries(traducoes)) {
  const path = `messages/${locale}.json`;

  const json = JSON.parse(
    fs.readFileSync(path, "utf8")
  );

  if (!json.ProfessorLessons) {
    throw new Error(
      `ProfessorLessons não encontrado em ${path}`
    );
  }

  json.ProfessorLessons.view = view;

  fs.writeFileSync(
    path,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`OK: ${path}`);
}
