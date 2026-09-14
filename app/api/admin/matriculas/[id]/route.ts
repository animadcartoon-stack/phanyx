import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

// EDITAR MATRÍCULA
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permiss\u00e3o" },
        { status: 403 }
      );
    }

    const id = Number(params.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Identificador de matr\u00edcula inv\u00e1lido."
        },
        { status: 400 }
      );
    }

    const matricula =
      await prisma.matricula.findFirst({
        where: {
          id,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
          numeroMatricula: true,
          numeroMatriculaLegado: true,

          status: true,
          periodoLetivo: true,
          modalidade: true,
          semestre: true,

          alunoId: true,
          cursoId: true,
          poloId: true,
          turmaPrincipalId: true,
          cursoSemestreId: true,

          createdAt: true,
          updatedAt: true,

          aluno: {
            select: {
              id: true,
              nome: true,
              nomeSocial: true,
            },
          },

          instituicao: {
            select: {
              id: true,
              nome: true,
            },
          },

          polo: {
            select: {
              id: true,
              nome: true,
              codigo: true,
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
              semestre: true,
              periodoLetivo: true,
              cursoId: true,
              poloId: true,
              ativa: true,
            },
          },

          itens: {
            select: {
              id: true,
              status: true,
              tipoItem: true,
              disciplinaId: true,
              turmaId: true,

              disciplina: {
                select: {
                  id: true,
                  nome: true,
                },
              },

              turma: {
                select: {
                  id: true,
                  nome: true,
                  semestre: true,
                  poloId: true,
                  ativa: true,
                },
              },
            },
          },
        },
      });

    if (!matricula) {
      return NextResponse.json(
        {
          error:
            "Matr\u00edcula n\u00e3o encontrada."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      matricula
    );
  } catch (error) {
    console.error(
      "ERRO AO CONSULTAR MATRICULA:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao consultar matr\u00edcula."
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();

  const matricula = await prisma.matricula.update({
    where: {
      id: Number(params.id),
    },
    data: {
      valorMatricula: body.valorMatricula ?? null,
      valorMensalidade: body.valorMensalidade ?? null,
      quantidadeParcelas: body.quantidadeParcelas ?? null,
      dataPrimeiroVencimento: body.dataPrimeiroVencimento
        ? new Date(body.dataPrimeiroVencimento)
        : null,
    },
  });

  return NextResponse.json(matricula);
}