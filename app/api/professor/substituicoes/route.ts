import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function inicioDoDia(data: Date) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcularStatus(dataInicio: Date, dataFim: Date | null, statusAtual: string) {
  if (["CANCELADA", "ENCERRADA", "SUSPENSA"].includes(statusAtual)) {
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

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const registros = await prisma.substituicaoDocente.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        professorSubstitutoId: professor.id,
        status: {
          notIn: ["CANCELADA"],
        },
      },
      orderBy: {
        dataInicio: "desc",
      },
      include: {
        professorTitular: {
          select: {
            id: true,
            nome: true,
          },
        },
        turma: {
          select: {
            id: true,
            nome: true,
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
          },
        },
      },
    });

    const items = registros.map((item) => ({
      id: item.id,
      status: calcularStatus(item.dataInicio, item.dataFim, item.status),
      dataInicio: item.dataInicio,
      dataFim: item.dataFim,
      motivo: item.motivo,
      observacoes: item.observacoes,
      professorTitular: item.professorTitular,
      turma: item.turma,
      disciplina: item.disciplina,
    }));

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error: any) {
    console.error("Erro ao listar substituições do professor:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao listar substituições" },
      { status: 500 }
    );
  }
}