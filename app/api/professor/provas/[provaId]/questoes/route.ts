import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";
import { createQuestaoSchema } from "@/lib/validators/prova";

export async function POST(
  req: NextRequest,
  ctx: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

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

    if (!Number.isFinite(provaId)) {
      return NextResponse.json({ error: "Prova inválida" }, { status: 400 });
    }

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: professor.id,
      instituicaoId: user.instituicaoId,
    });

    if (prova.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só pode editar questões em RASCUNHO" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = createQuestaoSchema.safeParse({
      ...body,
      valor:
        body.valor !== undefined && body.valor !== null && body.valor !== ""
          ? Number(body.valor)
          : undefined,
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

    const { enunciado, tipo, valor } = parsed.data;
    const tipoConvertido =
    tipo === "MULTIPLA_ESCOLHA" ? "multipla_escolha" : "discursiva";


    const last: any = await prisma.questao.findFirst({
      where: { provaId },
      orderBy: { ordem: "desc" } as any,
      select: { ordem: true } as any,
    });

   const questao = await prisma.questao.create({
  data: {
    provaId,
    enunciado,
    tipo: tipoConvertido as any,  // 👈 usa o enum direto
    valor: valor ?? 1,
    ordem: last ? last.ordem + 1 : 1,
  } as any,
});

    return NextResponse.json(questao, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao criar questão" },
      { status: 500 }
    );
  }
}