import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";

type ContextoRota = {
  params: {
    funcionarioId: string;
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

function obterFuncionarioId(contexto: ContextoRota) {
  const funcionarioId = Number(
    contexto.params.funcionarioId
  );

  if (
    !Number.isInteger(funcionarioId) ||
    funcionarioId <= 0
  ) {
    return null;
  }

  return funcionarioId;
}

function obterBaseUrl(req: NextRequest) {
  return String(
    process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin
  ).replace(/\/+$/, "");
}

function montarLinkConvite(
  req: NextRequest,
  slug: string,
  token: string
) {
  const baseUrl = obterBaseUrl(req);

  return (
    `${baseUrl}/rh-app/` +
    `${encodeURIComponent(slug)}/primeiro-acesso` +
    `?token=${encodeURIComponent(token)}`
  );
}

async function validarAcessoAdministrativo() {
  const user = await getUserFromToken();

  if (!user) {
    return {
      resposta: NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const podeGerenciar =
    await usuarioPossuiPermissao(
      user,
      "rh.ponto.mobile.funcionarios.gerenciar"
    );

  if (!podeGerenciar) {
    return {
      resposta: NextResponse.json(
        {
          error:
            "Você não possui permissão para gerenciar convites do Ponto Mobile.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  const instituicaoId = obterInstituicaoId(user);
  const usuarioId = obterUsuarioId(user);

  if (!instituicaoId || !usuarioId) {
    return {
      resposta: NextResponse.json(
        {
          error:
            "Instituição ou usuário não identificado.",
        },
        {
          status: 400,
        }
      ),
    };
  }

  return {
    user,
    instituicaoId,
    usuarioId,
  };
}

async function localizarFuncionario(
  instituicaoId: number,
  funcionarioId: number
) {
  return prisma.funcionario.findFirst({
    where: {
      id: funcionarioId,
      instituicaoId,
    },

    select: {
      id: true,
      nome: true,
      pontoMobileLiberado: true,

      pontoMobileConviteToken: true,
      pontoMobileConviteExpiraEm: true,
      pontoMobileConviteCriadoEm: true,
      pontoMobileConviteUsadoEm: true,

      user: {
        select: {
          email: true,
          ativo: true,
        },
      },

      instituicao: {
        select: {
          slug: true,
        },
      },
    },
  });
}

export async function GET(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const acesso =
      await validarAcessoAdministrativo();

    if ("resposta" in acesso) {
      return acesso.resposta;
    }

    const funcionarioId =
      obterFuncionarioId(contexto);

    if (!funcionarioId) {
      return NextResponse.json(
        {
          error: "Funcionário inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const funcionario = await localizarFuncionario(
      acesso.instituicaoId,
      funcionarioId
    );

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !funcionario.pontoMobileConviteToken ||
      !funcionario.pontoMobileConviteExpiraEm ||
      funcionario.pontoMobileConviteUsadoEm
    ) {
      return NextResponse.json(
        {
          error:
            "Este funcionário não possui convite pendente.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      funcionario.pontoMobileConviteExpiraEm.getTime() <=
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "O convite deste funcionário está expirado. Gere um novo convite.",
        },
        {
          status: 400,
        }
      );
    }

    const link = montarLinkConvite(
      req,
      funcionario.instituicao.slug,
      funcionario.pontoMobileConviteToken
    );

    return NextResponse.json({
      sucesso: true,
      link,
      expiraEm:
        funcionario.pontoMobileConviteExpiraEm,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar convite do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar o convite.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const acesso =
      await validarAcessoAdministrativo();

    if ("resposta" in acesso) {
      return acesso.resposta;
    }

    const funcionarioId =
      obterFuncionarioId(contexto);

    if (!funcionarioId) {
      return NextResponse.json(
        {
          error: "Funcionário inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const funcionario = await localizarFuncionario(
      acesso.instituicaoId,
      funcionarioId
    );

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    if (!funcionario.pontoMobileLiberado) {
      return NextResponse.json(
        {
          error:
            "Libere o funcionário para o Ponto Mobile antes de gerar o convite.",
        },
        {
          status: 400,
        }
      );
    }

    if (!funcionario.user?.ativo) {
      return NextResponse.json(
        {
          error:
            "O usuário deste funcionário está inativo.",
        },
        {
          status: 400,
        }
      );
    }

    if (!funcionario.user?.email) {
      return NextResponse.json(
        {
          error:
            "Este funcionário não possui e-mail de acesso.",
        },
        {
          status: 400,
        }
      );
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    const criadoEm = new Date();

    const expiraEm = new Date(
      criadoEm.getTime() +
        48 * 60 * 60 * 1000
    );

    const atualizado =
      await prisma.funcionario.update({
        where: {
          id: funcionario.id,
        },

        data: {
          pontoMobileConviteToken: token,
          pontoMobileConviteCriadoEm: criadoEm,
          pontoMobileConviteExpiraEm: expiraEm,
          pontoMobileConviteCriadoPorId:
            acesso.usuarioId,
          pontoMobileConviteUsadoEm: null,
        },

        select: {
          id: true,
          nome: true,
          pontoMobileConviteCriadoEm: true,
          pontoMobileConviteExpiraEm: true,
        },
      });

    const link = montarLinkConvite(
      req,
      funcionario.instituicao.slug,
      token
    );

    return NextResponse.json({
      sucesso: true,

      mensagem:
        "Convite de primeiro acesso gerado com validade de 48 horas.",

      convite: {
        status: "PENDENTE",
        link,
        criadoEm:
          atualizado.pontoMobileConviteCriadoEm,
        expiraEm:
          atualizado.pontoMobileConviteExpiraEm,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao gerar convite do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível gerar o convite de primeiro acesso.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const acesso =
      await validarAcessoAdministrativo();

    if ("resposta" in acesso) {
      return acesso.resposta;
    }

    const funcionarioId =
      obterFuncionarioId(contexto);

    if (!funcionarioId) {
      return NextResponse.json(
        {
          error: "Funcionário inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const funcionario = await localizarFuncionario(
      acesso.instituicaoId,
      funcionarioId
    );

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado nesta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.funcionario.update({
      where: {
        id: funcionario.id,
      },

      data: {
        pontoMobileConviteToken: null,
        pontoMobileConviteExpiraEm: null,
        pontoMobileConviteCriadoEm: null,
        pontoMobileConviteCriadoPorId: null,
        pontoMobileConviteUsadoEm: null,
      },
    });

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "Convite de primeiro acesso cancelado.",
    });
  } catch (error) {
    console.error(
      "Erro ao cancelar convite do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível cancelar o convite.",
      },
      {
        status: 500,
      }
    );
  }
}