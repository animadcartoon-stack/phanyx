/**
 * Guarda central de exclusão de combos. A ausência de status no count é intencional:
 * inclusive vínculos cancelados/arquivados impedem excluir o pacote.
 */
export function comboPodeSerExcluido(totalMatriculas: number, totalContratos: number): boolean {
  if (![totalMatriculas, totalContratos].every(n => Number.isSafeInteger(n) && n >= 0)) {
    throw new Error("Contagens de vínculos inválidas; exclusão bloqueada.");
  }
  return totalMatriculas === 0 && totalContratos === 0;
}
