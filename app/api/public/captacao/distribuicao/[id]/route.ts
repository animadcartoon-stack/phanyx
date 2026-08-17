import {
  EstrategiaDistribuicaoLead,
  Prisma,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
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

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function ehMasterReal(
  user: UsuarioLogado
) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
      "academicophanyx@gmail.com"
  );
}

async function autenticarUsuario() {
  const user =
    await getUserFromToken();

  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId =
    Number(user.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return {
    user,
    instituicaoId,
  };
}

async function obterPermissoes(
  user: UsuarioLogado
) {
  if (ehMasterReal(user)) {
    return {
      podeVer: true,
      podeGerenciar: true,
    };
  }

  const [
    podeVer,
    podeGerenciar,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.distribuicao.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.distribuicao.gerenciar"
    ),
  ]);

  return {
    podeVer:
      podeVer ||
      podeGerenciar,

    podeGerenciar,
  };
}

function numeroPositivo(
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

function inteiroNaoNegativo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return (
    Number.isInteger(numero) &&
    numero >= 0
  )
    ? numero
    : null;
}

function textoOuNull(
  valor: unknown
) {
  const texto =
    String(valor ?? "").trim();

  return texto || null;
}

function booleano(
  valor: unknown,
  padrao = false
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    valor === "true" ||
    valor === "1" ||
    valor === 1
  ) {
    return true;
  }

  if (
    valor === "false" ||
    valor === "0" ||
    valor === 0
  ) {
    return false;
  }

  return padrao;
}

function possuiCampo(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
    objeto,
    campo
  );
}

function estrategiaOuNull(
  valor: unknown
): EstrategiaDistribuicaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      EstrategiaDistribuicaoLead;

  return Object.values(
    EstrategiaDistribuicaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function jsonParaPrisma(
  valor: unknown
):
  | Prisma.InputJsonValue
  | Prisma.NullTypes.JsonNull {
  if (
    valor === null ||
    valor === ""
  ) {
    return Prisma.JsonNull;
  }

  if (
    typeof valor === "string"
  ) {
    try {
      return JSON.parse(
        valor
      ) as Prisma.InputJsonValue;
    } catch {
      throw new ErroHttp(
        400,
        "Foi informada uma configuração JSON inválida.",
        "JSON_INVALIDO"
      );
    }
  }

  return valor as
    Prisma.InputJsonValue;
}

function responderErro(
  error: unknown,
  contexto: string
) {
  if (
    error instanceof ErroHttp
  ) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        codigo: error.codigo,
        detalhes:
          error.detalhes,
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
        success: false,

        error:
          "Já existe uma regra de distribuição com esse nome nesta instituição.",

        codigo:
          "REGRA_DUPLICADA",
      },
      {
        status: 409,
      }
    );
  }

  console.error(
    contexto,
    error
  );

  return NextResponse.json(
    {
      success: false,

      error:
        "Não foi possível processar a regra de distribuição.",

      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarRegra(
  id: number,
  instituicaoId: number
) {
  return prisma.regraDistribuicaoLead.findFirst({
    where: {
      id,
      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId: true,

      canalId: true,
      campanhaId: true,
      formularioId: true,
      cursoId: true,
      poloId: true,
      equipeId: true,
      responsavelFixoId:
        true,

      nome: true,
      descricao: true,

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
      configuracao: true,

      ativo: true,

      criadoPorId: true,
      atualizadoPorId:
        true,

      criadoEm: true,
      atualizadoEm: true,

      canal: {
        select: {
          id: true,
          nome: true,
          tipo: true,
          cor: true,
          ativo: true,
        },
      },

      campanha: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          status: true,
          ativo: true,
        },
      },

      formulario: {
        select: {
          id: true,
          nome: true,
          titulo: true,
          status: true,
          ativo: true,
        },
      },

      curso: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          ativo: true,
        },
      },

      polo: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          ativo: true,
        },
      },

      equipe: {
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      },

      responsavelFixo: {
        select: {
          id: true,
          nome: true,
          cargo: true,
          ativo: true,
          statusFuncionario:
            true,
        },
      },
    },
  });
}

async function obterReferencias(
  instituicaoId: number
) {
  const [
    canais,
    campanhas,
    formularios,
    equipes,
    responsaveis,
    cursos,
    polos,
  ] =
    await prisma.$transaction([
      prisma.canalCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          tipo: true,
          cor: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.campanhaCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          canalId: true,
          nome: true,
          codigo: true,
          status: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.formularioCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          canalId: true,
          campanhaId: true,
          nome: true,
          titulo: true,
          status: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.equipeComercial.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,

          responsavelFuncionarioId:
            true,

          _count: {
            select: {
              membros: true,
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
          poloId: true,
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
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

  return {
    canais,
    campanhas,
    formularios,
    equipes,
    responsaveis,
    cursos,
    polos,
  };
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permissoes =
      await obterPermissoes(
        user
      );

    if (!permissoes.podeVer) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar regras de distribuição.",
        "SEM_PERMISSAO"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Regra de distribuição inválida.",
        "REGRA_INVALIDA"
      );
    }

    const [
      regra,
      referencias,
    ] =
      await Promise.all([
        localizarRegra(
          id,
          instituicaoId
        ),

        obterReferencias(
          instituicaoId
        ),
      ]);

    if (!regra) {
      throw new ErroHttp(
        404,
        "Regra de distribuição não encontrada.",
        "REGRA_NAO_ENCONTRADA"
      );
    }

    return NextResponse.json(
      {
        success: true,

        permissoes,

        estrategiasDisponiveis:
          Object.values(
            EstrategiaDistribuicaoLead
          ),

        referencias,

        regra,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao consultar regra de distribuição:"
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permissoes =
      await obterPermissoes(
        user
      );

    if (
      !permissoes.podeGerenciar
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para editar regras de distribuição.",
        "SEM_PERMISSAO"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Regra de distribuição inválida.",
        "REGRA_INVALIDA"
      );
    }

    const atual =
      await localizarRegra(
        id,
        instituicaoId
      );

    if (!atual) {
      throw new ErroHttp(
        404,
        "Regra de distribuição não encontrada.",
        "REGRA_NAO_ENCONTRADA"
      );
    }

    const body =
      (await req
        .json()
        .catch(
          () => null
        )) as
        | Record<
            string,
            unknown
          >
        | null;

    if (!body) {
      throw new ErroHttp(
        400,
        "JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const camposPermitidos = [
      "canalId",
      "campanhaId",
      "formularioId",

      "cursoId",
      "poloId",

      "equipeId",
      "responsavelFixoId",

      "nome",
      "descricao",

      "estrategia",

      "ordemPrioridade",

      "maximoLeadsAbertosPorResponsavel",

      "somenteMembrosAtivos",
      "respeitarDisponibilidade",

      "criterios",
      "configuracao",

      "ativo",
    ];

    const possuiAlteracao =
      camposPermitidos.some(
        (campo) =>
          possuiCampo(
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

    let nome =
      atual.nome;

    if (
      possuiCampo(
        body,
        "nome"
      )
    ) {
      const informado =
        textoOuNull(
          body.nome
        );

      if (
        !informado ||
        informado.length >
          180
      ) {
        throw new ErroHttp(
          400,
          "Informe o nome da regra com até 180 caracteres.",
          "NOME_INVALIDO"
        );
      }

      nome =
        informado;
    }

    if (
      nome !== atual.nome
    ) {
      const duplicada =
        await prisma.regraDistribuicaoLead.findFirst({
          where: {
            instituicaoId,

            id: {
              not: id,
            },

            nome,
          },

          select: {
            id: true,
          },
        });

      if (duplicada) {
        throw new ErroHttp(
          409,
          "Já existe outra regra de distribuição com esse nome.",
          "REGRA_DUPLICADA",
          {
            regraId:
              duplicada.id,
          }
        );
      }
    }

    const descricao =
      possuiCampo(
        body,
        "descricao"
      )
        ? textoOuNull(
            body.descricao
          )
        : atual.descricao;

    let estrategia =
      atual.estrategia;

    if (
      possuiCampo(
        body,
        "estrategia"
      )
    ) {
      const informada =
        estrategiaOuNull(
          body.estrategia
        );

      if (!informada) {
        throw new ErroHttp(
          400,
          "Selecione uma estratégia de distribuição válida.",
          "ESTRATEGIA_INVALIDA"
        );
      }

      estrategia =
        informada;
    }

    let ordemPrioridade =
      atual.ordemPrioridade;

    if (
      possuiCampo(
        body,
        "ordemPrioridade"
      )
    ) {
      const informada =
        inteiroNaoNegativo(
          body.ordemPrioridade
        );

      if (
        informada ===
        null
      ) {
        throw new ErroHttp(
          400,
          "A prioridade deve ser um número inteiro maior ou igual a zero.",
          "PRIORIDADE_INVALIDA"
        );
      }

      ordemPrioridade =
        informada;
    }

    let maximoLeadsAbertosPorResponsavel =
      atual.maximoLeadsAbertosPorResponsavel;

    if (
      possuiCampo(
        body,
        "maximoLeadsAbertosPorResponsavel"
      )
    ) {
      if (
        body.maximoLeadsAbertosPorResponsavel ===
          null ||
        body.maximoLeadsAbertosPorResponsavel ===
          ""
      ) {
        maximoLeadsAbertosPorResponsavel =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.maximoLeadsAbertosPorResponsavel
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "O limite de leads abertos deve ser um número inteiro maior que zero.",
            "LIMITE_LEADS_INVALIDO"
          );
        }

        maximoLeadsAbertosPorResponsavel =
          informado;
      }
    }

    const somenteMembrosAtivos =
      possuiCampo(
        body,
        "somenteMembrosAtivos"
      )
        ? booleano(
            body.somenteMembrosAtivos,
            atual.somenteMembrosAtivos
          )
        : atual.somenteMembrosAtivos;

    const respeitarDisponibilidade =
      possuiCampo(
        body,
        "respeitarDisponibilidade"
      )
        ? booleano(
            body.respeitarDisponibilidade,
            atual.respeitarDisponibilidade
          )
        : atual.respeitarDisponibilidade;

    const ativo =
      possuiCampo(
        body,
        "ativo"
      )
        ? booleano(
            body.ativo,
            atual.ativo
          )
        : atual.ativo;

    let canalId =
      atual.canalId;

    let campanhaId =
      atual.campanhaId;

    let formularioId =
      atual.formularioId;

    let cursoId =
      atual.cursoId;

    let poloId =
      atual.poloId;

    let equipeId =
      atual.equipeId;

    let responsavelFixoId =
      atual.responsavelFixoId;

    if (
      possuiCampo(
        body,
        "canalId"
      )
    ) {
      if (
        body.canalId ===
          null ||
        body.canalId === ""
      ) {
        canalId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.canalId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione um canal válido.",
            "CANAL_INVALIDO"
          );
        }

        const canal =
          await prisma.canalCaptacaoLead.findFirst({
            where: {
              id: informado,
              instituicaoId,
              ativo: true,
            },

            select: {
              id: true,
            },
          });

        if (!canal) {
          throw new ErroHttp(
            400,
            "O canal selecionado não existe ou está inativo.",
            "CANAL_INVALIDO"
          );
        }

        canalId =
          informado;
      }
    }

    if (
      possuiCampo(
        body,
        "campanhaId"
      )
    ) {
      if (
        body.campanhaId ===
          null ||
        body.campanhaId === ""
      ) {
        campanhaId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.campanhaId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione uma campanha válida.",
            "CAMPANHA_INVALIDA"
          );
        }

        const campanha =
          await prisma.campanhaCaptacaoLead.findFirst({
            where: {
              id: informado,
              instituicaoId,
              ativo: true,
            },

            select: {
              id: true,
              canalId: true,
            },
          });

        if (!campanha) {
          throw new ErroHttp(
            400,
            "A campanha selecionada não existe ou está inativa.",
            "CAMPANHA_INVALIDA"
          );
        }

        campanhaId =
          informado;

        if (
          !canalId &&
          campanha.canalId
        ) {
          canalId =
            campanha.canalId;
        }
      }
    }

    if (
      possuiCampo(
        body,
        "formularioId"
      )
    ) {
      if (
        body.formularioId ===
          null ||
        body.formularioId ===
          ""
      ) {
        formularioId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.formularioId
          );

        if (!informado) {
          throw new ErroHttp(
            400,
            "Selecione um formulário válido.",
            "FORMULARIO_INVALIDO"
          );
        }

        const formulario =
          await prisma.formularioCaptacaoLead.findFirst({
            where: {
              id: informado,
              instituicaoId,
              ativo: true,
            },

            select: {
              id: true,
              canalId: true,
              campanhaId: true,
            },
          });

        if (!formulario) {
          throw new ErroHttp(
            400,
            "O formulário selecionado não existe ou está inativo.",
            "FORMULARIO_INVALIDO"
          );
        }

        formularioId =
          informado;

        if (
          !canalId &&
          formulario.canalId
        ) {
          canalId =
            formulario.canalId;
        }

        if (
          !campanhaId &&
          formulario.campanhaId
        ) {
          campanhaId =
            formulario.campanhaId;
        }
      }
    }

    /*
     * Após todas as alterações,
     * validamos a coerência final
     * canal → campanha → formulário.
     */
    if (campanhaId) {
      const campanha =
        await prisma.campanhaCaptacaoLead.findFirst({
          where: {
            id: campanhaId,
            instituicaoId,
          },

          select: {
            canalId: true,
          },
        });

      if (!campanha) {
        throw new ErroHttp(
          400,
          "A campanha vinculada não existe nesta instituição.",
          "CAMPANHA_INVALIDA"
        );
      }

      if (
        canalId &&
        campanha.canalId &&
        campanha.canalId !==
          canalId
      ) {
        throw new ErroHttp(
          400,
          "A campanha vinculada pertence a outro canal.",
          "CAMPANHA_CANAL_DIVERGENTE"
        );
      }
    }

    if (formularioId) {
      const formulario =
        await prisma.formularioCaptacaoLead.findFirst({
          where: {
            id: formularioId,
            instituicaoId,
          },

          select: {
            canalId: true,
            campanhaId: true,
          },
        });

      if (!formulario) {
        throw new ErroHttp(
          400,
          "O formulário vinculado não existe nesta instituição.",
          "FORMULARIO_INVALIDO"
        );
      }

      if (
        canalId &&
        formulario.canalId &&
        formulario.canalId !==
          canalId
      ) {
        throw new ErroHttp(
          400,
          "O formulário vinculado pertence a outro canal.",
          "FORMULARIO_CANAL_DIVERGENTE"
        );
      }

      if (
        campanhaId &&
        formulario.campanhaId &&
        formulario.campanhaId !==
          campanhaId
      ) {
        throw new ErroHttp(
          400,
          "O formulário vinculado pertence a outra campanha.",
          "FORMULARIO_CAMPANHA_DIVERGENTE"
        );
      }
    }

    if (
      possuiCampo(
        body,
        "cursoId"
      )
    ) {
      if (
        body.cursoId ===
          null ||
        body.cursoId === ""
      ) {
        cursoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.cursoId
          );

        const curso =
          informado
            ? await prisma.curso.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,
                  excluidoEm:
                    null,
                },

                select: {
                  id: true,
                },
              })
            : null;

        if (!curso) {
          throw new ErroHttp(
            400,
            "O curso selecionado não existe ou está inativo.",
            "CURSO_INVALIDO"
          );
        }

        cursoId =
          informado;
      }
    }

    if (
      possuiCampo(
        body,
        "poloId"
      )
    ) {
      if (
        body.poloId ===
          null ||
        body.poloId === ""
      ) {
        poloId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.poloId
          );

        const polo =
          informado
            ? await prisma.polo.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,
                },

                select: {
                  id: true,
                },
              })
            : null;

        if (!polo) {
          throw new ErroHttp(
            400,
            "O polo selecionado não existe ou está inativo.",
            "POLO_INVALIDO"
          );
        }

        poloId =
          informado;
      }
    }

    if (
      possuiCampo(
        body,
        "equipeId"
      )
    ) {
      if (
        body.equipeId ===
          null ||
        body.equipeId === ""
      ) {
        equipeId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.equipeId
          );

        const equipe =
          informado
            ? await prisma.equipeComercial.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,
                },

                select: {
                  id: true,
                },
              })
            : null;

        if (!equipe) {
          throw new ErroHttp(
            400,
            "A equipe selecionada não existe ou está inativa.",
            "EQUIPE_INVALIDA"
          );
        }

        equipeId =
          informado;
      }
    }

    if (
      possuiCampo(
        body,
        "responsavelFixoId"
      )
    ) {
      if (
        body.responsavelFixoId ===
          null ||
        body.responsavelFixoId ===
          ""
      ) {
        responsavelFixoId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.responsavelFixoId
          );

        const responsavel =
          informado
            ? await prisma.funcionario.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,

                  statusFuncionario:
                    "ATIVO",
                },

                select: {
                  id: true,
                },
              })
            : null;

        if (!responsavel) {
          throw new ErroHttp(
            400,
            "O responsável fixo selecionado não está ativo na instituição.",
            "RESPONSAVEL_FIXO_INVALIDO"
          );
        }

        responsavelFixoId =
          informado;
      }
    }

    if (
      estrategia ===
        EstrategiaDistribuicaoLead.RESPONSAVEL_FIXO &&
      !responsavelFixoId
    ) {
      throw new ErroHttp(
        400,
        "A estratégia de responsável fixo exige a seleção de um funcionário.",
        "RESPONSAVEL_FIXO_OBRIGATORIO"
      );
    }

    /*
     * Fora da estratégia
     * RESPONSAVEL_FIXO, esse vínculo
     * não participa do motor.
     *
     * Limpamos para evitar uma
     * configuração visual enganosa.
     */
    if (
      estrategia !==
      EstrategiaDistribuicaoLead.RESPONSAVEL_FIXO
    ) {
      responsavelFixoId =
        null;
    }

    let criterios:
      Prisma.InputJsonValue |
      Prisma.NullTypes.JsonNull =
        atual.criterios === null
          ? Prisma.JsonNull
          : atual.criterios as
              Prisma.InputJsonValue;

    if (
      possuiCampo(
        body,
        "criterios"
      )
    ) {
      criterios =
        jsonParaPrisma(
          body.criterios
        );
    }

    let configuracao:
      Prisma.InputJsonValue |
      Prisma.NullTypes.JsonNull =
        atual.configuracao ===
          null
          ? Prisma.JsonNull
          : atual.configuracao as
              Prisma.InputJsonValue;

    if (
      possuiCampo(
        body,
        "configuracao"
      )
    ) {
      configuracao =
        jsonParaPrisma(
          body.configuracao
        );
    }

    const mudouEstrategia =
      estrategia !==
      atual.estrategia;

    await prisma.regraDistribuicaoLead.update({
      where: {
        id,
      },

      data: {
        canalId,
        campanhaId,
        formularioId,

        cursoId,
        poloId,

        equipeId,
        responsavelFixoId,

        nome,
        descricao,

        estrategia,

        ordemPrioridade,

        maximoLeadsAbertosPorResponsavel,

        somenteMembrosAtivos,

        respeitarDisponibilidade,

        criterios,
        configuracao,

        ativo,

        /*
         * Ao mudar para outra
         * estratégia, zeramos o
         * cursor do rodízio.
         */
        ...(mudouEstrategia
          ? {
              proximoIndiceRodizio:
                0,
            }
          : {}),

        atualizadoPorId:
          user.id,
      },
    });

    const regra =
      await localizarRegra(
        id,
        instituicaoId
      );

    return NextResponse.json(
      {
        success: true,

        message:
          ativo
            ? "Regra de distribuição atualizada com sucesso."
            : "Regra de distribuição desativada com sucesso.",

        regra,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao editar regra de distribuição:"
    );
  }
}