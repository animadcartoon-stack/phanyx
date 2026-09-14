import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

type ModoTransferencia =
  | "TURMA"
  | "CURSO_TURMA";

function inteiroPositivo(
  valor: unknown
) {
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

export async function GET(
  _req: Request,
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

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "SEM_PERMISSAO",
          error:
            "Sem permissao.",
        },
        {
          status: 403,
        }
      );
    }

    const matriculaId =
      inteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MATRICULA_INVALIDA",
          error:
            "Matricula invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const matricula =
      await prisma.matricula.findFirst({
        where: {
          id:
            matriculaId,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          status: true,

          poloId: true,
          cursoId: true,
          cursoSemestreId:
            true,

          turmaPrincipalId:
            true,

          semestre:
            true,

          aluno: {
            select: {
              id: true,
              nome: true,
              nomeSocial: true,
            },
          },

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },

          curso: {
            select: {
              id: true,
              nome: true,
            },
          },

          cursoSemestre: {
            select: {
              id: true,
              numero: true,
              titulo: true,
            },
          },

          turmaPrincipal: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (!matricula) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MATRICULA_NAO_ENCONTRADA",
          error:
            "Matricula nao encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =================================================
     * OUTRAS TURMAS
     *
     * Mesmo curso + mesmo polo.
     * A turma atual fica excluida.
     * =================================================
     */

    const outrasTurmas =
      await prisma.turma.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          ativa:
            true,

          poloId:
            matricula.poloId,

          cursoId:
            matricula.cursoId,

          id: {
            not:
              matricula.turmaPrincipalId ??
              -1,
          },
        },

        orderBy: {
          nome: "asc",
        },

        select: {
          id: true,
          nome: true,

          periodoLetivo:
            true,

          semestre:
            true,

          modalidade:
            true,

          statusTurma:
            true,

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },

          curso: {
            select: {
              id: true,
              nome: true,
            },
          },

          _count: {
            select: {
              disciplinas:
                true,
            },
          },
        },
      });

    /*
     * =================================================
     * OUTROS CURSOS
     *
     * Regras:
     * - mesma instituicao
     * - ativos
     * - nao excluidos
     * - diferentes do curso atual
     * - formalmente oferecidos no polo atual
     * =================================================
     */

    const outrosCursos =
      await prisma.curso.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,

          ativo:
            true,

          excluidoEm:
            null,

          id: {
            not:
              matricula.cursoId ??
              -1,
          },

          cursosPolos: {
            some: {
              poloId:
                matricula.poloId,
            },
          },
        },

        orderBy: {
          nome: "asc",
        },

        select: {
          id: true,
          nome: true,
          codigo: true,

          semestres: {
            orderBy: {
              numero:
                "asc",
            },

            select: {
              id: true,
              numero: true,
              titulo: true,
              descricao: true,

              _count: {
                select: {
                  disciplinas:
                    true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      matricula: {
        id:
          matricula.id,

        status:
          matricula.status,

        aluno:
          matricula.aluno,

        polo:
          matricula.polo,

        curso:
          matricula.curso,

        cursoSemestre:
          matricula.cursoSemestre,

        turmaPrincipal:
          matricula.turmaPrincipal,
      },

      opcoes: {
        outrasTurmas,
        outrosCursos,
      },

      disponibilidade: {
        possuiOutraTurma:
          outrasTurmas.length >
          0,

        possuiOutroCurso:
          outrosCursos.length >
          0,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao carregar opcoes de transferencia curso/turma:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        codigo:
          "ERRO_OPCOES_CURSO_TURMA",
        error:
          "Nao foi possivel carregar as opcoes de transferencia.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: Request,
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

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "SEM_PERMISSAO",
          error:
            "Sem permissao.",
        },
        {
          status: 403,
        }
      );
    }

    const matriculaId =
      inteiroPositivo(
        params.id
      );

    if (!matriculaId) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MATRICULA_INVALIDA",
          error:
            "Matricula invalida.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.json();

    const modo =
      body?.modo as
        | ModoTransferencia
        | undefined;

    if (
      modo !== "TURMA" &&
      modo !== "CURSO_TURMA"
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MODO_INVALIDO",
          error:
            "Informe o tipo de alteracao.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ===================================================
     * MATRICULA ATUAL
     * ===================================================
     */

    const matricula =
      await prisma.matricula.findFirst({
        where: {
          id:
            matriculaId,

          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          status: true,

          poloId: true,

          cursoId: true,

          cursoSemestreId:
            true,

          turmaPrincipalId:
            true,

          semestre: true,

          curso: {
            select: {
              id: true,
              nome: true,
            },
          },

          cursoSemestre: {
            select: {
              id: true,
              numero: true,
              titulo: true,
            },
          },

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },

          turmaPrincipal: {
            select: {
              id: true,
              nome: true,
            },
          },

          itens: {
            where: {
              status: {
                in: [
                  "A_CURSAR",
                  "EM_CURSO",
                ],
              },
            },

            orderBy: {
              id: "asc",
            },

            select: {
              id: true,

              disciplinaId:
                true,

              status: true,

              tipoItem: true,

              turmaId: true,

              disciplina: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });

    if (!matricula) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MATRICULA_NAO_ENCONTRADA",
          error:
            "Matricula nao encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const idsAtuais =
      new Set(
        matricula.itens.map(
          (item) =>
            item.disciplinaId
        )
      );


    /*
     * ===================================================
     * APENAS OUTRA TURMA
     * ===================================================
     */

    if (modo === "TURMA") {
      const turmaDestinoId =
        inteiroPositivo(
          body?.turmaDestinoId
        );

      if (!turmaDestinoId) {
        return NextResponse.json(
          {
            success: false,
            codigo:
              "TURMA_DESTINO_OBRIGATORIA",
            error:
              "Informe a turma de destino.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        turmaDestinoId ===
        matricula.turmaPrincipalId
      ) {
        return NextResponse.json(
          {
            success: false,
            codigo:
              "MESMA_TURMA",
            error:
              "A turma de destino deve ser diferente da turma atual.",
          },
          {
            status: 400,
          }
        );
      }

      const turma =
        await prisma.turma.findFirst({
          where: {
            id:
              turmaDestinoId,

            instituicaoId:
              user.instituicaoId,

            ativa:
              true,
          },

          select: {
            id: true,
            nome: true,

            poloId: true,
            cursoId: true,

            periodoLetivo:
              true,

            semestre:
              true,

            modalidade:
              true,

            statusTurma:
              true,

            polo: {
              select: {
                id: true,
                nome: true,
              },
            },

            curso: {
              select: {
                id: true,
                nome: true,
              },
            },

            disciplinas: {
              orderBy: {
                id: "asc",
              },

              select: {
                disciplinaId:
                  true,

                disciplina: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        });

      if (!turma) {
        return NextResponse.json(
          {
            success: false,
            codigo:
              "TURMA_NAO_ENCONTRADA",
            error:
              "Turma de destino nao encontrada.",
          },
          {
            status: 404,
          }
        );
      }

      /*
       * "Outro curso ou turma" nao deve
       * alterar polo.
       *
       * Para outro polo existe o fluxo
       * especifico de transferencia POLO.
       */
      if (
        turma.poloId !==
        matricula.poloId
      ) {
        return NextResponse.json(
          {
            success: false,
            codigo:
              "POLO_DIFERENTE",
            error:
              "A turma escolhida pertence a outro polo. Utilize a transferencia para outro polo.",
          },
          {
            status: 409,
          }
        );
      }

      if (
        turma.cursoId !==
        matricula.cursoId
      ) {
        return NextResponse.json(
          {
            success: false,
            codigo:
              "CURSO_DIFERENTE",
            error:
              "Para mudar de curso utilize a opcao Curso e turma.",
          },
          {
            status: 409,
          }
        );
      }

      const idsTurma =
        new Set(
          turma.disciplinas.map(
            (item) =>
              item.disciplinaId
          )
        );

      const compativeis =
        matricula.itens.filter(
          (item) =>
            idsTurma.has(
              item.disciplinaId
            )
        );

      const faltantes =
        matricula.itens.filter(
          (item) =>
            !idsTurma.has(
              item.disciplinaId
            )
        );

      const extras =
        turma.disciplinas.filter(
          (item) =>
            !idsAtuais.has(
              item.disciplinaId
            )
        );

      return NextResponse.json({
        success: true,

        modo:
          "TURMA",

        podeTransferir:
          faltantes.length ===
          0,

        matriculaAtual: {
          id:
            matricula.id,

          polo:
            matricula.polo,

          curso:
            matricula.curso,

          turma:
            matricula.turmaPrincipal,
        },

        destino: {
          turma,
        },

        analise: {
          quantidadeAtual:
            matricula.itens.length,

          quantidadeCompativel:
            compativeis.length,

          quantidadeFaltante:
            faltantes.length,

          quantidadeExtraTurma:
            extras.length,

          compativeis:
            compativeis.map(
              (item) => ({
                itemMatriculaId:
                  item.id,

                disciplinaId:
                  item.disciplinaId,

                nome:
                  item.disciplina.nome,

                status:
                  item.status,
              })
            ),

          faltantes:
            faltantes.map(
              (item) => ({
                itemMatriculaId:
                  item.id,

                disciplinaId:
                  item.disciplinaId,

                nome:
                  item.disciplina.nome,

                status:
                  item.status,
              })
            ),

          extrasNaTurma:
            extras.map(
              (item) => ({
                disciplinaId:
                  item.disciplinaId,

                nome:
                  item.disciplina.nome,
              })
            ),
        },
      });
    }


    /*
     * ===================================================
     * OUTRO CURSO + SEMESTRE
     * ===================================================
     */

    const cursoDestinoId =
      inteiroPositivo(
        body?.cursoDestinoId
      );

    const cursoSemestreDestinoId =
      inteiroPositivo(
        body?.cursoSemestreDestinoId
      );

    if (!cursoDestinoId) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "CURSO_DESTINO_OBRIGATORIO",
          error:
            "Informe o curso de destino.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      cursoDestinoId ===
      matricula.cursoId
    ) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "MESMO_CURSO",
          error:
            "O curso de destino deve ser diferente do curso atual.",
        },
        {
          status: 400,
        }
      );
    }

    const cursoDestino =
      await prisma.curso.findFirst({
        where: {
          id:
            cursoDestinoId,

          instituicaoId:
            user.instituicaoId,

          ativo:
            true,
        },

        select: {
          id: true,
          nome: true,

          semestres: {
            orderBy: {
              numero:
                "asc",
            },

            select: {
              id: true,
              numero: true,
              titulo: true,
              descricao: true,
            },
          },
        },
      });

    if (!cursoDestino) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "CURSO_DESTINO_NAO_ENCONTRADO",
          error:
            "Curso de destino nao encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      cursoDestino.semestres.length ===
      0
    ) {
      return NextResponse.json({
        success: true,

        modo:
          "CURSO_TURMA",

        podeTransferir:
          false,

        codigo:
          "CURSO_SEM_GRADE",

        matriculaAtual: {
          curso:
            matricula.curso,

          cursoSemestre:
            matricula.cursoSemestre,

          polo:
            matricula.polo,
        },

        destino: {
          curso:
            cursoDestino,

          cursoSemestre:
            null,
        },

        analise: {
          mensagem:
            "O curso de destino ainda nao possui grade curricular configurada.",

          exigeConfiguracaoGrade:
            true,

          exigeAnaliseEquivalencia:
            true,
        },
      });
    }

    if (
      !cursoSemestreDestinoId
    ) {
      return NextResponse.json({
        success: true,

        modo:
          "CURSO_TURMA",

        podeTransferir:
          false,

        codigo:
          "SELECIONE_SEMESTRE_DESTINO",

        destino: {
          curso:
            cursoDestino,

          semestres:
            cursoDestino.semestres,
        },
      });
    }

    const semestreDestino =
      await prisma
        .cursoSemestre
        .findFirst({
          where: {
            id:
              cursoSemestreDestinoId,

            cursoId:
              cursoDestinoId,

            instituicaoId:
              user.instituicaoId,
          },

          select: {
            id: true,
            numero: true,
            titulo: true,
            descricao: true,

            disciplinas: {
              orderBy: {
                id:
                  "asc",
              },

              select: {
                disciplinaId:
                  true,

                disciplina: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        });

    if (!semestreDestino) {
      return NextResponse.json(
        {
          success: false,
          codigo:
            "SEMESTRE_DESTINO_INVALIDO",
          error:
            "Semestre do curso de destino nao encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      semestreDestino
        .disciplinas
        .length === 0
    ) {
      return NextResponse.json({
        success: true,

        modo:
          "CURSO_TURMA",

        podeTransferir:
          false,

        codigo:
          "SEM_GRADE_DESTINO",

        matriculaAtual: {
          curso:
            matricula.curso,

          cursoSemestre:
            matricula.cursoSemestre,

          polo:
            matricula.polo,
        },

        destino: {
          curso:
            cursoDestino,

          cursoSemestre:
            semestreDestino,
        },

        analise: {
          mensagem:
            "O semestre escolhido ainda nao possui disciplinas configuradas.",

          exigeConfiguracaoGrade:
            true,

          exigeAnaliseEquivalencia:
            true,
        },
      });
    }

    const idsDestino =
      new Set(
        semestreDestino
          .disciplinas
          .map(
            (item) =>
              item.disciplinaId
          )
      );

    /*
     * Igualdade por disciplinaId e segura:
     * trata-se do mesmo registro academico.
     *
     * Nomes parecidos NAO sao considerados
     * equivalencia.
     */
    const iguais =
      matricula.itens.filter(
        (item) =>
          idsDestino.has(
            item.disciplinaId
          )
      );

    const origemSemCorrespondencia =
      matricula.itens.filter(
        (item) =>
          !idsDestino.has(
            item.disciplinaId
          )
      );

    const novasDestino =
      semestreDestino
        .disciplinas
        .filter(
          (item) =>
            !idsAtuais.has(
              item.disciplinaId
            )
        );

    /*
     * Ainda nao existe uma tabela formal
     * de equivalencia academica no PHANYX.
     *
     * Portanto esta API ANALISA, mas
     * nao autoriza automaticamente uma
     * transferencia entre cursos.
     */
    return NextResponse.json({
      success: true,

      modo:
        "CURSO_TURMA",

      podeTransferir:
        false,

      codigo:
        "EXIGE_ANALISE_EQUIVALENCIA",

      matriculaAtual: {
        curso:
          matricula.curso,

        cursoSemestre:
          matricula.cursoSemestre,

        polo:
          matricula.polo,

        quantidadeDisciplinas:
          matricula.itens.length,
      },

      destino: {
        curso:
          {
            id:
              cursoDestino.id,

            nome:
              cursoDestino.nome,
          },

        cursoSemestre:
          semestreDestino,
      },

      analise: {
        iguaisPorId:
          iguais.map(
            (item) => ({
              itemMatriculaId:
                item.id,

              disciplinaId:
                item.disciplinaId,

              nome:
                item.disciplina.nome,

              status:
                item.status,
            })
          ),

        origemSemCorrespondencia:
          origemSemCorrespondencia.map(
            (item) => ({
              itemMatriculaId:
                item.id,

              disciplinaId:
                item.disciplinaId,

              nome:
                item.disciplina.nome,

              status:
                item.status,
            })
          ),

        novasDisciplinasDestino:
          novasDestino.map(
            (item) => ({
              disciplinaId:
                item.disciplinaId,

              nome:
                item.disciplina.nome,
            })
          ),

        exigeConfiguracaoGrade:
          false,

        exigeAnaliseEquivalencia:
          true,

        equivalenciaAutomaticaPorNome:
          false,
      },
    });
  } catch (error) {
    console.error(
      "Erro na analise de transferencia curso/turma:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        codigo:
          "ERRO_ANALISE_CURSO_TURMA",

        error:
          "Nao foi possivel analisar a transferencia.",
      },
      {
        status: 500,
      }
    );
  }
}
