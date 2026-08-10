import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  EscopoMetaComercial,
  IndicadorMetaComercial,
  PeriodicidadeMetaComercial,
  Prisma,
  StatusMetaComercial,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";
import { apurarMetaComercial } from "@/lib/comercial/apurar-meta-comercial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
  status: number;
  codigo?: string;

  constructor(
    status: number,
    mensagem: string,
    codigo?: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

const ESCOPOS_META = Object.values(
  EscopoMetaComercial
);

const INDICADORES_META = Object.values(
  IndicadorMetaComercial
);

const PERIODICIDADES_META = Object.values(
  PeriodicidadeMetaComercial
);

const STATUS_META = Object.values(
  StatusMetaComercial
);

const INCLUDE_META = {
  equipe: {
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  },

  funcionario: {
    select: {
      id: true,
      nome: true,
      cargo: true,
      ativo: true,
      statusFuncionario: true,

      departamento: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },

  curso: {
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  },

  polo: {
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativo: true,
      statusComercial: true,
    },
  },

  criadoPor: {
    select: {
      id: true,
      nome: true,
    },
  },

  atualizadoPor: {
    select: {
      id: true,
      nome: true,
    },
  },

  participantes: {
    select: {
      id: true,
      funcionarioId: true,
      inicioVigencia: true,
      fimVigencia: true,
      ativo: true,

      funcionario: {
        select: {
          id: true,
          nome: true,
          cargo: true,
          ativo: true,
          statusFuncionario: true,

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

} satisfies Prisma.MetaComercialInclude;

function limparTexto(
  valor: unknown,
  tamanhoMaximo: number
) {
  return String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, tamanhoMaximo);
}

function textoLongoOuNull(
  valor: unknown,
  tamanhoMaximo: number
) {
  const texto = String(valor ?? "")
    .trim()
    .slice(0, tamanhoMaximo);

  return texto || null;
}

function idOpcional(
  valor: unknown,
  nomeCampo: string
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const id = Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new ErroHttp(
      400,
      `${nomeCampo} informado é inválido.`,
      "ID_REFERENCIA_INVALIDO"
    );
  }

  return id;
}

function lerParticipanteIds(
  valor: unknown
): number[] | undefined {
  if (valor === undefined) {
    return undefined;
  }

  if (!Array.isArray(valor)) {
    throw new ErroHttp(
      400,
      "A lista de participantes da meta é inválida.",
      "PARTICIPANTES_INVALIDOS"
    );
  }

  const ids = valor.map(
    (item) => Number(item)
  );

  if (
    ids.some(
      (id) =>
        !Number.isInteger(id) ||
        id <= 0
    )
  ) {
    throw new ErroHttp(
      400,
      "A lista de participantes possui funcionário inválido.",
      "PARTICIPANTE_INVALIDO"
    );
  }

  return Array.from(
    new Set(ids)
  );
}

function lerEnumObrigatorio<
  T extends string,
>(
  valor: unknown,
  permitidos: readonly T[],
  mensagem: string,
  codigo: string
): T {
  const texto = String(
    valor ?? ""
  )
    .trim()
    .toUpperCase();

  if (
    !permitidos.includes(
      texto as T
    )
  ) {
    throw new ErroHttp(
      400,
      mensagem,
      codigo
    );
  }

  return texto as T;
}

function lerEnumOpcional<
  T extends string,
>(
  valor: unknown,
  permitidos: readonly T[],
  mensagem: string,
  codigo: string
): T | undefined {
  const texto = String(
    valor ?? ""
  )
    .trim()
    .toUpperCase();

  if (!texto) {
    return undefined;
  }

  if (
    !permitidos.includes(
      texto as T
    )
  ) {
    throw new ErroHttp(
      400,
      mensagem,
      codigo
    );
  }

  return texto as T;
}

function lerData(
  valor: unknown,
  nomeCampo: string,
  finalDoDia = false
) {
  const texto = String(
    valor ?? ""
  ).trim();

  if (!texto) {
    throw new ErroHttp(
      400,
      `Informe ${nomeCampo}.`,
      "DATA_OBRIGATORIA"
    );
  }

  let data: Date;

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    data = new Date(
      `${texto}T${finalDoDia
        ? "23:59:59.999"
        : "00:00:00.000"
      }Z`
    );
  } else {
    data = new Date(texto);
  }

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    throw new ErroHttp(
      400,
      `${nomeCampo} é inválida.`,
      "DATA_INVALIDA"
    );
  }

  return data;
}

function converterNumero(
  valor: unknown
) {
  if (
    typeof valor === "number"
  ) {
    return valor;
  }

  const texto = String(
    valor ?? ""
  ).trim();

  if (!texto) {
    return Number.NaN;
  }

  const normalizado =
    texto.includes(",")
      ? texto
        .replace(/\./g, "")
        .replace(",", ".")
      : texto;

  return Number(normalizado);
}

function lerValorAlvo(
  valor: unknown,
  indicador: IndicadorMetaComercial
) {
  const numero =
    converterNumero(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    throw new ErroHttp(
      400,
      "Informe um valor-alvo maior que zero.",
      "VALOR_ALVO_INVALIDO"
    );
  }

  const indicadorQuantidade =
    indicador ===
    IndicadorMetaComercial
      .QUANTIDADE_MATRICULAS ||
    indicador ===
    IndicadorMetaComercial
      .LEADS_CONVERTIDOS;

  if (
    indicadorQuantidade &&
    !Number.isInteger(numero)
  ) {
    throw new ErroHttp(
      400,
      "Para metas de quantidade, o valor-alvo deve ser um número inteiro.",
      "VALOR_ALVO_NAO_INTEIRO"
    );
  }

  return new Prisma.Decimal(
    indicadorQuantidade
      ? String(numero)
      : numero.toFixed(2)
  );
}

function obterContextoUsuario(
  user: any
) {
  const usuarioId = Number(
    user?.id
  );

  const instituicaoId = Number(
    user?.instituicaoId
  );

  if (
    !Number.isInteger(
      usuarioId
    ) ||
    usuarioId <= 0
  ) {
    throw new ErroHttp(
      401,
      "Usuário não identificado.",
      "USUARIO_INVALIDO"
    );
  }

  if (
    !Number.isInteger(
      instituicaoId
    ) ||
    instituicaoId <= 0
  ) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return {
    usuarioId,
    instituicaoId,
  };
}

async function validarPermissaoVisualizacao(
  user: any
) {
  const permitido =
    await usuarioPossuiPermissao(
      user,
      "comercial.metas.ver"
    );

  if (!permitido) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para visualizar metas comerciais.",
      "SEM_PERMISSAO"
    );
  }
}

async function validarPermissaoCriacao(
  user: any
) {
  const permitido =
    await usuarioPossuiPermissao(
      user,
      "comercial.metas.criar"
    );

  if (!permitido) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para criar metas comerciais.",
      "SEM_PERMISSAO"
    );
  }
}

async function validarReferencias({
  instituicaoId,
  escopo,
  equipeId,
  funcionarioId,
  cursoId,
  poloId,
}: {
  instituicaoId: number;
  escopo: EscopoMetaComercial;
  equipeId: number | null;
  funcionarioId: number | null;
  cursoId: number | null;
  poloId: number | null;
}) {
  if (
    escopo ===
    EscopoMetaComercial
      .INSTITUICAO &&
    (
      equipeId !== null ||
      funcionarioId !== null
    )
  ) {
    throw new ErroHttp(
      400,
      "Uma meta institucional não deve possuir equipe ou funcionário específico.",
      "ESCOPO_INSTITUICAO_INVALIDO"
    );
  }

  if (
    escopo ===
    EscopoMetaComercial
      .EQUIPE &&
    !equipeId
  ) {
    throw new ErroHttp(
      400,
      "Selecione a equipe responsável pela meta.",
      "EQUIPE_OBRIGATORIA"
    );
  }

  if (
    escopo ===
    EscopoMetaComercial
      .EQUIPE &&
    funcionarioId !== null
  ) {
    throw new ErroHttp(
      400,
      "Uma meta de equipe não deve possuir funcionário individual.",
      "FUNCIONARIO_INCOMPATIVEL"
    );
  }

  if (
    escopo ===
    EscopoMetaComercial
      .FUNCIONARIO &&
    !funcionarioId
  ) {
    throw new ErroHttp(
      400,
      "Selecione o funcionário responsável pela meta.",
      "FUNCIONARIO_OBRIGATORIO"
    );
  }

  if (
    escopo ===
    EscopoMetaComercial
      .FUNCIONARIO &&
    equipeId !== null
  ) {
    throw new ErroHttp(
      400,
      "Uma meta individual não deve possuir equipe específica.",
      "EQUIPE_INCOMPATIVEL"
    );
  }

  if (equipeId) {
    const equipe =
      await prisma.equipeComercial.findFirst({
        where: {
          id: equipeId,
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
        },
      });

    if (!equipe) {
      throw new ErroHttp(
        400,
        "A equipe informada não existe ou está inativa nesta instituição.",
        "EQUIPE_INVALIDA"
      );
    }
  }

  if (funcionarioId) {
    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          id: funcionarioId,
          instituicaoId,
          ativo: true,
          statusFuncionario:
            "ATIVO",
        },

        select: {
          id: true,
        },
      });

    if (!funcionario) {
      throw new ErroHttp(
        400,
        "O funcionário informado não existe ou está inativo nesta instituição.",
        "FUNCIONARIO_INVALIDO"
      );
    }
  }

  if (cursoId) {
    const curso =
      await prisma.curso.findFirst({
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
      throw new ErroHttp(
        400,
        "O curso informado não existe ou está inativo nesta instituição.",
        "CURSO_INVALIDO"
      );
    }
  }

  if (poloId) {
    const polo =
      await prisma.polo.findFirst({
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
      throw new ErroHttp(
        400,
        "O polo informado não existe ou está inativo nesta instituição.",
        "POLO_INVALIDO"
      );
    }
  }
}

async function prepararParticipantesMeta({
  instituicaoId,
  escopo,
  equipeId,
  participanteIds,
  dataInicio,
  dataFim,
}: {
  instituicaoId: number;
  escopo: EscopoMetaComercial;
  equipeId: number | null;
  participanteIds: number[] | undefined;
  dataInicio: Date;
  dataFim: Date;
}) {
  if (
    escopo !==
    EscopoMetaComercial.EQUIPE
  ) {
    if (
      participanteIds &&
      participanteIds.length > 0
    ) {
      throw new ErroHttp(
        400,
        "Participantes individuais da meta somente podem ser informados quando o escopo for uma equipe comercial.",
        "PARTICIPANTES_INCOMPATIVEIS"
      );
    }

    return [];
  }

  if (!equipeId) {
    throw new ErroHttp(
      400,
      "Selecione a equipe responsável pela meta.",
      "EQUIPE_OBRIGATORIA"
    );
  }

  if (
    participanteIds !== undefined &&
    participanteIds.length === 0
  ) {
    throw new ErroHttp(
      400,
      "Selecione pelo menos um participante para a meta da equipe.",
      "PARTICIPANTE_OBRIGATORIO"
    );
  }

  const membros =
    await prisma.equipeComercialMembro.findMany({
      where: {
        instituicaoId,
        equipeId,
        ativo: true,

        inicioVigencia: {
          lte: dataFim,
        },

        OR: [
          {
            fimVigencia: null,
          },
          {
            fimVigencia: {
              gte: dataInicio,
            },
          },
        ],

        funcionario: {
          ativo: true,
          statusFuncionario: "ATIVO",
        },

        ...(participanteIds !== undefined
          ? {
            funcionarioId: {
              in: participanteIds,
            },
          }
          : {}),
      },

      select: {
        funcionarioId: true,
        inicioVigencia: true,

        funcionario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

  if (membros.length === 0) {
    throw new ErroHttp(
      400,
      "A equipe selecionada não possui participantes ativos disponíveis para esta meta.",
      "EQUIPE_SEM_PARTICIPANTES"
    );
  }

  if (
    participanteIds !== undefined &&
    membros.length !==
    participanteIds.length
  ) {
    throw new ErroHttp(
      400,
      "Um ou mais participantes selecionados não pertencem à equipe ou não estão ativos.",
      "PARTICIPANTE_FORA_DA_EQUIPE"
    );
  }

  return membros.map(
    (membro) => ({
      funcionarioId:
        membro.funcionarioId,

      inicioVigencia:
        membro.inicioVigencia.getTime() >
          dataInicio.getTime()
          ? membro.inicioVigencia
          : dataInicio,

      fimVigencia:
        null as Date | null,

      ativo: true,
    })
  );
}

function serializarMeta(
  meta: any
) {
  return {
    ...meta,

    valorAlvo:
      Number(
        meta.valorAlvo
      ),
  };
}

function respostaErro(
  error: unknown
) {
  if (
    error instanceof ErroHttp
  ) {
    return NextResponse.json(
      {
        error: error.message,
        codigo: error.codigo,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(
    "Erro na API de metas comerciais:",
    error
  );

  return NextResponse.json(
    {
      error:
        "Não foi possível processar a meta comercial.",
    },
    {
      status: 500,
    }
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    await validarPermissaoVisualizacao(
      user
    );

    const {
      instituicaoId,
    } = obterContextoUsuario(
      user
    );

    const {
      searchParams,
    } = new URL(
      request.url
    );

    const busca = limparTexto(
      searchParams.get("q"),
      150
    );

    const status =
      lerEnumOpcional(
        searchParams.get(
          "status"
        ),
        STATUS_META,
        "O status informado é inválido.",
        "STATUS_INVALIDO"
      );

    const indicador =
      lerEnumOpcional(
        searchParams.get(
          "indicador"
        ),
        INDICADORES_META,
        "O indicador informado é inválido.",
        "INDICADOR_INVALIDO"
      );

    const escopo =
      lerEnumOpcional(
        searchParams.get(
          "escopo"
        ),
        ESCOPOS_META,
        "O escopo informado é inválido.",
        "ESCOPO_INVALIDO"
      );

    const [
      metas,
      equipes,
      funcionarios,
      cursos,
      polos,
    ] = await Promise.all([
      prisma.metaComercial.findMany({
        where: {
          instituicaoId,

          ...(status
            ? {
              status,
            }
            : {}),

          ...(indicador
            ? {
              indicador,
            }
            : {}),

          ...(escopo
            ? {
              escopo,
            }
            : {}),

          ...(busca
            ? {
              OR: [
                {
                  nome: {
                    contains: busca,
                    mode:
                      "insensitive",
                  },
                },

                {
                  descricao: {
                    contains: busca,
                    mode:
                      "insensitive",
                  },
                },

                {
                  equipe: {
                    is: {
                      nome: {
                        contains:
                          busca,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },

                {
                  funcionario: {
                    is: {
                      nome: {
                        contains:
                          busca,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },

                {
                  curso: {
                    is: {
                      nome: {
                        contains:
                          busca,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },

                {
                  polo: {
                    is: {
                      nome: {
                        contains:
                          busca,
                        mode:
                          "insensitive",
                      },
                    },
                  },
                },
              ],
            }
            : {}),
        },

        include:
          INCLUDE_META,

        orderBy: [
          {
            dataInicio:
              "desc",
          },
          {
            criadoEm:
              "desc",
          },
        ],
      }),

      prisma.equipeComercial.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,

          responsavelFuncionario: {
            select: {
              id: true,
              nome: true,
            },
          },

          membros: {
            where: {
              ativo: true,

              funcionario: {
                ativo: true,
                statusFuncionario:
                  "ATIVO",
              },
            },

            select: {
              id: true,
              funcionarioId: true,
              papel: true,
              inicioVigencia: true,
              fimVigencia: true,

              funcionario: {
                select: {
                  id: true,
                  nome: true,
                  cargo: true,

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

          _count: {
            select: {
              membros: {
                where: {
                  ativo: true,
                },
              },
            },
          },
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.funcionario.findMany({
        where: {
          instituicaoId,
          ativo: true,
          statusFuncionario:
            "ATIVO",
        },

        select: {
          id: true,
          nome: true,
          cargo: true,

          departamento: {
            select: {
              id: true,
              nome: true,
            },
          },
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.curso.findMany({
        where: {
          instituicaoId,
          ativo: true,
          excluidoEm: null,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.polo.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          codigo: true,
          statusComercial: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

    const metasComApuracao =
      await Promise.all(
        metas.map(
          async (meta) => {
            const apuracao =
              await apurarMetaComercial({
                id: meta.id,

                instituicaoId:
                  meta.instituicaoId,

                equipeId:
                  meta.equipeId,

                funcionarioId:
                  meta.funcionarioId,

                cursoId:
                  meta.cursoId,

                poloId:
                  meta.poloId,

                escopo:
                  meta.escopo,

                indicador:
                  meta.indicador,

                valorAlvo:
                  meta.valorAlvo,

                dataInicio:
                  meta.dataInicio,

                dataFim:
                  meta.dataFim,
              });

            return {
              ...serializarMeta(
                meta
              ),

              valorRealizado:
                apuracao
                  .valorRealizado,

              valorRestante:
                apuracao
                  .valorRestante,

              percentualAtingido:
                apuracao
                  .percentualAtingido,

              atingida:
                apuracao.atingida,

              unidadeMeta:
                apuracao.unidade,

              matriculasConsideradas:
                apuracao
                  .matriculasConsideradas,

              pagamentosConsiderados:
                apuracao
                  .pagamentosConsiderados,

              membrosEquipeConsiderados:
                apuracao
                  .membrosEquipeConsiderados,

              apuradoEm:
                apuracao.apuradoEm,
            };
          }
        )
      );

    return NextResponse.json(
      {
        metas:
          metasComApuracao,

        total:
          metas.length,

        catalogos: {
          equipes,
          funcionarios,
          cursos,
          polos,
        },

        opcoes: {
          escopos:
            ESCOPOS_META,

          indicadores:
            INDICADORES_META,

          periodicidades:
            PERIODICIDADES_META,

          status:
            STATUS_META,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return respostaErro(
      error
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    await validarPermissaoCriacao(
      user
    );

    const {
      usuarioId,
      instituicaoId,
    } = obterContextoUsuario(
      user
    );

    const body =
      (await request
        .json()
        .catch(
          () => ({})
        )) as Record<
          string,
          unknown
        >;

    const nome = limparTexto(
      body.nome,
      140
    );

    const descricao =
      textoLongoOuNull(
        body.descricao,
        2000
      );

    const observacoes =
      textoLongoOuNull(
        body.observacoes,
        4000
      );

    if (
      nome.length < 2
    ) {
      throw new ErroHttp(
        400,
        "Informe o nome da meta comercial.",
        "NOME_OBRIGATORIO"
      );
    }

    const escopo =
      lerEnumObrigatorio(
        body.escopo,
        ESCOPOS_META,
        "Selecione um escopo válido para a meta.",
        "ESCOPO_INVALIDO"
      );

    const indicador =
      lerEnumObrigatorio(
        body.indicador,
        INDICADORES_META,
        "Selecione um indicador válido para a meta.",
        "INDICADOR_INVALIDO"
      );

    const periodicidade =
      lerEnumObrigatorio(
        body.periodicidade,
        PERIODICIDADES_META,
        "Selecione uma periodicidade válida para a meta.",
        "PERIODICIDADE_INVALIDA"
      );

    const status =
      body.status ===
        undefined ||
        body.status === null ||
        body.status === ""
        ? StatusMetaComercial
          .RASCUNHO
        : lerEnumObrigatorio(
          body.status,
          STATUS_META,
          "O status informado é inválido.",
          "STATUS_INVALIDO"
        );

    if (
      status !==
      StatusMetaComercial
        .RASCUNHO &&
      status !==
      StatusMetaComercial
        .ATIVA
    ) {
      throw new ErroHttp(
        400,
        "Uma nova meta deve ser criada como rascunho ou ativa.",
        "STATUS_INICIAL_INVALIDO"
      );
    }

    const dataInicio =
      lerData(
        body.dataInicio,
        "a data inicial"
      );

    const dataFim =
      lerData(
        body.dataFim,
        "a data final",
        true
      );

    if (
      dataFim.getTime() <
      dataInicio.getTime()
    ) {
      throw new ErroHttp(
        400,
        "A data final não pode ser anterior à data inicial.",
        "PERIODO_INVALIDO"
      );
    }

    const valorAlvo =
      lerValorAlvo(
        body.valorAlvo,
        indicador
      );

    const equipeId =
      idOpcional(
        body.equipeId,
        "A equipe"
      );

    const funcionarioId =
      idOpcional(
        body.funcionarioId,
        "O funcionário"
      );

    const cursoId =
      idOpcional(
        body.cursoId,
        "O curso"
      );

    const poloId =
      idOpcional(
        body.poloId,
        "O polo"
      );

    const participanteIds =
      lerParticipanteIds(
        body.participanteIds
      );

    await validarReferencias({
      instituicaoId,
      escopo,
      equipeId,
      funcionarioId,
      cursoId,
      poloId,
    });

    const participantesMeta =
      await prepararParticipantesMeta({
        instituicaoId,
        escopo,
        equipeId,
        participanteIds,
        dataInicio,
        dataFim,
      });

    const metaDuplicada =
      await prisma.metaComercial.findFirst({
        where: {
          instituicaoId,

          nome: {
            equals: nome,
            mode:
              "insensitive",
          },

          escopo,
          indicador,
          dataInicio,
          dataFim,

          equipeId,
          funcionarioId,
          cursoId,
          poloId,

          status: {
            not:
              StatusMetaComercial
                .CANCELADA,
          },
        },

        select: {
          id: true,
        },
      });

    if (metaDuplicada) {
      throw new ErroHttp(
        409,
        "Já existe uma meta igual para este período e responsável.",
        "META_DUPLICADA"
      );
    }

        const meta =
      await prisma.$transaction(
        async (tx) => {
          const metaCriada =
            await tx.metaComercial.create({
              data: {
                instituicaoId,

                nome,
                descricao,
                observacoes,

                escopo,
                indicador,
                periodicidade,
                status,
                valorAlvo,

                dataInicio,
                dataFim,

                equipeId,
                funcionarioId,
                cursoId,
                poloId,

                criadoPorId:
                  usuarioId,

                atualizadoPorId:
                  usuarioId,
              },
            });

          if (
            escopo ===
              EscopoMetaComercial.EQUIPE &&
            participantesMeta.length > 0
          ) {
            await tx.metaComercialParticipante.createMany({
              data:
                participantesMeta.map(
                  (participante) => ({
                    instituicaoId,

                    metaId:
                      metaCriada.id,

                    funcionarioId:
                      participante
                        .funcionarioId,

                    criadoPorId:
                      usuarioId,

                    atualizadoPorId:
                      usuarioId,

                    inicioVigencia:
                      participante
                        .inicioVigencia,

                    fimVigencia:
                      participante
                        .fimVigencia,

                    ativo:
                      participante.ativo,
                  })
                ),
            });
          }

          const metaCompleta =
            await tx.metaComercial.findFirst({
              where: {
                id:
                  metaCriada.id,

                instituicaoId,
              },

              include:
                INCLUDE_META,
            });

          if (!metaCompleta) {
            throw new ErroHttp(
              500,
              "A meta foi criada, mas não pôde ser carregada.",
              "META_NAO_CARREGADA"
            );
          }

          return metaCompleta;
        }
      );

    return NextResponse.json(
      {
        mensagem:
          "Meta comercial criada com sucesso.",

        meta:
          serializarMeta(
            meta
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return respostaErro(
      error
    );
  }
}