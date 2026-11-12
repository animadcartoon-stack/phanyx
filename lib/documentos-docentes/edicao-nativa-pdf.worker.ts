import { init, type WrappedPdfiumModule } from "@embedpdf/pdfium";
import type { CaixaNativaPdf, PedidoEdicaoNativaPdf, RespostaEdicaoNativaPdf } from "./edicao-nativa-pdf";

const TEXTO = 1;
const CAMINHO = 2;
const IMAGEM = 3;
const FORMULARIO = 5;
const LIMITE_ARQUIVO = 30 * 1024 * 1024;
type Matriz = [number, number, number, number, number, number];
type Cor = [number, number, number, number];
type Trecho = {
  indices: number[]; caixa: CaixaNativaPdf; texto: string; tamanho: number;
  fonte: number; matriz: Matriz; cor: Cor; ultimo: CaixaNativaPdf;
};
type Linha = { trechos: Trecho[]; texto: string; caixa: CaixaNativaPdf };
type ModuloEdicao = WrappedPdfiumModule & { pdfium: { HEAPU8: Uint8Array } };

async function iniciar() {
  const resposta = await fetch("/biblioteca/pdfjs/pdfium/pdfium.wasm");
  if (!resposta.ok) throw new Error("PDFIUM");
  const m = await init({ wasmBinary: await resposta.arrayBuffer() });
  if (!("HEAPU8" in m.pdfium) || !(m.pdfium.HEAPU8 instanceof Uint8Array)) throw new Error("PDFIUM");
  m.PDFiumExt_Init();
  return m as ModuloEdicao;
}

function caixaObjeto(m: WrappedPdfiumModule, objeto: number, base: number): CaixaNativaPdf | null {
  if (!m.FPDFPageObj_GetBounds(objeto, base, base + 4, base + 8, base + 12)) return null;
  const [esquerda, baixo, direita, alto] = Array.from({ length: 4 }, (_, i) => m.pdfium.getValue(base + i * 4, "float"));
  return { esquerda, baixo, direita, alto };
}

function lerTrechos(m: WrappedPdfiumModule, pagina: number, base: number, selecao: Set<number>) {
  const textoPagina = m.FPDFText_LoadPage(pagina);
  if (!textoPagina) return [];
  const { malloc, free } = m.pdfium.wasmExports;
  const trechos: Trecho[] = [];
  let atual: Trecho | null = null;
  try {
    const quantidade = m.FPDFPage_CountObjects(pagina);
    for (let indice = 0; indice < quantidade; indice++) {
      if (!selecao.has(indice)) { atual = null; continue; }
      const objeto = m.FPDFPage_GetObject(pagina, indice);
      if (m.FPDFTextObj_GetTextRenderMode(objeto) !== 0) {
        atual = null;
        continue;
      }
      const caixa = caixaObjeto(m, objeto, base);
      const fonte = m.FPDFTextObj_GetFont(objeto);
      if (!caixa || !fonte || !m.FPDFTextObj_GetFontSize(objeto, base) ||
          !m.FPDFPageObj_GetMatrix(objeto, base + 4) ||
          !m.FPDFPageObj_GetFillColor(objeto, base + 28, base + 32, base + 36, base + 40)) {
        atual = null;
        continue;
      }
      const tamanho = m.pdfium.getValue(base, "float");
      const matriz = Array.from({ length: 6 }, (_, i) => m.pdfium.getValue(base + 4 + i * 4, "float")) as Matriz;
      const cor = Array.from({ length: 4 }, (_, i) => m.pdfium.getValue(base + 28 + i * 4, "i32")) as Cor;
      if (tamanho <= 0 || matriz[0] <= 0 || matriz[3] <= 0 || Math.abs(matriz[1]) > 0.01 || Math.abs(matriz[2]) > 0.01) {
        atual = null;
        continue;
      }
      const n = m.FPDFTextObj_GetText(objeto, textoPagina, 0, 0);
      if (n <= 2 || n > 8192) {
        atual = null;
        continue;
      }
      const buffer = malloc(n);
      if (!buffer) throw new Error("PDFIUM");
      let texto: string;
      try {
        if (m.FPDFTextObj_GetText(objeto, textoPagina, buffer, n) !== n) throw new Error("PDFIUM");
        texto = m.pdfium.UTF16ToString(buffer, n);
      } finally {
        free(buffer);
      }
      const intervalo = atual ? caixa.esquerda - atual.ultimo.direita : Infinity;
      const tamanhoVisivel = tamanho * matriz[0];
      if (atual && atual.fonte === fonte && atual.tamanho === tamanho &&
          Math.abs(atual.matriz[5] - matriz[5]) < 0.6 &&
          matriz.slice(0, 4).every((v, i) => Math.abs(v - atual!.matriz[i]) < 0.001) &&
          cor.every((v, i) => v === atual!.cor[i]) && intervalo >= -tamanhoVisivel * 0.35 && intervalo <= tamanhoVisivel * 0.6) {
        const espaco = intervalo > tamanhoVisivel * 0.17 && !/\s$/.test(atual.texto) && !/^\s/.test(texto) ? " " : "";
        atual.texto += espaco + (/\s$/.test(atual.texto) ? texto.replace(/^[ \t]+/, "") : texto);
        atual.indices.push(indice);
        atual.caixa = unirCaixas(atual.caixa, caixa);
        atual.ultimo = caixa;
      } else {
        atual = { indices: [indice], caixa, texto, tamanho, fonte, matriz, cor, ultimo: caixa };
        trechos.push(atual);
      }
    }
    return trechos.filter(trecho => trecho.texto.trim());
  } finally {
    m.FPDFText_ClosePage(textoPagina);
  }
}

function unirCaixas(a: CaixaNativaPdf, b: CaixaNativaPdf): CaixaNativaPdf {
  return { esquerda: Math.min(a.esquerda, b.esquerda), baixo: Math.min(a.baixo, b.baixo),
    direita: Math.max(a.direita, b.direita), alto: Math.max(a.alto, b.alto) };
}

function selecionarTrechos(m: WrappedPdfiumModule, pagina: number, base: number, area: CaixaNativaPdf) {
  const selecionados = new Set<number>();
  const coberturas: CaixaNativaPdf[] = [];
  for (let indice = m.FPDFPage_CountObjects(pagina) - 1; indice >= 0; indice--) {
    const objeto = m.FPDFPage_GetObject(pagina, indice);
    const tipo = m.FPDFPageObj_GetType(objeto);
    const caixa = caixaObjeto(m, objeto, base);
    if (!caixa || Math.min(caixa.direita, area.direita) - Math.max(caixa.esquerda, area.esquerda) <= 0.5 ||
        Math.min(caixa.alto, area.alto) - Math.max(caixa.baixo, area.baixo) <= 0.5) continue;
    if (tipo !== TEXTO) {
      const caminhoPreenchido = tipo === CAMINHO && m.FPDFPath_GetDrawMode(objeto, base, base + 4) && m.pdfium.getValue(base, "i32");
      if (caminhoPreenchido || tipo === IMAGEM || tipo === FORMULARIO) coberturas.push(caixa);
      continue;
    }
    if (m.FPDFTextObj_GetTextRenderMode(objeto) !== 0 || coberturas.some(c => c.esquerda <= caixa.esquerda &&
        c.direita >= caixa.direita && c.baixo <= caixa.baixo && c.alto >= caixa.alto)) continue;
    const margem = 1.5;
    if (caixa.esquerda < area.esquerda - margem || caixa.direita > area.direita + margem ||
        caixa.baixo < area.baixo - margem || caixa.alto > area.alto + margem) throw new Error("COR_OBJETO_PARCIAL");
    selecionados.add(indice);
  }
  const trechos = lerTrechos(m, pagina, base, selecionados);
  if (!trechos.length) throw new Error("TEXTO_NATIVO_INDISPONIVEL");
  const linhas: Linha[] = [];
  for (const trecho of trechos.sort((a, b) => b.matriz[5] - a.matriz[5])) {
    const linha = linhas[linhas.length - 1];
    if (linha && Math.abs(linha.trechos[0].matriz[5] - trecho.matriz[5]) < 1.2) {
      linha.trechos.push(trecho);
      linha.caixa = unirCaixas(linha.caixa, trecho.caixa);
    } else linhas.push({ trechos: [trecho], texto: "", caixa: trecho.caixa });
  }
  for (const linha of linhas) {
    linha.trechos.sort((a, b) => a.caixa.esquerda - b.caixa.esquerda);
    for (let i = 0; i < linha.trechos.length; i++) {
      const trecho = linha.trechos[i];
      const anterior = linha.trechos[i - 1];
      const intervalo = anterior ? trecho.caixa.esquerda - anterior.caixa.direita : 0;
      if (intervalo > trecho.tamanho * trecho.matriz[0] * 0.15 && !/\s$/.test(linha.texto) && !/^\s/.test(trecho.texto)) linha.texto += " ";
      linha.texto += trecho.texto;
    }
    linha.texto = linha.texto.trim();
  }
  return linhas;
}

function fontePadrao(m: WrappedPdfiumModule, fonte: number, base: number) {
  const n = m.FPDFFont_GetBaseFontName(fonte, base, 256);
  const nome = n > 0 && n <= 256 ? m.pdfium.UTF8ToString(base, n) : "";
  const bold = /bold|black|heavy|semibold/i.test(nome);
  const italic = /italic|oblique/i.test(nome);
  if (/times|serif|georgia|cambria/i.test(nome) && !/sans/i.test(nome)) {
    return bold ? (italic ? "Times-BoldItalic" : "Times-Bold") : (italic ? "Times-Italic" : "Times-Roman");
  }
  const familia = /courier|mono|consolas/i.test(nome) ? "Courier" : "Helvetica";
  return familia + (bold ? (italic ? "-BoldOblique" : "-Bold") : (italic ? "-Oblique" : ""));
}

function editarLinha(
  m: WrappedPdfiumModule, doc: number, pagina: number, base: number,
  linha: Linha, objetos: Set<number>, texto: string, cor: Cor | null,
) {
  const alvo = linha.trechos[0];
  if (texto === linha.texto) {
    if (cor) {
      for (const objeto of objetos) {
        if (!m.FPDFPageObj_GetFillColor(objeto, base, base + 4, base + 8, base + 12) ||
            !m.FPDFPageObj_SetFillColor(objeto, cor[0], cor[1], cor[2], m.pdfium.getValue(base + 12, "i32"))) throw new Error("PDFIUM");
      }
    }
    return;
  }
  const { malloc, free } = m.pdfium.wasmExports;
  let novo = 0;
  let posicao = -1;
  try {
    if (texto.trim()) {
      const codificavel = /^[\u0020-\u007e\u00a0-\u00ff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]+$/u;
      if (texto.length > 1000 || !codificavel.test(texto)) throw new Error("FONTE_NATIVA");
      const fonte = m.FPDFText_LoadStandardFont(doc, fontePadrao(m, alvo.fonte, base));
      if (!fonte) throw new Error("FONTE_NATIVA");
      try { novo = m.FPDFPageObj_CreateTextObj(doc, fonte, alvo.tamanho); }
      finally { m.FPDFFont_Close(fonte); }
      if (!novo) throw new Error("PDFIUM");
      const n = (texto.length + 1) * 2;
      const buffer = malloc(n);
      if (!buffer) throw new Error("PDFIUM");
      try {
        m.pdfium.stringToUTF16(texto, buffer, n);
        if (!m.FPDFText_SetText(novo, buffer)) throw new Error("FONTE_NATIVA");
      } finally { free(buffer); }
      alvo.matriz.forEach((v, i) => m.pdfium.setValue(base + i * 4, v, "float"));
      const tinta = cor ?? alvo.cor;
      if (!m.FPDFPageObj_SetMatrix(novo, base) || !m.FPDFPageObj_SetFillColor(novo, tinta[0], tinta[1], tinta[2], alvo.cor[3])) throw new Error("PDFIUM");
      const caixa = caixaObjeto(m, novo, base);
      if (!caixa) throw new Error("PDFIUM");
      let proximo = Infinity;
      for (let i = 0; i < m.FPDFPage_CountObjects(pagina); i++) {
        const objeto = m.FPDFPage_GetObject(pagina, i);
        if (objetos.has(objeto)) {
          if (posicao === -1) posicao = i;
          continue;
        }
        if (m.FPDFPageObj_GetType(objeto) !== TEXTO) continue;
        const vizinho = caixaObjeto(m, objeto, base);
        if (vizinho && vizinho.esquerda >= linha.caixa.direita - 0.5 &&
            vizinho.baixo < linha.caixa.alto && vizinho.alto > linha.caixa.baixo) proximo = Math.min(proximo, vizinho.esquerda);
      }
      const temCaixa = m.FPDFPage_GetCropBox(pagina, base, base + 4, base + 8, base + 12) ||
        m.FPDFPage_GetMediaBox(pagina, base, base + 4, base + 8, base + 12);
      const limite = temCaixa ? m.pdfium.getValue(base + 8, "float") : linha.caixa.direita;
      if (posicao === -1) throw new Error("PDFIUM");
      if (caixa.direita > Math.min(proximo, limite - 2) + 0.5) throw new Error("TEXTO_NATIVO_NAO_CABE");
    }
    for (const objeto of objetos) {
      if (!m.FPDFPage_RemoveObject(pagina, objeto)) throw new Error("PDFIUM");
      m.FPDFPageObj_Destroy(objeto);
    }
    if (novo) {
      if (posicao === m.FPDFPage_CountObjects(pagina)) m.FPDFPage_InsertObject(pagina, novo);
      else if (!m.FPDFPage_InsertObjectAtIndex(pagina, novo, posicao)) throw new Error("PDFIUM");
      novo = 0;
    }
  } finally {
    if (novo) m.FPDFPageObj_Destroy(novo);
  }
}

function corPdf(cor: string | null): Cor | null {
  if (cor === null) return null;
  if (!/^#[\da-f]{6}$/i.test(cor)) throw new Error("PDFIUM");
  return [parseInt(cor.slice(1, 3), 16), parseInt(cor.slice(3, 5), 16), parseInt(cor.slice(5, 7), 16), 255];
}

function salvar(m: ModuloEdicao, doc: number, pagina: number) {
  if (!m.FPDFPage_GenerateContent(pagina)) throw new Error("PDFIUM");
  const escritor = m.PDFiumExt_OpenFileWriter();
  if (!escritor) throw new Error("PDFIUM");
  const { malloc, free } = m.pdfium.wasmExports;
  let buffer = 0;
  try {
    if (!m.PDFiumExt_SaveAsCopy(doc, escritor)) throw new Error("PDFIUM");
    const tamanho = m.PDFiumExt_GetFileWriterSize(escritor);
    if (tamanho <= 0 || tamanho > LIMITE_ARQUIVO) throw new Error("PDFIUM");
    buffer = malloc(tamanho);
    if (!buffer || m.PDFiumExt_GetFileWriterData(escritor, buffer, tamanho) !== tamanho) throw new Error("PDFIUM");
    return m.pdfium.HEAPU8.slice(buffer, buffer + tamanho).buffer as ArrayBuffer;
  } finally {
    if (buffer) free(buffer);
    m.PDFiumExt_CloseFileWriter(escritor);
  }
}

async function executar({ bytes, pagina, operacao }: PedidoEdicaoNativaPdf): Promise<RespostaEdicaoNativaPdf> {
  if (bytes.byteLength > LIMITE_ARQUIVO) throw new Error("PDFIUM");
  const m = await iniciar();
  const { malloc, free } = m.pdfium.wasmExports;
  const entrada = malloc(bytes.byteLength);
  const base = malloc(256);
  let doc = 0;
  let folha = 0;
  try {
    if (!entrada || !base) throw new Error("PDFIUM");
    m.pdfium.HEAPU8.set(new Uint8Array(bytes), entrada);
    doc = m.FPDF_LoadMemDocument(entrada, bytes.byteLength, "");
    if (!doc) throw new Error("PDFIUM");
    folha = m.FPDF_LoadPage(doc, pagina - 1);
    if (!folha) throw new Error("PDFIUM");
    const linhas = selecionarTrechos(m, folha, base, operacao.caixa);
    if (operacao.tipo === "selecionar") {
      const cores = new Set(linhas.flatMap(linha => linha.trechos.map(t => t.cor.slice(0, 3).map(v => v.toString(16).padStart(2, "0")).join(""))));
      const cor = cores.size === 1 ? `#${cores.values().next().value}` : null;
      return { selecao: { texto: linhas.map(linha => linha.texto).join("\n"), cor } };
    }
    const textos = operacao.texto.split(/\r?\n/);
    if (textos.length > linhas.length) throw new Error("LINHAS_NATIVAS");
    const cor = corPdf(operacao.cor);
    const edicoes = linhas.map((linha, i) => ({
      linha, texto: textos[i] ?? "",
      objetos: new Set(linha.trechos.flatMap(t => t.indices.map(indice => m.FPDFPage_GetObject(folha, indice)))),
    }));
    for (const { linha, objetos, texto } of edicoes) editarLinha(m, doc, folha, base, linha, objetos, texto, cor);
    return { bytes: salvar(m, doc, folha) };
  } finally {
    if (folha) m.FPDF_ClosePage(folha);
    if (doc) m.FPDF_CloseDocument(doc);
    if (base) free(base);
    if (entrada) free(entrada);
  }
}

self.onmessage = async (evento: MessageEvent<PedidoEdicaoNativaPdf>) => {
  try {
    const resposta = await executar(evento.data);
    if ("bytes" in resposta) self.postMessage(resposta, { transfer: [resposta.bytes] });
    else self.postMessage(resposta);
  } catch (erro) {
    self.postMessage({ erro: erro instanceof Error ? erro.message : "PDFIUM" });
  }
};
