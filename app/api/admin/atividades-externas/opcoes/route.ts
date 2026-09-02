import {
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
              statusFuncionario: true,

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

      const permissoes = new Set([
        ...(funcionario?.permissoes ||
          []).map(
          (item) => item.chave
        ),

        ...(funcionario?.departamento
          ?.permissoes || []
        ).map(
          (item) => item.chave
        ),
      ]);

      const podeGerenciar =
        permissoes.has(
          "atividades-externas.gerenciar"
        );

      if (
        !funcionario ||
        !funcionario.ativo ||
        funcionario.statusFuncionario !==
          "ATIVO" ||
        !podeGerenciar
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "SEM_PERMISSAO",
          },
          {
            status: 403,
          }
        );
      }
    }

    let poloIdsPermitidos:
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

      poloIdsPermitidos =
        acessos.map(
          (item) => item.poloId
        );
    }

    const filtroPolo =
      poloIdsPermitidos === null
        ? {}
        : {
            id: {
              in: poloIdsPermitidos,
            },
          };

    const filtroPoloTurma =
      poloIdsPermitidos === null
        ? {}
        : {
            poloId: {
              in: poloIdsPermitidos,
            },
          };

    const [
  polos,
  turmas,
  responsaveisBrutos,
] = await Promise.all([
      prisma.polo.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,
          ativo: true,
          ...filtroPolo,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.turma.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,
          ativa: true,
          ...filtroPoloTurma,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
          periodoLetivo: true,
          turno: true,
          poloId: true,

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.user.findMany({
  where: {
    instituicaoId:
      usuario.instituicaoId,
    ativo: true,
  },

  select: {
    id: true,
    nome: true,
    email: true,
    role: true,

    funcionario: {
  select: {
    nome: true,
    ativo: true,
    statusFuncionario: true,
  },
},
  },

  orderBy: {
    nome: "asc",
  },
}),
    ]);

const rolesResponsaveis =
  new Set([
    "ADMIN",
    "SUPER_ADMIN",
    "COORDENADOR",
    "SECRETARIA",
    "GERENCIA",
  ]);

const responsaveis =
  responsaveisBrutos
    .filter((item) => {
      const role = String(
        item.role || ""
      ).toUpperCase();

      const funcionarioAtivo =
        item.funcionario?.ativo ===
          true &&
        item.funcionario
          ?.statusFuncionario ===
          "ATIVO";

      return (
        rolesResponsaveis.has(role) ||
        funcionarioAtivo
      );
    })
    .map((item) => ({
  id: item.id,

  nome:
    item.nome?.trim() ||
    item.funcionario?.nome?.trim() ||
    item.email?.trim() ||
    "",

  email: item.email,
  role: item.role,
}));

    return NextResponse.json({
      ok: true,

      acessoTodosPolos:
        usuario.acessoTodosPolos,

      usuarioAtualId:
        usuario.id,

      polos,
      turmas,
      responsaveis,
    });
  } catch (error) {
  console.error(
    "[ATIVIDADES_EXTERNAS_OPCOES]",
    error
  );

  const mensagem =
    error instanceof Error
      ? error.message
      : String(error);

  return NextResponse.json(
    {
      ok: false,
      error: "ERRO_INTERNO",

      ...(process.env.NODE_ENV !== "production"
        ? {
            detalhe: mensagem,
          }
        : {}),
    },
    {
      status: 500,
    }
  );
}
}