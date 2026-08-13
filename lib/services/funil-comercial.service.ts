import {
  CategoriaEtapaFunilComercial,
  CategoriaMotivoPerdaComercial,
  OrigemMovimentacaoFunilComercial,
  ResultadoEtapaFunilComercial,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ETAPAS_PADRAO = [
  {
    nome: "Novo lead",
    descricao: "Lead recebido e ainda não trabalhado pelo setor comercial.",
    categoria: CategoriaEtapaFunilComercial.ENTRADA,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 1,
    cor: "#64748B",
    probabilidadeConversao: 5,
    prazoMaximoHoras: 2,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Aguardando primeiro atendimento",
    descricao: "Lead aguardando o primeiro atendimento de um vendedor.",
    categoria: CategoriaEtapaFunilComercial.PRIMEIRO_CONTATO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 2,
    cor: "#F59E0B",
    probabilidadeConversao: 8,
    prazoMaximoHoras: 4,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Tentativa de contato",
    descricao: "Uma ou mais tentativas de contato estão sendo realizadas.",
    categoria: CategoriaEtapaFunilComercial.PRIMEIRO_CONTATO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 3,
    cor: "#F97316",
    probabilidadeConversao: 12,
    prazoMaximoHoras: 24,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Contato realizado",
    descricao: "O interessado respondeu e o atendimento foi iniciado.",
    categoria: CategoriaEtapaFunilComercial.EM_ATENDIMENTO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 4,
    cor: "#14B8A6",
    probabilidadeConversao: 20,
    prazoMaximoHoras: 24,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Qualificado",
    descricao: "O lead possui perfil, necessidade e interesse compatíveis.",
    categoria: CategoriaEtapaFunilComercial.QUALIFICACAO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 5,
    cor: "#8B5CF6",
    probabilidadeConversao: 35,
    prazoMaximoHoras: 48,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Apresentação do curso",
    descricao: "Curso, metodologia, condições e diferenciais apresentados.",
    categoria: CategoriaEtapaFunilComercial.APRESENTACAO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 6,
    cor: "#6366F1",
    probabilidadeConversao: 45,
    prazoMaximoHoras: 48,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Proposta enviada",
    descricao: "Proposta ou condição comercial enviada ao interessado.",
    categoria: CategoriaEtapaFunilComercial.PROPOSTA,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 7,
    cor: "#0891B2",
    probabilidadeConversao: 60,
    prazoMaximoHoras: 72,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Em negociação",
    descricao: "Negociação de valores, prazos ou condições em andamento.",
    categoria: CategoriaEtapaFunilComercial.NEGOCIACAO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 8,
    cor: "#A855F7",
    probabilidadeConversao: 70,
    prazoMaximoHoras: 120,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Aguardando documentos",
    descricao: "O interessado está reunindo ou enviando os documentos.",
    categoria: CategoriaEtapaFunilComercial.DOCUMENTACAO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 9,
    cor: "#D97706",
    probabilidadeConversao: 80,
    prazoMaximoHoras: 72,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Aguardando pagamento",
    descricao: "A matrícula aguarda confirmação ou processamento do pagamento.",
    categoria: CategoriaEtapaFunilComercial.PAGAMENTO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 10,
    cor: "#CA8A04",
    probabilidadeConversao: 85,
    prazoMaximoHoras: 72,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Matrícula em andamento",
    descricao: "O processo de matrícula foi iniciado e aguarda conclusão.",
    categoria: CategoriaEtapaFunilComercial.CONVERSAO,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 11,
    cor: "#10B981",
    probabilidadeConversao: 90,
    prazoMaximoHoras: 48,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Convertido",
    descricao: "Lead convertido em matrícula válida.",
    categoria: CategoriaEtapaFunilComercial.CONVERSAO,
    resultado: ResultadoEtapaFunilComercial.GANHA,
    ordem: 12,
    cor: "#16A34A",
    probabilidadeConversao: 100,
    prazoMaximoHoras: null,
    exigeProximaAcao: false,
    exigeMotivoPerda: false,
    permiteMovimentoManual: false,
  },
  {
    nome: "Perdido",
    descricao: "A oportunidade foi encerrada sem conversão.",
    categoria: CategoriaEtapaFunilComercial.PERDA,
    resultado: ResultadoEtapaFunilComercial.PERDIDA,
    ordem: 13,
    cor: "#DC2626",
    probabilidadeConversao: 0,
    prazoMaximoHoras: null,
    exigeProximaAcao: false,
    exigeMotivoPerda: true,
    permiteMovimentoManual: true,
  },
  {
    nome: "Pausado",
    descricao: "O atendimento foi pausado para retomada futura.",
    categoria: CategoriaEtapaFunilComercial.PAUSA,
    resultado: ResultadoEtapaFunilComercial.ABERTA,
    ordem: 14,
    cor: "#78716C",
    probabilidadeConversao: 15,
    prazoMaximoHoras: 168,
    exigeProximaAcao: true,
    exigeMotivoPerda: false,
    permiteMovimentoManual: true,
  },
  {
    nome: "Descartado",
    descricao: "Lead inválido, duplicado ou fora do perfil comercial.",
    categoria: CategoriaEtapaFunilComercial.DESCARTE,
    resultado: ResultadoEtapaFunilComercial.DESCARTADA,
    ordem: 15,
    cor: "#6B7280",
    probabilidadeConversao: 0,
    prazoMaximoHoras: null,
    exigeProximaAcao: false,
    exigeMotivoPerda: true,
    permiteMovimentoManual: true,
  },
] as const;

const MOTIVOS_PERDA_PADRAO = [
  {
    nome: "Sem interesse",
    categoria: CategoriaMotivoPerdaComercial.SEM_INTERESSE,
    exigeObservacao: false,
  },
  {
    nome: "Preço ou condição comercial",
    categoria: CategoriaMotivoPerdaComercial.PRECO,
    exigeObservacao: false,
  },
  {
    nome: "Escolheu um concorrente",
    categoria: CategoriaMotivoPerdaComercial.CONCORRENCIA,
    exigeObservacao: false,
  },
  {
    nome: "Não foi possível contato",
    categoria: CategoriaMotivoPerdaComercial.SEM_CONTATO,
    exigeObservacao: false,
  },
  {
    nome: "Curso indisponível",
    categoria: CategoriaMotivoPerdaComercial.CURSO_INDISPONIVEL,
    exigeObservacao: false,
  },
  {
    nome: "Horário incompatível",
    categoria: CategoriaMotivoPerdaComercial.HORARIO_INCOMPATIVEL,
    exigeObservacao: false,
  },
  {
    nome: "Localização ou distância",
    categoria: CategoriaMotivoPerdaComercial.LOCALIZACAO,
    exigeObservacao: false,
  },
  {
    nome: "Problema com documentação",
    categoria: CategoriaMotivoPerdaComercial.DOCUMENTACAO,
    exigeObservacao: false,
  },
  {
    nome: "Impedimento financeiro",
    categoria: CategoriaMotivoPerdaComercial.FINANCEIRO,
    exigeObservacao: false,
  },
  {
    nome: "Desistência",
    categoria: CategoriaMotivoPerdaComercial.DESISTENCIA,
    exigeObservacao: false,
  },
  {
    nome: "Lead duplicado",
    categoria: CategoriaMotivoPerdaComercial.DUPLICIDADE,
    exigeObservacao: false,
  },
  {
    nome: "Fora do perfil",
    categoria: CategoriaMotivoPerdaComercial.FORA_DO_PERFIL,
    exigeObservacao: false,
  },
  {
    nome: "Outro motivo",
    categoria: CategoriaMotivoPerdaComercial.OUTRO,
    exigeObservacao: true,
  },
] as const;

function categoriaInicialDoStatus(
  status: string
): CategoriaEtapaFunilComercial {
  const statusNormalizado = status.trim().toUpperCase();

  switch (statusNormalizado) {
    case "CONTATO":
    case "CONTATADO":
    case "EM_ATENDIMENTO":
      return CategoriaEtapaFunilComercial.EM_ATENDIMENTO;

    case "QUALIFICADO":
    case "QUALIFICACAO":
      return CategoriaEtapaFunilComercial.QUALIFICACAO;

    case "APRESENTACAO":
      return CategoriaEtapaFunilComercial.APRESENTACAO;

    case "PROPOSTA":
    case "PROPOSTA_ENVIADA":
      return CategoriaEtapaFunilComercial.PROPOSTA;

    case "NEGOCIACAO":
    case "EM_NEGOCIACAO":
      return CategoriaEtapaFunilComercial.NEGOCIACAO;

    case "DOCUMENTACAO":
    case "AGUARDANDO_DOCUMENTOS":
      return CategoriaEtapaFunilComercial.DOCUMENTACAO;

    case "PAGAMENTO":
    case "AGUARDANDO_PAGAMENTO":
      return CategoriaEtapaFunilComercial.PAGAMENTO;

    case "FECHADO":
    case "GANHO":
    case "CONVERTIDO":
    case "MATRICULADO":
      return CategoriaEtapaFunilComercial.CONVERSAO;

    case "PERDIDO":
      return CategoriaEtapaFunilComercial.PERDA;

    case "PAUSADO":
      return CategoriaEtapaFunilComercial.PAUSA;

    case "DESCARTADO":
      return CategoriaEtapaFunilComercial.DESCARTE;

    default:
      return CategoriaEtapaFunilComercial.ENTRADA;
  }
}

export async function garantirEstruturaComercialPadrao(
  instituicaoId: number,
  usuarioId?: number | null
) {
  if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
    throw new Error("Instituição inválida para inicialização do CRM.");
  }

  return prisma.$transaction(
    async (tx) => {
      const instituicao = await tx.instituicao.findUnique({
        where: {
          id: instituicaoId,
        },
        select: {
          id: true,
        },
      });

      if (!instituicao) {
        throw new Error("Instituição não encontrada.");
      }

      const auditor = usuarioId
        ? await tx.user.findFirst({
            where: {
              id: usuarioId,
              instituicaoId,
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : null;

      let estruturaCriada = false;

      let funil = await tx.funilComercial.findFirst({
        where: {
          instituicaoId,
          padrao: true,
          ativo: true,
        },
        include: {
          etapas: {
            where: {
              ativo: true,
            },
            orderBy: {
              ordem: "asc",
            },
          },
        },
      });

      if (!funil) {
        const funilExistente = await tx.funilComercial.findFirst({
          where: {
            instituicaoId,
            ativo: true,
          },
          orderBy: {
            id: "asc",
          },
          include: {
            etapas: {
              where: {
                ativo: true,
              },
              orderBy: {
                ordem: "asc",
              },
            },
          },
        });

        if (funilExistente) {
          funil = await tx.funilComercial.update({
            where: {
              id: funilExistente.id,
            },
            data: {
              padrao: true,
              atualizadoPorId: auditor?.id ?? null,
            },
            include: {
              etapas: {
                where: {
                  ativo: true,
                },
                orderBy: {
                  ordem: "asc",
                },
              },
            },
          });
        } else {
          funil = await tx.funilComercial.create({
            data: {
              instituicaoId,
              nome: "Funil comercial padrão",
              descricao:
                "Processo completo de atendimento, negociação e conversão de leads em matrículas.",
              padrao: true,
              ativo: true,
              criadoPorId: auditor?.id ?? null,
              atualizadoPorId: auditor?.id ?? null,
              etapas: {
                create: ETAPAS_PADRAO.map((etapa) => ({
                  instituicaoId,
                  nome: etapa.nome,
                  descricao: etapa.descricao,
                  categoria: etapa.categoria,
                  resultado: etapa.resultado,
                  ordem: etapa.ordem,
                  cor: etapa.cor,
                  probabilidadeConversao:
                    etapa.probabilidadeConversao,
                  prazoMaximoHoras: etapa.prazoMaximoHoras,
                  exigeProximaAcao: etapa.exigeProximaAcao,
                  exigeMotivoPerda: etapa.exigeMotivoPerda,
                  permiteMovimentoManual:
                    etapa.permiteMovimentoManual,
                  visivelNoKanban: true,
                  ativo: true,
                  criadoPorId: auditor?.id ?? null,
                  atualizadoPorId: auditor?.id ?? null,
                })),
              },
            },
            include: {
              etapas: {
                where: {
                  ativo: true,
                },
                orderBy: {
                  ordem: "asc",
                },
              },
            },
          });

          estruturaCriada = true;
        }
      }

      await tx.funilComercial.updateMany({
        where: {
          instituicaoId,
          padrao: true,
          id: {
            not: funil.id,
          },
        },
        data: {
          padrao: false,
          atualizadoPorId: auditor?.id ?? null,
        },
      });

      if (funil.etapas.length === 0) {
        throw new Error(
          "O funil comercial padrão não possui etapas configuradas."
        );
      }

      const quantidadeMotivos =
        await tx.motivoPerdaComercial.count({
          where: {
            instituicaoId,
          },
        });

      if (quantidadeMotivos === 0) {
        await tx.motivoPerdaComercial.createMany({
          data: MOTIVOS_PERDA_PADRAO.map((motivo, indice) => ({
            instituicaoId,
            nome: motivo.nome,
            categoria: motivo.categoria,
            exigeObservacao: motivo.exigeObservacao,
            ordem: indice + 1,
            ativo: true,
            criadoPorId: auditor?.id ?? null,
            atualizadoPorId: auditor?.id ?? null,
          })),
          skipDuplicates: true,
        });
      }

      const etapasPorCategoria = new Map<
        CategoriaEtapaFunilComercial,
        (typeof funil.etapas)[number]
      >();

      for (const etapa of funil.etapas) {
        if (!etapasPorCategoria.has(etapa.categoria)) {
          etapasPorCategoria.set(etapa.categoria, etapa);
        }
      }

      const primeiraEtapa =
        etapasPorCategoria.get(
          CategoriaEtapaFunilComercial.ENTRADA
        ) ?? funil.etapas[0];

      const leadsSemFunil = await tx.lead.findMany({
        where: {
          instituicaoGestoraId: instituicaoId,
          OR: [
            {
              funilId: null,
              etapaFunilId: null,
            },
            {
              funilId: funil.id,
              etapaFunilId: null,
            },
          ],
        },
        select: {
          id: true,
          status: true,
        },
      });

      const etapaPorLead = new Map<
        number,
        (typeof funil.etapas)[number]
      >();

      const leadsAgrupadosPorEtapa = new Map<number, number[]>();

      for (const lead of leadsSemFunil) {
        const categoria = categoriaInicialDoStatus(lead.status);

        const etapa =
          etapasPorCategoria.get(categoria) ?? primeiraEtapa;

        etapaPorLead.set(lead.id, etapa);

        const idsAtuais =
          leadsAgrupadosPorEtapa.get(etapa.id) ?? [];

        idsAtuais.push(lead.id);
        leadsAgrupadosPorEtapa.set(etapa.id, idsAtuais);
      }

      const agora = new Date();

      for (const [etapaId, leadIds] of leadsAgrupadosPorEtapa) {
        await tx.lead.updateMany({
          where: {
            id: {
              in: leadIds,
            },
            instituicaoGestoraId: instituicaoId,
          },
          data: {
            funilId: funil.id,
            etapaFunilId: etapaId,
            entrouEtapaEm: agora,
          },
        });
      }

      if (leadsSemFunil.length > 0) {
        await tx.leadMovimentacaoFunil.createMany({
          data: leadsSemFunil.map((lead) => {
            const etapa = etapaPorLead.get(lead.id);

            if (!etapa) {
              throw new Error(
                `Não foi possível determinar a etapa do lead ${lead.id}.`
              );
            }

            return {
              instituicaoId,
              leadId: lead.id,
              funilId: funil.id,
              etapaAnteriorId: null,
              etapaNovaId: etapa.id,
              movimentadoPorId: auditor?.id ?? null,
              origem:
                OrigemMovimentacaoFunilComercial.IMPORTACAO,
              motivo:
                "Vinculação inicial do lead ao funil comercial.",
              funilNomeSnapshot: funil.nome,
              etapaAnteriorNomeSnapshot: null,
              etapaNovaNomeSnapshot: etapa.nome,
              movimentadoPorNomeSnapshot:
                auditor?.nome ?? "Sistema PHANYX",
              dados: {
                statusLegado: lead.status,
              },
            };
          }),
        });
      }

      return {
        funilId: funil.id,
        funilNome: funil.nome,
        estruturaCriada,
        quantidadeEtapas: funil.etapas.length,
        quantidadeMotivos:
          quantidadeMotivos === 0
            ? MOTIVOS_PERDA_PADRAO.length
            : quantidadeMotivos,
        leadsVinculados: leadsSemFunil.length,
      };
    },
    {
      maxWait: 10_000,
      timeout: 30_000,
    }
  );
}