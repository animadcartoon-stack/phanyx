import { rgb } from "pdf-lib";

function limparHtml(html: string) {
  return String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/h1>/gi, "\n\n")
    .replace(/<\/h2>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n+$/g, "");
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
  pdfDoc,
  font,
  bold,
  x,
  yInicial,
  maxWidth,
  pageWidth,
  pageHeight,
  criarNovaPagina,
}: any) {
  let pagina = page;
  let y = yInicial;

  const texto = limparHtml(html);
  const linhasOriginais = texto.split("\n");

  for (const linhaOriginal of linhasOriginais) {
    const linha = linhaOriginal.trim();

    if (!linha) {
      y -= 18;
      continue;
    }

    const ehTitulo =
      linha.toUpperCase() === "CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS" ||
      linha.startsWith("CLÁUSULA ");

    const fonte = ehTitulo ? bold : font;
    const tamanho = ehTitulo ? 12 : 10;

    const linhas = quebrarLinha(linha, maxWidth, fonte, tamanho);

    for (const l of linhas) {
      if (y < 70) {
        pagina = await criarNovaPagina();
        y = pageHeight - 135;
      }

      const centralizar =
        linha.toUpperCase() === "CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS";

      const largura = fonte.widthOfTextAtSize(l, tamanho);

      pagina.drawText(l, {
        x: centralizar ? x + (maxWidth - largura) / 2 : x,
        y,
        size: tamanho,
        font: fonte,
        color: rgb(0, 0, 0),
      });

      y -= 17;
    }

    y -= ehTitulo ? 14 : 6;
  }

  return { page: pagina, y };
}