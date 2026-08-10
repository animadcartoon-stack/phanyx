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

    orderBy: [
      {
        ativo: "desc",
      },
      {
        inicioVigencia: "desc",
      },
    ],
  },
} satisfies Prisma.MetaComercialInclude;

function parseId(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function campoFoiInformado(
  objeto: Record<
    string,
    unknown
  >,
  campo: string
) {
  return Object.prototype
    .hasOwnProperty.call(
      objeto,
      campo
    );
}

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
  const texto = String(
    valor ?? ""
  )
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

async function validarPermissaoEdicao(
  user: any
) {
  const permitido =
    await usuarioPossuiPermissao(
      user,
      "comercial.metas.editar"
    );

  if (!permitido) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para editar metas comerciais.",
      "SEM_PERMISSAO"
    );
  }
}

async function validarPermissaoExclusao(
  user: any
) {
  const permitido =
    await usuarioPossuiPermissao(
      user,
      "comercial.metas.excluir"
    );

  if (!permitido) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para excluir metas comerciais.",
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
      await prisma
        .equipeComercial
        .findFirst({
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
      await prisma.funcionario
        .findFirst({
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

async function resolverParticipantesEquipe({
  instituicaoId,
  equipeId,
  participanteIds,
  dataInicio,
  dataFim,
}: {
  instituicaoId: number;
  equipeId: number | null;
  participanteIds: number[] | undefined;
  dataInicio: Date;
  dataFim: Date;
}) {
  if (!equipeId) {
    throw new ErroHttp(
      400,
      "Selecione a equipe responsável pela meta.",
      "EQUIPE_OBRIGATORIA"
    );
  }

  let idsDesejados: number[];

  /*
   * Se a seleção não foi enviada, usamos os membros
   * ativos da equipe como seleção inicial.
   *
   * Quando participanteIds for enviado, qualquer
   * funcionário ativo da instituição poderá participar,
   * mesmo que não pertença à equipe responsável.
   */
  if (participanteIds === undefined) {
    const membrosEquipe =
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
            statusFuncionario:
              "ATIVO",
          },
        },

        select: {
          funcionarioId: true,
        },
      });

    idsDesejados =
      Array.from(
        new Set<number>(
          membrosEquipe.map(
            (membro) =>
              Number(
                membro.funcionarioId
              )
          )
        )
      );
  } else {
    idsDesejados =
      Array.from(
        new Set<number>(
          participanteIds
        )
      );
  }

  if (
    idsDesejados.length === 0
  ) {
    throw new ErroHttp(
      400,
      "Selecione pelo menos um participante para a meta da equipe.",
      "PARTICIPANTE_OBRIGATORIO"
    );
  }

  const funcionariosValidos =
    await prisma.funcionario.findMany({
      where: {
        instituicaoId,

        id: {
          in: idsDesejados,
        },

        ativo: true,

        statusFuncionario:
          "ATIVO",
      },

      select: {
        id: true,
      },
    });

  if (
    funcionariosValidos.length !==
    idsDesejados.length
  ) {
    throw new ErroHttp(
      400,
      "Um ou mais participantes selecionados não existem, estão inativos ou não pertencem a esta instituição.",
      "PARTICIPANTE_INVALIDO"
    );
  }

  return idsDesejados;
}

async function sincronizarParticipantesMeta({
  tx,
  instituicaoId,
  metaId,
  usuarioId,
  escopoFinal,
  statusAtual,
  statusFinal,
  dataInicioFinal,
  participanteIdsDesejados,
}: {
  tx: Prisma.TransactionClient;
  instituicaoId: number;
  metaId: number;
  usuarioId: number;
  escopoFinal: EscopoMetaComercial;
  statusAtual: StatusMetaComercial;
  statusFinal: StatusMetaComercial;
  dataInicioFinal: Date;
  participanteIdsDesejados:
  | number[]
  | undefined;
}) {
  const agora = new Date();

  const participantesAtivos =
    await tx.metaComercialParticipante.findMany({
      where: {
        instituicaoId,
        metaId,
        ativo: true,
      },

      select: {
        id: true,
        funcionarioId: true,
        inicioVigencia: true,
      },
    });

  const idsAtivos =
    new Set(
      participantesAtivos.map(
        (participante) =>
          participante.funcionarioId
      )
    );

  const idsDesejados =
    new Set(
      participanteIdsDesejados ??
      []
    );

  const metaTerminada =
    statusFinal ===
    StatusMetaComercial.ENCERRADA ||
    statusFinal ===
    StatusMetaComercial.CANCELADA;

  const saiuDoEscopoEquipe =
    escopoFinal !==
    EscopoMetaComercial.EQUIPE;

  const participantesParaEncerrar =
    participantesAtivos.filter(
      (participante) =>
        metaTerminada ||
        saiuDoEscopoEquipe ||
        (
          participanteIdsDesejados !==
          undefined &&
          !idsDesejados.has(
            participante.funcionarioId
          )
        )
    );

  for (
    const participante of
    participantesParaEncerrar
  ) {
    if (
      statusAtual ===
      StatusMetaComercial.RASCUNHO &&
      statusFinal ===
      StatusMetaComercial.RASCUNHO
    ) {
      await tx.metaComercialParticipante.deleteMany({
        where: {
          id:
            participante.id,
          instituicaoId,
          metaId,
          ativo: true,
        },
      });

      continue;
    }

    const fimVigencia =
      agora.getTime() <
        participante
          .inicioVigencia
          .getTime()
        ? participante
          .inicioVigencia
        : agora;

    await tx.metaComercialParticipante.updateMany({
      where: {
        id:
          participante.id,
        instituicaoId,
        metaId,
        ativo: true,
      },

      data: {
        ativo: false,
        fimVigencia,
        atualizadoPorId:
          usuarioId,
      },
    });
  }

  if (
    escopoFinal ===
    EscopoMetaComercial.EQUIPE &&
    statusAtual ===
    StatusMetaComercial.RASCUNHO &&
    statusFinal ===
    StatusMetaComercial.RASCUNHO
  ) {
    await tx.metaComercialParticipante.updateMany({
      where: {
        instituicaoId,
        metaId,
        ativo: true,
      },

      data: {
        inicioVigencia:
          dataInicioFinal,

        atualizadoPorId:
          usuarioId,
      },
    });
  }

  if (
    metaTerminada ||
    saiuDoEscopoEquipe ||
    participanteIdsDesejados ===
    undefined
  ) {
    return;
  }

  const idsParaAdicionar =
    participanteIdsDesejados.filter(
      (funcionarioId) =>
        !idsAtivos.has(
          funcionarioId
        )
    );

  if (
    idsParaAdicionar.length === 0
  ) {
    return;
  }

  const inicioNovaParticipacao =
    statusAtual ===
      StatusMetaComercial.RASCUNHO
      ? dataInicioFinal
      : new Date(
        Math.max(
          agora.getTime(),
          dataInicioFinal.getTime()
        )
      );

  await tx.metaComercialParticipante.createMany({
    data:
      idsParaAdicionar.map(
        (funcionarioId) => ({
          instituicaoId,
          metaId,
          funcionarioId,

          criadoPorId:
            usuarioId,

          atualizadoPorId:
            usuarioId,

          inicioVigencia:
            inicioNovaParticipacao,

          fimVigencia:
            null,

          ativo: true,
        })
      ),
  });
}

function validarTransicaoStatus(
  statusAtual: StatusMetaComercial,
  statusFinal: StatusMetaComercial
) {
  if (
    statusAtual === statusFinal
  ) {
    return;
  }

  if (
    statusAtual ===
    StatusMetaComercial
      .ENCERRADA
  ) {
    throw new ErroHttp(
      409,
      "Uma meta encerrada não pode ser reaberta ou alterada.",
      "META_ENCERRADA"
    );
  }

  if (
    statusAtual ===
    StatusMetaComercial
      .CANCELADA
  ) {
    throw new ErroHttp(
      409,
      "Uma meta cancelada não pode ser reaberta ou alterada.",
      "META_CANCELADA"
    );
  }

  if (
    statusAtual ===
    StatusMetaComercial
      .RASCUNHO
  ) {
    const statusPermitidos:
      StatusMetaComercial[] = [
        StatusMetaComercial
          .ATIVA,
        StatusMetaComercial
          .CANCELADA,
      ];

    if (
      !statusPermitidos.includes(
        statusFinal
      )
    ) {
      throw new ErroHttp(
        400,
        "Uma meta em rascunho somente pode ser ativada ou cancelada.",
        "TRANSICAO_STATUS_INVALIDA"
      );
    }

    return;
  }

  if (
    statusAtual ===
    StatusMetaComercial
      .ATIVA
  ) {
    const statusPermitidos:
      StatusMetaComercial[] = [
        StatusMetaComercial
          .ENCERRADA,
        StatusMetaComercial
          .CANCELADA,
      ];

    if (
      !statusPermitidos.includes(
        statusFinal
      )
    ) {
      throw new ErroHttp(
        400,
        "Uma meta ativa somente pode ser encerrada ou cancelada.",
        "TRANSICAO_STATUS_INVALIDA"
      );
    }
  }
}

function serializarMeta(
  meta: any
) {
  return {
    ...meta,

    valorAlvo: Number(
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

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        error:
          "Já existe uma meta comercial com estes dados.",
        codigo:
          "META_DUPLICADA",
      },
      {
        status: 409,
      }
    );
  }

  console.error(
    "Erro na rota individual de meta comercial:",
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
  _request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
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

    const id = parseId(
      params.id
    );

    if (!id) {
      throw new ErroHttp(
        400,
        "O ID da meta é inválido.",
        "ID_INVALIDO"
      );
    }

    const meta =
      await prisma.metaComercial
        .findFirst({
          where: {
            id,
            instituicaoId,
          },

          include:
            INCLUDE_META,
        });

    if (!meta) {
      throw new ErroHttp(
        404,
        "Meta comercial não encontrada.",
        "META_NAO_ENCONTRADA"
      );
    }

    return NextResponse.json(
      {
        meta:
          serializarMeta(meta),
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

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
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

    await validarPermissaoEdicao(
      user
    );

    const {
      usuarioId,
      instituicaoId,
    } = obterContextoUsuario(
      user
    );

    const id = parseId(
      params.id
    );

    if (!id) {
      throw new ErroHttp(
        400,
        "O ID da meta é inválido.",
        "ID_INVALIDO"
      );
    }

    const metaExistente =
      await prisma.metaComercial
        .findFirst({
          where: {
            id,
            instituicaoId,
          },

          select: {
            id: true,
            nome: true,
            descricao: true,
            observacoes: true,
            escopo: true,
            indicador: true,
            periodicidade: true,
            status: true,
            valorAlvo: true,
            dataInicio: true,
            dataFim: true,
            equipeId: true,
            funcionarioId: true,
            cursoId: true,
            poloId: true,
          },
        });

    if (!metaExistente) {
      throw new ErroHttp(
        404,
        "Meta comercial não encontrada.",
        "META_NAO_ENCONTRADA"
      );
    }

    const body =
      (await request
        .json()
        .catch(
          () => ({})
        )) as Record<
          string,
          unknown
        >;

    const camposEditaveis = [
      "nome",
      "descricao",
      "observacoes",
      "escopo",
      "indicador",
      "periodicidade",
      "status",
      "valorAlvo",
      "dataInicio",
      "dataFim",
      "equipeId",
      "funcionarioId",
      "cursoId",
      "poloId",
      "participanteIds",
    ];

    const possuiAlteracao =
      camposEditaveis.some(
        (campo) =>
          campoFoiInformado(
            body,
            campo
          )
      );

    if (!possuiAlteracao) {
      throw new ErroHttp(
        400,
        "Nenhuma alteração foi informada.",
        "SEM_ALTERACOES"
      );
    }

    if (
      metaExistente.status ===
      StatusMetaComercial
        .ENCERRADA
    ) {
      throw new ErroHttp(
        409,
        "Uma meta encerrada não pode mais ser alterada.",
        "META_ENCERRADA"
      );
    }

    if (
      metaExistente.status ===
      StatusMetaComercial
        .CANCELADA
    ) {
      throw new ErroHttp(
        409,
        "Uma meta cancelada não pode mais ser alterada.",
        "META_CANCELADA"
      );
    }

    const nomeFinal =
      campoFoiInformado(
        body,
        "nome"
      )
        ? limparTexto(
          body.nome,
          140
        )
        : metaExistente.nome;

    if (
      nomeFinal.length < 2
    ) {
      throw new ErroHttp(
        400,
        "Informe o nome da meta comercial.",
        "NOME_OBRIGATORIO"
      );
    }

    const descricaoFinal =
      campoFoiInformado(
        body,
        "descricao"
      )
        ? textoLongoOuNull(
          body.descricao,
          2000
        )
        : metaExistente.descricao;

    const observacoesFinal =
      campoFoiInformado(
        body,
        "observacoes"
      )
        ? textoLongoOuNull(
          body.observacoes,
          4000
        )
        : metaExistente.observacoes;

    const escopoFinal =
      campoFoiInformado(
        body,
        "escopo"
      )
        ? lerEnumObrigatorio(
          body.escopo,
          ESCOPOS_META,
          "Selecione um escopo válido para a meta.",
          "ESCOPO_INVALIDO"
        )
        : metaExistente.escopo;

    const indicadorFinal =
      campoFoiInformado(
        body,
        "indicador"
      )
        ? lerEnumObrigatorio(
          body.indicador,
          INDICADORES_META,
          "Selecione um indicador válido para a meta.",
          "INDICADOR_INVALIDO"
        )
        : metaExistente.indicador;

    const periodicidadeFinal =
      campoFoiInformado(
        body,
        "periodicidade"
      )
        ? lerEnumObrigatorio(
          body.periodicidade,
          PERIODICIDADES_META,
          "Selecione uma periodicidade válida para a meta.",
          "PERIODICIDADE_INVALIDA"
        )
        : metaExistente
          .periodicidade;

    const statusFinal =
      campoFoiInformado(
        body,
        "status"
      )
        ? lerEnumObrigatorio(
          body.status,
          STATUS_META,
          "O status informado é inválido.",
          "STATUS_INVALIDO"
        )
        : metaExistente.status;

    validarTransicaoStatus(
      metaExistente.status,
      statusFinal
    );

    const dataInicioFinal =
      campoFoiInformado(
        body,
        "dataInicio"
      )
        ? lerData(
          body.dataInicio,
          "a data inicial"
        )
        : metaExistente
          .dataInicio;

    const dataFimFinal =
      campoFoiInformado(
        body,
        "dataFim"
      )
        ? lerData(
          body.dataFim,
          "a data final",
          true
        )
        : metaExistente
          .dataFim;

    if (
      dataFimFinal.getTime() <
      dataInicioFinal.getTime()
    ) {
      throw new ErroHttp(
        400,
        "A data final não pode ser anterior à data inicial.",
        "PERIODO_INVALIDO"
      );
    }

    const valorAlvoFinal =
      campoFoiInformado(
        body,
        "valorAlvo"
      ) ||
        indicadorFinal !==
        metaExistente.indicador
        ? lerValorAlvo(
          campoFoiInformado(
            body,
            "valorAlvo"
          )
            ? body.valorAlvo
            : Number(
              metaExistente
                .valorAlvo
            ),
          indicadorFinal
        )
        : metaExistente
          .valorAlvo;

    let equipeIdFinal =
      campoFoiInformado(
        body,
        "equipeId"
      )
        ? idOpcional(
          body.equipeId,
          "A equipe"
        )
        : metaExistente
          .equipeId;

    let funcionarioIdFinal =
      campoFoiInformado(
        body,
        "funcionarioId"
      )
        ? idOpcional(
          body.funcionarioId,
          "O funcionário"
        )
        : metaExistente
          .funcionarioId;

    const cursoIdFinal =
      campoFoiInformado(
        body,
        "cursoId"
      )
        ? idOpcional(
          body.cursoId,
          "O curso"
        )
        : metaExistente
          .cursoId;

    const poloIdFinal =
      campoFoiInformado(
        body,
        "poloId"
      )
        ? idOpcional(
          body.poloId,
          "O polo"
        )
        : metaExistente
          .poloId;

    const participanteIdsInformados =
      lerParticipanteIds(
        body.participanteIds
      );

    if (
      escopoFinal ===
      EscopoMetaComercial
        .INSTITUICAO
    ) {
      equipeIdFinal = null;
      funcionarioIdFinal = null;
    }

    if (
      escopoFinal ===
      EscopoMetaComercial
        .EQUIPE
    ) {
      funcionarioIdFinal = null;
    }

    if (
      escopoFinal ===
      EscopoMetaComercial
        .FUNCIONARIO
    ) {
      equipeIdFinal = null;
    }

    await validarReferencias({
      instituicaoId,
      escopo: escopoFinal,
      equipeId:
        equipeIdFinal,
      funcionarioId:
        funcionarioIdFinal,
      cursoId:
        cursoIdFinal,
      poloId:
        poloIdFinal,
    });

        if (
      escopoFinal !==
        EscopoMetaComercial.EQUIPE &&
      participanteIdsInformados !==
        undefined &&
      participanteIdsInformados.length >
        0
    ) {
      throw new ErroHttp(
        400,
        "Participantes da equipe somente podem ser selecionados em metas com escopo de equipe comercial.",
        "PARTICIPANTES_INCOMPATIVEIS"
      );
    }

    const equipeFoiAlterada =
      equipeIdFinal !==
      metaExistente.equipeId;

    const entrouNoEscopoEquipe =
      metaExistente.escopo !==
        EscopoMetaComercial.EQUIPE &&
      escopoFinal ===
        EscopoMetaComercial.EQUIPE;

    let participanteIdsDesejados:
      | number[]
      | undefined;

    if (
      escopoFinal ===
      EscopoMetaComercial.EQUIPE
    ) {
      if (
        participanteIdsInformados !==
          undefined ||
        equipeFoiAlterada ||
        entrouNoEscopoEquipe
      ) {
        participanteIdsDesejados =
          await resolverParticipantesEquipe({
            instituicaoId,
            equipeId:
              equipeIdFinal,

            participanteIds:
              participanteIdsInformados,

            dataInicio:
              dataInicioFinal,

            dataFim:
              dataFimFinal,
          });
      }
    } else if (
      metaExistente.escopo ===
        EscopoMetaComercial.EQUIPE
    ) {
      participanteIdsDesejados =
        [];
    }

    const metaDuplicada =
      await prisma.metaComercial
        .findFirst({
          where: {
            instituicaoId,

            id: {
              not: id,
            },

            nome: {
              equals:
                nomeFinal,
              mode:
                "insensitive",
            },

            escopo:
              escopoFinal,

            indicador:
              indicadorFinal,

            dataInicio:
              dataInicioFinal,

            dataFim:
              dataFimFinal,

            equipeId:
              equipeIdFinal,

            funcionarioId:
              funcionarioIdFinal,

            cursoId:
              cursoIdFinal,

            poloId:
              poloIdFinal,

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

        const metaAtualizada =
      await prisma.$transaction(
        async (tx) => {
          const resultado =
            await tx.metaComercial.updateMany({
              where: {
                id,
                instituicaoId,
              },

              data: {
                nome:
                  nomeFinal,

                descricao:
                  descricaoFinal,

                observacoes:
                  observacoesFinal,

                escopo:
                  escopoFinal,

                indicador:
                  indicadorFinal,

                periodicidade:
                  periodicidadeFinal,

                status:
                  statusFinal,

                valorAlvo:
                  valorAlvoFinal,

                dataInicio:
                  dataInicioFinal,

                dataFim:
                  dataFimFinal,

                equipeId:
                  equipeIdFinal,

                funcionarioId:
                  funcionarioIdFinal,

                cursoId:
                  cursoIdFinal,

                poloId:
                  poloIdFinal,

                atualizadoPorId:
                  usuarioId,
              },
            });

          if (
            resultado.count !== 1
          ) {
            throw new ErroHttp(
              404,
              "Meta comercial não encontrada.",
              "META_NAO_ENCONTRADA"
            );
          }

          await sincronizarParticipantesMeta({
            tx,
            instituicaoId,
            metaId: id,
            usuarioId,

            escopoFinal,

            statusAtual:
              metaExistente.status,

            statusFinal,

            dataInicioFinal,

            participanteIdsDesejados,
          });

          const metaCompleta =
            await tx.metaComercial.findFirst({
              where: {
                id,
                instituicaoId,
              },

              include:
                INCLUDE_META,
            });

          if (!metaCompleta) {
            throw new ErroHttp(
              500,
              "A meta foi atualizada, mas não pôde ser carregada.",
              "META_NAO_CARREGADA"
            );
          }

          return metaCompleta;
        }
      );

    const mensagem =
      statusFinal ===
        StatusMetaComercial
          .ENCERRADA &&
        metaExistente.status !==
        StatusMetaComercial
          .ENCERRADA
        ? "Meta comercial encerrada com sucesso."
        : statusFinal ===
          StatusMetaComercial
            .CANCELADA &&
          metaExistente.status !==
          StatusMetaComercial
            .CANCELADA
          ? "Meta comercial cancelada com sucesso."
          : statusFinal ===
            StatusMetaComercial
              .ATIVA &&
            metaExistente.status !==
            StatusMetaComercial
              .ATIVA
            ? "Meta comercial ativada com sucesso."
            : "Meta comercial atualizada com sucesso.";

    return NextResponse.json({
      mensagem,

      meta:
        serializarMeta(
          metaAtualizada
        ),
    });
  } catch (error) {
    return respostaErro(
      error
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
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

    await validarPermissaoExclusao(
      user
    );

    const {
      instituicaoId,
    } = obterContextoUsuario(
      user
    );

    const id = parseId(
      params.id
    );

    if (!id) {
      throw new ErroHttp(
        400,
        "O ID da meta é inválido.",
        "ID_INVALIDO"
      );
    }

    const metaExistente =
      await prisma.metaComercial
        .findFirst({
          where: {
            id,
            instituicaoId,
          },

          select: {
            id: true,
            status: true,
          },
        });

    if (!metaExistente) {
      throw new ErroHttp(
        404,
        "Meta comercial não encontrada.",
        "META_NAO_ENCONTRADA"
      );
    }

    if (
      metaExistente.status !==
      StatusMetaComercial
        .RASCUNHO
    ) {
      throw new ErroHttp(
        409,
        "Somente metas em rascunho podem ser excluídas. Metas ativas devem ser canceladas para preservar o histórico.",
        "META_NAO_PODE_SER_EXCLUIDA"
      );
    }

    const resultado =
      await prisma.metaComercial
        .deleteMany({
          where: {
            id,
            instituicaoId,
            status:
              StatusMetaComercial
                .RASCUNHO,
          },
        });

    if (
      resultado.count !== 1
    ) {
      throw new ErroHttp(
        409,
        "A meta não pôde ser excluída porque sua situação foi alterada.",
        "STATUS_META_ALTERADO"
      );
    }

    return NextResponse.json({
      mensagem:
        "Meta comercial excluída com sucesso.",
    });
  } catch (error) {
    return respostaErro(
      error
    );
  }
}