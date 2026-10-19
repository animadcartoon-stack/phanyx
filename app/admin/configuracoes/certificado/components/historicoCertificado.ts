// Um registro por gesto; a previa da forma livre pertence ao historico de pontos.
export function criarHistoricoCertificado<T extends { id: number }>(inicial: T[]) {
  let campos = inicial;
  let passado: T[][] = [];
  let futuro: T[][] = [];
  let ultimoGrupo: object | null = null;
  const ouvintes = new Set<() => void>();
  const permanentes = (itens: T[]) => itens.filter((item) => item.id !== -999999);
  // Os atualizadores do editor preservam a referencia dos elementos inalterados.
  // So os elementos substituidos precisam ter seus dados comparados.
  const iguais = (a: T[], b: T[]) => a === b || (a.length === b.length &&
    a.every((item, index) => item === b[index] || JSON.stringify(item) === JSON.stringify(b[index])));
  const copias = new WeakMap<T, T>();
  const copiar = (itens: T[]): T[] => permanentes(itens).map((item) => {
    const existente = copias.get(item);
    if (existente) return existente;
    const copia: T = JSON.parse(JSON.stringify(item));
    copias.set(item, copia);
    copias.set(copia, copia);
    return copia;
  });
  const publicar = () => ouvintes.forEach((ouvinte) => ouvinte());

  return {
    getSnapshot: () => campos,
    subscribe(ouvinte: () => void) {
      ouvintes.add(ouvinte);
      return () => { ouvintes.delete(ouvinte); };
    },
    alterar(atualizador: T[] | ((anteriores: T[]) => T[]), grupo: object) {
      const proximos = typeof atualizador === "function" ? atualizador(campos) : atualizador;
      if (iguais(proximos, campos)) return;
      if (!iguais(permanentes(proximos), permanentes(campos))) {
        if (grupo !== ultimoGrupo) passado = [...passado, copiar(campos)].slice(-100);
        futuro = [];
        ultimoGrupo = grupo;
      }
      campos = proximos;
      publicar();
    },
    limpar() {
      passado = [];
      futuro = [];
      ultimoGrupo = null;
    },
    desfazer() {
      if (!passado.length) return;
      futuro = [copiar(campos), ...futuro].slice(0, 100);
      campos = passado[passado.length - 1];
      passado = passado.slice(0, -1);
      ultimoGrupo = null;
      publicar();
    },
    refazer() {
      if (!futuro.length) return;
      passado = [...passado, copiar(campos)].slice(-100);
      campos = futuro[0];
      futuro = futuro.slice(1);
      ultimoGrupo = null;
      publicar();
    },
  };
}
