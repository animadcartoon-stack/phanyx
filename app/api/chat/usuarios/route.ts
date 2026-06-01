import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const ROLES_INSTITUICAO = [
  "ADMIN",
  "SECRETARIA",
  "COORDENADOR",
  "FINANCEIRO",
  "SUPORTE",
];

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    let where: any = {
      instituicaoId: user.instituicaoId,
      id: {
        not: user.id,
      },
      ativo: true,
    };

    if (user.role === "ALUNO") {
  const aluno = await prisma.aluno.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      matriculas: {
        select: {
          itens: {
            select: {
              turmaId: true,
              disciplinaId: true,
            },
          },
        },
      },
    },
  });

  const paresTurmaDisciplina =
    aluno?.matriculas.flatMap((matricula) =>
      matricula.itens.map((item) => ({
        turmaId: item.turmaId,
        disciplinaId: item.disciplinaId,
      }))
    ) || [];

  const professoresVinculados = await prisma.turmaDisciplina.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      OR: paresTurmaDisciplina.map((par) => ({
        turmaId: par.turmaId,
        disciplinaId: par.disciplinaId,
      })),
      professorId: {
        not: null,
      },
    },
    select: {
      professor: {
        select: {
          userId: true,
        },
      },
    },
  });

  const professoresUserIds = professoresVinculados
    .map((item) => item.professor?.userId)
    .filter((id): id is number => typeof id === "number");

  where = {
    instituicaoId: user.instituicaoId,
    id: {
      in: professoresUserIds,
    },
    ativo: true,
    role: "PROFESSOR",
  };
}

   if (user.role === "PROFESSOR") {
  const professor = await prisma.professor.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
    select: { id: true },
  });

  if (!professor) {
    where = {
      instituicaoId: user.instituicaoId,
      id: { not: user.id },
      ativo: true,
      role: { in: ROLES_INSTITUICAO },
    };
  } else {
    const itens = await prisma.itemMatricula.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        turma: {
          instituicaoId: user.instituicaoId,
          disciplinas: {
            some: {
              disciplina: {
                OR: [
                  { professorId: professor.id },
                  {
                    professoresHabilitados: {
                      some: {
                        professorId: professor.id,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      include: {
        matricula: {
          include: {
            aluno: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const alunosUserIds = Array.from(
      new Set(
        itens
          .map((item) => item.matricula?.aluno?.userId)
          .filter((id): id is number => typeof id === "number")
      )
    );

    where = {
      instituicaoId: user.instituicaoId,
      id: { not: user.id },
      ativo: true,
      OR: [
        {
          role: {
            in: ROLES_INSTITUICAO,
          },
        },
        {
          id: {
            in: alunosUserIds,
          },
          role: "ALUNO",
        },
      ],
    };
  }
}

    if (ROLES_INSTITUICAO.includes(user.role)) {
  where = {
    instituicaoId: user.instituicaoId,
    id: {
      not: user.id,
    },
    ativo: true,
    role: {
      in: [
        "ADMIN",
        "SECRETARIA",
        "COORDENADOR",
        "FINANCEIRO",
        "SUPORTE",
        "PROFESSOR",
      ],
    },
  };
}

    if (user.role === "SUPER_ADMIN") {
      where = {
        id: {
          not: user.id,
        },
        ativo: true,
        role: {
          in: ["ADMIN", "SECRETARIA", "COORDENADOR", "SUPORTE"],
        },
      };
    }

    const usuarios = await prisma.user.findMany({
      where,
      select: {
  id: true,
  nome: true,
  email: true,
  role: true,
  ChatPresenca: true,
},
      orderBy: {
        nome: "asc",
      },
    });

const presencas = await prisma.chatPresenca.findMany({
  where: {
    usuarioId: {
      in: usuarios.map((u) => u.id),
    },
  },
});

const agora = Date.now();

const usuariosComPresenca = usuarios.map((usuario) => {
  const presenca = presencas.find((p) => p.usuarioId === usuario.id);

  const online =
    presenca?.status === "ONLINE" &&
    presenca?.ultimaAtividade &&
    agora - new Date(presenca.ultimaAtividade).getTime() < 60000;

  return {
    ...usuario,
    online,
  };
});

    return NextResponse.json({
  usuarios: usuariosComPresenca,
});
  } catch (error) {
    console.error("Erro ao carregar usuários do chat:", error);

    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    );
  }
}