import crypto from "node:crypto";

function segredoRenderCertificado() {
  const segredo =
    process.env.CERTIFICADO_RENDER_SECRET || process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error(
      "CERTIFICADO_RENDER_SECRET ou JWT_SECRET não configurado."
    );
  }

  return segredo;
}

export function criarTokenRenderCertificado(certificadoId: number | string) {
  return crypto
    .createHmac("sha256", segredoRenderCertificado())
    .update(String(certificadoId))
    .digest("hex");
}

export function validarTokenRenderCertificado(
  certificadoId: number | string,
  tokenRecebido?: string | null
) {
  if (!tokenRecebido) return false;

  const tokenEsperado = criarTokenRenderCertificado(certificadoId);

  const esperado = Buffer.from(tokenEsperado);
  const recebido = Buffer.from(tokenRecebido);

  if (esperado.length !== recebido.length) return false;

  return crypto.timingSafeEqual(esperado, recebido);
}