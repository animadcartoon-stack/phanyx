import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  { params }: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const provaId = Number(params.provaId);

    if (!Number.isFinite(provaId) || provaId <= 0) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const tentativaFinalizada = await prisma.tentativaProva.findFirst({
      where: {
        alunoId: aluno.id,
        provaId,
        instituicaoId: user.instituicaoId,
        finalizada: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({
      jaFinalizou: Boolean(tentativaFinalizada),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar status da prova" },
      { status: 500 }
    );
  }
}