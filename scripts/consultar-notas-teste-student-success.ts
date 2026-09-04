import {
  prisma,
} from "../lib/prisma";

async function executar() {
  const alunoId =
    2097;

  const aluno =
    await prisma.aluno.findUnique({
      where: {
        id:
          alunoId,
      },

      select: {
        id:
          true,

        nome:
          true,

        instituicaoId:
          true,
      },
    });

  console.log(
    "\n=== ALUNO ==="
  );

  console.log(
    aluno
  );

  const notas =
    await prisma.nota.findMany({
      where: {
        alunoId,
      },

      orderBy: {
        id:
          "asc",
      },

      include: {
        disciplina:
          true,
      },
    });

  console.log(
    "\n=== NOTAS ATUAIS ==="
  );

  if (
    notas.length ===
    0
  ) {
    console.log(
      "Nenhuma nota encontrada para este aluno."
    );
  }
  else {
    for (
      const nota
      of notas
    ) {
      console.log(
        JSON.stringify(
          {
            id:
              nota.id,

            alunoId:
              nota.alunoId,

            disciplinaId:
              nota.disciplinaId,

            turmaId:
              nota.turmaId,

            valor:
              nota.valor,

            createdAt:
              nota.createdAt,

            disciplina:
              nota.disciplina,
          },
          null,
          2
        )
      );
    }
  }
}

executar()
  .catch(
    (
      error
    ) => {
      console.error(
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );