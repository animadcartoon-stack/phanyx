import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { gerarCodigoCertificado } from "@/lib/certificados/assinatura";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const disciplinaId = Number(body?.disciplinaId);

    if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
      return NextResponse.json(
        { error: "Disciplina inválida." },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const existente = await prisma.certificado.findUnique({
      where: {
        alunoId_disciplinaId: {
          alunoId: aluno.id,
          disciplinaId,
        },
      },
    });

    if (existente) {
      return NextResponse.json({
        ok: true,
        existente: true,
        certificadoId: existente.id,
        codigo: existente.codigo,
      });
    }

    const criado = await prisma.certificado.create({
      data: {
        alunoId: aluno.id,
        disciplinaId,
        instituicaoId: user.instituicaoId,
        codigo: `TEMP-${Date.now()}`,
      },
    });

    const codigoAssinado = gerarCodigoCertificado({
      id: criado.id,
      alunoId: criado.alunoId,
      disciplinaId: criado.disciplinaId,
      instituicaoId: criado.instituicaoId,
      emitidoEm: criado.emitidoEm,
    });

    const certificado = await prisma.certificado.update({
      where: { id: criado.id },
      data: {
        codigo: codigoAssinado,
      },
    });

    return NextResponse.json({
      ok: true,
      certificadoId: certificado.id,
      codigo: certificado.codigo,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao gerar certificado",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}