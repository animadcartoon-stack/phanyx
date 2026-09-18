import "server-only";

export const MOBILIDADE_BLOB_ACCESS =
  "private" as const;

export const MOBILIDADE_BLOB_TOKEN_ENV =
  "MOBILIDADE_BLOB_READ_WRITE_TOKEN";

export const MOBILIDADE_BLOB_STORE_ID_ENV =
  "MOBILIDADE_BLOB_STORE_ID";

export const LIMITE_ARQUIVO_MOBILIDADE_BYTES =
  25 * 1024 * 1024;

const EXTENSOES_PERMITIDAS =
  new Set([
    "pdf",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "doc",
    "docx",
  ]);

const MIME_POR_EXTENSAO: Record<
  string,
  string
> = {
  pdf:
    "application/pdf",

  jpg:
    "image/jpeg",

  jpeg:
    "image/jpeg",

  png:
    "image/png",

  webp:
    "image/webp",

  doc:
    "application/msword",

  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function obterTokenMobilidadeBlob() {
  const token =
    process.env
      .MOBILIDADE_BLOB_READ_WRITE_TOKEN
      ?.trim();

  if (!token) {
    throw new Error(
      "MOBILIDADE_BLOB_READ_WRITE_TOKEN não está configurado."
    );
  }

  return token;
}

export function obterStoreIdMobilidadeBlob() {
  return (
    process.env
      .MOBILIDADE_BLOB_STORE_ID
      ?.trim() ||
    null
  );
}

export function obterExtensaoArquivoMobilidade(
  nomeArquivo: string
) {
  const nome =
    String(
      nomeArquivo || ""
    ).trim();

  const ultima =
    nome
      .split(".")
      .pop()
      ?.toLowerCase() ??
    "";

  if (
    !ultima ||
    ultima ===
      nome.toLowerCase()
  ) {
    return "";
  }

  return ultima;
}

export function extensaoMobilidadePermitida(
  extensao: string
) {
  return EXTENSOES_PERMITIDAS.has(
    extensao.toLowerCase()
  );
}

export function mimeEsperadoMobilidade(
  extensao: string
) {
  return (
    MIME_POR_EXTENSAO[
      extensao.toLowerCase()
    ] ??
    null
  );
}

export function mimeMobilidadePermitido(
  mimeType: string,
  extensao: string
) {
  const esperado =
    mimeEsperadoMobilidade(
      extensao
    );

  return Boolean(
    esperado &&
      esperado ===
        mimeType
          .trim()
          .toLowerCase()
  );
}

export function limparNomeArquivoMobilidade(
  nomeArquivo: string
) {
  const nomeOriginal =
    String(
      nomeArquivo || ""
    ).trim();

  const extensao =
    obterExtensaoArquivoMobilidade(
      nomeOriginal
    );

  const semExtensao =
    extensao
      ? nomeOriginal.slice(
          0,
          -(
            extensao.length +
            1
          )
        )
      : nomeOriginal;

  const nomeSeguro =
    semExtensao
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      )
      .slice(
        0,
        100
      ) ||
    "documento";

  return extensao
    ? `${nomeSeguro}.${extensao}`
    : nomeSeguro;
}

export function prefixoDocumentoMobilidade(
  {
    instituicaoId,
    candidaturaId,
    documentoId,
  }: {
    instituicaoId: number;
    candidaturaId: number;
    documentoId: number;
  }
) {
  return [
    "mobilidade",
    `instituicao-${instituicaoId}`,
    `candidatura-${candidaturaId}`,
    `documento-${documentoId}`,
  ].join("/");
}
