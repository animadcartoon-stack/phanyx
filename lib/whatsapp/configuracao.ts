import { prisma } from "@/lib/prisma";
import { TipoComunicacaoWhatsApp } from "@prisma/client";

export async function obterConfiguracaoWhatsappInstituicao(
  instituicaoId: number
) {
  if (!Number.isFinite(instituicaoId) || instituicaoId <= 0) {
    return null;
  }

  return prisma.whatsAppInstituicao.findUnique({
    where: {
      instituicaoId,
    },
  });
}

export async function whatsappInstituicaoDisponivel(
  instituicaoId: number
): Promise<boolean> {
  const configuracao =
    await obterConfiguracaoWhatsappInstituicao(instituicaoId);

  if (!configuracao) {
    return false;
  }

  return Boolean(
    configuracao.ativo &&
      configuracao.conectado &&
      configuracao.phoneNumberId &&
      configuracao.tokenAcessoCriptografado
  );
}

export async function comunicacaoWhatsappHabilitada(params: {
  instituicaoId: number;
  tipoComunicacao: TipoComunicacaoWhatsApp;
}): Promise<boolean> {
  const { instituicaoId, tipoComunicacao } = params;

  if (!Number.isFinite(instituicaoId) || instituicaoId <= 0) {
    return false;
  }

  const configuracao =
    await prisma.whatsAppConfiguracaoComunicacao.findUnique({
      where: {
        instituicaoId_tipoComunicacao: {
          instituicaoId,
          tipoComunicacao,
        },
      },
      select: {
        ativo: true,
      },
    });

  return configuracao?.ativo === true;
}

export async function podeEnviarWhatsapp(params: {
  instituicaoId: number;
  tipoComunicacao: TipoComunicacaoWhatsApp;
}): Promise<{
  permitido: boolean;
  motivo:
    | "OK"
    | "INSTITUICAO_INVALIDA"
    | "WHATSAPP_NAO_CONFIGURADO"
    | "WHATSAPP_DESATIVADO"
    | "WHATSAPP_DESCONECTADO"
    | "PHONE_NUMBER_ID_AUSENTE"
    | "TOKEN_AUSENTE"
    | "COMUNICACAO_DESATIVADA";
}> {
  const { instituicaoId, tipoComunicacao } = params;

  if (!Number.isFinite(instituicaoId) || instituicaoId <= 0) {
    return {
      permitido: false,
      motivo: "INSTITUICAO_INVALIDA",
    };
  }

  const integracao =
    await obterConfiguracaoWhatsappInstituicao(instituicaoId);

  if (!integracao) {
    return {
      permitido: false,
      motivo: "WHATSAPP_NAO_CONFIGURADO",
    };
  }

  if (!integracao.ativo) {
    return {
      permitido: false,
      motivo: "WHATSAPP_DESATIVADO",
    };
  }

  if (!integracao.conectado) {
    return {
      permitido: false,
      motivo: "WHATSAPP_DESCONECTADO",
    };
  }

  if (!integracao.phoneNumberId) {
    return {
      permitido: false,
      motivo: "PHONE_NUMBER_ID_AUSENTE",
    };
  }

  if (!integracao.tokenAcessoCriptografado) {
    return {
      permitido: false,
      motivo: "TOKEN_AUSENTE",
    };
  }

  const comunicacaoAtiva =
    await comunicacaoWhatsappHabilitada({
      instituicaoId,
      tipoComunicacao,
    });

  if (!comunicacaoAtiva) {
    return {
      permitido: false,
      motivo: "COMUNICACAO_DESATIVADA",
    };
  }

  return {
    permitido: true,
    motivo: "OK",
  };
}