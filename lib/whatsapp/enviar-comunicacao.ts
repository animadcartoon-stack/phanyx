import {
  Prisma,
  StatusWhatsAppMensagem,
  TipoComunicacaoWhatsApp,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  obterConfiguracaoWhatsappInstituicao,
  podeEnviarWhatsapp,
} from "@/lib/whatsapp/configuracao";

import {
  normalizarTelefoneWhatsappBrasil,
} from "@/lib/whatsapp/telefone";

import {
  enviarTemplateWhatsappMeta,
  ErroMetaWhatsapp,
} from "@/lib/whatsapp/meta";

type ComponenteTemplateWhatsapp = {
  type: "header" | "body" | "button";
  sub_type?: string;
  index?: string;
  parameters?: Array<Record<string, unknown>>;
};

type EnviarComunicacaoWhatsappParams = {
  instituicaoId: number;

  usuarioId?: number | null;

  tipoComunicacao: TipoComunicacaoWhatsApp;

  chaveIdempotencia?: string | null;

  telefone?: string | null;
  nomeDestinatario?: string | null;

  componentes?: ComponenteTemplateWhatsapp[];

  parametros?: Record<string, unknown>;
  modoTesteAdministrativo?: boolean;
};

export type ResultadoEnvioComunicacaoWhatsapp =
  | {
    enviado: true;
    ignorado: false;
    mensagemId: number;
    metaMessageId: string;
  }
  | {
    enviado: false;
    ignorado: true;
    motivo:
    | "INSTITUICAO_INVALIDA"
    | "WHATSAPP_NAO_CONFIGURADO"
    | "WHATSAPP_DESATIVADO"
    | "WHATSAPP_DESCONECTADO"
    | "PHONE_NUMBER_ID_AUSENTE"
    | "TOKEN_AUSENTE"
    | "COMUNICACAO_DESATIVADA"
    | "TELEFONE_AUSENTE"
    | "TELEFONE_INVALIDO"
    | "TEMPLATE_NAO_CONFIGURADO"
    | "TEMPLATE_META_NAO_CONFIGURADO"
    | "TEMPLATE_NAO_APROVADO_META"
    | "COMUNICACAO_DUPLICADA";
  }
  | {
    enviado: false;
    ignorado: false;
    mensagemId: number;
    motivo: "ERRO_ENVIO";
    erro: string;
  };

function mensagemErroSegura(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido ao enviar mensagem pelo WhatsApp.";
}

export async function enviarComunicacaoWhatsapp(
  params: EnviarComunicacaoWhatsappParams
): Promise<ResultadoEnvioComunicacaoWhatsapp> {
  const {
    instituicaoId,
    usuarioId,
    tipoComunicacao,
    chaveIdempotencia,
    telefone,
    nomeDestinatario,
    componentes = [],
    parametros,
    modoTesteAdministrativo = false,
  } = params;

  /**
   * 1. Verifica se a instituição está autorizada a enviar
   * este tipo de comunicação.
   *
   * Importante:
   * WhatsApp é complementar.
   * Se estiver desabilitado ou desconectado, o restante do
   * PHANYX não deve falhar.
   */
  if (!modoTesteAdministrativo) {
    const permissao =
      await podeEnviarWhatsapp({
        instituicaoId,
        tipoComunicacao,
      });

    if (!permissao.permitido) {
      const motivo = permissao.motivo;

      if (motivo === "OK") {
        return {
          enviado: false,
          ignorado: true,
          motivo:
            "WHATSAPP_NAO_CONFIGURADO",
        };
      }

      return {
        enviado: false,
        ignorado: true,
        motivo,
      };
    }
  }

  /**
   * 2. Obtém a integração da instituição.
   */
  const integracao =
    await obterConfiguracaoWhatsappInstituicao(instituicaoId);

  if (!integracao) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "WHATSAPP_NAO_CONFIGURADO",
    };
  }

  if (!integracao.conectado) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "WHATSAPP_DESCONECTADO",
    };
  }

  if (!integracao.phoneNumberId) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "PHONE_NUMBER_ID_AUSENTE",
    };
  }

  if (!integracao.tokenAcessoCriptografado) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "TOKEN_AUSENTE",
    };
  }

  /**
   * 3. Valida e normaliza o telefone.
   */
  if (!telefone) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "TELEFONE_AUSENTE",
    };
  }

  const telefoneNormalizado =
    normalizarTelefoneWhatsappBrasil(telefone);

  if (!telefoneNormalizado) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "TELEFONE_INVALIDO",
    };
  }

  /**
   * 4. Procura o template ativo para este tipo de comunicação.
   *
   * Tudo é filtrado por instituicaoId para preservar
   * o isolamento multi-tenant do PHANYX.
   */
  const template = await prisma.whatsAppTemplate.findFirst({
    where: {
      instituicaoId,
      tipoComunicacao,
      ativo: true,
      OR: [
        {
          whatsappInstituicaoId: integracao.id,
        },
        {
          whatsappInstituicaoId: null,
        },
      ],
    },

    orderBy: [
      {
        whatsappInstituicaoId: "desc",
      },
      {
        atualizadoEm: "desc",
      },
    ],
  });

  if (!template) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "TEMPLATE_NAO_CONFIGURADO",
    };
  }

  /**
   * Para mensagens iniciadas pelo PHANYX utilizaremos
   * o nome do template cadastrado/aprovado na Meta.
   */
  if (!template.nomeMeta) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "TEMPLATE_META_NAO_CONFIGURADO",
    };
  }

  /**
   * O template precisa estar aprovado pela Meta antes
   * que o PHANYX tente utilizá-lo em um disparo real.
   */
  if (!template.aprovadoMeta) {
    return {
      enviado: false,
      ignorado: true,
      motivo: "TEMPLATE_NAO_APROVADO_META",
    };
  }

  /**
  * 5. Proteção de idempotência.
  *
  * A chave representa um evento único do PHANYX.
  * Se ele já tiver originado uma mensagem, não tentamos
  * enviá-lo novamente.
  */
  const chaveIdempotenciaNormalizada =
    chaveIdempotencia?.trim() || null;

  if (chaveIdempotenciaNormalizada) {
    const mensagemExistente =
      await prisma.whatsAppMensagem.findUnique({
        where: {
          chaveIdempotencia:
            chaveIdempotenciaNormalizada,
        },
        select: {
          id: true,
        },
      });

    if (mensagemExistente) {
      return {
        enviado: false,
        ignorado: true,
        motivo: "COMUNICACAO_DUPLICADA",
      };
    }
  }

  /**
   * 5. Cria o registro antes de falar com a Meta.
   *
   * Assim conseguimos auditar toda tentativa real de envio.
   */
  let mensagem;

  try {
    mensagem = await prisma.whatsAppMensagem.create({
      data: {
        instituicaoId,
        whatsappInstituicaoId: integracao.id,
        templateId: template.id,
        usuarioId: usuarioId ?? null,

        tipoComunicacao,

        chaveIdempotencia:
          chaveIdempotenciaNormalizada,

        status: StatusWhatsAppMensagem.PENDENTE,

        telefoneDestinatario:
          telefoneNormalizado,

        nomeDestinatario:
          nomeDestinatario?.trim() || null,

        mensagem: template.corpo,

        parametros:
          parametros ?? undefined,

        tentativa: 0,
      },
    });
  } catch (error) {
    /**
     * Mesmo que duas execuções cheguem exatamente
     * ao mesmo tempo, o índice UNIQUE do banco
     * garante que apenas uma delas consiga criar
     * a mensagem.
     */
    if (
      chaveIdempotenciaNormalizada &&
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        enviado: false,
        ignorado: true,
        motivo: "COMUNICACAO_DUPLICADA",
      };
    }

    throw error;
  }

  try {
    /**
     * 6. Marca como PROCESSANDO.
     */
    await prisma.whatsAppMensagem.update({
      where: {
        id: mensagem.id,
      },
      data: {
        status: StatusWhatsAppMensagem.PROCESSANDO,
        processadaEm: new Date(),
        tentativa: {
          increment: 1,
        },
      },
    });

    /**
     * 7. Envia para a Meta Cloud API.
     */
    const resultadoMeta =
      await enviarTemplateWhatsappMeta({
        phoneNumberId: integracao.phoneNumberId!,
        tokenCriptografado:
          integracao.tokenAcessoCriptografado!,

        telefoneDestino: telefoneNormalizado,

        templateNome: template.nomeMeta,

        idioma: template.idioma || "pt_BR",

        componentes,
      });

    const agora = new Date();

    /**
     * 8. Atualiza a mensagem com o ID devolvido pela Meta.
     */
    await prisma.whatsAppMensagem.update({
      where: {
        id: mensagem.id,
      },
      data: {
        status: StatusWhatsAppMensagem.ENVIADA,

        metaMessageId: resultadoMeta.metaMessageId,

        enviadaEm: agora,

        erroCodigo: null,
        erroMensagem: null,
      },
    });

    /**
     * 9. Registra o evento no histórico.
     */
    await prisma.whatsAppMensagemEvento.create({
      data: {
        mensagemId: mensagem.id,

        status: StatusWhatsAppMensagem.ENVIADA,

        payload: {
          metaMessageId:
            resultadoMeta.metaMessageId,

          waId:
            resultadoMeta.waId ?? null,

          statusInicial:
            resultadoMeta.statusInicial ?? null,
        },
      },
    });

    return {
      enviado: true,
      ignorado: false,
      mensagemId: mensagem.id,
      metaMessageId: resultadoMeta.metaMessageId,
    };
  } catch (error) {
    const agora = new Date();

    const erroMensagem =
      mensagemErroSegura(error);

    let erroCodigo: string | null = null;

    const payloadEvento: Record<string, unknown> = {
      mensagem: erroMensagem,
    };

    /**
     * Erro conhecido retornado pela Meta.
     */
    if (error instanceof ErroMetaWhatsapp) {
      erroCodigo =
        error.codigoMeta != null
          ? String(error.codigoMeta)
          : String(error.statusHttp);

      payloadEvento.statusHttp =
        error.statusHttp;

      payloadEvento.codigoMeta =
        error.codigoMeta ?? null;

      payloadEvento.subcodigoMeta =
        error.subcodigoMeta ?? null;

      payloadEvento.tipoMeta =
        error.tipoMeta ?? null;

      payloadEvento.fbtraceId =
        error.fbtraceId ?? null;
    }

    /**
     * 10. A falha também fica registrada.
     */
    await prisma.$transaction([
      prisma.whatsAppMensagem.update({
        where: {
          id: mensagem.id,
        },
        data: {
          status: StatusWhatsAppMensagem.FALHOU,

          falhouEm: agora,

          erroCodigo,

          erroMensagem,
        },
      }),

      prisma.whatsAppMensagemEvento.create({
        data: {
          mensagemId: mensagem.id,

          status: StatusWhatsAppMensagem.FALHOU,

          payload: payloadEvento,
        },
      }),
    ]);

    /**
     * Não lançamos o erro novamente.
     *
     * Uma falha do WhatsApp não pode impedir, por exemplo,
     * que uma reunião seja criada ou que uma resposta da
     * Ouvidoria seja salva.
     */
    return {
      enviado: false,
      ignorado: false,

      mensagemId: mensagem.id,

      motivo: "ERRO_ENVIO",

      erro: erroMensagem,
    };
  }
}