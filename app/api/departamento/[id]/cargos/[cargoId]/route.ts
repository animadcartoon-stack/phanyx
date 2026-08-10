import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

type ContextoRota = {
  params: {
    id: string;
    cargoId: string;
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

async function validarContexto(
  instituicaoId: number,
  departamentoId: number,
  cargoId: number
) {
  const departamento =
    await prisma.departamento.findFirst({
      where: {
        id: departamentoId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

  if (!departamento) {
    return {
      erro: NextResponse.json(
        {
          error:
            "Departamento não encontrado",
        },
        {
          status: 404,
        }
      ),
    };
  }

  const cargo =
    await prisma.cargo.findFirst({
      where: {
        id: cargoId,
        departamentoId,
        instituicaoId,
      },

      select: {
        id: true,
        nome: true,
        nomeNormalizado: true,
        ativo: true,
        departamentoId: true,

        _count: {
          select: {
            funcionarios: true,
          },
        },
      },
    });

  if (!cargo) {
    return {
      erro: NextResponse.json(
        {
          error:
            "Cargo não encontrado",
        },
        {
          status: 404,
        }
      ),
    };
  }

  return {
    departamento,
    cargo,
  };
}

export async function PUT(
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

    if (!isAdminLike(user.role)) {
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

    const cargoId =
      Number(params.cargoId);

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

    if (
      !Number.isInteger(cargoId) ||
      cargoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cargo inválido",
        },
        {
          status: 400,
        }
      );
    }

    const contexto =
      await validarContexto(
        user.instituicaoId,
        departamentoId,
        cargoId
      );

    if ("erro" in contexto) {
      return contexto.erro;
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

    if (nome.length > 120) {
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

    const duplicado =
      await prisma.cargo.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId,

          departamentoId,

          nomeNormalizado,

          id: {
            not: cargoId,
          },
        },

        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      });

    if (duplicado) {
      return NextResponse.json(
        {
          error:
            `Já existe o cargo "${duplicado.nome}" neste departamento.`,
        },
        {
          status: 409,
        }
      );
    }

    const ativo =
      typeof body?.ativo ===
      "boolean"
        ? body.ativo
        : contexto.cargo.ativo;

    const cargo =
      await prisma.cargo.update({
        where: {
          id: cargoId,
        },

        data: {
          nome,
          nomeNormalizado,
          ativo,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar cargo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar cargo",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
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

    if (!isAdminLike(user.role)) {
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

    const cargoId =
      Number(params.cargoId);

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

    if (
      !Number.isInteger(cargoId) ||
      cargoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cargo inválido",
        },
        {
          status: 400,
        }
      );
    }

    const contexto =
      await validarContexto(
        user.instituicaoId,
        departamentoId,
        cargoId
      );

    if ("erro" in contexto) {
      return contexto.erro;
    }

    const body =
      await request.json();

    if (
      typeof body?.ativo !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o status do cargo",
        },
        {
          status: 400,
        }
      );
    }

    const cargo =
      await prisma.cargo.update({
        where: {
          id: cargoId,
        },

        data: {
          ativo:
            body.ativo,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error(
      "Erro ao alterar status do cargo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao alterar status do cargo",
      },
      {
        status: 500,
      }
    );
  }
}