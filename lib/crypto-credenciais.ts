import crypto from "crypto";

const ALGORITMO = "aes-256-gcm";

function obterChaveCriptografia(): Buffer {
  const segredo = process.env.CREDENTIALS_ENCRYPTION_KEY;

  if (!segredo) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY não configurada nas variáveis de ambiente."
    );
  }

  return crypto
    .createHash("sha256")
    .update(segredo)
    .digest();
}

export function criptografarCredencial(
  valor: string
): string {
  if (!valor) {
    throw new Error(
      "Credencial não informada."
    );
  }

  const chave = obterChaveCriptografia();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITMO,
    chave,
    iv
  );

  const criptografado = Buffer.concat([
    cipher.update(valor, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    criptografado.toString("base64"),
  ].join(".");
}

export function descriptografarCredencial(
  valorCriptografado: string
): string {
  if (!valorCriptografado) {
    throw new Error(
      "Credencial criptografada não informada."
    );
  }

  const partes =
    valorCriptografado.split(".");

  if (partes.length !== 3) {
    throw new Error(
      "Formato inválido da credencial criptografada."
    );
  }

  const [
    ivBase64,
    authTagBase64,
    conteudoBase64,
  ] = partes;

  const chave = obterChaveCriptografia();

  const iv = Buffer.from(
    ivBase64,
    "base64"
  );

  const authTag = Buffer.from(
    authTagBase64,
    "base64"
  );

  const conteudo = Buffer.from(
    conteudoBase64,
    "base64"
  );

  const decipher = crypto.createDecipheriv(
    ALGORITMO,
    chave,
    iv
  );

  decipher.setAuthTag(authTag);

  const descriptografado =
    Buffer.concat([
      decipher.update(conteudo),
      decipher.final(),
    ]);

  return descriptografado.toString("utf8");
}