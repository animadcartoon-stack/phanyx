import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { alunoId } = await req.json();

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // 🔥 BUSCAR MODELO SALVO
    const config = await prisma.configuracaoCertificado.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    if (!config) {
      return NextResponse.json({ error: "Modelo não configurado" }, { status: 400 });
    }

    // 🔥 SALVAR CERTIFICADO
    await prisma.certificado.create({
      data: {
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
        modelo: config.modelo,
        status: "PRONTO",
      },
    });

    return NextResponse.json({
      sucesso: true,
      message: "Certificado gerado com sucesso",
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro ao gerar certificado" }, { status: 500 });
  }
}