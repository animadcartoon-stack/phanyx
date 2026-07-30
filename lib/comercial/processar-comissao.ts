import {
  BaseCalculoComissaoRH,
  EscopoRegraComissaoRH,
  GatilhoComissaoRH,
  ModoParticipacaoPlanoComissaoRH,
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
  cargo: string | null;
  departamentoId: number | null;
  departamentoNome: string | null;
  origem: "MATRICULA" | "PLANO";
};

type RegraComissaoProcessamento = {
  id: number;
  regraBaseId: number | null;
  nome: string;
  tipo: TipoRegraComissaoRH;
  baseCalculo: BaseCalculoComissaoRH;
  percentual: Prisma.Decimal | number | string | null;
  valorFixo: Prisma.Decimal | number | string | null;
  quantidadeMinima: number | null;
  quantidadeMaxima: number | null;
  usarValorLiquidoRecebido: boolean;
  ordem: number;
  escopoAplicacao: EscopoRegraComissaoRH;
  departamentoAlvoId: number | null;
  cargoAlvo: string | null;
  cargoAlvoNormalizado: string | null;
  funcionarioAlvoId: number | null;
};

function numeroSeguro(valor: unknown) {
  const numero = Number(valor ?? 0);

  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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
  identificadorRegra: string;
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
    params.identificadorRegra,
  ].join(":");
}

function nivelEspecificidade(
  escopo: EscopoRegraComissaoRH
) {
  switch (escopo) {
    case EscopoRegraComissaoRH.FUNCIONARIO:
      return 4;

    case EscopoRegraComissaoRH.CARGO:
      return 3;

    case EscopoRegraComissaoRH.DEPARTAMENTO:
      return 2;

    case EscopoRegraComissaoRH.GERAL:
    default:
      return 1;
  }
}

function regraSeAplicaAoParticipante(
  regra: RegraComissaoProcessamento,
  participante: ParticipanteProcessamento
) {
  switch (regra.escopoAplicacao) {
    case EscopoRegraComissaoRH.FUNCIONARIO:
      return (
        regra.funcionarioAlvoId ===
        participante.funcionarioId
      );

    case EscopoRegraComissaoRH.CARGO: {
      const cargoParticipante = normalizarTexto(
        participante.cargo
      );

      const cargoRegra =
        regra.cargoAlvoNormalizado ||
        normalizarTexto(regra.cargoAlvo);

      return Boolean(
        cargoParticipante &&
        cargoRegra &&
        cargoParticipante === cargoRegra
      );
    }

    case EscopoRegraComissaoRH.DEPARTAMENTO:
      return Boolean(
        regra.departamentoAlvoId &&
        participante.departamentoId &&
        regra.departamentoAlvoId ===
        participante.departamentoId
      );

    case EscopoRegraComissaoRH.GERAL:
    default:
      return true;
  }
}

function selecionarRegrasAplicaveis(
  regras: RegraComissaoProcessamento[],
  participante: ParticipanteProcessamento
) {
  const grupos = new Map<
    number,
    RegraComissaoProcessamento[]
  >();

  for (const regra of regras) {
    const grupoId =
      regra.regraBaseId ?? regra.id;

    const regrasGrupo =
      grupos.get(grupoId) || [];

    regrasGrupo.push(regra);
    grupos.set(grupoId, regrasGrupo);
  }

  const selecionadas: Array<{
    grupoId: number;
    regra: RegraComissaoProcessamento;
  }> = [];

  for (const [grupoId, regrasGrupo] of grupos) {
    const regraSelecionada = regrasGrupo
      .filter((regra) =>
        regraSeAplicaAoParticipante(
          regra,
          participante
        )
      )
      .sort((a, b) => {
        const diferencaEspecificidade =
          nivelEspecificidade(
            b.escopoAplicacao
          ) -
          nivelEspecificidade(
            a.escopoAplicacao
          );

        if (diferencaEspecificidade !== 0) {
          return diferencaEspecificidade;
        }

        if (a.ordem !== b.ordem) {
          return a.ordem - b.ordem;
        }

        return a.id - b.id;
      })[0];

    if (regraSelecionada) {
      selecionadas.push({
        grupoId,
        regra: regraSelecionada,
      });
    }
  }

  return selecionadas.sort((a, b) => {
    if (a.regra.ordem !== b.regra.ordem) {
      return a.regra.ordem - b.regra.ordem;
    }

    return a.grupoId - b.grupoId;
  });
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
            cargo: true,
            departamentoId: true,
            departamento: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },

        participantesComerciais: {
          include: {
            funcionario: {
              select: {
                id: true,
                nome: true,
                cargo: true,
                departamentoId: true,
                departamento: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
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

  const participantesOriginais: ParticipanteProcessamento[] =
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

          cargo:
            participante.funcionario.cargo || null,

          departamentoId:
            participante.funcionario.departamentoId ||
            participante.funcionario.departamento?.id ||
            null,

          departamentoNome:
            participante.funcionario.departamento?.nome ||
            null,

          origem: "MATRICULA",
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

            cargo:
              matricula.vendedorResponsavel.cargo ||
              null,

            departamentoId:
              matricula.vendedorResponsavel
                .departamentoId ||
              matricula.vendedorResponsavel
                .departamento?.id ||
              null,

            departamentoNome:
              matricula.vendedorResponsavel
                .departamento?.nome ||
              null,

            origem: "MATRICULA",
          },
        ]
        : [];

  if (participantesOriginais.length === 0) {
    return {
      processado: false,
      motivo: "VENDEDOR_NAO_INFORMADO",
      criados: 0,
    };
  }

  const funcionarioIdsOriginais = [
    ...new Set(
      participantesOriginais.map(
        (participante) =>
          participante.funcionarioId
      )
    ),
  ];

  const vinculosOriginais =
    await tx.funcionarioPlanoComissaoRH.findMany({
      where: {
        instituicaoId,
        funcionarioId: {
          in: funcionarioIdsOriginais,
        },
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

      orderBy: [
        {
          inicioVigencia: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

  const contextosPlano = new Map<
    number,
    {
      plano: (typeof vinculosOriginais)[number]["plano"];
      participantesOriginais: ParticipanteProcessamento[];
    }
  >();

  for (const participante of participantesOriginais) {
    const vinculo = vinculosOriginais.find(
      (item) =>
        item.funcionarioId ===
        participante.funcionarioId &&
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

    const contextoExistente =
      contextosPlano.get(vinculo.plano.id);

    if (contextoExistente) {
      contextoExistente.participantesOriginais.push(
        participante
      );
    } else {
      contextosPlano.set(vinculo.plano.id, {
        plano: vinculo.plano,
        participantesOriginais: [participante],
      });
    }
  }

  if (contextosPlano.size === 0) {
    return {
      processado: true,
      motivo: "PLANO_NAO_ENCONTRADO",
      criados: 0,
    };
  }

  const competenciaMes =
    eventoEm.getMonth() + 1;

  const competenciaAno =
    eventoEm.getFullYear();

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

  let criados = 0;

  for (const contexto of contextosPlano.values()) {
    const { plano } = contexto;

    if (
      gatilho ===
      GatilhoComissaoRH.MATRICULA_CONFIRMADA &&
      plano.exigePagamentoConfirmado
    ) {
      continue;
    }

    const participantesPlano = new Map<
      number,
      ParticipanteProcessamento
    >();

    for (const participante of
      contexto.participantesOriginais) {
      participantesPlano.set(
        participante.funcionarioId,
        participante
      );
    }

    if (
      plano.modoParticipacao ===
      ModoParticipacaoPlanoComissaoRH.TODOS_VINCULADOS_PLANO
    ) {
      const vinculosDoPlano =
        await tx.funcionarioPlanoComissaoRH.findMany({
          where: {
            instituicaoId,
            planoId: plano.id,
            ativo: true,
            funcionario: {
              ativo: true,
              statusFuncionario: "ATIVO",
            },
          },

          include: {
            funcionario: {
              select: {
                id: true,
                nome: true,
                cargo: true,
                departamentoId: true,
                departamento: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              inicioVigencia: "desc",
            },
            {
              id: "desc",
            },
          ],
        });

      for (const vinculo of vinculosDoPlano) {
        if (
          !dataDentroDaVigencia(
            eventoEm,
            vinculo.inicioVigencia,
            vinculo.fimVigencia
          ) ||
          participantesPlano.has(
            vinculo.funcionarioId
          )
        ) {
          continue;
        }

        participantesPlano.set(
          vinculo.funcionarioId,
          {
            funcionarioId:
              vinculo.funcionario.id,

            participanteComercialId: null,

            percentualParticipacao: 100,

            nome: vinculo.funcionario.nome,

            cargo:
              vinculo.funcionario.cargo || null,

            departamentoId:
              vinculo.funcionario.departamentoId ||
              vinculo.funcionario.departamento?.id ||
              null,

            departamentoNome:
              vinculo.funcionario.departamento?.nome ||
              null,

            origem: "PLANO",
          }
        );
      }
    }

    const participantesProcessamento = [
      ...participantesPlano.values(),
    ];

    const funcionarioIdsPlano = [
      ...participantesPlano.keys(),
    ];

    let quantidadeMatriculasPlano:
      | number
      | null = null;

    if (
      plano.modoParticipacao ===
      ModoParticipacaoPlanoComissaoRH.TODOS_VINCULADOS_PLANO &&
      funcionarioIdsPlano.length > 0
    ) {
      quantidadeMatriculasPlano =
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
                vendedorResponsavelId: {
                  in: funcionarioIdsPlano,
                },
              },
              {
                participantesComerciais: {
                  some: {
                    funcionarioId: {
                      in: funcionarioIdsPlano,
                    },
                  },
                },
              },
            ],
          },
        });
    }

    for (const participante of
      participantesProcessamento) {
      if (
        plano.modoParticipacao ===
        ModoParticipacaoPlanoComissaoRH.SOMENTE_PARTICIPANTES_MATRICULA &&
        participantesOriginais.length > 1 &&
        !plano.permiteCompartilhamento &&
        participante.funcionarioId !==
        matricula.vendedorResponsavelId
      ) {
        continue;
      }

      const regrasAplicaveis =
        selecionarRegrasAplicaveis(
          plano.regras as RegraComissaoProcessamento[],
          participante
        );

      if (regrasAplicaveis.length === 0) {
        continue;
      }

      const quantidadeMatriculas =
        quantidadeMatriculasPlano ??
        (await tx.matricula.count({
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
        }));

      for (const {
        grupoId,
        regra,
      } of regrasAplicaveis) {
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
            identificadorRegra:
              `GRUPO-REGRA-${grupoId}`,
          });

        const chaveCalculoLegada =
          criarChaveCalculo({
            gatilho,
            matriculaId: matricula.id,
            pagamentoId,
            funcionarioId:
              participante.funcionarioId,
            identificadorRegra:
              `REGRA-${regra.id}`,
          });

        const existente =
          await tx.lancamentoComissaoRH.findFirst({
            where: {
              instituicaoId,
              chaveCalculo: {
                in: [
                  chaveCalculo,
                  chaveCalculoLegada,
                ],
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

            planoId: plano.id,
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
              plano.nome,

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
              `Escopo aplicado: ${regra.escopoAplicacao}. ` +
              `Grupo de regra: ${grupoId}. ` +
              `Origem do participante: ${participante.origem}. ` +
              `Departamento: ${participante.departamentoNome || "Não informado"}. ` +
              `Cargo: ${participante.cargo || "Não informado"}. ` +
              `Quantidade de matrículas na competência: ${quantidadeMatriculas}.`,
          },
        });

        criados += 1;
      }
    }
  }

  return {
    processado: true,
    motivo: null,
    criados,
  };
}