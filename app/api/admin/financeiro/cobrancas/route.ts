import { NextRequest, NextResponse } from "next/server";
import {
  StatusBancarioCobranca,
  StatusOperacionalCobranca,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";

export const dynamic = "force-dynamic";

const STATUS_OPERACIONAIS =
  Object.values(StatusOperacionalCobranca);

const STATUS_BANCARIOS =
  Object.values(StatusBancarioCobranca);

function podeConsultar(
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

  return temAlgumaPermissao(usuario, [
    "financeiro.ver",
    "financeiro.recebimentos",
    "financeiro.inadimplentes",
    "caixa.ver",
  ]);
}

function inteiroPositivo(
  valor: string | null,
  fallback: number
) {
  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : fallback;
}

export async function GET(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    if (
      !usuario ||
      !usuario.instituicaoId ||
      !podeConsultar(usuario)
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

    const instituicaoId =
      Number(usuario.instituicaoId);

    const { searchParams } =
      new URL(req.url);

    const statusOperacionalTexto =
      String(
        searchParams.get(
          "statusOperacional"
        ) || ""
      )
        .trim()
        .toUpperCase();

    const statusBancarioTexto =
      String(
        searchParams.get(
          "statusBancario"
        ) || ""
      )
        .trim()
        .toUpperCase();

    const busca =
      String(
        searchParams.get("busca") ||
          ""
      ).trim();

    const contaFinanceiraIdTexto =
      String(
        searchParams.get(
          "contaFinanceiraId"
        ) || ""
      ).trim();

    const pagina =
      inteiroPositivo(
        searchParams.get("pagina"),
        1
      );

    const limite =
      Math.min(
        inteiroPositivo(
          searchParams.get("limite"),
          50
        ),
        100
      );

    if (
      statusOperacionalTexto &&
      !STATUS_OPERACIONAIS.includes(
        statusOperacionalTexto as
          StatusOperacionalCobranca
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Status operacional inválido.",
        },
        { status: 400 }
      );
    }

    if (
      statusBancarioTexto &&
      !STATUS_BANCARIOS.includes(
        statusBancarioTexto as
          StatusBancarioCobranca
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Status bancário inválido.",
        },
        { status: 400 }
      );
    }

    let contaFinanceiraId:
      number | null = null;

    if (contaFinanceiraIdTexto) {
      contaFinanceiraId =
        Number(
          contaFinanceiraIdTexto
        );

      if (
        !Number.isInteger(
          contaFinanceiraId
        ) ||
        contaFinanceiraId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Conta financeira inválida.",
          },
          { status: 400 }
        );
      }
    }

    const where = {
      instituicaoId,

      ...(statusOperacionalTexto
        ? {
            statusOperacional:
              statusOperacionalTexto as
                StatusOperacionalCobranca,
          }
        : {}),

      ...(statusBancarioTexto
        ? {
            statusBancario:
              statusBancarioTexto as
                StatusBancarioCobranca,
          }
        : {}),

      ...(contaFinanceiraId
        ? {
            contaFinanceiraId,
          }
        : {}),

      ...(busca
        ? {
            OR: [
              {
                aluno: {
                  nome: {
                    contains: busca,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                aluno: {
                  user: {
                    email: {
                      contains: busca,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
              {
                lancamentoFinanceiro: {
                  descricao: {
                    contains: busca,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                referenciaInterna: {
                  contains: busca,
                  mode: "insensitive" as const,
                },
              },
              {
                cobrancaExternaId: {
                  contains: busca,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [
      cobrancas,
      total,
      agrupadas,
    ] = await Promise.all([
      prisma.cobrancaFinanceira.findMany({
        where,

        select: {
          id: true,
          referenciaInterna: true,
          cobrancaExternaId: true,
          clienteExternoId: true,

          provedor: true,
          tipo: true,

          statusBancario: true,
          statusOperacional: true,

          valorCobrado: true,
          valorCompensado: true,

          vencimento: true,
          emitidoEm: true,
          pagoEm: true,
          compensadoEm: true,
          baixadoEm: true,

          ultimoEnvioEm: true,
          ultimoEnvioCanal: true,
          ultimoEnvioPorUsuarioId: true,
          ultimoEnvioPorNomeSnapshot: true,
          quantidadeEnvios: true,

          linhaDigitavel: true,
          codigoBarras: true,
          boletoUrl: true,
          invoiceUrl: true,

          erroIntegracao: true,

          baixadoPorUsuarioId: true,
          baixadoPorNomeSnapshot: true,

          createdAt: true,
          updatedAt: true,

          contaFinanceira: {
            select: {
              id: true,
              nome: true,
              provedor: true,
              bancoCodigo: true,
              moeda: true,
            },
          },

          aluno: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              telefone: true,

              user: {
                select: {
                  email: true,
                },
              },
            },
          },

          matricula: {
            select: {
              id: true,
              numeroMatricula: true,
              numeroMatriculaLegado: true,

              curso: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },

          lancamentoFinanceiro: {
            select: {
              id: true,
              tipo: true,
              descricao: true,
              status: true,

              valorOriginal: true,
              valorPago: true,
              valorFinal: true,

              vencimento: true,
              pagoEm: true,
            },
          },
        },

        orderBy: [
          {
            vencimento: "asc",
          },
          {
            createdAt: "desc",
          },
        ],

        skip:
          (pagina - 1) * limite,

        take: limite,
      }),

      prisma.cobrancaFinanceira.count({
        where,
      }),

      prisma.cobrancaFinanceira.groupBy({
        by: [
          "statusOperacional",
        ],

        where: {
          instituicaoId,
        },

        _count: {
          _all: true,
        },
      }),
    ]);

    const resumo = {
      AGUARDANDO_PAGAMENTO: 0,
      AGUARDANDO_BAIXA: 0,
      BAIXADO: 0,
      DIVERGENCIA: 0,
      CANCELADO: 0,
    };

    for (const grupo of agrupadas) {
      resumo[
        grupo.statusOperacional
      ] =
        grupo._count._all;
    }

    return NextResponse.json({
      cobrancas:
        cobrancas.map(
          (item) => ({
            ...item,

            valorCobrado:
              Number(
                item.valorCobrado
              ),

            valorCompensado:
              item.valorCompensado ===
              null
                ? null
                : Number(
                    item.valorCompensado
                  ),
          })
        ),

      resumo,

      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas:
          Math.max(
            1,
            Math.ceil(
              total / limite
            )
          ),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao consultar cobranças financeiras:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao consultar cobranças financeiras.",
      },
      { status: 500 }
    );
  }
}
