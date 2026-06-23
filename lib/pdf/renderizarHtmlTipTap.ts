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
};

const ESPACO_PARAGRAFO = 2;
const ESPACO_LINHA_VAZIA = 8;
const ESPACO_TITULO = 6;

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

function extrairBlocosTipTap(html: string): BlocoPdf[] {
  const entrada = String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const blocos: BlocoPdf[] = [];
  const regex = /<(p|div|h1|h2|li)([^>]*)>([\s\S]*?)<\/\1>/gi;

  let match;

  while ((match = regex.exec(entrada)) !== null) {
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
    const partesLinha = bruto.split("\n");

    for (const parteLinha of partesLinha) {
      const semTags = parteLinha.replace(/<[^>]+>/g, "").trim();

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
  if (!lineHeight) return maiorFonteLinha * 1.12;

  if (lineHeight > 4) return lineHeight;

  return maiorFonteLinha * lineHeight;
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
    const tamanhoBase =
      bloco.fontSize || (bloco.titulo ? 12 : 10);

    if (bloco.vazio) {
      const alturaVazia = calcularAlturaLinha(
        tamanhoBase,
        bloco.lineHeight
      );
      y -= Math.max(alturaVazia, ESPACO_LINHA_VAZIA);
      continue;
    }

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