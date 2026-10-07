import "server-only";

export const ATIVIDADE_EXTERNA_DOCUMENTOS_BLOB_ACCESS =
  "private" as const;

export const ATIVIDADE_EXTERNA_DOCUMENTOS_BLOB_STORE_ID_ENV =
  "ATIVIDADE_EXTERNA_DOCUMENTOS_STORE_ID";

export const LIMITE_DOCUMENTO_ATIVIDADE_EXTERNA_BYTES =
  25 * 1024 * 1024;

const EXTENSOES_DOCUMENTO_ATIVIDADE_EXTERNA_PERMITIDAS =
  new Set([
    "pdf",

    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
    "heif",

    "doc",
    "docx",

    "xls",
    "xlsx",
  ]);

const MIME_POR_EXTENSAO: Record<
  string,
  string[]
> = {
  pdf: [
    "application/pdf",
  ],

  jpg: [
    "image/jpeg",
  ],

  jpeg: [
    "image/jpeg",
  ],

  png: [
    "image/png",
  ],

  webp: [
    "image/webp",
  ],

  heic: [
    "image/heic",
    "image/heif",
  ],

  heif: [
    "image/heif",
    "image/heic",
  ],

  doc: [
    "application/msword",
  ],

  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  xls: [
    "application/vnd.ms-excel",
  ],

  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

export const ATIVIDADE_EXTERNA_DOCUMENTOS_BLOB_READ_WRITE_TOKEN_ENV =
  "ATIVIDADE_EXTERNA_DOCUMENTOS_READ_WRITE_TOKEN";
export function obterStoreIdDocumentoAtividadeExternaBlob() {
  const storeId =
    process.env
      .ATIVIDADE_EXTERNA_DOCUMENTOS_STORE_ID
      ?.trim() ||
    process.env
      .MOBILIDADE_STORE_ID
      ?.trim() ||
    process.env
      .BLOB_STORE_ID
      ?.trim();

  if (storeId) {
    return storeId;
  }

  const token =
    process.env
      .BLOB_READ_WRITE_TOKEN
      ?.trim();

  if (token) {
    const partes =
      token.split("_");

    const storeIdDoToken =
      partes[3]?.trim();

    if (storeIdDoToken) {
      return storeIdDoToken;
    }
  }

  throw new Error(
    "Nenhuma credencial de Blob configurada."
  );
}
export function obterTokenDocumentoAtividadeExternaBlob() {
  const token =
    process.env[
      ATIVIDADE_EXTERNA_DOCUMENTOS_BLOB_READ_WRITE_TOKEN_ENV
    ]?.trim();

  if (!token) {
    throw new Error(
      "Credencial do Blob privado de documentos externos nao configurada."
    );
  }

  return token;
}
export function obterExtensaoDocumentoAtividadeExterna(
  nomeArquivo: string
) {
  const nome =
    String(
      nomeArquivo || ""
    ).trim();

  const ultimaParte =
    nome
      .split(".")
      .pop()
      ?.toLowerCase() ??
    "";

  if (
    !ultimaParte ||
    ultimaParte ===
      nome.toLowerCase()
  ) {
    return "";
  }

  return ultimaParte;
}

export function extensaoDocumentoAtividadeExternaPermitida(
  extensao: string
) {
  return (
    EXTENSOES_DOCUMENTO_ATIVIDADE_EXTERNA_PERMITIDAS
      .has(
        String(
          extensao || ""
        )
          .trim()
          .toLowerCase()
      )
  );
}

export function mimeEsperadoDocumentoAtividadeExterna(
  extensao: string
) {
  const chave =
    String(
      extensao || ""
    )
      .trim()
      .toLowerCase();

  return (
    MIME_POR_EXTENSAO[
      chave
    ] ??
    []
  );
}

export function mimeDocumentoAtividadeExternaPermitido(
  mimeType: string,
  extensao: string
) {
  const mime =
    String(
      mimeType || ""
    )
      .trim()
      .toLowerCase();

  if (!mime) {
    return false;
  }

  return (
    mimeEsperadoDocumentoAtividadeExterna(
      extensao
    ).includes(
      mime
    )
  );
}

export function limparNomeDocumentoAtividadeExterna(
  nomeArquivo: string
) {
  const nomeOriginal =
    String(
      nomeArquivo || ""
    ).trim();

  const extensao =
    obterExtensaoDocumentoAtividadeExterna(
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
      .normalize(
        "NFD"
      )
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
        120
      ) ||
    "documento";

  return extensao
    ? `${nomeSeguro}.${extensao}`
    : nomeSeguro;
}

export function prefixoDocumentoAtividadeExterna(
  {
    instituicaoId,
    atividadeExternaId,
    documentoId,
  }: {
    instituicaoId: number;
    atividadeExternaId: number;
    documentoId?: number | null;
  }
) {
  if (
    !Number.isInteger(
      instituicaoId
    ) ||
    instituicaoId <= 0
  ) {
    throw new Error(
      "Instituicao invalida para armazenamento."
    );
  }

  if (
    !Number.isInteger(
      atividadeExternaId
    ) ||
    atividadeExternaId <= 0
  ) {
    throw new Error(
      "Atividade externa invalida para armazenamento."
    );
  }

  if (
    documentoId !== undefined &&
    documentoId !== null &&
    (
      !Number.isInteger(
        documentoId
      ) ||
      documentoId <= 0
    )
  ) {
    throw new Error(
      "Documento invalido para armazenamento."
    );
  }

  const partes = [
    "atividades-externas",
    `instituicao-${instituicaoId}`,
    `atividade-${atividadeExternaId}`,
  ];

  if (
    documentoId !== undefined &&
    documentoId !== null
  ) {
    partes.push(
      `documento-${documentoId}`
    );
  }

  return partes.join(
    "/"
  );
}