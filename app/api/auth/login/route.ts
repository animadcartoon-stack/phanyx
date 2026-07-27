import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  assinaturaPermiteUso,
  mensagemBloqueioAssinatura,
} from "@/lib/assinatura-acesso";

type Portal =
  | "admin"
  | "professor"
  | "aluno"
  | "rh";

function normalizarRole(role: string) {
  return String(role || "").trim().toLowerCase();
}

function podeEntrarNoPortal(
  portal: Exclude<Portal, "rh">,
  role: string
) {
  const roleNormalizada = normalizarRole(role);

  if (portal === "aluno") {
    return roleNormalizada === "aluno";
  }

  if (portal === "professor") {
    return roleNormalizada === "professor";
  }

  if (portal === "admin") {
    return [
      "admin",
      "gerencia",
      "secretaria",
      "coordenador",
      "financeiro",
      "suporte",
    ].includes(roleNormalizada);
  }

  return false;
}

function mensagemPortalIncorreto(
  portal: Exclude<Portal, "rh">
) {
  if (portal === "admin") {
    return "Este acesso é exclusivo da instituição/administração.";
  }

  if (portal === "professor") {
    return "Este login é exclusivo para professores.";
  }

  return "Este login é exclusivo para alunos.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      senha,
      portal,
      instituicao,
    } = body as {
      email?: string;
      senha?: string;
      portal?: Portal;
      instituicao?: string;
    };

    if (!email || !senha) {
      return NextResponse.json(
        {
          error: "Email e senha são obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    const portalNormalizado: Portal =
      portal === "admin" ||
        portal === "professor" ||
        portal === "aluno" ||
        portal === "rh"
        ? portal
        : "admin";

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado.",
        },
        {
          status: 401,
        }
      );
    }

    if (user.ativo === false) {
      return NextResponse.json(
        {
          error:
            "Seu acesso está bloqueado. Procure a administração da instituição.",
        },
        {
          status: 403,
        }
      );
    }

    const senhaValida = await bcrypt.compare(
      senha,
      user.senha
    );

    if (!senhaValida) {
      return NextResponse.json(
        {
          error: "Senha inválida.",
        },
        {
          status: 401,
        }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error: "Usuário sem instituição vinculada.",
        },
        {
          status: 403,
        }
      );
    }

    if (!user.isMasterAdmin) {
      const instituicaoAssinatura =
        await prisma.instituicao.findUnique({
          where: {
            id: user.instituicaoId,
          },
          select: {
            id: true,
            nome: true,
            ativo: true,
            statusAssinatura: true,
            isentaPagamento: true,
          },
        });

      if (!instituicaoAssinatura) {
        return NextResponse.json(
          {
            error:
              "A instituição vinculada a este usuário não foi encontrada.",
          },
          {
            status: 403,
          }
        );
      }

      if (instituicaoAssinatura.ativo === false) {
        return NextResponse.json(
          {
            error:
              "O acesso desta unidade está inativo. Procure a administração da instituição contratante.",
          },
          {
            status: 403,
          }
        );
      }

      const assinatura =
        await prisma.assinaturaPhanyx.findUnique({
          where: {
            instituicaoId: user.instituicaoId,
          },
          select: {
            status: true,
            testeGratisFimEm: true,
          },
        });

      const statusParaValidar =
        assinatura?.status ||
        instituicaoAssinatura?.statusAssinatura;

      const podeUsarPhanyx =
        assinaturaPermiteUso(
          statusParaValidar,
          instituicaoAssinatura?.isentaPagamento,
          assinatura?.testeGratisFimEm
        );

      if (!podeUsarPhanyx) {
        return NextResponse.json(
          {
            error:
              mensagemBloqueioAssinatura(
                statusParaValidar,
                instituicaoAssinatura?.isentaPagamento,
                assinatura?.testeGratisFimEm
              ) ||
              "O acesso da instituição ao PHANYX está bloqueado. Reative a assinatura para continuar.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const roleNormalizada = normalizarRole(user.role);

    let funcionarioRhId: number | null = null;
    let instituicaoRhSlug: string | null = null;
    let destinoRh: string | null = null;

    if (portalNormalizado === "rh") {
      const slugRecebido = decodeURIComponent(
        String(instituicao || "")
      )
        .trim()
        .toLowerCase();

      if (!slugRecebido) {
        return NextResponse.json(
          {
            error:
              "A instituição do RH não foi identificada. Abra novamente o link fornecido pelo setor de RH.",
          },
          {
            status: 400,
          }
        );
      }

      const instituicaoDoLink =
        await prisma.instituicao.findUnique({
          where: {
            slug: slugRecebido,
          },
          select: {
            id: true,
            slug: true,
            ativo: true,
          },
        });

      if (
        !instituicaoDoLink ||
        !instituicaoDoLink.ativo
      ) {
        return NextResponse.json(
          {
            error:
              "A instituição informada não foi encontrada ou está inativa.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        instituicaoDoLink.id !== user.instituicaoId
      ) {
        return NextResponse.json(
          {
            error:
              "Este usuário não pertence à instituição selecionada.",
          },
          {
            status: 403,
          }
        );
      }

      const [funcionario, configuracaoPontoMobile] =
        await Promise.all([
          prisma.funcionario.findFirst({
            where: {
              userId: user.id,
              instituicaoId: user.instituicaoId,
            },
            select: {
              id: true,
              pontoMobileLiberado: true,
              pontoMobileValidoAte: true,
            },
          }),

          prisma.configuracaoPontoMobileRH.findUnique({
            where: {
              instituicaoId: user.instituicaoId,
            },
            select: {
              ativo: true,
            },
          }),
        ]);

      if (!configuracaoPontoMobile?.ativo) {
        return NextResponse.json(
          {
            error:
              "O Ponto Mobile ainda não está ativo nesta instituição.",
          },
          {
            status: 403,
          }
        );
      }

      if (!funcionario) {
        return NextResponse.json(
          {
            error:
              "Este usuário não possui cadastro de funcionário nesta instituição.",
          },
          {
            status: 403,
          }
        );
      }

      if (!funcionario.pontoMobileLiberado) {
        return NextResponse.json(
          {
            error:
              "Seu acesso ao Ponto Mobile ainda não foi liberado pelo RH.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        funcionario.pontoMobileValidoAte &&
        funcionario.pontoMobileValidoAte.getTime() <
        Date.now()
      ) {
        return NextResponse.json(
          {
            error:
              "Sua liberação para o Ponto Mobile expirou. Procure o setor de RH.",
          },
          {
            status: 403,
          }
        );
      }

      funcionarioRhId = funcionario.id;
      instituicaoRhSlug = instituicaoDoLink.slug;
      destinoRh = `/rh-app/${instituicaoDoLink.slug}/ponto`;
    } else {
      if (
        !podeEntrarNoPortal(
          portalNormalizado,
          roleNormalizada
        )
      ) {
        return NextResponse.json(
          {
            error:
              mensagemPortalIncorreto(
                portalNormalizado
              ),
          },
          {
            status: 403,
          }
        );
      }
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não definido");
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: roleNormalizada,
        email: user.email,
        instituicaoId: user.instituicaoId,

        portal: portalNormalizado,

        funcionarioId:
          funcionarioRhId || undefined,

        instituicaoSlug:
          instituicaoRhSlug || undefined,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const response = NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        role: roleNormalizada,

        funcionarioId:
          funcionarioRhId || undefined,

        instituicaoSlug:
          instituicaoRhSlug || undefined,

        precisaTrocarSenha:
          user.precisaTrocarSenha ?? false,
      },

      portal: portalNormalizado,

      destino:
        destinoRh || undefined,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set(
      "phanyx_master_token",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error("ERRO LOGIN:", error);

    return NextResponse.json(
      {
        error: "Erro interno no servidor.",
      },
      {
        status: 500,
      }
    );
  }
}