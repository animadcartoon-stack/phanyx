import { rgb } from "pdf-lib";

type Align = "left" | "center" | "right";

type Token = {
  texto: string;
  bold: boolean;
  fontSize?: number | null;
  fontFamily?: string | null;
};

type BlocoPdf = {
  tokens: Token[];
  align: Align;
  vazio: boolean;
  titulo: boolean;
  fontSize?: number | null;
  fontFamily?: string | null;
  lineHeight?: number | null;

  tipo?: "texto" | "hr" | "table";
  htmlOriginal?: string;
};

const ESPACO_PARAGRAFO = 0.5;
const ESPACO_LINHA_VAZIA = 4;
const ESPACO_TITULO = 2;

function decode(texto: string) {
  return String(texto || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extrairStyle(valor: string, propriedade: string) {
  const regex = new RegExp(`${propriedade}\\s*:\\s*([^;"]+)`, "i");
  const match = String(valor || "").match(regex);
  return match?.[1]?.trim() || null;
}

function extrairFontSize(style: string) {
  const valor = extrairStyle(style, "font-size");
  if (!valor) return null;

  const numero = Number(String(valor).replace("pt", "").replace("px", "").trim());
  if (!Number.isFinite(numero)) return null;

  if (String(valor).includes("px")) {
    return Number((numero * 0.75).toFixed(2));
  }

  return numero;
}

function extrairFontFamily(style: string) {
  const valor = extrairStyle(style, "font-family");
  if (!valor) return null;

  return valor.replaceAll("'", "").replaceAll('"', "").trim();
}

function extrairLineHeight(style: string) {
  const valor = extrairStyle(style, "line-height");
  if (!valor) return null;

  const texto = String(valor).trim();

  if (texto.endsWith("%")) {
    const numero = Number(texto.replace("%", "").trim());
    if (!Number.isFinite(numero)) return null;
    return numero / 100;
  }

  const numero = Number(texto.replace("px", "").replace("pt", "").trim());
  if (!Number.isFinite(numero)) return null;

  if (texto.includes("px")) {
    return Number((numero * 0.75).toFixed(2));
  }

  return numero;
}

function tokensInline(html: string): Token[] {
  const tokens: Token[] = [];

  let emNegrito = false;
  let fontSizeAtual: number | null = null;
  let fontFamilyAtual: string | null = null;

  const partes = String(html || "").split(
    /(<\/?strong>|<\/?b>|<span[^>]*>|<\/span>)/gi
  );

  for (const parte of partes) {
    if (/^<strong>$/i.test(parte) || /^<b>$/i.test(parte)) {
      emNegrito = true;
      continue;
    }

    if (/^<\/strong>$/i.test(parte) || /^<\/b>$/i.test(parte)) {
      emNegrito = false;
      continue;
    }

    if (/^<span/i.test(parte)) {
      const style =
        parte.match(/style="([^"]*)"/i)?.[1] ||
        parte.match(/style='([^']*)'/i)?.[1] ||
        "";

      const tamanho = extrairFontSize(style);
      const fonte = extrairFontFamily(style);

      if (tamanho) fontSizeAtual = tamanho;
      if (fonte) fontFamilyAtual = fonte;

      continue;
    }

    if (/^<\/span>$/i.test(parte)) {
      fontSizeAtual = null;
      fontFamilyAtual = null;
      continue;
    }

    const texto = decode(parte.replace(/<[^>]+>/g, ""));

    if (texto) {
      tokens.push({
        texto,
        bold: emNegrito,
        fontSize: fontSizeAtual,
        fontFamily: fontFamilyAtual,
      });
    }
  }

  return tokens;
}

function extrairTabelas(html: string): BlocoPdf[] {
  const tabelas: BlocoPdf[] = [];
  const regexTabela = /<table[\s\S]*?<\/table>/gi;

  let match;

  while ((match = regexTabela.exec(html)) !== null) {
    tabelas.push({
      tokens: [],
      align: "left",
      vazio: false,
      titulo: false,
      tipo: "table",
      htmlOriginal: match[0],
    });
  }

  return tabelas;
}

function extrairBlocosTipTap(html: string): BlocoPdf[] {
  const entrada = String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

let entradaComHr = entrada.replace(
  /<hr\s*\/?>/gi,
  "<div data-phanyx-hr='1'></div>"
);

const tabelas: Record<string, BlocoPdf> = {};
let contadorTabela = 0;

entradaComHr = entradaComHr.replace(/<table[\s\S]*?<\/table>/gi, (htmlTabela) => {
  const marcador = `PHANYX_TABLE_${contadorTabela}`;

  tabelas[marcador] = {
    tokens: [],
    align: "left",
    vazio: false,
    titulo: false,
    tipo: "table",
    htmlOriginal: htmlTabela,
  };

  contadorTabela += 1;

  return `<div>${marcador}</div>`;
});

const blocos: BlocoPdf[] = [];

  const regex = /<(p|div|h1|h2|li)([^>]*)>([\s\S]*?)<\/\1>/gi;

  let match;

  while ((match = regex.exec(entradaComHr)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || "";
    const bruto = match[3] || "";

    const style =
      attrs.match(/style="([^"]*)"/i)?.[1] ||
      attrs.match(/style='([^']*)'/i)?.[1] ||
      "";

    const lineHeight = extrairLineHeight(style);
    const fontSizeBloco = extrairFontSize(style);
    const fontFamilyBloco = extrairFontFamily(style);

    const align: Align = /text-align\s*:\s*center/i.test(style)
      ? "center"
      : /text-align\s*:\s*right/i.test(style)
      ? "right"
      : "left";

    const titulo = tag === "h1" || tag === "h2";
    if (attrs.includes("data-phanyx-hr")) {
  blocos.push({
    tokens: [],
    align: "left",
    vazio: false,
    titulo: false,
    tipo: "hr",
  });

  continue;
}
    const partesLinha = bruto.split("\n");

    for (const parteLinha of partesLinha) {
      const semTags = parteLinha.replace(/<[^>]+>/g, "").trim();

if (tabelas[semTags]) {
  blocos.push(tabelas[semTags]);
  continue;
}

      if (!semTags) {
        blocos.push({
          tokens: [],
          align,
          vazio: true,
          titulo,
          fontSize: fontSizeBloco,
          fontFamily: fontFamilyBloco,
          lineHeight,
        });
        continue;
      }

      const tokens = tokensInline(parteLinha).map((token) => ({
        ...token,
        fontSize: token.fontSize || fontSizeBloco || null,
        fontFamily: token.fontFamily || fontFamilyBloco || null,
      }));

      if (tag === "li") {
        tokens.unshift({
  texto: "- ",
  bold: false,
  fontSize: fontSizeBloco || null,
  fontFamily: fontFamilyBloco || null,
});
      }

      blocos.push({
        tokens,
        align,
        vazio: false,
        titulo,
        fontSize: fontSizeBloco,
        fontFamily: fontFamilyBloco,
        lineHeight,
      });
    }
  }

  if (blocos.length === 0) {
    const textoLimpo = decode(
      entrada
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
    );

    textoLimpo.split("\n").forEach((linha) => {
      const texto = linha.trim();

      if (!texto) {
        blocos.push({
          tokens: [],
          align: "left",
          vazio: true,
          titulo: false,
          lineHeight: null,
        });
        return;
      }

      blocos.push({
        tokens: [{ texto, bold: false }],
        align: "left",
        vazio: false,
        titulo: false,
        lineHeight: null,
      });
    });
  }

  return blocos;
}

function quebrarTokensEmLinhas(
  tokens: Token[],
  maxWidth: number,
  font: any,
  bold: any,
  size: number
) {
  const palavras: Token[] = [];

  for (const token of tokens) {
    const pedacos = token.texto.split(/(\s+)/);

    for (const pedaco of pedacos) {
      if (pedaco === "") continue;

      palavras.push({
        texto: pedaco,
        bold: token.bold,
        fontSize: token.fontSize,
        fontFamily: token.fontFamily,
      });
    }
  }

  const linhas: Token[][] = [];
  let atual: Token[] = [];

  function largura(tokensLinha: Token[]) {
    return tokensLinha.reduce((soma, token) => {
      const fonte = token.bold ? bold : font;
      return soma + fonte.widthOfTextAtSize(token.texto, token.fontSize || size);
    }, 0);
  }

  for (const palavra of palavras) {
    const tentativa = [...atual, palavra];

    if (largura(tentativa) <= maxWidth || atual.length === 0) {
      atual = tentativa;
    } else {
      linhas.push(atual);
      atual = [palavra];
    }
  }

  if (atual.length) linhas.push(atual);

  return linhas;
}

function calcularAlturaLinha(maiorFonteLinha: number, lineHeight?: number | null) {
  if (!lineHeight) return maiorFonteLinha * 0.95;

  if (lineHeight > 4) return lineHeight;

  return maiorFonteLinha * lineHeight;
}

async function renderizarTabelaSimplesNoPdf({
  html,
  page,
  font,
  bold,
  x,
  y,
  maxWidth,
  pageHeight,
  criarNovaPagina,
}: any) {
  let pagina = page;
  let posY = y;

  const regexLinha = /<tr[\s\S]*?<\/tr>/gi;
  const linhas = String(html || "").match(regexLinha) || [];

  const tamanhoFonte = 8;
  const alturaLinha = 8.5;

  for (const linhaHtml of linhas) {
    const celulas = linhaHtml.match(/<td[\s\S]*?<\/td>/gi) || [];

    if (celulas.length === 0) continue;

    const larguraCelula = (maxWidth - 20) / celulas.length;
    let maiorAlturaCelula = 0;

    const celulasPreparadas = celulas.map((celulaHtml: string) => {
      const attrs = celulaHtml.match(/<td([^>]*)>/i)?.[1] || "";
      
      const style =
  attrs.match(/style="([^"]*)"/i)?.[1] ||
  attrs.match(/style='([^']*)'/i)?.[1] ||
  "";

const widthMatch = style.match(/width\s*:\s*(\d+)%/i);

const widthPercent = widthMatch
  ? Number(widthMatch[1])
  : null;

      const align: Align = /text-align\s*:\s*center/i.test(style)
        ? "center"
        : /text-align\s*:\s*right/i.test(style)
        ? "right"
        : "left";

      const linhasTexto = decode(
        celulaHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<\/div>/gi, "\n")
          .replace(/<[^>]+>/g, "")
      )
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      maiorAlturaCelula = Math.max(
        maiorAlturaCelula,
        linhasTexto.length * alturaLinha
      );

      return {
  linhasTexto,
  align,
  widthPercent,
};
    });

    if (posY - maiorAlturaCelula < 70) {
      pagina = await criarNovaPagina();
      posY = pageHeight - 135;
    }

    celulasPreparadas.forEach((celula, index: number) => {
      let colunaX = x;

for (let i = 0; i < index; i++) {
  const larguraAnterior =
    celulasPreparadas[i].widthPercent
      ? (maxWidth * celulasPreparadas[i].widthPercent) / 100
      : larguraCelula;

  colunaX += larguraAnterior;
}

const larguraAtual =
  celula.widthPercent
    ? (maxWidth * celula.widthPercent) / 100
    : larguraCelula;

      let linhaY = posY;

      celula.linhasTexto.forEach((texto) => {
        const ehTitulo =
          texto.toUpperCase() === "EMPREGADOR" ||
          texto.toUpperCase() === "COLABORADOR";

        const fonteUsada = ehTitulo ? bold : font;
        const larguraTexto = fonteUsada.widthOfTextAtSize(texto, tamanhoFonte);

        let textoX = colunaX;

        if (celula.align === "center") {
          textoX = colunaX + (larguraAtual - larguraTexto) / 2;
        }

        if (celula.align === "right") {
          textoX = colunaX + larguraAtual - larguraTexto;
        }

        pagina.drawText(texto, {
          x: textoX,
          y: linhaY,
          size: tamanhoFonte,
          font: fonteUsada,
          color: rgb(0, 0, 0),
        });

        linhaY -= alturaLinha;
      });
    });

    posY -= maiorAlturaCelula + 4;
  }

  return { page: pagina, y: posY };
}

export async function renderizarHtmlTipTapNoPdf({
  html,
  page,
  font,
  bold,
  x,
  yInicial,
  maxWidth,
  pageHeight,
  criarNovaPagina,
}: any) {
  let pagina = page;
  let y = yInicial;

  const blocos = extrairBlocosTipTap(html);

for (const bloco of blocos) {

  if (bloco.tipo === "hr") {
    if (y < 70) {
      pagina = await criarNovaPagina();
      y = pageHeight - 135;
    }

    pagina.drawLine({
      start: { x, y },
      end: { x: x + maxWidth, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    y -= 8;
    continue;
  }

  if (bloco.tipo === "table") {
  const resultadoTabela = await renderizarTabelaSimplesNoPdf({
    html: bloco.htmlOriginal || "",
    page: pagina,
    pdfDoc: null,
    font,
    bold,
    x,
    y,
    maxWidth,
    pageHeight,
    criarNovaPagina,
  });

  pagina = resultadoTabela.page;
  y = resultadoTabela.y - 2;

  continue;
}

  const tamanhoBase =
    bloco.fontSize || (bloco.titulo ? 8 : 7);

  if (bloco.vazio) {
    const alturaVazia = calcularAlturaLinha(
      tamanhoBase,
      bloco.lineHeight
    );

    y -= Math.max(
      alturaVazia,
      ESPACO_LINHA_VAZIA
    );

    continue;
  }

  // restante do código...

    const linhas = quebrarTokensEmLinhas(
      bloco.tokens.map((t) => ({
        ...t,
        bold: bloco.titulo ? true : t.bold,
        fontSize: t.fontSize || tamanhoBase,
      })),
      maxWidth,
      font,
      bold,
      tamanhoBase
    );

    for (const linhaTokens of linhas) {
      if (y < 70) {
        pagina = await criarNovaPagina();
        y = pageHeight - 135;
      }

      const larguraLinha = linhaTokens.reduce((soma, token) => {
        const fonte = token.bold ? bold : font;
        const tamanho = token.fontSize || tamanhoBase;
        return soma + fonte.widthOfTextAtSize(token.texto, tamanho);
      }, 0);

      let posX = x;

      if (bloco.align === "center") {
        posX = x + (maxWidth - larguraLinha) / 2;
      }

      if (bloco.align === "right") {
        posX = x + maxWidth - larguraLinha;
      }

      for (const token of linhaTokens) {
        const fonte = token.bold ? bold : font;
        const tamanho = token.fontSize || tamanhoBase;

        pagina.drawText(token.texto, {
          x: posX,
          y,
          size: tamanho,
          font: fonte,
          color: rgb(0, 0, 0),
        });

        posX += fonte.widthOfTextAtSize(token.texto, tamanho);
      }

      const maiorFonteLinha = Math.max(
        ...linhaTokens.map((token) => token.fontSize || tamanhoBase)
      );

      y -= calcularAlturaLinha(maiorFonteLinha, bloco.lineHeight);
    }

    y -= bloco.titulo ? ESPACO_TITULO : ESPACO_PARAGRAFO;
  }
  
  return { page: pagina, y };
}