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
        polo: true, // 🔥 NOVO
        disciplinas: {
  include: {
    professor: {
      select: {
        id: true,
        nome: true,
      },
    },
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
      disciplinas: turma.disciplinas.map((item) => ({
  ...item.disciplina,
  professorId: item.professorId,
  professor: item.professor,
})),
      curso:
  turma.curso ??
  (turma.disciplinas.length > 0
    ? turma.disciplinas[0].disciplina.curso ?? null
    : null),
    }));

    return NextResponse.json(turmasFormatadas);
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
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
    const ativa = body?.ativa !== undefined ? Boolean(body.ativa) : true;

    const cursoId =
      body?.cursoId && Number(body.cursoId) > 0 ? Number(body.cursoId) : null;

    const professorId =
      body?.professorId && Number(body.professorId) > 0
        ? Number(body.professorId)
        : null;

    const poloId =
      body?.poloId && Number(body.poloId) > 0 ? Number(body.poloId) : null;

    const capacidadeMinima = body?.capacidadeMinima
      ? Number(body.capacidadeMinima)
      : null;

    const capacidadeMaxima = body?.capacidadeMaxima
      ? Number(body.capacidadeMaxima)
      : null;

    const disciplinaIds = Array.isArray(body?.disciplinaIds)
      ? body.disciplinaIds.map(Number).filter((id: number) => Number.isFinite(id))
      : [];

    const professoresPorDisciplina =
      body?.professoresPorDisciplina &&
      typeof body.professoresPorDisciplina === "object"
        ? body.professoresPorDisciplina
        : {};

    const datasInicioPorDisciplina =
      body?.datasInicioPorDisciplina &&
      typeof body.datasInicioPorDisciplina === "object"
        ? body.datasInicioPorDisciplina
        : {};

    const datasFimPorDisciplina =
      body?.datasFimPorDisciplina &&
      typeof body.datasFimPorDisciplina === "object"
        ? body.datasFimPorDisciplina
        : {};

    const statusPorDisciplina =
      body?.statusPorDisciplina &&
      typeof body.statusPorDisciplina === "object"
        ? body.statusPorDisciplina
        : {};

    if (!nome || !semestre || !periodoLetivo) {
      return NextResponse.json(
        { error: "Nome, semestre e período são obrigatórios" },
        { status: 400 }
      );
    }

    if (disciplinaIds.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos uma disciplina" },
        { status: 400 }
      );
    }

    const novaTurma = await prisma.$transaction(async (tx) => {
      const turmaCriada = await tx.turma.create({
        data: {
          nome,
          codigo: codigo || null,
          semestre,
          periodoLetivo,
          statusTurma: statusTurma as any,
          ativa,
          capacidadeMinima,
          capacidadeMaxima,
          instituicaoId: user.instituicaoId,
          cursoId,
          poloId,
          professorId,
        },
      });

      const novoSemestre = await tx.turmaSemestre.create({
        data: {
          turmaId: turmaCriada.id,
          instituicaoId: user.instituicaoId,
          numero: Number(semestre) || 1,
          status: "A_INICIAR",
        },
      });

      await tx.turmaDisciplina.createMany({
        data: disciplinaIds.map((id: number) => ({
          turmaId: turmaCriada.id,
          disciplinaId: id,
          professorId:
            professoresPorDisciplina[id] &&
            Number(professoresPorDisciplina[id]) > 0
              ? Number(professoresPorDisciplina[id])
              : null,
          dataInicio: datasInicioPorDisciplina[id]
            ? new Date(datasInicioPorDisciplina[id])
            : null,
          dataFim: datasFimPorDisciplina[id]
            ? new Date(datasFimPorDisciplina[id])
            : null,
          status: statusPorDisciplina[id] || "A_INICIAR",
          instituicaoId: user.instituicaoId,
          turmaSemestreId: novoSemestre.id,
        })),
      });

      return tx.turma.findUnique({
        where: { id: turmaCriada.id },
        include: {
          polo: true,
          professor: {
            select: {
              id: true,
              nome: true,
            },
          },
          disciplinas: {
            include: {
              professor: {
                select: {
                  id: true,
                  nome: true,
                },
              },
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
    });

    return NextResponse.json(novaTurma);
  } catch (error: any) {
    console.error("ERRO REAL AO CRIAR TURMA:", error);

    return NextResponse.json(
      {
        error: "Erro ao criar turma",
        detalhe: error?.message || "Erro interno desconhecido",
        codigo: error?.code || null,
      },
      { status: 500 }
    );
  }
}