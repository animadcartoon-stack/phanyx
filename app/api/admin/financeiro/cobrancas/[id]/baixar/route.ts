import { NextRequest, NextResponse } from "next/server";
import { GatilhoComissaoRH, Prisma } from "@prisma/client";
import { analisarDivergencia, resolucaoAindaValida, objetoJson, centavos } from "@/lib/financeiro/divergencias";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { processarComissaoAutomatica } from "@/lib/comercial/processar-comissao";

export const dynamic = "force-dynamic";

function podeDarBaixa(
  usuario: Awaited<ReturnType<typeof getUserFromToken>>
) {
  if (!usuario) return false;
  if (usuario.isMasterAdmin) return true;

  if (
    [
      "ADMIN",
      "GERENCIA",
      "SUPER_ADMIN",
      "FINANCEIRO",
      "SECRETARIA",
    ].includes(usuario.role)
  ) {
    return true;
  }

  return temAlgumaPermissao(usuario, [
    "financeiro.recebimentos",
    "caixa.receber",
  ]);
}

export async function POST(
  _req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const usuario =
      await getUserFromToken();

    if (
      !usuario ||
      !usuario.instituicaoId ||
      !podeDarBaixa(usuario)
    ) {
      return NextResponse.json(
        { error: "NAO_AUTORIZADO" },
        { status: 401 }
      );
    }

    if (
      !planoTemRecurso(
        usuario.plano || "ESSENCIAL",
        "FINANCEIRO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seu plano não permite acessar o financeiro.",
        },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const cobrancaId =
      Number(id);

    const instituicaoId =
      Number(
        usuario.instituicaoId
      );

    if (
      !Number.isInteger(cobrancaId) ||
      cobrancaId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cobrança inválida.",
        },
        { status: 400 }
      );
    }

    const cobranca =
      await prisma.cobrancaFinanceira.findFirst({
        where: {
          id: cobrancaId,
          instituicaoId,
        },
      });

    if (!cobranca) {
      return NextResponse.json(
        {
          error:
            "Cobrança não encontrada.",
        },
        { status: 404 }
      );
    }

    if (
      cobranca.statusOperacional ===
      "BAIXADO"
    ) {
      return NextResponse.json({
        message:
          "Esta cobrança já recebeu baixa.",
        idempotente: true,
        cobranca,
      });
    }

    if (
      cobranca.statusOperacional ===
      "DIVERGENCIA"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta cobrança possui divergência e precisa ser resolvida antes da baixa.",
          codigo:
            "COBRANCA_COM_DIVERGENCIA",
        },
        { status: 409 }
      );
    }

    if (
      cobranca.statusBancario !==
        "COMPENSADO" ||
      cobranca.statusOperacional !==
        "AGUARDANDO_BAIXA"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente boletos compensados e aguardando baixa podem ser baixados.",
          codigo:
            "COBRANCA_NAO_AGUARDA_BAIXA",
        },
        { status: 409 }
      );
    }

    const caixaAberto =
      await prisma.caixa.findFirst({
        where: {
          instituicaoId,
          status: "ABERTO",
          abertoPorId:
            usuario.id,
          origem: "MANUAL",
        },
        select: {
          id: true,
        },
      });

    if (!caixaAberto) {
      return NextResponse.json(
        {
          error:
            "Abra seu caixa em Financeiro → Caixa antes de dar baixa no boleto compensado.",
          codigo:
            "CAIXA_MANUAL_NAO_ABERTO",
        },
        { status: 409 }
      );
    }

    const nomeOperador =
      usuario.nome ||
      usuario.email ||
      "Usuário";

    const resultado =
      await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const agora =
            new Date();

          /*
           * Reserva atômica:
           * somente uma requisição consegue
           * trocar AGUARDANDO_BAIXA por BAIXADO.
           */
          const reserva =
            await tx.cobrancaFinanceira.updateMany({
              where: {
                id: cobrancaId,
                instituicaoId,
                statusBancario:
                  "COMPENSADO",
                statusOperacional:
                  "AGUARDANDO_BAIXA",
                baixadoEm: null,
                movimentoCaixaId: null,
              },
              data: {
                statusOperacional:
                  "BAIXADO",
                baixadoEm:
                  agora,
                baixadoPorUsuarioId:
                  usuario.id,
                baixadoPorNomeSnapshot:
                  nomeOperador,
              },
            });

          if (
            reserva.count !== 1
          ) {
            const atual =
              await tx.cobrancaFinanceira.findFirst({
                where: {
                  id:
                    cobrancaId,
                  instituicaoId,
                },
              });

            if (
              atual?.statusOperacional ===
              "BAIXADO"
            ) {
              return {
                estado:
                  "JA_BAIXADO" as const,
                cobranca:
                  atual,
              };
            }

            if (
              atual?.statusOperacional ===
              "DIVERGENCIA"
            ) {
              return {
                estado:
                  "DIVERGENCIA" as const,
                cobranca:
                  atual,
                detalhes:
                  null,
              };
            }

            return {
              estado:
                "ESTADO_ALTERADO" as const,
              cobranca:
                atual,
            };
          }

          const atual =
            await tx.cobrancaFinanceira.findFirst({
              where: {
                id:
                  cobrancaId,
                instituicaoId,
              },
              include: {
                lancamentoFinanceiro: {
                  include: {
                    pagamentos:
                      true,
                    matricula: {
                      select: { realizadaPeloAluno: true, status: true },
                    },

                    aluno: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                  },
                },
              },
            });

          if (!atual) {
            throw new Error(
              "Cobrança não encontrada durante a baixa."
            );
          }

          const lancamento =
            atual.lancamentoFinanceiro;

          const configuracao = await tx.configuracaoFinanceiraInstituicao.findUnique({
            where: { instituicaoId }, select: { permitirPagamentoParcial: true },
          });
          // A cobrança já está reservada como BAIXADO nesta transação.
          // Para conferir os valores, usamos seu estado anterior à reserva.
          const paraConferencia = {
            ...atual, statusOperacional: "AGUARDANDO_BAIXA",
            baixadoEm: null, movimentoCaixaId: null,
          };
          const analise = analisarDivergencia(
            paraConferencia, lancamento, configuracao?.permitirPagamentoParcial ?? true
          );
          const { valorFinal, totalPagoAnterior, saldoAtual, valorCobrado } = analise;
          const valorCompensado = analise.valorCompensado ?? NaN;
          const resolucaoValida = resolucaoAindaValida(paraConferencia, lancamento);
          const motivos = [
            ...analise.bloqueios,
            ...(resolucaoValida ? [] : analise.divergenciasValores),
          ];
          if (objetoJson(atual.metadata).resolucaoDivergencia && !resolucaoValida) {
            motivos.push("RESOLUCAO_DESATUALIZADA");
          }

          if (
            motivos.length > 0
          ) {
            const detalhes = {
              motivos,

              valorCobrado,

              valorCompensado:
                Number.isFinite(
                  valorCompensado
                )
                  ? valorCompensado
                  : null,

              valorFinal,
              totalPagoAnterior,
              saldoAtual,

              detectadoEm:
                agora.toISOString(),
            };

            const divergente =
              await tx.cobrancaFinanceira.update({
                where: {
                  id:
                    cobrancaId,
                },

                data: {
                  statusOperacional:
                    "DIVERGENCIA",

                  baixadoEm:
                    null,

                  baixadoPorUsuarioId:
                    null,

                  baixadoPorNomeSnapshot:
                    null,

                  metadata: {
                    ...objetoJson(
                      atual.metadata
                    ),

                    divergencia:
                      detalhes,
                  },
                },
              });

            await tx.historicoCobranca.create({
              data: {
                instituicaoId,

                alunoId:
                  lancamento.alunoId,

                alunoNome:
                  lancamento.aluno
                    ?.nome ||
                  null,

                lancamentoFinanceiroId:
                  lancamento.id,

                responsavelId:
                  usuario.id,

                responsavelNome:
                  nomeOperador,

                canal:
                  "SISTEMA",

                acao:
                  "DIVERGENCIA_BOLETO_COMPENSADO",

                observacao:
                  "Baixa não realizada porque os valores do boleto compensado não coincidem com o lançamento.",

                metadata:
                  detalhes,
              },
            });

            return {
              estado:
                "DIVERGENCIA" as const,

              cobranca:
                divergente,

              detalhes,
            };
          }

          const dataPagamento =
            atual.pagoEm ||
            atual.compensadoEm ||
            agora;

          const pagamento =
            await tx.pagamento.create({
              data: {
                valorPago:
                  valorCompensado,

                pagoEm:
                  dataPagamento,

                formaPagamento:
                  "BOLETO",

                observacao:
                  `Baixa de boleto compensado. Provedor: ${atual.provedor}.`,

                instituicaoId,

                alunoId:
                  lancamento.alunoId,

                lancamentoId:
                  lancamento.id,
              },
            });

          const novoTotalPago =
            Number(
              (
                totalPagoAnterior +
                valorCompensado
              ).toFixed(2)
            );

          const quitado = centavos(novoTotalPago) >= centavos(valorFinal);

          const parcelaAtualizada = await tx.lancamentoFinanceiro.updateMany({
            where: {
              id: lancamento.id, instituicaoId, alunoId: atual.alunoId,
              updatedAt: lancamento.updatedAt,
            },

            data: {
              valorFinal,

              valorPago:
                novoTotalPago,

              pagoEm:
                dataPagamento,

              status:
                quitado ? "PAGO" : "PARCIAL",
            },
          });

          if (parcelaAtualizada.count !== 1) {
            throw new Error("COBRANCA_ESTADO_ALTERADO");
          }

          /*
           * Mantém os mesmos gatilhos
           * de comissão usados pelo
           * recebimento financeiro atual.
           */
          if (
            lancamento.matriculaId && quitado
          ) {
            const dadosComissao = {
              tx,
              instituicaoId,

              matriculaId:
                lancamento.matriculaId,

              pagamentoId:
                pagamento.id,

              valorRecebido:
                novoTotalPago,

              eventoEm:
                pagamento.pagoEm,

              criadoPorId:
                usuario.id,
            };

            await processarComissaoAutomatica({
              ...dadosComissao,

              gatilho:
                GatilhoComissaoRH
                  .PRIMEIRA_MENSALIDADE_PAGA,
            });

            await processarComissaoAutomatica({
              ...dadosComissao,

              gatilho:
                GatilhoComissaoRH
                  .MENSALIDADE_PAGA,
            });
          }

          const movimento =
            await tx.movimentoCaixa.create({
              data: {
                instituicaoId,

                caixaId:
                  caixaAberto.id,

                tipo:
                  "ENTRADA",

                descricao:
                  `Boleto compensado — ` +
                  `${lancamento.aluno?.nome || "Aluno"}`,

                valor:
                  valorCompensado,

                formaPagamento:
                  "BOLETO",

                /*
                 * Genérico de propósito:
                 * não depende de Asaas.
                 */
                origem:
                  "BOLETO_COMPENSADO",

                externalReference:
                  atual.referenciaInterna,

                alunoId:
                  lancamento.alunoId,

                lancamentoId:
                  lancamento.id,
              },
            });

          const caixaAtualizado = await tx.caixa.updateMany({
            where: {
              id: caixaAberto.id, instituicaoId, status: "ABERTO",
              origem: "MANUAL", abertoPorId: usuario.id,
            },

            data: {
              saldoSistema: {
                increment:
                  valorCompensado,
              },
            },
          });

          if (caixaAtualizado.count !== 1) {
            throw new Error("CAIXA_MANUAL_NAO_ABERTO");
          }

          await tx.historicoCobranca.create({
            data: {
              instituicaoId,

              alunoId:
                lancamento.alunoId,

              alunoNome:
                lancamento.aluno
                  ?.nome ||
                null,

              lancamentoFinanceiroId:
                lancamento.id,

              responsavelId:
                usuario.id,

              responsavelNome:
                nomeOperador,

              canal:
                "SISTEMA",

              acao:
                "BAIXA_BOLETO_COMPENSADO",

              observacao:
                `Boleto compensado baixado por ${nomeOperador}.`,

              metadata: {
                cobrancaFinanceiraId:
                  atual.id,

                pagamentoId:
                  pagamento.id,

                movimentoCaixaId:
                  movimento.id,

                provedor:
                  atual.provedor,

                cobrancaExternaId:
                  atual.cobrancaExternaId,

                valorCompensado,
                parcial: !quitado,
                saldoRestante: Number(Math.max(0, valorFinal - novoTotalPago).toFixed(2)),
                resolucaoDivergencia: objetoJson(objetoJson(atual.metadata).resolucaoDivergencia) as Prisma.InputJsonObject,
              },
            },
          });

          const final =
            await tx.cobrancaFinanceira.update({
              where: {
                id:
                  cobrancaId,
              },

              data: {
                movimentoCaixaId:
                  movimento.id,

                metadata: {
                  ...objetoJson(
                    atual.metadata
                  ),

                  baixa: {
                    pagamentoId:
                      pagamento.id,

                    movimentoCaixaId:
                      movimento.id,

                    baixadoPorUsuarioId:
                      usuario.id,

                    baixadoPorNome:
                      nomeOperador,

                    baixadoEm:
                      agora.toISOString(),
                  },
                },
              },
            });

          return {
            estado:
              "BAIXADO" as const,

            cobranca:
              final,
          };

        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        }
      );

    if (
      resultado.estado ===
      "DIVERGENCIA"
    ) {
      return NextResponse.json(
        {
          error:
            "Foi encontrada uma divergência. Nenhum pagamento ou movimento de caixa foi criado.",

          codigo:
            "DIVERGENCIA_BOLETO_COMPENSADO",

          detalhes:
            resultado.detalhes,

          cobranca:
            resultado.cobranca,
        },
        {
          status: 409,
        }
      );
    }

    if (
      resultado.estado ===
      "JA_BAIXADO"
    ) {
      return NextResponse.json({
        message:
          "Esta cobrança já havia recebido baixa.",

        idempotente: true,

        cobranca:
          resultado.cobranca,
      });
    }

    if (
      resultado.estado ===
      "ESTADO_ALTERADO"
    ) {
      return NextResponse.json(
        {
          error:
            "A cobrança mudou de estado durante a baixa. Atualize a tela e tente novamente.",

          codigo:
            "COBRANCA_ESTADO_ALTERADO",

          cobranca:
            resultado.cobranca,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      message:
        "Boleto compensado baixado com sucesso.",

      idempotente: false,

      cobranca:
        resultado.cobranca,
    });
  } catch (error) {
    if ((error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
      || (error instanceof Error && ["CAIXA_MANUAL_NAO_ABERTO", "COBRANCA_ESTADO_ALTERADO"].includes(error.message))) {
      return NextResponse.json({
        error: error instanceof Error && error.message === "CAIXA_MANUAL_NAO_ABERTO"
          ? "Seu caixa foi fechado. Abra seu caixa antes de dar baixa."
          : "Os dados mudaram durante a baixa. Atualize a tela e confira novamente.",
        codigo: error instanceof Error && error.message === "CAIXA_MANUAL_NAO_ABERTO"
          ? "CAIXA_MANUAL_NAO_ABERTO" : "COBRANCA_ESTADO_ALTERADO",
      }, { status: 409 });
    }
    console.error(
      "Erro ao dar baixa em boleto compensado:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao dar baixa no boleto.",
      },
      {
        status: 500,
      }
    );
  }
}
