import {
  AcaoAuditoriaBiblioteca,
  OrigemReservaBiblioteca,
  StatusExemplarBiblioteca,
  StatusReservaBiblioteca,
  TipoExemplarBiblioteca,
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

function responder(
  corpo: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(corpo, {
    status,

    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
  );
}

function responderErro(
  erro: unknown,
) {
  const resposta =
    respostaErroBiblioteca(erro);

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

function inteiroPositivo(
  valor: unknown,
  campo: string,
) {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    falhar(
      400,
      `O campo ${campo} é inválido.`,
      "CAMPO_INVALIDO",
    );
  }

  return numero;
}

function inteiroPositivoOpcional(
  valor: unknown,
  campo: string,
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  return inteiroPositivo(
    valor,
    campo,
  );
}

function textoOpcional(
  valor: unknown,
  limite: number,
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
      "A observação informada é inválida.",
      "OBSERVACAO_INVALIDA",
    );
  }

  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > limite) {
    falhar(
      400,
      "A observação excede o limite permitido.",
      "OBSERVACAO_MUITO_LONGA",
    );
  }

  return texto;
}

function obterIp(
  request: NextRequest,
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for",
    );

  return (
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip",
    ) ||
    null
  );
}

function calcularExpiracao(
  inicio: Date,
  dias: number,
) {
  if (
    !Number.isInteger(dias) ||
    dias <= 0
  ) {
    return null;
  }

  return new Date(
    inicio.getTime() +
      dias * 24 * 60 * 60 * 1000,
  );
}

/* =========================================================
   POST
   Cria uma reserva administrativa da Biblioteca
   ========================================================= */

export async function POST(
  request: NextRequest,
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido criar reservas durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.reservas.gerenciar",
    );

    if (
      !contexto.configuracao ||
      !contexto.configuracao
        .permitirReserva
    ) {
      falhar(
        409,
        "As reservas estão desativadas nas configurações da Biblioteca.",
        "RESERVAS_DESATIVADAS",
      );
    }

    let corpo: {
      itemId?: unknown;
      exemplarId?: unknown;
      usuarioId?: unknown;
      observacao?: unknown;
    };

    try {
      corpo =
        await request.json();
    } catch {
      falhar(
        400,
        "O corpo da requisição contém um JSON inválido.",
        "JSON_INVALIDO",
      );
    }

    const itemId =
      inteiroPositivo(
        corpo.itemId,
        "itemId",
      );

    const usuarioId =
      inteiroPositivo(
        corpo.usuarioId,
        "usuarioId",
      );

    const exemplarId =
      inteiroPositivoOpcional(
        corpo.exemplarId,
        "exemplarId",
      );

    const observacao =
      textoOpcional(
        corpo.observacao,
        5_000,
      );

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent",
      );

    const agora =
      new Date();

    const configuracaoReserva =
  await prisma
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
      configuracaoReserva
        ?.diasReservaPadrao ?? 0
    )
  );

    const resultado =
      await prisma.$transaction(
        async (transacao) => {
          /*
           * Serializa a fila de reservas
           * do mesmo item.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaItem"
            WHERE "id" = ${itemId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const item =
            await transacao
              .bibliotecaItem
              .findFirst({
                where: {
                  id: itemId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  titulo: true,
                  arquivadoEm: true,
                },
              });

          if (!item) {
            falhar(
              404,
              "Item não encontrado nesta biblioteca.",
              "ITEM_NAO_ENCONTRADO",
            );
          }

          if (item.arquivadoEm) {
            falhar(
              409,
              "Não é possível reservar um item arquivado.",
              "ITEM_ARQUIVADO",
            );
          }

          const tomador =
            await transacao
              .user
              .findFirst({
                where: {
                  id: usuarioId,

                  instituicaoId:
                    contexto.instituicaoId,

                  ativo: true,
                },

                select: {
                  id: true,
                  nome: true,
                  email: true,
                  role: true,
                },
              });

          if (!tomador) {
            falhar(
              404,
              "O usuário selecionado não foi encontrado ou está inativo.",
              "USUARIO_RESERVA_INVALIDO",
            );
          }

          /*
           * A mesma pessoa não pode ocupar
           * duas posições ativas na fila
           * do mesmo item.
           */
          const reservaExistente =
            await transacao
              .bibliotecaReserva
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId,

                  usuarioId:
                    tomador.id,

                  status: {
                    in: [
                      StatusReservaBiblioteca.AGUARDANDO,
                      StatusReservaBiblioteca.DISPONIVEL,
                    ],
                  },
                },

                select: {
                  id: true,
                  status: true,
                  posicaoFila: true,
                },
              });

          if (reservaExistente) {
            falhar(
              409,
              "Este usuário já possui uma reserva ativa para este item.",
              "RESERVA_ATIVA_JA_EXISTE",
            );
          }

          let exemplarEscolhido:
            | {
                id: number;
                tipo: TipoExemplarBiblioteca;
                status: StatusExemplarBiblioteca;
                permiteEmprestimo: boolean;
                baixadoEm: Date | null;
              }
            | null = null;

          if (exemplarId) {
            exemplarEscolhido =
              await transacao
                .bibliotecaExemplar
                .findFirst({
                  where: {
                    id: exemplarId,

                    instituicaoId:
                      contexto.instituicaoId,

                    itemId,
                  },

                  select: {
                    id: true,
                    tipo: true,
                    status: true,
                    permiteEmprestimo:
                      true,
                    baixadoEm: true,
                  },
                });

            if (!exemplarEscolhido) {
              falhar(
                404,
                "O exemplar informado não pertence a este item.",
                "EXEMPLAR_RESERVA_NAO_ENCONTRADO",
              );
            }

            if (
              exemplarEscolhido.tipo !==
                TipoExemplarBiblioteca.FISICO ||
              !exemplarEscolhido
                .permiteEmprestimo ||
              exemplarEscolhido
                .baixadoEm
            ) {
              falhar(
                409,
                "O exemplar informado não pode ser reservado.",
                "EXEMPLAR_NAO_RESERVAVEL",
              );
            }
          } else {
            /*
             * Procura primeiro um exemplar que
             * já possa ser separado imediatamente.
             */
            exemplarEscolhido =
              await transacao
                .bibliotecaExemplar
                .findFirst({
                  where: {
                    instituicaoId:
                      contexto.instituicaoId,

                    itemId,

                    tipo:
                      TipoExemplarBiblioteca.FISICO,

                    permiteEmprestimo:
                      true,

                    baixadoEm: null,

                    status:
                      StatusExemplarBiblioteca.DISPONIVEL,
                  },

                  orderBy: {
                    id: "asc",
                  },

                  select: {
                    id: true,
                    tipo: true,
                    status: true,
                    permiteEmprestimo:
                      true,
                    baixadoEm: true,
                  },
                });

            /*
             * Se não há exemplar disponível,
             * confirma que o item possui pelo
             * menos um exemplar físico elegível.
             */
            if (!exemplarEscolhido) {
              const algumExemplar =
                await transacao
                  .bibliotecaExemplar
                  .findFirst({
                    where: {
                      instituicaoId:
                        contexto.instituicaoId,

                      itemId,

                      tipo:
                        TipoExemplarBiblioteca.FISICO,

                      permiteEmprestimo:
                        true,

                      baixadoEm: null,
                    },

                    select: {
                      id: true,
                      tipo: true,
                      status: true,
                      permiteEmprestimo:
                        true,
                      baixadoEm: true,
                    },
                  });

              if (!algumExemplar) {
                falhar(
                  409,
                  "Este item não possui exemplar físico disponível para circulação.",
                  "ITEM_SEM_EXEMPLAR_RESERVAVEL",
                );
              }
            }
          }

          let reservarAgora = false;

          if (
            exemplarEscolhido &&
            exemplarEscolhido.status ===
              StatusExemplarBiblioteca.DISPONIVEL
          ) {
            /*
             * Trava o exemplar antes de
             * transformá-lo em RESERVADO.
             */
            await transacao.$queryRaw`
              SELECT "id"
              FROM "BibliotecaExemplar"
              WHERE "id" = ${exemplarEscolhido.id}
                AND "instituicaoId" = ${contexto.instituicaoId}
              FOR UPDATE
            `;

            const exemplarAtual =
              await transacao
                .bibliotecaExemplar
                .findFirst({
                  where: {
                    id:
                      exemplarEscolhido.id,

                    instituicaoId:
                      contexto.instituicaoId,
                  },

                  select: {
                    status: true,
                    baixadoEm: true,
                    permiteEmprestimo:
                      true,
                  },
                });

            reservarAgora =
              exemplarAtual?.status ===
                StatusExemplarBiblioteca.DISPONIVEL &&
              exemplarAtual
                .baixadoEm === null &&
              exemplarAtual
                .permiteEmprestimo === true;
          }

          if (reservarAgora) {
            const expiraEm =
              calcularExpiracao(
                agora,
                diasReserva,
              );

            const reserva =
              await transacao
                .bibliotecaReserva
                .create({
                  data: {
                    instituicaoId:
                      contexto.instituicaoId,

                    itemId:
                      item.id,

                    exemplarId:
                      exemplarEscolhido!.id,

                    usuarioId:
                      tomador.id,

                    status:
                      StatusReservaBiblioteca.DISPONIVEL,

                    posicaoFila: null,

                    reservadaEm:
                      agora,

                    disponivelEm:
                      agora,

                    expiraEm,

                    origem:
                      OrigemReservaBiblioteca.OPERADOR,

                    observacao,

                    criadaPorId:
                      usuario.id,
                  },
                });

            await transacao
              .bibliotecaExemplar
              .update({
                where: {
                  id:
                    exemplarEscolhido!.id,
                },

                data: {
                  status:
                    StatusExemplarBiblioteca.RESERVADO,

                  atualizadoPorId:
                    usuario.id,
                },
              });

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
                      reserva.id,
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca.RESERVAR,

                  descricao:
                    "Reserva disponibilizada imediatamente na Biblioteca Virtual.",

                  dadosPosteriores: {
                    reservaId:
                      reserva.id,

                    itemId:
                      item.id,

                    exemplarId:
                      exemplarEscolhido!.id,

                    usuarioId:
                      tomador.id,

                    status:
                      reserva.status,

                    expiraEm,
                  },

                  metadados: {
                    origem:
                      "api_admin_biblioteca_reservas",

                    itemTitulo:
                      item.titulo,
                  },

                  ip,
                  userAgent,
                },
              });

            return {
              reserva,
              tomador,

              disponibilidade:
                "IMEDIATA" as const,
            };
          }

          /*
           * Nenhum exemplar pôde ser separado
           * agora. Entra no final da fila.
           */
          const fila =
            await transacao
              .bibliotecaReserva
              .aggregate({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId,

                  status:
                    StatusReservaBiblioteca.AGUARDANDO,
                },

                _max: {
                  posicaoFila: true,
                },
              });

          const posicaoFila =
            Number(
              fila._max
                .posicaoFila ?? 0,
            ) + 1;

          const reserva =
            await transacao
              .bibliotecaReserva
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId:
                    item.id,

                  exemplarId:
                    exemplarId,

                  usuarioId:
                    tomador.id,

                  status:
                    StatusReservaBiblioteca.AGUARDANDO,

                  posicaoFila,

                  reservadaEm:
                    agora,

                  origem:
                    OrigemReservaBiblioteca.OPERADOR,

                  observacao,

                  criadaPorId:
                    usuario.id,
                },
              });

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
                    reserva.id,
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.RESERVAR,

                descricao:
                  "Reserva adicionada à fila da Biblioteca Virtual.",

                dadosPosteriores: {
                  reservaId:
                    reserva.id,

                  itemId:
                    item.id,

                  exemplarId,

                  usuarioId:
                    tomador.id,

                  status:
                    reserva.status,

                  posicaoFila,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_reservas",

                  itemTitulo:
                    item.titulo,
                },

                ip,
                userAgent,
              },
            });

          return {
            reserva,
            tomador,

            disponibilidade:
              "FILA" as const,
          };
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        },
      );

    return responder(
      {
        ok: true,

        mensagem:
          resultado.disponibilidade ===
          "IMEDIATA"
            ? "Reserva criada. O exemplar já está separado para retirada."
            : `Reserva criada na posição ${resultado.reserva.posicaoFila} da fila.`,

        reserva:
          resultado.reserva,

        usuario:
          resultado.tomador,

        disponibilidade:
          resultado.disponibilidade,
      },
      201,
    );
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}