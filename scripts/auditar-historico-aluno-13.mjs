import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const alunoId = 13;

  const aluno = await prisma.aluno.findUnique({
    where: {
      id: alunoId,
    },
    select: {
      id: true,
      nome: true,
      matricula: true,
      dataNascimento: true,
      genero: true,
      nacionalidade: true,
      statusAluno: true,
      matriculas: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          numeroMatricula: true,
          status: true,
          semestre: true,
          periodoLetivo: true,
          cursoId: true,
          createdAt: true,
          curso: {
            select: {
              id: true,
              nome: true,
            },
          },
          itens: {
            orderBy: {
              id: "asc",
            },
            select: {
              id: true,
              status: true,
              turmaId: true,
              disciplinaId: true,
              createdAt: true,
              disciplina: {
                select: {
                  nome: true,
                  codigo: true,
                  semestre: true,
                  cargaHoraria: true,
                },
              },
              turma: {
                select: {
                  nome: true,
                  codigo: true,
                  semestre: true,
                  periodoLetivo: true,
                  statusTurma: true,
                },
              },
            },
          },
        },
      },
      resultadosFinais: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          turmaId: true,
          disciplinaId: true,
          media: true,
          frequencia: true,
          situacao: true,
          observacao: true,
          fechadoEm: true,
          updatedAt: true,
          disciplina: {
            select: {
              nome: true,
            },
          },
          turma: {
            select: {
              nome: true,
              semestre: true,
              periodoLetivo: true,
            },
          },
        },
      },
      notas: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          turmaId: true,
          valor: true,
          peso: true,
          tipo: true,
          atividadeId: true,
          provaId: true,
          createdAt: true,
          turma: {
            select: {
              nome: true,
              semestre: true,
              periodoLetivo: true,
            },
          },
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      aluno,
      null,
      2
    )
  );
}
finally {
  await prisma.$disconnect();
}