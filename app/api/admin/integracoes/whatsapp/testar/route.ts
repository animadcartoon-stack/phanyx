import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import crypto from "crypto";
import {
  descriptografarTokenWhatsapp,
} from "@/lib/whatsapp/crypto";

import {
  assinarWebhookWabaMeta,
} from "@/lib/whatsapp/meta";

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
  status?: string;
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

async function testarNumeroMeta(params: {
  phoneNumberId: string;
  accessToken: string;
}) {
  const { phoneNumberId, accessToken } = params;

  const campos = [
    "id",
    "display_phone_number",
    "verified_name",
    "status",
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
      "A Meta retornou uma resposta inválida ao testar a conexão."
    );
  }

  if (!response.ok || data.error) {
    const erro = new Error(
      data.error?.message ||
      "Não foi possível validar a conexão com o WhatsApp Business."
    );

    Object.assign(erro, {
      codigoMeta: data.error?.code,
      subcodigoMeta: data.error?.error_subcode,
      tipoMeta: data.error?.type,
      fbtraceId: data.error?.fbtrace_id,
    });

    throw erro;
  }

  if (!data.id) {
    throw new Error(
      "A Meta não confirmou o Phone Number ID configurado."
    );
  }

  return data;
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
            "Você não possui permissão para testar a integração do WhatsApp.",
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

    if (!integracao.phoneNumberId) {
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

    if (!integracao.whatsappBusinessId) {
      return NextResponse.json(
        {
          error:
            "O WhatsApp Business Account ID não está configurado.",
        },
        {
          status: 409,
        }
      );
    }

    if (!integracao.tokenAcessoCriptografado) {
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

    const segredoCriptografia =
      process.env.CREDENTIALS_ENCRYPTION_KEY;

    const fingerprintCriptografia =
      segredoCriptografia
        ? crypto
          .createHash("sha256")
          .update(segredoCriptografia)
          .digest("hex")
          .substring(0, 12)
          .toUpperCase()
        : "AUSENTE";

    console.log(
      "[WhatsApp] Fingerprint CREDENTIALS_ENCRYPTION_KEY:",
      fingerprintCriptografia
    );

    let accessToken: string;

    try {
      accessToken =
        descriptografarTokenWhatsapp(
          integracao.tokenAcessoCriptografado
        );
    } catch (error) {
      console.error(
        "Erro ao descriptografar token WhatsApp:",
        error
      );

      await prisma.whatsAppInstituicao.update({
        where: {
          instituicaoId,
        },

        data: {
          conectado: false,
          ativo: false,
          webhookAtivo: false,

          ultimaFalhaEm: new Date(),

          ultimaFalhaMensagem:
            "Não foi possível acessar a credencial criptografada da integração.",
        },
      });

      return NextResponse.json(
        {
          error:
            "Não foi possível acessar a credencial salva do WhatsApp.",
        },
        {
          status: 500,
        }
      );
    }

    try {
      const dadosMeta =
        await testarNumeroMeta({
          phoneNumberId:
            integracao.phoneNumberId,

          accessToken,
        });

      /**
       * Confirma a assinatura do aplicativo PHANYX
       * na WABA desta instituição.
       *
       * Só depois da confirmação da Meta
       * consideramos o webhook ativo.
       */
      await assinarWebhookWabaMeta({
        whatsappBusinessId:
          integracao.whatsappBusinessId,

        tokenCriptografado:
          integracao.tokenAcessoCriptografado,
      });

      const agora = new Date();

      const atualizada =
        await prisma.whatsAppInstituicao.update({
          where: {
            instituicaoId,
          },

          data: {
            conectado: true,
            webhookAtivo: true,

            numeroTelefone:
              dadosMeta.display_phone_number ??
              integracao.numeroTelefone,

            numeroExibicao:
              dadosMeta.display_phone_number ??
              integracao.numeroExibicao,

            nomeExibicao:
              dadosMeta.verified_name ??
              integracao.nomeExibicao,

            ultimaSincronizacaoEm: agora,

            ultimaFalhaEm: null,
            ultimaFalhaMensagem: null,
          },

          select: {
            id: true,

            ativo: true,
            conectado: true,

            numeroTelefone: true,
            numeroExibicao: true,
            nomeExibicao: true,

            phoneNumberId: true,

            webhookAtivo: true,

            ultimaSincronizacaoEm: true,
          },
        });

      return NextResponse.json({
        ok: true,

        message:
          "Conexão com o WhatsApp Business validada com sucesso.",

        integracao: atualizada,

        meta: {
          status:
            dadosMeta.status ?? null,

          qualityRating:
            dadosMeta.quality_rating ?? null,

          codeVerificationStatus:
            dadosMeta.code_verification_status ??
            null,
        },
      });
    } catch (error) {
      console.error(
        "Falha no teste da integração WhatsApp:",
        error
      );

      const mensagemErro =
        error instanceof Error
          ? error.message
          : "Não foi possível validar a conexão com a Meta.";

      await prisma.whatsAppInstituicao.update({
        where: {
          instituicaoId,
        },

        data: {
          conectado: false,
          ativo: false,
          webhookAtivo: false,

          ultimaFalhaEm: new Date(),
          ultimaFalhaMensagem: mensagemErro,
        },
      });

      return NextResponse.json(
        {
          ok: false,

          error: mensagemErro,
        },
        {
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error(
      "Erro ao testar integração WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível testar a integração do WhatsApp.",
      },
      {
        status: 500,
      }
    );
  }
}