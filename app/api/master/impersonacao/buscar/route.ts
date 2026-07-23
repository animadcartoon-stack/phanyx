import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  masterPodeImpersonar,
  portalDestinoPorRole,
} from "@/lib/impersonacao-suporte";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const master = await getUserFromToken();

    if (!masterPodeImpersonar(master)) {
      return NextResponse.json(
        {
          error:
            "Somente o suporte Master pode utilizar este recurso.",
        },
        {
          status: 403,
        }
      );
    }

    const email = String(
      req.nextUrl.searchParams.get("email") || ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          error: "Informe o e-mail do usuário.",
        },
        {
          status: 400,
        }
      );
    }

    const usuario = await prisma.user.findUnique({
      where: {
        email,
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

    if (!usuario) {
      return NextResponse.json(
        {
          error:
            "Nenhum usuário foi encontrado com esse e-mail.",
        },
        {
          status: 404,
        }
      );
    }

    if (usuario.id === master!.id) {
      return NextResponse.json(
        {
          error:
            "Você já está autenticada como este usuário.",
        },
        {
          status: 400,
        }
      );
    }

    if (usuario.isMasterAdmin) {
      return NextResponse.json(
        {
          error:
            "Não é permitido impersonar outra conta Master.",
        },
        {
          status: 403,
        }
      );
    }

    const destino = portalDestinoPorRole(
      usuario.role
    );

    if (!destino) {
      return NextResponse.json(
        {
          error:
            "O perfil deste usuário ainda não possui um portal compatível com o modo suporte.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
        instituicaoId: usuario.instituicaoId,
        instituicao: usuario.instituicao,
        portal: destino.portal,
        destino: destino.destino,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar usuário para impersonação:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível buscar o usuário.",
      },
      {
        status: 500,
      }
    );
  }
}