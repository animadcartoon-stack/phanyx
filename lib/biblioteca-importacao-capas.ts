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
    "gif",
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

  isbn?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  idLegado?: string | null;

  codigoBarras?: string | null;
  numeroTombo?: string | null;
  patrimonio?: string | null;
  imagens?: Array<{ referencia: string; descricao: string; capa: boolean }>;
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
  const assinaturaGif = Buffer.from(bytes.slice(0, 6)).toString("ascii");
  if (assinaturaGif === "GIF87a" || assinaturaGif === "GIF89a") return { mimeType: "image/gif", extensao: "gif" };
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

  const ambiguas = new Set<string>();
  let quantidadeImagens = 0;
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

    const tamanhoDeclarado = (entrada as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (typeof tamanhoDeclarado === "number" && tamanhoDeclarado > LIMITE_CAPA_BYTES) continue;
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

    const chave = normalizarReferencia(nomeBase);
    const imagemIndexada = { nome: entrada.name, bytes, mimeType: imagem.mimeType };
    quantidadeImagens += 1;
    arquivos.set(`arquivo:${entrada.name.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase()}`, imagemIndexada);
    if (chave && !ambiguas.has(chave)) {
      if (arquivos.has(chave)) { arquivos.delete(chave); ambiguas.add(chave); }
      else arquivos.set(chave, imagemIndexada);
    }
  }

  return {
    arquivos,
    quantidade: quantidadeImagens,
  };
}

function referenciasPossiveis(
  registro:
    RegistroParaCapa,
) {
  return Array.from(
    new Set(
      [
        registro.arquivoCapa?.replace(/\\/g, "/").split("/").pop(),
        registro.isbn13,
        registro.isbn10,
        registro.isbn,
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

  const exata = registro.arquivoCapa ? `arquivo:${registro.arquivoCapa.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase()}` : "";
  for (const referencia of [exata, ...referenciasPossiveis(registro)].filter(Boolean)) {
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

  if (/^data:image\//i.test(url)) {
    const imagem = await importarImagemReferencia(url, registro.itemId, instituicaoId, null);
    return { url: imagem.url, origem: "URL" as const, referencia: "imagem incorporada" };
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
        registro.isbn10 ??
        registro.isbn,
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

  let falhaUrl: unknown;
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
    } catch (erro) {
      falhaUrl = erro;
      // A URL externa falhou.
      // Tentamos ISBN na sequência.
    }
  }

  if (
    opcoes?.buscarPorIsbn !==
    false
  ) {
    const capaIsbn = await tentarIsbn(
      registro,
      instituicaoId,
    );
    if (capaIsbn) return capaIsbn;
  }

  if (falhaUrl) throw falhaUrl;
  return null;
}

export async function importarImagemReferencia(
  referencia: string, itemId: number, instituicaoId: number,
  indice: IndiceCapasZip | null, copiarUrl = true,
) {
  const chave = referencia.replace(/\\/g, "/").split("/").pop()?.split(/[?#]/)[0] ?? referencia;
  const exata = `arquivo:${referencia.replace(/\\/g, "/").replace(/^\.\//, "").split(/[?#]/)[0].toLowerCase()}`;
  const local = indice?.arquivos.get(exata) ?? indice?.arquivos.get(normalizarReferencia(chave));
  if (local) {
    const tipo = detectarImagem(local.bytes);
    if (!tipo) throw new Error("O arquivo referenciado não é uma imagem reconhecida.");
    const url = await enviarParaStorage(local.bytes, local.mimeType, tipo.extensao, instituicaoId, itemId, "imagem-importada");
    return { url, referencia };
  }
  if (/^data:image\//i.test(referencia)) {
    const data = referencia.match(/^data:image\/[\w.+-]+;base64,([a-z\d+/=\s]+)$/i);
    if (!data) throw new Error("A imagem incorporada possui codificação inválida.");
    if (data[1].length > Math.ceil(LIMITE_CAPA_BYTES * 4 / 3) + 100) throw new Error("A imagem incorporada ultrapassa 4 MB.");
    const bytes = Buffer.from(data[1], "base64");
    const tipo = detectarImagem(bytes);
    if (!tipo) throw new Error("A imagem incorporada não possui um formato de imagem reconhecido.");
    const url = await enviarParaStorage(bytes, tipo.mimeType, tipo.extensao, instituicaoId, itemId, "imagem-incorporada");
    return { url, referencia: "data:image" };
  }
  if (!copiarUrl) throw new Error("A cópia de imagens por URL foi desativada; a referência foi preservada.");
  if (!/^https?:\/\//i.test(referencia)) throw new Error("A imagem não foi encontrada no ZIP. Inclua o arquivo indicado na exportação.");
  const imagem = await baixarImagem(referencia);
  const url = await enviarParaStorage(imagem.bytes, imagem.mimeType, imagem.extensao, instituicaoId, itemId, "imagem-url");
  return { url, referencia: imagem.urlFinal };
}
