export const TIPOS_AGENDA = {
  AULA: "AULA",
  PROVA: "PROVA",
  ATIVIDADE: "ATIVIDADE",
  REUNIAO: "REUNIAO",
  FERIAS_RH: "FERIAS_RH",
  ESCALA_RH: "ESCALA_RH",
  SEM_PROFESSOR: "SEM_PROFESSOR",
} as const;

export type TipoAgenda =
  (typeof TIPOS_AGENDA)[keyof typeof TIPOS_AGENDA];