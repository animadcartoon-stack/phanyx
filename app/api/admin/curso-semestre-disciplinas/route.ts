import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const { cursoSemestreId, disciplinaIds } = body;

    if (!cursoSemestreId || !Array.isArray(disciplinaIds)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    await prisma.cursoSemestreDisciplina.deleteMany({
      where: {
        cursoSemestreId: Number(cursoSemestreId),
      },
    });

    if (disciplinaIds.length > 0) {
      await prisma.cursoSemestreDisciplina.createMany({
        data: disciplinaIds.map((disciplinaId: number) => ({
          cursoSemestreId: Number(cursoSemestreId),
          disciplinaId: Number(disciplinaId),
          instituicaoId: user.instituicaoId,
        })),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao salvar disciplinas do semestre:", error);
    return NextResponse.json(
      { error: "Erro ao salvar disciplinas do semestre" },
      { status: 500 }
    );
  }
}