import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

type PresencaInput = {
  id?: number | string;
  alunoId?: number | string;
  status: string;
  observacao?: string | null;
};

type PresencaMapItem = {
  id: number;
  alunoId: number;
  status: string;
  observacao: string | null;
};

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ turmaId: string; aulaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
  return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
}

    const { turmaId: turmaIdParam, aulaId: aulaIdParam } = await params;
    const turmaId = Number(turmaIdParam);
    const aulaId = Number(aulaIdParam);

    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
    }

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "Aula inválida" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      },
      select: {
        id: true,
        nome: true,
        disciplinaId: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const aula = await prisma.aula.findFirst({
  where: {
    id: aulaId,
    turmaId: turma.id,
    instituicaoId: user.instituicaoId,
  },
  select: {
    id: true,
    titulo: true,
    turmaId: true,
  },
});

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada para esta turma" },
        { status: 404 }
      );
    }

    const itensMatricula = await prisma.itemMatricula.findMany({
      where: {
        turmaId: turma.id,
        instituicaoId: user.instituicaoId,
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
      orderBy: {
        id: "asc",
      },
    });

    const alunoIds = itensMatricula
      .map((item) => item.matricula?.aluno?.id)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));

    const presencas = alunoIds.length
      ? await prisma.presencaAula.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            aulaId: aula.id,
            alunoId: { in: alunoIds },
          },
        })
      : [];

    const presencasMap = new Map<number, PresencaMapItem>(
      presencas.map((p) => [
        p.alunoId,
        {
          id: p.id,
          alunoId: p.alunoId,
          status: String(p.status),
          observacao: p.observacao ?? null,
        },
      ])
    );

    const alunos = itensMatricula
      .map((item) => {
        const aluno = item.matricula?.aluno;
        if (!aluno) return null;

        const presenca = presencasMap.get(aluno.id);

        return {
          itemMatriculaId: item.id,
          alunoId: aluno.id,
          nome: aluno.nome,
          email: aluno.user?.email ?? null,
          matricula: aluno.matricula ?? null,
          statusAluno: aluno.statusAluno ?? null,
          statusItemMatricula: item.status ?? null,
          presenca: presenca
            ? {
                id: presenca.id,
                status: presenca.status,
                observacao: presenca.observacao,
              }
            : null,
        };
      })
      .filter(
        (
          item
        ): item is {
          itemMatriculaId: number;
          alunoId: number;
          nome: string;
          email: string | null;
          matricula: string | null;
          statusAluno: string | null;
          statusItemMatricula: string | null;
          presenca:
            | {
                id: number;
                status: string;
                observacao: string | null;
              }
            | null;
        } => item !== null
      );

    return NextResponse.json({
      turma,
      aula,
      alunos,
    });
  } catch (e: any) {
    console.error("ERRO GET PRESENCAS DA AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar presenças da aula" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ turmaId: string; aulaId: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
  return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
}

    const { turmaId: turmaIdParam, aulaId: aulaIdParam } = await params;
    const turmaId = Number(turmaIdParam);
    const aulaId = Number(aulaIdParam);

    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
    }

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json({ error: "Aula inválida" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      },
      select: {
        id: true,
        disciplinaId: true,
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const aula = await prisma.aula.findFirst({
  where: {
    id: aulaId,
    turmaId: turma.id,
    instituicaoId: user.instituicaoId,
  },
  select: {
    id: true,
    titulo: true,
    turmaId: true,
  },
});

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada para esta turma" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as {
      presencas: PresencaInput[];
    };

    const presencas = Array.isArray(body?.presencas) ? body.presencas : [];

    if (presencas.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma presença enviada" },
        { status: 400 }
      );
    }

    const itensMatricula = await prisma.itemMatricula.findMany({
      where: {
        turmaId: turma.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        matricula: {
          select: {
            alunoId: true,
          },
        },
      },
    });

    const alunoIdsPermitidos = new Set<number>(
      itensMatricula
        .map((item) => item.matricula?.alunoId)
        .filter((id): id is number => typeof id === "number" && Number.isFinite(id))
    );

    const statusPermitidos = ["PRESENTE", "FALTA", "JUSTIFICADA", "ATESTADO"];

    await prisma.$transaction(
      presencas.map((presenca: PresencaInput) => {
        const alunoId = Number(presenca.id || presenca.alunoId);
        const status = String(presenca.status || "").trim();
        const observacao =
          presenca.observacao !== undefined && presenca.observacao !== null
            ? String(presenca.observacao).trim() || null
            : null;

        if (!alunoId || !Number.isFinite(alunoId) || alunoId <= 0) {
  console.log("ERRO alunoId:", presenca);
  throw new Error("Aluno inválido na chamada");
}

        if (!alunoIdsPermitidos.has(alunoId)) {
          throw new Error("Há aluno fora desta turma na chamada");
        }

        if (!statusPermitidos.includes(status)) {
          throw new Error("Status de presença inválido");
        }

        return prisma.presencaAula.upsert({
          where: {
            aulaId_alunoId: {
              aulaId: aula.id,
              alunoId,
            },
          },
          update: {
            status: status as any,
            observacao,
          },
          create: {
            instituicaoId: user.instituicaoId,
            aulaId: aula.id,
            alunoId,
            status: status as any,
            observacao,
          },
        });
      })
    );

    return NextResponse.json({
      message: "Chamada salva com sucesso",
    });
  } catch (e: any) {
    console.error("ERRO POST PRESENCAS DA AULA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao salvar presenças da aula" },
      { status: 500 }
    );
  }
}