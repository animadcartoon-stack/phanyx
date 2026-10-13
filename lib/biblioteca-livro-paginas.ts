export function paginasLivro(pagina: number, total: number, dupla: boolean) {
  if (!dupla) return { esquerda: null, direita: pagina };
  if (pagina === 1) return { esquerda: null, direita: 1 };
  const esquerda = Math.floor(pagina / 2) * 2;
  return { esquerda, direita: esquerda + 1 <= total ? esquerda + 1 : null };
}
export function destinoViradaLivro(pagina: number, total: number, dupla: boolean, sentido: 1 | -1) {
  if (!dupla) return Math.min(total, Math.max(1, pagina + sentido));
  const par = paginasLivro(pagina, total, true);
  if (sentido === -1) return !par.esquerda || par.esquerda === 2 ? 1 : par.esquerda - 2;
  if (!par.esquerda) return Math.min(total, 2);
  return par.esquerda + 2 <= total ? par.esquerda + 2 : pagina;
}
