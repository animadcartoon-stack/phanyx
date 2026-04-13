import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { disciplinaId } = body;

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // 🔒 evita duplicidade
    const existente = await prisma.certificado.findUnique({
      where: {
        alunoId_disciplinaId: {
          alunoId: aluno.id,
          disciplinaId,
        },
      },
    });

    if (existente) {
      return NextResponse.json({ ok: true, existente: true });
    }

    const certificado = await prisma.certificado.create({
      data: {
        alunoId: aluno.id,
        disciplinaId,
        instituicaoId: user.instituicaoId,
        codigo: `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    return NextResponse.json({ ok: true, certificado });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao gerar certificado", detalhe: error.message },
      { status: 500 }
    );
  }
}