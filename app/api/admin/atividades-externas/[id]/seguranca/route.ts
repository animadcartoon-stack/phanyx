import {
  CategoriaRiscoAtividadeExterna,
  GravidadeRiscoAtividadeExterna,
  PapelEquipeAtividadeExterna,
  ProbabilidadeRiscoAtividadeExterna,
  StatusPlanoEmergenciaAtividadeExterna,
  StatusRiscoAtividadeExterna,
  TipoCheckpointAtividadeExterna,
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

const CATEGORIAS_RISCO =
  Object.values(
    CategoriaRiscoAtividadeExterna
  );

const PROBABILIDADES_RISCO =
  Object.values(
    ProbabilidadeRiscoAtividadeExterna
  );

const GRAVIDADES_RISCO =
  Object.values(
    GravidadeRiscoAtividadeExterna
  );

const STATUS_RISCO =
  Object.values(
    StatusRiscoAtividadeExterna
  );

const STATUS_PLANO =
  Object.values(
    StatusPlanoEmergenciaAtividadeExterna
  );

const TIPOS_CHECKPOINT =
  Object.values(
    TipoCheckpointAtividadeExterna
  );

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

function limparTexto(
  valor: unknown,
  limite: number
) {
  if (
    typeof valor !== "string"
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

function obterId(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function valorEnum<
  T extends string
>(
  valor: unknown,
  valores: readonly T[]
): T | null {
  const texto =
    String(valor || "")
      .trim()
      .toUpperCase() as T;

  if (
    !valores.includes(texto)
  ) {
    return null;
  }

  return texto;
}

function parseData(
  valor: unknown
):
  | Date
  | null
  | "INVALIDA" {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const data =
    new Date(String(valor));

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "INVALIDA";
  }

  return data;
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

      responsavelPrincipalUserId:
        true,

      responsavelPrincipal: {
        select: {
          id: true,
          nome: true,
          email: true,

          funcionario: {
            select: {
              id: true,
              nome: true,
              telefone: true,
            },
          },

          professor: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
}

async function garantirResponsavelPrincipalNaEquipe(
  atividade: NonNullable<
    Awaited<
      ReturnType<
        typeof obterAtividade
      >
    >
  >,
  usuario: ContextoUsuario
) {
  const responsavel =
    atividade
      .responsavelPrincipal;

  if (
    !responsavel ||
    !atividade
      .responsavelPrincipalUserId
  ) {
    return null;
  }

  const professorId =
    responsavel.professor
      ?.id ||
    null;

  const funcionarioId =
    responsavel.funcionario
      ?.id ||
    null;

  const nomeSnapshot =
    responsavel.funcionario
      ?.nome ||
    responsavel.nome;

  const emailSnapshot =
    responsavel.email ||
    null;

  const telefoneSnapshot =
    responsavel.funcionario
      ?.telefone ||
    null;

  const tipoMembro =
    professorId
      ? TipoMembroEquipeAtividadeExterna
          .PROFESSOR
      : funcionarioId
        ? TipoMembroEquipeAtividadeExterna
            .FUNCIONARIO
        : TipoMembroEquipeAtividadeExterna
            .OUTRO;

  return prisma.$transaction(
    async (tx) => {
      /*
       * Impede duas requisi??es simult?neas
       * de criarem o mesmo respons?vel.
       * O PHANYX usa PostgreSQL/Neon.
       */
      await tx.$queryRawUnsafe(
        'SELECT "id" FROM "AtividadeExterna" WHERE "id" = $1::integer AND "instituicaoId" = $2::integer FOR UPDATE',
        atividade.id,
        usuario.instituicaoId
      );

      const criterios = [
        {
          userId:
            responsavel.id,
        },

        ...(professorId
          ? [
              {
                professorId,
              },
            ]
          : []),

        ...(funcionarioId
          ? [
              {
                funcionarioId,
              },
            ]
          : []),
      ];

      const existente =
        await tx
          .atividadeExternaEquipe
          .findFirst({
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,

              OR:
                criterios,
            },

            orderBy: [
              {
                principal:
                  "desc",
              },

              {
                id:
                  "asc",
              },
            ],
          });

      /*
       * Na equipe da atividade deve existir
       * apenas um membro principal.
       */
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

            ...(existente
              ? {
                  id: {
                    not:
                      existente.id,
                  },
                }
              : {}),
          },

          data: {
            principal:
              false,
          },
        });

      if (existente) {
        return tx
          .atividadeExternaEquipe
          .update({
            where: {
              id:
                existente.id,
            },

            data: {
              tipoMembro,

              papel:
                PapelEquipeAtividadeExterna
                  .RESPONSAVEL_GERAL,

              principal:
                true,

              userId:
                responsavel.id,

              professorId,

              funcionarioId,

              nomeSnapshot,

              emailSnapshot,

              telefoneSnapshot,
            },

            select: {
              id: true,
              nomeSnapshot: true,
              papel: true,
              principal: true,
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

            papel:
              PapelEquipeAtividadeExterna
                .RESPONSAVEL_GERAL,

            principal:
              true,

            userId:
              responsavel.id,

            professorId,

            funcionarioId,

            nomeSnapshot,

            emailSnapshot,

            telefoneSnapshot,
          },

          select: {
            id: true,
            nomeSnapshot: true,
            papel: true,
            principal: true,
          },
        });
    }
  );
}

async function obterResponsavelEquipe(
  responsavelEquipeId:
    | number
    | null,
  atividadeId: number,
  usuario: ContextoUsuario
) {
  if (!responsavelEquipeId) {
    return null;
  }

  return prisma.atividadeExternaEquipe.findFirst({
    where: {
      id: responsavelEquipeId,

      instituicaoId:
        usuario.instituicaoId,

      atividadeExternaId:
        atividadeId,
    },

    select: {
      id: true,
      nomeSnapshot: true,
      papel: true,
      principal: true,
    },
  });
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

    await garantirResponsavelPrincipalNaEquipe(
      atividade,
      usuario
    );

    const [
      riscos,
      planoEmergencia,
      checkpoints,
      equipe,
    ] = await Promise.all([
      prisma.atividadeExternaRisco.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          atividadeExternaId:
            atividade.id,
        },

        select: {
          id: true,
          titulo: true,
          descricao: true,
          categoria: true,
          probabilidade: true,
          gravidade: true,
          medidasPreventivas: true,
          planoResposta: true,
          responsavelEquipeId: true,
          status: true,
          observacao: true,
          createdAt: true,
          updatedAt: true,

          responsavelEquipe: {
            select: {
              id: true,
              nomeSnapshot: true,
              papel: true,
              principal: true,
            },
          },
        },

        orderBy: {
          id: "desc",
        },
      }),

      prisma
        .atividadeExternaPlanoEmergencia
        .findFirst({
          where: {
            instituicaoId:
              usuario.instituicaoId,

            atividadeExternaId:
              atividade.id,
          },
        }),

      prisma
        .atividadeExternaCheckpoint
        .findMany({
          where: {
            instituicaoId:
              usuario.instituicaoId,

            atividadeExternaId:
              atividade.id,
          },

          select: {
            id: true,
            nome: true,
            tipo: true,
            ordem: true,
            localNome: true,
            localEndereco: true,
            previstoEm: true,
            obrigatorio: true,
            ativo: true,
            observacao: true,
            createdAt: true,
            updatedAt: true,

            _count: {
              select: {
                registros: true,
              },
            },
          },

          orderBy: [
            {
              ordem: "asc",
            },
            {
              id: "asc",
            },
          ],
        }),

      prisma.atividadeExternaEquipe.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          atividadeExternaId:
            atividade.id,
        },

        select: {
          id: true,
          nomeSnapshot: true,
          papel: true,
          principal: true,
        },

        orderBy: [
          {
            principal: "desc",
          },
          {
            id: "asc",
          },
        ],
      }),
    ]);

    return NextResponse.json({
      ok: true,

      podeGerenciar:
        usuario.podeGerenciar,

      riscos,
      planoEmergencia,
      checkpoints,
      equipe,

      opcoes: {
        categoriasRisco:
          CATEGORIAS_RISCO,

        probabilidadesRisco:
          PROBABILIDADES_RISCO,

        gravidadesRisco:
          GRAVIDADES_RISCO,

        statusRisco:
          STATUS_RISCO,

        statusPlano:
          STATUS_PLANO,

        tiposCheckpoint:
          TIPOS_CHECKPOINT,
      },
    });
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_SEGURANCA_GET]",
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

    await garantirResponsavelPrincipalNaEquipe(
      atividade,
      usuario
    );

    const corpo =
      await request
        .json()
        .catch(
          () => null
        );

    if (!corpo) {
      return NextResponse.json(
        {
          ok: false,
          error: "CORPO_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const acao =
      limparTexto(
        corpo?.acao,
        80
      )?.toUpperCase();

    if (!acao) {
      return NextResponse.json(
        {
          ok: false,
          error: "ACAO_INVALIDA",
        },
        {
          status: 400,
        }
      );
    }

    if (
      acao === "CRIAR_RISCO" ||
      acao === "ATUALIZAR_RISCO"
    ) {
      const riscoId =
        acao ===
        "ATUALIZAR_RISCO"
          ? obterId(
              corpo?.riscoId
            )
          : null;

      if (
        acao ===
          "ATUALIZAR_RISCO" &&
        !riscoId
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "RISCO_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const riscoExistente =
        riscoId
          ? await prisma
              .atividadeExternaRisco
              .findFirst({
                where: {
                  id: riscoId,

                  instituicaoId:
                    usuario
                      .instituicaoId,

                  atividadeExternaId:
                    atividade.id,
                },
              })
          : null;

      if (
        riscoId &&
        !riscoExistente
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "RISCO_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      const titulo =
        limparTexto(
          corpo?.titulo,
          300
        );

      if (!titulo) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "TITULO_OBRIGATORIO",
          },
          {
            status: 400,
          }
        );
      }

      const categoria =
        valorEnum(
          corpo?.categoria,
          CATEGORIAS_RISCO
        );

      const probabilidade =
        valorEnum(
          corpo?.probabilidade,
          PROBABILIDADES_RISCO
        );

      const gravidade =
        valorEnum(
          corpo?.gravidade,
          GRAVIDADES_RISCO
        );

      const status =
        corpo?.status
          ? valorEnum(
              corpo.status,
              STATUS_RISCO
            )
          : riscoExistente
              ?.status ||
            StatusRiscoAtividadeExterna
              .IDENTIFICADO;

      if (
        !categoria ||
        !probabilidade ||
        !gravidade ||
        !status
      ) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "CLASSIFICACAO_RISCO_INVALIDA",
          },
          {
            status: 400,
          }
        );
      }

      const responsavelEquipeId =
        obterId(
          corpo?.responsavelEquipeId
        );

      if (
        corpo?.responsavelEquipeId &&
        !responsavelEquipeId
      ) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "RESPONSAVEL_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      if (
        responsavelEquipeId
      ) {
        const responsavel =
          await obterResponsavelEquipe(
            responsavelEquipeId,
            atividade.id,
            usuario
          );

        if (!responsavel) {
          return NextResponse.json(
            {
              ok: false,

              error:
                "RESPONSAVEL_NAO_ENCONTRADO",
            },
            {
              status: 404,
            }
          );
        }
      }

      const dados = {
        titulo,

        descricao:
          limparTexto(
            corpo?.descricao,
            10000
          ),

        categoria,

        probabilidade,

        gravidade,

        medidasPreventivas:
          limparTexto(
            corpo?.medidasPreventivas,
            20000
          ),

        planoResposta:
          limparTexto(
            corpo?.planoResposta,
            20000
          ),

        responsavelEquipeId,

        status,

        observacao:
          limparTexto(
            corpo?.observacao,
            10000
          ),

        atualizadoPorId:
          usuario.id,
      };

      const risco =
        riscoId
          ? await prisma
              .atividadeExternaRisco
              .update({
                where: {
                  id: riscoId,
                },

                data: dados,

                include: {
                  responsavelEquipe: {
                    select: {
                      id: true,
                      nomeSnapshot:
                        true,
                      papel: true,
                      principal: true,
                    },
                  },
                },
              })
          : await prisma
              .atividadeExternaRisco
              .create({
                data: {
                  instituicaoId:
                    usuario
                      .instituicaoId,

                  atividadeExternaId:
                    atividade.id,

                  ...dados,

                  criadoPorId:
                    usuario.id,
                },

                include: {
                  responsavelEquipe: {
                    select: {
                      id: true,
                      nomeSnapshot:
                        true,
                      papel: true,
                      principal: true,
                    },
                  },
                },
              });

      return NextResponse.json(
        {
          ok: true,
          acao,
          risco,
        },
        {
          status:
            riscoId
              ? 200
              : 201,
        }
      );
    }

    if (
      acao === "REMOVER_RISCO"
    ) {
      const riscoId =
        obterId(
          corpo?.riscoId
        );

      if (!riscoId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "RISCO_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const risco =
        await prisma
          .atividadeExternaRisco
          .findFirst({
            where: {
              id: riscoId,

              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,
            },

            select: {
              id: true,
            },
          });

      if (!risco) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "RISCO_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      await prisma
        .atividadeExternaRisco
        .delete({
          where: {
            id: risco.id,
          },
        });

      return NextResponse.json({
        ok: true,
        acao,
        riscoId: risco.id,
      });
    }

    if (
      acao ===
      "SALVAR_PLANO_EMERGENCIA"
    ) {
      const status =
        corpo?.status
          ? valorEnum(
              corpo.status,
              STATUS_PLANO
            )
          : StatusPlanoEmergenciaAtividadeExterna
              .RASCUNHO;

      if (!status) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "STATUS_PLANO_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const dadosPlano = {
        status,

        contatoEmergenciaEscola:
          limparTexto(
            corpo
              ?.contatoEmergenciaEscola,
            300
          ),

        telefoneEmergenciaEscola:
          limparTexto(
            corpo
              ?.telefoneEmergenciaEscola,
            100
          ),

        responsavelEmergenciaNome:
          limparTexto(
            corpo
              ?.responsavelEmergenciaNome,
            300
          ),

        responsavelEmergenciaTelefone:
          limparTexto(
            corpo
              ?.responsavelEmergenciaTelefone,
            100
          ),

        numeroEmergenciaLocal:
          limparTexto(
            corpo
              ?.numeroEmergenciaLocal,
            100
          ),

        hospitalReferencia:
          limparTexto(
            corpo
              ?.hospitalReferencia,
            500
          ),

        enderecoHospitalReferencia:
          limparTexto(
            corpo
              ?.enderecoHospitalReferencia,
            1000
          ),

        telefoneHospitalReferencia:
          limparTexto(
            corpo
              ?.telefoneHospitalReferencia,
            100
          ),

        servicoAlternativoEmergencia:
          limparTexto(
            corpo
              ?.servicoAlternativoEmergencia,
            500
          ),

        telefoneServicoAlternativo:
          limparTexto(
            corpo
              ?.telefoneServicoAlternativo,
            100
          ),

        pontoEncontroEmergencia:
          limparTexto(
            corpo
              ?.pontoEncontroEmergencia,
            10000
          ),

        procedimentoEvacuacao:
          limparTexto(
            corpo
              ?.procedimentoEvacuacao,
            20000
          ),

        procedimentoAcidente:
          limparTexto(
            corpo
              ?.procedimentoAcidente,
            20000
          ),

        procedimentoPessoaDesaparecida:
          limparTexto(
            corpo
              ?.procedimentoPessoaDesaparecida,
            20000
          ),

        procedimentoEmergenciaMedica:
          limparTexto(
            corpo
              ?.procedimentoEmergenciaMedica,
            20000
          ),

        procedimentoClimaSevero:
          limparTexto(
            corpo
              ?.procedimentoClimaSevero,
            20000
          ),

        instrucoesGerais:
          limparTexto(
            corpo
              ?.instrucoesGerais,
            20000
          ),

        observacao:
          limparTexto(
            corpo?.observacao,
            10000
          ),

        atualizadoPorId:
          usuario.id,
      };

      const planoEmergencia =
        await prisma
          .atividadeExternaPlanoEmergencia
          .upsert({
            where: {
              atividadeExternaId_instituicaoId:
                {
                  atividadeExternaId:
                    atividade.id,

                  instituicaoId:
                    usuario
                      .instituicaoId,
                },
            },

            create: {
              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,

              ...dadosPlano,

              criadoPorId:
                usuario.id,
            },

            update:
              dadosPlano,
          });

      return NextResponse.json({
        ok: true,
        acao,
        planoEmergencia,
      });
    }

    if (
      acao ===
        "CRIAR_CHECKPOINT" ||
      acao ===
        "ATUALIZAR_CHECKPOINT"
    ) {
      const checkpointId =
        acao ===
        "ATUALIZAR_CHECKPOINT"
          ? obterId(
              corpo?.checkpointId
            )
          : null;

      if (
        acao ===
          "ATUALIZAR_CHECKPOINT" &&
        !checkpointId
      ) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "CHECKPOINT_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const checkpointExistente =
        checkpointId
          ? await prisma
              .atividadeExternaCheckpoint
              .findFirst({
                where: {
                  id:
                    checkpointId,

                  instituicaoId:
                    usuario
                      .instituicaoId,

                  atividadeExternaId:
                    atividade.id,
                },
              })
          : null;

      if (
        checkpointId &&
        !checkpointExistente
      ) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "CHECKPOINT_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      const nome =
        limparTexto(
          corpo?.nome,
          300
        );

      if (!nome) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "NOME_CHECKPOINT_OBRIGATORIO",
          },
          {
            status: 400,
          }
        );
      }

      const tipo =
        valorEnum(
          corpo?.tipo,
          TIPOS_CHECKPOINT
        );

      if (!tipo) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "TIPO_CHECKPOINT_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const previstoEm =
        parseData(
          corpo?.previstoEm
        );

      if (
        previstoEm ===
        "INVALIDA"
      ) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "DATA_CHECKPOINT_INVALIDA",
          },
          {
            status: 400,
          }
        );
      }

      let ordem =
        checkpointExistente
          ?.ordem ||
        1;

      if (!checkpointId) {
        const ultimo =
          await prisma
            .atividadeExternaCheckpoint
            .aggregate({
              where: {
                instituicaoId:
                  usuario
                    .instituicaoId,

                atividadeExternaId:
                  atividade.id,
              },

              _max: {
                ordem: true,
              },
            });

        ordem =
          (
            ultimo._max
              .ordem || 0
          ) + 1;
      }

      const dados = {
        nome,
        tipo,
        ordem,

        localNome:
          limparTexto(
            corpo?.localNome,
            500
          ),

        localEndereco:
          limparTexto(
            corpo?.localEndereco,
            1000
          ),

        previstoEm,

        obrigatorio:
          typeof corpo
              ?.obrigatorio ===
            "boolean"
            ? corpo.obrigatorio
            : checkpointExistente
                ?.obrigatorio ??
              true,

        ativo:
          typeof corpo
              ?.ativo ===
            "boolean"
            ? corpo.ativo
            : checkpointExistente
                ?.ativo ??
              true,

        observacao:
          limparTexto(
            corpo?.observacao,
            10000
          ),

        atualizadoPorId:
          usuario.id,
      };

      const checkpoint =
        checkpointId
          ? await prisma
              .atividadeExternaCheckpoint
              .update({
                where: {
                  id:
                    checkpointId,
                },

                data: dados,

                include: {
                  _count: {
                    select: {
                      registros: true,
                    },
                  },
                },
              })
          : await prisma
              .atividadeExternaCheckpoint
              .create({
                data: {
                  instituicaoId:
                    usuario
                      .instituicaoId,

                  atividadeExternaId:
                    atividade.id,

                  ...dados,

                  criadoPorId:
                    usuario.id,
                },

                include: {
                  _count: {
                    select: {
                      registros: true,
                    },
                  },
                },
              });

      return NextResponse.json(
        {
          ok: true,
          acao,
          checkpoint,
        },
        {
          status:
            checkpointId
              ? 200
              : 201,
        }
      );
    }

    if (
      acao ===
      "REMOVER_CHECKPOINT"
    ) {
      const checkpointId =
        obterId(
          corpo?.checkpointId
        );

      if (!checkpointId) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "CHECKPOINT_INVALIDO",
          },
          {
            status: 400,
          }
        );
      }

      const checkpoint =
        await prisma
          .atividadeExternaCheckpoint
          .findFirst({
            where: {
              id:
                checkpointId,

              instituicaoId:
                usuario
                  .instituicaoId,

              atividadeExternaId:
                atividade.id,
            },

            select: {
              id: true,

              _count: {
                select: {
                  registros: true,
                },
              },
            },
          });

      if (!checkpoint) {
        return NextResponse.json(
          {
            ok: false,

            error:
              "CHECKPOINT_NAO_ENCONTRADO",
          },
          {
            status: 404,
          }
        );
      }

      if (
        checkpoint._count
          .registros > 0
      ) {
        await prisma
          .atividadeExternaCheckpoint
          .update({
            where: {
              id:
                checkpoint.id,
            },

            data: {
              ativo: false,

              atualizadoPorId:
                usuario.id,
            },
          });

        return NextResponse.json({
          ok: true,
          acao,
          checkpointId:
            checkpoint.id,
          modo: "DESATIVADO",
        });
      }

      await prisma
        .atividadeExternaCheckpoint
        .delete({
          where: {
            id:
              checkpoint.id,
          },
        });

      return NextResponse.json({
        ok: true,
        acao,
        checkpointId:
          checkpoint.id,
        modo: "REMOVIDO",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "ACAO_INVALIDA",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_SEGURANCA_POST]",
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
