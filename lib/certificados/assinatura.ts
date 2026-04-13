import crypto from "crypto";

type PayloadAssinaturaCertificado = {
  id: number;
  alunoId: number;
  disciplinaId: number;
  instituicaoId: number;
  emitidoEm: Date | string;
};

function getCertificateSecret() {
  const secret = process.env.CERTIFICATE_SECRET?.trim();

  if (!secret) {
    throw new Error("CERTIFICATE_SECRET não configurado.");
  }

  return secret;
}

function normalizarData(data: Date | string) {
  return new Date(data).toISOString();
}

export function gerarHashCertificado(payload: PayloadAssinaturaCertificado) {
  const secret = getCertificateSecret();

  const base = [
    payload.id,
    payload.alunoId,
    payload.disciplinaId,
    payload.instituicaoId,
    normalizarData(payload.emitidoEm),
  ].join(":");

  return crypto
    .createHmac("sha256", secret)
    .update(base)
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
}

export function gerarCodigoCertificado(payload: PayloadAssinaturaCertificado) {
  const hash = gerarHashCertificado(payload);
  return `PHX-CERT-${payload.id}-${hash}`;
}

export function validarCodigoEstrutura(codigo: string) {
  return /^PHX-CERT-\d+-[A-F0-9]{24}$/.test(codigo);
}