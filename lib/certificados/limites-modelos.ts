export const LIMITES_MODELOS_CERTIFICADO = {
  ESSENCIAL: 1,
  PROFISSIONAL: 20,
  ENTERPRISE: null,
} as const;

export type PlanoCertificado =
  keyof typeof LIMITES_MODELOS_CERTIFICADO;

export type LimiteModelosCertificado =
  | number
  | null;

export function normalizarPlanoCertificado(
  plano: string | null | undefined
): PlanoCertificado {
  const planoNormalizado = String(plano || "")
    .trim()
    .toUpperCase();

  if (planoNormalizado === "PROFISSIONAL") {
    return "PROFISSIONAL";
  }

  if (planoNormalizado === "ENTERPRISE") {
    return "ENTERPRISE";
  }

  /*
   * Qualquer plano vazio, desconhecido ou antigo recebe o limite
   * mais seguro, equivalente ao plano Essencial.
   */
  return "ESSENCIAL";
}

export function obterLimiteModelosCertificado(
  plano: string | null | undefined
): LimiteModelosCertificado {
  const planoNormalizado =
    normalizarPlanoCertificado(plano);

  return LIMITES_MODELOS_CERTIFICADO[
    planoNormalizado
  ];
}

export function podeCriarModeloCertificado(params: {
  plano: string | null | undefined;
  quantidadeModelosAtivos: number;
}) {
  const quantidadeModelosAtivos = Math.max(
    0,
    Number(params.quantidadeModelosAtivos || 0)
  );

  const plano =
    normalizarPlanoCertificado(params.plano);

  const limite =
    obterLimiteModelosCertificado(plano);

  const ilimitado = limite === null;

  const permitido = ilimitado
    ? true
    : quantidadeModelosAtivos < limite;

  const restantes = ilimitado
    ? null
    : Math.max(
        0,
        limite - quantidadeModelosAtivos
      );

  return {
    permitido,
    limite,
    ilimitado,
    utilizados: quantidadeModelosAtivos,
    restantes,
    plano,
  };
}