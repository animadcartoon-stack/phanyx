import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";
import { updateQuestaoSchema } from "@/lib/validators/prova";

export async function PATCH(
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
        { error: "Só pode editar questões em RASCUNHO" },
        { status: 400 }
      );
    }

    

    const body = await req.json();
if (body.tipo === "multipla_escolha") {
  body.tipo = "MULTIPLA_ESCOLHA";
}

if (body.tipo === "discursiva") {
  body.tipo = "DISCURSIVA";
}
const parsed = updateQuestaoSchema.safeParse({
  ...body,
  valor:
    body.valor !== undefined && body.valor !== null && body.valor !== ""
      ? Number(body.valor)
      : undefined,
});

if (!parsed.success) {
  console.log("ERRO VALIDACAO QUESTAO:", parsed.error.flatten());

  return NextResponse.json(
    {
      error: "Dados inválidos",
      details: parsed.error.flatten(),
    },
    { status: 400 }
  );
}

const tipoConvertido =
  parsed.data.tipo === "MULTIPLA_ESCOLHA"
    ? "multipla_escolha"
    : parsed.data.tipo === "DISCURSIVA"
    ? "discursiva"
    : undefined;

const questao: any = await prisma.questao.findFirst({
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


const updated = await prisma.questao.update({
  where: { id: questaoId },
  data: {
    enunciado:
      parsed.data.enunciado !== undefined
        ? parsed.data.enunciado
        : questao.enunciado,
    
    tipo:
      parsed.data.tipo !== undefined
        ? tipoConvertido
        : questao.tipo,
    valor:
      parsed.data.valor !== undefined
        ? parsed.data.valor
        : questao.valor,
  } as any,
});

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(
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
        { error: "Só pode remover questões em RASCUNHO" },
        { status: 400 }
      );
    }

    const questao: any = await prisma.questao.findFirst({
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

    await prisma.questao.delete({
      where: { id: questaoId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}