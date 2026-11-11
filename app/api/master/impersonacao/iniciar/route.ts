import {
  NextRequest,
  NextResponse,
} from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  masterPodeImpersonar,
  portalDestinoPorRole,
  verificarSessaoOriginalMaster,
} from "@/lib/impersonacao-suporte";
import { COOKIE_MASTER_SUPORTE } from "@/lib/sessao-suporte-cookie";

export async function POST(req: NextRequest) {
  try {
    const master = await getUserFromToken();

    if (!master || !masterPodeImpersonar(master)) {
      return NextResponse.json(
        {
          error:
            "Somente o suporte Master pode iniciar este acesso.",
        },
        {
          status: 403,
        }
      );
    }

    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
      throw new Error("JWT_SECRET não definido.");
    }

    const body = await req.json();

    const usuarioAlvoId = Number(
      body?.usuarioAlvoId
    );

    const motivo = String(body?.motivo || "")
      .trim()
      .slice(0, 1000);

    if (
      !Number.isFinite(usuarioAlvoId) ||
      usuarioAlvoId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Usuário de destino inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (motivo.length < 5) {
      return NextResponse.json(
        {
          error:
            "Informe o motivo do atendimento com pelo menos 5 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    const cookieStore = await cookies();
    const tokenMaster =
      cookieStore.get("token")?.value;

    const sessaoMaster = verificarSessaoOriginalMaster(tokenMaster, segredo);

    if (!tokenMaster || !sessaoMaster || sessaoMaster.id !== master.id) {
      return NextResponse.json(
        {
          error:
            "A sessão Master não foi encontrada.",
        },
        {
          status: 401,
        }
      );
    }

    const usuarioAlvo =
      await prisma.user.findUnique({
        where: {
          id: usuarioAlvoId,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true,
          isMasterAdmin: true,
          instituicaoId: true,
          instituicao: {
            select: {
              id: true,
              nome: true,
              slug: true,
              ativo: true,
            },
          },
        },
      });

    if (!usuarioAlvo) {
      return NextResponse.json(
        {
          error: "Usuário não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (usuarioAlvo.id === master.id) {
      return NextResponse.json(
        {
          error:
            "Não é possível iniciar suporte na própria conta Master.",
        },
        {
          status: 400,
        }
      );
    }

    if (usuarioAlvo.isMasterAdmin) {
      return NextResponse.json(
        {
          error:
            "Não é permitido acessar outra conta Master.",
        },
        {
          status: 403,
        }
      );
    }

    if (usuarioAlvo.ativo === false) {
      return NextResponse.json(
        {
          error:
            "A conta deste usuário está inativa.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !usuarioAlvo.instituicaoId ||
      !usuarioAlvo.instituicao
    ) {
      return NextResponse.json(
        {
          error:
            "Este usuário não possui instituição vinculada.",
        },
        {
          status: 400,
        }
      );
    }

    const configuracaoPortal =
      portalDestinoPorRole(usuarioAlvo.role);

    if (!configuracaoPortal) {
      return NextResponse.json(
        {
          error:
            "O perfil deste usuário não possui portal compatível.",
        },
        {
          status: 400,
        }
      );
    }

    const agora = new Date();
    const expiraEm = new Date(sessaoMaster.exp * 1000);
    const vinculoSessaoMaster = createHash("sha256").update(tokenMaster).digest("hex");

    const ipEncaminhado =
      req.headers.get("x-forwarded-for");

    const ip =
      ipEncaminhado?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const userAgent =
      req.headers.get("user-agent") || null;

    await prisma.impersonacaoSuporte.updateMany({
      where: {
        masterUserId: master.id,
        ativa: true,
        encerradoEm: null,
      },
      data: {
        ativa: false,
        encerradoEm: agora,
      },
    });

    const registro =
      await prisma.impersonacaoSuporte.create({
        data: {
          masterUserId: master.id,
          usuarioAlvoId: usuarioAlvo.id,
          instituicaoId:
            usuarioAlvo.instituicaoId,

          masterEmailSnapshot:
            master.email,

          usuarioAlvoEmailSnapshot:
            usuarioAlvo.email,

          usuarioAlvoNomeSnapshot:
            usuarioAlvo.nome ||
            usuarioAlvo.email,

          instituicaoNomeSnapshot:
            usuarioAlvo.instituicao.nome,

          motivo,
          portal: configuracaoPortal.portal,

          iniciadoEm: agora,
          expiraEm,
          ativa: true,

          ip,
          userAgent,
        },
      });

    const roleNormalizada = String(
      usuarioAlvo.role || ""
    )
      .trim()
      .toLowerCase();

    const tokenImpersonacao = jwt.sign(
      {
        id: usuarioAlvo.id,
        nome: usuarioAlvo.nome,
        email: usuarioAlvo.email,
        role: roleNormalizada,
        instituicaoId:
          usuarioAlvo.instituicaoId,

        portal: configuracaoPortal.portal,

        impersonacao: true,
        impersonacaoId: registro.id,
        masterOriginalId: master.id,
        vinculoSessaoMaster,
        exp: sessaoMaster.exp,
      },
      segredo
    );

    const response = NextResponse.json({
      sucesso: true,
      destino: configuracaoPortal.destino,
      expiraEm: expiraEm.toISOString(),
      usuario: {
        id: usuarioAlvo.id,
        nome: usuarioAlvo.nome,
        email: usuarioAlvo.email,
        role: usuarioAlvo.role,
        instituicao:
          usuarioAlvo.instituicao.nome,
      },
    });

    response.cookies.set(
      COOKIE_MASTER_SUPORTE,
      tokenMaster,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        expires: expiraEm,
      }
    );

    
    response.cookies.set(
      "token",
      tokenImpersonacao,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        expires: expiraEm,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Erro ao iniciar impersonação:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível iniciar o acesso de suporte.",
      },
      {
        status: 500,
      }
    );
  }
}
