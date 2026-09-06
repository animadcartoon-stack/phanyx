import {
  AcaoAuditoriaBiblioteca,
  StatusExemplarBiblioteca,
  StatusReservaBiblioteca,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    reservaId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo
  );
}

function obterReservaId(
  params: ContextoRota["params"]
) {
  const reservaId =
    Number(params.reservaId);

  if (
    !Number.isInteger(reservaId) ||
    reservaId <= 0
  ) {
    falhar(
      400,
      "Reserva inválida.",
      "RESERVA_INVALIDA"
    );
  }

  return reservaId;
}

function textoOpcional(
  valor: unknown,
  limite: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(
      400,
      "O motivo informado é inválido.",
      "MOTIVO_INVALIDO"
    );
  }

  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > limite) {
    falhar(
      400,
      "O motivo excede o limite permitido.",
      "MOTIVO_MUITO_LONGO"
    );
  }

  return texto;
}

function obterIp(
  request: NextRequest
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  return (
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null
  );
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return responder(
    resposta.corpo,
    resposta.status
  );
}

export async function POST(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido cancelar reservas durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.reservas.gerenciar"
    );

    const reservaId =
      obterReservaId(params);

    let corpo: {
      motivo?: unknown;
    } = {};

    try {
      corpo =
        await request.json();
    } catch {
      /*
       * Corpo vazio é permitido.
       */
    }

    const motivo =
      textoOpcional(
        corpo.motivo,
        5_000
      );

    const agora =
      new Date();

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const resultado =
      await prisma.$transaction(
        async (transacao) => {
          /*
           * Bloqueia a reserva durante
           * todo o cancelamento.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaReserva"
            WHERE "id" = ${reservaId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const reserva =
            await transacao
              .bibliotecaReserva
              .findFirst({
                where: {
                  id: reservaId,
                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  itemId: true,
                  exemplarId: true,
                  usuarioId: true,
                  status: true,
                  posicaoFila: true,
                },
              });

          if (!reserva) {
            falhar(
              404,
              "Reserva não encontrada.",
              "RESERVA_NAO_ENCONTRADA"
            );
          }

          if (
            reserva.status !==
              StatusReservaBiblioteca.AGUARDANDO &&
            reserva.status !==
              StatusReservaBiblioteca.DISPONIVEL
          ) {
            falhar(
              409,
              "Esta reserva não pode mais ser cancelada.",
              "RESERVA_NAO_CANCELAVEL"
            );
          }

          /*
           * Serializa alterações na fila
           * do mesmo item.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaItem"
            WHERE "id" = ${reserva.itemId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const statusAnterior =
            reserva.status;

          const posicaoAnterior =
            reserva.posicaoFila;

          await transacao
            .bibliotecaReserva
            .update({
              where: {
                id: reserva.id,
              },

              data: {
                status:
                  StatusReservaBiblioteca.CANCELADA,

                canceladaEm:
                  agora,

                canceladaPorId:
                  usuario.id,

                motivoCancelamento:
                  motivo,

                posicaoFila:
                  null,
              },
            });

          /*
           * Se estava apenas na fila,
           * compacta as posições restantes.
           */
          if (
            statusAnterior ===
              StatusReservaBiblioteca.AGUARDANDO &&
            posicaoAnterior !== null
          ) {
            await transacao
              .bibliotecaReserva
              .updateMany({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId:
                    reserva.itemId,

                  status:
                    StatusReservaBiblioteca.AGUARDANDO,

                  posicaoFila: {
                    gt:
                      posicaoAnterior,
                  },
                },

                data: {
                  posicaoFila: {
                    decrement: 1,
                  },
                },
              });
          }

          let proximaReservaId:
            number | null = null;

          let exemplarStatus:
            StatusExemplarBiblioteca | null =
              null;

          /*
           * Se esta reserva já segurava um
           * exemplar, o exemplar precisa
           * ser liberado ou repassado.
           */
          if (
            statusAnterior ===
              StatusReservaBiblioteca.DISPONIVEL &&
            reserva.exemplarId
          ) {
            await transacao.$queryRaw`
              SELECT "id"
              FROM "BibliotecaExemplar"
              WHERE "id" = ${reserva.exemplarId}
                AND "instituicaoId" = ${contexto.instituicaoId}
              FOR UPDATE
            `;

            const proximaReserva =
              await transacao
                .bibliotecaReserva
                .findFirst({
                  where: {
                    instituicaoId:
                      contexto.instituicaoId,

                    itemId:
                      reserva.itemId,

                    status:
                      StatusReservaBiblioteca.AGUARDANDO,

                    OR: [
                      {
                        exemplarId:
                          null,
                      },
                      {
                        exemplarId:
                          reserva.exemplarId,
                      },
                    ],
                  },

                  orderBy: [
                    {
                      posicaoFila:
                        "asc",
                    },
                    {
                      reservadaEm:
                        "asc",
                    },
                    {
                      id:
                        "asc",
                    },
                  ],

                  select: {
                    id: true,
                    posicaoFila: true,
                    usuarioId: true,
                  },
                });

            if (proximaReserva) {
              const configuracao =
                await transacao
                  .bibliotecaConfiguracao
                  .findUnique({
                    where: {
                      instituicaoId:
                        contexto.instituicaoId,
                    },

                    select: {
                      diasReservaPadrao:
                        true,
                    },
                  });

              const diasReserva =
                Math.max(
                  0,
                  Number(
                    configuracao
                      ?.diasReservaPadrao ??
                      0
                  )
                );

              const expiraEm =
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

              await transacao
                .bibliotecaReserva
                .update({
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

                    expiraEm,
                  },
                });

              if (
                proximaReserva
                  .posicaoFila !==
                null
              ) {
                await transacao
                  .bibliotecaReserva
                  .updateMany({
                    where: {
                      instituicaoId:
                        contexto.instituicaoId,

                      itemId:
                        reserva.itemId,

                      status:
                        StatusReservaBiblioteca.AGUARDANDO,

                      posicaoFila: {
                        gt:
                          proximaReserva
                            .posicaoFila,
                      },
                    },

                    data: {
                      posicaoFila: {
                        decrement: 1,
                      },
                    },
                  });
              }

              await transacao
                .bibliotecaExemplar
                .update({
                  where: {
                    id:
                      reserva.exemplarId,
                  },

                  data: {
                    status:
                      StatusExemplarBiblioteca.RESERVADO,

                    atualizadoPorId:
                      usuario.id,
                  },
                });

              proximaReservaId =
                proximaReserva.id;

              exemplarStatus =
                StatusExemplarBiblioteca.RESERVADO;

              await transacao
                .bibliotecaAuditoria
                .create({
                  data: {
                    instituicaoId:
                      contexto.instituicaoId,

                    usuarioId:
                      usuario.id,

                    entidade:
                      "BibliotecaReserva",

                    entidadeId:
                      String(
                        proximaReserva.id
                      ),

                    acao:
                      AcaoAuditoriaBiblioteca.RESERVAR,

                    descricao:
                      "Reserva disponibilizada automaticamente após cancelamento da reserva anterior.",

                    dadosAnteriores: {
                      status:
                        StatusReservaBiblioteca.AGUARDANDO,
                    },

                    dadosPosteriores: {
                      status:
                        StatusReservaBiblioteca.DISPONIVEL,

                      exemplarId:
                        reserva.exemplarId,

                      expiraEm:
                        expiraEm
                          ?.toISOString() ??
                        null,
                    },

                    metadados: {
                      origem:
                        "api_admin_biblioteca_reserva_cancelar",

                      itemId:
                        reserva.itemId,

                      exemplarId:
                        reserva.exemplarId,

                      usuarioReservaId:
                        proximaReserva
                          .usuarioId,
                    },

                    ip,
                    userAgent,
                  },
                });
            } else {
              await transacao
                .bibliotecaExemplar
                .update({
                  where: {
                    id:
                      reserva.exemplarId,
                  },

                  data: {
                    status:
                      StatusExemplarBiblioteca.DISPONIVEL,

                    atualizadoPorId:
                      usuario.id,
                  },
                });

              exemplarStatus =
                StatusExemplarBiblioteca.DISPONIVEL;
            }
          }

          await transacao
            .bibliotecaAuditoria
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                usuarioId:
                  usuario.id,

                entidade:
                  "BibliotecaReserva",

                entidadeId:
                  String(
                    reserva.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.CANCELAR,

                descricao:
                  "Reserva cancelada na Biblioteca Virtual.",

                dadosAnteriores: {
                  status:
                    statusAnterior,

                  posicaoFila:
                    posicaoAnterior,

                  exemplarId:
                    reserva.exemplarId,
                },

                dadosPosteriores: {
                  status:
                    StatusReservaBiblioteca.CANCELADA,

                  canceladaEm:
                    agora.toISOString(),

                  motivoCancelamento:
                    motivo,

                  proximaReservaId,

                  exemplarStatus,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_reserva_cancelar",

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
            reservaId:
              reserva.id,

            proximaReservaId,

            exemplarId:
              reserva.exemplarId,

            exemplarStatus,
          };
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        }
      );

    return responder({
      ok: true,

      mensagem:
        "Reserva cancelada com sucesso.",

      reservaId:
        resultado.reservaId,

      proximaReservaId:
        resultado.proximaReservaId,

      exemplarId:
        resultado.exemplarId,

      exemplarStatus:
        resultado.exemplarStatus,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}