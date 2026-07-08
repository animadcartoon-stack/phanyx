export type StatusAssinaturaPhanyx =
  | "TESTE_GRATIS"
  | "ATIVA"
  | "EM_ATRASO"
  | "SUSPENSA"
  | "CANCELADA";

type DataTeste = Date | string | null | undefined;

function normalizarStatus(status: string | null | undefined) {
  return String(status || "ATIVA").trim().toUpperCase();
}

function dataAindaValida(data: DataTeste) {
  if (!data) {
    return false;
  }

  const fim = new Date(data);

  if (Number.isNaN(fim.getTime())) {
    return false;
  }

  return fim.getTime() >= Date.now();
}

function dataExpirada(data: DataTeste) {
  if (!data) {
    return false;
  }

  const fim = new Date(data);

  if (Number.isNaN(fim.getTime())) {
    return false;
  }

  return fim.getTime() < Date.now();
}

export function assinaturaPermiteUso(
  status: string | null | undefined,
  isentaPagamento?: boolean | null,
  testeGratisFimEm?: DataTeste
) {
  if (isentaPagamento) {
    return true;
  }

  const statusNormalizado = normalizarStatus(status);

  if (statusNormalizado === "ATIVA" || statusNormalizado === "EM_ATRASO") {
    return true;
  }

  if (statusNormalizado === "TESTE_GRATIS") {
    // Se ainda não recebemos a data nesse ponto do sistema, não bloqueia por segurança.
    // O bloqueio real por data deve acontecer onde a assinatura completa for consultada.
    if (!testeGratisFimEm) {
      return true;
    }

    return dataAindaValida(testeGratisFimEm);
  }

  if (statusNormalizado === "CANCELADA") {
    // Regra PHANYX:
    // cancelou durante os 60 dias grátis -> mantém acesso até o fim do teste.
    return dataAindaValida(testeGratisFimEm);
  }

  return false;
}

export function assinaturaBloqueada(
  status: string | null | undefined,
  isentaPagamento?: boolean | null,
  testeGratisFimEm?: DataTeste
) {
  if (isentaPagamento) {
    return false;
  }

  const statusNormalizado = normalizarStatus(status);

  if (statusNormalizado === "SUSPENSA") {
    return true;
  }

  if (statusNormalizado === "CANCELADA") {
    // Só bloqueia se o teste já terminou.
    return !dataAindaValida(testeGratisFimEm);
  }

  if (statusNormalizado === "TESTE_GRATIS") {
    return dataExpirada(testeGratisFimEm);
  }

  return false;
}

export function mensagemBloqueioAssinatura(
  status: string | null | undefined,
  isentaPagamento?: boolean | null,
  testeGratisFimEm?: DataTeste
) {
  if (isentaPagamento) {
    return "";
  }

  const statusNormalizado = normalizarStatus(status);

  if (statusNormalizado === "EM_ATRASO") {
    return "A assinatura da instituição está em atraso. Alguns recursos poderão ser bloqueados se o pagamento não for regularizado.";
  }

  if (statusNormalizado === "SUSPENSA") {
    return "A assinatura da instituição está suspensa. Regularize o pagamento para continuar usando os recursos do PHANYX.";
  }

  if (statusNormalizado === "TESTE_GRATIS" && dataExpirada(testeGratisFimEm)) {
    return "O período gratuito da instituição terminou. Reative a assinatura para continuar usando o PHANYX.";
  }

  if (statusNormalizado === "CANCELADA") {
    if (dataAindaValida(testeGratisFimEm)) {
      return "A assinatura foi cancelada, mas o acesso permanecerá liberado até o fim do período gratuito.";
    }

    return "O período gratuito terminou e a assinatura da instituição está cancelada. Reative a assinatura para continuar usando o PHANYX.";
  }

  return "";
}