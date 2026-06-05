import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function podeCriarReuniao(role?: string) {
  return ["ADMIN", "FINANCEIRO", "SECRETARIA", "PROFESSOR"].includes(role || "");
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const reunioes = await prisma.reuniao.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        OR: [
          { criadoPorId: user.id },
          {
            participantes: {
              some: {
                userId: user.id,
              },
            },
          },
          ...(user.role === "ALUNO"
            ? [
                {
                  participantes: {
                    some: {
                      userId: user.id,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        participantes: true,
        turma: true,
        curso: true,
        professor: true,
      },
      orderBy: {
        dataHora: "asc",
      },
    });

    return NextResponse.json(reunioes);
  } catch (error: any) {
    console.error("Erro ao listar reuniões:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar reuniões" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeCriarReuniao(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const titulo = String(body.titulo || "").trim();
    const descricao = String(body.descricao || "").trim();
    const link = String(body.link || "").trim();
    const dataHora = body.dataHora ? new Date(body.dataHora) : null;
    const publicoTipo = String(body.publicoTipo || "").trim();

    const setor = body.setor ? String(body.setor).trim() : null;
    const turmaId = body.turmaId ? Number(body.turmaId) : null;
    const cursoId = body.cursoId ? Number(body.cursoId) : null;
    const participantesUserIds = Array.isArray(body.participantesUserIds)
      ? body.participantesUserIds.map(Number).filter(Boolean)
      : [];
    const participantesAlunoIds = Array.isArray(body.participantesAlunoIds)
      ? body.participantesAlunoIds.map(Number).filter(Boolean)
      : [];

    if (!titulo) {
      return NextResponse.json({ error: "Informe o título da reunião." }, { status: 400 });
    }

    if (!link) {
      return NextResponse.json({ error: "Informe o link da reunião." }, { status: 400 });
    }

    if (!dataHora || Number.isNaN(dataHora.getTime())) {
      return NextResponse.json({ error: "Informe data e hora válidas." }, { status: 400 });
    }

    if (!publicoTipo) {
      return NextResponse.json({ error: "Escolha o público da reunião." }, { status: 400 });
    }

    let professorId: number | null = null;

    if (user.role === "PROFESSOR") {
      const professor = await prisma.professor.findFirst({
        where: {
          userId: user.id,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      });

      professorId = professor?.id || null;
    }

    const participantesMap = new Map<
      string,
      {
        userId?: number | null;
        alunoId?: number | null;
        tipo: string;
        nome: string;
        email?: string | null;
        telefone?: string | null;
      }
    >();

    function adicionarParticipante(p: {
      userId?: number | null;
      alunoId?: number | null;
      tipo: string;
      nome: string;
      email?: string | null;
      telefone?: string | null;
    }) {
      const chave = `${p.userId || "sem-user"}-${p.alunoId || "sem-aluno"}-${p.email || p.nome}`;
      participantesMap.set(chave, p);
    }

    if (publicoTipo === "INDIVIDUAL") {
      if (participantesUserIds.length > 0) {
        const usuarios = await prisma.user.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            id: { in: participantesUserIds },
            ativo: true,
          },
        });

        usuarios.forEach((u) =>
          adicionarParticipante({
            userId: u.id,
            tipo: u.role,
            nome: u.nome,
            email: u.email,
          })
        );
      }

      if (participantesAlunoIds.length > 0) {
        const alunos = await prisma.aluno.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            id: { in: participantesAlunoIds },
            ativo: true,
          },
          include: {
            user: true,
          },
        });

        alunos.forEach((aluno) =>
          adicionarParticipante({
            userId: aluno.userId,
            alunoId: aluno.id,
            tipo: "ALUNO",
            nome: aluno.nome,
            email: aluno.user?.email || null,
            telefone: aluno.telefone || null,
          })
        );
      }
    }

    if (publicoTipo === "SETOR") {
  if (!setor) {
    return NextResponse.json(
      { error: "Escolha o setor da reunião." },
      { status: 400 }
    );
  }

  const funcionarios = await prisma.funcionario.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      ativo: true,
      setor,
      user: {
        ativo: true,
      },
    },
    include: {
      user: true,
    },
  });

  funcionarios.forEach((funcionario) =>
    adicionarParticipante({
      userId: funcionario.userId,
      tipo: funcionario.user.role,
      nome: funcionario.nome,
      email: funcionario.user?.email || null,
      telefone: funcionario.telefone || null,
    })
  );
}

if (publicoTipo === "TURMA") {
  if (!turmaId) {
    return NextResponse.json(
      { error: "Escolha uma turma para a reunião." },
      { status: 400 }
    );
  }

  const itens = await prisma.itemMatricula.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      turmaId,
      matricula: {
        status: "ATIVA",
        aluno: {
          ativo: true,
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

  itens.forEach((item) => {
    const aluno = item.matricula.aluno;

    adicionarParticipante({
      userId: aluno.userId,
      alunoId: aluno.id,
      tipo: "ALUNO",
      nome: aluno.nome,
      email: aluno.user?.email || null,
      telefone: aluno.telefone || null,
    });
  });
}

if (publicoTipo === "CURSO") {
  if (!cursoId) {
    return NextResponse.json(
      { error: "Escolha um curso para a reunião." },
      { status: 400 }
    );
  }

  const matriculas = await prisma.matricula.findMany({
    where: {
      instituicaoId: user.instituicaoId,
      cursoId,
      status: "ATIVA",
      aluno: {
        ativo: true,
      },
    },
    include: {
      aluno: {
        include: {
          user: true,
        },
      },
    },
  });

  matriculas.forEach((matricula) => {
    const aluno = matricula.aluno;

    adicionarParticipante({
      userId: aluno.userId,
      alunoId: aluno.id,
      tipo: "ALUNO",
      nome: aluno.nome,
      email: aluno.user?.email || null,
      telefone: aluno.telefone || null,
    });
  });
}

    if (publicoTipo === "TODA_EQUIPE") {
      const usuariosEquipe = await prisma.user.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          role: {
            in: ["ADMIN", "FINANCEIRO", "SECRETARIA"],
          },
        },
      });

      usuariosEquipe.forEach((u) =>
        adicionarParticipante({
          userId: u.id,
          tipo: u.role,
          nome: u.nome,
          email: u.email,
        })
      );
    }

    if (publicoTipo === "TODOS_ALUNOS") {
      const alunos = await prisma.aluno.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
        },
        include: {
          user: true,
        },
      });

      alunos.forEach((aluno) =>
        adicionarParticipante({
          userId: aluno.userId,
          alunoId: aluno.id,
          tipo: "ALUNO",
          nome: aluno.nome,
          email: aluno.user?.email || null,
          telefone: aluno.telefone || null,
        })
      );
    }

    if (participantesMap.size === 0) {
      return NextResponse.json(
        { error: "Nenhum participante encontrado para essa reunião." },
        { status: 400 }
      );
    }

    const reuniao = await prisma.reuniao.create({
      data: {
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        professorId,
        titulo,
        descricao: descricao || null,
        link,
        dataHora,
        publicoTipo,
        setor,
        turmaId,
        cursoId,
        enviarChat: true,
        enviarWhatsApp: false,
        participantes: {
          create: Array.from(participantesMap.values()),
        },
      },
      include: {
        participantes: true,
        turma: true,
        curso: true,
        professor: true,
      },
    });

    return NextResponse.json(reuniao);
  } catch (error: any) {
    console.error("Erro ao criar reunião:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar reunião" },
      { status: 500 }
    );
  }
}