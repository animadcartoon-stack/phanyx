import {
  CategoriaEtapaFunilComercial,
  OrigemMovimentacaoFunilComercial,
  PrioridadeTarefaComercial,
  Prisma,
  ResultadoEtapaFunilComercial,
  StatusMatricula,
  StatusTarefaComercial,
  TipoTarefaComercial,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  EVENTOS_SAIDA_CAPTACAO,
  enfileirarEventoSaidaCaptacaoSeguro,
} from "@/lib/comercial/captacao/enfileirar-evento-saida";

const STATUS_MATRICULA_CONVERTIDA =
  new Set<StatusMatricula>([
    StatusMatricula.ATIVA,
    StatusMatricula.A_INICIAR,
    StatusMatricula.CONCLUIDA,
  ]);

export class ErroMovimentacaoLead
  extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);

    this.name = "ErroMovimentacaoLead";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export type ProximaAcaoMovimentacao = {
  tipo: TipoTarefaComercial;
  titulo?: string | null;
  descricao?: string | null;
  prioridade?: PrioridadeTarefaComercial;
  agendadaPara: Date;
  prazoEm?: Date | null;
  lembreteEm?: Date | null;
  responsavelFuncionarioId?: number | null;
};

export type MovimentarLeadNoFunilInput = {
  instituicaoId: number;
  leadId: number;
  etapaNovaId: number;
  usuarioId: number;

  origem?:
    OrigemMovimentacaoFunilComercial;

  motivo?: string | null;
  motivoPerdaId?: number | null;
  motivoPerdaObservacao?: string | null;
  proximaAcao?: ProximaAcaoMovimentacao | null;
};

function textoOuNull(
  valor: unknown
) {
  const texto = String(
    valor ?? ""
  ).trim();

  return texto || null;
}

function statusLegadoDaEtapa(
  categoria:
    CategoriaEtapaFunilComercial,
  resultado:
    ResultadoEtapaFunilComercial
) {
  if (
    resultado ===
    ResultadoEtapaFunilComercial.GANHA
  ) {
    return "FECHADO";
  }

  if (
    resultado ===
      ResultadoEtapaFunilComercial.PERDIDA ||
    resultado ===
      ResultadoEtapaFunilComercial.DESCARTADA
  ) {
    return "PERDIDO";
  }

  switch (categoria) {
    case CategoriaEtapaFunilComercial.ENTRADA:
      return "NOVO";

    case CategoriaEtapaFunilComercial.PRIMEIRO_CONTATO:
    case CategoriaEtapaFunilComercial.EM_ATENDIMENTO:
    case CategoriaEtapaFunilComercial.QUALIFICACAO:
    case CategoriaEtapaFunilComercial.APRESENTACAO:
    case CategoriaEtapaFunilComercial.PAUSA:
      return "CONTATO";

    case CategoriaEtapaFunilComercial.PROPOSTA:
    case CategoriaEtapaFunilComercial.NEGOCIACAO:
    case CategoriaEtapaFunilComercial.DOCUMENTACAO:
    case CategoriaEtapaFunilComercial.PAGAMENTO:
    case CategoriaEtapaFunilComercial.CONVERSAO:
      return "PROPOSTA";

    case CategoriaEtapaFunilComercial.PERDA:
    case CategoriaEtapaFunilComercial.DESCARTE:
      return "PERDIDO";

    default:
      return "CONTATO";
  }
}

function etapaRepresentaPerda(
  resultado:
    ResultadoEtapaFunilComercial
) {
  return (
    resultado ===
      ResultadoEtapaFunilComercial.PERDIDA ||
    resultado ===
      ResultadoEtapaFunilComercial.DESCARTADA
  );
}

function etapaRepresentaEncerramento(
  resultado:
    ResultadoEtapaFunilComercial
) {
  return (
    resultado !==
    ResultadoEtapaFunilComercial.ABERTA
  );
}

function etapaRegistraPrimeiroContato(
  categoria: CategoriaEtapaFunilComercial
) {
  const categoriasComContato:
    CategoriaEtapaFunilComercial[] = [
      CategoriaEtapaFunilComercial.EM_ATENDIMENTO,
      CategoriaEtapaFunilComercial.QUALIFICACAO,
      CategoriaEtapaFunilComercial.APRESENTACAO,
      CategoriaEtapaFunilComercial.PROPOSTA,
      CategoriaEtapaFunilComercial.NEGOCIACAO,
      CategoriaEtapaFunilComercial.DOCUMENTACAO,
      CategoriaEtapaFunilComercial.PAGAMENTO,
      CategoriaEtapaFunilComercial.CONVERSAO,
    ];

  return categoriasComContato.includes(
    categoria
  );
}

function minutosEntre(
  inicio: Date | null,
  fim: Date
) {
  if (!inicio) {
    return null;
  }

  const diferenca =
    fim.getTime() -
    inicio.getTime();

  return Math.max(
    0,
    Math.floor(
      diferenca / 60_000
    )
  );
}

function dataValida(
  data: Date | null | undefined
) {
  return (
    data instanceof Date &&
    !Number.isNaN(data.getTime())
  );
}

export async function movimentarLeadNoFunil(
  input: MovimentarLeadNoFunilInput
) {
  const {
    instituicaoId,
    leadId,
    etapaNovaId,
    usuarioId,
  } = input;

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new ErroMovimentacaoLead(
      400,
      "Instituição inválida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  if (
    !Number.isInteger(leadId) ||
    leadId <= 0
  ) {
    throw new ErroMovimentacaoLead(
      400,
      "Lead inválido.",
      "LEAD_INVALIDO"
    );
  }

  if (
    !Number.isInteger(etapaNovaId) ||
    etapaNovaId <= 0
  ) {
    throw new ErroMovimentacaoLead(
      400,
      "Etapa de destino inválida.",
      "ETAPA_INVALIDA"
    );
  }

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    throw new ErroMovimentacaoLead(
      400,
      "Usuário responsável inválido.",
      "USUARIO_INVALIDO"
    );
  }

  const resultado =
  await prisma.$transaction(
    async (tx) => {
      const agora = new Date();

      const [
        usuario,
        lead,
        etapaNova,
      ] = await Promise.all([
        tx.user.findFirst({
          where: {
            id: usuarioId,
            instituicaoId,
          },
          select: {
            id: true,
            nome: true,
          },
        }),

        tx.lead.findFirst({
          where: {
            id: leadId,
            instituicaoGestoraId:
              instituicaoId,
            tipo: "INSTITUICAO",
          },
          select: {
            id: true,
            nome: true,
            funilId: true,
            etapaFunilId: true,
            responsavelFuncionarioId:
              true,
            entrouEtapaEm: true,
            primeiroContatoEm: true,
            qualificadoEm: true,
            arquivadoEm: true,
            createdAt: true,
            updatedAt: true,

            matriculaConvertida: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        }),

        tx.etapaFunilComercial.findFirst({
          where: {
            id: etapaNovaId,
            instituicaoId,
            ativo: true,
          },
          select: {
            id: true,
            funilId: true,
            nome: true,
            categoria: true,
            resultado: true,
            exigeProximaAcao: true,
            exigeMotivoPerda: true,
            permiteMovimentoManual: true,
          },
        }),
      ]);

      if (!usuario) {
        throw new ErroMovimentacaoLead(
          403,
          "O usuário responsável não pertence à instituição.",
          "USUARIO_FORA_DA_INSTITUICAO"
        );
      }

      if (!lead) {
        throw new ErroMovimentacaoLead(
          404,
          "Lead não encontrado.",
          "LEAD_NAO_ENCONTRADO"
        );
      }

      if (lead.arquivadoEm) {
        throw new ErroMovimentacaoLead(
          409,
          "Um lead arquivado não pode ser movimentado.",
          "LEAD_ARQUIVADO"
        );
      }

      if (!etapaNova) {
        throw new ErroMovimentacaoLead(
          404,
          "A etapa de destino não foi encontrada.",
          "ETAPA_NAO_ENCONTRADA"
        );
      }

      if (
        lead.etapaFunilId ===
        etapaNova.id
      ) {
        throw new ErroMovimentacaoLead(
          409,
          "O lead já está nesta etapa.",
          "LEAD_JA_NA_ETAPA"
        );
      }

      if (
        lead.funilId &&
        lead.funilId !==
          etapaNova.funilId
      ) {
        throw new ErroMovimentacaoLead(
          409,
          "A etapa não pertence ao funil atual do lead.",
          "ETAPA_FORA_DO_FUNIL"
        );
      }

      const funil =
        await tx.funilComercial.findFirst({
          where: {
            id: etapaNova.funilId,
            instituicaoId,
            ativo: true,
          },
          select: {
            id: true,
            nome: true,
          },
        });

      if (!funil) {
        throw new ErroMovimentacaoLead(
          409,
          "O funil comercial da etapa não está ativo.",
          "FUNIL_INATIVO"
        );
      }

      const origemSolicitada =
        input.origem ??
        OrigemMovimentacaoFunilComercial.MANUAL;

      if (
        origemSolicitada ===
          OrigemMovimentacaoFunilComercial.MANUAL &&
        !etapaNova.permiteMovimentoManual
      ) {
        throw new ErroMovimentacaoLead(
          409,
          "Esta etapa é controlada automaticamente pelo sistema.",
          "ETAPA_AUTOMATICA"
        );
      }

      const matriculaValida =
        Boolean(
          lead.matriculaConvertida &&
            STATUS_MATRICULA_CONVERTIDA.has(
              lead.matriculaConvertida.status
            )
        );

      if (
        matriculaValida &&
        etapaNova.resultado !==
          ResultadoEtapaFunilComercial.GANHA
      ) {
        throw new ErroMovimentacaoLead(
          409,
          "Este lead possui uma matrícula válida e deve permanecer convertido.",
          "LEAD_JA_CONVERTIDO",
          {
            matriculaId:
              lead.matriculaConvertida?.id,
          }
        );
      }

      if (
        etapaNova.resultado ===
          ResultadoEtapaFunilComercial.GANHA &&
        !matriculaValida
      ) {
        throw new ErroMovimentacaoLead(
          409,
          "O lead somente pode ser marcado como convertido após a criação de uma matrícula válida.",
          "MATRICULA_VALIDA_NAO_ENCONTRADA"
        );
      }

      const etapaAnterior =
        lead.etapaFunilId
          ? await tx.etapaFunilComercial.findFirst({
              where: {
                id: lead.etapaFunilId,
                instituicaoId,
              },
              select: {
                id: true,
                nome: true,
                resultado: true,
              },
            })
          : null;

      const exigeMotivoPerda =
        etapaNova.exigeMotivoPerda ||
        etapaRepresentaPerda(
          etapaNova.resultado
        );

      let motivoPerda:
        | {
            id: number;
            nome: string;
            exigeObservacao: boolean;
          }
        | null = null;

      const motivoPerdaObservacao =
        textoOuNull(
          input.motivoPerdaObservacao
        );

      if (exigeMotivoPerda) {
        if (
          !input.motivoPerdaId ||
          !Number.isInteger(
            input.motivoPerdaId
          )
        ) {
          throw new ErroMovimentacaoLead(
            400,
            "Selecione o motivo da perda antes de concluir a movimentação.",
            "MOTIVO_PERDA_OBRIGATORIO"
          );
        }

        motivoPerda =
          await tx.motivoPerdaComercial.findFirst({
            where: {
              id: input.motivoPerdaId,
              instituicaoId,
              ativo: true,
            },
            select: {
              id: true,
              nome: true,
              exigeObservacao: true,
            },
          });

        if (!motivoPerda) {
          throw new ErroMovimentacaoLead(
            400,
            "O motivo de perda informado não está disponível.",
            "MOTIVO_PERDA_INVALIDO"
          );
        }

        if (
          motivoPerda.exigeObservacao &&
          !motivoPerdaObservacao
        ) {
          throw new ErroMovimentacaoLead(
            400,
            "Este motivo de perda exige uma observação complementar.",
            "OBSERVACAO_PERDA_OBRIGATORIA"
          );
        }
      }

      const tarefaExistente =
        etapaNova.exigeProximaAcao
          ? await tx.tarefaComercial.findFirst({
              where: {
                instituicaoId,
                leadId,
                status: {
                  in: [
                    StatusTarefaComercial.PENDENTE,
                    StatusTarefaComercial.EM_ANDAMENTO,
                  ],
                },
              },
              select: {
                id: true,
              },
              orderBy: {
                agendadaPara: "asc",
              },
            })
          : null;

      const proximaAcao =
        input.proximaAcao ?? null;

      if (
        etapaNova.exigeProximaAcao &&
        !tarefaExistente &&
        !proximaAcao
      ) {
        throw new ErroMovimentacaoLead(
          400,
          "Esta etapa exige o agendamento de uma próxima ação.",
          "PROXIMA_ACAO_OBRIGATORIA"
        );
      }

      let tarefaCriada:
        | {
            id: number;
            titulo: string;
            agendadaPara: Date;
          }
        | null = null;

      if (proximaAcao) {
        if (
          !dataValida(
            proximaAcao.agendadaPara
          )
        ) {
          throw new ErroMovimentacaoLead(
            400,
            "A data da próxima ação é inválida.",
            "DATA_PROXIMA_ACAO_INVALIDA"
          );
        }

        if (
          proximaAcao.prazoEm &&
          !dataValida(
            proximaAcao.prazoEm
          )
        ) {
          throw new ErroMovimentacaoLead(
            400,
            "A data limite da próxima ação é inválida.",
            "PRAZO_PROXIMA_ACAO_INVALIDO"
          );
        }

        if (
          proximaAcao.lembreteEm &&
          !dataValida(
            proximaAcao.lembreteEm
          )
        ) {
          throw new ErroMovimentacaoLead(
            400,
            "A data do lembrete é inválida.",
            "LEMBRETE_PROXIMA_ACAO_INVALIDO"
          );
        }

        const responsavelTarefaId =
          proximaAcao
            .responsavelFuncionarioId ??
          lead.responsavelFuncionarioId;

        if (!responsavelTarefaId) {
          throw new ErroMovimentacaoLead(
            400,
            "Defina um responsável pelo lead antes de agendar a próxima ação.",
            "RESPONSAVEL_TAREFA_OBRIGATORIO"
          );
        }

        const responsavelTarefa =
          await tx.funcionario.findFirst({
            where: {
              id: responsavelTarefaId,
              instituicaoId,
              ativo: true,
              statusFuncionario: "ATIVO",
            },
            select: {
              id: true,
              nome: true,
            },
          });

        if (!responsavelTarefa) {
          throw new ErroMovimentacaoLead(
            400,
            "O responsável pela próxima ação não está ativo na instituição.",
            "RESPONSAVEL_TAREFA_INVALIDO"
          );
        }

        tarefaCriada =
          await tx.tarefaComercial.create({
            data: {
              instituicaoId,
              leadId,
              responsavelFuncionarioId:
                responsavelTarefa.id,
              criadoPorId: usuario.id,
              atualizadoPorId: usuario.id,
              tipo: proximaAcao.tipo,
              status:
                StatusTarefaComercial.PENDENTE,
              prioridade:
                proximaAcao.prioridade ??
                PrioridadeTarefaComercial.MEDIA,
              titulo:
                textoOuNull(
                  proximaAcao.titulo
                ) ??
                `Próxima ação — ${etapaNova.nome}`,
              descricao:
                textoOuNull(
                  proximaAcao.descricao
                ),
              proximaAcao: true,
              agendadaPara:
                proximaAcao.agendadaPara,
              prazoEm:
                proximaAcao.prazoEm ??
                null,
              lembreteEm:
                proximaAcao.lembreteEm ??
                null,
              responsavelNomeSnapshot:
                responsavelTarefa.nome,
            },
            select: {
              id: true,
              titulo: true,
              agendadaPara: true,
            },
          });
      }

      const representaPerda =
        etapaRepresentaPerda(
          etapaNova.resultado
        );

      const encerrada =
        etapaRepresentaEncerramento(
          etapaNova.resultado
        );

      const reabertura =
        etapaAnterior &&
        etapaAnterior.resultado !==
          ResultadoEtapaFunilComercial.ABERTA &&
        etapaNova.resultado ===
          ResultadoEtapaFunilComercial.ABERTA;

      const origemMovimentacao =
        reabertura
          ? OrigemMovimentacaoFunilComercial.REABERTURA
          : origemSolicitada;

      const dataLead:
        Prisma.LeadUncheckedUpdateManyInput =
        {
          funilId: funil.id,
          etapaFunilId: etapaNova.id,
          entrouEtapaEm: agora,
          status: statusLegadoDaEtapa(
            etapaNova.categoria,
            etapaNova.resultado
          ),
          atualizadoPorId: usuario.id,

          primeiroContatoEm:
            etapaRegistraPrimeiroContato(
              etapaNova.categoria
            )
              ? lead.primeiroContatoEm ??
                agora
              : lead.primeiroContatoEm,

          qualificadoEm:
            etapaNova.categoria ===
            CategoriaEtapaFunilComercial.QUALIFICACAO
              ? lead.qualificadoEm ??
                agora
              : lead.qualificadoEm,
        };

      if (representaPerda) {
        dataLead.motivoPerdaId =
          motivoPerda?.id ?? null;

        dataLead.motivoPerdaObservacao =
          motivoPerdaObservacao;

        dataLead.perdidoEm = agora;
        dataLead.perdidoPorId =
          usuario.id;
        dataLead.encerradoEm = agora;
      } else {
        dataLead.motivoPerdaId = null;
        dataLead.motivoPerdaObservacao =
          null;
        dataLead.perdidoEm = null;
        dataLead.perdidoPorId = null;

        dataLead.encerradoEm =
          encerrada
            ? agora
            : null;
      }

      const atualizacao =
        await tx.lead.updateMany({
          where: {
            id: lead.id,
            instituicaoGestoraId:
              instituicaoId,
            arquivadoEm: null,
          },
          data: dataLead,
        });

      if (
        atualizacao.count !== 1
      ) {
        throw new ErroMovimentacaoLead(
          409,
          "O lead foi alterado por outra operação. Atualize a página e tente novamente.",
          "CONCORRENCIA_DE_ATUALIZACAO"
        );
      }

      const movimentacao =
        await tx.leadMovimentacaoFunil.create({
          data: {
            instituicaoId,
            leadId: lead.id,
            funilId: funil.id,
            etapaAnteriorId:
              etapaAnterior?.id ??
              null,
            etapaNovaId:
              etapaNova.id,
            movimentadoPorId:
              usuario.id,
            origem:
              origemMovimentacao,
            motivo:
              textoOuNull(
                input.motivo
              ) ??
              (motivoPerda
                ? motivoPerda.nome
                : null),
            tempoEtapaAnteriorMinutos:
              minutosEntre(
                lead.entrouEtapaEm ??
                  lead.updatedAt ??
                  lead.createdAt,
                agora
              ),
            dados: {
              categoriaNova:
                etapaNova.categoria,
              resultadoNovo:
                etapaNova.resultado,
              motivoPerdaId:
                motivoPerda?.id ??
                null,
              tarefaCriadaId:
                tarefaCriada?.id ??
                null,
            },
            funilNomeSnapshot:
              funil.nome,
            etapaAnteriorNomeSnapshot:
              etapaAnterior?.nome ??
              null,
            etapaNovaNomeSnapshot:
              etapaNova.nome,
            movimentadoPorNomeSnapshot:
              usuario.nome,
          },
          select: {
            id: true,
            origem: true,
            criadoEm: true,
          },
        });

      return {
        leadId: lead.id,
        etapaAnterior:
          etapaAnterior
            ? {
                id:
                  etapaAnterior.id,
                nome:
                  etapaAnterior.nome,
              }
            : null,
        etapaNova: {
          id: etapaNova.id,
          nome: etapaNova.nome,
          categoria:
            etapaNova.categoria,
          resultado:
            etapaNova.resultado,
        },
        statusLegado:
          statusLegadoDaEtapa(
            etapaNova.categoria,
            etapaNova.resultado
          ),
        movimentacao,
        tarefaCriada,
      };
    },
       {
      maxWait: 10_000,
      timeout: 30_000,
    }
  );

/*
 * A movimentação comercial já foi
 * definitivamente persistida.
 *
 * Qualquer falha de integração externa
 * não pode desfazer a movimentação.
 */
await enfileirarEventoSaidaCaptacaoSeguro({
  instituicaoId,

  tipoEvento:
    EVENTOS_SAIDA_CAPTACAO.LEAD_ETAPA_ALTERADA,

  chaveEvento:
    `movimentacao:${resultado.movimentacao.id}`,

  payload: {
    lead: {
      id:
        resultado.leadId,

      status:
        resultado.statusLegado,
    },

    funil: {
      etapaAnterior:
        resultado.etapaAnterior,

      etapaNova:
        resultado.etapaNova,
    },

    movimentacao: {
      id:
        resultado.movimentacao.id,

      origem:
        resultado.movimentacao.origem,

      criadoEm:
        resultado.movimentacao.criadoEm,
    },
  },
});

/*
 * PERDIDA e DESCARTADA representam
 * encerramento comercial sem conversão.
 *
 * O identificador continua baseado na
 * movimentação, portanto permanece
 * idempotente.
 */
if (
  resultado.etapaNova.resultado ===
    ResultadoEtapaFunilComercial.PERDIDA ||
  resultado.etapaNova.resultado ===
    ResultadoEtapaFunilComercial.DESCARTADA
) {
  await enfileirarEventoSaidaCaptacaoSeguro({
    instituicaoId,

    tipoEvento:
      EVENTOS_SAIDA_CAPTACAO.LEAD_PERDIDO,

    chaveEvento:
      `movimentacao:${resultado.movimentacao.id}`,

    payload: {
      lead: {
        id:
          resultado.leadId,

        status:
          resultado.statusLegado,
      },

      funil: {
        etapaAnterior:
          resultado.etapaAnterior,

        etapaPerda:
          resultado.etapaNova,
      },

      movimentacao: {
        id:
          resultado.movimentacao.id,

        origem:
          resultado.movimentacao.origem,

        criadoEm:
          resultado.movimentacao.criadoEm,
      },
    },
  });
}

/*
 * Se a movimentação criou uma
 * próxima ação automaticamente,
 * também emitimos o evento da tarefa.
 *
 * A tarefa já foi persistida dentro
 * da transação neste ponto.
 */
if (resultado.tarefaCriada) {
  await enfileirarEventoSaidaCaptacaoSeguro({
    instituicaoId,

    tipoEvento:
      EVENTOS_SAIDA_CAPTACAO.TAREFA_CRIADA,

    chaveEvento:
      `tarefa:${resultado.tarefaCriada.id}`,

    payload: {
      tarefa: {
        id:
          resultado.tarefaCriada.id,

        titulo:
          resultado.tarefaCriada.titulo,

        agendadaPara:
          resultado.tarefaCriada.agendadaPara,
      },

      lead: {
        id:
          resultado.leadId,
      },

      origem: {
        tipo:
          "MOVIMENTACAO_FUNIL",

        movimentacaoId:
          resultado.movimentacao.id,
      },

      funil: {
        etapaAnterior:
          resultado.etapaAnterior,

        etapaNova:
          resultado.etapaNova,
      },
    },
  });
}

return resultado;
}