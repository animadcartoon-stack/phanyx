export const COOKIE_MASTER_SUPORTE = "phanyx_master_token";

async function calcularVinculoSessaoMaster(tokenMaster: string) {
  const bytes = new TextEncoder().encode(tokenMaster);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

/** O middleware confere o vínculo. A rota de destino ainda valida a assinatura do token. */
export async function tokenSuporteVinculadoAoMaster(
  token: string | undefined,
  tokenMaster: string | undefined
) {
  if (!token) return true;

  let vinculo: unknown;
  try {
    const parte = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const dados = JSON.parse(atob(parte));
    if (dados.impersonacao !== true) return true;
    vinculo = dados.vinculoSessaoMaster;
  } catch {
    return true;
  }

  // Sessões emitidas antes do vínculo conservam o prazo curto original.
  if (vinculo === undefined) return true;
  if (typeof vinculo !== "string" || !tokenMaster) return false;
  return vinculo === await calcularVinculoSessaoMaster(tokenMaster);
}
