import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    localId: string;
  };
};

function obterInstituicaoId(user: any) {
  const instituicaoId = Number(user?.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return null;
  }

  return instituicaoId;
}

function obterLocalId(
  contexto: ContextoRota
) {
  const localId = Number(
    contexto.params.localId
  );

  if (
    !Number.isInteger(localId) ||
    localId <= 0
  ) {
    return null;
  }

  return localId;
}

async function validarPermissao(user: any) {
  return usuarioPossuiPermissao(
    user,
    "rh.ponto.mobile.locais.gerenciar"
  );
}

function obterNumero(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(
    String(valor)
      .trim()
      .replace(",", ".")
  );

  return Number.isFinite(numero)
    ? numero
    : null;
}

function prepararDadosLocal(body: any) {
  const nome = String(body?.nome || "")
    .trim()
    .slice(0, 120);

  const enderecoTexto = String(
    body?.endereco || ""
  )
    .trim()
    .slice(0, 300);

  const latitude = obterNumero(
    body?.latitude
  );

  const longitude = obterNumero(
    body?.longitude
  );

  const raioMetros = obterNumero(
    body?.raioMetros
  );

  if (nome.length < 2) {
    return {
      error:
        "Informe um nome com pelo menos 2 caracteres.",
    };
  }

  if (
    latitude === null ||
    latitude < -90 ||
    latitude > 90
  ) {
    return {
      error:
        "Informe uma latitude válida entre -90 e 90.",
    };
  }

  if (
    longitude === null ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      error:
        "Informe uma longitude válida entre -180 e 180.",
    };
  }

  if (
    raioMetros === null ||
    !Number.isInteger(raioMetros) ||
    raioMetros < 10 ||
    raioMetros > 5000
  ) {
    return {
      error:
        "O raio permitido deve ser um número inteiro entre 10 e 5.000 metros.",
    };
  }

  return {
    dados: {
      nome,
      endereco:
        enderecoTexto || null,

      latitude,
      longitude,
      raioMetros,

      ativo: body?.ativo !== false,
    },
  };
}

export async function PUT(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const podeGerenciar =
      await validarPermissao(user);

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para editar locais do Ponto Mobile.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      obterInstituicaoId(user);

    const localId =
      obterLocalId(contexto);

    if (!instituicaoId) {
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

    if (!localId) {
      return NextResponse.json(
        {
          error: "Local inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const localExistente =
      await prisma.localPontoMobileRH.findFirst({
        where: {
          id: localId,
          instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!localExistente) {
      return NextResponse.json(
        {
          error:
            "Local não encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const preparado =
      prepararDadosLocal(body);

    if ("error" in preparado) {
      return NextResponse.json(
        {
          error: preparado.error,
        },
        {
          status: 400,
        }
      );
    }

    const duplicado =
      await prisma.localPontoMobileRH.findFirst({
        where: {
          instituicaoId,

          id: {
            not: localId,
          },

          nome: {
            equals:
              preparado.dados.nome,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicado) {
      return NextResponse.json(
        {
          error:
            "Já existe outro local cadastrado com este nome.",
        },
        {
          status: 409,
        }
      );
    }

    const local =
      await prisma.localPontoMobileRH.update({
        where: {
          id: localId,
        },

        data: preparado.dados,

        select: {
          id: true,
          nome: true,
          endereco: true,
          latitude: true,
          longitude: true,
          raioMetros: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      });

    return NextResponse.json({
      sucesso: true,

      mensagem:
        local.ativo
          ? "Local autorizado atualizado com sucesso."
          : "Local autorizado desativado com sucesso.",

      local,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar local do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível atualizar o local autorizado.",
      },
      {
        status: 500,
      }
    );
  }
}