import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";
import { createAlternativaSchema } from "@/lib/validators/prova";

export async function POST(
  req: NextRequest,
  ctx: { params: { provaId: string; questaoId: string } }
) {
  try {
    const user = getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const professor = await prisma.professor.findUnique({
      where: { userId: user.id },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provaId = Number(ctx.params.provaId);
    const questaoId = Number(ctx.params.questaoId);

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: professor.id,
      instituicaoId: user.instituicaoId,
    });

    if (prova.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só pode editar alternativas em RASCUNHO" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = createAlternativaSchema.safeParse({
      ...body,
      correta:
        body.correta !== undefined && body.correta !== null
          ? Boolean(body.correta)
          : false,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { texto, correta } = parsed.data;

    const questao = await prisma.questao.findFirst({
      where: {
        id: questaoId,
        provaId,
      },
    });

    if (!questao) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    const last: any = await prisma.alternativa.findFirst({
      where: { questaoId },
      orderBy: { ordem: "desc" } as any,
      select: { ordem: true } as any,
    });

    if (correta === true) {
      await prisma.alternativa.updateMany({
        where: { questaoId },
        data: { correta: false },
      });
    }

    const alternativa = await prisma.alternativa.create({
      data: {
        questaoId,
        texto,
        correta: correta ?? false,
        ordem: last ? last.ordem + 1 : 1,
      } as any,
    });

    return NextResponse.json(alternativa, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao criar alternativa" },
      { status: 500 }
    );
  }
}