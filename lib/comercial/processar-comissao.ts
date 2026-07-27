import {
  BaseCalculoComissaoRH,
  GatilhoComissaoRH,
  Prisma,
  TipoRegraComissaoRH,
} from "@prisma/client";

type ProcessarComissaoParams = {
  tx: Prisma.TransactionClient;

  instituicaoId: number;
  matriculaId: number;

  gatilho: Exclude<
    GatilhoComissaoRH,
    "MANUAL"
  >;

  pagamentoId?: number | null;
  valorRecebido?: number | null;

  eventoEm?: Date;
  criadoPorId?: number | null;
};

type ParticipanteProcessamento = {
  funcionarioId: number;
  participanteComercialId: number | null;
  percentualParticipacao: number;
  nome: string;
};

function numeroSeguro(valor: unknown) {
  const numero = Number(valor ?? 0);

  return Number.isFinite(numero) ? numero : 0;
}

function dataDentroDaVigencia(
  data: Date,
  inicio?: Date | null,
  fim?: Date | null
) {
  if (inicio && data < inicio) {
    return false;
  }

  if (fim && data > fim) {
    return false;
  }

  return true;
}

function calcularValorTotalContrato(params: {
  valorMatricula: unknown;
  valorMensalidade: unknown;
  quantidadeMensalidades: unknown;
}) {
  const valorMatricula = numeroSeguro(
    params.valorMatricula
  );

  const valorMensalidade = numeroSeguro(
    params.valorMensalidade
  );

  const quantidadeMensalidades = Math.max(
    0,
    Math.trunc(
      numeroSeguro(params.quantidadeMensalidades)
    )
  );

  return Number(
    (
      valorMatricula +
      valorMensalidade * quantidadeMensalidades
    ).toFixed(2)
  );
}

function calcularBase(params: {
  baseCalculo: BaseCalculoComissaoRH;

  valorMatricula: unknown;
  valorMensalidade: unknown;
  quantidadeMensalidades: unknown;

  valorRecebido?: number | null;
  usarValorLiquidoRecebido: boolean;
}) {
  const valorRecebido =
    params.valorRecebido === null ||
    params.valorRecebido === undefined
      ? null
      : numeroSeguro(params.valorRecebido);

  if (
    params.usarValorLiquidoRecebido &&
    valorRecebido !== null &&
    params.baseCalculo !==
      BaseCalculoComissaoRH.QUANTIDADE_MATRICULAS
  ) {
    return Number(valorRecebido.toFixed(2));
  }

  switch (params.baseCalculo) {
    case BaseCalculoComissaoRH.VALOR_MATRICULA:
      return Number(
        numeroSeguro(
          params.valorMatricula
        ).toFixed(2)
      );

    case BaseCalculoComissaoRH.VALOR_MENSALIDADE:
      return Number(
        numeroSeguro(
          params.valorMensalidade
        ).toFixed(2)
      );

    case BaseCalculoComissaoRH.VALOR_TOTAL_CONTRATO:
      return calcularValorTotalContrato({
        valorMatricula: params.valorMatricula,
        valorMensalidade:
          params.valorMensalidade,
        quantidadeMensalidades:
          params.quantidadeMensalidades,
      });

    case BaseCalculoComissaoRH.VALOR_RECEBIDO:
      return Number(
        numeroSeguro(valorRecebido).toFixed(2)
      );

    case BaseCalculoComissaoRH.QUANTIDADE_MATRICULAS:
      return 1;

    /*
     * O schema atual não possui custos suficientes
     * para calcular lucro automaticamente.
     */
    case BaseCalculoComissaoRH.LUCRO:
      return 0;

    default:
      return 0;
  }
}

function calcularValorComissao(params: {
  tipo: TipoRegraComissaoRH;
  baseCalculo: number;

  percentual?: unknown;
  valorFixo?: unknown;

  percentualParticipacao: number;
}) {
  let valorBruto = 0;

  if (
    params.tipo ===
    TipoRegraComissaoRH.PERCENTUAL
  ) {
    const percentual = numeroSeguro(
      params.percentual
    );

    valorBruto =
      params.baseCalculo * (percentual / 100);
  } else {
    valorBruto = numeroSeguro(
      params.valorFixo
    );
  }

  const percentualParticipacao =
    Math.min(
      100,
      Math.max(
        0,
        numeroSeguro(
          params.percentualParticipacao
        )
      )
    );

  return Number(
    (
      valorBruto *
      (percentualParticipacao / 100)
    ).toFixed(2)
  );
}

function criarChaveCalculo(params: {
  gatilho: GatilhoComissaoRH;
  matriculaId: number;
  pagamentoId?: number | null;
  funcionarioId: number;
  regraId: number;
}) {
  const gatilhoUnicoPorMatricula =
    params.gatilho ===
      GatilhoComissaoRH.MATRICULA_CONFIRMADA ||
    params.gatilho ===
      GatilhoComissaoRH.PRIMEIRA_MENSALIDADE_PAGA;

  const referenciaPagamento =
    gatilhoUnicoPorMatricula
      ? "UNICO"
      : `PAGAMENTO-${params.pagamentoId ?? 0}`;

  return [
    "COMISSAO",
    params.gatilho,
    `MATRICULA-${params.matriculaId}`,
    referenciaPagamento,
    `FUNCIONARIO-${params.funcionarioId}`,
    `REGRA-${params.regraId}`,
  ].join(":");
}

export async function processarComissaoAutomatica({
  tx,
  instituicaoId,
  matriculaId,
  gatilho,
  pagamentoId = null,
  valorRecebido = null,
  eventoEm = new Date(),
  criadoPorId = null,
}: ProcessarComissaoParams) {
  const matricula =
    await tx.matricula.findFirst({
      where: {
        id: matriculaId,
        instituicaoId,
      },

      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
          },
        },

        curso: {
          select: {
            id: true,
            nome: true,
          },
        },

        vendedorResponsavel: {
          select: {
            id: true,
            nome: true,
          },
        },

        participantesComerciais: {
          include: {
            funcionario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

  if (!matricula) {
    return {
      processado: false,
      motivo: "MATRICULA_NAO_ENCONTRADA",
      criados: 0,
    };
  }

  if (
    matricula.status === "CANCELADA" ||
    matricula.status === "TRANCADA" ||
    matricula.status === "SUSPENSA"
  ) {
    return {
      processado: false,
      motivo: "MATRICULA_NAO_ELEGIVEL",
      criados: 0,
    };
  }

  const participantes: ParticipanteProcessamento[] =
    matricula.participantesComerciais.length > 0
      ? matricula.participantesComerciais.map(
          (participante) => ({
            funcionarioId:
              participante.funcionarioId,

            participanteComercialId:
              participante.id,

            percentualParticipacao:
              numeroSeguro(
                participante.percentualParticipacao
              ),

            nome:
              participante.funcionarioNomeSnapshot ||
              participante.funcionario.nome,
          })
        )
      : matricula.vendedorResponsavel
        ? [
            {
              funcionarioId:
                matricula.vendedorResponsavel.id,

              participanteComercialId: null,

              percentualParticipacao: 100,

              nome:
                matricula
                  .vendedorResponsavelNomeSnapshot ||
                matricula.vendedorResponsavel.nome,
            },
          ]
        : [];

  if (participantes.length === 0) {
    return {
      processado: false,
      motivo: "VENDEDOR_NAO_INFORMADO",
      criados: 0,
    };
  }

  const competenciaMes =
    eventoEm.getMonth() + 1;

  const competenciaAno =
    eventoEm.getFullYear();

  let criados = 0;

  for (const participante of participantes) {
    const vinculos =
      await tx.funcionarioPlanoComissaoRH.findMany({
        where: {
          instituicaoId,
          funcionarioId:
            participante.funcionarioId,
          ativo: true,
        },

        include: {
          plano: {
            include: {
              regras: {
                where: {
                  ativo: true,
                  gatilho,

                  OR: matricula.cursoId
                    ? [
                        {
                          cursoId: null,
                        },
                        {
                          cursoId:
                            matricula.cursoId,
                        },
                      ]
                    : [
                        {
                          cursoId: null,
                        },
                      ],
                },

                orderBy: [
                  {
                    ordem: "asc",
                  },
                  {
                    id: "asc",
                  },
                ],
              },
            },
          },
        },

        orderBy: {
          inicioVigencia: "desc",
        },
      });

    const vinculo = vinculos.find(
      (item) =>
        dataDentroDaVigencia(
          eventoEm,
          item.inicioVigencia,
          item.fimVigencia
        ) &&
        item.plano.ativo &&
        dataDentroDaVigencia(
          eventoEm,
          item.plano.inicioVigencia,
          item.plano.fimVigencia
        )
    );

    if (!vinculo) {
      continue;
    }

    if (
      participantes.length > 1 &&
      !vinculo.plano.permiteCompartilhamento &&
      participante.funcionarioId !==
        matricula.vendedorResponsavelId
    ) {
      continue;
    }

    if (
      gatilho ===
        GatilhoComissaoRH.MATRICULA_CONFIRMADA &&
      vinculo.plano.exigePagamentoConfirmado
    ) {
      continue;
    }

    for (const regra of vinculo.plano.regras) {
      /*
       * LUCRO permanece reservado para lançamento
       * manual enquanto não houver custos cadastrados.
       */
      if (
        regra.baseCalculo ===
        BaseCalculoComissaoRH.LUCRO
      ) {
        continue;
      }

      const inicioCompetencia = new Date(
        competenciaAno,
        competenciaMes - 1,
        1
      );

      const fimCompetencia = new Date(
        competenciaAno,
        competenciaMes,
        1
      );

      const quantidadeMatriculas =
        await tx.matricula.count({
          where: {
            instituicaoId,

            createdAt: {
              gte: inicioCompetencia,
              lt: fimCompetencia,
            },

            status: {
              in: [
                "ATIVA",
                "A_INICIAR",
                "CONCLUIDA",
              ],
            },

            OR: [
              {
                vendedorResponsavelId:
                  participante.funcionarioId,
              },
              {
                participantesComerciais: {
                  some: {
                    funcionarioId:
                      participante.funcionarioId,
                  },
                },
              },
            ],
          },
        });

      if (
        regra.quantidadeMinima !== null &&
        regra.quantidadeMinima !== undefined &&
        quantidadeMatriculas <
          regra.quantidadeMinima
      ) {
        continue;
      }

      if (
        regra.quantidadeMaxima !== null &&
        regra.quantidadeMaxima !== undefined &&
        quantidadeMatriculas >
          regra.quantidadeMaxima
      ) {
        continue;
      }

      const baseCalculo = calcularBase({
        baseCalculo: regra.baseCalculo,

        valorMatricula:
          matricula.valorMatricula,

        valorMensalidade:
          matricula.valorMensalidade,

        quantidadeMensalidades:
          matricula.quantidadeMensalidades,

        valorRecebido,

        usarValorLiquidoRecebido:
          regra.usarValorLiquidoRecebido,
      });

      if (baseCalculo <= 0) {
        continue;
      }

      const valorCalculado =
        calcularValorComissao({
          tipo: regra.tipo,
          baseCalculo,

          percentual: regra.percentual,
          valorFixo: regra.valorFixo,

          percentualParticipacao:
            participante.percentualParticipacao,
        });

      if (valorCalculado <= 0) {
        continue;
      }

      const chaveCalculo =
        criarChaveCalculo({
          gatilho,
          matriculaId: matricula.id,
          pagamentoId,
          funcionarioId:
            participante.funcionarioId,
          regraId: regra.id,
        });

      const existente =
        await tx.lancamentoComissaoRH.findUnique({
          where: {
            instituicaoId_chaveCalculo: {
              instituicaoId,
              chaveCalculo,
            },
          },

          select: {
            id: true,
          },
        });

      if (existente) {
        continue;
      }

      await tx.lancamentoComissaoRH.create({
        data: {
          instituicaoId,

          funcionarioId:
            participante.funcionarioId,

          matriculaId: matricula.id,

          participanteComercialId:
            participante.participanteComercialId,

          planoId: vinculo.plano.id,
          regraId: regra.id,
          pagamentoId,

          criadoPorId,

          chaveCalculo,

          origem: "AUTOMATICA",
          status: "PENDENTE",

          competenciaMes,
          competenciaAno,

          descricao:
            `Comissão automática — ${regra.nome}`,

          baseCalculo,

          percentualAplicado:
            regra.tipo ===
            TipoRegraComissaoRH.PERCENTUAL
              ? regra.percentual
              : null,

          valorFixoAplicado:
            regra.tipo ===
            TipoRegraComissaoRH.VALOR_FIXO
              ? regra.valorFixo
              : null,

          percentualParticipacao:
            participante.percentualParticipacao,

          valorCalculado,

          funcionarioNomeSnapshot:
            participante.nome,

          planoNomeSnapshot:
            vinculo.plano.nome,

          regraNomeSnapshot: regra.nome,

          alunoNomeSnapshot:
            matricula.aluno.nome,

          cursoNomeSnapshot:
            matricula.curso?.nome || null,

          matriculaNumeroSnapshot:
            matricula.numeroMatricula ||
            matricula.numeroMatriculaLegado ||
            String(matricula.id),

          calculadoEm: eventoEm,

          observacoes:
            `Gatilho: ${gatilho}. ` +
            `Quantidade de matrículas na competência: ${quantidadeMatriculas}.`,
        },
      });

      criados += 1;
    }
  }

  return {
    processado: true,
    motivo: null,
    criados,
  };
}