import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { obterProvedorFinanceiro } from "@/lib/financeiro/provedores";

export const dynamic = "force-dynamic";

const CLIENTE_PENDENTE_PREFIXO =
  "__PHANYX_PENDENTE__:";

const TEMPO_TRAVA_MS =
  2 * 60 * 1000;

function ehErroUnique(error: unknown) {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function podeGerarBoleto(
  usuario: Awaited<
    ReturnType<typeof getUserFromToken>
  >
) {
  if (!usuario) return false;

  if (usuario.isMasterAdmin) {
    return true;
  }

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

  return temAlgumaPermissao(
    usuario,
    [
      "financeiro.ver",
      "financeiro.recebimentos",
      "caixa.receber",
    ]
  );
}

function calcularValorFinal(
  lancamento: {
    valorOriginal: number;
    descontoValor: number | null;
    jurosValor: number | null;
    multaValor: number | null;
    valorFinal: number | null;
  }
) {
  const registrado =
    Number(
      lancamento.valorFinal || 0
    );

  if (registrado > 0) {
    return Number(
      registrado.toFixed(2)
    );
  }

  return Number(
    (
      Number(
        lancamento.valorOriginal || 0
      ) -
      Number(
        lancamento.descontoValor || 0
      ) +
      Number(
        lancamento.jurosValor || 0
      ) +
      Number(
        lancamento.multaValor || 0
      )
    ).toFixed(2)
  );
}

function formatarData(
  data: Date
) {
  const ano =
    data.getUTCFullYear();

  const mes = String(
    data.getUTCMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getUTCDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function serializarCobranca(
  cobranca: any
) {
  return {
    id: cobranca.id,

    lancamentoFinanceiroId:
      cobranca.lancamentoFinanceiroId,

    contaFinanceiraId:
      cobranca.contaFinanceiraId,

    provedor:
      cobranca.provedor,

    tipo:
      cobranca.tipo,

    referenciaInterna:
      cobranca.referenciaInterna,

    cobrancaExternaId:
      cobranca.cobrancaExternaId,

    clienteExternoId:
      cobranca.clienteExternoId,

    statusBancario:
      cobranca.statusBancario,

    statusOperacional:
      cobranca.statusOperacional,

    valorCobrado:
      Number(
        cobranca.valorCobrado
      ),

    valorCompensado:
      cobranca.valorCompensado ===
      null
        ? null
        : Number(
            cobranca.valorCompensado
          ),

    vencimento:
      cobranca.vencimento,

    linhaDigitavel:
      cobranca.linhaDigitavel,

    codigoBarras:
      cobranca.codigoBarras,

    boletoUrl:
      cobranca.boletoUrl,

    invoiceUrl:
      cobranca.invoiceUrl,

    erroIntegracao:
      cobranca.erroIntegracao,

    createdAt:
      cobranca.createdAt,

    updatedAt:
      cobranca.updatedAt,
  };
}

function normalizarStatusBancario(
  statusExterno: string
) {
  const status = String(
    statusExterno || ""
  )
    .trim()
    .toUpperCase();

  if (
    [
      "RECEIVED",
      "CONFIRMED",
      "RECEIVED_IN_CASH",
    ].includes(status)
  ) {
    return "COMPENSADO" as const;
  }

  if (
    [
      "OVERDUE",
      "EXPIRED",
    ].includes(status)
  ) {
    return "VENCIDO" as const;
  }

  if (
    [
      "REFUNDED",
      "REFUND_REQUESTED",
    ].includes(status)
  ) {
    return "ESTORNADO" as const;
  }

  if (
    [
      "DELETED",
      "CANCELLED",
      "CANCELED",
    ].includes(status)
  ) {
    return "CANCELADO" as const;
  }

  return "PENDENTE" as const;
}

async function obterContaFinanceira({
  instituicaoId,
  contaFinanceiraId,
}: {
  instituicaoId: number;
  contaFinanceiraId: number | null;
}) {
  if (contaFinanceiraId) {
    return prisma
      .contaFinanceiraInstituicao
      .findFirst({
        where: {
          id: contaFinanceiraId,
          instituicaoId,
          ativa: true,
          suportaBoleto: true,
        },
      });
  }

  const padrao =
    await prisma
      .contaFinanceiraInstituicao
      .findFirst({
        where: {
          instituicaoId,
          ativa: true,
          suportaBoleto: true,
          padraoRecebimentos: true,
        },
      });

  if (padrao) {
    return padrao;
  }

  const contas =
    await prisma
      .contaFinanceiraInstituicao
      .findMany({
        where: {
          instituicaoId,
          ativa: true,
          suportaBoleto: true,
        },

        take: 2,
      });

  if (contas.length === 1) {
    return contas[0];
  }

  return null;
}

export async function POST(
  req: NextRequest
) {
  let cobrancaReservaId:
    number | null = null;

  try {
    const usuario =
      await getUserFromToken();

    if (
      !usuario ||
      !usuario.instituicaoId ||
      !podeGerarBoleto(usuario)
    ) {
      return NextResponse.json(
        {
          error:
            "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !planoTemRecurso(
        usuario.plano ||
          "ESSENCIAL",
        "FINANCEIRO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seu plano não permite acessar o financeiro.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      Number(
        usuario.instituicaoId
      );

    const body =
      await req.json();

    const lancamentoId =
      Number(
        body?.lancamentoFinanceiroId
      );

    const contaIdInformada =
      body?.contaFinanceiraId ===
        undefined ||
      body?.contaFinanceiraId ===
        null ||
      body?.contaFinanceiraId ===
        ""
        ? null
        : Number(
            body.contaFinanceiraId
          );

    if (
      !Number.isInteger(
        lancamentoId
      ) ||
      lancamentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Lançamento financeiro inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      contaIdInformada !== null &&
      (
        !Number.isInteger(
          contaIdInformada
        ) ||
        contaIdInformada <= 0
      )
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

    const lancamento =
      await prisma
        .lancamentoFinanceiro
        .findFirst({
          where: {
            id: lancamentoId,
            instituicaoId,
          },

          include: {
            pagamentos: true,

            aluno: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        });

    if (!lancamento) {
      return NextResponse.json(
        {
          error:
            "Lançamento financeiro não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * O fluxo antigo de matrícula
     * online/IBE não passa por aqui.
     */
    if (
      lancamento.tipo !==
      "MENSALIDADE"
    ) {
      return NextResponse.json(
        {
          error:
            "Neste momento, a geração de boleto integrada está disponível somente para mensalidades.",
          codigo:
            "TIPO_LANCAMENTO_NAO_SUPORTADO",
        },
        {
          status: 409,
        }
      );
    }

    if (
      lancamento.status ===
      "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Lançamento cancelado não pode gerar boleto.",
        },
        {
          status: 409,
        }
      );
    }

    const valorFinal =
      calcularValorFinal(
        lancamento
      );

    const totalPagamentos =
      Number(
        lancamento.pagamentos
          .reduce(
            (
              total,
              pagamento
            ) =>
              total +
              Number(
                pagamento.valorPago ||
                  0
              ),
            0
          )
          .toFixed(2)
      );

    const valorPagoRegistrado =
      Number(
        lancamento.valorPago ||
          0
      );

    const totalPago =
      Math.max(
        totalPagamentos,
        valorPagoRegistrado
      );

    const saldo =
      Number(
        Math.max(
          0,
          valorFinal -
            totalPago
        ).toFixed(2)
      );

    if (
      lancamento.status ===
        "PAGO" ||
      saldo <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Este lançamento já está totalmente pago.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !lancamento.vencimento
    ) {
      return NextResponse.json(
        {
          error:
            "A mensalidade não possui vencimento definido.",
        },
        {
          status: 409,
        }
      );
    }

    const conta =
      await obterContaFinanceira({
        instituicaoId,

        contaFinanceiraId:
          contaIdInformada,
      });

    if (!conta) {
      return NextResponse.json(
        {
          error:
            contaIdInformada
              ? "Conta financeira não encontrada ou não habilitada para boletos."
              : "Defina uma conta financeira padrão habilitada para boletos.",
          codigo:
            "CONTA_FINANCEIRA_NAO_DISPONIVEL",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !conta.integracaoAtiva ||
      !conta
        .credenciaisCriptografadas
    ) {
      return NextResponse.json(
        {
          error:
            "A integração da conta financeira não está ativa ou não possui credenciais.",
          codigo:
            "INTEGRACAO_FINANCEIRA_NAO_CONFIGURADA",
        },
        {
          status: 409,
        }
      );
    }

    const provedor =
      obterProvedorFinanceiro({
        id: conta.id,

        instituicaoId:
          conta.instituicaoId,

        provedor:
          conta.provedor,

        ambienteIntegracao:
          conta.ambienteIntegracao,

        credenciaisCriptografadas:
          conta.credenciaisCriptografadas,
      });

    const referenciaCobranca =
      `PHANYX_COBRANCA:${instituicaoId}:${lancamento.id}`;

    const referenciaCliente =
      `PHANYX_CLIENTE:${instituicaoId}:${conta.id}:${lancamento.alunoId}`;

    /*
     * Reserva local antes de chamar
     * qualquer provedor externo.
     *
     * referenciaInterna é UNIQUE.
     * Dois cliques concorrentes não
     * conseguem criar duas reservas.
     */
    let reservaCriadaAgora =
      false;

    let cobranca =
      await prisma
        .cobrancaFinanceira
        .findUnique({
          where: {
            referenciaInterna:
              referenciaCobranca,
          },
        });

    if (!cobranca) {
      try {
        cobranca =
          await prisma
            .cobrancaFinanceira
            .create({
              data: {
                instituicaoId,

                contaFinanceiraId:
                  conta.id,

                lancamentoFinanceiroId:
                  lancamento.id,

                alunoId:
                  lancamento.alunoId,

                matriculaId:
                  lancamento.matriculaId,

                provedor:
                  String(
                    conta.provedor
                  )
                    .trim()
                    .toUpperCase(),

                tipo:
                  "BOLETO",

                referenciaInterna:
                  referenciaCobranca,

                statusBancario:
                  "EM_PROCESSAMENTO",

                statusOperacional:
                  "AGUARDANDO_PAGAMENTO",

                valorCobrado:
                  saldo,

                vencimento:
                  lancamento.vencimento,
              },
            });

        reservaCriadaAgora =
          true;
      } catch (error) {
        if (!ehErroUnique(error)) {
          throw error;
        }

        cobranca =
          await prisma
            .cobrancaFinanceira
            .findUnique({
              where: {
                referenciaInterna:
                  referenciaCobranca,
              },
            });
      }
    }

    if (!cobranca) {
      throw new Error(
        "Não foi possível reservar a cobrança."
      );
    }

    cobrancaReservaId =
      cobranca.id;

    if (
      cobranca.instituicaoId !==
      instituicaoId
    ) {
      return NextResponse.json(
        {
          error:
            "Cobrança inválida para esta instituição.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      cobranca.contaFinanceiraId !==
      conta.id
    ) {
      return NextResponse.json(
        {
          error:
            "Esta mensalidade já está vinculada a outra conta financeira.",
          codigo:
            "COBRANCA_VINCULADA_OUTRA_CONTA",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Se já existe boleto válido,
     * apenas devolve o registro.
     */
    if (
      cobranca.cobrancaExternaId &&
      [
        "PENDENTE",
        "VENCIDO",
        "COMPENSADO",
      ].includes(
        cobranca.statusBancario
      )
    ) {
      return NextResponse.json({
        reutilizada: true,
        cobranca:
          serializarCobranca(
            cobranca
          ),
      });
    }

    if (
      cobranca.statusOperacional ===
      "BAIXADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta cobrança já recebeu baixa no PHANYX.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      cobranca.statusOperacional ===
        "CANCELADO" ||
      cobranca.statusBancario ===
        "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta cobrança está cancelada. A reemissão será tratada pelo fluxo próprio de reemissão.",
          codigo:
            "COBRANCA_CANCELADA",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Se outra requisição acabou de
     * criar a reserva, não disputamos
     * a chamada externa.
     */
    if (
      !reservaCriadaAgora &&
      cobranca.statusBancario ===
        "EM_PROCESSAMENTO" &&
      Date.now() -
        cobranca.updatedAt.getTime() <
        TEMPO_TRAVA_MS
    ) {
      return NextResponse.json(
        {
          error:
            "Este boleto já está sendo processado.",
          codigo:
            "BOLETO_EM_PROCESSAMENTO",
          cobranca:
            serializarCobranca(
              cobranca
            ),
        },
        {
          status: 409,
        }
      );
    }

    cobranca =
      await prisma
        .cobrancaFinanceira
        .update({
          where: {
            id: cobranca.id,
          },

          data: {
            statusBancario:
              "EM_PROCESSAMENTO",

            erroIntegracao:
              null,

            valorCobrado:
              saldo,

            vencimento:
              lancamento.vencimento,
          },
        });

    /*
     * Cliente externo.
     *
     * A tabela possui UNIQUE
     * (contaFinanceiraId, alunoId),
     * então somente uma requisição
     * consegue criar a reserva local.
     */
    let vinculoCliente =
      await prisma
        .clienteFinanceiroExterno
        .findUnique({
          where: {
            contaFinanceiraId_alunoId:
              {
                contaFinanceiraId:
                  conta.id,

                alunoId:
                  lancamento.alunoId,
              },
          },
        });

    let reservaClienteCriada =
      false;

    if (!vinculoCliente) {
      try {
        vinculoCliente =
          await prisma
            .clienteFinanceiroExterno
            .create({
              data: {
                instituicaoId,

                contaFinanceiraId:
                  conta.id,

                alunoId:
                  lancamento.alunoId,

                provedor:
                  String(
                    conta.provedor
                  )
                    .trim()
                    .toUpperCase(),

                clienteExternoId:
                  CLIENTE_PENDENTE_PREFIXO +
                  randomUUID(),

                metadata: {
                  status:
                    "EM_PROCESSAMENTO",

                  referenciaExterna:
                    referenciaCliente,
                },
              },
            });

        reservaClienteCriada =
          true;
      } catch (error) {
        if (!ehErroUnique(error)) {
          throw error;
        }

        vinculoCliente =
          await prisma
            .clienteFinanceiroExterno
            .findUnique({
              where: {
                contaFinanceiraId_alunoId:
                  {
                    contaFinanceiraId:
                      conta.id,

                    alunoId:
                      lancamento.alunoId,
                  },
              },
            });
      }
    }

    if (!vinculoCliente) {
      throw new Error(
        "Não foi possível reservar o cliente financeiro."
      );
    }

    let clienteExternoId =
      vinculoCliente
        .clienteExternoId;

    const clientePendente =
      clienteExternoId.startsWith(
        CLIENTE_PENDENTE_PREFIXO
      );

    const metadataCliente =
      (
        vinculoCliente.metadata ||
        {}
      ) as Record<
        string,
        unknown
      >;

    const clienteFalhou =
      metadataCliente.status ===
      "FALHA";

    if (clientePendente) {
      /*
       * Primeiro procura no provedor.
       * Isso recupera uma criação que
       * tenha sido concluída externamente
       * antes de um timeout local.
       */
      const encontrado =
        await provedor
          .buscarClientePorReferencia(
            referenciaCliente
          );

      if (encontrado) {
        clienteExternoId =
          encontrado
            .clienteExternoId;

        vinculoCliente =
          await prisma
            .clienteFinanceiroExterno
            .update({
              where: {
                id:
                  vinculoCliente.id,
              },

              data: {
                clienteExternoId,

                metadata: {
                  status:
                    "ATIVO",

                  referenciaExterna:
                    referenciaCliente,

                  recuperado:
                    true,

                  provedor:
                    encontrado.metadata ||
                    {},
                },
              },
            });
      } else {
        const reservaRecente =
          Date.now() -
            vinculoCliente
              .updatedAt
              .getTime() <
          TEMPO_TRAVA_MS;

        if (
          !reservaClienteCriada &&
          reservaRecente &&
          !clienteFalhou
        ) {
          return NextResponse.json(
            {
              error:
                "O cadastro financeiro deste aluno já está sendo processado.",
              codigo:
                "CLIENTE_FINANCEIRO_EM_PROCESSAMENTO",
            },
            {
              status: 409,
            }
          );
        }

        try {
          const criado =
            await provedor
              .criarCliente({
                nome:
                  lancamento
                    .aluno
                    .nome,

                email:
                  lancamento
                    .aluno
                    .user
                    .email,

                cpfCnpj:
                  lancamento
                    .aluno
                    .cpf,

                telefone:
                  lancamento
                    .aluno
                    .telefone,

                referenciaExterna:
                  referenciaCliente,
              });

          clienteExternoId =
            criado
              .clienteExternoId;

          vinculoCliente =
            await prisma
              .clienteFinanceiroExterno
              .update({
                where: {
                  id:
                    vinculoCliente.id,
                },

                data: {
                  clienteExternoId,

                  metadata: {
                    status:
                      "ATIVO",

                    referenciaExterna:
                      referenciaCliente,

                    provedor:
                      criado.metadata ||
                      {},
                  },
                },
              });
        } catch (error) {
          await prisma
            .clienteFinanceiroExterno
            .update({
              where: {
                id:
                  vinculoCliente.id,
              },

              data: {
                metadata: {
                  status:
                    "FALHA",

                  referenciaExterna:
                    referenciaCliente,

                  erro:
                    error instanceof
                    Error
                      ? error.message
                      : String(
                          error
                        ),
                },
              },
            });

          throw error;
        }
      }
    }

    /*
     * Antes de criar o boleto,
     * busca pela referência estável.
     */
    let boleto =
      await provedor
        .buscarBoletoPorReferencia(
          referenciaCobranca
        );

    let recuperada =
      Boolean(boleto);

    if (!boleto) {
      boleto =
        await provedor
          .criarBoleto({
            clienteExternoId,

            valor:
              saldo,

            vencimento:
              formatarData(
                lancamento.vencimento
              ),

            descricao:
              lancamento.descricao ||
              `Mensalidade ${lancamento.id}`,

            referenciaExterna:
              referenciaCobranca,
          });

      recuperada =
        false;
    }

    const statusBancario =
      normalizarStatusBancario(
        boleto.statusExterno
      );

    const statusOperacional =
      statusBancario ===
      "COMPENSADO"
        ? "AGUARDANDO_BAIXA"
        : statusBancario ===
          "CANCELADO"
        ? "CANCELADO"
        : "AGUARDANDO_PAGAMENTO";

    const agora =
      new Date();

    const atualizada =
      await prisma
        .cobrancaFinanceira
        .update({
          where: {
            id:
              cobranca.id,
          },

          data: {
            clienteExternoId,

            cobrancaExternaId:
              boleto
                .cobrancaExternaId,

            referenciaExterna:
              referenciaCobranca,

            statusBancario,

            statusOperacional,

            valorCobrado:
              saldo,

            valorCompensado:
              statusBancario ===
              "COMPENSADO"
                ? saldo
                : null,

            pagoEm:
              statusBancario ===
              "COMPENSADO"
                ? agora
                : null,

            compensadoEm:
              statusBancario ===
              "COMPENSADO"
                ? agora
                : null,

            linhaDigitavel:
              boleto
                .linhaDigitavel ||
              null,

            codigoBarras:
              boleto
                .codigoBarras ||
              null,

            boletoUrl:
              boleto
                .boletoUrl ||
              null,

            invoiceUrl:
              boleto
                .invoiceUrl ||
              null,

            erroIntegracao:
              null,

            metadata: {
              statusExterno:
                boleto
                  .statusExterno,

              recuperadaPorReferencia:
                recuperada,

              provedor:
                boleto.metadata ||
                {},
            },
          },
        });

    return NextResponse.json(
      {
        message:
          recuperada
            ? "Boleto recuperado com sucesso."
            : "Boleto gerado com sucesso.",

        reutilizada:
          recuperada,

        cobranca:
          serializarCobranca(
            atualizada
          ),
      },
      {
        status:
          recuperada
            ? 200
            : 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao gerar boleto financeiro:",
      error
    );

    if (cobrancaReservaId) {
      try {
        await prisma
          .cobrancaFinanceira
          .updateMany({
            where: {
              id:
                cobrancaReservaId,

              statusBancario:
                "EM_PROCESSAMENTO",
            },

            data: {
              statusBancario:
                "FALHA",

              erroIntegracao:
                (
                  error instanceof
                  Error
                    ? error.message
                    : String(error)
                ).slice(
                  0,
                  4000
                ),
            },
          });
      } catch (
        erroAtualizacao
      ) {
        console.error(
          "Falha ao registrar erro da cobrança:",
          erroAtualizacao
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Erro ao gerar boleto.",
      },
      {
        status: 502,
      }
    );
  }
}
