import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const matricula = await prisma.matricula.findFirst({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        itens: {
  where: {
    instituicaoId: user.instituicaoId,
  },
  include: {
    disciplina: true,
    turma: {
      include: {
        aulas: {
  where: {
    instituicaoId: user.instituicaoId,
    publicada: true,
  },
          include: {
            presencas: {
              where: {
                alunoId: aluno.id,
                instituicaoId: user.instituicaoId,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    },
  },
  orderBy: {
    id: "asc",
  },
},
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const disciplinas =
      matricula?.itens
        ?.map((item) => {
          const turma = item.turma;
          const disciplina = item.disciplina;
if (!turma || !disciplina) return null;

          const aulasDaDisciplina = turma.aulas.filter(
  (aula) => aula.disciplinaId === disciplina.id
);

const totalAulas = aulasDaDisciplina.length;
const totalPresencas = aulasDaDisciplina.filter(
  (aula) => (aula.presencas?.length || 0) > 0
).length;

const bloqueadaPorAulas = totalAulas === 0;

          return {
            id: disciplina.id,
            nome: disciplina.nome,
            turmaId: turma.id,
            turmaNome: turma.nome,
            totalAulas,
            totalPresencas,
            bloqueadaPorAulas,
            mensagemBloqueio: bloqueadaPorAulas
  ? "Aula disponível em breve. Assim que a instituição publicar o conteúdo, esta disciplina será desbloqueada automaticamente."
  : null,
            aulas: aulasDaDisciplina.map((aula) => ({
              id: aula.id,
              titulo: aula.titulo,
              presenca: aula.presencas?.[0]
                ? {
                    id: aula.presencas[0].id,
                    status: aula.presencas[0].status,
                    observacao: aula.presencas[0].observacao,
                  }
                : null,
            })),
          };
        })
        .filter(Boolean) || [];

    return NextResponse.json({
      curso: matricula?.curso || null,
      disciplinas,
    });
  } catch (error) {
    console.error("Erro ao buscar aulas do aluno:", error);

    return NextResponse.json(
      { error: "Erro ao buscar aulas" },
      { status: 500 }
    );
  }
}