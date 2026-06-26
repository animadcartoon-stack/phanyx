import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcularStatus(dataInicio: Date, dataFim: Date | null, statusAtual: string) {
  if (statusAtual === "CANCELADA" || statusAtual === "ENCERRADA" || statusAtual === "SUSPENSA") {
    return statusAtual;
  }

  const hoje = inicioDoDia(new Date());
  const inicio = inicioDoDia(dataInicio);
  const fim = dataFim ? inicioDoDia(dataFim) : null;

  if (fim && hoje > fim) return "ENCERRADA";
  if (hoje >= inicio && (!fim || hoje <= fim)) return "ATIVA";

  return "AGENDADA";
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const registros = await prisma.substituicaoDocente.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        professorTitular: {
          select: {
            id: true,
            nome: true,
          },
        },
        professorSubstituto: {
          select: {
            id: true,
            nome: true,
          },
        },
        turma: {
          select: {
            id: true,
            nome: true,
            cursoId: true,
            curso: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        disciplina: {
          select: {
            id: true,
            nome: true,
            cursoId: true,
            curso: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    const items = registros.map((item) => ({
      id: item.id,
      status: calcularStatus(item.dataInicio, item.dataFim, item.status),
      professorTitular: item.professorTitular,
      professorSubstituto: item.professorSubstituto,
      curso: item.turma?.curso || item.disciplina?.curso || null,
      turma: item.turma,
      disciplina: item.disciplina,
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
      motivo: item.motivo,
      observacoes: item.observacoes,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("Erro ao listar substituições docentes:", error);

    return NextResponse.json(
      { error: "Erro ao listar substituições docentes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const professorTitularId = Number(body.professorTitularId);
    const professorSubstitutoId = Number(body.professorSubstitutoId);
    const turmaId = Number(body.turmaId);
    const disciplinaId = Number(body.disciplinaId);
    const dataInicio = body.dataInicio ? new Date(body.dataInicio) : null;
    const dataFim = body.dataFim ? new Date(body.dataFim) : null;

    if (!professorTitularId || !professorSubstitutoId || !turmaId || !disciplinaId || !dataInicio) {
      return NextResponse.json(
        { error: "Preencha professor titular, substituto, turma, disciplina e data inicial." },
        { status: 400 }
      );
    }

    if (professorTitularId === professorSubstitutoId) {
      return NextResponse.json(
        { error: "O professor substituto não pode ser o mesmo professor titular." },
        { status: 400 }
      );
    }

    if (dataFim && dataFim < dataInicio) {
      return NextResponse.json(
        { error: "A data final não pode ser anterior à data inicial." },
        { status: 400 }
      );
    }

    const [titular, substituto, turma, disciplina] = await Promise.all([
      prisma.professor.findFirst({
        where: {
          id: professorTitularId,
          instituicaoId: user.instituicaoId,
          ativo: true,
        },
        select: { id: true },
      }),
      prisma.professor.findFirst({
        where: {
          id: professorSubstitutoId,
          instituicaoId: user.instituicaoId,
          ativo: true,
        },
        select: { id: true },
      }),
      prisma.turma.findFirst({
        where: {
          id: turmaId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      }),
      prisma.disciplina.findFirst({
        where: {
          id: disciplinaId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      }),
    ]);

    if (!titular) {
      return NextResponse.json({ error: "Professor titular não encontrado." }, { status: 404 });
    }

    if (!substituto) {
      return NextResponse.json({ error: "Professor substituto não encontrado." }, { status: 404 });
    }

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada." }, { status: 404 });
    }

    if (!disciplina) {
      return NextResponse.json({ error: "Disciplina não encontrada." }, { status: 404 });
    }

    const existente = await prisma.substituicaoDocente.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        professorSubstitutoId,
        turmaId,
        disciplinaId,
        status: {
          in: ["AGENDADA", "ATIVA", "SUSPENSA"],
        },
      },
      select: { id: true },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Já existe uma substituição aberta para este professor, turma e disciplina." },
        { status: 400 }
      );
    }

    const statusInicial = calcularStatus(dataInicio, dataFim, "AGENDADA");

    const registro = await prisma.substituicaoDocente.create({
      data: {
        instituicaoId: user.instituicaoId,
        professorTitularId,
        professorSubstitutoId,
        turmaId,
        disciplinaId,
        dataInicio,
        dataFim,
        motivo: body.motivo || null,
        observacoes: body.observacoes || null,
        status: statusInicial,
        criadoPorId: user.id,
      },
    });

    return NextResponse.json({ ok: true, item: registro });
  } catch (error) {
    console.error("Erro ao criar substituição docente:", error);

    return NextResponse.json(
      { error: "Erro ao criar substituição docente" },
      { status: 500 }
    );
  }
}