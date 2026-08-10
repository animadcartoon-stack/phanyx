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
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const podeSelecionarVendedor =
      temAlgumaPermissao(user, [
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
        {
          status: 403,
        }
      );
    }

    const agora = new Date();

    /*
     * Cargo é a fonte oficial para determinar
     * quem é vendedor.
     *
     * Não usamos mais plano de comissão
     * como requisito para aparecer na matrícula.
     */
    const cargosVendedor =
      await prisma.cargo.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          ativo: true,

          nomeNormalizado:
            "vendedor",
        },

        select: {
          id: true,
        },
      });

    const cargoIds =
      cargosVendedor.map(
        (cargo) => cargo.id
      );

    if (cargoIds.length === 0) {
      return NextResponse.json([]);
    }

    const vendedores =
      await prisma.funcionario.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          ativo: true,

          statusFuncionario:
            "ATIVO",

          cargoId: {
            in: cargoIds,
          },
        },

        select: {
          id: true,
          nome: true,
          cargo: true,
          cargoId: true,

          departamento: {
            select: {
              id: true,
              nome: true,
            },
          },

          /*
           * Comissão continua opcional.
           * Buscamos apenas um vínculo válido,
           * caso exista.
           */
          planosComissaoRH: {
            where: {
              instituicaoId:
                user.instituicaoId,

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
                  instituicaoId:
                    user.instituicaoId,

                  ativo: true,

                  AND: [
                    {
                      OR: [
                        {
                          inicioVigencia:
                            null,
                        },
                        {
                          inicioVigencia:
                            {
                              lte: agora,
                            },
                        },
                      ],
                    },

                    {
                      OR: [
                        {
                          fimVigencia:
                            null,
                        },
                        {
                          fimVigencia:
                            {
                              gte: agora,
                            },
                        },
                      ],
                    },
                  ],
                },
              },
            },

            select: {
              id: true,
              inicioVigencia: true,
              fimVigencia: true,

              plano: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },

            orderBy: {
              inicioVigencia:
                "desc",
            },

            take: 1,
          },
        },

        orderBy: {
          nome: "asc",
        },
      });

    return NextResponse.json(
      vendedores.map(
        (vendedor) => {
          const vinculoComissao =
            vendedor
              .planosComissaoRH[0] ||
            null;

          return {
            id: vendedor.id,

            nome:
              vendedor.nome,

            cargo:
              vendedor.cargo,

            cargoId:
              vendedor.cargoId,

            departamento:
              vendedor.departamento,

            /*
             * Pode ser null.
             *
             * Isso NÃO impede mais
             * o funcionário de ser vendedor.
             */
            planoComissao:
              vinculoComissao
                ? {
                    vinculoId:
                      vinculoComissao.id,

                    planoId:
                      vinculoComissao
                        .plano.id,

                    planoNome:
                      vinculoComissao
                        .plano.nome,

                    inicioVigencia:
                      vinculoComissao
                        .inicioVigencia,

                    fimVigencia:
                      vinculoComissao
                        .fimVigencia,
                  }
                : null,
          };
        }
      )
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
      {
        status: 500,
      }
    );
  }
}