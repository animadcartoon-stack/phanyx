import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { sincronizarPublicacoesAtivasDoCurso } from "@/lib/publicacao-cursos-rede";

// LISTAR DISCIPLINAS
export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "PROFESSOR") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const disciplinas = await prisma.disciplina.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(disciplinas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar disciplinas" },
      { status: 500 }
    );
  }
}

// CRIAR DISCIPLINA
export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.nome || String(body.nome).trim() === "") {
      return NextResponse.json(
        { error: "Nome da disciplina é obrigatório" },
        { status: 400 }
      );
    }

    let cursoIdFinal: number | null = null;

let professorIdFinal: number | null = null;

if (body.professorId) {
  const professorId = Number(body.professorId);

  const professor = await prisma.professor.findFirst({
    where: {
      id: professorId,
      instituicaoId: user.instituicaoId,
    },
  });

  if (!professor) {
    return NextResponse.json(
      { error: "Professor inválido para esta instituição" },
      { status: 400 }
    );
  }

  professorIdFinal = professor.id;
}

    if (body.cursoId) {
      const cursoId = Number(body.cursoId);

      const curso = await prisma.curso.findFirst({
  where: {
    id: cursoId,
    instituicaoId: user.instituicaoId,
  },
  select: {
    id: true,
    publicacaoRedeDestino: {
      select: {
        id: true,
      },
    },
  },
});

      if (!curso) {
        return NextResponse.json(
          { error: "Curso inválido para esta instituição" },
          { status: 400 }
        );
      }

      if (curso.publicacaoRedeDestino) {
  return NextResponse.json(
    {
      error:
        "Não é permitido criar disciplinas diretamente em um curso recebido da rede.",
    },
    { status: 403 }
  );
}

      cursoIdFinal = curso.id;
    }

    const usuarioId = Number(user.id);
const instituicaoId = Number(
  user.instituicaoId
);

const resultado =
  await prisma.$transaction(
    async (tx) => {
      const novaDisciplina =
        await tx.disciplina.create({
          data: {
            nome: String(
              body.nome
            ).trim(),

            codigo: body.codigo
              ? String(
                  body.codigo
                ).trim()
              : null,

            descricao: body.descricao
              ? String(
                  body.descricao
                ).trim()
              : null,

            cargaHoraria:
              body.cargaHoraria !==
                null &&
              body.cargaHoraria !==
                undefined &&
              body.cargaHoraria !== ""
                ? Number(
                    body.cargaHoraria
                  )
                : null,

            semestre:
              body.semestre !== null &&
              body.semestre !==
                undefined &&
              body.semestre !== ""
                ? Number(
                    body.semestre
                  )
                : null,

            cursoId:
              cursoIdFinal,

            professorId:
              professorIdFinal,

            instituicaoId,
          },

          include: {
            curso: true,

            professor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        });

      let unidadesAtualizadas = 0;

      if (cursoIdFinal) {
        const publicacoes =
          await sincronizarPublicacoesAtivasDoCurso(
            {
              tx,

              cursoOrigemId:
                cursoIdFinal,

              instituicaoOrigemId:
                instituicaoId,

              atualizadoPorId:
                usuarioId,
            }
          );

        unidadesAtualizadas =
          publicacoes.length;
      }

      return {
        novaDisciplina,
        unidadesAtualizadas,
      };
    }
  );

return NextResponse.json(
  {
    ...resultado.novaDisciplina,

    resumoSincronizacao: {
      unidadesAtualizadas:
        resultado.unidadesAtualizadas,
    },
  },
  { status: 201 }
);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar disciplina" },
      { status: 500 }
    );
  }
}