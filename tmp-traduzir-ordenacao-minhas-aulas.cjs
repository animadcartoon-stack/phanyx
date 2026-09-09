const fs = require("fs");

const traducoes = {
  "pt-BR": {
    label: "Ordenar por",
    lessonAsc: "Ordem da aula — crescente",
    lessonDesc: "Ordem da aula — decrescente",
    alphabeticalAsc: "Ordem alfabética — A → Z",
    alphabeticalDesc: "Ordem alfabética — Z → A",
    newest: "Ordem de postagem — mais recentes",
    oldest: "Ordem de postagem — mais antigas"
  },

  "pt-PT": {
    label: "Ordenar por",
    lessonAsc: "Ordem da aula — crescente",
    lessonDesc: "Ordem da aula — decrescente",
    alphabeticalAsc: "Ordem alfabética — A → Z",
    alphabeticalDesc: "Ordem alfabética — Z → A",
    newest: "Ordem de publicação — mais recentes",
    oldest: "Ordem de publicação — mais antigas"
  },

  "en-US": {
    label: "Sort by",
    lessonAsc: "Lesson order — ascending",
    lessonDesc: "Lesson order — descending",
    alphabeticalAsc: "Alphabetical — A → Z",
    alphabeticalDesc: "Alphabetical — Z → A",
    newest: "Posting order — newest first",
    oldest: "Posting order — oldest first"
  },

  "es-ES": {
    label: "Ordenar por",
    lessonAsc: "Orden de la clase — ascendente",
    lessonDesc: "Orden de la clase — descendente",
    alphabeticalAsc: "Orden alfabético — A → Z",
    alphabeticalDesc: "Orden alfabético — Z → A",
    newest: "Orden de publicación — más recientes",
    oldest: "Orden de publicación — más antiguas"
  },

  "fr-FR": {
    label: "Trier par",
    lessonAsc: "Ordre du cours — croissant",
    lessonDesc: "Ordre du cours — décroissant",
    alphabeticalAsc: "Ordre alphabétique — A → Z",
    alphabeticalDesc: "Ordre alphabétique — Z → A",
    newest: "Ordre de publication — plus récentes",
    oldest: "Ordre de publication — plus anciennes"
  }
};

for (const [locale, sort] of Object.entries(traducoes)) {
  const arquivo = `messages/${locale}.json`;

  const json = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  if (!json.ProfessorLessons) {
    throw new Error(
      `Namespace ProfessorLessons não encontrado em ${arquivo}`
    );
  }

  json.ProfessorLessons.sort = sort;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`OK: ${arquivo}`);
}
