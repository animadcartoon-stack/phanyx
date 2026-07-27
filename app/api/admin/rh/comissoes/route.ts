import {
  Prisma,
  StatusLancamentoComissaoRH,
} from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function usuarioPodeGerenciar(user: any) {
  const role = String(
    user?.role || ""
  ).toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user?.isMasterAdmin === true
  );
}

function normalizarIds(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

function inteiroOpcional(valor: string | null) {
  if (!valor) return null;

  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

function decimalParaString(
  valor: Prisma.Decimal | null | undefined
) {
  return valor?.toString() ?? null;
}

export async function GET(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      !usuarioPodeGerenciar(user)
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para visualizar as comissões.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const busca = String(
      searchParams.get("busca") || ""
    )
      .trim()
      .slice(0, 120);

    const statusInformado = String(
      searchParams.get("status") || ""
    )
      .trim()
      .toUpperCase();

    const competenciaMes =
      inteiroOpcional(
        searchParams.get("mes")
      );

    const competenciaAno =
      inteiroOpcional(
        searchParams.get("ano")
      );

    const funcionarioId =
      inteiroOpcional(
        searchParams.get("funcionarioId")
      );

    const statusValidos =
      Object.values(
        StatusLancamentoComissaoRH
      );

    const status =
      statusValidos.includes(
        statusInformado as StatusLancamentoComissaoRH
      )
        ? statusInformado as StatusLancamentoComissaoRH
        : null;

    const where:
      Prisma.LancamentoComissaoRHWhereInput =
    {
      instituicaoId,

      ...(status
        ? {
          status,
        }
        : {}),

      ...(competenciaMes
        ? {
          competenciaMes,
        }
        : {}),

      ...(competenciaAno
        ? {
          competenciaAno,
        }
        : {}),

      ...(funcionarioId
        ? {
          funcionarioId,
        }
        : {}),

      ...(busca
        ? {
          OR: [
            {
              funcionarioNomeSnapshot: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              alunoNomeSnapshot: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              cursoNomeSnapshot: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              matriculaNumeroSnapshot: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              descricao: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              planoNomeSnapshot: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              regraNomeSnapshot: {
                contains: busca,
                mode: "insensitive",
              },
            },
          ],
        }
        : {}),
    };

    const [
      lancamentos,
      resumoPorStatus,
    ] = await Promise.all([
      prisma.lancamentoComissaoRH.findMany({
        where,

        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              ativo: true,

              departamento: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },

          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },

          aprovadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },

          reprovadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },

          estornadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },

        orderBy: [
          {
            calculadoEm: "desc",
          },
          {
            id: "desc",
          },
        ],

        take: 500,
      }),

      prisma.lancamentoComissaoRH.groupBy({
        by: ["status"],
        where,

        _count: {
          _all: true,
        },

        _sum: {
          valorCalculado: true,
          valorAprovado: true,
        },
      }),
    ]);

    const lancamentosFormatados =
      lancamentos.map(
        (lancamento) => ({
          ...lancamento,

          baseCalculo:
            decimalParaString(
              lancamento.baseCalculo
            ) || "0",

          percentualAplicado:
            decimalParaString(
              lancamento.percentualAplicado
            ),

          valorFixoAplicado:
            decimalParaString(
              lancamento.valorFixoAplicado
            ),

          percentualParticipacao:
            decimalParaString(
              lancamento.percentualParticipacao
            ) || "100",

          valorCalculado:
            decimalParaString(
              lancamento.valorCalculado
            ) || "0",

          valorAprovado:
            decimalParaString(
              lancamento.valorAprovado
            ),
        })
      );

    const resumo = {
      total: lancamentos.length,

      pendentes: 0,
      aprovados: 0,
      reprovados: 0,
      enviadosHolerite: 0,
      pagos: 0,
      estornados: 0,
      cancelados: 0,

      valorPendente: 0,
      valorAprovado: 0,
      valorEnviadoHolerite: 0,
    };

    for (
      const item of resumoPorStatus
    ) {
      const quantidade =
        item._count._all;

      const valorCalculado =
        Number(
          item._sum.valorCalculado || 0
        );

      const valorAprovado =
        Number(
          item._sum.valorAprovado || 0
        );

      switch (item.status) {
        case StatusLancamentoComissaoRH.PENDENTE:
          resumo.pendentes =
            quantidade;

          resumo.valorPendente =
            valorCalculado;
          break;

        case StatusLancamentoComissaoRH.APROVADO:
          resumo.aprovados =
            quantidade;

          resumo.valorAprovado =
            valorAprovado ||
            valorCalculado;
          break;

        case StatusLancamentoComissaoRH.REPROVADO:
          resumo.reprovados =
            quantidade;
          break;

        case StatusLancamentoComissaoRH.ENVIADO_HOLERITE:
          resumo.enviadosHolerite =
            quantidade;

          resumo.valorEnviadoHolerite =
            valorAprovado ||
            valorCalculado;
          break;

        case StatusLancamentoComissaoRH.PAGO:
          resumo.pagos =
            quantidade;
          break;

        case StatusLancamentoComissaoRH.ESTORNADO:
          resumo.estornados =
            quantidade;
          break;

        case StatusLancamentoComissaoRH.CANCELADO:
          resumo.cancelados =
            quantidade;
          break;
      }
    }

    return NextResponse.json({
      lancamentos:
        lancamentosFormatados,
      resumo,
    });
  } catch (error: any) {
    console.error(
      "ERRO GET COMISSÕES RH:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao carregar as comissões.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      !usuarioPodeGerenciar(user)
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para processar comissões.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const usuarioResponsavelId =
      Number(user.id);

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0 ||
      !Number.isInteger(
        usuarioResponsavelId
      ) ||
      usuarioResponsavelId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário ou instituição não identificados.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const acao = String(
      body?.acao || ""
    )
      .trim()
      .toUpperCase();

    const lancamentoIds =
      normalizarIds(
        body?.lancamentoIds
      );

    if (
      acao !==
      "APROVAR_LANCAMENTOS" &&
      acao !==
      "REPROVAR_LANCAMENTOS"
    ) {
      return NextResponse.json(
        {
          error:
            "Ação inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      lancamentoIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos uma comissão pendente.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      acao ===
      "APROVAR_LANCAMENTOS"
    ) {
      const pendentes =
        await prisma.lancamentoComissaoRH.findMany(
          {
            where: {
              id: {
                in: lancamentoIds,
              },

              instituicaoId,

              status:
                StatusLancamentoComissaoRH.PENDENTE,
            },

            select: {
              id: true,
              valorCalculado: true,
            },
          }
        );

      if (
        pendentes.length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "Nenhuma das comissões selecionadas está pendente.",
          },
          {
            status: 400,
          }
        );
      }

      const aprovadoEm =
        new Date();

      const resultados =
        await prisma.$transaction(
          pendentes.map(
            (lancamento) =>
              prisma.lancamentoComissaoRH.updateMany(
                {
                  where: {
                    id:
                      lancamento.id,

                    instituicaoId,

                    status:
                      StatusLancamentoComissaoRH.PENDENTE,
                  },

                  data: {
                    status:
                      StatusLancamentoComissaoRH.APROVADO,

                    valorAprovado:
                      lancamento.valorCalculado,

                    aprovadoPorId:
                      usuarioResponsavelId,

                    aprovadoEm,

                    reprovadoPorId:
                      null,

                    reprovadoEm:
                      null,

                    motivoReprovacao:
                      null,
                  },
                }
              )
          )
        );

      const aprovados =
        resultados.reduce(
          (
            total,
            resultado
          ) =>
            total +
            resultado.count,
          0
        );

      const ignorados =
        lancamentoIds.length -
        aprovados;

      return NextResponse.json({
        message:
          `${aprovados} comissão(ões) aprovada(s).` +
          (ignorados > 0
            ? ` ${ignorados} comissão(ões) já processada(s) foram ignoradas.`
            : ""),

        aprovados,
        ignorados,
      });
    }

    const motivoReprovacao =
      String(
        body?.motivoReprovacao ||
        ""
      ).trim();

    if (
      motivoReprovacao.length < 5
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o motivo da reprovação com pelo menos 5 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    const resultado =
      await prisma.lancamentoComissaoRH.updateMany(
        {
          where: {
            id: {
              in: lancamentoIds,
            },

            instituicaoId,

            status:
              StatusLancamentoComissaoRH.PENDENTE,
          },

          data: {
            status:
              StatusLancamentoComissaoRH.REPROVADO,

            reprovadoPorId:
              usuarioResponsavelId,

            reprovadoEm:
              new Date(),

            motivoReprovacao,

            aprovadoPorId:
              null,

            aprovadoEm:
              null,

            valorAprovado:
              null,
          },
        }
      );

    if (
      resultado.count === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Nenhuma das comissões selecionadas está pendente.",
        },
        {
          status: 400,
        }
      );
    }

    const ignorados =
      lancamentoIds.length -
      resultado.count;

    return NextResponse.json({
      message:
        `${resultado.count} comissão(ões) reprovada(s).` +
        (ignorados > 0
          ? ` ${ignorados} comissão(ões) já processada(s) foram ignoradas.`
          : ""),

      reprovados:
        resultado.count,

      ignorados,
    });
  } catch (error: any) {
    console.error(
      "ERRO POST COMISSÕES RH:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao processar as comissões.",
      },
      {
        status: 500,
      }
    );
  }
}