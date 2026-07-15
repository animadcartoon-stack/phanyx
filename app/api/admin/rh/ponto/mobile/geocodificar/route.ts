import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPO_LIMITE_CONSULTA_MS = 10_000;

/*
 * Chaves fixas do bloqueio consultivo do PostgreSQL.
 *
 * Todas as instâncias do PHANYX utilizarão o mesmo bloqueio,
 * garantindo que apenas uma consulta externa seja iniciada
 * de cada vez.
 */
const CHAVE_BLOQUEIO_1 = 734_921;
const CHAVE_BLOQUEIO_2 = 28_407;

const PROVEDOR_SUCESSO = "NOMINATIM";
const PROVEDOR_NAO_ENCONTRADO =
  "NOMINATIM_NAO_ENCONTRADO";

const USER_AGENT =
  "PHANYX-RH-Ponto/1.0 (https://www.phanyx.com.br; academicophanyx@gmail.com)";

type EnderecoRecebido = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type NominatimResultado = {
  place_id?: number | string;
  lat?: string;
  lon?: string;
  display_name?: string;
  importance?: number;
  type?: string;
  addresstype?: string;

  address?: Record<
    string,
    string | undefined
  >;
};

type ResultadoGeocodificacao = {
  latitude: number;
  longitude: number;
  nomeExibicao: string;
  precisao: "EXATA" | "APROXIMADA";
};

class ErroHttp extends Error {
  status: number;
  codigo?: string;

  constructor(
    status: number,
    mensagem: string,
    codigo?: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

function obterInstituicaoId(user: any) {
  const instituicaoId = Number(
    user?.instituicaoId
  );

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return null;
  }

  return instituicaoId;
}

function limparCep(valor: unknown) {
  return String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);
}

function limparTexto(
  valor: unknown,
  tamanhoMaximo: number
) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, tamanhoMaximo);
}

function normalizarComparacao(
  valor: unknown
) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function numeroValido(
  valor: unknown,
  minimo: number,
  maximo: number
) {
  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    return null;
  }

  return numero;
}

function prepararEndereco(
  body: any
): EnderecoRecebido {
  const cep = limparCep(body?.cep);

  const logradouro = limparTexto(
    body?.logradouro,
    200
  );

  const numero = limparTexto(
    body?.numero,
    30
  );

  const complemento = limparTexto(
    body?.complemento,
    120
  );

  const bairro = limparTexto(
    body?.bairro,
    120
  );

  const cidade = limparTexto(
    body?.cidade,
    120
  );

  const estado = limparTexto(
    body?.estado,
    2
  ).toUpperCase();

  if (!/^\d{8}$/.test(cep)) {
    throw new ErroHttp(
      400,
      "Informe um CEP válido com 8 números.",
      "CEP_INVALIDO"
    );
  }

  if (logradouro.length < 2) {
    throw new ErroHttp(
      400,
      "Informe o logradouro do endereço.",
      "LOGRADOURO_OBRIGATORIO"
    );
  }

  if (!numero) {
    throw new ErroHttp(
      400,
      "Informe o número do endereço ou use S/N.",
      "NUMERO_OBRIGATORIO"
    );
  }

  if (cidade.length < 2) {
    throw new ErroHttp(
      400,
      "Informe a cidade do endereço.",
      "CIDADE_OBRIGATORIA"
    );
  }

  if (!/^[A-Z]{2}$/.test(estado)) {
    throw new ErroHttp(
      400,
      "Informe a sigla do estado com 2 letras.",
      "ESTADO_INVALIDO"
    );
  }

  return {
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
  };
}

function montarConsulta(
  endereco: EnderecoRecebido
) {
  return [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.estado,
    endereco.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

function criarChaveCache(
  endereco: EnderecoRecebido
) {
  const enderecoNormalizado = [
    endereco.cep,
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.estado,
    "BR",
  ]
    .map(normalizarComparacao)
    .join("|");

  return crypto
    .createHash("sha256")
    .update(enderecoNormalizado)
    .digest("hex");
}

function obterCidadeResultado(
  address:
    | Record<
        string,
        string | undefined
      >
    | undefined
) {
  return (
    address?.city ||
    address?.town ||
    address?.municipality ||
    address?.village ||
    address?.county ||
    ""
  );
}

function obterEstadoResultado(
  address:
    | Record<
        string,
        string | undefined
      >
    | undefined
) {
  const codigoIso =
    address?.["ISO3166-2-lvl4"] ||
    address?.["ISO3166-2-lvl3"] ||
    "";

  if (codigoIso.includes("-")) {
    return codigoIso
      .split("-")
      .pop()
      ?.toUpperCase() || "";
  }

  return (
    address?.state_code ||
    address?.state ||
    ""
  );
}

function pontuarResultado(
  resultado: NominatimResultado,
  endereco: EnderecoRecebido
) {
  const address = resultado.address;

  const pais = normalizarComparacao(
    address?.country_code
  );

  if (pais && pais !== "br") {
    return -1000;
  }

  let pontos = 0;

  const cepResultado = limparCep(
    address?.postcode
  );

  if (cepResultado) {
    pontos +=
      cepResultado === endereco.cep
        ? 100
        : -100;
  }

  const cidadeResultado =
    normalizarComparacao(
      obterCidadeResultado(address)
    );

  const cidadeEsperada =
    normalizarComparacao(
      endereco.cidade
    );

  if (
    cidadeResultado &&
    cidadeEsperada
  ) {
    pontos +=
      cidadeResultado ===
      cidadeEsperada
        ? 40
        : -30;
  }

  const estadoResultado =
    normalizarComparacao(
      obterEstadoResultado(address)
    );

  const estadoEsperado =
    normalizarComparacao(
      endereco.estado
    );

  if (
    estadoResultado &&
    estadoEsperado
  ) {
    pontos +=
      estadoResultado ===
      estadoEsperado
        ? 30
        : -30;
  }

  const ruaResultado =
    normalizarComparacao(
      address?.road ||
        address?.pedestrian ||
        address?.residential ||
        address?.highway
    );

  const ruaEsperada =
    normalizarComparacao(
      endereco.logradouro
    );

  if (
    ruaResultado &&
    ruaEsperada
  ) {
    if (
      ruaResultado === ruaEsperada ||
      ruaResultado.includes(
        ruaEsperada
      ) ||
      ruaEsperada.includes(
        ruaResultado
      )
    ) {
      pontos += 40;
    } else {
      pontos -= 20;
    }
  }

  const numeroResultado =
    normalizarComparacao(
      address?.house_number
    );

  const numeroEsperado =
    normalizarComparacao(
      endereco.numero
    );

  if (
    numeroResultado &&
    numeroEsperado
  ) {
    pontos +=
      numeroResultado ===
      numeroEsperado
        ? 50
        : -25;
  }

  const importancia = Number(
    resultado.importance || 0
  );

  if (Number.isFinite(importancia)) {
    pontos += Math.min(
      10,
      importancia * 10
    );
  }

  return pontos;
}

function classificarPrecisao(
  resultado: NominatimResultado,
  endereco: EnderecoRecebido
) {
  const address = resultado.address;

  const cepCorreto =
    limparCep(address?.postcode) ===
    endereco.cep;

  const numeroResultado =
    normalizarComparacao(
      address?.house_number
    );

  const numeroEsperado =
    normalizarComparacao(
      endereco.numero
    );

  const numeroCorreto =
    Boolean(numeroResultado) &&
    numeroResultado === numeroEsperado;

  const ruaResultado =
    normalizarComparacao(
      address?.road ||
        address?.pedestrian ||
        address?.residential ||
        address?.highway
    );

  const ruaEsperada =
    normalizarComparacao(
      endereco.logradouro
    );

  const ruaCorreta =
    Boolean(ruaResultado) &&
    Boolean(ruaEsperada) &&
    (ruaResultado === ruaEsperada ||
      ruaResultado.includes(
        ruaEsperada
      ) ||
      ruaEsperada.includes(
        ruaResultado
      ));

  return cepCorreto &&
    numeroCorreto &&
    ruaCorreta
    ? "EXATA"
    : "APROXIMADA";
}

async function consultarNominatim(
  endereco: EnderecoRecebido
): Promise<ResultadoGeocodificacao | null> {
  const controlador =
    new AbortController();

  const timer = setTimeout(() => {
    controlador.abort();
  }, TEMPO_LIMITE_CONSULTA_MS);

  try {
    const parametros =
      new URLSearchParams({
        format: "jsonv2",
        q: montarConsulta(endereco),
        countrycodes: "br",
        addressdetails: "1",
        limit: "5",
        dedupe: "1",
        email:
          "academicophanyx@gmail.com",
      });

    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/search?${parametros.toString()}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
          "Accept-Language":
            "pt-BR,pt;q=0.9",

          "User-Agent": USER_AGENT,
        },

        signal: controlador.signal,
        cache: "no-store",
      }
    );

    if (resposta.status === 429) {
      throw new ErroHttp(
        503,
        "O serviço de localização está temporariamente ocupado. Aguarde alguns segundos e tente novamente.",
        "LIMITE_GEOCODIFICACAO"
      );
    }

    if (!resposta.ok) {
      throw new ErroHttp(
        503,
        "O serviço de localização não respondeu. Tente novamente em alguns instantes.",
        "SERVICO_GEOCODIFICACAO_INDISPONIVEL"
      );
    }

    const dados =
      (await resposta.json()) as
        NominatimResultado[];

    if (!Array.isArray(dados)) {
      return null;
    }

    const candidatos = dados
      .map((resultado) => ({
        resultado,

        pontos: pontuarResultado(
          resultado,
          endereco
        ),
      }))
      .filter(
        (item) => item.pontos >= 40
      )
      .sort(
        (a, b) =>
          b.pontos - a.pontos
      );

    const melhor =
      candidatos[0]?.resultado;

    if (!melhor) {
      return null;
    }

    const latitude = numeroValido(
      melhor.lat,
      -90,
      90
    );

    const longitude = numeroValido(
      melhor.lon,
      -180,
      180
    );

    if (
      latitude === null ||
      longitude === null
    ) {
      return null;
    }

    return {
      latitude,
      longitude,

      nomeExibicao:
        limparTexto(
          melhor.display_name,
          1000
        ) ||
        montarConsulta(endereco),

      precisao:
        classificarPrecisao(
          melhor,
          endereco
        ),
    };
  } catch (error) {
    if (error instanceof ErroHttp) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new ErroHttp(
        504,
        "A consulta da localização demorou muito. Tente novamente.",
        "TEMPO_LIMITE_GEOCODIFICACAO"
      );
    }

    console.error(
      "Erro ao consultar Nominatim:",
      error
    );

    throw new ErroHttp(
      503,
      "Não foi possível consultar a localização do endereço.",
      "ERRO_GEOCODIFICACAO"
    );
  } finally {
    clearTimeout(timer);
  }
}

function respostaCachePositivo(
  cache: {
    latitude: number;
    longitude: number;
    nomeExibicao: string | null;
  },
  endereco: EnderecoRecebido
) {
  return {
    encontrado: true as const,

    resultado: {
      latitude: cache.latitude,
      longitude: cache.longitude,

      nomeExibicao:
        cache.nomeExibicao ||
        montarConsulta(endereco),

      precisao:
        "APROXIMADA" as const,
    },

    origem: "CACHE" as const,
  };
}

export async function POST(
  req: NextRequest
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const instituicaoId =
      obterInstituicaoId(user);

    if (!instituicaoId) {
      throw new ErroHttp(
        400,
        "Instituição não identificada.",
        "INSTITUICAO_NAO_IDENTIFICADA"
      );
    }

    const podeGerenciar =
      await usuarioPossuiPermissao(
        user,
        "rh.ponto.mobile.locais.gerenciar"
      );

    if (!podeGerenciar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para confirmar a localização dos locais do Ponto Mobile.",
        "SEM_PERMISSAO"
      );
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const endereco =
      prepararEndereco(body);

    const consulta =
      montarConsulta(endereco);

    const chave =
      criarChaveCache(endereco);

    /*
     * Primeira verificação sem bloqueio.
     * A maioria das consultas futuras terminará aqui.
     */
    const cacheExistente =
      await prisma.cacheGeocodificacaoEndereco.findUnique({
        where: {
          chave,
        },
      });

    if (cacheExistente) {
      await prisma.cacheGeocodificacaoEndereco.update({
        where: {
          id: cacheExistente.id,
        },

        data: {
          ultimoUsoEm: new Date(),
        },
      });

      if (
        cacheExistente.provedor ===
        PROVEDOR_NAO_ENCONTRADO
      ) {
        throw new ErroHttp(
          404,
          "Não foi possível localizar este endereço automaticamente. Confira CEP, logradouro e número ou use sua localização atual.",
          "ENDERECO_NAO_LOCALIZADO"
        );
      }

      const resposta =
        respostaCachePositivo(
          cacheExistente,
          endereco
        );

      return NextResponse.json({
        sucesso: true,

        localizacao:
          resposta.resultado,

        origem: resposta.origem,

        atribuicao:
          "© OpenStreetMap contributors",

        aviso:
          "Localização recuperada do cache do PHANYX.",
      });
    }

    /*
     * Em um cache miss, utilizamos transação e bloqueio
     * consultivo do PostgreSQL.
     *
     * Isso serializa consultas externas entre todas as
     * instâncias da Vercel.
     */
   const resultadoTransacao =
  await prisma.$transaction(
    async (tx) => {
      /*
       * O PostgreSQL exige que as duas chaves
       * sejam enviadas como integer.
       *
       * A subconsulta executa o bloqueio,
       * enquanto o Prisma recebe apenas
       * um número inteiro comum.
       */
      await tx.$queryRaw<
        Array<{ bloqueio: number }>
      >`
        SELECT
          1::integer AS "bloqueio"
        FROM (
          SELECT pg_advisory_xact_lock(
            CAST(${CHAVE_BLOQUEIO_1} AS integer),
            CAST(${CHAVE_BLOQUEIO_2} AS integer)
          )
        ) AS "bloqueio_executado"
      `;

      /*
       * Outra instância pode ter preenchido
       * o cache enquanto esta requisição
       * aguardava o bloqueio.
       */
      const cacheDepoisDoBloqueio =
        await tx.cacheGeocodificacaoEndereco.findUnique({
          where: {
            chave,
          },
        });

      if (cacheDepoisDoBloqueio) {
        await tx.cacheGeocodificacaoEndereco.update({
          where: {
            id: cacheDepoisDoBloqueio.id,
          },

          data: {
            ultimoUsoEm: new Date(),
          },
        });

        if (
          cacheDepoisDoBloqueio.provedor ===
          PROVEDOR_NAO_ENCONTRADO
        ) {
          return {
            encontrado: false as const,
            origem: "CACHE" as const,
          };
        }

        return respostaCachePositivo(
          cacheDepoisDoBloqueio,
          endereco
        );
      }

      /*
       * Mantém intervalo mínimo entre
       * consultas externas ao Nominatim.
       */
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1100);
      });

      const localizacao =
        await consultarNominatim(
          endereco
        );

      if (!localizacao) {
        await tx.cacheGeocodificacaoEndereco.create({
          data: {
            chave,
            consulta,

            latitude: 0,
            longitude: 0,

            nomeExibicao: null,

            provedor:
              PROVEDOR_NAO_ENCONTRADO,

            ultimoUsoEm: new Date(),
          },
        });

        return {
          encontrado: false as const,
          origem: "NOMINATIM" as const,
        };
      }

      await tx.cacheGeocodificacaoEndereco.create({
        data: {
          chave,
          consulta,

          latitude:
            localizacao.latitude,

          longitude:
            localizacao.longitude,

          nomeExibicao:
            localizacao.nomeExibicao,

          provedor:
            PROVEDOR_SUCESSO,

          ultimoUsoEm: new Date(),
        },
      });

      return {
        encontrado: true as const,
        resultado: localizacao,
        origem: "NOMINATIM" as const,
      };
    },
    {
      maxWait: 15_000,
      timeout: 30_000,
    }
  );
    if (
      !resultadoTransacao.encontrado
    ) {
      throw new ErroHttp(
        404,
        "Não foi possível localizar este endereço automaticamente. Confira CEP, logradouro e número ou use sua localização atual.",
        "ENDERECO_NAO_LOCALIZADO"
      );
    }

    return NextResponse.json({
      sucesso: true,

      localizacao:
        resultadoTransacao.resultado,

      origem:
        resultadoTransacao.origem,

      atribuicao:
        "© OpenStreetMap contributors",

      aviso:
        resultadoTransacao.resultado
          .precisao === "EXATA"
          ? "Endereço localizado com número e CEP correspondentes."
          : "O endereço foi localizado aproximadamente. Confira os dados ou use sua localização atual para maior precisão.",
    });
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          error: error.message,
          codigo:
            error.codigo || null,
        },
        {
          status: error.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    console.error(
      "Erro ao geocodificar local do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível confirmar a localização do endereço.",

        codigo:
          "ERRO_INTERNO",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}