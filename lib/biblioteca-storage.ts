import "server-only";

export const BIBLIOTECA_BLOB_ACCESS = "private" as const;

export const BIBLIOTECA_BLOB_TOKEN_ENV =
  "BIBLIOTECA_BLOB_READ_WRITE_TOKEN";

export const BIBLIOTECA_BLOB_STORE_ID_ENV =
  "BIBLIOTECA_BLOB_STORE_ID";

export const MIME_TYPES_BIBLIOTECA_PERMITIDOS = [
  // PDF
  "application/pdf",

  // EPUB
  "application/epub+zip",
  "application/x-epub+zip",

  // Áudio
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",

  // Vídeo
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const EXTENSOES_BIBLIOTECA_PERMITIDAS = [
  "pdf",
  "epub",

  "mp3",
  "m4a",
  "wav",
  "ogg",

  "mp4",
  "webm",
  "mov",
] as const;

export function obterTokenBibliotecaBlob() {
  const token =
    process.env.BIBLIOTECA_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "BIBLIOTECA_BLOB_READ_WRITE_TOKEN não está configurado."
    );
  }

  return token;
}

export function obterStoreIdBibliotecaBlob() {
  return (
    process.env.BIBLIOTECA_BLOB_STORE_ID ||
    null
  );
}

export function obterExtensaoArquivo(
  nomeArquivo: string
) {
  const nome = String(nomeArquivo || "").trim();

  const ultimaParte =
    nome.split(".").pop()?.toLowerCase() || "";

  if (
    !ultimaParte ||
    ultimaParte === nome.toLowerCase()
  ) {
    return "";
  }

  return ultimaParte;
}

export function extensaoBibliotecaPermitida(
  nomeArquivo: string
) {
  const extensao =
    obterExtensaoArquivo(nomeArquivo);

  return (
    EXTENSOES_BIBLIOTECA_PERMITIDAS as readonly string[]
  ).includes(extensao);
}

export function mimeTypeBibliotecaPermitido(
  mimeType?: string | null
) {
  const tipo =
    String(mimeType || "")
      .trim()
      .toLowerCase();

  if (!tipo) {
    return false;
  }

  return (
    MIME_TYPES_BIBLIOTECA_PERMITIDOS as readonly string[]
  ).includes(tipo);
}

export function limparNomeArquivoBiblioteca(
  nomeArquivo: string
) {
  const nomeOriginal =
    String(nomeArquivo || "").trim();

  const extensao =
    obterExtensaoArquivo(nomeOriginal);

  const semExtensao =
    extensao
      ? nomeOriginal.slice(
          0,
          -(extensao.length + 1)
        )
      : nomeOriginal;

  const nomeSeguro =
    semExtensao
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120) || "arquivo";

  if (!extensao) {
    return nomeSeguro;
  }

  return `${nomeSeguro}.${extensao}`;
}

export function prefixoArquivoBiblioteca({
  instituicaoId,
  itemId,
}: {
  instituicaoId: number;
  itemId: number;
}) {
  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new Error(
      "Instituição inválida para armazenamento da Biblioteca."
    );
  }

  if (
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    throw new Error(
      "Item inválido para armazenamento da Biblioteca."
    );
  }

  return [
    "biblioteca",
    `instituicao-${instituicaoId}`,
    `item-${itemId}`,
  ].join("/");
}