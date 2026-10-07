import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";

export const dynamic = "force-dynamic";

function podeGerarBoleto(
  usuario: Awaited<ReturnType<typeof getUserFromToken>>
) {
  if (!usuario) return false;
  if (usuario.isMasterAdmin) return true;

  if (
    ["ADMIN", "GERENCIA", "SUPER_ADMIN", "FINANCEIRO", "SECRETARIA"].includes(
      usuario.role
    )
  ) {
    return true;
  }

  return temAlgumaPermissao(usuario, [
    "financeiro.ver",
    "financeiro.recebimentos",
    "caixa.receber",
  ]);
}

function calcularValorFinal(item: {
  valorOriginal: number;
  valorFinal: number | null;
  descontoValor: number | null;
  jurosValor: number | null;
  multaValor: number | null;
}) {
  const registrado = Number(item.valorFinal || 0);

  if (registrado > 0) {
    return Number(registrado.toFixed(2));
  }

  return Number(
    (
      Number(item.valorOriginal || 0) -
      Number(item.descontoValor || 0) +
      Number(item.jurosValor || 0) +
      Number(item.multaValor || 0)
    ).toFixed(2)
  );
}

export async function GET(req: NextRequest) {
  try {
    const usuario = await getUserFromToken();

    if (
      !usuario ||
      !usuario.instituicaoId ||
      !podeGerarBoleto(usuario)
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
        { error: "Seu plano não permite acessar o financeiro." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const busca = String(searchParams.get("busca") || "").trim();
    const limiteInformado = Number(searchParams.get("limite") || 50);
    const limite =
      Number.isInteger(limiteInformado) && limiteInformado > 0
        ? Math.min(limiteInformado, 100)
        : 50;

    const itens = await prisma.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId: Number(usuario.instituicaoId),
        tipo: "MENSALIDADE",
        status: {
          in: ["PENDENTE", "PARCIAL", "ATRASADO"],
        },

        AND: [
          {
            OR: [
              {
                matriculaId: null,
              },
              {
                matricula: {
                  is: {
                    realizadaPeloAluno: false,
                    status: {
                      not: "CANCELADA",
                    },
                  },
                },
              },
            ],
          },
        ],

        ...(busca
          ? {
              OR: [
                {
                  aluno: {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  aluno: {
                    user: {
                      email: {
                        contains: busca,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  descricao: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  matricula: {
                    numeroMatricula: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  matricula: {
                    numeroMatriculaLegado: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  matricula: {
                    curso: {
                      nome: {
                        contains: busca,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
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
        pagamentos: {
          select: {
            valorPago: true,
          },
        },
        cobrancasFinanceiras: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            statusBancario: true,
            statusOperacional: true,
            boletoUrl: true,
            invoiceUrl: true,
          },
        },
      },
      orderBy: [
        { vencimento: "asc" },
        { createdAt: "desc" },
      ],
      take: limite,
    });

    const lancamentos = itens
      .map((item) => {
        const valorFinal = calcularValorFinal(item);

        const totalPorPagamentos = Number(
          item.pagamentos
            .reduce(
              (total, pagamento) =>
                total + Number(pagamento.valorPago || 0),
              0
            )
            .toFixed(2)
        );

        const totalPago = Math.max(
          totalPorPagamentos,
          Number(item.valorPago || 0)
        );

        const saldoPendente = Number(
          Math.max(0, valorFinal - totalPago).toFixed(2)
        );

        const {
          pagamentos,
          cobrancasFinanceiras,
          ...base
        } = item;

        return {
          ...base,
          valorFinal,
          totalPago,
          saldoPendente,
          cobranca: cobrancasFinanceiras[0] || null,
        };
      })
      .filter(
        (item) =>
          item.saldoPendente > 0 &&
          Boolean(item.vencimento)
      );

    return NextResponse.json({ lancamentos });
  } catch (error) {
    console.error(
      "Erro ao listar mensalidades disponíveis para boleto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao listar mensalidades disponíveis para boleto.",
      },
      { status: 500 }
    );
  }
}
