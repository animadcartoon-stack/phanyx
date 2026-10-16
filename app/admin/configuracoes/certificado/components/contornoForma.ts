type Ponto = { id: string; x: number; y: number };
export type TrechoContorno = { de: string; para: string };
type Aparencia = {
  forma?: string | null;
  opacity?: number | null;
  preenchimentoOpacidade?: number | null;
  contornoOpacidade?: number | null;
  contornoEspessura?: number | null;
  espessurasContornoPontos?: Record<string, number> | null;
  trechosContornoOcultos?: TrechoContorno[] | null;
};

export function opacidadeDaForma(campo: Aparencia, canal: "preenchimento" | "contorno") {
  const limitar = (valor: number) => Number.isFinite(valor) ? Math.max(0, Math.min(1, valor)) : 1;
  const geral = limitar(Number(campo.opacity ?? 1));
  const canalValor = Number((canal === "preenchimento" ? campo.preenchimentoOpacidade : campo.contornoOpacidade) ?? 1);
  return geral * limitar(canalValor);
}

export function espessuraBaseContorno(campo: Aparencia) {
  const valor = Number(campo.contornoEspessura ?? 2);
  return campo.forma === "LINHA" ? valor || 4 : campo.forma === "ESTRELA" ? Math.max(4, valor) : Math.max(1, valor);
}

export function espessuraNoPonto(campo: Aparencia, id: string) {
  const valor = Number(campo.espessurasContornoPontos?.[id] ?? espessuraBaseContorno(campo));
  return Number.isFinite(valor) ? Math.max(0, Math.min(40, valor)) : espessuraBaseContorno(campo);
}

export function trechosSelecionados(pontos: Ponto[], ids: string[], fechada: boolean) {
  const selecao = new Set(ids);
  return pontos.flatMap((p, i) => {
    const proximo = pontos[(i + 1) % pontos.length];
    return (fechada || i < pontos.length - 1) && selecao.has(p.id) && selecao.has(proximo.id)
      ? [{ de: p.id, para: proximo.id }] : [];
  });
}

type Amostra = { x: number; y: number; s: number };
type Segmento = { d: string; largura: number };

/** Amostra somente M/L/Q/C/Z, os comandos emitidos pelo renderizador de formas. */
function amostrarPath(path: string, largura: number, altura: number) {
  const tokens = path.match(/[MLQCZ]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || [];
  const comandos = tokens.filter((v) => /^[MLQCZ]$/i.test(v)).length;
  const passos = Math.max(2, Math.min(32, Math.floor(4096 / Math.max(1, comandos))));
  const amostras: Amostra[] = [];
  let i = 0, atual = { x: 0, y: 0 }, primeiro = atual;
  const adicionar = (p: { x: number; y: number }) => {
    const anterior = amostras[amostras.length - 1];
    const s = anterior ? anterior.s + Math.hypot((p.x - anterior.x) * largura / 100, (p.y - anterior.y) * altura / 100) : 0;
    amostras.push({ ...p, s });
  };
  const ponto = () => ({ x: Number(tokens[i++]), y: Number(tokens[i++]) });
  while (i < tokens.length) {
    const comando = tokens[i++].toUpperCase();
    if (comando === "M") { atual = ponto(); primeiro = atual; adicionar(atual); continue; }
    if (comando === "Z") { adicionar(primeiro); atual = primeiro; continue; }
    if (!["L", "Q", "C"].includes(comando)) return [];
    const inicio = atual, a = ponto(), b = comando !== "L" ? ponto() : a, fim = comando === "C" ? ponto() : b;
    for (let n = 1; n <= passos; n++) {
      const t = n / passos, u = 1 - t;
      adicionar(comando === "L" ? { x: u * inicio.x + t * fim.x, y: u * inicio.y + t * fim.y }
        : comando === "Q" ? { x: u * u * inicio.x + 2 * u * t * a.x + t * t * fim.x, y: u * u * inicio.y + 2 * u * t * a.y + t * t * fim.y }
        : { x: u ** 3 * inicio.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t ** 3 * fim.x, y: u ** 3 * inicio.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t ** 3 * fim.y });
    }
    atual = fim;
  }
  return amostras;
}

/** Contorno vetorial por trechos; a opacidade e aplicada uma unica vez ao grupo. */
export function gerarTrechosContorno(
  path: string, pontos: Ponto[], campo: Aparencia,
  largura = 100, altura = 100,
): Segmento[] | null {
  const ids = new Set(pontos.map((p) => p.id));
  const temPerfil = Object.keys(campo.espessurasContornoPontos || {}).some((id) => ids.has(id));
  const ocultos = (campo.trechosContornoOcultos || []).filter((t) => ids.has(t.de) && ids.has(t.para));
  if (!temPerfil && !ocultos.length) return null;
  const amostras = amostrarPath(path, largura, altura);
  const total = amostras[amostras.length - 1]?.s || 0;
  if (!total || !pontos.length) return [];
  const fechada = campo.forma !== "LINHA";
  const nos = pontos.map((p, indice) => {
    let melhorDistancia = Infinity, melhorS = 0;
    const esperado = indice / Math.max(1, fechada ? pontos.length : pontos.length - 1) * total;
    for (let i = 1; i < amostras.length; i++) {
      const a = amostras[i - 1], b = amostras[i];
      const ax = (p.x - a.x) * largura / 100, ay = (p.y - a.y) * altura / 100;
      const dx = (b.x - a.x) * largura / 100, dy = (b.y - a.y) * altura / 100;
      const t = Math.max(0, Math.min(1, (ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
      const distancia = Math.hypot(ax - t * dx, ay - t * dy), s = a.s + t * (b.s - a.s);
      if (distancia < melhorDistancia - 1e-8 || (Math.abs(distancia - melhorDistancia) <= 1e-8 && Math.abs(s - esperado) < Math.abs(melhorS - esperado))) { melhorDistancia = distancia; melhorS = s; }
    }
    return { id: p.id, s: melhorS, largura: espessuraNoPonto(campo, p.id) };
  }).sort((a, b) => a.s - b.s);
  const noPorId = new Map(nos.map((n) => [n.id, n]));
  const intervalos = ocultos.flatMap((t) => {
    const a = noPorId.get(t.de)!, b = noPorId.get(t.para)!;
    return a.s <= b.s ? [[a.s, b.s]] : fechada ? [[a.s, total], [0, b.s]] : [];
  });
  const larguraEm = (s: number) => {
    let a = nos[nos.length - 1], b = nos[0], posA = a.s, posB = b.s;
    if (fechada) {
      if (s < b.s) posA -= total; else posB += total;
    } else {
      if (s <= b.s) return b.largura;
      if (s >= a.s) return a.largura;
    }
    for (let i = 1; i < nos.length; i++) if (s >= nos[i - 1].s && s <= nos[i].s) { a = nos[i - 1]; b = nos[i]; posA = a.s; posB = b.s; break; }
    const t = Math.max(0, Math.min(1, (s - posA) / (posB - posA || 1)));
    return a.largura + (b.largura - a.largura) * t;
  };
  const segmentos: Segmento[] = [];
  const cortes = nos.map((n) => n.s);
  for (let i = 1; i < amostras.length; i++) {
    const a = amostras[i - 1], b = amostras[i];
    if (b.s - a.s < 1e-9) continue;
    const limites = [a.s, ...cortes.filter((s) => s > a.s + 1e-8 && s < b.s - 1e-8), b.s];
    for (let j = 1; j < limites.length; j++) {
      const inicio = limites[j - 1], fim = limites[j], meio = (inicio + fim) / 2;
      if (intervalos.some(([min, max]) => meio >= min && meio <= max)) continue;
      const t1 = (inicio - a.s) / (b.s - a.s), t2 = (fim - a.s) / (b.s - a.s);
      const valor = larguraEm(meio) * (fechada ? 2 : 1);
      if (valor <= 1e-8) continue;
      segmentos.push({ d: `M ${a.x + (b.x - a.x) * t1} ${a.y + (b.y - a.y) * t1} L ${a.x + (b.x - a.x) * t2} ${a.y + (b.y - a.y) * t2}`, largura: valor });
    }
  }
  return segmentos;
}
