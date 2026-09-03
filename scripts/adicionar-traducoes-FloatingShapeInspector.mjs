import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();

const arquivos = {
  "pt-BR": path.join(raiz, "messages", "pt-BR.json"),
  "pt-PT": path.join(raiz, "messages", "pt-PT.json"),
  "en-US": path.join(raiz, "messages", "en-US.json"),
  "es-ES": path.join(raiz, "messages", "es-ES.json"),
  "fr-FR": path.join(raiz, "messages", "fr-FR.json"),
};

const traducoes = {
  "pt-BR": {
    title: "Opções da forma",
    showHidePoints: "Mostrar / ocultar pontos de edição",
    arrayMultiply: "Array / multiplicar",
    type: "Tipo",
    flipShape: "Virar forma",
    horizontal: "Horizontal",
    vertical: "Vertical",
    flipHorizontalTitle: "Virar horizontalmente",
    flipVerticalTitle: "Virar verticalmente",
    cornerAll: "Todos",
    cornerTop: "Só cima",
    cornerBottom: "Só baixo",
    cornerLeft: "Só esquerda",
    cornerRight: "Só direita",
    cornerSharp: "Pontudo",
    starPoints: "Quantidade de pontas",
    outerRadius: "Raio externo / tamanho das pontas",
    innerRadius: "Raio interno / profundidade",
    innerRounding: "Arredondamento interno",
    tipRounding: "Arredondamento das pontas",
  },

  "pt-PT": {
    title: "Opções da forma",
    showHidePoints: "Mostrar / ocultar pontos de edição",
    arrayMultiply: "Array / multiplicar",
    type: "Tipo",
    flipShape: "Virar forma",
    horizontal: "Horizontal",
    vertical: "Vertical",
    flipHorizontalTitle: "Virar horizontalmente",
    flipVerticalTitle: "Virar verticalmente",
    cornerAll: "Todos",
    cornerTop: "Apenas em cima",
    cornerBottom: "Apenas em baixo",
    cornerLeft: "Apenas à esquerda",
    cornerRight: "Apenas à direita",
    cornerSharp: "Pontiagudo",
    starPoints: "Número de pontas",
    outerRadius: "Raio externo / tamanho das pontas",
    innerRadius: "Raio interno / profundidade",
    innerRounding: "Arredondamento interior",
    tipRounding: "Arredondamento das pontas",
  },

  "en-US": {
    title: "Shape options",
    showHidePoints: "Show / hide edit points",
    arrayMultiply: "Array / multiply",
    type: "Type",
    flipShape: "Flip shape",
    horizontal: "Horizontal",
    vertical: "Vertical",
    flipHorizontalTitle: "Flip horizontally",
    flipVerticalTitle: "Flip vertically",
    cornerAll: "All",
    cornerTop: "Top only",
    cornerBottom: "Bottom only",
    cornerLeft: "Left only",
    cornerRight: "Right only",
    cornerSharp: "Sharp",
    starPoints: "Number of points",
    outerRadius: "Outer radius / point size",
    innerRadius: "Inner radius / depth",
    innerRounding: "Inner rounding",
    tipRounding: "Point rounding",
  },

  "es-ES": {
    title: "Opciones de la forma",
    showHidePoints: "Mostrar / ocultar puntos de edición",
    arrayMultiply: "Array / multiplicar",
    type: "Tipo",
    flipShape: "Voltear forma",
    horizontal: "Horizontal",
    vertical: "Vertical",
    flipHorizontalTitle: "Voltear horizontalmente",
    flipVerticalTitle: "Voltear verticalmente",
    cornerAll: "Todos",
    cornerTop: "Solo arriba",
    cornerBottom: "Solo abajo",
    cornerLeft: "Solo izquierda",
    cornerRight: "Solo derecha",
    cornerSharp: "Puntiagudo",
    starPoints: "Cantidad de puntas",
    outerRadius: "Radio exterior / tamaño de las puntas",
    innerRadius: "Radio interior / profundidad",
    innerRounding: "Redondeo interior",
    tipRounding: "Redondeo de las puntas",
  },

  "fr-FR": {
    title: "Options de la forme",
    showHidePoints: "Afficher / masquer les points d’édition",
    arrayMultiply: "Réseau / multiplier",
    type: "Type",
    flipShape: "Retourner la forme",
    horizontal: "Horizontal",
    vertical: "Vertical",
    flipHorizontalTitle: "Retourner horizontalement",
    flipVerticalTitle: "Retourner verticalement",
    cornerAll: "Tous",
    cornerTop: "Haut seulement",
    cornerBottom: "Bas seulement",
    cornerLeft: "Gauche seulement",
    cornerRight: "Droite seulement",
    cornerSharp: "Angle vif",
    starPoints: "Nombre de pointes",
    outerRadius: "Rayon externe / taille des pointes",
    innerRadius: "Rayon interne / profondeur",
    innerRounding: "Arrondi intérieur",
    tipRounding: "Arrondi des pointes",
  },
};

for (const [locale, arquivo] of Object.entries(arquivos)) {
  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const json = JSON.parse(fs.readFileSync(arquivo, "utf8"));

  json.AdminCertificateEditor ??= {};
  json.AdminCertificateEditor.shapeInspector ??= {};

  Object.assign(
    json.AdminCertificateEditor.shapeInspector,
    traducoes[locale],
  );

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8",
  );

  console.log(`OK: ${locale}`);
}

console.log(
  "Traduções do FloatingShapeInspector atualizadas.",
);
