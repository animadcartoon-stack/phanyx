import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { isAdminLike } from "@/lib/server-auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const turmas = await prisma.turma.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        curso: true,
        turmaDisciplinas: {
          include: {
            disciplina: {
              include: {
                curso: true,
              },
            },
          },
        },
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const turmasFormatadas = turmas.map((turma) => ({
      ...turma,
      disciplinas: turma.turmaDisciplinas.map((item) => item.disciplina),
    }));

    return NextResponse.json(turmasFormatadas);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar turmas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await request.json();

    const nome = String(body?.nome ?? "").trim();
    const codigo = String(body?.codigo ?? "").trim();
    const semestre = String(body?.semestre ?? "").trim();
    const periodoLetivo = String(body?.periodoLetivo ?? "").trim();
    const statusTurma = String(body?.statusTurma ?? "AGUARDANDO").trim();
    const ativa =
      body?.ativa !== undefined ? Boolean(body.ativa) : true;

    const capacidadeMinima =
      body?.capacidadeMinima !== undefined &&
      body?.capacidadeMinima !== null &&
      String(body.capacidadeMinima).trim() !== ""
        ? Number(body.capacidadeMinima)
        : null;

    const capacidadeMaxima =
      body?.capacidadeMaxima !== undefined &&
      body?.capacidadeMaxima !== null &&
      String(body.capacidadeMaxima).trim() !== ""
        ? Number(body.capacidadeMaxima)
        : null;

    const cursoId =
      body?.cursoId !== undefined &&
      body?.cursoId !== null &&
      String(body.cursoId).trim() !== ""
        ? Number(body.cursoId)
        : null;

    const disciplinaIds = Array.isArray(body?.disciplinaIds)
      ? body.disciplinaIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isFinite(id) && id > 0)
      : [];

    if (!nome || !semestre || !periodoLetivo) {
      return NextResponse.json(
        { error: "Nome, semestre e período letivo são obrigatórios" },
        { status: 400 }
      );
    }

    if (disciplinaIds.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos uma disciplina para a turma" },
        { status: 400 }
      );
    }

    const turmaExistente = await prisma.turma.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome,
        semestre,
      },
    });

    if (turmaExistente) {
      return NextResponse.json(
        { error: "Já existe uma turma com esse nome e semestre" },
        { status: 400 }
      );
    }

    const novaTurma = await prisma.turma.create({
      data: {
        nome,
        codigo: codigo || null,
        semestre,
        periodoLetivo: periodoLetivo || null,
        ativa,
        statusTurma,
        capacidadeMinima,
        capacidadeMaxima,
        cursoId,
        instituicaoId: user.instituicaoId,
        turmaDisciplinas: {
          create: disciplinaIds.map((disciplinaId: number) => ({
            disciplinaId,
            instituicaoId: user.instituicaoId,
          })),
        },
      },
      include: {
        curso: true,
        turmaDisciplinas: {
          include: {
            disciplina: {
              include: {
                curso: true,
              },
            },
          },
        },
        _count: {
          select: {
            itensMatricula: true,
          },
        },
      },
    });

    return NextResponse.json(novaTurma, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar turma" },
      { status: 500 }
    );
  }
}