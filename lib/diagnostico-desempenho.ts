type Detalhe = Record<string, string | number>;
type Amostra = Record<string, string | number | Detalhe[]>;
const LIMITE = 150;
const CHAVE_SESSAO = "phanyx:diagnostico-desempenho";

/** A ativação expira nesta aba e não depende de manter a query na navegação. */
export function diagnosticoSolicitado(busca: string, sessao: Pick<Storage, "getItem" | "setItem" | "removeItem">, agora = Date.now()) {
  const pedido = new URLSearchParams(busca).get("diagnostico");
  try {
    if (pedido === "off") { sessao.removeItem(CHAVE_SESSAO); return false; }
    if (pedido === "desempenho") {
      sessao.setItem(CHAVE_SESSAO, String(agora + 15 * 60 * 1000));
      return true;
    }
    const expira = Number(sessao.getItem(CHAVE_SESSAO));
    return Number.isFinite(expira) && expira > agora && expira <= agora + 15 * 60 * 1000;
  } catch { return pedido === "desempenho"; }
}

export function origemScriptDiagnostico(valor: string, origem: string) {
  if (!valor) return "inline";
  try {
    const url = new URL(valor, origem);
    if (!/^https?:$/.test(url.protocol)) return "outro";
    if (url.origin !== origem) return `externo:${url.hostname}`;
    return url.pathname.startsWith("/_next/static/") ? url.pathname : "script-local";
  } catch { return "desconhecido"; }
}

type QuadroLongo = PerformanceEntry & {
  blockingDuration?: number;
  renderStart?: number;
  styleAndLayoutStart?: number;
  scripts?: Array<{
    startTime: number;
    duration: number;
    sourceURL?: string;
    sourceCharPosition?: number;
    invokerType?: string;
    forcedStyleAndLayoutDuration?: number;
    pauseDuration?: number;
  }>;
};
const numero = (valor = 0) => Math.round(Math.max(0, valor) * 10) / 10;

export function amostraQuadroLongo(entry: QuadroLongo, origem: string): Amostra {
  const fim = entry.startTime + entry.duration;
  const tipos = ["user-callback", "event-listener", "resolve-promise", "reject-promise", "classic-script", "module-script"];
  return {
    inicioMs: numero(entry.startTime), duracaoMs: numero(entry.duration),
    bloqueioMs: numero(entry.blockingDuration),
    renderizacaoMs: entry.renderStart ? numero(fim - entry.renderStart) : 0,
    estiloLayoutMs: entry.styleAndLayoutStart ? numero(fim - entry.styleAndLayoutStart) : 0,
    scripts: (entry.scripts || []).slice().sort((a, b) => b.duration - a.duration).slice(0, 10).map(script => ({
      inicioMs: numero(script.startTime), duracaoMs: numero(script.duration),
      origem: origemScriptDiagnostico(script.sourceURL || "", origem),
      posicao: script.sourceCharPosition ?? -1,
      chamada: tipos.includes(script.invokerType || "") ? script.invokerType! : "outro",
      estiloLayoutForcadoMs: numero(script.forcedStyleAndLayoutDuration),
      pausaMs: numero(script.pauseDuration),
    })),
  };
}

/** Mede somente chamadas lentas; nunca registra chaves, valores ou pilhas. */
export function observarStorageLento(proto: Storage, relatar: (amostra: Amostra) => void, agora = () => performance.now()) {
  const restaurar: Array<() => void> = [];
  for (const operacao of ["getItem", "setItem", "removeItem", "clear"] as const) {
    const original = proto[operacao];
    const wrapper = function (this: Storage, ...args: string[]) {
      const inicio = agora();
      try { return Reflect.apply(original, this, args); }
      finally {
        const duracao = agora() - inicio;
        if (duracao >= 16) {
          try { relatar({ operacao, inicioMs: numero(inicio), duracaoMs: numero(duracao) }); } catch { /* A medição não interfere na operação. */ }
        }
      }
    };
    try {
      Object.defineProperty(proto, operacao, { configurable: true, writable: true, value: wrapper });
      restaurar.push(() => {
        if (proto[operacao] === wrapper) Object.defineProperty(proto, operacao, { configurable: true, writable: true, value: original });
      });
    } catch { /* O navegador pode bloquear instrumentação de APIs nativas. */ }
  }
  return () => restaurar.forEach(fn => fn());
}

export function caminhoDiagnostico(valor: string, origem: string) {
  try {
    const url = new URL(valor, origem);
    if (url.origin !== origem) return null;
    if (!/^\/(admin(?:\/|$)|api\/|_next\/)/.test(url.pathname)) return null;
    return url.pathname.replace(/\/\d+(?=\/|$)/g, "/:id");
  } catch { return null; }
}

export function criarRegistroDesempenho() {
  const amostras: Record<string, Amostra[]> = {
    navegacoes: [], recursos: [], tarefasLongas: [], interacoes: [], quadrosLongos: [], storageLento: [],
  };
  const descartadas: Record<string, number> = {};
  return {
    adicionar(tipo: keyof typeof amostras, amostra: Amostra) {
      const lista = amostras[tipo];
      if (!lista) return;
      if (lista.length === LIMITE) { lista.shift(); descartadas[tipo] = (descartadas[tipo] || 0) + 1; }
      lista.push(amostra);
    },
    exportar() { return { versao: 2, amostras, descartadas }; },
  };
}
