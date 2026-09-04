import {
  prisma,
} from "../lib/prisma";

type ItemTurmaConsulta = {
  id:
    number;

  turmaId:
    number | null;

  status:
    string | null;
};

type AulaConsulta = {
  id:
    number;

  titulo:
    string | null;

  turmaId:
    number;
};

type PresencaConsulta = {
  id:
    number;

  aulaId:
    number;

  alunoId:
    number;

  status:
    string;

  observacao:
    string | null;

  createdAt:
    Date;

  updatedAt:
    Date;
};

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

  if (!aluno) {
    throw new Error(
      "Aluno 2097 não encontrado."
    );
  }

  console.log(
    "\n=== ALUNO ==="
  );

  console.log(
    aluno
  );

  const itens =
    (
      await prisma.itemMatricula.findMany({
        where: {
          instituicaoId:
            aluno.instituicaoId,

          matricula: {
            alunoId:
              alunoId,
          },
        },

        select: {
          id:
            true,

          turmaId:
            true,

          status:
            true,
        },

        orderBy: {
          id:
            "asc",
        },
      })
    ) as ItemTurmaConsulta[];

  console.log(
    "\n=== TURMAS DO ALUNO ==="
  );

  console.log(
    itens
  );

  const turmaIds =
    Array.from(
      new Set(
        itens
          .map(
            (
              item:
                ItemTurmaConsulta
            ) =>
              item.turmaId
          )
          .filter(
            (
              turmaId:
                number | null
            ): turmaId is number =>
              typeof turmaId ===
                "number" &&
              Number.isInteger(
                turmaId
              )
          )
      )
    );

  if (
    turmaIds.length ===
    0
  ) {
    console.log(
      "\nNenhuma turma encontrada."
    );

    return;
  }

  const aulas =
    (
      await prisma.aula.findMany({
        where: {
          instituicaoId:
            aluno.instituicaoId,

          turmaId: {
            in:
              turmaIds,
          },
        },

        select: {
          id:
            true,

          titulo:
            true,

          turmaId:
            true,
        },

        orderBy: {
          id:
            "desc",
        },

        take:
          20,
      })
    ) as AulaConsulta[];

  console.log(
    "\n=== AULAS ENCONTRADAS ==="
  );

  console.log(
    aulas
  );

  const aulaIds =
    aulas.map(
      (
        aula:
          AulaConsulta
      ) =>
        aula.id
    );

  const presencas =
    aulaIds.length >
    0
      ? (
          await prisma.presencaAula.findMany({
            where: {
              instituicaoId:
                aluno.instituicaoId,

              alunoId,

              aulaId: {
                in:
                  aulaIds,
              },
            },

            select: {
              id:
                true,

              aulaId:
                true,

              alunoId:
                true,

              status:
                true,

              observacao:
                true,

              createdAt:
                true,

              updatedAt:
                true,
            },

            orderBy: {
              aulaId:
                "desc",
            },
          })
        ) as PresencaConsulta[]
      : [];

  console.log(
    "\n=== PRESENÇAS ATUAIS DO ABREU ==="
  );

  if (
    presencas.length ===
    0
  ) {
    console.log(
      "Nenhuma presença encontrada nas aulas consultadas."
    );
  }
  else {
    console.log(
      presencas
    );
  }
}

async function iniciar() {
  try {
    await executar();
  }
  finally {
    await prisma.$disconnect();
  }
}

void iniciar();