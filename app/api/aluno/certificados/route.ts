import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    }

    const certificados = await prisma.certificado.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        emitidoEm: "desc",
      },
    });

    return NextResponse.json({ certificados });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao listar certificados.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}