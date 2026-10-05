import "server-only";

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { descriptografarCredencial } from "@/lib/crypto-credenciais";

export const dynamic = "force-dynamic";

const LIMITE_PROCESSAMENTO_MS =
  5 * 60 * 1000;

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function numero(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const convertido =
    Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : null;
}

function dataValida(
  valor: unknown
) {
  const valorTexto =
    texto(valor);

  if (!valorTexto) {
    return null;
  }

  const data =
    new Date(valorTexto);

  return Number.isNaN(
    data.getTime()
  )
    ? null
    : data;
}

function tokensIguais(
  recebido: string,
  esperado: string
) {
  const a =
    Buffer.from(recebido);

  const b =
    Buffer.from(esperado);

  if (
    a.length !== b.length
  ) {
    return false;
  }

  return timingSafeEqual(
    a,
    b
  );
}

function ehErroUnique(
  erro: unknown
) {
  return (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  );
}

function extrairReferencias(
  body: any
) {
  const payment =
    body?.payment || {};

  const evento =
    texto(body?.event)
      .toUpperCase();

  const eventoId =
    texto(body?.id);

  const paymentId =
    texto(payment?.id);

  const externalReference =
    texto(
      payment?.externalReference
    );

  const valor =
    numero(payment?.value);

  const pagoEm =
    dataValida(
      payment?.paymentDate ||
        payment?.clientPaymentDate ||
        payment?.confirmedDate
    );

  const compensadoEm =
    dataValida(
      payment?.creditDate
    );

  return {
    evento,
    eventoId,
    paymentId,
    externalReference,
    valor,
    pagoEm,
    compensadoEm,
  };
}

async function assumirEvento(params: {
  instituicaoId: number;
  contaFinanceiraId: number;
  eventoId: string;
  evento: string;
  payload: Prisma.InputJsonValue;
}) {
  try {
    const criado =
      await prisma.eventoWebhookFinanceiro.create({
        data: {
          instituicaoId:
            params.instituicaoId,

          contaFinanceiraId:
            params.contaFinanceiraId,

          provedor:
            "ASAAS",

          eventoExternoId:
            params.eventoId,

          tipoEvento:
            params.evento,

          resultado:
            "PROCESSANDO",

          payload:
            params.payload,
        },

        select: {
          id: true,
        },
      });

    return {
      processar:
        true as const,

      eventoBancoId:
        criado.id,
    };
  } catch (erro) {
    if (
      !ehErroUnique(erro)
    ) {
      throw erro;
    }

    const existente =
      await prisma.eventoWebhookFinanceiro.findUnique({
        where: {
          contaFinanceiraId_eventoExternoId: {
            contaFinanceiraId:
              params.contaFinanceiraId,

            eventoExternoId:
              params.eventoId,
          },
        },

        select: {
          id: true,
          resultado: true,
          updatedAt: true,
        },
      });

    if (!existente) {
      throw erro;
    }

    if (
      existente.resultado ===
      "PROCESSADO"
    ) {
      return {
        processar:
          false as const,

        eventoBancoId:
          existente.id,

        duplicado:
          true,
      };
    }

    const limite =
      new Date(
        Date.now() -
          LIMITE_PROCESSAMENTO_MS
      );

    if (
      existente.resultado ===
        "PROCESSANDO" &&
      existente.updatedAt > limite
    ) {
      return {
        processar:
          false as const,

        eventoBancoId:
          existente.id,

        duplicado:
          true,
      };
    }

    const assumido =
      await prisma.eventoWebhookFinanceiro.updateMany({
        where: {
          id:
            existente.id,

          OR: [
            {
              resultado:
                "ERRO",
            },
            {
              resultado:
                "RECEBIDO",
            },
            {
              resultado:
                "PROCESSANDO",

              updatedAt: {
                lte:
                  limite,
              },
            },
          ],
        },

        data: {
          resultado:
            "PROCESSANDO",

          tentativas: {
            increment: 1,
          },

          erro:
            null,

          processadoEm:
            null,
        },
      });

    return {
      processar:
        assumido.count === 1,

      eventoBancoId:
        existente.id,

      duplicado:
        assumido.count !== 1,
    };
  }
}

export async function POST(
  req: Request,
  context: {
    params: Promise<{
      contaId: string;
    }>;
  }
) {
  let eventoBancoId:
    number | null = null;

  try {
    const { contaId: contaIdTexto } =
      await context.params;

    const contaId =
      Number(contaIdTexto);

    if (
      !Number.isInteger(contaId) ||
      contaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Conta financeira inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const conta =
      await prisma.contaFinanceiraInstituicao.findUnique({
        where: {
          id:
            contaId,
        },

        select: {
          id: true,
          instituicaoId: true,
          provedor: true,
          webhookAtivo: true,
          webhookSecretCriptografado:
            true,
        },
      });

    if (
      !conta ||
      texto(conta.provedor)
        .toUpperCase() !==
        "ASAAS"
    ) {
      return NextResponse.json(
        {
          error:
            "Webhook não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !conta.webhookAtivo ||
      !conta.webhookSecretCriptografado
    ) {
      return NextResponse.json(
        {
          error:
            "Webhook não está configurado para esta conta.",
        },
        {
          status: 404,
        }
      );
    }

    let tokenEsperado =
      "";

    try {
      tokenEsperado =
        texto(
          descriptografarCredencial(
            conta.webhookSecretCriptografado
          )
        );
    } catch (erro) {
      console.error(
        "[FINANCEIRO][ASAAS] Falha ao descriptografar token do webhook:",
        {
          contaFinanceiraId:
            conta.id,
          instituicaoId:
            conta.instituicaoId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Webhook indisponível.",
        },
        {
          status: 500,
        }
      );
    }

    const tokenRecebido =
      texto(
        req.headers.get(
          "asaas-access-token"
        )
      );

    if (
      !tokenRecebido ||
      !tokenEsperado ||
      !tokensIguais(
        tokenRecebido,
        tokenEsperado
      )
    ) {
      console.warn(
        "[FINANCEIRO][ASAAS] Token de webhook inválido:",
        {
          contaFinanceiraId:
            conta.id,
          instituicaoId:
            conta.instituicaoId,
        }
      );

      return NextResponse.json(
        {
          error:
            "Webhook não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const referencias =
      extrairReferencias(body);

    if (
      !referencias.eventoId ||
      !referencias.evento
    ) {
      return NextResponse.json(
        {
          error:
            "Evento Asaas inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const assumido =
      await assumirEvento({
        instituicaoId:
          conta.instituicaoId,

        contaFinanceiraId:
          conta.id,

        eventoId:
          referencias.eventoId,

        evento:
          referencias.evento,

        payload:
          body as Prisma.InputJsonValue,
      });

    eventoBancoId =
      assumido.eventoBancoId;

    if (!assumido.processar) {
      return NextResponse.json({
        received: true,
        duplicado: true,
        evento:
          referencias.evento,
      });
    }

    /*
     * Nunca procuramos apenas pelo ID
     * externo: conta e instituição fazem
     * parte obrigatória do filtro.
     */
    const filtros:
      Prisma.CobrancaFinanceiraWhereInput[] =
      [];

    if (
      referencias.paymentId
    ) {
      filtros.push({
        cobrancaExternaId:
          referencias.paymentId,
      });
    }

    if (
      referencias.externalReference
    ) {
      filtros.push(
        {
          referenciaInterna:
            referencias.externalReference,
        },
        {
          referenciaExterna:
            referencias.externalReference,
        }
      );
    }

    const cobranca =
      filtros.length > 0
        ? await prisma.cobrancaFinanceira.findFirst({
            where: {
              instituicaoId:
                conta.instituicaoId,

              contaFinanceiraId:
                conta.id,

              OR:
                filtros,
            },
          })
        : null;

    if (!cobranca) {
      const referenciaPhanyx =
        referencias.externalReference.startsWith(
          "PHANYX_COBRANCA:"
        );

      if (
        referenciaPhanyx
      ) {
        throw new Error(
          "Cobrança PHANYX não encontrada para o webhook recebido."
        );
      }

      await prisma.eventoWebhookFinanceiro.update({
        where: {
          id:
            eventoBancoId,
        },

        data: {
          resultado:
            "IGNORADO",

          processadoEm:
            new Date(),

          erro:
            null,
        },
      });

      return NextResponse.json({
        received: true,
        ignorado: true,
        motivo:
          "COBRANCA_NAO_PERTENCE_AO_FLUXO_PHANYX",
      });
    }

    await prisma.eventoWebhookFinanceiro.update({
      where: {
        id:
          eventoBancoId,
      },

      data: {
        cobrancaFinanceiraId:
          cobranca.id,
      },
    });

    const agora =
      new Date();

    const acao =
      await prisma.$transaction(
        async (tx) => {
          const evento =
            referencias.evento;

          /*
           * Relê a cobrança dentro da
           * transação para não tomar
           * decisões com um estado
           * carregado antes dela.
           */
          const cobrancaAtual =
            await tx.cobrancaFinanceira.findFirst({
              where: {
                id:
                  cobranca.id,

                instituicaoId:
                  conta.instituicaoId,

                contaFinanceiraId:
                  conta.id,
              },
            });

          if (!cobrancaAtual) {
            throw new Error(
              "Cobrança não encontrada durante o processamento do webhook."
            );
          }

          let resultado =
            "EVENTO_SEM_ALTERACAO";

          if (
            evento ===
            "PAYMENT_CONFIRMED"
          ) {
            /*
             * CONFIRMED ainda não é
             * compensação final.
             *
             * Também não deixamos um
             * evento atrasado regredir
             * COMPENSADO ou ESTORNADO.
             */
            if (
              cobrancaAtual.statusBancario !==
                "COMPENSADO" &&
              cobrancaAtual.statusBancario !==
                "ESTORNADO" &&
              cobrancaAtual.statusBancario !==
                "CANCELADO"
            ) {
              await tx.cobrancaFinanceira.update({
                where: {
                  id:
                    cobranca.id,
                },

                data: {
                  statusBancario:
                    "EM_PROCESSAMENTO",
                },
              });
            }

            resultado =
              "PAGAMENTO_CONFIRMADO";
          }

          if (
            evento ===
            "PAYMENT_RECEIVED"
          ) {
            /*
             * RECEIVED representa o
             * dinheiro efetivamente
             * recebido pelo provedor.
             *
             * O webhook apenas libera
             * a cobrança para baixa.
             */
            const estadoBancarioBloqueado =
              cobrancaAtual.statusBancario ===
                "ESTORNADO" ||
              cobrancaAtual.statusBancario ===
                "CANCELADO";

            /*
             * Um RECEIVED atrasado não pode
             * reabrir automaticamente uma
             * cobrança cancelada/estornada.
             * Ela vai para análise humana.
             */
            const operacional =
              cobrancaAtual.statusOperacional ===
                  "DIVERGENCIA" ||
                cobrancaAtual.statusOperacional ===
                  "CANCELADO" ||
                estadoBancarioBloqueado
                ? "DIVERGENCIA"
                : cobrancaAtual.statusOperacional ===
                    "BAIXADO"
                  ? "BAIXADO"
                  : "AGUARDANDO_BAIXA";

            const bancario =
              estadoBancarioBloqueado
                ? cobrancaAtual.statusBancario
                : "COMPENSADO";

            await tx.cobrancaFinanceira.update({
              where: {
                id:
                  cobranca.id,
              },

              data: {
                statusBancario:
                  bancario,

                statusOperacional:
                  operacional,

                valorCompensado:
                  referencias.valor ===
                  null
                    ? undefined
                    : referencias.valor,

                pagoEm:
                  referencias.pagoEm ||
                  cobrancaAtual.pagoEm ||
                  agora,

                compensadoEm:
                  referencias.compensadoEm ||
                  cobrancaAtual.compensadoEm ||
                  referencias.pagoEm ||
                  agora,

                erroIntegracao:
                  null,
              },
            });

            resultado =
              operacional ===
              "DIVERGENCIA"
                ? "PAGAMENTO_RECEBIDO_COM_DIVERGENCIA"
                : operacional ===
                    "BAIXADO"
                  ? "PAGAMENTO_RECEBIDO_JA_BAIXADO"
                  : "PAGAMENTO_COMPENSADO_AGUARDANDO_BAIXA";
          }

          if (
            evento ===
            "PAYMENT_OVERDUE"
          ) {
            const estadoFinal =
              cobrancaAtual.statusBancario ===
                "COMPENSADO" ||
              cobrancaAtual.statusBancario ===
                "ESTORNADO" ||
              cobrancaAtual.statusBancario ===
                "CANCELADO";

            if (!estadoFinal) {
              await tx.cobrancaFinanceira.update({
                where: {
                  id:
                    cobranca.id,
                },

                data: {
                  statusBancario:
                    "VENCIDO",

                  statusOperacional:
                    cobrancaAtual.statusOperacional ===
                        "BAIXADO" ||
                      cobrancaAtual.statusOperacional ===
                        "DIVERGENCIA"
                      ? cobrancaAtual.statusOperacional
                      : "AGUARDANDO_PAGAMENTO",
                },
              });
            }

            resultado =
              estadoFinal
                ? "VENCIMENTO_IGNORADO_ESTADO_FINAL"
                : "PAGAMENTO_VENCIDO";
          }

          if (
            evento ===
            "PAYMENT_DELETED"
          ) {
            const precisaDivergencia =
              cobrancaAtual.statusOperacional ===
                "BAIXADO" ||
              cobrancaAtual.statusOperacional ===
                "DIVERGENCIA";

            await tx.cobrancaFinanceira.update({
              where: {
                id:
                  cobranca.id,
              },

              data: {
                statusBancario:
                  "CANCELADO",

                statusOperacional:
                  precisaDivergencia
                    ? "DIVERGENCIA"
                    : "CANCELADO",
              },
            });

            resultado =
              precisaDivergencia
                ? "COBRANCA_CANCELADA_APOS_BAIXA"
                : "COBRANCA_CANCELADA";
          }

          /*
           * Estorno efetivamente ocorrido.
           */
          const eventoEstornoEfetivo =
            [
              "PAYMENT_REFUNDED",
              "PAYMENT_PARTIALLY_REFUNDED",
              "PAYMENT_RECEIVED_IN_CASH_UNDONE",
            ].includes(
              evento
            );

          if (eventoEstornoEfetivo) {
            const precisaDivergencia =
              cobrancaAtual.statusOperacional ===
                "BAIXADO" ||
              cobrancaAtual.statusOperacional ===
                "DIVERGENCIA";

            await tx.cobrancaFinanceira.update({
              where: {
                id:
                  cobranca.id,
              },

              data: {
                statusBancario:
                  "ESTORNADO",

                statusOperacional:
                  precisaDivergencia
                    ? "DIVERGENCIA"
                    : "CANCELADO",
              },
            });

            resultado =
              precisaDivergencia
                ? "ESTORNO_COM_DIVERGENCIA"
                : "COBRANCA_ESTORNADA";
          }

          /*
           * Solicitação/disputa de estorno
           * ainda não é estorno definitivo.
           * Bloqueamos a baixa automática
           * e encaminhamos para análise.
           */
          const eventoReversaoEmProcessamento =
            [
              "PAYMENT_REFUND_IN_PROGRESS",
              "PAYMENT_CHARGEBACK_REQUESTED",
              "PAYMENT_CHARGEBACK_DISPUTE",
              "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
            ].includes(
              evento
            );

          if (
            eventoReversaoEmProcessamento
          ) {
            await tx.cobrancaFinanceira.update({
              where: {
                id:
                  cobranca.id,
              },

              data: {
                statusBancario:
                  cobrancaAtual.statusBancario ===
                  "ESTORNADO"
                    ? "ESTORNADO"
                    : "EM_PROCESSAMENTO",

                statusOperacional:
                  "DIVERGENCIA",
              },
            });

            resultado =
              "REVERSAO_EM_PROCESSAMENTO";
          }

          /*
           * PAYMENT_CREATED e demais
           * eventos informativos são
           * registrados no histórico
           * de webhook, mas não mudam
           * o financeiro automaticamente.
           */

          await tx.contaFinanceiraInstituicao.update({
            where: {
              id:
                conta.id,
            },

            data: {
              ultimaSincronizacaoEm:
                agora,
            },
          });

          await tx.eventoWebhookFinanceiro.update({
            where: {
              id:
                eventoBancoId!,
            },

            data: {
              resultado:
                "PROCESSADO",

              processadoEm:
                agora,

              erro:
                null,
            },
          });

          return resultado;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,

          maxWait:
            10_000,

          timeout:
            30_000,
        }
      );

    console.info(
      "[FINANCEIRO][ASAAS] Webhook processado:",
      {
        instituicaoId:
          conta.instituicaoId,

        contaFinanceiraId:
          conta.id,

        cobrancaFinanceiraId:
          cobranca.id,

        eventoId:
          referencias.eventoId,

        evento:
          referencias.evento,

        acao,
      }
    );

    return NextResponse.json({
      received: true,
      processado: true,
      duplicado: false,
      evento:
        referencias.evento,
      acao,
    });

  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido no webhook financeiro.";

    if (eventoBancoId) {
      try {
        await prisma.eventoWebhookFinanceiro.updateMany({
          where: {
            id:
              eventoBancoId,

            resultado: {
              not:
                "PROCESSADO",
            },
          },

          data: {
            resultado:
              "ERRO",

            erro:
              mensagem.slice(
                0,
                2000
              ),

            processadoEm:
              null,
          },
        });
      } catch (erroRegistro) {
        console.error(
          "[FINANCEIRO][ASAAS] Falha ao registrar erro do webhook:",
          erroRegistro
        );
      }
    }

    console.error(
      "[FINANCEIRO][ASAAS] Erro ao processar webhook:",
      {
        eventoBancoId,
        mensagem,
      }
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível processar o webhook.",
      },
      {
        status: 500,
      }
    );
  }
}
