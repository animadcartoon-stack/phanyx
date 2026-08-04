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
      metas: true,
    },
  },
} satisfies Prisma.EquipeComercialInclude;

function parseId(valor: string) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function campoFoiInformado(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
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
    throw new ErroHttp(
      400,
      "A lista de membros informada é inválida.",
      "MEMBROS_INVALIDOS"
    );
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

function serializarEquipe(equipe: any) {
  return {
    ...equipe,

    totalMembrosAtivos:
      Array.isArray(equipe?.membros)
        ? equipe.membros.length
        : 0,
  };
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
    "Erro na rota individual de equipe comercial:",
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
    } = obterContextoUsuario(user);

    const id = parseId(params.id);

    if (!id) {
      throw new ErroHttp(
        400,
        "O ID da equipe é inválido.",
        "ID_INVALIDO"
      );
    }

    const equipe =
      await prisma.equipeComercial.findFirst({
        where: {
          id,
          instituicaoId,
        },

        include:
          INCLUDE_EQUIPE,
      });

    if (!equipe) {
      throw new ErroHttp(
        404,
        "Equipe comercial não encontrada.",
        "EQUIPE_NAO_ENCONTRADA"
      );
    }

    return NextResponse.json(
      {
        equipe:
          serializarEquipe(equipe),
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

    await validarPermissaoGerenciamento(
      user
    );

    const {
      usuarioId,
      instituicaoId,
    } = obterContextoUsuario(user);

    const id = parseId(params.id);

    if (!id) {
      throw new ErroHttp(
        400,
        "O ID da equipe é inválido.",
        "ID_INVALIDO"
      );
    }

    const equipeExistente =
      await prisma.equipeComercial.findFirst({
        where: {
          id,
          instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          descricao: true,
          ativo: true,
          responsavelFuncionarioId:
            true,

          membros: {
            where: {
              ativo: true,
            },

            select: {
              funcionarioId: true,
            },
          },
        },
      });

    if (!equipeExistente) {
      throw new ErroHttp(
        404,
        "Equipe comercial não encontrada.",
        "EQUIPE_NAO_ENCONTRADA"
      );
    }

    const body =
      (await request
        .json()
        .catch(() => ({}))) as Record<
        string,
        unknown
      >;

    const nomeFoiInformado =
      campoFoiInformado(
        body,
        "nome"
      );

    const descricaoFoiInformada =
      campoFoiInformado(
        body,
        "descricao"
      );

    const responsavelFoiInformado =
      campoFoiInformado(
        body,
        "responsavelFuncionarioId"
      );

    const membrosForamInformados =
      campoFoiInformado(
        body,
        "membroIds"
      );

    const ativoFoiInformado =
      campoFoiInformado(
        body,
        "ativo"
      );

    const nomeFinal =
      nomeFoiInformado
        ? limparTexto(
            body.nome,
            120
          )
        : equipeExistente.nome;

    if (nomeFinal.length < 2) {
      throw new ErroHttp(
        400,
        "Informe o nome da equipe comercial.",
        "NOME_OBRIGATORIO"
      );
    }

    const descricaoFinal =
      descricaoFoiInformada
        ? textoLongoOuNull(
            body.descricao,
            2000
          )
        : equipeExistente.descricao;

    const responsavelFinal =
      responsavelFoiInformado
        ? idOpcional(
            body.responsavelFuncionarioId
          )
        : equipeExistente
            .responsavelFuncionarioId;

    if (
      ativoFoiInformado &&
      typeof body.ativo !==
        "boolean"
    ) {
      throw new ErroHttp(
        400,
        "O status da equipe é inválido.",
        "STATUS_INVALIDO"
      );
    }

    const ativoFinal =
      ativoFoiInformado
        ? body.ativo === true
        : equipeExistente.ativo;

    const membrosAtuais =
      equipeExistente.membros.map(
        (membro) =>
          membro.funcionarioId
      );

    const membroIdsBase =
      membrosForamInformados
        ? normalizarIds(
            body.membroIds
          )
        : membrosAtuais;

    const membrosFinais =
      Array.from(
        new Set([
          ...membroIdsBase,

          ...(responsavelFinal
            ? [
                responsavelFinal,
              ]
            : []),
        ])
      );

    const equipeComMesmoNome =
      await prisma.equipeComercial.findFirst({
        where: {
          instituicaoId,

          id: {
            not: id,
          },

          nome: {
            equals: nomeFinal,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (equipeComMesmoNome) {
      throw new ErroHttp(
        409,
        "Já existe uma equipe comercial com este nome.",
        "EQUIPE_DUPLICADA"
      );
    }

    if (
      membrosFinais.length >
      0
    ) {
      const funcionariosValidos =
        await prisma.funcionario.findMany({
          where: {
            instituicaoId,

            id: {
              in: membrosFinais,
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
        membrosFinais.length
      ) {
        throw new ErroHttp(
          400,
          "Um ou mais membros não foram encontrados ou não estão ativos nesta instituição.",
          "MEMBRO_INVALIDO"
        );
      }
    }

    const equipeAtualizada =
      await prisma.$transaction(
        async (tx) => {
          const agora =
            new Date();

          await tx.equipeComercial.updateMany({
            where: {
              id,
              instituicaoId,
            },

            data: {
              nome:
                nomeFinal,

              descricao:
                descricaoFinal,

              responsavelFuncionarioId:
                responsavelFinal,

              ativo:
                ativoFinal,

              atualizadoPorId:
                usuarioId,
            },
          });

          if (
            membrosForamInformados ||
            responsavelFoiInformado
          ) {
            if (
              membrosFinais.length ===
              0
            ) {
              await tx
                .equipeComercialMembro
                .updateMany({
                  where: {
                    instituicaoId,
                    equipeId: id,
                    ativo: true,
                  },

                  data: {
                    ativo: false,

                    fimVigencia:
                      agora,

                    atualizadoPorId:
                      usuarioId,
                  },
                });
            } else {
              await tx
                .equipeComercialMembro
                .updateMany({
                  where: {
                    instituicaoId,
                    equipeId: id,
                    ativo: true,

                    funcionarioId: {
                      notIn:
                        membrosFinais,
                    },
                  },

                  data: {
                    ativo: false,

                    fimVigencia:
                      agora,

                    atualizadoPorId:
                      usuarioId,
                  },
                });
            }

            for (
              const funcionarioId of
              membrosFinais
            ) {
              await tx
                .equipeComercialMembro
                .upsert({
                  where: {
                    equipeId_funcionarioId:
                      {
                        equipeId: id,
                        funcionarioId,
                      },
                  },

                  update: {
                    ativo: true,

                    fimVigencia:
                      null,

                    papel:
                      funcionarioId ===
                      responsavelFinal
                        ? PapelMembroEquipeComercial.LIDER
                        : PapelMembroEquipeComercial.MEMBRO,

                    atualizadoPorId:
                      usuarioId,
                  },

                  create: {
                    instituicaoId,

                    equipeId: id,

                    funcionarioId,

                    criadoPorId:
                      usuarioId,

                    atualizadoPorId:
                      usuarioId,

                    papel:
                      funcionarioId ===
                      responsavelFinal
                        ? PapelMembroEquipeComercial.LIDER
                        : PapelMembroEquipeComercial.MEMBRO,

                    ativo: true,
                  },
                });
            }
          }

          return tx
            .equipeComercial
            .findFirst({
              where: {
                id,
                instituicaoId,
              },

              include:
                INCLUDE_EQUIPE,
            });
        }
      );

    if (!equipeAtualizada) {
      throw new ErroHttp(
        500,
        "A equipe foi atualizada, mas não pôde ser carregada.",
        "EQUIPE_NAO_CARREGADA"
      );
    }

    return NextResponse.json({
      mensagem:
        "Equipe comercial atualizada com sucesso.",

      equipe:
        serializarEquipe(
          equipeAtualizada
        ),
    });
  } catch (error) {
    return respostaErro(error);
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

    await validarPermissaoGerenciamento(
      user
    );

    const {
      usuarioId,
      instituicaoId,
    } = obterContextoUsuario(user);

    const id = parseId(params.id);

    if (!id) {
      throw new ErroHttp(
        400,
        "O ID da equipe é inválido.",
        "ID_INVALIDO"
      );
    }

    const resultado =
      await prisma.equipeComercial.updateMany({
        where: {
          id,
          instituicaoId,
        },

        data: {
          ativo: false,

          atualizadoPorId:
            usuarioId,
        },
      });

    if (resultado.count !== 1) {
      throw new ErroHttp(
        404,
        "Equipe comercial não encontrada.",
        "EQUIPE_NAO_ENCONTRADA"
      );
    }

    return NextResponse.json({
      mensagem:
        "Equipe comercial desativada com sucesso.",
    });
  } catch (error) {
    return respostaErro(error);
  }
}