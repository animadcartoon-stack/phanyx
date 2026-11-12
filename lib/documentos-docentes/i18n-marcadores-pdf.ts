const rotulos = {
  pt: {
    marcaTexto: "Marca-texto",
    selecione: "Escolha uma cor e selecione o trecho. Os destaques ficam nesta visualização.",
    semTexto: "Esta página não tem texto selecionável.",
    desfazer: "Desfazer último destaque da página",
    cores: ["Laranja", "Azul-celeste", "Roxo", "Vermelho", "Verde-lima", "Turquesa"],
  },
  en: {
    marcaTexto: "Highlighter",
    selecione: "Choose a color and select the passage. Highlights stay in this view.",
    semTexto: "This page has no selectable text.",
    desfazer: "Undo last highlight on this page",
    cores: ["Orange", "Sky blue", "Purple", "Red", "Lime", "Turquoise"],
  },
  es: {
    marcaTexto: "Resaltador",
    selecione: "Elige un color y selecciona el fragmento. Los resaltados se mantienen en esta vista.",
    semTexto: "Esta página no tiene texto seleccionable.",
    desfazer: "Deshacer el último resaltado de esta página",
    cores: ["Naranja", "Azul celeste", "Morado", "Rojo", "Verde lima", "Turquesa"],
  },
  fr: {
    marcaTexto: "Surligneur",
    selecione: "Choisissez une couleur et sélectionnez le passage. Les surlignages restent dans cette vue.",
    semTexto: "Cette page ne contient aucun texte sélectionnable.",
    desfazer: "Annuler le dernier surlignage de cette page",
    cores: ["Orange", "Bleu ciel", "Violet", "Rouge", "Vert citron", "Turquoise"],
  },
};

export function textosMarcadoresPdf(locale: string) {
  return rotulos[locale.split("-")[0] as keyof typeof rotulos] ?? rotulos.pt;
}
