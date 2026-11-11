const textos = {
  pt: {
    pagina: "Configuração da página", modelo: "Papel timbrado", primeira: "Primeira página", igual: "Igual às demais",
    branco: "Sem timbrado", classico: "Clássico", central: "Centralizado", faixa: "Faixa institucional", discreto: "Discreto", marca: "Marca d’água",
    fundo: "Cor do papel", padrao: "Cor do modelo", margens: "Margens (cm)", superior: "Superior", direita: "Direita", inferior: "Inferior", esquerda: "Esquerda",
    reguas: "Réguas em centímetros", borda: "Espessura da borda (px)", linha: "Altura da linha (px)", tabela: "Largura da tabela (%)", coluna: "Largura da coluna (px)",
  },
  en: {
    pagina: "Page setup", modelo: "Letterhead", primeira: "First page", igual: "Same as other pages",
    branco: "No letterhead", classico: "Classic", central: "Centered", faixa: "Institutional banner", discreto: "Minimal", marca: "Watermark",
    fundo: "Paper color", padrao: "Template color", margens: "Margins (cm)", superior: "Top", direita: "Right", inferior: "Bottom", esquerda: "Left",
    reguas: "Rulers in centimeters", borda: "Border thickness (px)", linha: "Row height (px)", tabela: "Table width (%)", coluna: "Column width (px)",
  },
  es: {
    pagina: "Configurar página", modelo: "Membrete", primeira: "Primera página", igual: "Igual a las demás",
    branco: "Sin membrete", classico: "Clásico", central: "Centrado", faixa: "Franja institucional", discreto: "Discreto", marca: "Marca de agua",
    fundo: "Color del papel", padrao: "Color de la plantilla", margens: "Márgenes (cm)", superior: "Superior", direita: "Derecha", inferior: "Inferior", esquerda: "Izquierda",
    reguas: "Reglas en centímetros", borda: "Grosor del borde (px)", linha: "Altura de fila (px)", tabela: "Ancho de tabla (%)", coluna: "Ancho de columna (px)",
  },
  fr: {
    pagina: "Mise en page", modelo: "Papier à en-tête", primeira: "Première page", igual: "Identique aux autres",
    branco: "Sans en-tête", classico: "Classique", central: "Centré", faixa: "Bandeau institutionnel", discreto: "Discret", marca: "Filigrane",
    fundo: "Couleur du papier", padrao: "Couleur du modèle", margens: "Marges (cm)", superior: "Haut", direita: "Droite", inferior: "Bas", esquerda: "Gauche",
    reguas: "Règles en centimètres", borda: "Épaisseur de bordure (px)", linha: "Hauteur de ligne (px)", tabela: "Largeur du tableau (%)", coluna: "Largeur de colonne (px)",
  },
};

export function textosPapelTextoPdf(locale: string) {
  return textos[locale.split("-")[0] as keyof typeof textos] ?? textos.pt;
}
