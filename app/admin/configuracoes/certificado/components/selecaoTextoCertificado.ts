export type MarcacaoTextoCertificado = { inicio: number; fim: number; texto?: string };

export function marcarSelecaoTextoCertificado(editor: HTMLElement, range: Range): MarcacaoTextoCertificado | null {
  if (range.collapsed || !editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  const antes = editor.ownerDocument.createRange();
  antes.selectNodeContents(editor);
  antes.setEnd(range.startContainer, range.startOffset);
  const inicio = antes.toString().length;
  antes.setEnd(range.endContainer, range.endOffset);
  const fim = antes.toString().length;
  return fim > inicio ? { inicio, fim, texto: range.toString() } : null;
}

export function recuperarSelecaoTextoCertificado(editor: HTMLElement, marcacao: MarcacaoTextoCertificado | null | undefined): Range | null {
  if (!marcacao || marcacao.fim <= marcacao.inicio) return null;
  const walker = editor.ownerDocument.createTreeWalker(editor, 4);
  let total = 0;
  let inicio: { node: Node; offset: number } | null = null;
  let fim: { node: Node; offset: number } | null = null;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const tamanho = node.textContent?.length || 0;
    if (!inicio && marcacao.inicio <= total + tamanho) inicio = { node, offset: marcacao.inicio - total };
    if (marcacao.fim <= total + tamanho) { fim = { node, offset: marcacao.fim - total }; break; }
    total += tamanho;
  }
  if (!inicio || !fim || inicio.offset < 0 || fim.offset < 0) return null;
  const range = editor.ownerDocument.createRange();
  range.setStart(inicio.node, inicio.offset);
  range.setEnd(fim.node, fim.offset);
  if (marcacao.texto !== undefined && range.toString() !== marcacao.texto) return null;
  return range;
}

// Restaurar um Range no navegador pode focar o contentEditable no Chromium.
// Controles do painel conservam o foco; a marcacao continua disponivel na memoria.
export function exibirSelecaoTextoCertificado(editor: HTMLElement, range: Range) {
  const ativo = editor.ownerDocument.activeElement;
  if (ativo !== editor && !editor.contains(ativo)) return;
  const selecao = editor.ownerDocument.defaultView?.getSelection();
  selecao?.removeAllRanges();
  selecao?.addRange(range.cloneRange());
}
