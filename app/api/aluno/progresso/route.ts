import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const body = await req.json();

    const aulaId = Number(body?.aulaId);
    const tempoAssistidoSegundos = Number(body?.tempoAssistidoSegundos ?? 0);
    const tempoMinimoSegundos = Number(body?.tempoMinimoSegundos ?? 0);
    const concluir = Boolean(body?.concluir);

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      return NextResponse.json(
        { error: "Aula inválida." },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const aula = await prisma.aula.findFirst({
      where: {
        id: aulaId,
        instituicaoId: auth.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aula) {
      return NextResponse.json(
        { error: "Aula não encontrada." },
        { status: 404 }
      );
    }

    const existente = await prisma.progressoAula.findFirst({
      where: {
        alunoId: aluno.id,
        aulaId: aula.id,
        instituicaoId: auth.instituicaoId,
      },
    });

    const novoTempoAssistido = Math.max(
      Number(existente?.tempoAssistidoSegundos ?? 0),
      Number.isFinite(tempoAssistidoSegundos) ? tempoAssistidoSegundos : 0
    );

    const novoTempoMinimo = Math.max(
      Number(existente?.tempoMinimoSegundos ?? 0),
      Number.isFinite(tempoMinimoSegundos) ? tempoMinimoSegundos : 0
    );

    if (concluir && novoTempoMinimo > 0 && novoTempoAssistido < novoTempoMinimo) {
      return NextResponse.json(
        {
          error: "Tempo mínimo de visualização ainda não atingido.",
          tempoAssistidoSegundos: novoTempoAssistido,
          tempoMinimoSegundos: novoTempoMinimo,
        },
        { status: 400 }
      );
    }

    let progresso;

    if (existente) {
      progresso = await prisma.progressoAula.update({
        where: {
          id: existente.id,
        },
        data: {
          tempoAssistidoSegundos: novoTempoAssistido,
          tempoMinimoSegundos: novoTempoMinimo,
          concluida: concluir ? true : existente.concluida,
          concluidaEm: concluir ? new Date() : existente.concluidaEm,
        },
      });
    } else {
      progresso = await prisma.progressoAula.create({
        data: {
          alunoId: aluno.id,
          aulaId: aula.id,
          instituicaoId: auth.instituicaoId,
          tempoAssistidoSegundos: novoTempoAssistido,
          tempoMinimoSegundos: novoTempoMinimo,
          concluida: concluir,
          concluidaEm: concluir ? new Date() : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      progresso,
    });
  } catch (err: any) {
    console.error("ERRO AO SALVAR PROGRESSO:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao salvar progresso" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
    });

    if (!aluno) {
      return NextResponse.json({ progresso: [] });
    }

    const progresso = await prisma.progressoAula.findMany({
      where: {
        alunoId: aluno.id,
        instituicaoId: auth.instituicaoId,
      },
      select: {
        id: true,
        aulaId: true,
        concluida: true,
        concluidaEm: true,
        tempoAssistidoSegundos: true,
        tempoMinimoSegundos: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      progresso,
    });
  } catch (err: any) {
    console.error("ERRO AO BUSCAR PROGRESSO:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao buscar progresso" },
      { status: 500 }
    );
  }
}