export type PontoFormaEditavel = {
  id: string;
  x: number;
  y: number;
  tipo?: "reto" | "curvo";
  handleMode?: "alinhado" | "quebrado";
  inX?: number;
  inY?: number;
  outX?: number;
  outY?: number;
};

/** Alcas seguem a ordem do contorno e respeitam a proporcao real da forma. */
export function criarAlcasDoContorno(
  ponto: PontoFormaEditavel, pontos: PontoFormaEditavel[], fechada = true,
  largura = 100, altura = 100,
): PontoFormaEditavel {
  const sx = Math.max(0.001, Math.abs(largura) || 100) / 100;
  const sy = Math.max(0.001, Math.abs(altura) || 100) / 100;
  const entrada = Number.isFinite(ponto.inX) && Number.isFinite(ponto.inY);
  const saida = Number.isFinite(ponto.outX) && Number.isFinite(ponto.outY);
  if (entrada && saida) return { ...ponto, tipo: "curvo", handleMode: ponto.handleMode ?? "alinhado" };
  // Uma alca ja ajustada define a outra, sem inverter a tangente manual.
  if (entrada || saida) {
    const dx = saida ? ponto.outX! - ponto.x : ponto.x - ponto.inX!;
    const dy = saida ? ponto.outY! - ponto.y : ponto.y - ponto.inY!;
    return { ...ponto, tipo: "curvo", handleMode: ponto.handleMode ?? "alinhado",
      inX: entrada ? ponto.inX : ponto.x - dx, inY: entrada ? ponto.inY : ponto.y - dy,
      outX: saida ? ponto.outX : ponto.x + dx, outY: saida ? ponto.outY : ponto.y + dy };
  }
  const index = pontos.findIndex((p) => p.id === ponto.id);
  function vizinho(direcao: number) {
    if (index < 0) return null;
    for (let passo = 1; passo < pontos.length; passo++) {
      const posicao = index + direcao * passo;
      if (!fechada && (posicao < 0 || posicao >= pontos.length)) break;
      const p = pontos[(posicao + pontos.length) % pontos.length];
      const x = (p.x - ponto.x) * sx, y = (p.y - ponto.y) * sy;
      const distancia = Math.hypot(x, y);
      if (distancia > 1e-8) return { x, y, distancia };
    }
    return null;
  }
  const anterior = vizinho(-1), proximo = vizinho(1);
  let dx = (anterior ? -anterior.x / anterior.distancia : 0) + (proximo ? proximo.x / proximo.distancia : 0);
  let dy = (anterior ? -anterior.y / anterior.distancia : 0) + (proximo ? proximo.y / proximo.distancia : 0);
  let norma = Math.hypot(dx, dy);
  if (norma < 1e-8) {
    dx = proximo?.x ?? -(anterior?.x ?? -1);
    dy = proximo?.y ?? -(anterior?.y ?? 0);
    norma = Math.hypot(dx, dy) || 1;
  }
  const distancias = [anterior?.distancia, proximo?.distancia].filter((d): d is number => d !== undefined);
  const tamanho = distancias.length ? Math.min(Math.min(sx, sy) * 18, ...distancias.map((d) => d / 3)) : 0;
  const tx = dx / norma * tamanho / sx, ty = dy / norma * tamanho / sy;
  return { ...ponto, tipo: "curvo", handleMode: "alinhado",
    inX: ponto.x - tx, inY: ponto.y - ty, outX: ponto.x + tx, outY: ponto.y + ty };
}

export function selecionarPontoForma(ids: string[], id: string, adicionar: boolean) {
  if (!adicionar) return ids.includes(id) ? ids : [id];
  return ids.includes(id) ? ids.filter((atual) => atual !== id) : [...ids, id];
}

export function pontosDentroDaCaixa(
  pontos: { id: string; x: number; y: number }[],
  inicio: { x: number; y: number }, fim: { x: number; y: number },
) {
  const minX = Math.min(inicio.x, fim.x), maxX = Math.max(inicio.x, fim.x);
  const minY = Math.min(inicio.y, fim.y), maxY = Math.max(inicio.y, fim.y);
  return pontos.filter((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY).map((p) => p.id);
}

/** Divide apenas arestas existentes; nunca cria diagonais entre cantos. */
export function subdividirPontosForma(
  pontos: PontoFormaEditavel[], fechada: boolean, selecionados: string[],
  criarId: () => string = () => crypto.randomUUID(),
) {
  const existentes = new Set(pontos.map((p) => p.id));
  const ids = new Set(selecionados.filter((id) => existentes.has(id)));
  const todos = ids.size === 0;
  const segmentos = pontos.map((p, i) =>
    (fechada || i < pontos.length - 1) &&
    (todos || (ids.has(p.id) && ids.has(pontos[(i + 1) % pontos.length].id))),
  );
  if (pontos.length < 2 || !segmentos.some(Boolean)) return { pontos, novosIds: [] as string[], selecionados: [...ids] };
  const ajustados = pontos.map((p) => ({ ...p }));
  const inseridos = new Map<number, PontoFormaEditavel>();
  const novosIds: string[] = [];
  const meio = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  pontos.forEach((a, i) => {
    if (!segmentos[i]) return;
    const j = (i + 1) % pontos.length, b = pontos[j];
    const id = criarId();
    const curva = a.tipo === "curvo" || b.tipo === "curvo" || a.outX !== undefined || b.inX !== undefined;
    let novo: PontoFormaEditavel;
    if (curva) {
      // De Casteljau em t=0.5: as duas metades reproduzem a curva original.
      const c1 = { x: a.outX ?? a.x, y: a.outY ?? a.y };
      const c2 = { x: b.inX ?? b.x, y: b.inY ?? b.y };
      const q0 = meio(a, c1), q1 = meio(c1, c2), q2 = meio(c2, b);
      const r0 = meio(q0, q1), r1 = meio(q1, q2), m = meio(r0, r1);
      ajustados[i].outX = q0.x; ajustados[i].outY = q0.y;
      ajustados[j].inX = q2.x; ajustados[j].inY = q2.y;
      novo = { id, ...m, tipo: "curvo", handleMode: "alinhado", inX: r0.x, inY: r0.y, outX: r1.x, outY: r1.y };
    } else novo = { id, ...meio(a, b), tipo: "reto" };
    inseridos.set(i, novo); novosIds.push(id);
  });
  const resultado: PontoFormaEditavel[] = [];
  ajustados.forEach((p, i) => { resultado.push(p); const novo = inseridos.get(i); if (novo) resultado.push(novo); });
  const idsNovos = new Set(novosIds);
  return { pontos: resultado, novosIds, selecionados: todos ? [] : resultado.filter((p) => ids.has(p.id) || idsNovos.has(p.id)).map((p) => p.id) };
}

/** Pontos novos numa reta nao encurtam o raio dos cantos ja existentes. */
export function pontosDoContornoArredondado(pontos: PontoFormaEditavel[], raios: Record<string, number>) {
  const contorno = pontos.filter((p, i) => {
    if (raios[p.id] !== 0 || pontos.length <= 3) return true;
    const a = pontos[(i - 1 + pontos.length) % pontos.length], b = pontos[(i + 1) % pontos.length];
    const ax = p.x - a.x, ay = p.y - a.y, bx = b.x - p.x, by = b.y - p.y;
    const cruzamento = ax * by - ay * bx;
    const alinhado = Math.abs(cruzamento) <= 1e-9 * Math.max(1, Math.hypot(ax, ay) * Math.hypot(bx, by));
    return !(alinhado && ax * bx + ay * by >= 0);
  });
  return contorno.length >= 3 ? contorno : pontos;
}

/** Aplica a mesma escala e rotacao as alcas de cada ponto selecionado. */
export function ajustarTangentesEmConjunto(
  pontos: PontoFormaEditavel[], selecionados: string[], referenciaId: string,
  lado: "in" | "out", novoX: number, novoY: number,
) {
  const ids = new Set(selecionados);
  const referencia = pontos.find((p) => p.id === referenciaId);
  if (!referencia || !ids.has(referenciaId) || !Number.isFinite(novoX) || !Number.isFinite(novoY)) return pontos;
  const vetor = (p: PontoFormaEditavel, chave: "in" | "out") => ({
    x: (chave === "in" ? (p.inX ?? p.x - 18) : (p.outX ?? p.x + 18)) - p.x,
    y: (chave === "in" ? (p.inY ?? p.y) : (p.outY ?? p.y)) - p.y,
  });
  const original = vetor(referencia, lado);
  const destino = { x: novoX - referencia.x, y: novoY - referencia.y };
  const denominador = original.x * original.x + original.y * original.y;
  if (denominador < 1e-12) return pontos;
  const a = (original.x * destino.x + original.y * destino.y) / denominador;
  const b = (original.x * destino.y - original.y * destino.x) / denominador;
  const zerado = Math.hypot(destino.x, destino.y) < 1e-6;
  return pontos.map((p) => {
    if (!ids.has(p.id)) return p;
    if (zerado) return { ...p, tipo: "reto" as const, handleMode: "quebrado" as const, inX: undefined, inY: undefined, outX: undefined, outY: undefined };
    const entrada = vetor(p, "in"), saida = vetor(p, "out");
    return { ...p, tipo: "curvo" as const, handleMode: p.handleMode ?? "alinhado",
      inX: p.x + a * entrada.x - b * entrada.y, inY: p.y + b * entrada.x + a * entrada.y,
      outX: p.x + a * saida.x - b * saida.y, outY: p.y + b * saida.x + a * saida.y,
    };
  });
}

export type PadraoTangentesForma = "aleatorio" | "onda-direita" | "onda-esquerda";

/** Orienta as tangentes; mantem ancoras, IDs e pontos fora da selecao. */
export function aplicarPadraoTangentesForma(
  pontos: PontoFormaEditavel[], selecionados: string[], modo: PadraoTangentesForma,
  fechada = true, aleatorio: () => number = Math.random,
) {
  if (pontos.length < 2) return pontos;
  const ids = new Set(selecionados);
  return pontos.map((p, i) => {
    if (ids.size && !ids.has(p.id)) return p;
    const anterior = pontos[i ? i - 1 : fechada ? pontos.length - 1 : 0];
    const proximo = pontos[i < pontos.length - 1 ? i + 1 : fechada ? 0 : i];
    const distancias = [Math.hypot(p.x - anterior.x, p.y - anterior.y), Math.hypot(proximo.x - p.x, proximo.y - p.y)].filter((d) => d > 1e-9);
    const tamanho = Math.min(24, (distancias.length ? Math.min(...distancias) : 0) * 0.3);
    const anguloBase = Math.atan2(proximo.y - anterior.y, proximo.x - anterior.x);
    const angulo = modo === "aleatorio" ? aleatorio() * Math.PI * 2 : anguloBase + (modo === "onda-direita" ? 1 : -1) * Math.PI / 4;
    const intensidade = tamanho * (modo === "aleatorio" ? 0.5 + aleatorio() : 1);
    const dx = Math.cos(angulo) * intensidade, dy = Math.sin(angulo) * intensidade;
    return { ...p, tipo: "curvo" as const, handleMode: "alinhado" as const,
      inX: p.x - dx, inY: p.y - dy, outX: p.x + dx, outY: p.y + dy,
    };
  });
}
