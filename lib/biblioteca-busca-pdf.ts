export type IntervaloBuscaPdf = { inicio: number; fim: number };
export type AreaBuscaPdf = { x: number; y: number; largura: number; altura: number };

/** Mantém os offsets originais, mesmo quando acentos e espaços são normalizados. */
function indiceBuscaPdf(texto: string) {
  let normalizado = "", offset = 0;
  const inicios: number[] = [], finais: number[] = [];
  for (const caractere of texto) {
    const fim = offset + caractere.length;
    const parte = caractere.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (const letra of parte) {
      const valor = /\s/u.test(letra) ? " " : letra;
      if (valor === " " && normalizado.endsWith(" ")) { finais[finais.length - 1] = fim; continue; }
      normalizado += valor;
      for (let i = 0; i < valor.length; i++) { inicios.push(offset); finais.push(fim); }
    }
    // Inclui marcas combinantes que pertencem à letra anterior.
    if (!parte && finais.length) finais[finais.length - 1] = fim;
    offset = fim;
  }
  return { normalizado, inicios, finais };
}

export function localizarTermoPdf(texto: string, termo: string, limite = 500): IntervaloBuscaPdf[] {
  const consulta = indiceBuscaPdf(termo).normalizado.trim();
  if (!consulta || limite < 1) return [];
  const indice = indiceBuscaPdf(texto), encontrados: IntervaloBuscaPdf[] = [];
  let posicao = 0;
  while (encontrados.length < limite) {
    const inicio = indice.normalizado.indexOf(consulta, posicao);
    if (inicio < 0) break;
    encontrados.push({ inicio: indice.inicios[inicio], fim: indice.finais[inicio + consulta.length - 1] });
    posicao = inicio + consulta.length;
  }
  return encontrados;
}

/** Mede a seleção invisível do PDF sem modificar seus spans nem criar anotações. */
export function areasTermoPdf(camada: HTMLElement, termo: string): AreaBuscaPdf[] {
  if (!termo.trim()) return [];
  const bounds = camada.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return [];
  const segmentos: { node: Text; inicio: number; fim: number }[] = [];
  const walker = document.createTreeWalker(camada, NodeFilter.SHOW_TEXT);
  let conteudo = "", node: Node | null;
  while ((node = walker.nextNode())) {
    const valor = node.textContent || "";
    if (!valor) continue;
    if (segmentos.length) conteudo += " ";
    const inicio = conteudo.length; conteudo += valor;
    segmentos.push({ node: node as Text, inicio, fim: conteudo.length });
  }
  const areas: AreaBuscaPdf[] = [];
  for (const match of localizarTermoPdf(conteudo, termo)) {
    const primeiro = segmentos.find((s) => s.inicio <= match.inicio && s.fim > match.inicio);
    const ultimo = segmentos.find((s) => s.inicio < match.fim && s.fim >= match.fim);
    if (!primeiro || !ultimo) continue;
    const range = document.createRange();
    range.setStart(primeiro.node, match.inicio - primeiro.inicio);
    range.setEnd(ultimo.node, match.fim - ultimo.inicio);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.width <= 0 || rect.height <= 0) continue;
      const x = Math.max(0, (rect.left - bounds.left) / bounds.width);
      const y = Math.max(0, (rect.top - bounds.top) / bounds.height);
      const largura = Math.min(1 - x, rect.width / bounds.width);
      const altura = Math.min(1 - y, rect.height / bounds.height);
      if (largura > 0 && altura > 0) areas.push({ x, y, largura, altura });
      if (areas.length >= 2000) return areas;
    }
  }
  return areas;
}
