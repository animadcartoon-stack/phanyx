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
  valor: unknown,
  padrao = 0
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return padrao;
  }

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

function jsonOpcional(
  valor: unknown
): Prisma.InputJsonValue | undefined {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return undefined;
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
        detalhes: error.detalhes,
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
        "Não foi possível processar as regras de distribuição.",

      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function GET(
  req: NextRequest
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

    const busca =
      textoOuNull(
        req.nextUrl.searchParams.get(
          "busca"
        )
      );

    const estrategiaParam =
      req.nextUrl.searchParams.get(
        "estrategia"
      );

    const estrategia =
      estrategiaParam
        ? estrategiaOuNull(
            estrategiaParam
          )
        : null;

    if (
      estrategiaParam &&
      !estrategia
    ) {
      throw new ErroHttp(
        400,
        "Estratégia de distribuição inválida.",
        "ESTRATEGIA_INVALIDA"
      );
    }

    const ativoParam =
      req.nextUrl.searchParams.get(
        "ativo"
      );

    const ativo =
      ativoParam === null
        ? null
        : booleano(
            ativoParam
          );

    const [
      regras,
      canais,
      campanhas,
      formularios,
      equipes,
      responsaveis,
      cursos,
      polos,
    ] =
      await prisma.$transaction([
        prisma.regraDistribuicaoLead.findMany({
          where: {
            instituicaoId,

            ...(estrategia
              ? {
                  estrategia,
                }
              : {}),

            ...(ativo !== null
              ? {
                  ativo,
                }
              : {}),

            ...(busca
              ? {
                  OR: [
                    {
                      nome: {
                        contains:
                          busca,

                        mode:
                          "insensitive",
                      },
                    },

                    {
                      descricao: {
                        contains:
                          busca,

                        mode:
                          "insensitive",
                      },
                    },
                  ],
                }
              : {}),
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

          orderBy: [
            {
              ativo: "desc",
            },

            {
              ordemPrioridade:
                "asc",
            },

            {
              nome: "asc",
            },
          ],
        }),

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

    return NextResponse.json(
      {
        success: true,

        permissoes,

        estrategiasDisponiveis:
          Object.values(
            EstrategiaDistribuicaoLead
          ),

        resumo: {
          total:
            regras.length,

          ativas:
            regras.filter(
              (regra) =>
                regra.ativo
            ).length,

          inativas:
            regras.filter(
              (regra) =>
                !regra.ativo
            ).length,
        },

        referencias: {
          canais,
          campanhas,
          formularios,
          equipes,
          responsaveis,
          cursos,
          polos,
        },

        regras,
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
      "Erro ao consultar regras de distribuição:"
    );
  }
}

export async function POST(
  req: NextRequest
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
        "Você não possui permissão para cadastrar regras de distribuição.",
        "SEM_PERMISSAO"
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

    const nome =
      textoOuNull(
        body.nome
      );

    if (
      !nome ||
      nome.length > 180
    ) {
      throw new ErroHttp(
        400,
        "Informe o nome da regra com até 180 caracteres.",
        "NOME_INVALIDO"
      );
    }

    const duplicada =
      await prisma.regraDistribuicaoLead.findFirst({
        where: {
          instituicaoId,
          nome,
        },

        select: {
          id: true,
        },
      });

    if (duplicada) {
      throw new ErroHttp(
        409,
        "Já existe uma regra de distribuição com esse nome.",
        "REGRA_DUPLICADA",
        {
          regraId:
            duplicada.id,
        }
      );
    }

    const estrategia =
      estrategiaOuNull(
        body.estrategia
      ) ??
      EstrategiaDistribuicaoLead.RODIZIO;

    const descricao =
      textoOuNull(
        body.descricao
      );

    const ordemPrioridade =
      inteiroNaoNegativo(
        body.ordemPrioridade,
        0
      );

    if (
      ordemPrioridade ===
      null
    ) {
      throw new ErroHttp(
        400,
        "A prioridade da regra deve ser um número inteiro maior ou igual a zero.",
        "PRIORIDADE_INVALIDA"
      );
    }

    let maximoLeadsAbertosPorResponsavel:
      number | null = null;

    if (
      body.maximoLeadsAbertosPorResponsavel !==
        undefined &&
      body.maximoLeadsAbertosPorResponsavel !==
        null &&
      body.maximoLeadsAbertosPorResponsavel !==
        ""
    ) {
      const maximo =
        numeroPositivo(
          body.maximoLeadsAbertosPorResponsavel
        );

      if (!maximo) {
        throw new ErroHttp(
          400,
          "O limite de leads abertos deve ser um número inteiro maior que zero.",
          "LIMITE_LEADS_INVALIDO"
        );
      }

      maximoLeadsAbertosPorResponsavel =
        maximo;
    }

    const somenteMembrosAtivos =
      booleano(
        body.somenteMembrosAtivos,
        true
      );

    const respeitarDisponibilidade =
      booleano(
        body.respeitarDisponibilidade,
        true
      );

    const ativo =
      booleano(
        body.ativo,
        true
      );

    const criterios =
      jsonOpcional(
        body.criterios
      );

    const configuracao =
      jsonOpcional(
        body.configuracao
      );

    let canalId =
      numeroPositivo(
        body.canalId
      );

    let campanhaId =
      numeroPositivo(
        body.campanhaId
      );

    let formularioId =
      numeroPositivo(
        body.formularioId
      );

    const cursoId =
      numeroPositivo(
        body.cursoId
      );

    const poloId =
      numeroPositivo(
        body.poloId
      );

    const equipeId =
      numeroPositivo(
        body.equipeId
      );

    const responsavelFixoId =
      numeroPositivo(
        body.responsavelFixoId
      );

    const camposIds = [
      {
        campo: "canalId",
        valor: body.canalId,
        id: canalId,
      },

      {
        campo:
          "campanhaId",

        valor:
          body.campanhaId,

        id:
          campanhaId,
      },

      {
        campo:
          "formularioId",

        valor:
          body.formularioId,

        id:
          formularioId,
      },

      {
        campo: "cursoId",
        valor: body.cursoId,
        id: cursoId,
      },

      {
        campo: "poloId",
        valor: body.poloId,
        id: poloId,
      },

      {
        campo: "equipeId",
        valor: body.equipeId,
        id: equipeId,
      },

      {
        campo:
          "responsavelFixoId",

        valor:
          body.responsavelFixoId,

        id:
          responsavelFixoId,
      },
    ];

    for (
      const item of
      camposIds
    ) {
      if (
        item.valor !==
          undefined &&
        item.valor !==
          null &&
        item.valor !== "" &&
        !item.id
      ) {
        throw new ErroHttp(
          400,
          `O campo ${item.campo} é inválido.`,
          "REFERENCIA_INVALIDA"
        );
      }
    }

    if (canalId) {
      const canal =
        await prisma.canalCaptacaoLead.findFirst({
          where: {
            id: canalId,
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
    }

    if (campanhaId) {
      const campanha =
        await prisma.campanhaCaptacaoLead.findFirst({
          where: {
            id: campanhaId,
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

      if (
        canalId &&
        campanha.canalId &&
        campanha.canalId !==
          canalId
      ) {
        throw new ErroHttp(
          400,
          "A campanha selecionada pertence a outro canal.",
          "CAMPANHA_CANAL_DIVERGENTE"
        );
      }

      if (
        !canalId &&
        campanha.canalId
      ) {
        canalId =
          campanha.canalId;
      }
    }

    if (formularioId) {
      const formulario =
        await prisma.formularioCaptacaoLead.findFirst({
          where: {
            id: formularioId,
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

      if (
        canalId &&
        formulario.canalId &&
        formulario.canalId !==
          canalId
      ) {
        throw new ErroHttp(
          400,
          "O formulário selecionado pertence a outro canal.",
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
          "O formulário selecionado pertence a outra campanha.",
          "FORMULARIO_CAMPANHA_DIVERGENTE"
        );
      }

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
          "O curso selecionado não existe ou está inativo.",
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
          "O polo selecionado não existe ou está inativo.",
          "POLO_INVALIDO"
        );
      }
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
          "A equipe selecionada não existe ou está inativa.",
          "EQUIPE_INVALIDA"
        );
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

    if (responsavelFixoId) {
      const responsavel =
        await prisma.funcionario.findFirst({
          where: {
            id:
              responsavelFixoId,

            instituicaoId,

            ativo: true,

            statusFuncionario:
              "ATIVO",
          },

          select: {
            id: true,
          },
        });

      if (!responsavel) {
        throw new ErroHttp(
          400,
          "O responsável fixo selecionado não está ativo na instituição.",
          "RESPONSAVEL_FIXO_INVALIDO"
        );
      }
    }

    const regra =
      await prisma.regraDistribuicaoLead.create({
        data: {
          instituicaoId,

          canalId,
          campanhaId,
          formularioId,

          cursoId,
          poloId,

          equipeId,

          responsavelFixoId:
            estrategia ===
            EstrategiaDistribuicaoLead.RESPONSAVEL_FIXO
              ? responsavelFixoId
              : null,

          nome,
          descricao,

          estrategia,

          ordemPrioridade,

          maximoLeadsAbertosPorResponsavel,

          somenteMembrosAtivos,

          respeitarDisponibilidade,

          ...(criterios !==
          undefined
            ? {
                criterios,
              }
            : {}),

          ...(configuracao !==
          undefined
            ? {
                configuracao,
              }
            : {}),

          ativo,

          criadoPorId:
            user.id,

          atualizadoPorId:
            user.id,
        },

        select: {
          id: true,
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

          criadoEm: true,
          atualizadoEm: true,

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

          curso: {
            select: {
              id: true,
              nome: true,
            },
          },

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },

          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },

          responsavelFixo: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Regra de distribuição criada com sucesso.",

        regra,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao criar regra de distribuição:"
    );
  }
}