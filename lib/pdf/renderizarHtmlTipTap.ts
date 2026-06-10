import { rgb } from "pdf-lib";

type BlocoPdf = {
  texto: string;
  align: "left" | "center" | "right";
  bold: boolean;
  vazio: boolean;
};

const ESPACO_LINHA = 16;
const ESPACO_PARAGRAFO = 0;
const ESPACO_LINHA_VAZIA = 16;
const ESPACO_TITULO = 18;

function decodificarHtml(texto: string) {
  return String(texto || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extrairBlocosTipTap(html: string): BlocoPdf[] {
  const entrada = String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const blocos: BlocoPdf[] = [];
  const regex = /<(p|h1|h2|li)([^>]*)>([\s\S]*?)<\/\1>/gi;

  let match;

  while ((match = regex.exec(entrada)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || "";
    const bruto = match[3] || "";

    const align = attrs.includes("text-align: center")
      ? "center"
      : attrs.includes("text-align: right")
      ? "right"
      : "left";

    const bold =
  tag === "h1" ||
  tag === "h2";

    const texto = decodificarHtml(
      bruto.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
    );

    const linhas = texto.split("\n");

    for (const linha of linhas) {
      if (!linha.trim()) {
        blocos.push({ texto: "", align, bold, vazio: true });
      } else {
        blocos.push({
          texto: tag === "li" ? `- ${linha}` : linha,
          align,
          bold,
          vazio: false,
        });
      }
    }
  }

  return blocos;
}

function quebrarLinha(texto: string, maxWidth: number, font: any, size: number) {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;

    if (font.widthOfTextAtSize(tentativa, size) <= maxWidth) {
      atual = tentativa;
    } else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  }

  if (atual) linhas.push(atual);
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

    const fonte = bloco.bold ? bold : font;
    const tamanho = bloco.bold ? 12 : 10;
    const linhas = quebrarLinha(bloco.texto, maxWidth, fonte, tamanho);

    for (const linha of linhas) {
      if (y < 70) {
        pagina = await criarNovaPagina();
        y = pageHeight - 135;
      }

      const largura = fonte.widthOfTextAtSize(linha, tamanho);

      let posX = x;

      if (bloco.align === "center") {
        posX = x + (maxWidth - largura) / 2;
      }

      if (bloco.align === "right") {
        posX = x + maxWidth - largura;
      }

      pagina.drawText(linha, {
        x: posX,
        y,
        size: tamanho,
        font: fonte,
        color: rgb(0, 0, 0),
      });

      y -= ESPACO_LINHA;
    }

    y -= bloco.bold ? ESPACO_TITULO : ESPACO_PARAGRAFO;
  }

  return { page: pagina, y };
}