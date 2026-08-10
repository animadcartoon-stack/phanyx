import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

type ContextoRota = {
  params: {
    id: string;
  };
};

function normalizarNomeCargo(
  valor: unknown
) {
  return String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFC")
    .toLocaleLowerCase("pt-BR");
}

function nomeCargoExibicao(
  valor: unknown
) {
  return String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function GET(
  _request: Request,
  { params }: ContextoRota
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const departamentoId =
      Number(params.id);

    if (
      !Number.isInteger(
        departamentoId
      ) ||
      departamentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Departamento inválido",
        },
        {
          status: 400,
        }
      );
    }

    const departamento =
      await prisma.departamento.findFirst({
        where: {
          id: departamentoId,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      });

    if (!departamento) {
      return NextResponse.json(
        {
          error:
            "Departamento não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const cargos =
      await prisma.cargo.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          departamentoId,
        },

        select: {
          id: true,
          nome: true,
          nomeNormalizado: true,
          ativo: true,
          departamentoId: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              funcionarios: true,
            },
          },
        },

        orderBy: [
          {
            ativo: "desc",
          },
          {
            nome: "asc",
          },
        ],
      });

    return NextResponse.json({
      departamento,

      cargos: cargos.map(
        (cargo) => ({
          id: cargo.id,
          nome: cargo.nome,
          nomeNormalizado:
            cargo.nomeNormalizado,
          ativo: cargo.ativo,
          departamentoId:
            cargo.departamentoId,

          quantidadeFuncionarios:
            cargo._count
              .funcionarios,

          createdAt:
            cargo.createdAt,

          updatedAt:
            cargo.updatedAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Erro ao listar cargos do departamento:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao listar cargos do departamento",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  { params }: ContextoRota
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !isAdminLike(user.role)
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão",
        },
        {
          status: 403,
        }
      );
    }

    const departamentoId =
      Number(params.id);

    if (
      !Number.isInteger(
        departamentoId
      ) ||
      departamentoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Departamento inválido",
        },
        {
          status: 400,
        }
      );
    }

    const departamento =
      await prisma.departamento.findFirst({
        where: {
          id: departamentoId,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      });

    if (!departamento) {
      return NextResponse.json(
        {
          error:
            "Departamento não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const nome =
      nomeCargoExibicao(
        body?.nome
      );

    const nomeNormalizado =
      normalizarNomeCargo(
        body?.nome
      );

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Nome do cargo é obrigatório",
        },
        {
          status: 400,
        }
      );
    }

    if (
      nome.length > 120
    ) {
      return NextResponse.json(
        {
          error:
            "O nome do cargo deve ter no máximo 120 caracteres",
        },
        {
          status: 400,
        }
      );
    }

    const existente =
      await prisma.cargo.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId,

          departamentoId,

          nomeNormalizado,
        },

        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      });

    if (existente) {
      return NextResponse.json(
        {
          error:
            existente.ativo
              ? `O cargo "${existente.nome}" já está cadastrado neste departamento.`
              : `O cargo "${existente.nome}" já existe neste departamento, mas está inativo. Reative o cargo existente em vez de criar outro.`,
        },
        {
          status: 409,
        }
      );
    }

    const cargo =
      await prisma.cargo.create({
        data: {
          nome,

          nomeNormalizado,

          ativo: true,

          instituicaoId:
            user.instituicaoId,

          departamentoId,
        },

        select: {
          id: true,
          nome: true,
          nomeNormalizado: true,
          ativo: true,
          departamentoId: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              funcionarios: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        id: cargo.id,
        nome: cargo.nome,
        nomeNormalizado:
          cargo.nomeNormalizado,
        ativo: cargo.ativo,

        departamentoId:
          cargo.departamentoId,

        quantidadeFuncionarios:
          cargo._count
            .funcionarios,

        createdAt:
          cargo.createdAt,

        updatedAt:
          cargo.updatedAt,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao criar cargo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao criar cargo",
      },
      {
        status: 500,
      }
    );
  }
}