const rotulos = {
  pt: {
    texto: "Editar texto do PDF", cor: "Cor do texto", retoque: "Substituir área por texto",
    selecionar: "Arraste sobre o texto que deseja editar. O trecho aparece na caixa abaixo.",
    pronto: "Edite o texto, escolha outra cor se quiser e aplique na página.",
    textoSelecionado: "Texto selecionado",
    semTexto: "Não encontrei texto editável na área. Selecione outro trecho ou use Substituir área por texto para páginas que são imagens.",
    parcial: "A seleção corta um bloco de texto. Amplie a seleção para incluir o bloco inteiro.",
    naoCabe: "O texto ultrapassa o espaço disponível nesta linha.",
    linhas: "Use até o mesmo número de linhas do trecho selecionado.",
    fonte: "A fonte disponível para este trecho não suporta alguns caracteres.",
  },
  en: {
    texto: "Edit PDF text", cor: "Text color", retoque: "Replace area with text",
    selecionar: "Drag over the text you want to edit. The selection appears in the box below.",
    pronto: "Edit the text, change its color if you like, then apply it to the page.",
    textoSelecionado: "Selected text",
    semTexto: "No editable text was found in this area. Select another area or use Replace area with text for image pages.",
    parcial: "The selection cuts through a text block. Expand the selection to include the full block.",
    naoCabe: "The text exceeds the space available on this line.",
    linhas: "Use no more than the number of lines in the selected text.",
    fonte: "The font available for this text does not support some characters.",
  },
  es: {
    texto: "Editar texto del PDF", cor: "Color del texto", retoque: "Sustituir área por texto",
    selecionar: "Arrastra sobre el texto que quieres editar. El fragmento aparece en el cuadro de abajo.",
    pronto: "Edita el texto, cambia el color si quieres y aplica los cambios en la página.",
    textoSelecionado: "Texto seleccionado",
    semTexto: "No hay texto editable en el área. Selecciona otro fragmento o usa Sustituir área por texto en páginas que son imágenes.",
    parcial: "La selección corta un bloque de texto. Amplíala para incluir el bloque completo.",
    naoCabe: "El texto supera el espacio disponible en esta línea.",
    linhas: "Usa como máximo el mismo número de líneas del fragmento seleccionado.",
    fonte: "La fuente disponible para este fragmento no admite algunos caracteres.",
  },
  fr: {
    texto: "Modifier le texte du PDF", cor: "Couleur du texte", retoque: "Remplacer une zone par du texte",
    selecionar: "Faites glisser le pointeur sur le texte à modifier. La sélection apparaît dans le champ ci-dessous.",
    pronto: "Modifiez le texte et sa couleur, puis appliquez les changements sur la page.",
    textoSelecionado: "Texte sélectionné",
    semTexto: "Aucun texte modifiable dans la zone. Sélectionnez un autre passage ou utilisez Remplacer une zone par du texte pour les pages sous forme d’image.",
    parcial: "La sélection coupe un bloc de texte. Agrandissez-la pour inclure le bloc entier.",
    naoCabe: "Le texte dépasse l’espace disponible sur cette ligne.",
    linhas: "Utilisez au maximum le même nombre de lignes que le texte sélectionné.",
    fonte: "La police disponible pour ce passage ne prend pas en charge certains caractères.",
  },
};

export function textosEdicaoNativaPdf(locale: string) {
  return rotulos[locale.split("-")[0] as keyof typeof rotulos] ?? rotulos.pt;
}
