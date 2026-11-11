import type { JSONContent } from "@tiptap/core";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { carregarBibliotecaPdf, obterWorkerBibliotecaPdf, raizPdfBiblioteca } from "@/lib/biblioteca-pdf-client";

export type TextoImportadoPdf = {
  conteudo: JSONContent;
  paginasSemTexto: number[];
};

export const documentoTextoVazio: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function linhasDeItensPdf(itens: Pick<TextItem, "str" | "hasEOL" | "transform" | "width" | "dir">[]) {
  const linhas: string[] = [];
  let linha = "";
  let anterior: (typeof itens)[number] | undefined;

  function concluir() {
    if (linha.trim()) linhas.push(linha.trim());
    linha = "";
    anterior = undefined;
  }

  for (const item of itens) {
    const [, b, c, d, x, y] = item.transform;
    const altura = Math.max(Math.hypot(c, d), 1);
    // O PDF.js costuma fornecer hasEOL. Detecta também mudanças claras de linha.
    const horizontal = Math.abs(b) < altura * 0.1 && item.dir !== "ttb";
    if (anterior && horizontal && Math.abs(y - anterior.transform[5]) > altura * 0.5) concluir();
    if (anterior && horizontal && item.dir === "ltr" && anterior.dir === "ltr"
        && x - (anterior.transform[4] + anterior.width) > altura * 0.15
        && /\S$/.test(linha) && /^\S/.test(item.str)) linha += " ";
    linha += item.str.replace(/\u0000/g, "");
    if (item.hasEOL) concluir();
    else if (item.str) anterior = item;
  }
  concluir();
  return linhas;
}

export async function importarTextoPdf(bytes: Uint8Array<ArrayBuffer>, progresso: (pagina: number, total: number) => void): Promise<TextoImportadoPdf> {
  const [biblioteca, worker] = await Promise.all([carregarBibliotecaPdf(), obterWorkerBibliotecaPdf()]);
  const tarefa = biblioteca.getDocument({
    data: bytes.slice(),
    worker,
    isEvalSupported: false,
    cMapUrl: `${raizPdfBiblioteca}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${raizPdfBiblioteca}/standard_fonts/`,
    wasmUrl: `${raizPdfBiblioteca}/wasm/`,
  });
  try {
    const pdf = await tarefa.promise;
    const conteudo: JSONContent[] = [];
    const paginasSemTexto: number[] = [];
    let caracteres = 0;
    for (let numero = 1; numero <= pdf.numPages; numero++) {
      progresso(numero, pdf.numPages);
      const pagina = await pdf.getPage(numero);
      const dados = await pagina.getTextContent();
      const linhas = linhasDeItensPdf(dados.items.filter((item): item is TextItem => "str" in item));
      pagina.cleanup();
      if (!linhas.length) {
        paginasSemTexto.push(numero);
        continue;
      }
      for (const linha of linhas) {
        caracteres += linha.length;
        if (caracteres > 250_000 || conteudo.length >= 15_000) throw new Error("TEXTO_LONGO");
        conteudo.push({ type: "paragraph", content: [{ type: "text", text: linha }] });
      }
    }
    if (!conteudo.length) throw new Error("SEM_TEXTO");
    return { conteudo: { type: "doc", content: conteudo }, paginasSemTexto };
  } finally {
    await tarefa.destroy().catch(() => {});
  }
}
