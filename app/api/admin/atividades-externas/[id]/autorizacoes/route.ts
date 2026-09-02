import {
  MetodoAutorizacaoAtividadeExterna,
  StatusAutorizacaoAtividadeExterna,
  StatusParticipacaoAtividadeExterna,
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

  const role = String(
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
      exigeAutorizacaoResponsavel:
        true,
    },
  });
}

function obterIp(
  request: NextRequest
) {
  const forwarded =
    request.headers.get(
      "x-forwarded-for"
    );

  if (forwarded) {
    return (
      forwarded
        .split(",")[0]
        ?.trim() ||
      null
    );
  }

  return (
    request.headers.get(
      "x-real-ip"
    ) || null
  );
}

function statusParticipacaoPorAutorizacao(
  status:
    StatusAutorizacaoAtividadeExterna
) {
  switch (status) {
    case StatusAutorizacaoAtividadeExterna.AUTORIZADO:
    case StatusAutorizacaoAtividadeExterna.DISPENSADO:
      return StatusParticipacaoAtividadeExterna.CONFIRMADO;

    case StatusAutorizacaoAtividadeExterna.NAO_AUTORIZADO:
    case StatusAutorizacaoAtividadeExterna.REVOGADO:
      return StatusParticipacaoAtividadeExterna.RECUSADO;

    case StatusAutorizacaoAtividadeExterna.PENDENTE:
    case StatusAutorizacaoAtividadeExterna.EXPIRADO:
    default:
      return StatusParticipacaoAtividadeExterna.AGUARDANDO_AUTORIZACAO;
  }
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

    const participantes =
      await prisma
        .atividadeExternaParticipante
        .findMany({
          where: {
            instituicaoId:
              usuario.instituicaoId,

            atividadeExternaId:
              atividade.id,

            statusParticipacao: {
              not:
                StatusParticipacaoAtividadeExterna.CANCELADO,
            },
          },

          select: {
            id: true,
            alunoId: true,

            statusParticipacao:
              true,

            aluno: {
              select: {
                id: true,
                nome: true,
                nomeSocial: true,
                matricula: true,
                fotoPerfil: true,
              },
            },

            autorizacoes: {
              orderBy: [
                {
                  createdAt:
                    "desc",
                },
                {
                  id: "desc",
                },
              ],

              select: {
                id: true,
                status: true,
                metodo: true,

                responsavelNomeSnapshot:
                  true,

                responsavelEmailSnapshot:
                  true,

                responsavelTelefoneSnapshot:
                  true,

                responsavelParentescoSnapshot:
                  true,

                versaoTermo:
                  true,

                observacao:
                  true,

                respondidaPorUserId:
                  true,

                registradaPorUserId:
                  true,

                respondidaEm:
                  true,

                revogadaEm:
                  true,

                createdAt: true,
                updatedAt: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        });

    const itens =
      participantes.map(
        (participante) => ({
          id:
            participante.id,

          alunoId:
            participante.alunoId,

          statusParticipacao:
            participante
              .statusParticipacao,

          aluno:
            participante.aluno,

          autorizacaoAtual:
            participante
              .autorizacoes[0] ||
            null,

          historico:
            participante
              .autorizacoes,
        })
      );

    const resumo = {
      total:
        itens.length,

      pendentes:
        itens.filter(
          (item) =>
            !item
              .autorizacaoAtual ||
            item
              .autorizacaoAtual
              .status ===
              StatusAutorizacaoAtividadeExterna.PENDENTE
        ).length,

      autorizados:
        itens.filter(
          (item) =>
            item
              .autorizacaoAtual
              ?.status ===
            StatusAutorizacaoAtividadeExterna.AUTORIZADO
        ).length,

      naoAutorizados:
        itens.filter(
          (item) =>
            item
              .autorizacaoAtual
              ?.status ===
            StatusAutorizacaoAtividadeExterna.NAO_AUTORIZADO
        ).length,

      dispensados:
        itens.filter(
          (item) =>
            item
              .autorizacaoAtual
              ?.status ===
            StatusAutorizacaoAtividadeExterna.DISPENSADO
        ).length,
    };

    return NextResponse.json({
      ok: true,

      exigeAutorizacaoResponsavel:
        atividade
          .exigeAutorizacaoResponsavel,

      podeGerenciar:
        usuario.podeGerenciar,

      resumo,

      participantes:
        itens,
    });
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_AUTORIZACOES_GET]",
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

    const participanteId =
      Number(
        corpo?.participanteId
      );

    if (
      !Number.isInteger(
        participanteId
      ) ||
      participanteId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PARTICIPANTE_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const statusTexto =
      String(
        corpo?.status || ""
      ).trim();

    if (
      !Object.values(
        StatusAutorizacaoAtividadeExterna
      ).includes(
        statusTexto as StatusAutorizacaoAtividadeExterna
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "STATUS_INVALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const status =
      statusTexto as StatusAutorizacaoAtividadeExterna;

    const participante =
      await prisma
        .atividadeExternaParticipante
        .findFirst({
          where: {
            id:
              participanteId,

            atividadeExternaId:
              atividade.id,

            instituicaoId:
              usuario.instituicaoId,
          },

          select: {
            id: true,
          },
        });

    if (!participante) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PARTICIPANTE_NAO_ENCONTRADO",
        },
        {
          status: 404,
        }
      );
    }

    const agora =
      new Date();

    const metodoTexto =
      String(
        corpo?.metodo ||
          MetodoAutorizacaoAtividadeExterna.ADMINISTRATIVO
      ).trim();

    const metodo =
      Object.values(
        MetodoAutorizacaoAtividadeExterna
      ).includes(
        metodoTexto as MetodoAutorizacaoAtividadeExterna
      )
        ? (metodoTexto as MetodoAutorizacaoAtividadeExterna)
        : MetodoAutorizacaoAtividadeExterna.ADMINISTRATIVO;

    const limparTexto = (
      valor: unknown,
      limite: number
    ) => {
      if (
        typeof valor !==
        "string"
      ) {
        return null;
      }

      const texto =
        valor.trim();

      return texto
        ? texto.slice(
            0,
            limite
          )
        : null;
    };

    const respondida =
      status !==
      StatusAutorizacaoAtividadeExterna.PENDENTE;

    const revogada =
      status ===
      StatusAutorizacaoAtividadeExterna.REVOGADO;

    const novoStatusParticipacao =
      statusParticipacaoPorAutorizacao(
        status
      );

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const autorizacao =
            await tx
              .atividadeExternaAutorizacao
              .create({
                data: {
                  instituicaoId:
                    usuario
                      .instituicaoId,

                  atividadeExternaId:
                    atividade.id,

                  participanteId:
                    participante.id,

                  status,
                  metodo,

                  responsavelNomeSnapshot:
                    limparTexto(
                      corpo
                        ?.responsavelNome,
                      200
                    ),

                  responsavelEmailSnapshot:
                    limparTexto(
                      corpo
                        ?.responsavelEmail,
                      320
                    ),

                  responsavelTelefoneSnapshot:
                    limparTexto(
                      corpo
                        ?.responsavelTelefone,
                      80
                    ),

                  responsavelParentescoSnapshot:
                    limparTexto(
                      corpo
                        ?.responsavelParentesco,
                      120
                    ),

                  versaoTermo:
                    limparTexto(
                      corpo
                        ?.versaoTermo,
                      100
                    ),

                  textoTermoSnapshot:
                    limparTexto(
                      corpo
                        ?.textoTermo,
                      30000
                    ),

                  observacao:
                    limparTexto(
                      corpo
                        ?.observacao,
                      5000
                    ),

                  registradaPorUserId:
                    usuario.id,

                  respondidaPorUserId:
                    respondida
                      ? usuario.id
                      : null,

                  respondidaEm:
                    respondida
                      ? agora
                      : null,

                  revogadaEm:
                    revogada
                      ? agora
                      : null,

                  ip:
                    obterIp(
                      request
                    ),

                  userAgent:
                    request.headers.get(
                      "user-agent"
                    ),
                },
              });

          await tx
            .atividadeExternaParticipante
            .update({
              where: {
                id:
                  participante.id,
              },

              data: {
                statusParticipacao:
                  novoStatusParticipacao,

                confirmadoEm:
                  novoStatusParticipacao ===
                  StatusParticipacaoAtividadeExterna.CONFIRMADO
                    ? agora
                    : null,

                canceladoEm:
                  novoStatusParticipacao ===
                  StatusParticipacaoAtividadeExterna.RECUSADO
                    ? agora
                    : null,
              },
            });

          return autorizacao;
        }
      );

    return NextResponse.json(
      {
        ok: true,

        autorizacao:
          resultado,

        statusParticipacao:
          novoStatusParticipacao,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_AUTORIZACOES_POST]",
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