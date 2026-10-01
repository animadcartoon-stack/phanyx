import {
  isIP,
} from "node:net";

import {
  lookup,
} from "node:dns/promises";

import JSZip from "jszip";

import {
  uploadArquivo,
} from "@/lib/storage/uploadArquivo";

const LIMITE_CAPA_BYTES =
  4 * 1024 * 1024;

const LIMITE_ZIP_BYTES =
  80 * 1024 * 1024;

const LIMITE_ARQUIVOS_ZIP =
  5_000;

const LIMITE_TOTAL_DESCOMPACTADO =
  250 * 1024 * 1024;

const EXTENSOES_IMAGEM =
  new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
  ]);

type OrigemCapa =
  | "ZIP"
  | "URL"
  | "ISBN";

export type ResultadoCapaImportada = {
  url: string;
  origem: OrigemCapa;
  referencia: string;
};

export type RegistroParaCapa = {
  itemId: number;
  linha: number;
  titulo: string;

  arquivoCapa?: string | null;
  capaUrl?: string | null;
  miniaturaUrl?: string | null;

  isbn10?: string | null;
  isbn13?: string | null;
  idLegado?: string | null;

  codigoBarras?: string | null;
  numeroTombo?: string | null;
  patrimonio?: string | null;
};

export type IndiceCapasZip = {
  arquivos: Map<
    string,
    {
      nome: string;
      bytes: Uint8Array;
      mimeType: string;
    }
  >;

  quantidade: number;
};

function extensao(
  nome: string,
) {
  const parte =
    nome
      .split(".")
      .pop()
      ?.toLowerCase() ??
    "";

  return parte;
}

function normalizarReferencia(
  valor:
    | string
    | null
    | undefined,
) {
  return String(
    valor ?? "",
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /\.[a-z0-9]{2,5}$/i,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      "",
    );
}

function isbnLimpo(
  valor:
    | string
    | null
    | undefined,
) {
  return String(
    valor ?? "",
  )
    .toUpperCase()
    .replace(
      /[^0-9X]/g,
      "",
    );
}

function detectarImagem(
  bytes: Uint8Array,
) {
  if (
    bytes.length >= 8 &&
    [
      137,
      80,
      78,
      71,
      13,
      10,
      26,
      10,
    ].every(
      (valor, indice) =>
        bytes[indice] ===
        valor,
    )
  ) {
    return {
      mimeType:
        "image/png",
      extensao:
        "png",
    };
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  ) {
    return {
      mimeType:
        "image/jpeg",
      extensao:
        "jpg",
    };
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(
      ...bytes.slice(
        0,
        4,
      ),
    ) === "RIFF" &&
    String.fromCharCode(
      ...bytes.slice(
        8,
        12,
      ),
    ) === "WEBP"
  ) {
    return {
      mimeType:
        "image/webp",
      extensao:
        "webp",
    };
  }

  return null;
}

function ipv4Privado(
  ip: string,
) {
  const partes =
    ip
      .split(".")
      .map(Number);

  if (
    partes.length !== 4 ||
    partes.some(
      (item) =>
        !Number.isInteger(
          item,
        ),
    )
  ) {
    return false;
  }

  const [a, b] =
    partes;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (
      a === 169 &&
      b === 254
    ) ||
    (
      a === 172 &&
      b >= 16 &&
      b <= 31
    ) ||
    (
      a === 192 &&
      b === 168
    ) ||
    (
      a === 100 &&
      b >= 64 &&
      b <= 127
    )
  );
}

function ipv6Privado(
  ip: string,
) {
  const valor =
    ip.toLowerCase();

  return (
    valor === "::1" ||
    valor === "::" ||
    valor.startsWith(
      "fc",
    ) ||
    valor.startsWith(
      "fd",
    ) ||
    valor.startsWith(
      "fe8",
    ) ||
    valor.startsWith(
      "fe9",
    ) ||
    valor.startsWith(
      "fea",
    ) ||
    valor.startsWith(
      "feb",
    )
  );
}

function enderecoPrivado(
  endereco: string,
) {
  const familia =
    isIP(
      endereco,
    );

  if (familia === 4) {
    return ipv4Privado(
      endereco,
    );
  }

  if (familia === 6) {
    return ipv6Privado(
      endereco,
    );
  }

  return false;
}

async function validarUrlRemota(
  valor: string,
) {
  let url: URL;

  try {
    url =
      new URL(
        valor,
      );
  } catch {
    throw new Error(
      "URL de capa inválida.",
    );
  }

  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      "A URL da capa deve usar HTTP ou HTTPS.",
    );
  }

  const host =
    url.hostname
      .toLowerCase();

  if (
    host ===
      "localhost" ||
    host.endsWith(
      ".local",
    )
  ) {
    throw new Error(
      "Host de capa não permitido.",
    );
  }

  if (
    isIP(host) &&
    enderecoPrivado(
      host,
    )
  ) {
    throw new Error(
      "Endereço privado não permitido.",
    );
  }

  const enderecos =
    await lookup(
      host,
      {
        all: true,
      },
    );

  if (
    enderecos.some(
      ({ address }) =>
        enderecoPrivado(
          address,
        ),
    )
  ) {
    throw new Error(
      "A URL resolve para uma rede privada.",
    );
  }

  return url;
}

async function baixarImagem(
  valor: string,
  redirecionamentos = 0,
): Promise<{
  bytes: Uint8Array;
  mimeType: string;
  extensao: string;
  urlFinal: string;
}> {
  if (
    redirecionamentos > 3
  ) {
    throw new Error(
      "A URL da capa possui redirecionamentos demais.",
    );
  }

  const url =
    await validarUrlRemota(
      valor,
    );

  const controlador =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controlador.abort(),
      12_000,
    );

  try {
    const resposta =
      await fetch(
        url,
        {
          method: "GET",
          redirect: "manual",
          signal:
            controlador.signal,
          headers: {
            Accept:
              "image/avif,image/webp,image/png,image/jpeg,image/*",
            "User-Agent":
              "PHANYX-Library-Importer/1.0",
          },
        },
      );

    if (
      resposta.status >=
        300 &&
      resposta.status <
        400
    ) {
      const local =
        resposta.headers.get(
          "location",
        );

      if (!local) {
        throw new Error(
          "Redirecionamento de capa inválido.",
        );
      }

      const proxima =
        new URL(
          local,
          url,
        ).toString();

      return baixarImagem(
        proxima,
        redirecionamentos +
          1,
      );
    }

    if (
      !resposta.ok
    ) {
      throw new Error(
        `Falha ao obter a capa (${resposta.status}).`,
      );
    }

    const tamanho =
      Number(
        resposta.headers.get(
          "content-length",
        ) ?? "0",
      );

    if (
      tamanho >
      LIMITE_CAPA_BYTES
    ) {
      throw new Error(
        "A capa remota ultrapassa 4 MB.",
      );
    }

    const buffer =
      await resposta.arrayBuffer();

    if (
      buffer.byteLength >
      LIMITE_CAPA_BYTES
    ) {
      throw new Error(
        "A capa remota ultrapassa 4 MB.",
      );
    }

    const bytes =
      new Uint8Array(
        buffer,
      );

    const imagem =
      detectarImagem(
        bytes,
      );

    if (!imagem) {
      throw new Error(
        "O endereço informado não retornou uma imagem PNG, JPEG ou WebP válida.",
      );
    }

    return {
      bytes,
      mimeType:
        imagem.mimeType,
      extensao:
        imagem.extensao,
      urlFinal:
        url.toString(),
    };
  } finally {
    clearTimeout(
      timer,
    );
  }
}

async function enviarParaStorage(
  bytes: Uint8Array,
  mimeType: string,
  extensaoImagem: string,
  instituicaoId: number,
  itemId: number,
  prefixo: string,
) {
  const arquivo =
    new File(
      [
        Buffer.from(
          bytes,
        ),
      ],
      `${prefixo}.${extensaoImagem}`,
      {
        type:
          mimeType,
      },
    );

  const resultado =
    await uploadArquivo({
      file:
        arquivo,
      pasta:
        `biblioteca/capas/${instituicaoId}/${itemId}`,
    });

  return resultado.url;
}

export async function criarIndiceCapasZip(
  arquivo:
    | File
    | null,
): Promise<
  IndiceCapasZip | null
> {
  if (!arquivo) {
    return null;
  }

  if (
    arquivo.size <= 0
  ) {
    throw new Error(
      "O ZIP de capas está vazio.",
    );
  }

  if (
    arquivo.size >
    LIMITE_ZIP_BYTES
  ) {
    throw new Error(
      "O ZIP de capas deve ter no máximo 80 MB nesta etapa.",
    );
  }

  const zip =
    await JSZip.loadAsync(
      await arquivo.arrayBuffer(),
      {
        createFolders:
          false,
      },
    );

  const entradas =
    Object.values(
      zip.files,
    )
      .filter(
        (item) =>
          !item.dir,
      );

  if (
    entradas.length >
    LIMITE_ARQUIVOS_ZIP
  ) {
    throw new Error(
      "O ZIP contém arquivos demais.",
    );
  }

  const arquivos =
    new Map<
      string,
      {
        nome: string;
        bytes:
          Uint8Array;
        mimeType:
          string;
      }
    >();

  let total =
    0;

  for (
    const entrada of
    entradas
  ) {
    const nomeBase =
      entrada.name
        .replace(
          /\\/g,
          "/",
        )
        .split("/")
        .pop() ??
      "";

    const ext =
      extensao(
        nomeBase,
      );

    if (
      !EXTENSOES_IMAGEM.has(
        ext,
      )
    ) {
      continue;
    }

    const bytes =
      await entrada.async(
        "uint8array",
      );

    total +=
      bytes.byteLength;

    if (
      total >
      LIMITE_TOTAL_DESCOMPACTADO
    ) {
      throw new Error(
        "O ZIP excede o limite total permitido após a descompactação.",
      );
    }

    if (
      bytes.byteLength >
      LIMITE_CAPA_BYTES
    ) {
      continue;
    }

    const imagem =
      detectarImagem(
        bytes,
      );

    if (!imagem) {
      continue;
    }

    const chave =
      normalizarReferencia(
        nomeBase,
      );

    if (
      chave &&
      !arquivos.has(
        chave,
      )
    ) {
      arquivos.set(
        chave,
        {
          nome:
            nomeBase,
          bytes,
          mimeType:
            imagem.mimeType,
        },
      );
    }
  }

  return {
    arquivos,
    quantidade:
      arquivos.size,
  };
}

function referenciasPossiveis(
  registro:
    RegistroParaCapa,
) {
  return Array.from(
    new Set(
      [
        registro.arquivoCapa,
        registro.isbn13,
        registro.isbn10,
        registro.idLegado,
        registro.codigoBarras,
        registro.numeroTombo,
        registro.patrimonio,
      ]
        .map(
          normalizarReferencia,
        )
        .filter(Boolean),
    ),
  );
}

async function tentarZip(
  indice:
    | IndiceCapasZip
    | null,
  registro:
    RegistroParaCapa,
  instituicaoId: number,
) {
  if (!indice) {
    return null;
  }

  for (
    const referencia of
    referenciasPossiveis(
      registro,
    )
  ) {
    const imagem =
      indice.arquivos.get(
        referencia,
      );

    if (!imagem) {
      continue;
    }

    const tipo =
      detectarImagem(
        imagem.bytes,
      );

    if (!tipo) {
      continue;
    }

    const url =
      await enviarParaStorage(
        imagem.bytes,
        imagem.mimeType,
        tipo.extensao,
        instituicaoId,
        registro.itemId,
        "capa-importada",
      );

    return {
      url,
      origem:
        "ZIP" as const,
      referencia:
        imagem.nome,
    };
  }

  return null;
}

async function tentarUrl(
  registro:
    RegistroParaCapa,
  instituicaoId: number,
) {
  const url =
    registro.capaUrl ??
    registro.miniaturaUrl;

  if (!url) {
    return null;
  }

  const imagem =
    await baixarImagem(
      url,
    );

  const urlStorage =
    await enviarParaStorage(
      imagem.bytes,
      imagem.mimeType,
      imagem.extensao,
      instituicaoId,
      registro.itemId,
      "capa-url",
    );

  return {
    url:
      urlStorage,
    origem:
      "URL" as const,
    referencia:
      imagem.urlFinal,
  };
}

async function tentarIsbn(
  registro:
    RegistroParaCapa,
  instituicaoId: number,
) {
  const isbn =
    isbnLimpo(
      registro.isbn13 ??
        registro.isbn10,
    );

  if (!isbn) {
    return null;
  }

  const url =
    `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
      isbn,
    )}-L.jpg?default=false`;

  try {
    const imagem =
      await baixarImagem(
        url,
      );

    const urlStorage =
      await enviarParaStorage(
        imagem.bytes,
        imagem.mimeType,
        imagem.extensao,
        instituicaoId,
        registro.itemId,
        "capa-isbn",
      );

    return {
      url:
        urlStorage,
      origem:
        "ISBN" as const,
      referencia:
        isbn,
    };
  } catch {
    return null;
  }
}

export async function importarCapa(
  registro:
    RegistroParaCapa,
  instituicaoId: number,
  indiceZip:
    | IndiceCapasZip
    | null,
  opcoes?: {
    copiarUrl?: boolean;
    buscarPorIsbn?: boolean;
  },
): Promise<
  ResultadoCapaImportada | null
> {
  const zip =
    await tentarZip(
      indiceZip,
      registro,
      instituicaoId,
    );

  if (zip) {
    return zip;
  }

  if (
    opcoes?.copiarUrl !==
      false &&
    (
      registro.capaUrl ||
      registro.miniaturaUrl
    )
  ) {
    try {
      const externa =
        await tentarUrl(
          registro,
          instituicaoId,
        );

      if (externa) {
        return externa;
      }
    } catch {
      // A URL externa falhou.
      // Tentamos ISBN na sequência.
    }
  }

  if (
    opcoes?.buscarPorIsbn !==
    false
  ) {
    return tentarIsbn(
      registro,
      instituicaoId,
    );
  }

  return null;
}