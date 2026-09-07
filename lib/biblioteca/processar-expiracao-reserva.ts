import {
  AcaoAuditoriaBiblioteca,
  Prisma,
  StatusExemplarBiblioteca,
  StatusReservaBiblioteca,
} from "@prisma/client";

type ArgumentosProcessarExpiracaoReserva = {
  transacao: Prisma.TransactionClient;
  reservaId: number;

  agora?: Date;

  origem: string;

  usuarioId?: number | null;

  ip?: string | null;

  userAgent?: string | null;
};

export type ResultadoProcessarExpiracaoReserva = {
  processada: boolean;

  reservaId: number;

  instituicaoId: number | null;

  itemId: number | null;

  exemplarId: number | null;

  proximaReservaId: number | null;

  exemplarStatus:
    | StatusExemplarBiblioteca
    | null;

  motivoIgnorada?: string;
};

export async function processarExpiracaoReservaDisponivel({
  transacao,
  reservaId,
  agora = new Date(),
  origem,
  usuarioId = null,
  ip = null,
  userAgent = null,
}: ArgumentosProcessarExpiracaoReserva): Promise<ResultadoProcessarExpiracaoReserva> {
  /*
   * Evita duas execuções simultâneas
   * processarem a mesma reserva.
   */
  await transacao.$queryRaw`
    SELECT "id"
    FROM "BibliotecaReserva"
    WHERE "id" = ${reservaId}
    FOR UPDATE
  `;

  const reserva =
    await transacao.bibliotecaReserva.findUnique({
      where: {
        id: reservaId,
      },

      select: {
        id: true,
        instituicaoId: true,
        itemId: true,
        exemplarId: true,
        usuarioId: true,
        status: true,
        posicaoFila: true,
        reservadaEm: true,
        disponivelEm: true,
        expiraEm: true,
      },
    });

  if (!reserva) {
    return {
      processada: false,
      reservaId,
      instituicaoId: null,
      itemId: null,
      exemplarId: null,
      proximaReservaId: null,
      exemplarStatus: null,
      motivoIgnorada:
        "RESERVA_NAO_ENCONTRADA",
    };
  }

  if (
    reserva.status !==
    StatusReservaBiblioteca.DISPONIVEL
  ) {
    return {
      processada: false,
      reservaId,
      instituicaoId:
        reserva.instituicaoId,
      itemId:
        reserva.itemId,
      exemplarId:
        reserva.exemplarId,
      proximaReservaId: null,
      exemplarStatus: null,
      motivoIgnorada:
        "RESERVA_NAO_DISPONIVEL",
    };
  }

  if (!reserva.expiraEm) {
    return {
      processada: false,
      reservaId,
      instituicaoId:
        reserva.instituicaoId,
      itemId:
        reserva.itemId,
      exemplarId:
        reserva.exemplarId,
      proximaReservaId: null,
      exemplarStatus: null,
      motivoIgnorada:
        "RESERVA_SEM_EXPIRACAO",
    };
  }

  if (
    reserva.expiraEm.getTime() >
    agora.getTime()
  ) {
    return {
      processada: false,
      reservaId,
      instituicaoId:
        reserva.instituicaoId,
      itemId:
        reserva.itemId,
      exemplarId:
        reserva.exemplarId,
      proximaReservaId: null,
      exemplarStatus: null,
      motivoIgnorada:
        "RESERVA_AINDA_VALIDA",
    };
  }

  /*
   * Serializa qualquer alteração da
   * fila de reservas deste item.
   */
  await transacao.$queryRaw`
    SELECT "id"
    FROM "BibliotecaItem"
    WHERE "id" = ${reserva.itemId}
      AND "instituicaoId" = ${reserva.instituicaoId}
    FOR UPDATE
  `;

  let exemplarStatus:
    | StatusExemplarBiblioteca
    | null = null;

  let exemplarPodeSerRepassado =
    false;

  if (reserva.exemplarId) {
    await transacao.$queryRaw`
      SELECT "id"
      FROM "BibliotecaExemplar"
      WHERE "id" = ${reserva.exemplarId}
        AND "instituicaoId" = ${reserva.instituicaoId}
      FOR UPDATE
    `;

    const exemplar =
      await transacao.bibliotecaExemplar.findFirst({
        where: {
          id:
            reserva.exemplarId,

          instituicaoId:
            reserva.instituicaoId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    exemplarStatus =
      exemplar?.status ?? null;

    exemplarPodeSerRepassado =
      exemplar?.status ===
      StatusExemplarBiblioteca.RESERVADO;
  }

  /*
   * A reserva vencida deixa de ser
   * uma reserva ativa.
   *
   * Não usamos canceladaEm porque
   * expiração e cancelamento são
   * eventos diferentes.
   */
  await transacao.bibliotecaReserva.update({
    where: {
      id: reserva.id,
    },

    data: {
      status:
        StatusReservaBiblioteca.EXPIRADA,

      posicaoFila: null,
    },
  });

  let proximaReservaId:
    number | null = null;

  /*
   * Só repassamos o exemplar quando
   * ele ainda está efetivamente
   * reservado.
   *
   * Se o estado do exemplar estiver
   * inconsistente, não sobrescrevemos
   * automaticamente um status como
   * EMPRESTADO, MANUTENCAO etc.
   */
  if (
    reserva.exemplarId &&
    exemplarPodeSerRepassado
  ) {
    const proximaReserva =
      await transacao.bibliotecaReserva.findFirst({
        where: {
          instituicaoId:
            reserva.instituicaoId,

          itemId:
            reserva.itemId,

          status:
            StatusReservaBiblioteca.AGUARDANDO,

          OR: [
            {
              exemplarId: null,
            },
            {
              exemplarId:
                reserva.exemplarId,
            },
          ],
        },

        orderBy: [
          {
            posicaoFila: "asc",
          },
          {
            reservadaEm: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          usuarioId: true,
          posicaoFila: true,
        },
      });

    if (proximaReserva) {
      const configuracao =
        await transacao.bibliotecaConfiguracao.findUnique({
          where: {
            instituicaoId:
              reserva.instituicaoId,
          },

          select: {
            diasReservaPadrao: true,
          },
        });

      const diasReserva =
        Math.max(
          0,
          Number(
            configuracao?.diasReservaPadrao ??
              0
          )
        );

      const novaExpiracao =
        diasReserva > 0
          ? new Date(
              agora.getTime() +
                diasReserva *
                  24 *
                  60 *
                  60 *
                  1000
            )
          : null;

      await transacao.bibliotecaReserva.update({
        where: {
          id:
            proximaReserva.id,
        },

        data: {
          status:
            StatusReservaBiblioteca.DISPONIVEL,

          exemplarId:
            reserva.exemplarId,

          posicaoFila:
            null,

          disponivelEm:
            agora,

          expiraEm:
            novaExpiracao,
        },
      });

      if (
        proximaReserva.posicaoFila !==
        null
      ) {
        await transacao.bibliotecaReserva.updateMany({
          where: {
            instituicaoId:
              reserva.instituicaoId,

            itemId:
              reserva.itemId,

            status:
              StatusReservaBiblioteca.AGUARDANDO,

            posicaoFila: {
              gt:
                proximaReserva.posicaoFila,
            },
          },

          data: {
            posicaoFila: {
              decrement: 1,
            },
          },
        });
      }

      await transacao.bibliotecaExemplar.update({
        where: {
          id:
            reserva.exemplarId,
        },

        data: {
          status:
            StatusExemplarBiblioteca.RESERVADO,

          atualizadoPorId:
            usuarioId,
        },
      });

      proximaReservaId =
        proximaReserva.id;

      exemplarStatus =
        StatusExemplarBiblioteca.RESERVADO;

      await transacao.bibliotecaAuditoria.create({
        data: {
          instituicaoId:
            reserva.instituicaoId,

          usuarioId,

          entidade:
            "BibliotecaReserva",

          entidadeId:
            String(
              proximaReserva.id
            ),

          acao:
            AcaoAuditoriaBiblioteca.RESERVAR,

          descricao:
            "Reserva disponibilizada automaticamente após expiração da reserva anterior.",

          dadosAnteriores: {
            status:
              StatusReservaBiblioteca.AGUARDANDO,

            posicaoFila:
              proximaReserva.posicaoFila,
          },

          dadosPosteriores: {
            status:
              StatusReservaBiblioteca.DISPONIVEL,

            exemplarId:
              reserva.exemplarId,

            disponivelEm:
              agora.toISOString(),

            expiraEm:
              novaExpiracao
                ?.toISOString() ??
              null,
          },

          metadados: {
            origem,

            processamento:
              "expiracao_automatica",

            reservaExpiradaId:
              reserva.id,

            usuarioReservaId:
              proximaReserva.usuarioId,

            itemId:
              reserva.itemId,

            exemplarId:
              reserva.exemplarId,
          },

          ip,
          userAgent,
        },
      });
    } else {
      /*
       * Ninguém aguardando:
       * exemplar volta a circular.
       */
      await transacao.bibliotecaExemplar.update({
        where: {
          id:
            reserva.exemplarId,
        },

        data: {
          status:
            StatusExemplarBiblioteca.DISPONIVEL,

          atualizadoPorId:
            usuarioId,
        },
      });

      exemplarStatus =
        StatusExemplarBiblioteca.DISPONIVEL;
    }
  }

  await transacao.bibliotecaAuditoria.create({
    data: {
      instituicaoId:
        reserva.instituicaoId,

      usuarioId,

      entidade:
        "BibliotecaReserva",

      entidadeId:
        String(
          reserva.id
        ),

      acao:
        AcaoAuditoriaBiblioteca.ATUALIZAR,

      descricao:
        "Reserva expirada automaticamente.",

      dadosAnteriores: {
        status:
          StatusReservaBiblioteca.DISPONIVEL,

        exemplarId:
          reserva.exemplarId,

        disponivelEm:
          reserva.disponivelEm
            ?.toISOString() ??
          null,

        expiraEm:
          reserva.expiraEm
            ?.toISOString() ??
          null,
      },

      dadosPosteriores: {
        status:
          StatusReservaBiblioteca.EXPIRADA,

        proximaReservaId,

        exemplarStatus,
      },

      metadados: {
        origem,

        processamento:
          "expiracao_automatica",

        itemId:
          reserva.itemId,

        exemplarId:
          reserva.exemplarId,

        usuarioReservaId:
          reserva.usuarioId,
      },

      ip,
      userAgent,
    },
  });

  return {
    processada: true,

    reservaId:
      reserva.id,

    instituicaoId:
      reserva.instituicaoId,

    itemId:
      reserva.itemId,

    exemplarId:
      reserva.exemplarId,

    proximaReservaId,

    exemplarStatus,
  };
}