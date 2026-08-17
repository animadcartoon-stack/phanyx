import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  ErroMetaWhatsapp,
  enviarTemplateWhatsappMeta,
} from "@/lib/whatsapp/meta";

export const dynamic = "force-dynamic";

function podeAdministrarWhatsapp(
  role?: string | null
) {
  const papel =
    String(role || "").toUpperCase();

  return (
    papel === "ADMIN" ||
    papel === "SUPER_ADMIN"
  );
}

function normalizarTelefone(
  valor: unknown
): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const telefone =
    valor.replace(/\D/g, "");

  if (
    telefone.length < 10 ||
    telefone.length > 15
  ) {
    return null;
  }

  return telefone;
}

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

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

    if (
      !podeAdministrarWhatsapp(
        user.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para enviar uma mensagem de teste pelo WhatsApp.",
        },
        {
          status: 403,
        }
      );
    }

    const instituicaoId =
      Number(
        user.instituicaoId
      );

    if (
      !Number.isFinite(
        instituicaoId
      ) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Instituição inválida.",
        },
        {
          status: 400,
        }
      );
    }

    let body: {
      telefone?: string;
    };

    try {
      body =
        await req.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Dados inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const telefoneDestino =
      normalizarTelefone(
        body.telefone
      );

    if (!telefoneDestino) {
      return NextResponse.json(
        {
          error:
            "Informe um telefone válido com DDI, DDD e número.",
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
          conectado: true,
          phoneNumberId: true,
          tokenAcessoCriptografado:
            true,
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
      return NextResponse.json(
        {
          error:
            "A integração do WhatsApp não está conectada.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !integracao.phoneNumberId
    ) {
      return NextResponse.json(
        {
          error:
            "O Phone Number ID do WhatsApp não está configurado.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !integracao
        .tokenAcessoCriptografado
    ) {
      return NextResponse.json(
        {
          error:
            "A credencial do WhatsApp não está configurada.",
        },
        {
          status: 409,
        }
      );
    }

    const resultado =
      await enviarTemplateWhatsappMeta({
        phoneNumberId:
          integracao.phoneNumberId,

        tokenCriptografado:
          integracao
            .tokenAcessoCriptografado,

        telefoneDestino,

        templateNome:
          "hello_world",

        idioma:
          "en_US",
      });

    return NextResponse.json({
      ok: true,

      message:
        "Mensagem de teste enviada ao WhatsApp.",

      metaMessageId:
        resultado.metaMessageId,

      waId:
        resultado.waId ?? null,

      statusInicial:
        resultado.statusInicial ??
        null,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar mensagem de teste pelo WhatsApp:",
      error
    );

    if (
      error instanceof
      ErroMetaWhatsapp
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            error.message,

          codigoMeta:
            error.codigoMeta ??
            null,

          subcodigoMeta:
            error.subcodigoMeta ??
            null,
        },
        {
          status:
            error.statusHttp >=
              400 &&
            error.statusHttp < 500
              ? 400
              : 502,
        }
      );
    }

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a mensagem de teste.",
      },
      {
        status: 500,
      }
    );
  }
}