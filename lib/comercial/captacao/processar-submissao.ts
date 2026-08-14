import {
  EstrategiaDistribuicaoLead,
  MapeamentoCampoFormularioCaptacaoLead,
  Prisma,
  PrioridadeTarefaComercial,
  ResultadoDeduplicacaoCaptacaoLead,
  ResultadoEtapaFunilComercial,
  StatusSubmissaoCaptacaoLead,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const STATUS_LEADS_ABERTOS = [
  "NOVO",
  "CONTATO",
  "NEGOCIACAO",
  "PROPOSTA",
];

type DadosNormalizados = {
  nome: string;
  email: string;
  telefone: string | null;
  instituicaoNome: string | null;
  cargo: string | null;
  interesse: string | null;
  observacoes: string | null;
  cursoInteresseId: number | null;
  poloInteresseId: number | null;
  consentimentoLgpd: boolean;
  personalizados: Record<string, unknown>;
};

export type ResultadoProcessamentoCaptacao = {
  submissaoId: number;
  status: StatusSubmissaoCaptacaoLead;
  resultadoDeduplicacao:
    ResultadoDeduplicacaoCaptacaoLead;
  leadId: number | null;
  tarefaId: number | null;
  regraDistribuicaoId: number | null;
};

type StatusFinalErroCaptacao =
  | typeof StatusSubmissaoCaptacaoLead.REJEITADA
  | typeof StatusSubmissaoCaptacaoLead.ERRO;

export class ErroProcessamentoCaptacao
  extends Error
{
  codigo: string;
  statusFinal: StatusFinalErroCaptacao;

  constructor(
    mensagem: string,
    codigo: string,
    statusFinal: StatusFinalErroCaptacao =
      StatusSubmissaoCaptacaoLead.REJEITADA
  ) {
    super(mensagem);

    this.name =
      "ErroProcessamentoCaptacao";

    this.codigo =
      codigo;

    this.statusFinal =
      statusFinal;
  }
}

function registroJson(
  valor: unknown
): Record<string, unknown> {
  if (
    !valor ||
    typeof valor !== "object" ||
    Array.isArray(valor)
  ) {
    return {};
  }

  return valor as
    Record<string, unknown>;
}

function paraJsonPrisma(
  valor: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(valor)
  ) as Prisma.InputJsonValue;
}

function valorVazio(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return true;
  }

  if (
    typeof valor === "string"
  ) {
    return (
      valor.trim().length === 0
    );
  }

  if (
    Array.isArray(valor)
  ) {
    return valor.length === 0;
  }

  return false;
}

function texto(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return null;
  }

  if (
    Array.isArray(valor)
  ) {
    const itens = valor
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean);

    return itens.length
      ? itens.join(", ")
      : null;
  }

  const resultado =
    String(valor).trim();

  return resultado || null;
}

function booleano(
  valor: unknown
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    typeof valor === "number"
  ) {
    return valor === 1;
  }

  const normalizado =
    String(valor ?? "")
      .trim()
      .toLowerCase();

  return [
    "1",
    "true",
    "sim",
    "yes",
    "on",
    "aceito",
    "aceita",
  ].includes(normalizado);
}

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

function normalizarEmail(
  valor: unknown
) {
  const email =
    String(valor ?? "")
      .trim()
      .toLowerCase();

  if (!email) {
    return "";
  }

  return email;
}

function emailValido(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizarTelefone(
  valor: unknown
) {
  const telefone =
    String(valor ?? "")
      .replace(/\D/g, "");

  return telefone || null;
}

function criteriosVazios(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return true;
  }

  if (
    Array.isArray(valor)
  ) {
    return valor.length === 0;
  }

  if (
    typeof valor === "object"
  ) {
    return (
      Object.keys(valor).length ===
      0
    );
  }

  return false;
}

function juntarObservacoes(
  atual: string | null,
  nova: string | null
) {
  if (!nova) {
    return atual;
  }

  if (!atual) {
    return nova;
  }

  return `${atual}\n\n[Central de Captação]\n${nova}`;
}

function mensagemErro(
  error: unknown
) {
  if (
    error instanceof Error
  ) {
    return (
      error.message ||
      "Erro desconhecido."
    );
  }

  return String(
    error ??
      "Erro desconhecido."
  );
}

async function normalizarDados(
  submissao: {
    nomeSnapshot: string | null;
    emailSnapshot: string | null;
    telefoneSnapshot:
      string | null;

    dadosOriginais:
      Prisma.JsonValue;

    dadosNormalizados:
      Prisma.JsonValue | null;

    consentimentoLgpd:
      boolean;

    formulario: {
      exigeConsentimento:
        boolean;

      textoConsentimento:
        string | null;

      versaoConsentimento:
        string | null;

      campos: Array<{
        chave: string;
        rotulo: string;
        mapeamento:
          MapeamentoCampoFormularioCaptacaoLead;
        valorPadrao:
          string | null;
        obrigatorio:
          boolean;
        ativo: boolean;
      }>;
    } | null;
  }
): Promise<DadosNormalizados> {
  const originais =
    registroJson(
      submissao.dadosOriginais
    );

  const anteriores =
    registroJson(
      submissao.dadosNormalizados
    );

  let nome =
    texto(
      submissao.nomeSnapshot ??
        anteriores.nome ??
        originais.nome ??
        originais.name
    );

  let email =
    normalizarEmail(
      submissao.emailSnapshot ??
        anteriores.email ??
        originais.email
    );

  let telefone =
    normalizarTelefone(
      submissao.telefoneSnapshot ??
        anteriores.telefone ??
        originais.telefone ??
        originais.phone ??
        originais.whatsapp
    );

  let instituicaoNome =
    texto(
      anteriores.instituicaoNome ??
        originais.instituicaoNome ??
        originais.instituicao
    );

  let cargo =
    texto(
      anteriores.cargo ??
        originais.cargo
    );

  let interesse =
    texto(
      anteriores.interesse ??
        originais.interesse
    );

  let observacoes =
    texto(
      anteriores.observacoes ??
        originais.observacoes
    );

  let cursoInteresseId =
    idPositivo(
      anteriores.cursoInteresseId ??
        originais.cursoInteresseId
    );

  let poloInteresseId =
    idPositivo(
      anteriores.poloInteresseId ??
        originais.poloInteresseId
    );

  let consentimentoLgpd =
    submissao.consentimentoLgpd;

  const personalizados:
    Record<string, unknown> =
      registroJson(
        anteriores.personalizados
      );

  if (submissao.formulario) {
    for (
      const campo of
      submissao.formulario.campos
    ) {
      if (!campo.ativo) {
        continue;
      }

      const valor =
        originais[campo.chave] ??
        campo.valorPadrao ??
        null;

      if (
        campo.obrigatorio &&
        valorVazio(valor)
      ) {
        throw new ErroProcessamentoCaptacao(
          `O campo "${campo.rotulo}" é obrigatório.`,
          "CAMPO_OBRIGATORIO"
        );
      }

      switch (
        campo.mapeamento
      ) {
        case MapeamentoCampoFormularioCaptacaoLead.NOME:
          nome =
            texto(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.EMAIL:
          email =
            normalizarEmail(
              valor
            );
          break;

        case MapeamentoCampoFormularioCaptacaoLead.TELEFONE:
          telefone =
            normalizarTelefone(
              valor
            );
          break;

        case MapeamentoCampoFormularioCaptacaoLead.INSTITUICAO_NOME:
          instituicaoNome =
            texto(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.CARGO:
          cargo =
            texto(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.INTERESSE:
          interesse =
            texto(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.OBSERVACOES:
          observacoes =
            texto(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.CURSO_INTERESSE_ID:
          cursoInteresseId =
            idPositivo(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.POLO_INTERESSE_ID:
          poloInteresseId =
            idPositivo(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.CONSENTIMENTO:
          consentimentoLgpd =
            booleano(valor);
          break;

        case MapeamentoCampoFormularioCaptacaoLead.PERSONALIZADO:
          personalizados[
            campo.chave
          ] = valor;
          break;
      }
    }
  }

  if (!nome) {
    throw new ErroProcessamentoCaptacao(
      "O nome do interessado não foi informado.",
      "NOME_OBRIGATORIO"
    );
  }

  /*
   * O modelo Lead atual exige
   * email. Portanto, nesta versão
   * não criamos endereço fictício.
   */
  if (!email) {
    throw new ErroProcessamentoCaptacao(
      "O e-mail do interessado não foi informado.",
      "EMAIL_OBRIGATORIO"
    );
  }

  if (!emailValido(email)) {
    throw new ErroProcessamentoCaptacao(
      "O e-mail informado é inválido.",
      "EMAIL_INVALIDO"
    );
  }

  if (
    telefone &&
    telefone.length < 8
  ) {
    throw new ErroProcessamentoCaptacao(
      "O telefone informado é inválido.",
      "TELEFONE_INVALIDO"
    );
  }

  if (
    submissao.formulario
      ?.exigeConsentimento &&
    !consentimentoLgpd
  ) {
    throw new ErroProcessamentoCaptacao(
      "O consentimento LGPD obrigatório não foi concedido.",
      "CONSENTIMENTO_LGPD_AUSENTE"
    );
  }

  return {
    nome,
    email,
    telefone,
    instituicaoNome,
    cargo,
    interesse,
    observacoes,
    cursoInteresseId,
    poloInteresseId,
    consentimentoLgpd,
    personalizados,
  };
}

async function resolverCurso(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  cursoId: number | null
) {
  if (!cursoId) {
    return null;
  }

  const curso =
    await tx.curso.findFirst({
      where: {
        id: cursoId,
        instituicaoId,
        ativo: true,
        excluidoEm: null,
      },

      select: {
        id: true,
      },
    });

  if (!curso) {
    throw new ErroProcessamentoCaptacao(
      "O curso informado na captação não está disponível.",
      "CURSO_INVALIDO"
    );
  }

  return curso.id;
}

async function resolverPolo(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  poloId: number | null
) {
  if (!poloId) {
    return null;
  }

  const polo =
    await tx.polo.findFirst({
      where: {
        id: poloId,
        instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
      },
    });

  if (!polo) {
    throw new ErroProcessamentoCaptacao(
      "O polo informado na captação não está disponível.",
      "POLO_INVALIDO"
    );
  }

  return polo.id;
}

async function resolverEstruturaFunil(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  formulario: {
    funilPadraoId:
      number | null;
    etapaPadraoId:
      number | null;
  } | null
) {
  let funilId:
    number | null =
      formulario
        ?.funilPadraoId ??
      null;

  let etapaFunilId:
    number | null =
      formulario
        ?.etapaPadraoId ??
      null;

  if (funilId) {
    const funil =
      await tx.funilComercial.findFirst({
        where: {
          id: funilId,
          instituicaoId,
          ativo: true,
          arquivadoEm: null,
        },

        select: {
          id: true,
        },
      });

    if (!funil) {
      funilId = null;
      etapaFunilId = null;
    }
  }

  if (!funilId) {
    const funil =
      await tx.funilComercial.findFirst({
        where: {
          instituicaoId,
          ativo: true,
          arquivadoEm: null,
        },

        select: {
          id: true,
        },

        orderBy: [
          {
            padrao: "desc",
          },
          {
            id: "asc",
          },
        ],
      });

    funilId =
      funil?.id ??
      null;

    etapaFunilId =
      null;
  }

  if (!funilId) {
    return {
      funilId: null,
      etapaFunilId: null,
    };
  }

  if (etapaFunilId) {
    const etapa =
      await tx.etapaFunilComercial.findFirst({
        where: {
          id: etapaFunilId,
          instituicaoId,
          funilId,
          ativo: true,
          arquivadoEm: null,
        },

        select: {
          id: true,
        },
      });

    if (!etapa) {
      etapaFunilId = null;
    }
  }

  if (!etapaFunilId) {
    const etapa =
      await tx.etapaFunilComercial.findFirst({
        where: {
          instituicaoId,
          funilId,
          ativo: true,
          arquivadoEm: null,
          resultado:
            ResultadoEtapaFunilComercial.ABERTA,
        },

        select: {
          id: true,
        },

        orderBy: {
          ordem: "asc",
        },
      });

    etapaFunilId =
      etapa?.id ??
      null;
  }

  return {
    funilId,
    etapaFunilId,
  };
}

async function funcionarioAtivo(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  funcionarioId:
    number | null
) {
  if (!funcionarioId) {
    return null;
  }

  return tx.funcionario.findFirst({
    where: {
      id: funcionarioId,
      instituicaoId,
      ativo: true,
      statusFuncionario:
        "ATIVO",
    },

    select: {
      id: true,
      nome: true,
    },
  });
}

async function equipeAtiva(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  equipeId: number | null
) {
  if (!equipeId) {
    return null;
  }

  return tx.equipeComercial.findFirst({
    where: {
      id: equipeId,
      instituicaoId,
      ativo: true,
    },

    select: {
      id: true,
    },
  });
}

function regraCombina(
  regra: {
    canalId: number | null;
    campanhaId:
      number | null;
    formularioId:
      number | null;
    cursoId: number | null;
    poloId: number | null;
    criterios: Prisma.JsonValue | null;
  },
  valores: {
    canalId: number | null;
    campanhaId:
      number | null;
    formularioId:
      number | null;
    cursoId: number | null;
    poloId: number | null;
  }
) {
  if (
    !criteriosVazios(
      regra.criterios
    )
  ) {
    /*
     * Critérios JSON avançados
     * ficam reservados para o
     * motor de critérios v2.
     */
    return false;
  }

  const comparar = (
    regraValor: number | null,
    valor: number | null
  ) =>
    regraValor === null ||
    regraValor === valor;

  return (
    comparar(
      regra.canalId,
      valores.canalId
    ) &&
    comparar(
      regra.campanhaId,
      valores.campanhaId
    ) &&
    comparar(
      regra.formularioId,
      valores.formularioId
    ) &&
    comparar(
      regra.cursoId,
      valores.cursoId
    ) &&
    comparar(
      regra.poloId,
      valores.poloId
    )
  );
}

function especificidadeRegra(
  regra: {
    canalId: number | null;
    campanhaId:
      number | null;
    formularioId:
      number | null;
    cursoId: number | null;
    poloId: number | null;
  }
) {
  return [
    regra.canalId,
    regra.campanhaId,
    regra.formularioId,
    regra.cursoId,
    regra.poloId,
  ].filter(
    (valor) =>
      valor !== null
  ).length;
}

async function cargasDosResponsaveis(
  tx: Prisma.TransactionClient,
  instituicaoId: number,
  funcionariosIds:
    number[]
) {
  const mapa =
    new Map<number, number>();

  for (
    const id of
    funcionariosIds
  ) {
    mapa.set(id, 0);
  }

  if (
    funcionariosIds.length ===
    0
  ) {
    return mapa;
  }

  const grupos =
    await tx.lead.groupBy({
      by: [
        "responsavelFuncionarioId",
      ],

      where: {
        instituicaoGestoraId:
          instituicaoId,

        responsavelFuncionarioId: {
          in:
            funcionariosIds,
        },

        status: {
          in:
            STATUS_LEADS_ABERTOS,
        },
      },

      _count: {
        _all: true,
      },
    });

  for (
    const grupo of grupos
  ) {
    if (
      grupo
        .responsavelFuncionarioId
    ) {
      mapa.set(
        grupo
          .responsavelFuncionarioId,
        grupo._count._all
      );
    }
  }

  return mapa;
}

async function distribuirLead(
  tx: Prisma.TransactionClient,
  params: {
    instituicaoId: number;

    canalId: number | null;
    campanhaId:
      number | null;
    formularioId:
      number | null;
    cursoId: number | null;
    poloId: number | null;

    equipePadraoId:
      number | null;

    responsavelPadraoId:
      number | null;
  }
) {
  const regras =
    await tx.regraDistribuicaoLead.findMany({
      where: {
        instituicaoId:
          params.instituicaoId,
        ativo: true,
      },

      select: {
        id: true,

        canalId: true,
        campanhaId: true,
        formularioId: true,
        cursoId: true,
        poloId: true,

        equipeId: true,
        responsavelFixoId:
          true,

        estrategia: true,

        ordemPrioridade:
          true,

        maximoLeadsAbertosPorResponsavel:
          true,

        somenteMembrosAtivos:
          true,

        respeitarDisponibilidade:
          true,

        proximoIndiceRodizio:
          true,

        criterios: true,
      },
    });

  const candidatas =
    regras
      .filter((regra) =>
        regraCombina(
          regra,
          {
            canalId:
              params.canalId,
            campanhaId:
              params.campanhaId,
            formularioId:
              params.formularioId,
            cursoId:
              params.cursoId,
            poloId:
              params.poloId,
          }
        )
      )
      .sort((a, b) => {
        if (
          a.ordemPrioridade !==
          b.ordemPrioridade
        ) {
          return (
            a.ordemPrioridade -
            b.ordemPrioridade
          );
        }

        return (
          especificidadeRegra(
            b
          ) -
          especificidadeRegra(
            a
          )
        );
      });

  const regra =
    candidatas[0] ??
    null;

  if (!regra) {
    const equipe =
      await equipeAtiva(
        tx,
        params.instituicaoId,
        params.equipePadraoId
      );

    const responsavel =
      await funcionarioAtivo(
        tx,
        params.instituicaoId,
        params.responsavelPadraoId
      );

    return {
      regraId:
        null as number | null,

      equipeId:
        equipe?.id ??
        null,

      responsavelId:
        responsavel?.id ??
        null,

      responsavelNome:
        responsavel?.nome ??
        null,
    };
  }

  const equipeId =
    regra.equipeId ??
    params.equipePadraoId;

  const equipe =
    await equipeAtiva(
      tx,
      params.instituicaoId,
      equipeId
    );

  if (
    regra.estrategia ===
    EstrategiaDistribuicaoLead.MANUAL
  ) {
    return {
      regraId: regra.id,
      equipeId:
        equipe?.id ??
        null,
      responsavelId:
        null,
      responsavelNome:
        null,
    };
  }

  if (
    regra.estrategia ===
    EstrategiaDistribuicaoLead.EQUIPE_SEM_RESPONSAVEL
  ) {
    return {
      regraId: regra.id,
      equipeId:
        equipe?.id ??
        null,
      responsavelId:
        null,
      responsavelNome:
        null,
    };
  }

  if (
    regra.estrategia ===
    EstrategiaDistribuicaoLead.RESPONSAVEL_FIXO
  ) {
    const responsavel =
      await funcionarioAtivo(
        tx,
        params.instituicaoId,
        regra.responsavelFixoId
      );

    if (!responsavel) {
      return {
        regraId: regra.id,
        equipeId:
          equipe?.id ??
          null,
        responsavelId:
          null,
        responsavelNome:
          null,
      };
    }

    if (
      regra.maximoLeadsAbertosPorResponsavel
    ) {
      const carga =
        await tx.lead.count({
          where: {
            instituicaoGestoraId:
              params.instituicaoId,

            responsavelFuncionarioId:
              responsavel.id,

            status: {
              in:
                STATUS_LEADS_ABERTOS,
            },
          },
        });

      if (
        carga >=
        regra.maximoLeadsAbertosPorResponsavel
      ) {
        return {
          regraId:
            regra.id,

          equipeId:
            equipe?.id ??
            null,

          responsavelId:
            null,

          responsavelNome:
            null,
        };
      }
    }

    return {
      regraId:
        regra.id,

      equipeId:
        equipe?.id ??
        null,

      responsavelId:
        responsavel.id,

      responsavelNome:
        responsavel.nome,
    };
  }

  if (!equipe) {
    return {
      regraId: regra.id,
      equipeId: null,
      responsavelId:
        null,
      responsavelNome:
        null,
    };
  }

  const agora =
    new Date();

  const membros =
    await tx.equipeComercialMembro.findMany({
      where: {
        instituicaoId:
          params.instituicaoId,

        equipeId:
          equipe.id,

        ...(regra.somenteMembrosAtivos
          ? {
              ativo: true,
            }
          : {}),

        ...(regra.respeitarDisponibilidade
          ? {
              inicioVigencia: {
                lte: agora,
              },

              OR: [
                {
                  fimVigencia:
                    null,
                },

                {
                  fimVigencia: {
                    gte:
                      agora,
                  },
                },
              ],
            }
          : {}),

        funcionario: {
          instituicaoId:
            params.instituicaoId,

          ativo: true,

          statusFuncionario:
            "ATIVO",
        },
      },

      select: {
        funcionarioId: true,

        funcionario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },

      orderBy: {
        funcionarioId:
          "asc",
      },
    });

  if (
    membros.length === 0
  ) {
    return {
      regraId: regra.id,
      equipeId:
        equipe.id,
      responsavelId:
        null,
      responsavelNome:
        null,
    };
  }

  const ids =
    membros.map(
      (membro) =>
        membro.funcionarioId
    );

  const cargas =
    await cargasDosResponsaveis(
      tx,
      params.instituicaoId,
      ids
    );

  const elegiveis =
    membros.filter(
      (membro) => {
        const maximo =
          regra.maximoLeadsAbertosPorResponsavel;

        if (!maximo) {
          return true;
        }

        return (
          (
            cargas.get(
              membro
                .funcionarioId
            ) ?? 0
          ) < maximo
        );
      }
    );

  if (
    elegiveis.length === 0
  ) {
    return {
      regraId: regra.id,
      equipeId:
        equipe.id,
      responsavelId:
        null,
      responsavelNome:
        null,
    };
  }

  let escolhido =
    elegiveis[0];

  if (
    regra.estrategia ===
    EstrategiaDistribuicaoLead.MENOR_CARGA
  ) {
    escolhido =
      [...elegiveis].sort(
        (a, b) => {
          const cargaA =
            cargas.get(
              a.funcionarioId
            ) ?? 0;

          const cargaB =
            cargas.get(
              b.funcionarioId
            ) ?? 0;

          if (
            cargaA !==
            cargaB
          ) {
            return (
              cargaA -
              cargaB
            );
          }

          return (
            a.funcionarioId -
            b.funcionarioId
          );
        }
      )[0];
  }

  if (
    regra.estrategia ===
    EstrategiaDistribuicaoLead.ALEATORIA
  ) {
    escolhido =
      elegiveis[
        Math.floor(
          Math.random() *
            elegiveis.length
        )
      ];
  }

  if (
    regra.estrategia ===
    EstrategiaDistribuicaoLead.RODIZIO
  ) {
    /*
     * O incremento no próprio banco
     * evita depender de estado em
     * memória entre instâncias Vercel.
     */
    const atualizada =
      await tx.regraDistribuicaoLead.update({
        where: {
          id: regra.id,
        },

        data: {
          proximoIndiceRodizio: {
            increment: 1,
          },
        },

        select: {
          proximoIndiceRodizio:
            true,
        },
      });

    const indiceAnterior =
      Math.max(
        atualizada
          .proximoIndiceRodizio -
          1,
        0
      );

    escolhido =
      elegiveis[
        indiceAnterior %
          elegiveis.length
      ];
  }

  return {
    regraId:
      regra.id,

    equipeId:
      equipe.id,

    responsavelId:
      escolhido.funcionario.id,

    responsavelNome:
      escolhido.funcionario.nome,
  };
}

export async function processarSubmissaoCaptacao(
  params: {
    submissaoId: number;
    instituicaoId: number;
  }
): Promise<ResultadoProcessamentoCaptacao> {
  const submissaoId =
    Number(
      params.submissaoId
    );

  const instituicaoId =
    Number(
      params.instituicaoId
    );

  if (
    !Number.isInteger(
      submissaoId
    ) ||
    submissaoId <= 0
  ) {
    throw new ErroProcessamentoCaptacao(
      "Submissão inválida.",
      "SUBMISSAO_INVALIDA",
      StatusSubmissaoCaptacaoLead.ERRO
    );
  }

  if (
    !Number.isInteger(
      instituicaoId
    ) ||
    instituicaoId <= 0
  ) {
    throw new ErroProcessamentoCaptacao(
      "Instituição inválida.",
      "INSTITUICAO_INVALIDA",
      StatusSubmissaoCaptacaoLead.ERRO
    );
  }

  let capturada =
    false;

  let finalizada =
    false;

  try {
    /*
     * Claim da submissão.
     *
     * Só uma execução pode tirá-la
     * de RECEBIDA/REJEITADA/ERRO
     * para VALIDANDO.
     */
    const claim =
      await prisma.submissaoCaptacaoLead.updateMany({
        where: {
          id:
            submissaoId,

          instituicaoId,

          status: {
            in: [
              StatusSubmissaoCaptacaoLead.RECEBIDA,
              StatusSubmissaoCaptacaoLead.REJEITADA,
              StatusSubmissaoCaptacaoLead.ERRO,
            ],
          },
        },

        data: {
          status:
            StatusSubmissaoCaptacaoLead.VALIDANDO,

          tentativasProcessamento: {
            increment: 1,
          },

          codigoErro:
            null,

          mensagemErro:
            null,
        },
      });

    if (
      claim.count !== 1
    ) {
      const atual =
        await prisma.submissaoCaptacaoLead.findFirst({
          where: {
            id:
              submissaoId,
            instituicaoId,
          },

          select: {
            status: true,
          },
        });

      if (!atual) {
        throw new Error(
          "Submissão não encontrada."
        );
      }

      throw new Error(
        `A submissão não pode ser processada no estado ${atual.status}.`
      );
    }

    capturada =
      true;

    const submissao =
      await prisma.submissaoCaptacaoLead.findFirst({
        where: {
          id:
            submissaoId,
          instituicaoId,
        },

        select: {
          id: true,

          canalId: true,
          campanhaId: true,
          formularioId: true,
          integracaoId: true,
          leadId: true,

          nomeSnapshot:
            true,

          emailSnapshot:
            true,

          telefoneSnapshot:
            true,

          dadosOriginais:
            true,

          dadosNormalizados:
            true,

          consentimentoLgpd:
            true,

          consentimentoEm:
            true,

          versaoConsentimento:
            true,

          textoConsentimentoSnapshot:
            true,

          canal: {
            select: {
              id: true,
              tipo: true,
            },
          },

          formulario: {
            select: {
              id: true,

              funilPadraoId:
                true,

              etapaPadraoId:
                true,

              equipePadraoId:
                true,

              responsavelPadraoId:
                true,

              cursoPadraoId:
                true,

              poloPadraoId:
                true,

              exigeConsentimento:
                true,

              textoConsentimento:
                true,

              versaoConsentimento:
                true,

              bloquearDuplicados:
                true,

              atualizarLeadExistente:
                true,

              criarTarefaPrimeiroContato:
                true,

              tipoTarefaInicial:
                true,

              prazoPrimeiroContatoMinutos:
                true,

              campos: {
                where: {
                  ativo: true,
                },

                select: {
                  chave: true,
                  rotulo: true,

                  mapeamento:
                    true,

                  valorPadrao:
                    true,

                  obrigatorio:
                    true,

                  ativo: true,
                },

                orderBy: {
                  ordem:
                    "asc",
                },
              },
            },
          },
        },
      });

    if (!submissao) {
      throw new ErroProcessamentoCaptacao(
        "Submissão não encontrada.",
        "SUBMISSAO_NAO_ENCONTRADA",
        StatusSubmissaoCaptacaoLead.ERRO
      );
    }

    const dados =
      await normalizarDados(
        submissao
      );

    const dadosNormalizados = {
      nome:
        dados.nome,

      email:
        dados.email,

      telefone:
        dados.telefone,

      instituicaoNome:
        dados.instituicaoNome,

      cargo:
        dados.cargo,

      interesse:
        dados.interesse,

      observacoes:
        dados.observacoes,

      cursoInteresseId:
        dados.cursoInteresseId,

      poloInteresseId:
        dados.poloInteresseId,

      consentimentoLgpd:
        dados.consentimentoLgpd,

      personalizados:
        dados.personalizados,
    };

    const chaveDeduplicacao =
      `email:${dados.email}`;

    const agora =
      new Date();

    await prisma.submissaoCaptacaoLead.update({
      where: {
        id:
          submissaoId,
      },

      data: {
        status:
          StatusSubmissaoCaptacaoLead.PROCESSANDO,

        nomeSnapshot:
          dados.nome,

        emailSnapshot:
          dados.email,

        telefoneSnapshot:
          dados.telefone,

        dadosNormalizados:
          paraJsonPrisma(
            dadosNormalizados
          ),

        chaveDeduplicacao,

        consentimentoLgpd:
          dados.consentimentoLgpd,

        consentimentoEm:
          dados.consentimentoLgpd
            ? (
                submissao.consentimentoEm ??
                agora
              )
            : null,

        versaoConsentimento:
          dados.consentimentoLgpd
            ? (
                submissao
                  .versaoConsentimento ??
                submissao
                  .formulario
                  ?.versaoConsentimento ??
                null
              )
            : null,

        textoConsentimentoSnapshot:
          dados.consentimentoLgpd
            ? (
                submissao
                  .textoConsentimentoSnapshot ??
                submissao
                  .formulario
                  ?.textoConsentimento ??
                null
              )
            : null,
      },
    });

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const cursoId =
            await resolverCurso(
              tx,
              instituicaoId,

              dados.cursoInteresseId ??
                submissao
                  .formulario
                  ?.cursoPadraoId ??
                null
            );

          const poloId =
            await resolverPolo(
              tx,
              instituicaoId,

              dados.poloInteresseId ??
                submissao
                  .formulario
                  ?.poloPadraoId ??
                null
            );

          let leadExistente =
            submissao.leadId
              ? await tx.lead.findFirst({
                  where: {
                    id:
                      submissao.leadId,

                    instituicaoGestoraId:
                      instituicaoId,
                  },

                  select: {
                    id: true,
                    nome: true,
                    email: true,
                    telefone: true,

                    instituicaoNome:
                      true,

                    cargo: true,
                    interesse: true,
                    observacoes:
                      true,

                    cursoInteresseId:
                      true,

                    poloInteresseId:
                      true,
                  },
                })
              : null;

          if (
            !leadExistente
          ) {
            const or:
              Prisma.LeadWhereInput[] =
                [
                  {
                    email: {
                      equals:
                        dados.email,

                      mode:
                        "insensitive",
                    },
                  },
                ];

            if (
              dados.telefone
            ) {
              const telefones =
                Array.from(
                  new Set(
                    [
                      dados.telefone,

                      submissao.telefoneSnapshot
                        ? String(
                            submissao.telefoneSnapshot
                          ).trim()
                        : null,
                    ].filter(
                      (
                        valor
                      ): valor is string =>
                        Boolean(
                          valor
                        )
                    )
                  )
                );

              or.push({
                telefone: {
                  in:
                    telefones,
                },
              });
            }

            leadExistente =
              await tx.lead.findFirst({
                where: {
                  instituicaoGestoraId:
                    instituicaoId,

                  OR: or,
                },

                select: {
                  id: true,
                  nome: true,
                  email: true,
                  telefone: true,

                  instituicaoNome:
                    true,

                  cargo: true,
                  interesse: true,

                  observacoes:
                    true,

                  cursoInteresseId:
                    true,

                  poloInteresseId:
                    true,
                },

                orderBy: {
                  createdAt:
                    "desc",
                },
              });
          }

          const bloquearDuplicados =
            submissao
              .formulario
              ?.bloquearDuplicados ??
            true;

          const atualizarExistente =
            submissao
              .formulario
              ?.atualizarLeadExistente ??
            true;

          /*
           * Duplicata bloqueada:
           * vincula à submissão,
           * mas não cria outro lead.
           */
          if (
            leadExistente &&
            bloquearDuplicados &&
            !atualizarExistente
          ) {
            await tx.submissaoCaptacaoLead.update({
              where: {
                id:
                  submissaoId,
              },

              data: {
                leadId:
                  leadExistente.id,

                status:
                  StatusSubmissaoCaptacaoLead.DUPLICADA,

                resultadoDeduplicacao:
                  ResultadoDeduplicacaoCaptacaoLead.DUPLICADA_IGNORADA,

                processadoEm:
                  agora,

                codigoErro:
                  null,

                mensagemErro:
                  null,
              },
            });

            return {
              status:
                StatusSubmissaoCaptacaoLead.DUPLICADA,

              resultadoDeduplicacao:
                ResultadoDeduplicacaoCaptacaoLead.DUPLICADA_IGNORADA,

              leadId:
                leadExistente.id,

              tarefaId:
                null as number | null,

              regraDistribuicaoId:
                null as number | null,
            };
          }

          /*
           * Lead existente:
           * atualizamos dados cadastrais,
           * mas NÃO sobrescrevemos sua
           * posição comercial atual.
           */
          if (
            leadExistente &&
            bloquearDuplicados &&
            atualizarExistente
          ) {
            const lead =
              await tx.lead.update({
                where: {
                  id:
                    leadExistente.id,
                },

                data: {
                  nome:
                    dados.nome,

                  email:
                    dados.email,

                  ...(dados.telefone
                    ? {
                        telefone:
                          dados.telefone,
                      }
                    : {}),

                  ...(dados.instituicaoNome
                    ? {
                        instituicaoNome:
                          dados.instituicaoNome,
                      }
                    : {}),

                  ...(dados.cargo
                    ? {
                        cargo:
                          dados.cargo,
                      }
                    : {}),

                  ...(dados.interesse
                    ? {
                        interesse:
                          dados.interesse,
                      }
                    : {}),

                  observacoes:
                    juntarObservacoes(
                      leadExistente.observacoes,

                      dados.observacoes
                    ),

                  ...(
                    !leadExistente
                      .cursoInteresseId &&
                    cursoId
                      ? {
                          cursoInteresseId:
                            cursoId,
                        }
                      : {}
                  ),

                  ...(
                    !leadExistente
                      .poloInteresseId &&
                    poloId
                      ? {
                          poloInteresseId:
                            poloId,
                        }
                      : {}
                  ),
                },

                select: {
                  id: true,
                },
              });

            await tx.leadInteracao.create({
              data: {
                leadId:
                  lead.id,

                instituicaoGestoraId:
                  instituicaoId,

                tipo:
                  "CAPTACAO",

                descricao:
                  "Nova submissão recebida pela Central de Captação e vinculada ao lead existente.",

                usuarioNomeSnapshot:
                  "Central de Captação",
              },
            });

            await tx.submissaoCaptacaoLead.update({
              where: {
                id:
                  submissaoId,
              },

              data: {
                leadId:
                  lead.id,

                status:
                  StatusSubmissaoCaptacaoLead.PROCESSADA,

                resultadoDeduplicacao:
                  ResultadoDeduplicacaoCaptacaoLead.LEAD_EXISTENTE_ATUALIZADO,

                processadoEm:
                  agora,

                codigoErro:
                  null,

                mensagemErro:
                  null,
              },
            });

            return {
              status:
                StatusSubmissaoCaptacaoLead.PROCESSADA,

              resultadoDeduplicacao:
                ResultadoDeduplicacaoCaptacaoLead.LEAD_EXISTENTE_ATUALIZADO,

              leadId:
                lead.id,

              tarefaId:
                null as number | null,

              regraDistribuicaoId:
                null as number | null,
            };
          }

          /*
           * Novo lead.
           */

          const estrutura =
            await resolverEstruturaFunil(
              tx,
              instituicaoId,
              submissao.formulario
            );

          const distribuicao =
            await distribuirLead(
              tx,
              {
                instituicaoId,

                canalId:
                  submissao.canalId,

                campanhaId:
                  submissao.campanhaId,

                formularioId:
                  submissao.formularioId,

                cursoId,

                poloId,

                equipePadraoId:
                  submissao
                    .formulario
                    ?.equipePadraoId ??
                  null,

                responsavelPadraoId:
                  submissao
                    .formulario
                    ?.responsavelPadraoId ??
                  null,
              }
            );

          const criarTarefa =
            submissao
              .formulario
              ?.criarTarefaPrimeiroContato ??
            false;

          const prazoMinutos =
            Math.max(
              1,

              submissao
                .formulario
                ?.prazoPrimeiroContatoMinutos ??
                15
            );

          const prazoPrimeiroContato =
            new Date(
              agora.getTime() +
                prazoMinutos *
                  60_000
            );

          const lead =
            await tx.lead.create({
              data: {
                instituicaoGestoraId:
                  instituicaoId,

                nome:
                  dados.nome,

                email:
                  dados.email,

                telefone:
                  dados.telefone,

                instituicaoNome:
                  dados.instituicaoNome,

                cargo:
                  dados.cargo,

                interesse:
                  dados.interesse,

                observacoes:
                  dados.observacoes,

                origem:
                  submissao.canal
                    ?.tipo
                    ? `CAPTACAO_${submissao.canal.tipo}`
                    : "CAPTACAO",

                tipo:
                  "INSTITUICAO",

                status:
                  "NOVO",

                prioridade:
                  "MEDIA",

                cursoInteresseId:
                  cursoId,

                poloInteresseId:
                  poloId,

                funilId:
                  estrutura.funilId,

                etapaFunilId:
                  estrutura.etapaFunilId,

                equipeResponsavelId:
                  distribuicao.equipeId,

                responsavelFuncionarioId:
                  distribuicao.responsavelId,

                responsavelNomeSnapshot:
                  distribuicao.responsavelNome,

                entrouEtapaEm:
                  estrutura.etapaFunilId
                    ? agora
                    : null,

                proximoContatoEm:
                  criarTarefa
                    ? agora
                    : null,
              },

              select: {
                id: true,
              },
            });

          await tx.leadInteracao.create({
            data: {
              leadId:
                lead.id,

              instituicaoGestoraId:
                instituicaoId,

              tipo:
                "CAPTACAO",

              descricao:
                "Lead criado automaticamente pela Central de Captação.",

              usuarioNomeSnapshot:
                "Central de Captação",
            },
          });

          let tarefaId:
            number | null =
              null;

          if (criarTarefa) {
            const tarefa =
              await tx.tarefaComercial.create({
                data: {
                  instituicaoId,

                  leadId:
                    lead.id,

                  responsavelFuncionarioId:
                    distribuicao.responsavelId,

                  responsavelNomeSnapshot:
                    distribuicao.responsavelNome,

                  tipo:
                    submissao
                      .formulario
                      ?.tipoTarefaInicial ??
                    "RETORNO",

                  prioridade:
                    PrioridadeTarefaComercial.MEDIA,

                  titulo:
                    `Primeiro contato com ${dados.nome}`,

                  descricao:
                    "Tarefa criada automaticamente pela Central de Captação.",

                  proximaAcao:
                    true,

                  agendadaPara:
                    agora,

                  prazoEm:
                    prazoPrimeiroContato,
                },

                select: {
                  id: true,
                },
              });

            tarefaId =
              tarefa.id;
          }

          await tx.submissaoCaptacaoLead.update({
            where: {
              id:
                submissaoId,
            },

            data: {
              leadId:
                lead.id,

              status:
                StatusSubmissaoCaptacaoLead.PROCESSADA,

              resultadoDeduplicacao:
                ResultadoDeduplicacaoCaptacaoLead.NOVO_LEAD,

              processadoEm:
                agora,

              codigoErro:
                null,

              mensagemErro:
                null,
            },
          });

          return {
            status:
              StatusSubmissaoCaptacaoLead.PROCESSADA,

            resultadoDeduplicacao:
              ResultadoDeduplicacaoCaptacaoLead.NOVO_LEAD,

            leadId:
              lead.id,

            tarefaId,

            regraDistribuicaoId:
              distribuicao.regraId,
          };
        },
        {
          maxWait: 5_000,
          timeout: 20_000,
        }
      );

    finalizada =
      true;

    return {
      submissaoId,

      status:
        resultado.status,

      resultadoDeduplicacao:
        resultado.resultadoDeduplicacao,

      leadId:
        resultado.leadId,

      tarefaId:
        resultado.tarefaId,

      regraDistribuicaoId:
        resultado.regraDistribuicaoId,
    };
  } catch (error) {
    /*
     * Só alteramos o status se esta
     * execução conseguiu capturar
     * efetivamente a submissão.
     */
    if (
      capturada &&
      !finalizada
    ) {
      const erroCaptacao =
        error instanceof
        ErroProcessamentoCaptacao
          ? error
          : null;

      const statusFinal =
        erroCaptacao
          ?.statusFinal ??
        StatusSubmissaoCaptacaoLead.ERRO;

      const codigoErro =
        (
          erroCaptacao
            ?.codigo ??
          "ERRO_PROCESSAMENTO"
        ).slice(
          0,
          190
        );

      const textoErro =
        mensagemErro(
          error
        );

      try {
        await prisma.submissaoCaptacaoLead.updateMany({
          where: {
            id:
              submissaoId,
            instituicaoId,
          },

          data: {
            status:
              statusFinal,

            resultadoDeduplicacao:
              ResultadoDeduplicacaoCaptacaoLead.NAO_VERIFICADA,

            codigoErro,

            mensagemErro:
              textoErro,

            processadoEm:
              statusFinal ===
              StatusSubmissaoCaptacaoLead.REJEITADA
                ? new Date()
                : null,
          },
        });
      } catch (
        erroAoRegistrar
      ) {
        console.error(
          "Erro ao registrar falha da submissão de captação:",
          erroAoRegistrar
        );
      }
    }

    throw error;
  }
}