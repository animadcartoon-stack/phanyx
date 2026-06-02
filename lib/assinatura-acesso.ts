export type StatusAssinaturaPhanyx =
  | "ATIVA"
  | "EM_ATRASO"
  | "SUSPENSA"
  | "CANCELADA";

export function assinaturaPermiteUso(
  status: string | null | undefined
) {
  const statusNormalizado = (status || "ATIVA").toUpperCase();

  return statusNormalizado === "ATIVA" || statusNormalizado === "EM_ATRASO";
}

export function assinaturaBloqueada(
  status: string | null | undefined
) {
  const statusNormalizado = (status || "ATIVA").toUpperCase();

  return statusNormalizado === "SUSPENSA" || statusNormalizado === "CANCELADA";
}

export function mensagemBloqueioAssinatura(
  status: string | null | undefined
) {
  const statusNormalizado = (status || "ATIVA").toUpperCase();

  if (statusNormalizado === "EM_ATRASO") {
    return "A assinatura da instituição está em atraso. Alguns recursos poderão ser bloqueados se o pagamento não for regularizado.";
  }

  if (statusNormalizado === "SUSPENSA") {
    return "A assinatura da instituição está suspensa. Regularize o pagamento para continuar usando os recursos do PHANYX.";
  }

  if (statusNormalizado === "CANCELADA") {
    return "A assinatura da instituição está cancelada. Entre em contato com o comercial para reativar o acesso.";
  }

  return "";
}