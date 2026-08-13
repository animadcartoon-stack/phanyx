import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function podeAdministrarWhatsapp(
  role?: string | null
) {
  const papel = String(role || "").toUpperCase();

  return papel === "ADMIN" || papel === "SUPER_ADMIN";
}

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    if (!podeAdministrarWhatsapp(user.role)) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para desconectar o WhatsApp Business.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isFinite(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Instituição inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const integracao =
      await prisma.whatsAppInstituicao.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          id: true,
          conectado: true,
        },
      });

    if (!integracao) {
      return NextResponse.json(
        {
          error:
            "O WhatsApp ainda não foi configurado para esta instituição.",
        },
        {
          status: 404,
        }
      );
    }

    if (!integracao.conectado) {
      return NextResponse.json({
        ok: true,
        message:
          "O WhatsApp Business já está desconectado.",
      });
    }

    const agora = new Date();

    await prisma.whatsAppInstituicao.update({
      where: {
        instituicaoId,
      },

      data: {
        ativo: false,
        conectado: false,

        webhookAtivo: false,

        desconectadoEm: agora,

        ultimaSincronizacaoEm: agora,
      },
    });

    return NextResponse.json({
      ok: true,

      message:
        "WhatsApp Business desconectado com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao desconectar WhatsApp Business:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível desconectar o WhatsApp Business.",
      },
      {
        status: 500,
      }
    );
  }
}