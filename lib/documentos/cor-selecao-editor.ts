import type { Editor } from "@tiptap/core";

/** Converte a cor calculada pelo navegador para o HEX aceito pelo seletor. */
export function corCssParaHex(valor: string): string | null {
  const cor = valor.trim().toLowerCase();
  if (/^#[\da-f]{6}$/.test(cor)) return cor;
  if (/^#[\da-f]{3}$/.test(cor)) {
    return `#${cor.slice(1).split("").map((parte) => parte + parte).join("")}`;
  }
  const rgb = cor.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
  if (!rgb || (rgb[4] !== undefined && Number(rgb[4]) !== 1)) return null;
  const canais = rgb.slice(1, 4).map(Number);
  if (canais.some((canal) => canal < 0 || canal > 255)) return null;
  return `#${canais.map((canal) => Math.round(canal).toString(16).padStart(2, "0")).join("")}`;
}

/** Só consulta o trecho selecionado; nunca altera conteúdo nem cria histórico. */
export function obterCorTextoSelecionado(editor: Editor): string | null {
  const { state, view } = editor;
  const janela = view.dom.ownerDocument.defaultView;
  if (!janela) return null;

  function corNaPosicao(posicao: number, lado = 1): string | null {
    const ponto = view.domAtPos(posicao, lado);
    let node = ponto.node;
    if (node.nodeType === 1 && node.childNodes.length) {
      node = node.childNodes[Math.min(ponto.offset, node.childNodes.length - 1)];
    }
    const elemento = node.nodeType === 1 ? node as Element : node.parentElement;
    return elemento ? corCssParaHex(janela!.getComputedStyle(elemento).color) : null;
  }

  if (state.selection.empty) {
    // Uma cor escolhida com o cursor vazio vale para a próxima digitação,
    // antes mesmo de existir um span dessa cor no DOM.
    const marcas = state.storedMarks ?? state.selection.$from.marks();
    const marca = marcas.find((item) => item.type.name === "textStyle");
    const corPendente = marca?.attrs.color;
    if (corPendente) {
      const normalizada = corCssParaHex(corPendente);
      if (normalizada) return normalizada;
    }
    return corNaPosicao(state.selection.from, state.selection.$from.textOffset ? -1 : 1);
  }

  let primeiraCor: string | undefined;
  let coresDiferentes = false;
  // CellSelection também pode conter intervalos separados de células.
  for (const { $from, $to } of state.selection.ranges) {
    state.doc.nodesBetween($from.pos, $to.pos, (node, posicao) => {
      if (coresDiferentes) return false;
      if (!node.isText) return;
      const inicio = Math.max(posicao, $from.pos);
      if (inicio >= Math.min(posicao + node.nodeSize, $to.pos)) return;
      const cor = corNaPosicao(inicio);
      if (!cor) { coresDiferentes = true; return false; }
      if (primeiraCor === undefined) primeiraCor = cor;
      else if (cor !== primeiraCor) coresDiferentes = true;
    });
    if (coresDiferentes) break;
  }
  return coresDiferentes ? null : primeiraCor ?? corNaPosicao(state.selection.from);
}
