type Amostra = Record<string, string | number>;
const LIMITE = 150;

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
    navegacoes: [], recursos: [], tarefasLongas: [], interacoes: [],
  };
  const descartadas: Record<string, number> = {};
  return {
    adicionar(tipo: keyof typeof amostras, amostra: Amostra) {
      const lista = amostras[tipo];
      if (!lista) return;
      if (lista.length === LIMITE) { lista.shift(); descartadas[tipo] = (descartadas[tipo] || 0) + 1; }
      lista.push(amostra);
    },
    exportar() { return { versao: 1, amostras, descartadas }; },
  };
}
