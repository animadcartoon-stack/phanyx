import { closeHistory } from "@tiptap/pm/history";
import type { EditorState } from "@tiptap/pm/state";

const somenteEspacos = /^[\s\u200b\ufeff]*$/u;

export function limparFimModelo(state: EditorState) {
  const { doc } = state;
  const fim = doc.content.size;
  let inicioBlocosVazios = fim;
  let quebrasFinais: { de: number; ate: number } | undefined;

  for (let i = doc.childCount - 1; i >= 0; i--) {
    const bloco = doc.child(i);
    const inicioBloco = inicioBlocosVazios - bloco.nodeSize;
    if (bloco.type.name === "pageBreak") {
      inicioBlocosVazios = inicioBloco;
      continue;
    }
    if (bloco.type.name !== "paragraph") break;

    let inicioEspacos = bloco.content.size;
    let inicioQuebras = inicioEspacos;
    for (let j = bloco.childCount - 1; j >= 0; j--) {
      const inline = bloco.child(j);
      const quebra = inline.type.name === "hardBreak";
      if (!quebra && !(inline.isText && somenteEspacos.test(inline.text || ""))) break;
      inicioEspacos -= inline.nodeSize;
      if (quebra) inicioQuebras = inicioEspacos;
    }
    if (inicioEspacos === 0) {
      inicioBlocosVazios = inicioBloco;
      continue;
    }
    if (inicioQuebras < bloco.content.size) {
      quebrasFinais = { de: inicioBloco + 1 + inicioQuebras, ate: inicioBlocosVazios - 1 };
    }
    break;
  }

  if (inicioBlocosVazios === fim && !quebrasFinais) return null;

  if (inicioBlocosVazios === 0) {
    const primeiro = doc.firstChild;
    const paragrafo = doc.type.schema.nodes.paragraph.create(
      primeiro?.type.name === "paragraph" ? primeiro.attrs : null
    );
    if (doc.childCount === 1 && primeiro?.eq(paragrafo)) return null;
    return closeHistory(state.tr.replaceWith(0, fim, paragrafo));
  }

  const tr = closeHistory(state.tr);
  if (inicioBlocosVazios < fim) tr.delete(inicioBlocosVazios, fim);
  if (quebrasFinais) tr.delete(quebrasFinais.de, quebrasFinais.ate);
  return tr.docChanged ? tr : null;
}
