import crypto from "node:crypto";

function segredoRenderCracha() {
  const segredo =
    process.env.CRACHA_RENDER_SECRET ||
    process.env.CERTIFICADO_RENDER_SECRET ||
    process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error(
      "CRACHA_RENDER_SECRET, CERTIFICADO_RENDER_SECRET ou JWT_SECRET não configurado."
    );
  }

  return segredo;
}

export function criarTokenRenderCracha(crachaEmitidoId: number | string) {
  return crypto
    .createHmac("sha256", segredoRenderCracha())
    .update(String(crachaEmitidoId))
    .digest("hex");
}

export function validarTokenRenderCracha(
  crachaEmitidoId: number | string,
  tokenRecebido?: string | null
) {
  if (!tokenRecebido) return false;

  const tokenEsperado = criarTokenRenderCracha(crachaEmitidoId);

  const esperado = Buffer.from(tokenEsperado);
  const recebido = Buffer.from(tokenRecebido);

  if (esperado.length !== recebido.length) {
    return false;
  }

  return crypto.timingSafeEqual(esperado, recebido);
}