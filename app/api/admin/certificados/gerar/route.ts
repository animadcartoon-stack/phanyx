import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const alunoId = Number(body?.alunoId);

    if (!Number.isFinite(alunoId) || alunoId <= 0) {
      return NextResponse.json({ error: "Aluno inválido." }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    }

    const certificadoExistente = await prisma.certificado.findFirst({
      where: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (certificadoExistente) {
      return NextResponse.json({
        sucesso: true,
        reutilizado: true,
        message: "Certificado já existente para este aluno.",
        certificadoId: certificadoExistente.id,
      });
    }

    const novoCertificado = await prisma.certificado.create({
      data: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json({
      sucesso: true,
      message: "Certificado gerado com sucesso.",
      certificadoId: novoCertificado.id,
    });
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);

    return NextResponse.json(
      { error: "Erro ao gerar certificado." },
      { status: 500 }
    );
  }
}