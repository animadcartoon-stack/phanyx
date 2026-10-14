export const CORES_MARCACOES: Record<string, string> = {
  AMARELO: "#ffff00", VERDE: "#00e676", AZUL: "#102a56", ROSA: "#ff40c8",
};

export function rgbMarcacao(cor: string): [number, number, number] {
  const hex = CORES_MARCACOES[cor] || CORES_MARCACOES.AMARELO;
  return [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

export function textoMarcacaoBranco(cor: string) {
  const canais = rgbMarcacao(cor).map(v => {
    const c = v / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  const luminancia = .2126 * canais[0] + .7152 * canais[1] + .0722 * canais[2];
  return 1.05 / (luminancia + .05) > (luminancia + .05) / .05;
}

type Area = { x: number; y: number; largura: number; altura: number };
type Quadro = { x: number; y: number; w: number; h: number };

/** Repinta a partir da página limpa; não substitui letras por outra fonte nem acumula tinta. */
export function pintarMarcacoesPdf(ctx: CanvasRenderingContext2D, fonte: HTMLCanvasElement,
  quadro: Quadro, marcacoes: { cor: string; areas: Area[] }[]) {
  const largura = ctx.canvas.width, altura = ctx.canvas.height;
  ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.filter = "none";
  ctx.drawImage(fonte, 0, 0, largura, altura);
  for (const marcacao of marcacoes) {
    const cor = CORES_MARCACOES[marcacao.cor] || CORES_MARCACOES.AMARELO;
    const branco = textoMarcacaoBranco(marcacao.cor);
    for (const area of marcacao.areas) {
      const x = Math.max(0, Math.floor((quadro.x + area.x * quadro.w) * largura));
      const y = Math.max(0, Math.floor((quadro.y + area.y * quadro.h) * altura));
      const direita = Math.min(largura, Math.ceil((quadro.x + (area.x + area.largura) * quadro.w) * largura));
      const baixo = Math.min(altura, Math.ceil((quadro.y + (area.y + area.altura) * quadro.h) * altura));
      const w = direita - x, h = baixo - y;
      if (w <= 0 || h <= 0) continue;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      // Cada trecho parte da imagem original, inclusive quando há marcações sobrepostas.
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = branco ? "grayscale(1)" : "none";
      ctx.drawImage(fonte, x * fonte.width / largura, y * fonte.height / altura,
        w * fonte.width / largura, h * fonte.height / altura, x, y, w, h);
      ctx.filter = "none";
      if (branco) {
        ctx.globalCompositeOperation = "difference"; ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, w, h);
        ctx.globalCompositeOperation = "screen";
      } else ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = cor; ctx.fillRect(x, y, w, h); ctx.restore();
    }
  }
  ctx.restore();
}
