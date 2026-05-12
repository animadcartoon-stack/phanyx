import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const limite = new Date();
    limite.setDate(limite.getDate() - 3);

    const cursos = await prisma.curso.findMany({
      where: {
        ativo: false,
        excluidoEm: {
          lte: limite,
        },
      },
      select: {
        id: true,
        nome: true,
        _count: {
          select: {
            matriculas: true,
            turmas: true,
            disciplinas: true,
            documentosGerados: true,
            periodosMatricula: true,
            disciplinasExtrasPermitidas: true,
            cursosPolos: true,
          },
        },
      },
    });

    let excluidos = 0;
    let mantidos = 0;

    for (const curso of cursos) {
      const temVinculos =
        curso._count.matriculas > 0 ||
        curso._count.turmas > 0 ||
        curso._count.disciplinas > 0 ||
        curso._count.documentosGerados > 0 ||
        curso._count.periodosMatricula > 0 ||
        curso._count.disciplinasExtrasPermitidas > 0;

      if (temVinculos) {
        mantidos++;
        continue;
      }

      await prisma.cursoPolo.deleteMany({
        where: {
          cursoId: curso.id,
        },
      });

      await prisma.curso.delete({
        where: {
          id: curso.id,
        },
      });

      excluidos++;
    }

    return NextResponse.json({
      ok: true,
      encontrados: cursos.length,
      excluidos,
      mantidosPorVinculo: mantidos,
    });
  } catch (error: any) {
    console.error("Erro ao limpar cursos excluídos:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao limpar cursos excluídos." },
      { status: 500 }
    );
  }
}