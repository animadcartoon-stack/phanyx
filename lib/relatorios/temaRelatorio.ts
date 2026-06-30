export type CorRelatorio =
  | "AZUL"
  | "VERDE"
  | "PRETO"
  | "CINZA"
  | "AMARELO"
  | "ROXO"
  | "ROSA"
  | "VERMELHO";

type TemaRelatorio = {
  fundo: string;
  texto: string;
};

const TEMAS: Record<CorRelatorio, TemaRelatorio> = {
  AZUL: {
    fundo: "FF1E3A8A",
    texto: "FFFFFFFF",
  },

  VERDE: {
    fundo: "FF15803D",
    texto: "FFFFFFFF",
  },

  PRETO: {
    fundo: "FF111827",
    texto: "FFFFFFFF",
  },

  CINZA: {
    fundo: "FFCBD5E1",
    texto: "FF111827",
  },

  AMARELO: {
    fundo: "FFFACC15",
    texto: "FF111827",
  },

  ROXO: {
    fundo: "FF7C3AED",
    texto: "FFFFFFFF",
  },

  ROSA: {
    fundo: "FFEC4899",
    texto: "FFFFFFFF",
  },

  VERMELHO: {
    fundo: "FFDC2626",
    texto: "FFFFFFFF",
  },
};

export function obterTemaRelatorio(
  cor?: string | null
): TemaRelatorio {
  return (
    TEMAS[(cor as CorRelatorio) || "AZUL"] ??
    TEMAS.AZUL
  );
}