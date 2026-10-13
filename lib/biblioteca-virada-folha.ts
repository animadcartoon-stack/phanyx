// A folha enrola em torno de uma dobra diagonal. O PDF permanece na camada de leitura.
export const DURACAO_VIRADA_FOLHA = 1120;
export type SentidoViradaFolha = "next" | "previous";
type Ponto = { x: number; y: number };
type Matriz = { a: number; b: number; c: number; d: number; e: number; f: number };
type Faixa = { pontos: Ponto[]; matriz: Matriz; angulo: number };

function recortar(pontos: Ponto[], nx: number, ny: number, limite: number, menor: boolean) {
  const saida: Ponto[] = [];
  for (let i = 0; i < pontos.length; i++) {
    const a = pontos[i]; const b = pontos[(i + 1) % pontos.length];
    const da = a.x * nx + a.y * ny - limite; const db = b.x * nx + b.y * ny - limite;
    const dentroA = menor ? da <= 0 : da >= 0; const dentroB = menor ? db <= 0 : db >= 0;
    if (dentroA) saida.push(a);
    if (dentroA !== dentroB) {
      const fator = da / (da - db);
      saida.push({ x: a.x + (b.x - a.x) * fator, y: a.y + (b.y - a.y) * fator });
    }
  }
  return saida;
}
function projetar(pontos: Ponto[], matriz: Matriz) {
  return pontos.map(({ x, y }) => ({ x: matriz.a * x + matriz.c * y + matriz.e, y: matriz.b * x + matriz.d * y + matriz.f }));
}

export function curvaFolha(largura: number, altura: number, progresso: number, sentido: SentidoViradaFolha) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progresso) ? progresso : 0));
  const angulo = .15 + .5 * (1 - p) ** 1.2;
  const nx = Math.cos(angulo) * (sentido === "next" ? 1 : -1); const ny = Math.sin(angulo);
  const raio = Math.min(largura, altura) * (.035 + .03 * Math.sin(Math.PI * p));
  const arco = Math.PI * raio;
  const maximo = Math.max(0, nx * largura) + ny * altura;
  const dobra = maximo - (Math.abs(nx) * largura + ny * altura + largura * .35 + arco) * p;
  const retangulo = [{ x: 0, y: 0 }, { x: largura, y: 0 }, { x: largura, y: altura }, { x: 0, y: altura }];
  function matriz(inicio: number, fim: number, plano = false): Matriz {
    const a = plano ? arco - inicio : raio * Math.sin(inicio / raio);
    const b = plano ? arco - fim : raio * Math.sin(fim / raio);
    const escala = (b - a) / (fim - inicio);
    const deslocamento = a - escala * inicio - (escala - 1) * dobra;
    return { a: 1 + (escala - 1) * nx * nx, b: (escala - 1) * nx * ny,
      c: (escala - 1) * nx * ny, d: 1 + (escala - 1) * ny * ny,
      e: nx * deslocamento, f: ny * deslocamento };
  }
  const frente = recortar(retangulo, nx, ny, dobra, true);
  const faixas: Faixa[] = [];
  for (let i = 0; i < 48; i++) {
    const inicio = arco * i / 48; const fim = arco * (i + 1) / 48;
    const pontos = recortar(recortar(retangulo, nx, ny, dobra + inicio, false), nx, ny, dobra + fim, true);
    if (pontos.length < 3) continue;
    const transformacao = matriz(inicio, fim);
    faixas.push({ pontos: projetar(pontos, transformacao), matriz: transformacao, angulo: (inicio + fim) / (2 * raio) });
  }
  const versoOriginal = recortar(retangulo, nx, ny, dobra + arco, false);
  const versoMatriz = matriz(arco, arco + 1, true);
  return { frente, faixas, verso: projetar(versoOriginal, versoMatriz), versoMatriz, nx, ny, dobra, raio, progresso: p };
}

function caminho(ctx: CanvasRenderingContext2D, pontos: Ponto[]) {
  ctx.beginPath();
  pontos.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath();
}
function preencher(ctx: CanvasRenderingContext2D, pontos: Ponto[], cor: string) {
  if (pontos.length < 3) return;
  caminho(ctx, pontos); ctx.fillStyle = cor; ctx.fill();
}
function imagem(ctx: CanvasRenderingContext2D, pontos: Ponto[], origem: HTMLCanvasElement,
  largura: number, altura: number, matriz?: Matriz, opacidade = 1) {
  if (pontos.length < 3) return;
  ctx.save(); caminho(ctx, pontos); ctx.clip(); ctx.globalAlpha = opacidade;
  if (matriz) ctx.transform(matriz.a, matriz.b, matriz.c, matriz.d, matriz.e, matriz.f);
  ctx.drawImage(origem, 0, 0, largura, altura); ctx.restore();
}

export function desenharViradaFolha(ctx: CanvasRenderingContext2D, origem: HTMLCanvasElement,
  largura: number, altura: number, progresso: number, sentido: SentidoViradaFolha) {
  ctx.clearRect(0, 0, largura, altura);
  if (progresso <= 0) { ctx.drawImage(origem, 0, 0, largura, altura); return; }
  if (progresso >= 1) return;
  const folha = curvaFolha(largura, altura, progresso, sentido);
  const sombra = Math.sin(Math.PI * progresso);
  // A sombra acompanha a parte levantada, sem escurecer o documento inteiro.
  ctx.save(); ctx.shadowColor = `rgba(15,23,42,${.22 * sombra})`;
  ctx.shadowBlur = folha.raio * .9; ctx.shadowOffsetX = -folha.nx * folha.raio * .3;
  ctx.shadowOffsetY = folha.raio * .35; preencher(ctx, folha.verso, "#fffdf6"); ctx.restore();
  imagem(ctx, folha.frente, origem, largura, altura);
  for (const faixa of folha.faixas) {
    if (faixa.angulo < Math.PI / 2) imagem(ctx, faixa.pontos, origem, largura, altura, faixa.matriz);
    else {
      preencher(ctx, faixa.pontos, "#fffdf6");
      imagem(ctx, faixa.pontos, origem, largura, altura, faixa.matriz, .035);
    }
    const escuro = Math.sin(faixa.angulo) ** 2 * .22;
    preencher(ctx, faixa.pontos, `rgba(40,32,24,${escuro})`);
  }
  preencher(ctx, folha.verso, "#fffdf6");
  imagem(ctx, folha.verso, origem, largura, altura, folha.versoMatriz, .035);
  // A luz varia na faixa curva, dando volume ao papel junto à dobra.
  if (folha.verso.length > 2) {
    ctx.save(); caminho(ctx, folha.verso); ctx.clip();
    const a = folha.dobra - folha.raio * 2; const b = folha.dobra + folha.raio;
    const luz = ctx.createLinearGradient(folha.nx * a, folha.ny * a, folha.nx * b, folha.ny * b);
    luz.addColorStop(0, "rgba(78,64,48,0)"); luz.addColorStop(.62, "rgba(78,64,48,.015)");
    luz.addColorStop(1, "rgba(78,64,48,.14)"); ctx.fillStyle = luz; ctx.fillRect(0, 0, largura, altura); ctx.restore();
  }
}
