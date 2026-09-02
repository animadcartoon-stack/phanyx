import {
  OrigemParticipanteAtividadeExterna,
  StatusAluno,
  StatusMatricula,
  StatusPagamentoAtividadeExterna,
  StatusParticipacaoAtividadeExterna,
  StatusPresencaAtividadeExterna,
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
            statusFuncionario: true,

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

      exigePagamento: true,

      turmas: {
        select: {
          turma: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              poloId: true,
            },
          },
        },
      },
    },
  });
}

function turmaPermitida(
  poloId: number | null,
  polosPermitidos:
    | number[]
    | null
) {
  if (
    polosPermitidos === null
  ) {
    return true;
  }

  if (poloId === null) {
    return true;
  }

  return polosPermitidos.includes(
    poloId
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

    const turmasAtividade =
      atividade.turmas
        .map(
          (vinculo) =>
            vinculo.turma
        )
        .filter(
          (turma) =>
            turmaPermitida(
              turma.poloId,
              usuario
                .polosPermitidos
            )
        );

    const turmaIds =
      turmasAtividade.map(
        (turma) =>
          turma.id
      );

    const participantes =
      await prisma
        .atividadeExternaParticipante
        .findMany({
          where: {
            instituicaoId:
              usuario.instituicaoId,

            atividadeExternaId:
              atividade.id,
          },

          select: {
            id: true,
            alunoId: true,

            origem: true,

            statusParticipacao:
              true,

            statusPresenca:
              true,

            statusPagamento:
              true,

            grupoNome: true,
            observacao: true,

            convidadoEm: true,
            confirmadoEm: true,
            canceladoEm: true,

            createdAt: true,
            updatedAt: true,

            aluno: {
              select: {
                id: true,
                nome: true,
                nomeSocial: true,
                matricula: true,
                fotoPerfil: true,
                statusAluno: true,
                poloId: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        });

    const idsJaParticipantes =
      new Set(
        participantes.map(
          (item) =>
            item.alunoId
        )
      );

    if (
      turmaIds.length === 0
    ) {
      return NextResponse.json({
        ok: true,

        podeGerenciar:
          usuario.podeGerenciar,

        turmas:
          turmasAtividade,

        participantes,

        disponiveis: [],
      });
    }

    const matriculas =
      await prisma.matricula.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          status:
            StatusMatricula.ATIVA,

          aluno: {
            ativo: true,

            statusAluno:
              StatusAluno.ATIVO,
          },

          OR: [
            {
              turmaPrincipalId: {
                in: turmaIds,
              },
            },

            {
              itens: {
                some: {
                  instituicaoId:
                    usuario
                      .instituicaoId,

                  turmaId: {
                    in: turmaIds,
                  },
                },
              },
            },
          ],
        },

        select: {
          id: true,

          numeroMatricula: true,

          numeroMatriculaLegado:
            true,

          turmaPrincipalId: true,

          aluno: {
            select: {
              id: true,
              nome: true,
              nomeSocial: true,
              matricula: true,
              fotoPerfil: true,
              statusAluno: true,
              poloId: true,
            },
          },

          turmaPrincipal: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              poloId: true,
            },
          },

          itens: {
            where: {
              instituicaoId:
                usuario
                  .instituicaoId,

              turmaId: {
                in: turmaIds,
              },
            },

            select: {
              turmaId: true,

              turma: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,
                  poloId: true,
                },
              },
            },
          },
        },

        orderBy: {
          id: "asc",
        },
      });

    type TurmaResumo = {
      id: number;
      nome: string;
      codigo:
        | string
        | null;
    };

    type Candidato = {
      alunoId: number;

      nome: string;

      nomeSocial:
        | string
        | null;

      matricula:
        | string
        | null;

      fotoPerfil:
        | string
        | null;

      turmas: Map<
        number,
        TurmaResumo
      >;
    };

    const candidatos =
      new Map<
        number,
        Candidato
      >();

    for (
      const matricula
      of matriculas
    ) {
      const aluno =
        matricula.aluno;

      if (
        idsJaParticipantes.has(
          aluno.id
        )
      ) {
        continue;
      }

      let candidato =
        candidatos.get(
          aluno.id
        );

      if (!candidato) {
        candidato = {
          alunoId:
            aluno.id,

          nome:
            aluno.nome,

          nomeSocial:
            aluno.nomeSocial,

          matricula:
            aluno.matricula ||
            matricula
              .numeroMatricula ||
            matricula
              .numeroMatriculaLegado ||
            null,

          fotoPerfil:
            aluno.fotoPerfil,

          turmas:
            new Map(),
        };

        candidatos.set(
          aluno.id,
          candidato
        );
      }

      if (
        matricula
          .turmaPrincipal &&
        turmaIds.includes(
          matricula
            .turmaPrincipal.id
        )
      ) {
        candidato.turmas.set(
          matricula
            .turmaPrincipal.id,
          {
            id:
              matricula
                .turmaPrincipal.id,

            nome:
              matricula
                .turmaPrincipal.nome,

            codigo:
              matricula
                .turmaPrincipal
                .codigo,
          }
        );
      }

      for (
        const item
        of matricula.itens
      ) {
        candidato.turmas.set(
          item.turma.id,
          {
            id:
              item.turma.id,

            nome:
              item.turma.nome,

            codigo:
              item.turma.codigo,
          }
        );
      }
    }

    const disponiveis =
      Array.from(
        candidatos.values()
      )
        .map(
          (item) => ({
            alunoId:
              item.alunoId,

            nome:
              item.nome,

            nomeSocial:
              item.nomeSocial,

            matricula:
              item.matricula,

            fotoPerfil:
              item.fotoPerfil,

            turmas:
              Array.from(
                item.turmas.values()
              ).sort(
                (
                  a,
                  b
                ) =>
                  a.nome.localeCompare(
                    b.nome,
                    "pt-BR"
                  )
              ),
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            (
              a.nomeSocial ||
              a.nome
            ).localeCompare(
              b.nomeSocial ||
                b.nome,
              "pt-BR"
            )
        );

    return NextResponse.json({
      ok: true,

      podeGerenciar:
        usuario.podeGerenciar,

      turmas:
        turmasAtividade,

      participantes,

      disponiveis,
    });
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_PARTICIPANTES_GET]",
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

    const alunoIds =
      Array.from(
        new Set(
          (
            Array.isArray(
              corpo?.alunoIds
            )
              ? corpo.alunoIds
              : []
          )
            .map(
              (
                valor: unknown
              ) =>
                Number(
                  valor
                )
            )
            .filter(
              (
                valor: number
              ) =>
                Number.isInteger(
                  valor
                ) &&
                valor > 0
            )
        )
      );

    if (
      alunoIds.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ALUNOS_NAO_INFORMADOS",
        },
        {
          status: 400,
        }
      );
    }

    if (
      alunoIds.length >
      1000
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "LIMITE_EXCEDIDO",
          message:
            "É possível adicionar até 1000 alunos por operação.",
        },
        {
          status: 400,
        }
      );
    }

    const turmaIds =
      atividade.turmas
        .map(
          (vinculo) =>
            vinculo.turma
        )
        .filter(
          (turma) =>
            turmaPermitida(
              turma.poloId,
              usuario
                .polosPermitidos
            )
        )
        .map(
          (turma) =>
            turma.id
        );

    if (
      turmaIds.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ATIVIDADE_SEM_TURMAS",
        },
        {
          status: 400,
        }
      );
    }

    const matriculasValidas =
      await prisma.matricula.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          status:
            StatusMatricula.ATIVA,

          alunoId: {
            in: alunoIds,
          },

          aluno: {
            ativo: true,

            statusAluno:
              StatusAluno.ATIVO,
          },

          OR: [
            {
              turmaPrincipalId: {
                in: turmaIds,
              },
            },

            {
              itens: {
                some: {
                  instituicaoId:
                    usuario
                      .instituicaoId,

                  turmaId: {
                    in: turmaIds,
                  },
                },
              },
            },
          ],
        },

        select: {
          alunoId: true,
        },
      });

    const alunosValidos =
      Array.from(
        new Set(
          matriculasValidas.map(
            (item) =>
              item.alunoId
          )
        )
      );

    if (
      alunosValidos.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "NENHUM_ALUNO_VALIDO",
        },
        {
          status: 400,
        }
      );
    }

    const statusParticipacao =
      atividade
        .exigeAutorizacaoResponsavel
        ? StatusParticipacaoAtividadeExterna.AGUARDANDO_AUTORIZACAO
        : StatusParticipacaoAtividadeExterna.CONVIDADO;

    const statusPagamento =
      atividade.exigePagamento
        ? StatusPagamentoAtividadeExterna.PENDENTE
        : StatusPagamentoAtividadeExterna.NAO_APLICAVEL;

    const resultado =
      await prisma
        .atividadeExternaParticipante
        .createMany({
          data:
            alunosValidos.map(
              (
                alunoId
              ) => ({
                instituicaoId:
                  usuario
                    .instituicaoId,

                atividadeExternaId:
                  atividade.id,

                alunoId,

                origem:
                  OrigemParticipanteAtividadeExterna.TURMA,

                statusParticipacao,

                statusPresenca:
                  StatusPresencaAtividadeExterna.NAO_REGISTRADA,

                statusPagamento,
              })
            ),

          skipDuplicates:
            true,
        });

    return NextResponse.json(
      {
        ok: true,

        adicionados:
          resultado.count,

        solicitados:
          alunoIds.length,

        validos:
          alunosValidos.length,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ATIVIDADE_EXTERNA_PARTICIPANTES_POST]",
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