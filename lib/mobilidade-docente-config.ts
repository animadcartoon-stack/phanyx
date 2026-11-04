export const CHAVE_MOBILIDADE_DOCENTE = "professor.mobilidade";
export const CHAVE_INSCRICOES_DOCENTES = "professor.mobilidade.inscricoes";

export const PUBLICOS_MOBILIDADE = ["ALUNOS", "PROFESSORES", "AMBOS"] as const;
export type PublicoMobilidade = (typeof PUBLICOS_MOBILIDADE)[number];

export function publicoMobilidadeValido(valor: unknown): valor is PublicoMobilidade {
  return PUBLICOS_MOBILIDADE.some((publico) => publico === valor);
}
