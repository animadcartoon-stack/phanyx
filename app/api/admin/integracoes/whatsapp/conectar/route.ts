import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import {
  criptografarTokenWhatsapp,
} from "@/lib/whatsapp/crypto";

export const dynamic = "force-dynamic";

const META_GRAPH_VERSION =
  process.env.META_GRAPH_VERSION || "v23.0";

function podeAdministrarWhatsapp(
  role?: string | null
) {
  const papel = String(role || "").toUpperCase();

  return papel === "ADMIN" || papel === "SUPER_ADMIN";
}

type RespostaNumeroMeta = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;

  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function limparTexto(
  valor?: unknown
): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  return texto || null;
}

async function consultarNumeroNaMeta(params: {
  phoneNumberId: string;
  accessToken: string;
}) {
  const { phoneNumberId, accessToken } = params;

  const campos = [
    "id",
    "display_phone_number",
    "verified_name",
    "quality_rating",
    "code_verification_status",
  ].join(",");

  const url =
    `https://graph.facebook.com/${META_GRAPH_VERSION}` +
    `/${encodeURIComponent(phoneNumberId)}` +
    `?fields=${encodeURIComponent(campos)}`;

  const response = await fetch(url, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },

    cache: "no-store",
  });

  let data: RespostaNumeroMeta;

  try {
    data =
      (await response.json()) as RespostaNumeroMeta;
  } catch {
    throw new Error(
      "A Meta retornou uma resposta inválida ao validar o número do WhatsApp."
    );
  }

  if (!response.ok || data.error) {
    const mensagem =
      data.error?.message ||
      "Não foi possível validar as credenciais do WhatsApp na Meta.";

    throw new Error(mensagem);
  }

  if (!data.id) {
    throw new Error(
      "A Meta não confirmou o Phone Number ID informado."
    );
  }

  return data;
}

export async function POST(req: NextRequest) {
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
            "Você não possui permissão para conectar o WhatsApp Business.",
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

    let body: {
      phoneNumberId?: string;
      whatsappBusinessId?: string;
      metaBusinessId?: string;
      accessToken?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
        },
        {
          status: 400,
        }
      );
    }

    const phoneNumberId =
      limparTexto(body.phoneNumberId);

    const whatsappBusinessId =
      limparTexto(body.whatsappBusinessId);

    const metaBusinessId =
      limparTexto(body.metaBusinessId);

    const accessToken =
      limparTexto(body.accessToken);

    if (!phoneNumberId) {
      return NextResponse.json(
        {
          error:
            "Informe o Phone Number ID do WhatsApp Business.",
        },
        {
          status: 400,
        }
      );
    }

    if (!whatsappBusinessId) {
      return NextResponse.json(
        {
          error:
            "Informe o WhatsApp Business Account ID.",
        },
        {
          status: 400,
        }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Informe o Access Token da Meta.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * 1. Antes de salvar qualquer credencial,
     * valida o phoneNumberId + token diretamente na Meta.
     */
    let dadosNumeroMeta: RespostaNumeroMeta;

    try {
      dadosNumeroMeta =
        await consultarNumeroNaMeta({
          phoneNumberId,
          accessToken,
        });
    } catch (error) {
      console.error(
        "Falha ao validar WhatsApp na Meta:",
        error
      );

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível validar as credenciais na Meta.",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * 2. Criptografa o token.
     *
     * O access token em texto puro nunca é salvo.
     */
    const tokenAcessoCriptografado =
      criptografarTokenWhatsapp(accessToken);

    const agora = new Date();

    /**
     * 3. Upsert por instituicaoId.
     *
     * Cada instituição possui no máximo
     * uma integração principal.
     */
    const integracao =
      await prisma.whatsAppInstituicao.upsert({
        where: {
          instituicaoId,
        },

        create: {
          instituicaoId,

          ativo: false,
          conectado: true,

          numeroTelefone:
            dadosNumeroMeta.display_phone_number ??
            null,

          numeroExibicao:
            dadosNumeroMeta.display_phone_number ??
            null,

          nomeExibicao:
            dadosNumeroMeta.verified_name ??
            null,

          phoneNumberId,

          whatsappBusinessId,

          metaBusinessId,

          tokenAcessoCriptografado,

          webhookAtivo: false,

          conectadoEm: agora,
          desconectadoEm: null,

          ultimaSincronizacaoEm: agora,

          ultimaFalhaEm: null,
          ultimaFalhaMensagem: null,
        },

        update: {
          /**
           * Não ativamos automaticamente os
           * envios só porque a conexão foi feita.
           *
           * O administrador poderá ativar depois.
           */
          ativo: false,

          conectado: true,

          numeroTelefone:
            dadosNumeroMeta.display_phone_number ??
            null,

          numeroExibicao:
            dadosNumeroMeta.display_phone_number ??
            null,

          nomeExibicao:
            dadosNumeroMeta.verified_name ??
            null,

          phoneNumberId,

          whatsappBusinessId,

          metaBusinessId,

          tokenAcessoCriptografado,

          conectadoEm: agora,
          desconectadoEm: null,

          ultimaSincronizacaoEm: agora,

          ultimaFalhaEm: null,
          ultimaFalhaMensagem: null,
        },

        select: {
          id: true,

          instituicaoId: true,

          ativo: true,
          conectado: true,

          numeroTelefone: true,
          numeroExibicao: true,
          nomeExibicao: true,

          phoneNumberId: true,
          whatsappBusinessId: true,
          metaBusinessId: true,

          webhookAtivo: true,

          conectadoEm: true,
          ultimaSincronizacaoEm: true,

          criadoEm: true,
          atualizadoEm: true,
        },
      });

    return NextResponse.json({
      ok: true,

      message:
        "WhatsApp Business conectado com sucesso.",

      integracao,

      meta: {
        qualityRating:
          dadosNumeroMeta.quality_rating ?? null,

        codeVerificationStatus:
          dadosNumeroMeta.code_verification_status ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao conectar WhatsApp Business:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível conectar o WhatsApp Business.",
      },
      {
        status: 500,
      }
    );
  }
}