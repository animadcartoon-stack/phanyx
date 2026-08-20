import {
  DirecaoEventoIntegracaoCaptacaoLead,
  Prisma,
  StatusEventoIntegracaoCaptacaoLead,
  StatusIntegracaoCaptacaoLead,
  TipoIntegracaoCaptacaoLead,
} from "@prisma/client";

import {
  createDecipheriv,
  createHash,
  createHmac,
} from "crypto";

import { isIP } from "net";

import { lookup } from "dns/promises";

import { prisma } from "@/lib/prisma";


const TIMEOUT_PADRAO_MS =
  10_000;

const TIMEOUT_MINIMO_MS =
  1_000;

const TIMEOUT_MAXIMO_MS =
  30_000;

const MAX_TENTATIVAS_PADRAO =
  6;

const MAX_TENTATIVAS_LIMITE =
  12;

const LIMITE_RESPOSTA_CARACTERES =
  64_000;

/*
 * Backoff progressivo:
 *
 * tentativa 1 -> 1 min
 * tentativa 2 -> 5 min
 * tentativa 3 -> 15 min
 * tentativa 4 -> 1 h
 * tentativa 5 -> 6 h
 * tentativa 6+ -> 24 h
 */
const BACKOFF_SEGUNDOS = [
  60,
  5 * 60,
  15 * 60,
  60 * 60,
  6 * 60 * 60,
  24 * 60 * 60,
];

export type ResultadoProcessamentoEventoSaida = {
  eventoId: number;

  status:
  StatusEventoIntegracaoCaptacaoLead;

  tentativa: number;

  entregue: boolean;

  descartado: boolean;

  ignorado: boolean;

  codigoHttp:
  number | null;

  proximaTentativaEm:
  Date | null;

  mensagem:
  string;
};

function idPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return (
    Number.isInteger(numero) &&
    numero > 0
  )
    ? numero
    : null;
}

function paraJsonPrisma(
  valor: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(valor)
  ) as Prisma.InputJsonValue;
}

function limitarTexto(
  valor: unknown,
  limite = 10_000
) {
  const texto =
    String(valor ?? "");

  return texto.slice(
    0,
    limite
  );
}

function obterObjetoConfiguracao(
  valor:
    Prisma.JsonValue |
    null
) {
  if (
    !valor ||
    typeof valor !==
    "object" ||
    Array.isArray(valor)
  ) {
    return null;
  }

  return valor as Record<
    string,
    unknown
  >;
}

function numeroConfiguracao(
  configuracao:
    Prisma.JsonValue |
    null,

  campo: string,

  padrao: number,

  minimo: number,

  maximo: number
) {
  const objeto =
    obterObjetoConfiguracao(
      configuracao
    );

  if (!objeto) {
    return padrao;
  }

  const valor =
    objeto[campo];

  if (
    valor ===
    undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

  const numero =
    Number(valor);

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return padrao;
  }

  const inteiro =
    Math.trunc(
      numero
    );

  return Math.max(
    minimo,
    Math.min(
      inteiro,
      maximo
    )
  );
}

function obterTimeoutMs(
  configuracao:
    Prisma.JsonValue |
    null
) {
  return numeroConfiguracao(
    configuracao,
    "timeoutMs",
    TIMEOUT_PADRAO_MS,
    TIMEOUT_MINIMO_MS,
    TIMEOUT_MAXIMO_MS
  );
}

function obterMaxTentativas(
  configuracao:
    Prisma.JsonValue |
    null
) {
  return numeroConfiguracao(
    configuracao,
    "maxTentativas",
    MAX_TENTATIVAS_PADRAO,
    1,
    MAX_TENTATIVAS_LIMITE
  );
}

function calcularProximaTentativa(
  tentativaAtual: number
) {
  const indice =
    Math.min(
      Math.max(
        tentativaAtual - 1,
        0
      ),
      BACKOFF_SEGUNDOS.length -
      1
    );

  const segundos =
    BACKOFF_SEGUNDOS[
    indice
    ];

  return new Date(
    Date.now() +
    segundos * 1000
  );
}

function obterChaveCriptografia() {
  const segredoBase =
    process.env
      .CAPTACAO_INTEGRACAO_CRYPTO_SECRET ||
    process.env.JWT_SECRET;

  if (!segredoBase) {
    throw new Error(
      "A criptografia das integrações não está configurada."
    );
  }

  return createHash(
    "sha256"
  )
    .update(segredoBase)
    .digest();
}

function descriptografarSegredo(
  valor: string
) {
  const partes =
    valor.split(":");

  if (
    partes.length !== 4 ||
    partes[0] !== "v1"
  ) {
    throw new Error(
      "A credencial da integração possui formato inválido."
    );
  }

  const [
    _versao,
    ivBase64,
    tagBase64,
    dadosBase64,
  ] = partes;

  try {
    const chave =
      obterChaveCriptografia();

    const iv =
      Buffer.from(
        ivBase64,
        "base64url"
      );

    const tag =
      Buffer.from(
        tagBase64,
        "base64url"
      );

    const dados =
      Buffer.from(
        dadosBase64,
        "base64url"
      );

    const decipher =
      createDecipheriv(
        "aes-256-gcm",
        chave,
        iv
      );

    decipher.setAuthTag(
      tag
    );

    return Buffer.concat([
      decipher.update(
        dados
      ),

      decipher.final(),
    ]).toString(
      "utf8"
    );
  } catch {
    throw new Error(
      "Não foi possível descriptografar a credencial da integração."
    );
  }
}

function ipv4EhPrivado(
  hostname: string
) {
  const partes =
    hostname
      .split(".")
      .map(Number);

  if (
    partes.length !== 4 ||
    partes.some(
      (parte) =>
        !Number.isInteger(
          parte
        ) ||
        parte < 0 ||
        parte > 255
    )
  ) {
    return false;
  }

  const [
    a,
    b,
    c,
  ] = partes;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (
      a === 100 &&
      b >= 64 &&
      b <= 127
    ) ||
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
      b === 0 &&
      c === 0
    ) ||
    (
      a === 192 &&
      b === 0 &&
      c === 2
    ) ||
    (
      a === 192 &&
      b === 88 &&
      c === 99
    ) ||
    (
      a === 192 &&
      b === 168
    ) ||
    (
      a === 198 &&
      (
        b === 18 ||
        b === 19
      )
    ) ||
    (
      a === 198 &&
      b === 51 &&
      c === 100
    ) ||
    (
      a === 203 &&
      b === 0 &&
      c === 113
    ) ||
    a >= 224
  );
}

function ipv6EhPrivado(
  hostname: string
) {
  const normalizado =
    hostname
      .toLowerCase()
      .replace(/^\[/, "")
      .replace(/\]$/, "");

  if (
    normalizado === "::" ||
    normalizado === "::1"
  ) {
    return true;
  }

  const ipv4MapeadoComPontos =
    normalizado.match(
      /^::ffff:(\d+\.\d+\.\d+\.\d+)$/
    );

  if (
    ipv4MapeadoComPontos
  ) {
    return ipv4EhPrivado(
      ipv4MapeadoComPontos[1]
    );
  }

  const ipv4MapeadoHexadecimal =
    normalizado.match(
      /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/
    );

  if (
    ipv4MapeadoHexadecimal
  ) {
    const parteAlta =
      Number.parseInt(
        ipv4MapeadoHexadecimal[1],
        16
      );

    const parteBaixa =
      Number.parseInt(
        ipv4MapeadoHexadecimal[2],
        16
      );

    const ipv4 = [
      parteAlta >> 8,
      parteAlta & 255,
      parteBaixa >> 8,
      parteBaixa & 255,
    ].join(".");

    return ipv4EhPrivado(
      ipv4
    );
  }

  const primeiroBloco =
    Number.parseInt(
      normalizado.split(":")[0] ||
      "0",
      16
    );

  return (
    (
      primeiroBloco >= 0xfc00 &&
      primeiroBloco <= 0xfdff
    ) ||
    (
      primeiroBloco >= 0xfe80 &&
      primeiroBloco <= 0xfebf
    ) ||
    (
      primeiroBloco >= 0xff00 &&
      primeiroBloco <= 0xffff
    ) ||
    normalizado.startsWith(
      "2001:db8:"
    )
  );
}

async function validarEndpoint(
  valor: string
) {
  let url: URL;

  try {
    url =
      new URL(valor);
  } catch {
    throw new Error(
      "A URL do webhook de saída é inválida."
    );
  }

  if (
    url.protocol !==
    "https:"
  ) {
    throw new Error(
      "O webhook de saída deve utilizar uma conexão HTTPS segura."
    );
  }

  /*
   * Não permitimos usuário/senha
   * embutidos na URL.
   */
  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "A URL do webhook não pode conter credenciais."
    );
  }

  const hostname =
    url.hostname
      .trim()
      .toLowerCase();

  if (
    hostname ===
    "localhost" ||
    hostname.endsWith(
      ".localhost"
    ) ||
    hostname.endsWith(
      ".local"
    ) ||
    hostname ===
    "metadata.google.internal"
  ) {
    throw new Error(
      "O endpoint informado não é permitido."
    );
  }

  const hostnameParaIp =
    hostname
      .replace(/^\[/, "")
      .replace(/\]$/, "");

  const tipoIp =
    isIP(hostnameParaIp);

  if (
    tipoIp === 4 &&
    ipv4EhPrivado(
      hostnameParaIp
    )
  ) {
    throw new Error(
      "Endereços IPv4 privados ou reservados não são permitidos."
    );
  }

  if (
    tipoIp === 6 &&
    ipv6EhPrivado(
      hostnameParaIp
    )
  ) {
    throw new Error(
      "Endereços IPv6 privados ou locais não são permitidos."
    );
  }

  if (tipoIp === 0) {
    let enderecos:
      Array<{
        address: string;
        family: number;
      }>;

    try {
      enderecos =
        await lookup(
          hostname,
          {
            all: true,
            verbatim: true,
          }
        );
    } catch {
      throw new Error(
        "Não foi possível verificar o endereço do webhook."
      );
    }

    if (!enderecos.length) {
      throw new Error(
        "O endereço do webhook não pôde ser resolvido."
      );
    }

    const possuiEnderecoBloqueado =
      enderecos.some(
        (endereco) => {
          if (
            endereco.family === 4
          ) {
            return ipv4EhPrivado(
              endereco.address
            );
          }

          if (
            endereco.family === 6
          ) {
            return ipv6EhPrivado(
              endereco.address
            );
          }

          return true;
        }
      );

    if (possuiEnderecoBloqueado) {
      throw new Error(
        "O domínio do webhook aponta para um endereço privado, local ou reservado."
      );
    }
  }

  return url.toString();
}

function montarIdentificadorExterno(
  evento: {
    id: number;
    identificadorEvento:
    string | null;
  }
) {
  return (
    evento.identificadorEvento ??
    `phanyx-evento-${evento.id}`
  );
}

function montarCorpoWebhook(
  evento: {
    id: number;

    identificadorEvento:
    string | null;

    tipoEvento: string;

    submissaoId:
    number | null;

    recebidoEm:
    Date;

    payload:
    Prisma.JsonValue |
    null;
  }
) {
  return {
    id:
      montarIdentificadorExterno(
        evento
      ),

    eventoId:
      evento.id,

    tipoEvento:
      evento.tipoEvento,

    criadoEm:
      evento.recebidoEm.toISOString(),

    submissaoId:
      evento.submissaoId,

    dados:
      evento.payload ??
      {},
  };
}

function montarAssinatura(
  corpo: string,
  segredo: string
) {
  return createHmac(
    "sha256",
    segredo
  )
    .update(
      corpo,
      "utf8"
    )
    .digest(
      "hex"
    );
}

async function lerRespostaHttp(
  response: Response
) {
  const contentType =
    response.headers.get(
      "content-type"
    );

  const reader =
    response.body?.getReader();

  let texto = "";
  let truncado = false;

  if (reader) {
    const decoder =
      new TextDecoder();

    try {
      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) {
          const restante =
            decoder.decode();

          if (restante) {
            const limiteDisponivel =
              Math.max(
                LIMITE_RESPOSTA_CARACTERES -
                texto.length,
                0
              );

            texto +=
              restante.slice(
                0,
                limiteDisponivel
              );

            if (
              restante.length >
              limiteDisponivel
            ) {
              truncado = true;
            }
          }

          break;
        }

        const trecho =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        const limiteDisponivel =
          LIMITE_RESPOSTA_CARACTERES -
          texto.length;

        if (
          limiteDisponivel <= 0
        ) {
          truncado = true;

          try {
            await reader.cancel();
          } catch {
            // A resposta já pode ter sido encerrada.
          }

          break;
        }

        if (
          trecho.length >
          limiteDisponivel
        ) {
          texto +=
            trecho.slice(
              0,
              limiteDisponivel
            );

          truncado = true;

          try {
            await reader.cancel();
          } catch {
            // A resposta já pode ter sido encerrada.
          }

          break;
        }

        texto += trecho;
      }
    } finally {
      reader.releaseLock();
    }
  }

  let corpo:
    unknown =
      texto;

  if (
    texto &&
    !truncado &&
    contentType
      ?.toLowerCase()
      .includes(
        "application/json"
      )
  ) {
    try {
      corpo =
        JSON.parse(
          texto
        );
    } catch {
      corpo =
        texto;
    }
  }

  return {
    status:
      response.status,

    statusText:
      response.statusText,

    contentType,

    body:
      corpo,

    truncado,
  };
}

async function registrarDescarte(
  params: {
    eventoId: number;

    integracaoId:
    number;

    mensagem: string;

    tentativa: number;

    marcarIntegracaoComErro?:
    boolean;
  }
): Promise<ResultadoProcessamentoEventoSaida> {
  const agora =
    new Date();

  await prisma.$transaction([
    prisma.eventoIntegracaoCaptacaoLead.update({
      where: {
        id:
          params.eventoId,
      },

      data: {
        status:
          StatusEventoIntegracaoCaptacaoLead.DESCARTADO,

        mensagemErro:
          params.mensagem,

        proximaTentativaEm:
          null,

        processadoEm:
          agora,
      },
    }),

    prisma.integracaoCaptacaoLead.update({
      where: {
        id:
          params.integracaoId,
      },

      data: {
        ultimoErroEm:
          agora,

        ultimoErro:
          params.mensagem,

        ...(params
          .marcarIntegracaoComErro
          ? {
            status:
              StatusIntegracaoCaptacaoLead.ERRO,
          }
          : {}),
      },
    }),
  ]);

  return {
    eventoId:
      params.eventoId,

    status:
      StatusEventoIntegracaoCaptacaoLead.DESCARTADO,

    tentativa:
      params.tentativa,

    entregue:
      false,

    descartado:
      true,

    ignorado:
      false,

    codigoHttp:
      null,

    proximaTentativaEm:
      null,

    mensagem:
      params.mensagem,
  };
}

async function registrarFalha(
  params: {
    eventoId: number;

    integracaoId:
    number;

    tentativa: number;

    maxTentativas:
    number;

    mensagem: string;

    codigoHttp:
    number | null;

    resposta?:
    unknown;
  }
): Promise<ResultadoProcessamentoEventoSaida> {
  const atingiuLimite =
    params.tentativa >=
    params.maxTentativas;

  const agora =
    new Date();

  const proximaTentativaEm =
    atingiuLimite
      ? null
      : calcularProximaTentativa(
        params.tentativa
      );

  const status =
    atingiuLimite
      ? StatusEventoIntegracaoCaptacaoLead.DESCARTADO
      : StatusEventoIntegracaoCaptacaoLead.ERRO;

  await prisma.$transaction([
    prisma.eventoIntegracaoCaptacaoLead.update({
      where: {
        id:
          params.eventoId,
      },

      data: {
        status,

        codigoHttp:
          params.codigoHttp,

        mensagemErro:
          params.mensagem,

        proximaTentativaEm,

        ...(params.resposta !==
          undefined
          ? {
            resposta:
              paraJsonPrisma(
                params.resposta
              ),
          }
          : {}),

        processadoEm:
          atingiuLimite
            ? agora
            : null,
      },
    }),

    prisma.integracaoCaptacaoLead.update({
      where: {
        id:
          params.integracaoId,
      },

      data: {
        ultimoErroEm:
          agora,

        ultimoErro:
          params.mensagem,

        ...(atingiuLimite
          ? {
            status:
              StatusIntegracaoCaptacaoLead.ERRO,
          }
          : {}),
      },
    }),
  ]);

  return {
    eventoId:
      params.eventoId,

    status,

    tentativa:
      params.tentativa,

    entregue:
      false,

    descartado:
      atingiuLimite,

    ignorado:
      false,

    codigoHttp:
      params.codigoHttp,

    proximaTentativaEm,

    mensagem:
      atingiuLimite
        ? "O webhook excedeu o número máximo de tentativas e foi descartado."
        : "Falha no envio do webhook. Uma nova tentativa foi programada.",
  };
}

export async function processarEventoSaidaCaptacao(
  params: {
    eventoId: number;

    instituicaoId?:
    number;
  }
): Promise<ResultadoProcessamentoEventoSaida> {
  const eventoId =
    idPositivo(
      params.eventoId
    );

  if (!eventoId) {
    throw new Error(
      "Evento de saída inválido."
    );
  }

  const instituicaoId =
    params.instituicaoId ===
      undefined
      ? null
      : idPositivo(
        params.instituicaoId
      );

  if (
    params.instituicaoId !==
    undefined &&
    !instituicaoId
  ) {
    throw new Error(
      "Instituição inválida."
    );
  }

  const agora =
    new Date();

  const evento =
    await prisma.eventoIntegracaoCaptacaoLead.findFirst({
      where: {
        id:
          eventoId,

        ...(instituicaoId
          ? {
            instituicaoId,
          }
          : {}),

        direcao:
          DirecaoEventoIntegracaoCaptacaoLead.SAIDA,
      },

      select: {
        id: true,

        instituicaoId:
          true,

        integracaoId:
          true,

        submissaoId:
          true,

        identificadorEvento:
          true,

        tipoEvento:
          true,

        status:
          true,

        payload:
          true,

        numeroTentativas:
          true,

        proximaTentativaEm:
          true,

        recebidoEm:
          true,

        integracao: {
          select: {
            id: true,

            nome: true,

            tipo: true,

            status:
              true,

            ativo: true,

            urlEndpoint:
              true,

            segredoCriptografado:
              true,

            configuracao:
              true,
          },
        },
      },
    });

  if (!evento) {
    throw new Error(
      "Evento de saída não encontrado."
    );
  }

  /*
   * Já terminou.
   */
  if (
    evento.status ===
    StatusEventoIntegracaoCaptacaoLead.ENTREGUE ||
    evento.status ===
    StatusEventoIntegracaoCaptacaoLead.DESCARTADO
  ) {
    return {
      eventoId:
        evento.id,

      status:
        evento.status,

      tentativa:
        evento.numeroTentativas,

      entregue:
        evento.status ===
        StatusEventoIntegracaoCaptacaoLead.ENTREGUE,

      descartado:
        evento.status ===
        StatusEventoIntegracaoCaptacaoLead.DESCARTADO,

      ignorado:
        true,

      codigoHttp:
        null,

      proximaTentativaEm:
        null,

      mensagem:
        "O evento já possui estado final.",
    };
  }

  if (
    evento.status ===
    StatusEventoIntegracaoCaptacaoLead.PROCESSANDO
  ) {
    return {
      eventoId:
        evento.id,

      status:
        evento.status,

      tentativa:
        evento.numeroTentativas,

      entregue:
        false,

      descartado:
        false,

      ignorado:
        true,

      codigoHttp:
        null,

      proximaTentativaEm:
        evento.proximaTentativaEm,

      mensagem:
        "O evento já está sendo processado por outra execução.",
    };
  }

  if (
    evento.proximaTentativaEm &&
    evento.proximaTentativaEm >
    agora
  ) {
    return {
      eventoId:
        evento.id,

      status:
        evento.status,

      tentativa:
        evento.numeroTentativas,

      entregue:
        false,

      descartado:
        false,

      ignorado:
        true,

      codigoHttp:
        null,

      proximaTentativaEm:
        evento.proximaTentativaEm,

      mensagem:
        "O evento ainda não atingiu o horário da próxima tentativa.",
    };
  }

  const integracao =
    evento.integracao;

  /*
   * Evento antigo apontando para
   * algo que deixou de ser webhook
   * de saída: não há como entregar.
   */
  if (
    integracao.tipo !==
    TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA
  ) {
    return registrarDescarte({
      eventoId:
        evento.id,

      integracaoId:
        integracao.id,

      tentativa:
        evento.numeroTentativas,

      mensagem:
        "A integração vinculada não é mais um webhook de saída.",

      marcarIntegracaoComErro:
        true,
    });
  }

  /*
   * Revogada ou desativada:
   * entregas pendentes deixam de
   * ser válidas.
   */
  if (
    integracao.status ===
    StatusIntegracaoCaptacaoLead.REVOGADA ||
    integracao.ativo ===
    false
  ) {
    return registrarDescarte({
      eventoId:
        evento.id,

      integracaoId:
        integracao.id,

      tentativa:
        evento.numeroTentativas,

      mensagem:
        "A integração foi revogada ou desativada.",

      marcarIntegracaoComErro:
        false,
    });
  }

  /*
   * PAUSADA/INATIVA:
   * não descartamos a fila.
   *
   * Quando for reativada, o worker
   * poderá continuar de onde parou.
   */
  if (
    integracao.status !==
    StatusIntegracaoCaptacaoLead.ATIVA
  ) {
    return {
      eventoId:
        evento.id,

      status:
        evento.status,

      tentativa:
        evento.numeroTentativas,

      entregue:
        false,

      descartado:
        false,

      ignorado:
        true,

      codigoHttp:
        null,

      proximaTentativaEm:
        evento.proximaTentativaEm,

      mensagem:
        "A integração não está ativa. O evento permanecerá na fila.",
    };
  }

  if (
    !integracao.urlEndpoint
  ) {
    return registrarDescarte({
      eventoId:
        evento.id,

      integracaoId:
        integracao.id,

      tentativa:
        evento.numeroTentativas,

      mensagem:
        "A integração não possui URL de destino configurada.",

      marcarIntegracaoComErro:
        true,
    });
  }

  /*
   * Claim atômico.
   *
   * Somente uma execução consegue
   * mudar PENDENTE/ERRO para
   * PROCESSANDO.
   */
  const claim =
    await prisma.eventoIntegracaoCaptacaoLead.updateMany({
      where: {
        id:
          evento.id,

        direcao:
          DirecaoEventoIntegracaoCaptacaoLead.SAIDA,

        status: {
          in: [
            StatusEventoIntegracaoCaptacaoLead.PENDENTE,
            StatusEventoIntegracaoCaptacaoLead.ERRO,
            StatusEventoIntegracaoCaptacaoLead.RECEBIDO,
          ],
        },

        OR: [
          {
            proximaTentativaEm:
              null,
          },

          {
            proximaTentativaEm: {
              lte:
                agora,
            },
          },
        ],
      },

      data: {
        status:
          StatusEventoIntegracaoCaptacaoLead.PROCESSANDO,

        numeroTentativas: {
          increment:
            1,
        },

        proximaTentativaEm:
          null,
      },
    });

  if (
    claim.count === 0
  ) {
    return {
      eventoId:
        evento.id,

      status:
        evento.status,

      tentativa:
        evento.numeroTentativas,

      entregue:
        false,

      descartado:
        false,

      ignorado:
        true,

      codigoHttp:
        null,

      proximaTentativaEm:
        evento.proximaTentativaEm,

      mensagem:
        "O evento foi assumido por outra execução ou não está mais elegível.",
    };
  }

  const tentativaAtual =
    evento.numeroTentativas +
    1;

  const maxTentativas =
    obterMaxTentativas(
      integracao.configuracao
    );

  const timeoutMs =
    obterTimeoutMs(
      integracao.configuracao
    );

  try {
    if (
      !integracao
        .segredoCriptografado
    ) {
      throw new Error(
        "A integração não possui segredo configurado."
      );
    }

    const segredo =
      descriptografarSegredo(
        integracao
          .segredoCriptografado
      );

    const endpoint =
      await validarEndpoint(
        integracao
          .urlEndpoint
      );

    const corpoObjeto =
      montarCorpoWebhook(
        evento
      );

    const corpo =
      JSON.stringify(
        corpoObjeto
      );

    const assinatura =
      montarAssinatura(
        corpo,
        segredo
      );

    const identificador =
      montarIdentificadorExterno(
        evento
      );

    /*
     * O segredo e a assinatura
     * NÃO são persistidos na
     * auditoria.
     */
    const headersAuditoria =
    {
      "content-type":
        "application/json",

      "user-agent":
        "PHANYX-Captacao/1.0",

      "x-phanyx-event-id":
        identificador,

      "x-phanyx-event-type":
        evento.tipoEvento,

      authorization:
        "[REDACTED]",

      "x-phanyx-signature":
        "[REDACTED]",
    };

    await prisma.eventoIntegracaoCaptacaoLead.update({
      where: {
        id:
          evento.id,
      },

      data: {
        headers:
          paraJsonPrisma(
            headersAuditoria
          ),
      },
    });

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        timeoutMs
      );

    let response:
      Response;

    try {
      response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              "User-Agent":
                "PHANYX-Captacao/1.0",

              Authorization:
                `Bearer ${segredo}`,

              "X-Phanyx-Event-Id":
                identificador,

              "X-Phanyx-Event-Type":
                evento.tipoEvento,

              "X-Phanyx-Signature":
                `sha256=${assinatura}`,
            },

            body:
              corpo,

            signal:
              controller.signal,

            /*
             * Não seguimos redirect
             * carregando credenciais
             * para outro endereço.
             */
            redirect:
              "error",

            cache:
              "no-store",
          }
        );
    } finally {
      clearTimeout(
        timeout
      );
    }

    const respostaHttp =
      await lerRespostaHttp(
        response
      );

    if (!response.ok) {
      const mensagem =
        `O endpoint respondeu HTTP ${response.status}.`;

      return registrarFalha({
        eventoId:
          evento.id,

        integracaoId:
          integracao.id,

        tentativa:
          tentativaAtual,

        maxTentativas,

        mensagem,

        codigoHttp:
          response.status,

        resposta:
          respostaHttp,
      });
    }

    const entregueEm =
      new Date();

    await prisma.$transaction([
      prisma.eventoIntegracaoCaptacaoLead.update({
        where: {
          id:
            evento.id,
        },

        data: {
          status:
            StatusEventoIntegracaoCaptacaoLead.ENTREGUE,

          codigoHttp:
            response.status,

          resposta:
            paraJsonPrisma(
              respostaHttp
            ),

          mensagemErro:
            null,

          proximaTentativaEm:
            null,

          processadoEm:
            entregueEm,
        },
      }),

      prisma.integracaoCaptacaoLead.update({
        where: {
          id:
            integracao.id,
        },

        data: {
          ultimoSucessoEm:
            entregueEm,
        },
      }),
    ]);

    return {
      eventoId:
        evento.id,

      status:
        StatusEventoIntegracaoCaptacaoLead.ENTREGUE,

      tentativa:
        tentativaAtual,

      entregue:
        true,

      descartado:
        false,

      ignorado:
        false,

      codigoHttp:
        response.status,

      proximaTentativaEm:
        null,

      mensagem:
        "Webhook entregue com sucesso.",
    };
  } catch (error) {
    const ehTimeout =
      error instanceof Error &&
      (
        error.name ===
        "AbortError" ||
        error.message
          .toLowerCase()
          .includes(
            "aborted"
          )
      );

    const mensagem =
      ehTimeout
        ? `O webhook excedeu o tempo limite de ${timeoutMs} ms.`
        : (
          error instanceof
            Error
            ? limitarTexto(
              error.message,
              4000
            )
            : "Falha desconhecida no envio do webhook."
        );

    return registrarFalha({
      eventoId:
        evento.id,

      integracaoId:
        integracao.id,

      tentativa:
        tentativaAtual,

      maxTentativas,

      mensagem,

      codigoHttp:
        null,

      resposta: {
        success:
          false,

        timeout:
          ehTimeout,

        erro:
          mensagem,
      },
    });
  }
}