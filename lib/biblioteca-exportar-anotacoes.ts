import type { AnotacaoLeitor } from "./biblioteca-anotacoes-leitor";
import { rgbMarcacao, textoMarcacaoBranco } from "./biblioteca-cores-marcacoes";

type Rotulos = { titulo: string; pagina: string; trecho: string; nota: string; semTrechos: string;
  tipos: Record<AnotacaoLeitor["tipo"], string> };

/** Gera somente as anotações privadas já autorizadas; nunca exporta páginas do livro. */
export async function exportarAnotacoesPdf(titulo: string, anotacoes: AnotacaoLeitor[], incluirTrechos: boolean,
  rotulos: Rotulos, fonteUrl = "/fonts/biblioteca/DejaVuSans.ttf") {
  if (!anotacoes.length) return;
  const [{ jsPDF }, resposta] = await Promise.all([import("jspdf"), fetch(fonteUrl, { cache: "force-cache" })]);
  if (!resposta.ok) throw new Error("FONTE_PDF_INDISPONIVEL");
  const bytes = new Uint8Array(await resposta.arrayBuffer());
  let fonte = "";
  for (let i = 0; i < bytes.length; i += 8192) fonte += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  pdf.addFileToVFS("BibliotecaSans.ttf", btoa(fonte));
  pdf.addFont("BibliotecaSans.ttf", "BibliotecaSans", "normal");
  pdf.setFont("BibliotecaSans");
  pdf.setProperties({ title: `${rotulos.titulo} - ${titulo}`, author: "PHANYX", creator: "PHANYX" });
  const margem = 18, largura = 174, limite = 276;
  let y = 22;
  function novaPagina() { pdf.addPage(); y = 22; }
  function linha(texto: string, tamanho = 10, cor: [number, number, number] = [15, 23, 42], fundo?: [number, number, number]) {
    pdf.setFontSize(tamanho); pdf.setTextColor(...cor);
    const altura = tamanho * .3528 * 1.5;
    const linhas = pdf.splitTextToSize(texto || " ", largura - (fundo ? 8 : 0)) as string[];
    for (const parte of linhas) {
      if (y + altura > limite) novaPagina();
      if (fundo) { pdf.setFillColor(...fundo); pdf.rect(margem, y - altura * .78, largura, altura + .2, "F"); }
      pdf.text(parte, margem + (fundo ? 4 : 0), y); y += altura;
    }
  }
  linha("PHANYX", 10, [29, 78, 216]);
  linha(rotulos.titulo, 19); y += 2;
  linha(titulo, 12); y += 4;
  if (!incluirTrechos) { linha(rotulos.semTrechos, 9, [71, 85, 105]); y += 4; }
  for (const anotacao of anotacoes) {
    if (y + 25 > limite) novaPagina();
    linha(`${rotulos.pagina} ${anotacao.pagina} | ${rotulos.tipos[anotacao.tipo]}`, 11, [29, 78, 216]); y += 1;
    if (incluirTrechos && anotacao.trecho) {
      linha(rotulos.trecho, 8, [71, 85, 105]);
      linha(anotacao.trecho.slice(0, 1000), 10, textoMarcacaoBranco(anotacao.cor) ? [255, 255, 255] : [0, 0, 0], rgbMarcacao(anotacao.cor)); y += 2;
    }
    if (anotacao.conteudo) { linha(rotulos.nota, 8, [71, 85, 105]); linha(anotacao.conteudo); }
    y += 6;
    pdf.setDrawColor(203, 213, 225); pdf.line(margem, Math.min(y, limite), 192, Math.min(y, limite)); y += 6;
  }
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
    pdf.text(`PHANYX | ${p} / ${total}`, 192, 287, { align: "right" });
  }
  pdf.save("PHANYX-anotacoes.pdf");
}
