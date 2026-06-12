import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarProvas } from "@/lib/permissoesPlano";

export async function POST(
  req: Request,
  { params }: { params: { tentativaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!podeUsarProvas(user.plano || "ESSENCIAL")) {
      return NextResponse.json(
        {
          error:
            "Recurso disponível apenas nos planos Profissional e Enterprise",
        },
        { status: 403 }
      );
    }

    const tentativaId = Number(params.tentativaId);

    if (!Number.isFinite(tentativaId) || tentativaId <= 0) {
      return NextResponse.json(
        { error: "Tentativa inválida" },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const tentativa = await prisma.tentativaProva.findFirst({
      where: {
        id: tentativaId,
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        alunoId: true,
        provaId: true,
        finalizada: true,
        expiraEm: true,
        status: true,
      },
    });

    if (!tentativa) {
      return NextResponse.json(
        { error: "Tentativa não encontrada" },
        { status: 404 }
      );
    }

    if (tentativa.finalizada || tentativa.status === "FINALIZADA") {
      return NextResponse.json(
        { error: "Tentativa finalizada" },
        { status: 409 }
      );
    }

    if (tentativa.expiraEm && tentativa.expiraEm < new Date()) {
      return NextResponse.json(
        { error: "O tempo da prova terminou" },
        { status: 409 }
      );
    }

    const body = await req.json();

    const questaoId = Number(body.questaoId);

    if (!Number.isFinite(questaoId) || questaoId <= 0) {
      return NextResponse.json(
        { error: "Questão inválida" },
        { status: 400 }
      );
    }

    const questao = await prisma.questao.findFirst({
      where: {
        id: questaoId,
        provaId: tentativa.provaId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        tipo: true,
      },
    });

    if (!questao) {
      return NextResponse.json(
        { error: "Questão inválida para esta tentativa" },
        { status: 400 }
      );
    }

    let alternativaId: number | null = null;
    let respostaTexto: string | null = null;

    if (questao.tipo === "MULTIPLA_ESCOLHA") {
      alternativaId =
        body.alternativaId !== undefined && body.alternativaId !== null
          ? Number(body.alternativaId)
          : null;

      if (!alternativaId || !Number.isFinite(alternativaId)) {
        return NextResponse.json(
          { error: "Selecione uma alternativa" },
          { status: 400 }
        );
      }

      const alternativa = await prisma.alternativa.findFirst({
        where: {
          id: alternativaId,
          questaoId: questao.id,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!alternativa) {
        return NextResponse.json(
          { error: "Alternativa inválida para esta questão" },
          { status: 400 }
        );
      }
    }

    if (questao.tipo === "DISCURSIVA") {
      respostaTexto =
        body.respostaTexto !== undefined && body.respostaTexto !== null
          ? String(body.respostaTexto).trim()
          : "";

      if (!respostaTexto) {
        return NextResponse.json(
          { error: "Digite a resposta da questão" },
          { status: 400 }
        );
      }

      if (respostaTexto.length > 20000) {
        return NextResponse.json(
          { error: "A resposta está muito longa" },
          { status: 400 }
        );
      }
    }

    const saved = await prisma.respostaProva.upsert({
      where: {
        tentativaId_questaoId: {
          tentativaId,
          questaoId,
        },
      },
      update: {
        alternativaId,
        respostaTexto,
        corrigidaManual: false,
        correta: null,
        nota: null,
        feedback: null,
        corrigidaEm: null,
      },
      create: {
        tentativaId,
        questaoId,
        alternativaId,
        respostaTexto,
        alunoId: aluno.id,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        tentativaId: true,
        questaoId: true,
        alternativaId: true,
        respostaTexto: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      resposta: saved,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao salvar resposta" },
      { status: 500 }
    );
  }
}