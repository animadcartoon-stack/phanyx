import {
  DirecaoEventoIntegracaoCaptacaoLead,
  Prisma,
  StatusEventoIntegracaoCaptacaoLead,
  StatusIntegracaoCaptacaoLead,
  TipoIntegracaoCaptacaoLead,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const EVENTOS_SAIDA_CAPTACAO = {
  SUBMISSAO_PROCESSADA:
    "SUBMISSAO_PROCESSADA",

  SUBMISSAO_DUPLICADA:
    "SUBMISSAO_DUPLICADA",

  SUBMISSAO_REJEITADA:
    "SUBMISSAO_REJEITADA",

  LEAD_CRIADO:
    "LEAD_CRIADO",

  LEAD_ATUALIZADO:
    "LEAD_ATUALIZADO",

  TAREFA_CRIADA:
    "TAREFA_CRIADA",
} as const;

export type TipoEventoSaidaCaptacao =
  typeof EVENTOS_SAIDA_CAPTACAO[
    keyof typeof EVENTOS_SAIDA_CAPTACAO
  ];

export type ResultadoEnfileiramentoSaida = {
  tipoEvento: string;

  quantidadeIntegracoes:
    number;

  quantidadeEnfileirada:
    number;

  quantidadeJaExistente:
    number;

  eventos: Array<{
    eventoId: number;
    integracaoId: number;
    integracaoNome: string;
    criadoAgora: boolean;
  }>;
};

function textoEvento(
  valor: unknown
) {
  const texto =
    String(valor ?? "")
      .trim()
      .toUpperCase();

  if (!texto) {
    throw new Error(
      "Tipo do evento de saída não informado."
    );
  }

  if (texto.length > 200) {
    throw new Error(
      "O tipo do evento de saída excede o tamanho permitido."
    );
  }

  return texto;
}

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

function normalizarListaEventos(
  valor: Prisma.JsonValue | null
): string[] | null {
  /*
   * null = todos os eventos.
   *
   * Isso permite que uma integração
   * de webhook de saída seja criada
   * sem lista explícita e ainda
   * receba os eventos.
   */
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  if (Array.isArray(valor)) {
    const eventos =
      valor
        .filter(
          (
            item
          ): item is string =>
            typeof item ===
            "string"
        )
        .map((item) =>
          item
            .trim()
            .toUpperCase()
        )
        .filter(Boolean);

    /*
     * Lista vazia também é
     * interpretada como todos.
     */
    return eventos.length
      ? Array.from(
          new Set(eventos)
        )
      : null;
  }

  /*
   * Também aceitamos:
   *
   * {
   *   "eventos": [
   *     "LEAD_CRIADO",
   *     "SUBMISSAO_PROCESSADA"
   *   ]
   * }
   */
  if (
    typeof valor === "object"
  ) {
    const objeto =
      valor as Record<
        string,
        Prisma.JsonValue
      >;

    const eventos =
      objeto.eventos;

    if (
      Array.isArray(
        eventos
      )
    ) {
      const lista =
        eventos
          .filter(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          )
          .map((item) =>
            item
              .trim()
              .toUpperCase()
          )
          .filter(Boolean);

      return lista.length
        ? Array.from(
            new Set(lista)
          )
        : null;
    }
  }

  return null;
}

function integracaoAssinaEvento(
  eventosAssinados:
    Prisma.JsonValue | null,
  tipoEvento: string
) {
  const eventos =
    normalizarListaEventos(
      eventosAssinados
    );

  if (!eventos) {
    return true;
  }

  return (
    eventos.includes("*") ||
    eventos.includes(
      tipoEvento
    )
  );
}

function identificadorEvento(
  params: {
    tipoEvento: string;
    chaveEvento: string | null;
  }
) {
  if (!params.chaveEvento) {
    return null;
  }

  const chave =
    params.chaveEvento
      .trim();

  if (!chave) {
    return null;
  }

  /*
   * Esse identificador será único
   * dentro de cada integração.
   *
   * Exemplo:
   *
   * SUBMISSAO_PROCESSADA:submissao:81
   */
  return `${params.tipoEvento}:${chave}`.slice(
    0,
    500
  );
}

export async function enfileirarEventoSaidaCaptacao(
  params: {
    instituicaoId: number;

    tipoEvento:
      | TipoEventoSaidaCaptacao
      | string;

    payload: unknown;

    submissaoId?:
      number | null;

    /*
     * Quando fornecida, torna o
     * enfileiramento idempotente.
     *
     * Exemplo:
     *
     * chaveEvento:
     * "submissao:81"
     */
    chaveEvento?:
      string | null;
  }
): Promise<ResultadoEnfileiramentoSaida> {
  const instituicaoId =
    idPositivo(
      params.instituicaoId
    );

  if (!instituicaoId) {
    throw new Error(
      "Instituição inválida para o evento de saída."
    );
  }

  const tipoEvento =
    textoEvento(
      params.tipoEvento
    );

  const submissaoId =
    params.submissaoId ===
      undefined ||
    params.submissaoId ===
      null
      ? null
      : idPositivo(
          params.submissaoId
        );

  if (
    params.submissaoId !==
      undefined &&
    params.submissaoId !==
      null &&
    !submissaoId
  ) {
    throw new Error(
      "Submissão inválida para o evento de saída."
    );
  }

  if (submissaoId) {
    /*
     * Evita relacionar um evento
     * de uma instituição com uma
     * submissão pertencente a outra.
     */
    const submissao =
      await prisma.submissaoCaptacaoLead.findFirst({
        where: {
          id:
            submissaoId,

          instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!submissao) {
      throw new Error(
        "A submissão informada não pertence à instituição."
      );
    }
  }

  const integracoes =
    await prisma.integracaoCaptacaoLead.findMany({
      where: {
        instituicaoId,

        tipo:
          TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA,

        status:
          StatusIntegracaoCaptacaoLead.ATIVA,

        ativo: true,

        urlEndpoint: {
          not: null,
        },
      },

      select: {
        id: true,
        nome: true,

        eventosAssinados:
          true,
      },

      orderBy: {
        id: "asc",
      },
    });

  const destinatarias =
    integracoes.filter(
      (integracao) =>
        integracaoAssinaEvento(
          integracao.eventosAssinados,
          tipoEvento
        )
    );

  const chaveEvento =
    params.chaveEvento
      ? String(
          params.chaveEvento
        ).trim()
      : null;

  const identificador =
    identificadorEvento({
      tipoEvento,
      chaveEvento,
    });

  const payload =
    paraJsonPrisma(
      params.payload
    );

  const eventos:
    ResultadoEnfileiramentoSaida["eventos"] =
      [];

  let quantidadeEnfileirada =
    0;

  let quantidadeJaExistente =
    0;

  for (
    const integracao of
    destinatarias
  ) {
    /*
     * Se existe identificador,
     * verificamos antes para evitar
     * enfileirar novamente o mesmo
     * evento de negócio.
     */
    if (identificador) {
      const existente =
        await prisma.eventoIntegracaoCaptacaoLead.findFirst({
          where: {
            integracaoId:
              integracao.id,

            identificadorEvento:
              identificador,
          },

          select: {
            id: true,
          },
        });

      if (existente) {
        quantidadeJaExistente +=
          1;

        eventos.push({
          eventoId:
            existente.id,

          integracaoId:
            integracao.id,

          integracaoNome:
            integracao.nome,

          criadoAgora:
            false,
        });

        continue;
      }
    }

    try {
      const evento =
        await prisma.eventoIntegracaoCaptacaoLead.create({
          data: {
            instituicaoId,

            integracaoId:
              integracao.id,

            submissaoId,

            identificadorEvento:
              identificador,

            tipoEvento,

            direcao:
              DirecaoEventoIntegracaoCaptacaoLead.SAIDA,

            status:
              StatusEventoIntegracaoCaptacaoLead.PENDENTE,

            payload,

            numeroTentativas:
              0,

            /*
             * Já fica elegível para
             * o primeiro processamento.
             */
            proximaTentativaEm:
              new Date(),
          },

          select: {
            id: true,
          },
        });

      quantidadeEnfileirada +=
        1;

      eventos.push({
        eventoId:
          evento.id,

        integracaoId:
          integracao.id,

        integracaoNome:
          integracao.nome,

        criadoAgora:
          true,
      });
    } catch (error) {
      /*
       * Duas execuções podem passar
       * pela consulta acima ao mesmo
       * tempo.
       *
       * A constraint UNIQUE do banco
       * é a proteção definitiva.
       */
      if (
        identificador &&
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existente =
          await prisma.eventoIntegracaoCaptacaoLead.findFirst({
            where: {
              integracaoId:
                integracao.id,

              identificadorEvento:
                identificador,
            },

            select: {
              id: true,
            },
          });

        if (existente) {
          quantidadeJaExistente +=
            1;

          eventos.push({
            eventoId:
              existente.id,

            integracaoId:
              integracao.id,

            integracaoNome:
              integracao.nome,

            criadoAgora:
              false,
          });

          continue;
        }
      }

      throw error;
    }
  }

  return {
    tipoEvento,

    quantidadeIntegracoes:
      destinatarias.length,

    quantidadeEnfileirada,

    quantidadeJaExistente,

    eventos,
  };
}