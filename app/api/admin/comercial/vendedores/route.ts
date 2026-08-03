import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const podeSelecionarVendedor = temAlgumaPermissao(user, [
      "comercial.matriculas.vincular_vendedor",
      "comercial.vendedores.ver",
      "comercial.vendedores.gerenciar",
    ]);

    if (!podeSelecionarVendedor) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para visualizar ou selecionar vendedores.",
        },
        { status: 403 }
      );
    }

    const agora = new Date();

const vendedores = await prisma.funcionario.findMany({
  where: {
    instituicaoId: user.instituicaoId,
    ativo: true,
    statusFuncionario: "ATIVO",

    planosComissaoRH: {
      some: {
        instituicaoId: user.instituicaoId,
        ativo: true,
        inicioVigencia: {
          lte: agora,
        },
        OR: [
          {
            fimVigencia: null,
          },
          {
            fimVigencia: {
              gte: agora,
            },
          },
        ],
        plano: {
          is: {
            instituicaoId: user.instituicaoId,
            ativo: true,
            AND: [
              {
                OR: [
                  {
                    inicioVigencia: null,
                  },
                  {
                    inicioVigencia: {
                      lte: agora,
                    },
                  },
                ],
              },
              {
                OR: [
                  {
                    fimVigencia: null,
                  },
                  {
                    fimVigencia: {
                      gte: agora,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },

  select: {
    id: true,
    nome: true,
    cargo: true,

    departamento: {
      select: {
        id: true,
        nome: true,
      },
    },

    planosComissaoRH: {
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
        inicioVigencia: {
          lte: agora,
        },
        OR: [
          {
            fimVigencia: null,
          },
          {
            fimVigencia: {
              gte: agora,
            },
          },
        ],
      },
      select: {
        id: true,
        inicioVigencia: true,
        fimVigencia: true,
        plano: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },
      },
      orderBy: {
        inicioVigencia: "desc",
      },
      take: 1,
    },
  },

  orderBy: {
    nome: "asc",
  },
});

return NextResponse.json(
  vendedores.map((vendedor) => {
    const vinculoComissao = vendedor.planosComissaoRH[0] || null;

    return {
      id: vendedor.id,
      nome: vendedor.nome,
      cargo: vendedor.cargo,
      departamento: vendedor.departamento,

      planoComissao: vinculoComissao
        ? {
            vinculoId: vinculoComissao.id,
            planoId: vinculoComissao.plano.id,
            planoNome: vinculoComissao.plano.nome,
            inicioVigencia: vinculoComissao.inicioVigencia,
            fimVigencia: vinculoComissao.fimVigencia,
          }
        : null,
    };
  })
);

  } catch (error) {
    console.error(
      "Erro ao carregar vendedores disponíveis:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os vendedores disponíveis.",
      },
      { status: 500 }
    );
  }
}