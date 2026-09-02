import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const token =
      await getUserFromToken();

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    const atividadeId =
      Number(contexto.params.id);

    if (
      !Number.isInteger(
        atividadeId
      ) ||
      atividadeId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "ID_INVALIDO",
          message:
            "Atividade externa inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const usuario =
      await prisma.user.findFirst({
        where: {
          id: token.id,
          instituicaoId:
            token.instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          instituicaoId: true,
          role: true,
          acessoTodosPolos: true,

          funcionario: {
            select: {
              ativo: true,
              statusFuncionario:
                true,

              permissoes: {
                where: {
                  ativo: true,
                },
                select: {
                  chave: true,
                },
              },

              departamento: {
                select: {
                  permissoes: {
                    where: {
                      ativo: true,
                    },
                    select: {
                      chave: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error: "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    const role = String(
      usuario.role || ""
    ).toUpperCase();

    const administrador =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    if (!administrador) {
      const funcionario =
        usuario.funcionario;

      const permissoes =
        new Set([
          ...(funcionario
            ?.permissoes || []
          ).map(
            (item) =>
              item.chave
          ),

          ...(funcionario
            ?.departamento
            ?.permissoes || []
          ).map(
            (item) =>
              item.chave
          ),
        ]);

      const podeVer =
        permissoes.has(
          "atividades-externas.ver"
        ) ||
        permissoes.has(
          "atividades-externas.gerenciar"
        );

      if (
        !funcionario ||
        !funcionario.ativo ||
        funcionario
          .statusFuncionario !==
          "ATIVO" ||
        !podeVer
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "SEM_PERMISSAO",
          },
          {
            status: 403,
          }
        );
      }
    }

    let polosPermitidos:
      | number[]
      | null = null;

    if (
      !usuario.acessoTodosPolos
    ) {
      const acessos =
        await prisma.userPolo.findMany({
          where: {
            userId: usuario.id,
            instituicaoId:
              usuario.instituicaoId,
            ativo: true,
          },

          select: {
            poloId: true,
          },
        });

      polosPermitidos =
        acessos.map(
          (item) =>
            item.poloId
        );
    }

    const atividade =
      await prisma
        .atividadeExterna
        .findFirst({
          where: {
            id: atividadeId,

            instituicaoId:
              usuario.instituicaoId,

            ...(polosPermitidos !==
            null
              ? {
                  OR: [
                    {
                      poloId: null,
                    },
                    {
                      poloId: {
                        in: polosPermitidos,
                      },
                    },
                  ],
                }
              : {}),
          },

          include: {
            polo: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },

            responsavelPrincipal: {
              select: {
                id: true,
                nome: true,
                email: true,

                funcionario: {
                  select: {
                    nome: true,
                  },
                },
              },
            },

            turmas: {
              select: {
                id: true,

                turma: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    periodoLetivo:
                      true,
                    turno: true,
                  },
                },
              },
            },

            _count: {
              select: {
                participantes:
                  true,
                equipe: true,
                autorizacoes:
                  true,
                trechos: true,
                documentos:
                  true,
                riscos: true,
                checkpoints:
                  true,
              },
            },
          },
        });

    if (!atividade) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ATIVIDADE_NAO_ENCONTRADA",
          message:
            "Atividade externa não encontrada ou fora do seu acesso.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      atividade,
    });
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_DETALHE]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "ERRO_INTERNO",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              detalhe:
                error instanceof
                Error
                  ? error.message
                  : String(error),
            }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}