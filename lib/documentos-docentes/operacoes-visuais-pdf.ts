import type { PDFDocument, PDFPage } from "pdf-lib";
import type { PDFDocumentProxy, PageViewport } from "pdfjs-dist";

export type AreaVisualPdf = { x: number; y: number; largura: number; altura: number };

export const formasPdf = [
  "linha", "tracejada", "seta", "duplaSeta", "retangulo", "arredondado",
  "elipse", "triangulo", "losango", "pentagono", "hexagono", "estrela", "cruz",
] as const;

export const graficosPdf = ["colunas", "barras", "linha", "pizza"] as const;

export const simbolosPdf = Array.from("✓✗☑★☆♥♦♣♠⚑⚠ℹ☀☁☂☎✉⌂⚙♿←↑→↓↔↕⇒⇔↗↘+−×÷±≠≈≤≥∞∑√π∫°µ©®™§¶†‡•…€£¥¢");

type Forma = (typeof formasPdf)[number];
type Grafico = (typeof graficosPdf)[number];
type DadoGrafico = { nome: string; valor: number };

export type OperacaoVisualPdf =
  | { tipo: "forma"; forma: Forma; cor: string; espessura: number; preencher: boolean; fundo: string }
  | { tipo: "simbolo"; simbolo: string; cor: string }
  | { tipo: "grafico"; grafico: Grafico; dados: DadoGrafico[] }
  | { tipo: "remover"; fundo: string }
  | { tipo: "texto"; texto: string; fundo: string; cor: string; tamanho: number; fonte: string; negrito: boolean; italico: boolean };

const paletaGrafico = ["#1d4ed8", "#0f766e", "#b45309", "#be123c", "#7e22ce", "#0369a1"];

export function lerDadosGraficoPdf(texto: string): DadoGrafico[] | null {
  const linhas = texto.split(/\r?\n/).map(linha => linha.trim()).filter(Boolean);
  if (linhas.length < 2 || linhas.length > 12) return null;
  const dados: DadoGrafico[] = [];
  for (const linha of linhas) {
    const item = /^([^;]{1,32});\s*(\d{1,9}(?:[.,]\d{1,4})?)$/u.exec(linha);
    if (!item?.[1].trim()) return null;
    dados.push({ nome: item[1].trim(), valor: Number(item[2].replace(",", ".")) });
  }
  return dados.some(item => item.valor > 0) ? dados : null;
}

function criarCanvas(largura: number, altura: number, escala: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(largura * escala);
  canvas.height = Math.ceil(altura * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS");
  return { canvas, ctx };
}

function poligono(ctx: CanvasRenderingContext2D, lados: number, largura: number, altura: number, estrela = false) {
  const pontos = estrela ? lados * 2 : lados;
  for (let i = 0; i < pontos; i++) {
    const angulo = -Math.PI / 2 + (2 * Math.PI * i) / pontos;
    const raio = estrela && i % 2 ? 0.45 : 1;
    const x = largura * (1 + Math.cos(angulo) * raio) / 2;
    const y = altura * (1 + Math.sin(angulo) * raio) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function desenharForma(ctx: CanvasRenderingContext2D, largura: number, altura: number, op: Extract<OperacaoVisualPdf, { tipo: "forma" }>) {
  const margem = Math.min(op.espessura, largura / 4, altura / 4);
  ctx.translate(margem / 2, margem / 2);
  largura -= margem;
  altura -= margem;
  const meio = altura / 2;
  ctx.strokeStyle = op.cor;
  ctx.fillStyle = op.fundo;
  ctx.lineWidth = margem;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  switch (op.forma) {
    case "linha":
    case "tracejada":
    case "seta":
    case "duplaSeta": {
      if (op.forma === "tracejada") ctx.setLineDash([margem * 4, margem * 3]);
      ctx.moveTo(0, meio);
      ctx.lineTo(largura, meio);
      const ponta = Math.min(largura / 4, altura / 2);
      if (op.forma === "seta" || op.forma === "duplaSeta") {
        ctx.moveTo(largura - ponta, meio - ponta);
        ctx.lineTo(largura, meio);
        ctx.lineTo(largura - ponta, meio + ponta);
      }
      if (op.forma === "duplaSeta") {
        ctx.moveTo(ponta, meio - ponta);
        ctx.lineTo(0, meio);
        ctx.lineTo(ponta, meio + ponta);
      }
      ctx.stroke();
      return;
    }
    case "retangulo": ctx.rect(0, 0, largura, altura); break;
    case "arredondado": ctx.roundRect(0, 0, largura, altura, Math.min(largura, altura) / 5); break;
    case "elipse": ctx.ellipse(largura / 2, meio, largura / 2, meio, 0, 0, 2 * Math.PI); break;
    case "triangulo": poligono(ctx, 3, largura, altura); break;
    case "losango": poligono(ctx, 4, largura, altura); break;
    case "pentagono": poligono(ctx, 5, largura, altura); break;
    case "hexagono": poligono(ctx, 6, largura, altura); break;
    case "estrela": poligono(ctx, 5, largura, altura, true); break;
    case "cruz": {
      const pontos = [[1,0],[2,0],[2,1],[3,1],[3,2],[2,2],[2,3],[1,3],[1,2],[0,2],[0,1],[1,1]];
      ctx.moveTo(largura / 3, 0);
      pontos.slice(1).forEach(([x, y]) => ctx.lineTo(x * largura / 3, y * altura / 3));
      ctx.closePath();
      break;
    }
  }
  if (op.preencher) ctx.fill();
  ctx.stroke();
}

function desenharGrafico(ctx: CanvasRenderingContext2D, largura: number, altura: number, op: Extract<OperacaoVisualPdf, { tipo: "grafico" }>) {
  if (largura < 140 || altura < 100) throw new Error("GRAFICO_PEQUENO");
  const dados = op.dados;
  const maximo = Math.max(...dados.map(dado => dado.valor));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, largura, altura);
  const fonte = Math.min(12, largura / 18, altura / 14);
  ctx.font = `${fonte}px Arial, sans-serif`;
  ctx.textBaseline = "middle";
  if (op.grafico === "pizza") {
    const soma = dados.reduce((total, dado) => total + dado.valor, 0);
    const centro = Math.min(largura * 0.24, altura * 0.45);
    let inicio = -Math.PI / 2;
    dados.forEach((dado, i) => {
      const fim = inicio + 2 * Math.PI * dado.valor / soma;
      ctx.fillStyle = paletaGrafico[i % paletaGrafico.length];
      ctx.beginPath();
      ctx.moveTo(centro + 4, altura / 2);
      ctx.arc(centro + 4, altura / 2, centro - 2, inicio, fim);
      ctx.fill();
      inicio = fim;
      const y = (i + 0.5) * altura / dados.length;
      ctx.fillRect(largura * 0.51, y - 4, 8, 8);
      ctx.fillStyle = "#0f172a";
      ctx.fillText(`${dado.nome} · ${dado.valor}`, largura * 0.57, y, largura * 0.42);
    });
    return;
  }
  const horizontal = op.grafico === "barras";
  const esquerda = horizontal ? largura * 0.29 : fonte * 1.5;
  const topo = fonte * 1.6;
  const rodape = altura - fonte * 1.7;
  const direita = largura - 8;
  const passo = (horizontal ? rodape - topo : direita - esquerda) / dados.length;
  ctx.strokeStyle = "#64748b";
  ctx.beginPath();
  ctx.moveTo(esquerda, topo);
  ctx.lineTo(esquerda, rodape);
  ctx.lineTo(direita, rodape);
  ctx.stroke();
  const pontos: [number, number][] = [];
  dados.forEach((dado, i) => {
    const proporcao = dado.valor / maximo;
    const x = esquerda + passo * (i + 0.5);
    const y = rodape - proporcao * (rodape - topo);
    ctx.fillStyle = paletaGrafico[i % paletaGrafico.length];
    if (horizontal) {
      const meio = topo + passo * (i + 0.5);
      const larguraBarra = proporcao * (direita - esquerda - fonte * 3);
      ctx.fillRect(esquerda, meio - passo * 0.3, larguraBarra, passo * 0.6);
      ctx.fillStyle = "#0f172a";
      ctx.fillText(dado.nome, 4, meio, esquerda - 7);
      ctx.fillText(String(dado.valor), esquerda + larguraBarra + 3, meio, fonte * 2.8);
      return;
    }
    if (op.grafico === "colunas") ctx.fillRect(x - passo * 0.3, y, passo * 0.6, rodape - y);
    else pontos.push([x, y]);
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.fillText(dado.nome, x, rodape + fonte, passo - 3);
    ctx.fillText(String(dado.valor), x, y - fonte / 2, passo - 3);
  });
  if (!pontos.length) return;
  ctx.strokeStyle = "#1d4ed8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  pontos.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = "#1d4ed8";
  for (const [x, y] of pontos) {
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function escreverNaArea(ctx: CanvasRenderingContext2D, largura: number, altura: number, op: Extract<OperacaoVisualPdf, { tipo: "texto" }>) {
  const linhas = op.texto.split(/\r?\n/);
  const entrelinha = op.tamanho * 1.2;
  ctx.font = `${op.italico ? "italic " : ""}${op.negrito ? "bold " : ""}${op.tamanho}px ${op.fonte}, sans-serif`;
  if ((linhas.length - 1) * entrelinha + op.tamanho > altura || linhas.some(linha => ctx.measureText(linha).width > largura)) {
    throw new Error("TEXTO_NAO_CABE");
  }
  ctx.fillStyle = op.cor;
  ctx.textBaseline = "middle";
  linhas.forEach((linha, i) => ctx.fillText(linha, 0, op.tamanho / 2 + i * entrelinha));
}

function posicaoImagemPdf(viewport: PageViewport, area: AreaVisualPdf) {
  const x = area.x * viewport.width;
  const y = (area.y + area.altura) * viewport.height;
  const [esquerda, baixo] = viewport.convertToPdfPoint(x, y);
  const [direitaX, direitaY] = viewport.convertToPdfPoint(x + area.largura * viewport.width, y);
  const [altoX, altoY] = viewport.convertToPdfPoint(x, y - area.altura * viewport.height);
  return {
    x: esquerda,
    y: baixo,
    width: Math.hypot(direitaX - esquerda, direitaY - baixo),
    height: Math.hypot(altoX - esquerda, altoY - baixo),
    angulo: Math.atan2(direitaY - baixo, direitaX - esquerda) * 180 / Math.PI,
  };
}

const paginaInteira: AreaVisualPdf = { x: 0, y: 0, largura: 1, altura: 1 };

export async function aplicarOperacaoVisualPdf(
  pdf: PDFDocument, lib: typeof import("pdf-lib"), leitura: PDFDocumentProxy,
  numero: number, area: AreaVisualPdf, op: OperacaoVisualPdf,
) {
  const paginaLida = await leitura.getPage(numero);
  const viewport = paginaLida.getViewport({ scale: 1 });
  const largura = viewport.width * area.largura;
  const altura = viewport.height * area.altura;
  if (largura < 2 || altura < 2) throw new Error("AREA_PEQUENA");
  const escala = Math.min(3, Math.sqrt(16_000_000 / (viewport.width * viewport.height)));
  const pagina: PDFPage = pdf.getPage(numero - 1);
  const converterPagina = op.tipo === "remover" || op.tipo === "texto";
  const { canvas, ctx } = criarCanvas(converterPagina ? viewport.width : largura, converterPagina ? viewport.height : altura, escala);
  try {
    if (converterPagina) {
      await paginaLida.render({ canvas, viewport: paginaLida.getViewport({ scale: escala }) }).promise;
      ctx.setTransform(escala, 0, 0, escala, area.x * viewport.width * escala, area.y * viewport.height * escala);
      ctx.fillStyle = op.fundo;
      ctx.fillRect(0, 0, largura, altura);
      if (op.tipo === "texto") escreverNaArea(ctx, largura, altura, op);
    } else {
      ctx.scale(escala, escala);
      if (op.tipo === "forma") desenharForma(ctx, largura, altura, op);
      if (op.tipo === "grafico") desenharGrafico(ctx, largura, altura, op);
      if (op.tipo === "simbolo") {
        ctx.fillStyle = op.cor;
        ctx.font = `${altura * 0.78}px Arial, "Segoe UI Symbol", sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(op.simbolo, largura / 2, altura / 2, largura);
      }
    }
    const bytes = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
    if (!bytes) throw new Error("CANVAS");
    const imagem = await pdf.embedPng(await bytes.arrayBuffer());
    if (converterPagina) {
      // A página retocada é redesenhada a partir da imagem, sem texto selecionável ou links.
      pagina.node.delete(lib.PDFName.of("Contents"));
      pagina.node.delete(lib.PDFName.of("Annots"));
      pagina.node.set(lib.PDFName.of("Resources"), pdf.context.obj({}));
    }
    const { angulo, ...posicao } = posicaoImagemPdf(viewport, converterPagina ? paginaInteira : area);
    pagina.drawImage(imagem, { ...posicao, rotate: lib.degrees(angulo) });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
