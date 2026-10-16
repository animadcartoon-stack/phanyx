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
