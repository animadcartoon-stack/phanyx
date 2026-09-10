import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { obterParesTurmaDisciplinaProfessor } from "@/lib/professor-escopo-academico";

export const dynamic = "force-dynamic";

function isProfessorRole(role: unknown) {
  return (
    String(role || "")
      .trim()
      .toUpperCase() === "PROFESSOR"
  );
}

function inteiroPositivo(
  valor: string | null
) {
  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

function maiorData(
  ...datas: Array<Date | null | undefined>
) {
  const validas = datas.filter(
    (data): data is Date =>
      data instanceof Date
  );

  if (validas.length === 0) {
    return null;
  }

  return validas.reduce(
    (maior, atual) =>
      atual.getTime() >
      maior.getTime()
        ? atual
        : maior
  );
}

export async function GET(
  req: NextRequest
) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      !isProfessorRole(user.role)
    ) {
      return NextResponse.json(
        {
          error: "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    const professor =
      await prisma.professor.findFirst({
        where: {
          userId: user.id,
          instituicaoId:
            user.instituicaoId,
        },
        select: {
          id: true,
        },
      });

    if (!professor) {
      return NextResponse.json(
        {
          error:
            "PROFESSOR_NAO_ENCONTRADO",
        },
        {
          status: 404,
        }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const alunoId =
      inteiroPositivo(
        searchParams.get("alunoId")
      );

    const turmaId =
      inteiroPositivo(
        searchParams.get("turmaId")
      );

    const disciplinaId =
      inteiroPositivo(
        searchParams.get(
          "disciplinaId"
        )
      );

    if (
      !alunoId ||
      !turmaId ||
      !disciplinaId
    ) {
      return NextResponse.json(
        {
          error:
            "PARAMETROS_INVALIDOS",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * O professor precisa possuir
     * exatamente este par
     * turma + disciplina.
     */
    const paresPermitidos =
      await obterParesTurmaDisciplinaProfessor(
        {
          instituicaoId:
            user.instituicaoId,
          professorId:
            professor.id,
        }
      );

    const parPermitido =
      paresPermitidos.some(
        (par) =>
          par.turmaId === turmaId &&
          par.disciplinaId ===
            disciplinaId
      );

    if (!parPermitido) {
      return NextResponse.json(
        {
          error:
            "DISCIPLINA_FORA_DO_ESCOPO",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * O aluno também precisa ter
     * vínculo com exatamente a
     * mesma turma + disciplina.
     */
    const itemMatricula =
      await prisma.itemMatricula.findFirst(
        {
          where: {
            instituicaoId:
              user.instituicaoId,
            turmaId,
            disciplinaId,

            matricula: {
              alunoId,
            },
          },

          select: {
            id: true,
          },
        }
      );

    if (!itemMatricula) {
      return NextResponse.json(
        {
          error:
            "ALUNO_FORA_DO_ESCOPO",
        },
        {
          status: 404,
        }
      );
    }

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          nome: true,
        },
      });

    if (!aluno) {
      return NextResponse.json(
        {
          error:
            "ALUNO_NAO_ENCONTRADO",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Somente aulas pertencentes
     * exatamente a esta oferta.
     */
    const aulas =
      await prisma.aula.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,
          turmaId,
          disciplinaId,
          publicada: true,
        },

        select: {
          id: true,
          titulo: true,
          ordem: true,
          duracaoMin: true,
          videoUrl: true,
        },

        orderBy: [
          {
            ordem: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    const aulaIds =
      aulas.map(
        (aula) => aula.id
      );

    if (aulaIds.length === 0) {
      return NextResponse.json({
        aluno,
        turmaId,
        disciplinaId,

        resumo: {
          total: 0,
          iniciadas: 0,
          concluidas: 0,
          emAndamento: 0,
          naoIniciadas: 0,
        },

        aulas: [],
      });
    }

    const [
      progressos,
      sessoesAgrupadas,
    ] = await Promise.all([
      prisma.progressoAula.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,
          alunoId,

          aulaId: {
            in: aulaIds,
          },
        },

        select: {
          aulaId: true,
          concluida: true,
          concluidaEm: true,
          tempoAssistidoSegundos:
            true,
          tempoMinimoSegundos:
            true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.sessaoVideoAluno.groupBy({
        by: ["aulaId"],

        where: {
          instituicaoId:
            user.instituicaoId,
          alunoId,
          turmaId,
          disciplinaId,

          aulaId: {
            in: aulaIds,
          },
        },

        _max: {
          maiorPosicaoSegundos:
            true,
          ultimoRegistroEm: true,
        },

        _sum: {
          tempoReproducaoSegundos:
            true,
        },

        _count: {
          _all: true,
        },
      }),
    ]);

    const progressoPorAula =
      new Map<
        number,
        (typeof progressos)[number]
      >(
        progressos.map(
          (
            progresso
          ): [
            number,
            (typeof progressos)[number]
          ] => [
            progresso.aulaId,
            progresso,
          ]
        )
      );

    const sessoesPorAula =
      new Map<
        number,
        (typeof sessoesAgrupadas)[number]
      >(
        sessoesAgrupadas.map(
          (
            sessao
          ): [
            number,
            (typeof sessoesAgrupadas)[number]
          ] => [
            sessao.aulaId,
            sessao,
          ]
        )
      );

    const resultado =
      aulas.map((aula) => {
        const progresso =
          progressoPorAula.get(
            aula.id
          );

        const sessoes =
          sessoesPorAula.get(
            aula.id
          );

        const minimoDaAula =
          Math.max(
            0,
            Number(
              aula.duracaoMin || 0
            ) * 60
          );

        const tempoMinimoSegundos =
          Math.max(
            Number(
              progresso
                ?.tempoMinimoSegundos ||
                0
            ),
            minimoDaAula
          );

        const tempoAssistidoSegundos =
          Math.max(
            Number(
              progresso
                ?.tempoAssistidoSegundos ||
                0
            ),
            Number(
              sessoes?._max
                .maiorPosicaoSegundos ||
                0
            )
          );

        const concluida =
          Boolean(
            progresso?.concluida
          );

        const houveAtividade =
          tempoAssistidoSegundos > 0 ||
          Number(
            sessoes?._count._all || 0
          ) > 0;

        const status =
          concluida
            ? "CONCLUIDA"
            : houveAtividade
              ? "EM_ANDAMENTO"
              : "NAO_INICIADA";

        const percentual =
          tempoMinimoSegundos > 0
            ? Number(
                Math.min(
                  100,
                  (
                    (tempoAssistidoSegundos /
                      tempoMinimoSegundos) *
                    100
                  )
                ).toFixed(1)
              )
            : null;

        const ultimaAtividade =
          maiorData(
            progresso?.updatedAt,
            progresso?.concluidaEm,
            sessoes?._max
              .ultimoRegistroEm
          );

        return {
          aulaId: aula.id,
          titulo: aula.titulo,
          ordem: aula.ordem,
          possuiVideo:
            Boolean(aula.videoUrl),

          status,
          concluida,

          concluidaEm:
            progresso?.concluidaEm ||
            null,

          tempoAssistidoSegundos,
          tempoMinimoSegundos,
          percentual,

          sessoesRegistradas:
            Number(
              sessoes?._count._all ||
                0
            ),

          tempoReproducaoTotalSegundos:
            Number(
              sessoes?._sum
                .tempoReproducaoSegundos ||
                0
            ),

          ultimaAtividade,
        };
      });

    const concluidas =
      resultado.filter(
        (aula) =>
          aula.status ===
          "CONCLUIDA"
      ).length;

    const emAndamento =
      resultado.filter(
        (aula) =>
          aula.status ===
          "EM_ANDAMENTO"
      ).length;

    const naoIniciadas =
      resultado.filter(
        (aula) =>
          aula.status ===
          "NAO_INICIADA"
      ).length;

    return NextResponse.json({
      aluno,
      turmaId,
      disciplinaId,

      resumo: {
        total: resultado.length,
        iniciadas:
          concluidas +
          emAndamento,
        concluidas,
        emAndamento,
        naoIniciadas,
      },

      aulas: resultado,
    });
  } catch (e: any) {
    console.error(
      "ERRO API PROGRESSO PROFESSOR:",
      e
    );

    return NextResponse.json(
      {
        error:
          e?.message ||
          "ERRO_AO_CARREGAR_PROGRESSO",
      },
      {
        status: 500,
      }
    );
  }
}
