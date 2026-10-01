import "server-only";

import {
  lookup,
} from "node:dns/promises";

import {
  isIP,
} from "node:net";

import {
  get,
} from "@vercel/blob";

import JSZip from "jszip";

import {
  obterTokenBibliotecaBlob,
} from "@/lib/biblioteca-storage";

const LIMITE_CAPA_BYTES =
  4 * 1024 * 1024;

const LIMITE_ARQUIVO_DIGITAL_BYTES =
  40 * 1024 * 1024;

const LIMITE_BINARIOS_PACOTE_BYTES =
  120 * 1024 * 1024;

type ItemBasicoZip = {
  id: number;
  titulo: string;
  isbn10: string | null;
  isbn13: string | null;
  capaUrl: string | null;
  miniaturaUrl: string | null;
};

type ArquivoDigitalZip = {
  id: number;
  tipo: unknown;
  status: unknown;
  nomeOriginal: string;
  extensao: string | null;
  mimeType: string | null;
  tamanhoBytes:
    | bigint
    | number;
  storageKey: string | null;
  permitirDownload: boolean;
};

type LicencaZip = {
  ativo: boolean;
  inicioVigencia: Date | null;
  fimVigencia: Date | null;
  permitirDownload: boolean;
};

type AtivosItemZip = {
  id: number;
  permitirDownload: boolean;

  licencas: LicencaZip[];

  arquivos: ArquivoDigitalZip[];
};

type EntradaManifesto = {
  itemId: number;
  titulo: string;

  capa: {
    status:
      | "INCLUIDA"
      | "NAO_SOLICITADA"
      | "NAO_DISPONIVEL"
      | "FALHA";
    arquivo?: string;
    motivo?: string;
  };

  arquivosDigitais: Array<{
    arquivoId: number;
    nome: string;
    status:
      | "INCLUIDO"
      | "BLOQUEADO"
      | "IGNORADO"
      | "FALHA";
    caminho?: string;
    motivo?: string;
  }>;
};

function texto(
  valor: unknown,
) {
  return String(
    valor ?? "",
  ).trim();
}

function nomeSeguro(
  valor: string,
) {
  const normalizado =
    texto(valor)
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        "",
      )
      .slice(
        0,
        140,
      );

  return (
    normalizado ||
    "arquivo"
  );
}

function referenciaCapa(
  item: ItemBasicoZip,
) {
  return (
    texto(
      item.isbn13,
    ) ||
    texto(
      item.isbn10,
    ) ||
    `PHANYX-${item.id}`
  )
    .toUpperCase()
    .replace(
      /[^0-9A-Z_-]/g,
      "",
    );
}

function extensaoImagem(
  mimeType: string,
) {
  const tipo =
    mimeType
      .split(";")[0]
      .trim()
      .toLowerCase();

  if (
    tipo ===
    "image/png"
  ) {
    return "png";
  }

  if (
    tipo ===
      "image/webp"
  ) {
    return "webp";
  }

  if (
    tipo ===
      "image/jpeg" ||
    tipo ===
      "image/jpg"
  ) {
    return "jpg";
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
      (parte) =>
        !Number.isInteger(
          parte,
        ),
    )
  ) {
    return false;
  }

  const [a, b] =
    partes;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
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
    valor === "::" ||
    valor === "::1" ||
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

  if (
    familia === 4
  ) {
    return ipv4Privado(
      endereco,
    );
  }

  if (
    familia === 6
  ) {
    return ipv6Privado(
      endereco,
    );
  }

  return false;
}

async function validarUrlPublica(
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
      "URL inválida.",
    );
  }

  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      "Protocolo não permitido.",
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
      "Host não permitido.",
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
      "URL resolve para rede privada.",
    );
  }

  return url;
}

async function baixarCapa(
  valor: string,
  redirecionamentos = 0,
): Promise<{
  bytes: Buffer;
  extensao: string;
}> {
  if (
    redirecionamentos > 3
  ) {
    throw new Error(
      "Redirecionamentos demais.",
    );
  }

  const url =
    await validarUrlPublica(
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
              "image/png,image/jpeg,image/webp,image/*",
            "User-Agent":
              "PHANYX-Library-Exporter/1.0",
          },
        },
      );

    if (
      resposta.status >= 300 &&
      resposta.status < 400
    ) {
      const local =
        resposta.headers.get(
          "location",
        );

      if (!local) {
        throw new Error(
          "Redirecionamento inválido.",
        );
      }

      return baixarCapa(
        new URL(
          local,
          url,
        ).toString(),
        redirecionamentos + 1,
      );
    }

    if (
      !resposta.ok
    ) {
      throw new Error(
        `HTTP ${resposta.status}.`,
      );
    }

    const tamanhoCabecalho =
      Number(
        resposta.headers.get(
          "content-length",
        ) || "0",
      );

    if (
      tamanhoCabecalho >
      LIMITE_CAPA_BYTES
    ) {
      throw new Error(
        "Capa maior que 4 MB.",
      );
    }

    const bytes =
      Buffer.from(
        await resposta.arrayBuffer(),
      );

    if (
      bytes.length >
      LIMITE_CAPA_BYTES
    ) {
      throw new Error(
        "Capa maior que 4 MB.",
      );
    }

    const extensao =
      extensaoImagem(
        resposta.headers.get(
          "content-type",
        ) || "",
      );

    if (!extensao) {
      throw new Error(
        "Formato de imagem não reconhecido.",
      );
    }

    return {
      bytes,
      extensao,
    };
  } finally {
    clearTimeout(
      timer,
    );
  }
}

function licencaPermiteDownload(
  item: AtivosItemZip,
) {
  if (
    !item.permitirDownload
  ) {
    return {
      permitido: false,
      motivo:
        "A obra não permite download.",
    };
  }

  if (
    item.licencas.length === 0
  ) {
    return {
      permitido: true,
      motivo: null,
    };
  }

  const agora =
    Date.now();

  const vigentes =
    item.licencas.filter(
      (licenca) => {
        if (
          !licenca.ativo
        ) {
          return false;
        }

        if (
          licenca.inicioVigencia &&
          licenca.inicioVigencia.getTime() >
            agora
        ) {
          return false;
        }

        if (
          licenca.fimVigencia &&
          licenca.fimVigencia.getTime() <
            agora
        ) {
          return false;
        }

        return true;
      },
    );

  if (
    vigentes.length === 0
  ) {
    return {
      permitido: false,
      motivo:
        "Não há licença vigente que autorize a exportação do arquivo.",
    };
  }

  if (
    !vigentes.some(
      (licenca) =>
        licenca.permitirDownload,
    )
  ) {
    return {
      permitido: false,
      motivo:
        "A licença vigente não permite download.",
    };
  }

  return {
    permitido: true,
    motivo: null,
  };
}

async function obterBlobPrivado(
  storageKey: string,
) {
  const resultado =
    await get(
      storageKey,
      {
        access:
          "private",
        token:
          obterTokenBibliotecaBlob(),
      },
    );

  if (
    !resultado ||
    resultado.statusCode !==
      200 ||
    !resultado.stream
  ) {
    throw new Error(
      "Arquivo não encontrado no armazenamento.",
    );
  }

  const resposta =
    new Response(
      resultado.stream,
    );

  return Buffer.from(
    await resposta.arrayBuffer(),
  );
}

export async function gerarPacoteBibliotecaZip({
  itens,
  ativosPorItem,
  bufferXlsx,
  bufferCsv,
  bufferMarc21,
  marcXml,
  incluirCapas,
  incluirArquivos,
  instituicaoId,
  lote,
  totalLotes,
  totalObras,
}: {
  itens: ItemBasicoZip[];

  ativosPorItem:
    Map<
      number,
      AtivosItemZip
    >;

  bufferXlsx: Buffer;
  bufferCsv: Buffer;
  bufferMarc21: Buffer;
  marcXml: string;

  incluirCapas: boolean;
  incluirArquivos: boolean;

  instituicaoId: number;
  lote: number;
  totalLotes: number;
  totalObras: number;
}) {
  const zip =
    new JSZip();

  zip.file(
    "acervo.xlsx",
    bufferXlsx,
  );

  zip.file(
    "acervo.csv",
    bufferCsv,
  );

  zip.file(
    "acervo.mrc",
    bufferMarc21,
  );

  zip.file(
    "acervo-marc.xml",
    marcXml,
  );

  const manifesto:
    EntradaManifesto[] = [];

  let totalBinarios = 0;

  let capasIncluidas = 0;
  let capasFalharam = 0;

  let arquivosIncluidos = 0;
  let arquivosBloqueados = 0;
  let arquivosFalharam = 0;

  for (
    const item of itens
  ) {
    const entrada:
      EntradaManifesto = {
        itemId:
          item.id,
        titulo:
          item.titulo,

        capa: {
          status:
            incluirCapas
              ? "NAO_DISPONIVEL"
              : "NAO_SOLICITADA",
        },

        arquivosDigitais: [],
      };

    if (
      incluirCapas
    ) {
      const url =
        item.capaUrl ||
        item.miniaturaUrl;

      if (url) {
        try {
          const capa =
            await baixarCapa(
              url,
            );

          if (
            totalBinarios +
              capa.bytes.length >
            LIMITE_BINARIOS_PACOTE_BYTES
          ) {
            entrada.capa = {
              status:
                "FALHA",
              motivo:
                "Limite de binários do pacote atingido.",
            };

            capasFalharam +=
              1;
          } else {
            const caminho =
              `capas/${referenciaCapa(
                item,
              )}.${capa.extensao}`;

            zip.file(
              caminho,
              capa.bytes,
            );

            totalBinarios +=
              capa.bytes.length;

            capasIncluidas +=
              1;

            entrada.capa = {
              status:
                "INCLUIDA",
              arquivo:
                caminho,
            };
          }
        } catch (erro) {
          capasFalharam +=
            1;

          entrada.capa = {
            status:
              "FALHA",
            motivo:
              erro instanceof Error
                ? erro.message
                : "Falha ao obter a capa.",
          };
        }
      }
    }

    if (
      incluirArquivos
    ) {
      const ativos =
        ativosPorItem.get(
          item.id,
        );

      if (!ativos) {
        entrada.arquivosDigitais.push({
          arquivoId: 0,
          nome: "",
          status:
            "IGNORADO",
          motivo:
            "Nenhum arquivo digital cadastrado.",
        });
      } else {
        if (
          ativos.arquivos.length ===
          0
        ) {
          entrada.arquivosDigitais.push({
            arquivoId: 0,
            nome: "",
            status:
              "IGNORADO",
            motivo:
              "Nenhum arquivo digital cadastrado.",
          });
        }

        const direito =
          licencaPermiteDownload(
            ativos,
          );

        for (
          const arquivo of
          ativos.arquivos
        ) {
          const nome =
            arquivo.nomeOriginal ||
            `arquivo-${arquivo.id}`;

          if (
            String(
              arquivo.status,
            ) !==
            "DISPONIVEL"
          ) {
            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "IGNORADO",
              motivo:
                "Arquivo não está disponível.",
            });

            continue;
          }

          if (
            !arquivo.storageKey
          ) {
            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "IGNORADO",
              motivo:
                "Arquivo sem armazenamento interno.",
            });

            continue;
          }

          if (
            !arquivo.permitirDownload
          ) {
            arquivosBloqueados +=
              1;

            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "BLOQUEADO",
              motivo:
                "O arquivo não permite download.",
            });

            continue;
          }

          if (
            !direito.permitido
          ) {
            arquivosBloqueados +=
              1;

            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "BLOQUEADO",
              motivo:
                direito.motivo ||
                "Licença não autoriza download.",
            });

            continue;
          }

          const tamanhoInformado =
            Number(
              arquivo.tamanhoBytes,
            );

          if (
            Number.isFinite(
              tamanhoInformado,
            ) &&
            tamanhoInformado >
              LIMITE_ARQUIVO_DIGITAL_BYTES
          ) {
            arquivosBloqueados +=
              1;

            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "BLOQUEADO",
              motivo:
                "Arquivo excede o limite de 40 MB por arquivo neste pacote.",
            });

            continue;
          }

          try {
            const bytes =
              await obterBlobPrivado(
                arquivo.storageKey,
              );

            if (
              bytes.length >
              LIMITE_ARQUIVO_DIGITAL_BYTES
            ) {
              arquivosBloqueados +=
                1;

              entrada.arquivosDigitais.push({
                arquivoId:
                  arquivo.id,
                nome,
                status:
                  "BLOQUEADO",
                motivo:
                  "Arquivo excede o limite de 40 MB por arquivo neste pacote.",
              });

              continue;
            }

            if (
              totalBinarios +
                bytes.length >
              LIMITE_BINARIOS_PACOTE_BYTES
            ) {
              arquivosBloqueados +=
                1;

              entrada.arquivosDigitais.push({
                arquivoId:
                  arquivo.id,
                nome,
                status:
                  "BLOQUEADO",
                motivo:
                  "Limite total de 120 MB de binários por pacote atingido.",
              });

              continue;
            }

            const caminho =
              [
                "arquivos",
                `PHANYX-${item.id}`,
                `${arquivo.id}-${nomeSeguro(
                  nome,
                )}`,
              ].join("/");

            zip.file(
              caminho,
              bytes,
            );

            totalBinarios +=
              bytes.length;

            arquivosIncluidos +=
              1;

            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "INCLUIDO",
              caminho,
            });
          } catch (erro) {
            arquivosFalharam +=
              1;

            entrada.arquivosDigitais.push({
              arquivoId:
                arquivo.id,
              nome,
              status:
                "FALHA",
              motivo:
                erro instanceof Error
                  ? erro.message
                  : "Falha ao obter o arquivo digital.",
            });
          }
        }
      }
    }

    manifesto.push(
      entrada,
    );
  }

  const geradoEm =
    new Date()
      .toISOString();

  const documentoManifesto = {
    formato:
      "PHANYX_LIBRARY_MIGRATION_PACKAGE",

    versao:
      1,

    geradoEm,

    instituicaoId,

    lote,

    totalLotes,

    limiteObrasPorLote:
      100,

    totalObrasAcervo:
      totalObras,

    obrasNestePacote:
      itens.length,

    limites: {
      capaBytes:
        LIMITE_CAPA_BYTES,

      arquivoDigitalBytes:
        LIMITE_ARQUIVO_DIGITAL_BYTES,

      binariosPacoteBytes:
        LIMITE_BINARIOS_PACOTE_BYTES,
    },

    resumo: {
      capasIncluidas,
      capasFalharam,
      arquivosIncluidos,
      arquivosBloqueados,
      arquivosFalharam,
    },

    obras:
      manifesto,
  };

  zip.file(
    "manifest.json",
    JSON.stringify(
      documentoManifesto,
      null,
      2,
    ) + "\n",
  );

  zip.file(
    "LEIA-ME.txt",
    [
      "PHANYX — Pacote de migração do acervo",
      "",
      `Gerado em: ${geradoEm}`,
      `Lote: ${lote} de ${totalLotes}`,
      `Obras neste pacote: ${itens.length}`,
      "",
      "Conteúdo:",
      "- acervo.xlsx: planilha completa;",
      "- acervo.csv: formato tabular universal;",
      "- acervo.mrc: MARC21 / ISO2709;",
      "- acervo-marc.xml: MARCXML;",
      "- manifest.json: conteúdo, permissões e arquivos incluídos/bloqueados;",
      "- capas/: capas disponíveis, quando solicitadas;",
      "- arquivos/: somente arquivos digitais cujo download esteja autorizado.",
      "",
      "Importação no PHANYX:",
      "1. Importe acervo.mrc ou acervo-marc.xml;",
      "2. Se desejar migrar as capas, use este ZIP como pacote de capas;",
      "3. Revise a validação antes de confirmar a importação.",
      "",
      "Arquivos digitais podem estar ausentes quando a obra, o arquivo ou a licença não permite download.",
      "",
    ].join("\r\n"),
  );

  const buffer =
    await zip.generateAsync({
      type:
        "nodebuffer",

      compression:
        "DEFLATE",

      compressionOptions: {
        level: 6,
      },
    });

  return {
    buffer,

    resumo: {
      capasIncluidas,
      capasFalharam,
      arquivosIncluidos,
      arquivosBloqueados,
      arquivosFalharam,
      bytesBinarios:
        totalBinarios,
    },
  };
}