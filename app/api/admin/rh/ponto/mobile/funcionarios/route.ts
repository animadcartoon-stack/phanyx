import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";

const selecaoFuncionario = {
  id: true,
  nome: true,
  cargo: true,
  fotoPerfil: true,

  user: {
    select: {
      email: true,
      ativo: true,
      precisaTrocarSenha: true,
    },
  },

  pontoMobileLiberado: true,
  pontoMobileLiberadoEm: true,
  pontoMobileLiberadoPorId: true,
  pontoMobileValidoAte: true,

  pontoMobileConviteToken: true,
  pontoMobileConviteExpiraEm: true,
  pontoMobileConviteCriadoEm: true,
  pontoMobileConviteUsadoEm: true,
} as const;

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

function obterUsuarioId(user: any) {
  const usuarioId = Number(user?.id);

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    return null;
  }

  return usuarioId;
}

function obterDataValidade(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

async function validarPermissao(user: any) {
  return usuarioPossuiPermissao(
    user,
    "rh.ponto.mobile.funcionarios.gerenciar"
  );
}

function obterStatusConvite(funcionario: any) {
  if (funcionario.pontoMobileConviteUsadoEm) {
    return "USADO";
  }

  if (!funcionario.pontoMobileConviteToken) {
    return "SEM_CONVITE";
  }

  if (!funcionario.pontoMobileConviteExpiraEm) {
    return "EXPIRADO";
  }

  const expiraEm = new Date(
    funcionario.pontoMobileConviteExpiraEm
  );

  if (
    Number.isNaN(expiraEm.getTime()) ||
    expiraEm.getTime() <= Date.now()
  ) {
    return "EXPIRADO";
  }

  return "PENDENTE";
}

function serializarFuncionario(funcionarioBruto: any) {
  const {
    user: usuarioFuncionario,
    pontoMobileConviteToken: _tokenProtegido,
    ...funcionario
  } = funcionarioBruto;

  return {
    ...funcionario,

    email: usuarioFuncionario?.email || null,

    usuarioAtivo:
      usuarioFuncionario?.ativo === true,

    precisaTrocarSenha:
      usuarioFuncionario?.precisaTrocarSenha === true,

    pontoMobileConviteStatus:
      obterStatusConvite(funcionarioBruto),
  };
}

export async function GET(req: NextRequest) {
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

    const podeGerenciar = await validarPermissao(user);

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para gerenciar os funcionários do Ponto Mobile.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId = obterInstituicaoId(user);

    if (!instituicaoId) {
      return NextResponse.json(
        {
          error: "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const busca =
      req.nextUrl.searchParams.get("busca")?.trim() || "";

    const filtroLiberado =
      req.nextUrl.searchParams.get("liberado");

    const where: any = {
      instituicaoId,
    };

    if (busca) {
      where.OR = [
        {
          nome: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          cargo: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          user: {
            is: {
              email: {
                contains: busca,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (filtroLiberado === "true") {
      where.pontoMobileLiberado = true;
    }

    if (filtroLiberado === "false") {
      where.pontoMobileLiberado = false;
    }

    const [configuracao, funcionariosBrutos] =
      await Promise.all([
        prisma.configuracaoPontoMobileRH.findUnique({
          where: {
            instituicaoId,
          },
          select: {
            ativo: true,
            exigirFuncionarioLiberado: true,
          },
        }),

        prisma.funcionario.findMany({
          where,
          orderBy: {
            nome: "asc",
          },
          take: 500,
          select: selecaoFuncionario,
        }),
      ]);

    const funcionarios = funcionariosBrutos.map(
      serializarFuncionario
    );

    return NextResponse.json({
      configuracao: {
        pontoMobileAtivo:
          configuracao?.ativo === true,

        exigirFuncionarioLiberado:
          configuracao?.exigirFuncionarioLiberado !== false,
      },

      permissoes: {
        podeGerenciar: true,
      },

      funcionarios,
    });
  } catch (error) {
    console.error(
      "Erro ao listar funcionários do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os funcionários do Ponto Mobile.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const podeGerenciar = await validarPermissao(user);

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para liberar ou bloquear funcionários no Ponto Mobile.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId = obterInstituicaoId(user);

    if (!instituicaoId) {
      return NextResponse.json(
        {
          error: "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const idsRecebidos = Array.isArray(
      body.funcionarioIds
    )
      ? body.funcionarioIds
      : body.funcionarioId
        ? [body.funcionarioId]
        : [];

    const funcionarioIds = Array.from(
      new Set(
        idsRecebidos
          .map((id: unknown) => Number(id))
          .filter(
            (id: number) =>
              Number.isInteger(id) && id > 0
          )
      )
    );

    if (funcionarioIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos um funcionário.",
        },
        {
          status: 400,
        }
      );
    }

    const liberado = body.liberado === true;
    const usuarioId = obterUsuarioId(user);

    const funcionariosDaInstituicao =
      await prisma.funcionario.findMany({
        where: {
          instituicaoId,
          id: {
            in: funcionarioIds,
          },
        },
        select: {
          id: true,
        },
      });

    const idsPermitidos =
      funcionariosDaInstituicao.map(
        (funcionario) => funcionario.id
      );

    if (idsPermitidos.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum funcionário válido foi encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    const validoAte = liberado
      ? obterDataValidade(body.validoAte)
      : null;

    await prisma.funcionario.updateMany({
      where: {
        instituicaoId,
        id: {
          in: idsPermitidos,
        },
      },

      data: {
        pontoMobileLiberado: liberado,

        pontoMobileLiberadoEm: liberado
          ? new Date()
          : null,

        pontoMobileLiberadoPorId: liberado
          ? usuarioId
          : null,

        pontoMobileValidoAte: liberado
          ? validoAte
          : null,

        ...(!liberado
          ? {
              pontoMobileConviteToken: null,
              pontoMobileConviteExpiraEm: null,
              pontoMobileConviteCriadoEm: null,
              pontoMobileConviteCriadoPorId: null,
              pontoMobileConviteUsadoEm: null,
            }
          : {}),
      },
    });

    const funcionariosAtualizadosBrutos =
      await prisma.funcionario.findMany({
        where: {
          instituicaoId,
          id: {
            in: idsPermitidos,
          },
        },
        orderBy: {
          nome: "asc",
        },
        select: selecaoFuncionario,
      });

    const funcionariosAtualizados =
      funcionariosAtualizadosBrutos.map(
        serializarFuncionario
      );

    return NextResponse.json({
      sucesso: true,

      mensagem: liberado
        ? `${funcionariosAtualizados.length} funcionário(s) liberado(s) para o Ponto Mobile.`
        : `${funcionariosAtualizados.length} funcionário(s) bloqueado(s) no Ponto Mobile.`,

      funcionarios: funcionariosAtualizados,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar funcionários do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível atualizar o acesso dos funcionários ao Ponto Mobile.",
      },
      {
        status: 500,
      }
    );
  }
}