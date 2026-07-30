import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { sincronizarPublicacoesAtivasDoCurso } from "@/lib/publicacao-cursos-rede";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizarDisciplinaIds(
  valor: unknown
): number[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !isAdminLike(user.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const usuarioId = Number(user.id);

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const cursoSemestreId = Number(
      body.cursoSemestreId
    );

    if (
      !Number.isInteger(
        cursoSemestreId
      ) ||
      cursoSemestreId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Semestre do curso inválido.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(
        body.disciplinaIds
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A lista de disciplinas é inválida.",
        },
        { status: 400 }
      );
    }

    const disciplinaIds =
      normalizarDisciplinaIds(
        body.disciplinaIds
      );

    const semestre =
      await prisma.cursoSemestre.findFirst({
        where: {
          id: cursoSemestreId,
          instituicaoId,
        },
        select: {
          id: true,
          cursoId: true,
        },
      });

    if (!semestre) {
      return NextResponse.json(
        {
          error:
            "Semestre não encontrado para esta instituição.",
        },
        { status: 404 }
      );
    }

    const publicacaoRecebida =
  await prisma.cursoPublicacaoRede.findUnique({
    where: {
      cursoDestinoId: semestre.cursoId,
    },
    select: {
      id: true,
    },
  });

if (publicacaoRecebida) {
  return NextResponse.json(
    {
      error:
        "Não é permitido alterar as disciplinas de um curso recebido da rede.",
    },
    { status: 403 }
  );
}

    if (disciplinaIds.length > 0) {
      const disciplinasValidas =
        await prisma.disciplina.findMany({
          where: {
            id: {
              in: disciplinaIds,
            },
            instituicaoId,
          },
          select: {
            id: true,
          },
        });

      if (
        disciplinasValidas.length !==
        disciplinaIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais disciplinas não pertencem a esta instituição.",
          },
          { status: 400 }
        );
      }
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await tx.cursoSemestreDisciplina.deleteMany(
            {
              where: {
                cursoSemestreId,
                instituicaoId,
              },
            }
          );

          if (disciplinaIds.length > 0) {
            await tx.cursoSemestreDisciplina.createMany(
              {
                data: disciplinaIds.map(
                  (disciplinaId) => ({
                    cursoSemestreId,
                    disciplinaId,
                    instituicaoId,
                  })
                ),
              }
            );
          }

          const publicacoes =
            await sincronizarPublicacoesAtivasDoCurso(
              {
                tx,
                cursoOrigemId:
                  semestre.cursoId,
                instituicaoOrigemId:
                  instituicaoId,
                atualizadoPorId:
                  usuarioId,
              }
            );

          return {
            publicacoesSincronizadas:
              publicacoes.length,
          };
        }
      );

    return NextResponse.json({
      ok: true,

      resumoSincronizacao: {
        unidadesAtualizadas:
          resultado
            .publicacoesSincronizadas,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao salvar disciplinas do semestre:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar disciplinas do semestre.",
      },
      { status: 500 }
    );
  }
}