import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PapelMembroEquipeComercial,
  Prisma,
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

const INCLUDE_EQUIPE = {
  responsavelFuncionario: {
    select: {
      id: true,
      nome: true,
      cargo: true,
      departamentoId: true,
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

  membros: {
  where: {
    ativo: true,
  },

  orderBy: {
    criadoEm: "asc",
  },

  include: {
    funcionario: {
      select: {
        id: true,
        nome: true,
        cargo: true,
        departamentoId: true,
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

  _count: {
  select: {
    membros: {
      where: {
        ativo: true,
      },
    },

    metas: true,
  },
},
} satisfies Prisma.EquipeComercialInclude;

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

function idOpcional(valor: unknown) {
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
      "O funcionário responsável informado é inválido.",
      "RESPONSAVEL_INVALIDO"
    );
  }

  return id;
}

function normalizarIds(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [] as number[];
  }

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

function obterContextoUsuario(user: any) {
  const usuarioId = Number(user?.id);
  const instituicaoId = Number(
    user?.instituicaoId
  );

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    throw new ErroHttp(
      401,
      "Usuário não identificado.",
      "USUARIO_INVALIDO"
    );
  }

  if (
    !Number.isInteger(instituicaoId) ||
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

async function possuiAlgumaPermissao(
  user: any,
  chaves: string[]
) {
  for (const chave of chaves) {
    const possui =
      await usuarioPossuiPermissao(
        user,
        chave
      );

    if (possui) {
      return true;
    }
  }

  return false;
}

async function validarPermissaoVisualizacao(
  user: any
) {
  const permitido =
    await possuiAlgumaPermissao(
      user,
      [
        "comercial.vendedores.ver",
        "comercial.vendedores.gerenciar",
        "comercial.metas.ver",
      ]
    );

  if (!permitido) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para visualizar equipes comerciais.",
      "SEM_PERMISSAO"
    );
  }
}

async function validarPermissaoGerenciamento(
  user: any
) {
  const permitido =
    await usuarioPossuiPermissao(
      user,
      "comercial.vendedores.gerenciar"
    );

  if (!permitido) {
    throw new ErroHttp(
      403,
      "Você não possui permissão para gerenciar equipes comerciais.",
      "SEM_PERMISSAO"
    );
  }
}

function respostaErro(error: unknown) {
  if (error instanceof ErroHttp) {
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
          "Já existe uma equipe comercial com este nome.",
        codigo:
          "EQUIPE_DUPLICADA",
      },
      {
        status: 409,
      }
    );
  }

  console.error(
    "Erro na API de equipes comerciais:",
    error
  );

  return NextResponse.json(
    {
      error:
        "Não foi possível processar a equipe comercial.",
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
    } = obterContextoUsuario(user);

    const { searchParams } =
      new URL(request.url);

    const busca = limparTexto(
      searchParams.get("q"),
      150
    );

    const ativoParametro =
      String(
        searchParams.get("ativo") ||
          ""
      )
        .trim()
        .toLowerCase();

    const filtroAtivo =
      ativoParametro === "true"
        ? true
        : ativoParametro === "false"
          ? false
          : undefined;

    const equipes =
      await prisma.equipeComercial.findMany({
        where: {
          instituicaoId,

          ...(filtroAtivo !==
          undefined
            ? {
                ativo: filtroAtivo,
              }
            : {}),

          ...(busca
            ? {
                OR: [
                  {
                    nome: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },

                  {
                    descricao: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },

                  {
                    responsavelFuncionario: {
                      is: {
                        nome: {
                          contains: busca,
                          mode: "insensitive",
                        },
                      },
                    },
                  },

                  {
                    membros: {
                      some: {
                        funcionario: {
                          nome: {
                            contains: busca,
                            mode: "insensitive",
                          },
                        },
                      },
                    },
                  },
                ],
              }
            : {}),
        },

        include:
          INCLUDE_EQUIPE,

        orderBy: [
          {
            ativo: "desc",
          },
          {
            nome: "asc",
          },
        ],
      });

    return NextResponse.json(
      {
        equipes,
        total: equipes.length,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return respostaErro(error);
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

    await validarPermissaoGerenciamento(
      user
    );

    const {
      usuarioId,
      instituicaoId,
    } = obterContextoUsuario(user);

    const body = await request
      .json()
      .catch(() => ({}));

    const nome = limparTexto(
      body?.nome,
      120
    );

    const descricao =
      textoLongoOuNull(
        body?.descricao,
        2000
      );

    const responsavelFuncionarioId =
      idOpcional(
        body?.responsavelFuncionarioId
      );

    const membroIds =
      normalizarIds(
        body?.membroIds
      );

    const ativo =
      body?.ativo !== false;

    if (nome.length < 2) {
      throw new ErroHttp(
        400,
        "Informe o nome da equipe comercial.",
        "NOME_OBRIGATORIO"
      );
    }

    const equipeExistente =
      await prisma.equipeComercial.findFirst({
        where: {
          instituicaoId,

          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (equipeExistente) {
      throw new ErroHttp(
        409,
        "Já existe uma equipe comercial com este nome.",
        "EQUIPE_DUPLICADA"
      );
    }

    const todosFuncionariosIds =
      Array.from(
        new Set([
          ...membroIds,

          ...(responsavelFuncionarioId
            ? [
                responsavelFuncionarioId,
              ]
            : []),
        ])
      );

    if (
      todosFuncionariosIds.length >
      0
    ) {
      const funcionariosValidos =
        await prisma.funcionario.findMany({
          where: {
            instituicaoId,

            id: {
              in: todosFuncionariosIds,
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
        todosFuncionariosIds.length
      ) {
        throw new ErroHttp(
          400,
          "Um ou mais membros não foram encontrados ou não estão ativos nesta instituição.",
          "MEMBRO_INVALIDO"
        );
      }
    }

    const equipe =
      await prisma.$transaction(
        async (tx) => {
          const equipeCriada =
            await tx.equipeComercial.create({
              data: {
                instituicaoId,
                nome,
                descricao,

                responsavelFuncionarioId,

                criadoPorId:
                  usuarioId,

                atualizadoPorId:
                  usuarioId,

                ativo,
              },
            });

          if (
            todosFuncionariosIds.length >
            0
          ) {
            await tx
              .equipeComercialMembro
              .createMany({
                data:
                  todosFuncionariosIds.map(
                    (funcionarioId) => ({
                      instituicaoId,

                      equipeId:
                        equipeCriada.id,

                      funcionarioId,

                      criadoPorId:
                        usuarioId,

                      atualizadoPorId:
                        usuarioId,

                      papel:
                        funcionarioId ===
                        responsavelFuncionarioId
                          ? PapelMembroEquipeComercial.LIDER
                          : PapelMembroEquipeComercial.MEMBRO,

                      ativo: true,
                    })
                  ),
              });
          }

          return tx
            .equipeComercial
            .findFirst({
              where: {
                id:
                  equipeCriada.id,

                instituicaoId,
              },

              include:
                INCLUDE_EQUIPE,
            });
        }
      );

    if (!equipe) {
      throw new ErroHttp(
        500,
        "A equipe foi criada, mas não pôde ser carregada.",
        "EQUIPE_NAO_CARREGADA"
      );
    }

    return NextResponse.json(
      {
        mensagem:
          "Equipe comercial criada com sucesso.",
        equipe,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return respostaErro(error);
  }
}