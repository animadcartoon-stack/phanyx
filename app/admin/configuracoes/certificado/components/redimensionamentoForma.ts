export type EixoRedimensionamentoForma = "ambos" | "largura" | "altura";

type CaixaForma = {
  x: number;
  y: number;
  largura: number;
  altura: number;
  rotate?: number | null;
  flipX?: boolean | null;
  flipY?: boolean | null;
};

/** O deslocamento chega em unidades do papel, depois de descontar o zoom. */
export function calcularRedimensionamentoForma(
  inicial: CaixaForma,
  deslocamento: { x: number; y: number },
  eixo: EixoRedimensionamentoForma,
  peloCentro: boolean,
  manterProporcao: boolean,
  alturaMinima = 20,
) {
  const angulo = Number(inicial.rotate || 0) * Math.PI / 180;
  const cos = Math.cos(angulo), sin = Math.sin(angulo);
  const sinalX = inicial.flipX ? -1 : 1, sinalY = inicial.flipY ? -1 : 1;
  const dx = (deslocamento.x * cos + deslocamento.y * sin) * sinalX;
  const dy = (-deslocamento.x * sin + deslocamento.y * cos) * sinalY;
  const multiplicador = peloCentro ? 2 : 1;
  const larguraAlvo = inicial.largura + (eixo !== "altura" ? dx * multiplicador : 0);
  const alturaAlvo = inicial.altura + (eixo !== "largura" ? dy * multiplicador : 0);
  let largura = eixo === "altura" ? inicial.largura : Math.max(20, larguraAlvo);
  let altura = eixo === "largura" ? inicial.altura : Math.max(alturaMinima, alturaAlvo);

  if (manterProporcao && eixo === "ambos") {
    const fatorX = larguraAlvo / inicial.largura, fatorY = alturaAlvo / inicial.altura;
    const fator = Math.max(20 / inicial.largura, alturaMinima / inicial.altura,
      Math.abs(fatorX - 1) >= Math.abs(fatorY - 1) ? fatorX : fatorY);
    largura = inicial.largura * fator;
    altura = inicial.altura * fator;
  }

  largura = Number(largura.toFixed(3));
  altura = Number(altura.toFixed(3));
  // Sem Alt, o canto oposto fica fixo no papel, mesmo com giro ou espelhamento.
  const metadeX = peloCentro ? 0 : (largura - inicial.largura) * sinalX / 2;
  const metadeY = peloCentro ? 0 : (altura - inicial.altura) * sinalY / 2;
  const centroX = inicial.x + inicial.largura / 2 + metadeX * cos - metadeY * sin;
  const centroY = inicial.y + inicial.altura / 2 + metadeX * sin + metadeY * cos;
  return { x: centroX - largura / 2, y: centroY - altura / 2, largura, altura };
}
