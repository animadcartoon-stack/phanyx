import {
  PapelEquipeAtividadeExterna,
  TipoMembroEquipeAtividadeExterna,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    id: string;
  };
};

type ContextoUsuario = {
  id: number;
  instituicaoId: number;
  podeGerenciar: boolean;
  polosPermitidos: number[] | null;
};

function obterIdAtividade(
  contexto: ContextoRota
) {
  const atividadeId =
    Number(contexto.params.id);

  if (
    !Number.isInteger(
      atividadeId
    ) ||
    atividadeId <= 0
  ) {
    return null;
  }

  return atividadeId;
}

async function obterContextoUsuario(): Promise<
  ContextoUsuario | null
> {
  const token =
    await getUserFromToken();

  if (!token) {
    return null;
  }

  const usuario =
    await prisma.user.findFirst({
      where: {
        id: token.id,
        instituicaoId:
          token.instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
        instituicaoId: true,
        role: true,
        acessoTodosPolos: true,

        funcionario: {
          select: {
            ativo: true,
            statusFuncionario:
              true,

            permissoes: {
              where: {
                ativo: true,
              },

              select: {
                chave: true,
              },
            },

            departamento: {
              select: {
                permissoes: {
                  where: {
                    ativo: true,
                  },

                  select: {
                    chave: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!usuario) {
    return null;
  }

  const role =
    String(
      usuario.role || ""
    ).toUpperCase();

  const administrador =
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  let podeVer =
    administrador;

  let podeGerenciar =
    administrador;

  if (!administrador) {
    const funcionario =
      usuario.funcionario;

    if (
      funcionario &&
      funcionario.ativo &&
      funcionario
        .statusFuncionario ===
        "ATIVO"
    ) {
      const permissoes =
        new Set([
          ...(funcionario
            .permissoes || []
          ).map(
            (item) =>
              item.chave
          ),

          ...(funcionario
            .departamento
            ?.permissoes || []
          ).map(
            (item) =>
              item.chave
          ),
        ]);

      podeVer =
        permissoes.has(
          "atividades-externas.ver"
        ) ||
        permissoes.has(
          "atividades-externas.gerenciar"
        );

      podeGerenciar =
        permissoes.has(
          "atividades-externas.gerenciar"
        );
    }
  }

  if (!podeVer) {
    return null;
  }

  let polosPermitidos:
    | number[]
    | null = null;

  if (
    !usuario.acessoTodosPolos
  ) {
    const acessos =
      await prisma.userPolo.findMany({
        where: {
          userId: usuario.id,
          instituicaoId:
            usuario.instituicaoId,
          ativo: true,
        },

        select: {
          poloId: true,
        },
      });

    polosPermitidos =
      acessos.map(
        (item) =>
          item.poloId
      );
  }

  return {
    id: usuario.id,
    instituicaoId:
      usuario.instituicaoId,
    podeGerenciar,
    polosPermitidos,
  };
}

async function obterAtividade(
  atividadeId: number,
  usuario: ContextoUsuario
) {
  return prisma.atividadeExterna.findFirst({
    where: {
      id: atividadeId,

      instituicaoId:
        usuario.instituicaoId,

      ...(usuario
        .polosPermitidos !==
      null
        ? {
            OR: [
              {
                poloId: null,
              },
              {
                poloId: {
                  in: usuario
                    .polosPermitidos,
                },
              },
            ],
          }
        : {}),
    },

    select: {
      id: true,
      instituicaoId: true,
      poloId: true,
    },
  });
}

function limparTexto(
  valor: unknown,
  limite: number
) {
  if (
    typeof valor !==
    "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

export async function GET(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const atividadeId =
      obterIdAtividade(
        contexto
      );

    if (!atividadeId) {
      return NextResponse.json(
        {
          ok: false,
          error: "ID_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status: 403,
        }
      );
    }

    const atividade =
      await obterAtividade(
        atividadeId,
        usuario
      );

    if (!atividade) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ATIVIDADE_NAO_ENCONTRADA",
        },
        {
          status: 404,
        }
      );
    }

    const filtroPolo =
      usuario
        .polosPermitidos ===
      null
        ? {}
        : {
            OR: [
              {
                poloId: null,
              },
              {
                poloId: {
                  in: usuario
                    .polosPermitidos,
                },
              },
            ],
          };

    const [
      equipe,
      professores,
      funcionarios,
    ] =
      await Promise.all([
        prisma
          .atividadeExternaEquipe
          .findMany({
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,
            },

            select: {
              id: true,
              tipoMembro: true,
              papel: true,
              principal: true,

              userId: true,
              professorId: true,
              funcionarioId:
                true,

              nomeSnapshot:
                true,

              emailSnapshot:
                true,

              telefoneSnapshot:
                true,

              observacao:
                true,

              createdAt: true,
              updatedAt: true,
            },

            orderBy: [
              {
                principal:
                  "desc",
              },
              {
                nomeSnapshot:
                  "asc",
              },
            ],
          }),

        prisma.professor.findMany({
          where: {
            instituicaoId:
              usuario
                .instituicaoId,

            ativo: true,

            statusProfessor:
              "ATIVO",

            ...filtroPolo,
          },

          select: {
            id: true,
            nome: true,
            fotoPerfil: true,
            telefone: true,
            especialidade:
              true,
            titulacao: true,
            poloId: true,
            funcionarioId:
              true,
            userId: true,

            user: {
              select: {
                email: true,
              },
            },
          },

          orderBy: {
            nome: "asc",
          },
        }),

        prisma.funcionario.findMany({
          where: {
            instituicaoId:
              usuario
                .instituicaoId,

            ativo: true,

            statusFuncionario:
              "ATIVO",

            ...filtroPolo,
          },

          select: {
            id: true,
            nome: true,
            fotoPerfil: true,
            telefone: true,
            cargo: true,
            setor: true,
            poloId: true,
            userId: true,

            user: {
              select: {
                email: true,
              },
            },

            professor: {
              select: {
                id: true,
              },
            },
          },

          orderBy: {
            nome: "asc",
          },
        }),
      ]);

    return NextResponse.json({
      ok: true,

      podeGerenciar:
        usuario.podeGerenciar,

      equipe,

      opcoes: {
        professores:
          professores.map(
            (professor) => ({
              id:
                professor.id,

              nome:
                professor.nome,

              fotoPerfil:
                professor
                  .fotoPerfil,

              telefone:
                professor.telefone,

              email:
                professor.user
                  ?.email ||
                null,

              especialidade:
                professor
                  .especialidade,

              titulacao:
                professor
                  .titulacao,

              poloId:
                professor.poloId,

              funcionarioId:
                professor
                  .funcionarioId,
            })
          ),

        funcionarios:
          funcionarios.map(
            (
              funcionario
            ) => ({
              id:
                funcionario.id,

              nome:
                funcionario.nome,

              fotoPerfil:
                funcionario
                  .fotoPerfil,

              telefone:
                funcionario
                  .telefone,

              email:
                funcionario.user
                  ?.email ||
                null,

              cargo:
                funcionario.cargo,

              setor:
                funcionario.setor,

              poloId:
                funcionario.poloId,

              professorId:
                funcionario
                  .professor
                  ?.id ||
                null,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_EQUIPE_GET]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "ERRO_INTERNO",

        ...(process.env
          .NODE_ENV !==
        "production"
          ? {
              detalhe:
                error instanceof
                Error
                  ? error.message
                  : String(
                      error
                    ),
            }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const atividadeId =
      obterIdAtividade(
        contexto
      );

    if (!atividadeId) {
      return NextResponse.json(
        {
          ok: false,
          error: "ID_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !usuario.podeGerenciar
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SEM_PERMISSAO_GERENCIAR",
        },
        {
          status: 403,
        }
      );
    }

    const atividade =
      await obterAtividade(
        atividadeId,
        usuario
      );

    if (!atividade) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ATIVIDADE_NAO_ENCONTRADA",
        },
        {
          status: 404,
        }
      );
    }

    const corpo =
      await request
        .json()
        .catch(
          () => null
        );

    const tipoTexto =
      String(
        corpo?.tipoMembro ||
          ""
      ).trim();

    if (
      !Object.values(
        TipoMembroEquipeAtividadeExterna
      ).includes(
        tipoTexto as TipoMembroEquipeAtividadeExterna
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TIPO_MEMBRO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const papelTexto =
      String(
        corpo?.papel ||
          ""
      ).trim();

    if (
      !Object.values(
        PapelEquipeAtividadeExterna
      ).includes(
        papelTexto as PapelEquipeAtividadeExterna
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PAPEL_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const tipoMembro =
      tipoTexto as TipoMembroEquipeAtividadeExterna;

    const papel =
      papelTexto as PapelEquipeAtividadeExterna;

    const principal =
      corpo?.principal ===
      true;

    let userId:
      | number
      | null = null;

    let professorId:
      | number
      | null = null;

    let funcionarioId:
      | number
      | null = null;

    let nomeSnapshot =
      "";

    let emailSnapshot:
      | string
      | null = null;

    let telefoneSnapshot:
      | string
      | null = null;

    if (
      tipoMembro ===
      TipoMembroEquipeAtividadeExterna.PROFESSOR
    ) {
      const id =
        Number(
          corpo?.professorId
        );

      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PROFESSOR_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const professor =
        await prisma.professor.findFirst({
          where: {
            id,
            instituicaoId:
              usuario
                .instituicaoId,
            ativo: true,
            statusProfessor:
              "ATIVO",
          },

          select: {
            id: true,
            nome: true,
            telefone: true,
            userId: true,
            funcionarioId:
              true,

            user: {
              select: {
                email: true,
              },
            },
          },
        });

      if (!professor) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PROFESSOR_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      const duplicado =
        await prisma
          .atividadeExternaEquipe
          .findFirst({
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,

              OR: [
                {
                  professorId:
                    professor.id,
                },

                ...(professor
                  .funcionarioId
                  ? [
                      {
                        funcionarioId:
                          professor
                            .funcionarioId,
                      },
                    ]
                  : []),
              ],
            },

            select: {
              id: true,
            },
          });

      if (duplicado) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "MEMBRO_JA_ADICIONADO",
          },
          {
            status: 409,
          }
        );
      }

      professorId =
        professor.id;

      userId =
        professor.userId;

      nomeSnapshot =
        professor.nome;

      emailSnapshot =
        professor.user
          ?.email ||
        null;

      telefoneSnapshot =
        professor.telefone;
    } else if (
      tipoMembro ===
      TipoMembroEquipeAtividadeExterna.FUNCIONARIO
    ) {
      const id =
        Number(
          corpo?.funcionarioId
        );

      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "FUNCIONARIO_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const funcionario =
        await prisma.funcionario.findFirst({
          where: {
            id,
            instituicaoId:
              usuario
                .instituicaoId,
            ativo: true,
            statusFuncionario:
              "ATIVO",
          },

          select: {
            id: true,
            nome: true,
            telefone: true,
            userId: true,

            user: {
              select: {
                email: true,
              },
            },

            professor: {
              select: {
                id: true,
              },
            },
          },
        });

      if (!funcionario) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "FUNCIONARIO_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      const duplicado =
        await prisma
          .atividadeExternaEquipe
          .findFirst({
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,

              OR: [
                {
                  funcionarioId:
                    funcionario.id,
                },

                ...(funcionario
                  .professor
                  ?.id
                  ? [
                      {
                        professorId:
                          funcionario
                            .professor
                            .id,
                      },
                    ]
                  : []),
              ],
            },

            select: {
              id: true,
            },
          });

      if (duplicado) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "MEMBRO_JA_ADICIONADO",
          },
          {
            status: 409,
          }
        );
      }

      funcionarioId =
        funcionario.id;

      userId =
        funcionario.userId;

      nomeSnapshot =
        funcionario.nome;

      emailSnapshot =
        funcionario.user
          ?.email ||
        null;

      telefoneSnapshot =
        funcionario.telefone;
    } else {
      nomeSnapshot =
        limparTexto(
          corpo?.nome,
          200
        ) || "";

      if (!nomeSnapshot) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "NOME_OBRIGATORIO",
          },
          {
            status: 400,
          }
        );
      }

      emailSnapshot =
        limparTexto(
          corpo?.email,
          320
        );

      telefoneSnapshot =
        limparTexto(
          corpo?.telefone,
          80
        );
    }

    const observacao =
      limparTexto(
        corpo?.observacao,
        5000
      );

    const membro =
      await prisma.$transaction(
        async (tx) => {
          if (principal) {
            await tx
              .atividadeExternaEquipe
              .updateMany({
                where: {
                  instituicaoId:
                    usuario
                      .instituicaoId,

                  atividadeExternaId:
                    atividade.id,

                  principal:
                    true,
                },

                data: {
                  principal:
                    false,
                },
              });
          }

          return tx
            .atividadeExternaEquipe
            .create({
              data: {
                instituicaoId:
                  usuario
                    .instituicaoId,

                atividadeExternaId:
                  atividade.id,

                tipoMembro,
                papel,
                principal,

                userId,
                professorId,
                funcionarioId,

                nomeSnapshot,
                emailSnapshot,
                telefoneSnapshot,
                observacao,
              },
            });
        }
      );

    return NextResponse.json(
      {
        ok: true,
        membro,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_EQUIPE_POST]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "ERRO_INTERNO",

        ...(process.env
          .NODE_ENV !==
        "production"
          ? {
              detalhe:
                error instanceof
                Error
                  ? error.message
                  : String(
                      error
                    ),
            }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}