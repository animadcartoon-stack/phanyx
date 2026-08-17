import {
  ResultadoDeduplicacaoCaptacaoLead,
  StatusSubmissaoCaptacaoLead,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  EVENTOS_SAIDA_CAPTACAO,
  enfileirarEventoSaidaCaptacao,
} from "@/lib/comercial/captacao/enfileirar-evento-saida";

type EventoEmitido = {
  tipoEvento: string;
  sucesso: boolean;
  quantidadeEnfileirada: number;
  quantidadeJaExistente: number;
  erro: string | null;
};

export type ResultadoEmissaoEventosSubmissao = {
  submissaoId: number;
  instituicaoId: number;

  quantidadeEventos:
    number;

  quantidadeComSucesso:
    number;

  quantidadeComErro:
    number;

  eventos:
    EventoEmitido[];
};

function idPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return (
    Number.isInteger(numero) &&
    numero > 0
  )
    ? numero
    : null;
}

function mensagemErro(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return error.message.slice(
      0,
      4000
    );
  }

  return "Erro desconhecido.";
}

export async function emitirEventosSaidaSubmissaoCaptacao(
  params: {
    submissaoId: number;
    instituicaoId: number;
  }
): Promise<ResultadoEmissaoEventosSubmissao> {
  const submissaoId =
    idPositivo(
      params.submissaoId
    );

  const instituicaoId =
    idPositivo(
      params.instituicaoId
    );

  if (
    !submissaoId ||
    !instituicaoId
  ) {
    throw new Error(
      "Submissão ou instituição inválida para emissão dos eventos."
    );
  }

  /*
   * Lemos o estado já persistido.
   *
   * A emissão do webhook nunca
   * decide o resultado da captação.
   * Ela apenas reflete o que já foi
   * salvo no banco.
   */
  const submissao =
    await prisma.submissaoCaptacaoLead.findFirst({
      where: {
        id:
          submissaoId,

        instituicaoId,
      },

      select: {
        id: true,

        instituicaoId:
          true,

        canalId:
          true,

        campanhaId:
          true,

        formularioId:
          true,

        integracaoId:
          true,

        leadId:
          true,

        identificadorExterno:
          true,

        status:
          true,

        resultadoDeduplicacao:
          true,

        nomeSnapshot:
          true,

        emailSnapshot:
          true,

        telefoneSnapshot:
          true,

        utmSource:
          true,

        utmMedium:
          true,

        utmCampaign:
          true,

        utmContent:
          true,

        utmTerm:
          true,

        gclid:
          true,

        fbclid:
          true,

        msclkid:
          true,

        paginaOrigem:
          true,

        consentimentoLgpd:
          true,

        consentimentoEm:
          true,

        versaoConsentimento:
          true,

        recebidoEm:
          true,

        processadoEm:
          true,

        codigoErro:
          true,

        mensagemErro:
          true,

        canal: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },

        campanha: {
          select: {
            id: true,
            nome: true,
            codigo: true,
          },
        },

        formulario: {
          select: {
            id: true,
            nome: true,
            titulo: true,
          },
        },

        lead: {
          select: {
            id: true,

            nome: true,
            email: true,
            telefone: true,

            status: true,
            prioridade: true,

            origem: true,
            tipo: true,

            interesse: true,

            cursoInteresseId:
              true,

            poloInteresseId:
              true,

            responsavelFuncionarioId:
              true,

            equipeResponsavelId:
              true,

            funilId:
              true,

            etapaFunilId:
              true,

            proximoContatoEm:
              true,

            primeiroContatoEm:
              true,

            ultimoContatoEm:
              true,

            createdAt:
              true,

            updatedAt:
              true,
          },
        },
      },
    });

  if (!submissao) {
    throw new Error(
      "Submissão não encontrada para emissão dos eventos."
    );
  }

  const payloadBase = {
    submissao: {
      id:
        submissao.id,

      identificadorExterno:
        submissao.identificadorExterno,

      status:
        submissao.status,

      resultadoDeduplicacao:
        submissao.resultadoDeduplicacao,

      recebidoEm:
        submissao.recebidoEm,

      processadoEm:
        submissao.processadoEm,
    },

    captacao: {
      canal:
        submissao.canal,

      campanha:
        submissao.campanha,

      formulario:
        submissao.formulario,

      utm: {
        source:
          submissao.utmSource,

        medium:
          submissao.utmMedium,

        campaign:
          submissao.utmCampaign,

        content:
          submissao.utmContent,

        term:
          submissao.utmTerm,
      },

      clickIds: {
        gclid:
          submissao.gclid,

        fbclid:
          submissao.fbclid,

        msclkid:
          submissao.msclkid,
      },

      paginaOrigem:
        submissao.paginaOrigem,
    },

    contato: {
      nome:
        submissao.nomeSnapshot,

      email:
        submissao.emailSnapshot,

      telefone:
        submissao.telefoneSnapshot,
    },

    lgpd: {
      consentimento:
        submissao.consentimentoLgpd,

      consentimentoEm:
        submissao.consentimentoEm,

      versaoConsentimento:
        submissao.versaoConsentimento,
    },

    lead:
      submissao.lead,
  };

  const eventosDesejados:
    Array<{
      tipoEvento: string;
      chaveEvento: string;
      payload: unknown;
    }> = [];

  /*
   * Submissão processada.
   */
  if (
    submissao.status ===
    StatusSubmissaoCaptacaoLead.PROCESSADA
  ) {
    eventosDesejados.push({
      tipoEvento:
        EVENTOS_SAIDA_CAPTACAO.SUBMISSAO_PROCESSADA,

      chaveEvento:
        `submissao:${submissao.id}`,

      payload:
        payloadBase,
    });
  }

  /*
   * Novo lead criado.
   */
  if (
    submissao.resultadoDeduplicacao ===
      ResultadoDeduplicacaoCaptacaoLead.NOVO_LEAD &&
    submissao.leadId
  ) {
    eventosDesejados.push({
      tipoEvento:
        EVENTOS_SAIDA_CAPTACAO.LEAD_CRIADO,

      chaveEvento:
        `submissao:${submissao.id}:lead:${submissao.leadId}`,

      payload: {
        ...payloadBase,

        eventoNegocio: {
          acao:
            "CRIADO",

          leadId:
            submissao.leadId,
        },
      },
    });
  }

  /*
   * Lead existente atualizado
   * pela nova submissão.
   */
  if (
    submissao.resultadoDeduplicacao ===
      ResultadoDeduplicacaoCaptacaoLead.LEAD_EXISTENTE_ATUALIZADO &&
    submissao.leadId
  ) {
    eventosDesejados.push({
      tipoEvento:
        EVENTOS_SAIDA_CAPTACAO.LEAD_ATUALIZADO,

      chaveEvento:
        `submissao:${submissao.id}:lead:${submissao.leadId}`,

      payload: {
        ...payloadBase,

        eventoNegocio: {
          acao:
            "ATUALIZADO",

          leadId:
            submissao.leadId,
        },
      },
    });
  }

  /*
   * Submissão duplicada.
   */
  if (
    submissao.status ===
      StatusSubmissaoCaptacaoLead.DUPLICADA ||
    submissao.resultadoDeduplicacao ===
      ResultadoDeduplicacaoCaptacaoLead.DUPLICADA_IGNORADA
  ) {
    eventosDesejados.push({
      tipoEvento:
        EVENTOS_SAIDA_CAPTACAO.SUBMISSAO_DUPLICADA,

      chaveEvento:
        `submissao:${submissao.id}`,

      payload:
        payloadBase,
    });
  }

  /*
   * Rejeições de negócio/validação
   * também podem ser úteis para
   * CRMs ou sistemas externos.
   */
  if (
    submissao.status ===
    StatusSubmissaoCaptacaoLead.REJEITADA
  ) {
    eventosDesejados.push({
      tipoEvento:
        EVENTOS_SAIDA_CAPTACAO.SUBMISSAO_REJEITADA,

      chaveEvento:
        `submissao:${submissao.id}`,

      payload: {
        ...payloadBase,

        erro: {
          codigo:
            submissao.codigoErro,

          mensagem:
            submissao.mensagemErro,
        },
      },
    });
  }

  const eventos:
    EventoEmitido[] =
      [];

  /*
   * Uma integração externa com
   * problema nunca poderá desfazer
   * ou invalidar o processamento
   * do lead.
   *
   * Por isso tratamos cada emissão
   * isoladamente.
   */
  for (
    const evento of
    eventosDesejados
  ) {
    try {
      const resultado =
        await enfileirarEventoSaidaCaptacao({
          instituicaoId,

          submissaoId:
            submissao.id,

          tipoEvento:
            evento.tipoEvento,

          chaveEvento:
            evento.chaveEvento,

          payload:
            evento.payload,
        });

      eventos.push({
        tipoEvento:
          evento.tipoEvento,

        sucesso:
          true,

        quantidadeEnfileirada:
          resultado.quantidadeEnfileirada,

        quantidadeJaExistente:
          resultado.quantidadeJaExistente,

        erro:
          null,
      });
    } catch (error) {
      /*
       * Não relançamos.
       *
       * Captar e processar o lead é
       * mais importante que uma
       * integração de saída.
       */
      console.error(
        `Erro ao enfileirar evento ${evento.tipoEvento} da submissão ${submissao.id}:`,
        error
      );

      eventos.push({
        tipoEvento:
          evento.tipoEvento,

        sucesso:
          false,

        quantidadeEnfileirada:
          0,

        quantidadeJaExistente:
          0,

        erro:
          mensagemErro(
            error
          ),
      });
    }
  }

  return {
    submissaoId:
      submissao.id,

    instituicaoId,

    quantidadeEventos:
      eventos.length,

    quantidadeComSucesso:
      eventos.filter(
        (evento) =>
          evento.sucesso
      ).length,

    quantidadeComErro:
      eventos.filter(
        (evento) =>
          !evento.sucesso
      ).length,

    eventos,
  };
}

/*
 * Versão "fire and forget seguro"
 * para uso dentro do processador
 * central.
 *
 * Ela nunca lança erro para quem
 * processou o lead.
 */
export async function emitirEventosSaidaSubmissaoCaptacaoSeguro(
  params: {
    submissaoId: number;
    instituicaoId: number;
  }
) {
  try {
    return await emitirEventosSaidaSubmissaoCaptacao(
      params
    );
  } catch (error) {
    console.error(
      `Erro geral na emissão dos eventos da submissão ${params.submissaoId}:`,
      error
    );

    return null;
  }
}