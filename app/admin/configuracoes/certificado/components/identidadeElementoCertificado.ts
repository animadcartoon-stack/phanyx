// IDs locais negativos, exclusivos inclusive com varios elementos no mesmo milissegundo.
let ultimoIdLocal = -Date.now() * 1000;
export function criarIdElementoCertificado() {
  ultimoIdLocal -= 1;
  return ultimoIdLocal;
}

const ativacoesProcessadas = new WeakSet<object>();
export function ativarInsercaoBibliotecaCertificado(
  evento: { detail?: number; nativeEvent?: object }, inserir: () => void,
) {
  // Um duplo clique na mesma ferramenta insere uma vez, sem debounce ou atraso.
  if (Number(evento.detail || 0) > 1) return;
  const nativo = evento.nativeEvent;
  if (nativo && ativacoesProcessadas.has(nativo)) return;
  if (nativo) ativacoesProcessadas.add(nativo);
  inserir();
}

// A mesma identidade nao pode aparecer duas vezes na cena nem no historico.
// Elementos diferentes que tenham colidido mantem seu conteudo e ganham IDs proprios.
export function normalizarIdentidadesCertificado<T extends { id: number }>(itens: T[]): T[] {
  const vistos = new Map<number, T>();
  let resultado: T[] | null = null;
  let ocupados: Set<number> | null = null;
  itens.forEach((item, index) => {
    const anterior = vistos.get(item.id);
    if (!anterior) {
      vistos.set(item.id, item);
      resultado?.push(item);
      return;
    }
    if (!resultado) resultado = itens.slice(0, index);
    if (anterior === item || JSON.stringify(anterior) === JSON.stringify(item)) return;
    if (!ocupados) ocupados = new Set(itens.map(item => item.id));
    let id = criarIdElementoCertificado();
    while (ocupados.has(id)) id = criarIdElementoCertificado();
    ocupados.add(id);
    const dados = (item as any).dadosJson;
    const separado = {
      ...item, id, tempId: id, bancoId: undefined,
      ...(dados && typeof dados === "object" ? { dadosJson: { ...dados, id: undefined, tempId: id, bancoId: undefined } } : {}),
    };
    vistos.set(id, separado);
    resultado.push(separado);
  });
  return resultado || itens;
}
