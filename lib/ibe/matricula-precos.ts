export const INSTITUICAO_ID_PADRAO = 1;

export const VALOR_DISCIPLINA = 110;
export const VALOR_SEMESTRE_COMPLETO = 550;
export const VALOR_SEMESTRE_6_COMPLETO = 660;
export const VALOR_CURSO_COMPLETO = 3000;

export function normalizarNomeDisciplina(nome: string) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export function calcularValorDisciplina(nome: string) {
  const nomeNormalizado = normalizarNomeDisciplina(nome);

  if (
    nomeNormalizado.includes("TRABALHO DE CONCLUSAO DE CURSO B") ||
    /\bTCC\s*B\b/.test(nomeNormalizado)
  ) {
    return 220;
  }

  return VALOR_DISCIPLINA;
}

export function calcularValorModuloCompleto(numeroModulo: number) {
  return numeroModulo === 6
    ? VALOR_SEMESTRE_6_COMPLETO
    : VALOR_SEMESTRE_COMPLETO;
}