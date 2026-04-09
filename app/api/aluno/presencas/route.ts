import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const presencas = await prisma.presencaAula.findMany({
      where: {
        alunoId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
      include: {
        aula: {
          include: {
            turma: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = presencas.length;

    const resumo = {
      total,
      presentes: presencas.filter(p => p.status === "PRESENTE").length,
      faltas: presencas.filter(p => p.status === "FALTA").length,
      justificadas: presencas.filter(p => p.status === "JUSTIFICADA").length,
      atestados: presencas.filter(p => p.status === "ATESTADO").length,
    };

    return NextResponse.json({
      ok: true,
      resumo,
      items: presencas.map(p => ({
        id: p.id,
        status: p.status,
        observacao: p.observacao,
        data: p.aula?.createdAt,
        aula: p.aula?.titulo,
        turma: p.aula?.turma?.nome,
      })),
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar presenças" },
      { status: 401 }
    );
  }
}