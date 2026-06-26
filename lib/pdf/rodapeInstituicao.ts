import { PDFPage, PDFFont, rgb } from "pdf-lib";

export function desenharRodapeInstituicao({
  pagina,
  fonteNormal,
  larguraPagina,
  margem,
  numeroPagina,
  totalPaginas,
}: {
  pagina: PDFPage;
  fonteNormal: PDFFont;
  larguraPagina: number;
  margem: number;
  numeroPagina: number;
  totalPaginas: number;
}) {
  const y = 18;

  // Linha superior
  pagina.drawLine({
    start: {
      x: margem,
      y: y + 12,
    },
    end: {
      x: larguraPagina - margem,
      y: y + 12,
    },
    thickness: 0.6,
    color: rgb(0.82, 0.84, 0.88),
  });

  // Esquerda
  pagina.drawText("Gerado pelo PHANYX", {
    x: margem,
    y,
    size: 8,
    font: fonteNormal,
    color: rgb(0.35, 0.4, 0.5),
  });

  // Centro
  const dataHora = new Date().toLocaleString("pt-BR");

  pagina.drawText(dataHora, {
    x: larguraPagina / 2 - 45,
    y,
    size: 8,
    font: fonteNormal,
    color: rgb(0.35, 0.4, 0.5),
  });

  // Direita
  pagina.drawText(
    `Página ${numeroPagina} de ${totalPaginas}`,
    {
      x: larguraPagina - margem - 75,
      y,
      size: 8,
      font: fonteNormal,
      color: rgb(0.35, 0.4, 0.5),
    }
  );
}