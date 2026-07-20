export const LIMITES_MODELOS_CERTIFICADO = {
  ESSENCIAL: 1,
  PROFISSIONAL: 10,
  ENTERPRISE: 20,
} as const;

export type PlanoCertificado =
  keyof typeof LIMITES_MODELOS_CERTIFICADO;

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
) {
  const planoNormalizado = normalizarPlanoCertificado(plano);

  return LIMITES_MODELOS_CERTIFICADO[planoNormalizado];
}

export function podeCriarModeloCertificado(params: {
  plano: string | null | undefined;
  quantidadeModelosAtivos: number;
}) {
  const quantidadeModelosAtivos = Math.max(
    0,
    Number(params.quantidadeModelosAtivos || 0)
  );

  const limite = obterLimiteModelosCertificado(params.plano);

  return {
    permitido: quantidadeModelosAtivos < limite,
    limite,
    utilizados: quantidadeModelosAtivos,
    restantes: Math.max(0, limite - quantidadeModelosAtivos),
    plano: normalizarPlanoCertificado(params.plano),
  };
}