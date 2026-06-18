import { rgb } from "pdf-lib";

type Align = "left" | "center" | "right";

type Token = {
  texto: string;
  bold: boolean;
};

type BlocoPdf = {
  tokens: Token[];
  align: Align;
  vazio: boolean;
  titulo: boolean;
};

const ESPACO_LINHA = 12;
const ESPACO_PARAGRAFO = 4;
const ESPACO_LINHA_VAZIA = 14;
const ESPACO_TITULO = 12;

function decode(texto: string) {
  return String(texto || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tokensInline(html: string): Token[] {
  const tokens: Token[] = [];
  const partes = String(html || "").split(/(<\/?strong>|<\/?b>)/gi);

  let emNegrito = false;

  for (const parte of partes) {
    if (/^<strong>$/i.test(parte) || /^<b>$/i.test(parte)) {
      emNegrito = true;
      continue;
    }

    if (/^<\/strong>$/i.test(parte) || /^<\/b>$/i.test(parte)) {
      emNegrito = false;
      continue;
    }

    const texto = decode(parte.replace(/<[^>]+>/g, ""));
    if (texto) tokens.push({ texto, bold: emNegrito });
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

    const align: Align = attrs.includes("text-align: center")
      ? "center"
      : attrs.includes("text-align: right")
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
        });
        continue;
      }

      const tokens = tokensInline(parteLinha);

      if (tag === "li") {
        tokens.unshift({ texto: "- ", bold: false });
      }

      blocos.push({
        tokens,
        align,
        vazio: false,
        titulo,
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
        });
        return;
      }

      blocos.push({
        tokens: [{ texto, bold: false }],
        align: "left",
        vazio: false,
        titulo: false,
      });
    });
  }

  return blocos;
}

function quebrarTokensEmLinhas(tokens: Token[], maxWidth: number, font: any, bold: any, size: number) {
  const palavras: Token[] = [];

  for (const token of tokens) {
    const pedacos = token.texto.split(/(\s+)/);

    for (const pedaco of pedacos) {
      if (pedaco === "") continue;
      palavras.push({ texto: pedaco, bold: token.bold });
    }
  }

  const linhas: Token[][] = [];
  let atual: Token[] = [];

  function largura(tokensLinha: Token[]) {
    return tokensLinha.reduce((soma, token) => {
      const fonte = token.bold ? bold : font;
      return soma + fonte.widthOfTextAtSize(token.texto, size);
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
    if (bloco.vazio) {
      y -= ESPACO_LINHA_VAZIA;
      continue;
    }

    const tamanho = bloco.titulo ? 12 : 10;
    const linhas = quebrarTokensEmLinhas(
      bloco.tokens.map((t) => ({
        ...t,
        bold: bloco.titulo ? true : t.bold,
      })),
      maxWidth,
      font,
      bold,
      tamanho
    );

    for (const linhaTokens of linhas) {
      if (y < 70) {
        pagina = await criarNovaPagina();
        y = pageHeight - 135;
      }

      const larguraLinha = linhaTokens.reduce((soma, token) => {
        const fonte = token.bold ? bold : font;
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

        pagina.drawText(token.texto, {
          x: posX,
          y,
          size: tamanho,
          font: fonte,
          color: rgb(0, 0, 0),
        });

        posX += fonte.widthOfTextAtSize(token.texto, tamanho);
      }

      y -= ESPACO_LINHA;
    }

    y -= bloco.titulo ? ESPACO_TITULO : ESPACO_PARAGRAFO;
  }

  return { page: pagina, y };
}