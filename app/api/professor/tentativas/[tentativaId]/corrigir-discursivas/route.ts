import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { corrigirDiscursivasSchema } from "@/lib/validators/prova";
import { solicitarReanalisePorAlteracaoAcademica } from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { tentativaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const tentativaId = Number(ctx.params.tentativaId);

    const tentativa: any = await prisma.tentativaProva.findFirst({
      where: {
        id: tentativaId,
        prova: {
          disciplina: {
            professorId: auth.professorId!,
          },
        },
      },
      include: {
        prova: {
          include: {
            questoes: true,
          },
        },
        respostas: {
          include: {
            questao: true,
            alternativa: true,
          },
        },
      },
    });

    if (!tentativa) {
      return NextResponse.json(
        { error: "Tentativa não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const parsed = corrigirDiscursivasSchema.safeParse({
      respostas: Array.isArray(body.respostas)
        ? body.respostas.map((r: any) => ({
            respostaId: Number(r.respostaId),
            nota: Number(r.nota),
            feedback: r.feedback ?? "",
          }))
        : [],
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

    // Atualiza cada resposta discursiva enviada
    for (const item of parsed.data.respostas) {
      const resposta: any = tentativa.respostas.find(
        (r: any) => r.id === item.respostaId
      );

      if (!resposta) {
        return NextResponse.json(
          { error: `Resposta ${item.respostaId} não pertence à tentativa` },
          { status: 400 }
        );
      }

      if (resposta.questao.tipo !== "discursiva") {
        return NextResponse.json(
          { error: `Resposta ${item.respostaId} não é discursiva` },
          { status: 400 }
        );
      }

      await prisma.respostaProva.update({
        where: { id: item.respostaId },
        data: {
          nota: item.nota,
          feedback: item.feedback ?? "",
          corrigidaEm: new Date(),
        } as any,
      });
    }

    // Recarrega respostas atualizadas
    const respostasAtualizadas: any[] = await prisma.respostaProva.findMany({
      where: { tentativaId },
      include: {
        questao: true,
        alternativa: true,
      },
    });

    // Recalcula nota total
    let notaTotal = 0;

    for (const resposta of respostasAtualizadas) {
      if (resposta.questao.tipo === "multipla_escolha") {
        if (resposta.alternativa?.correta) {
          notaTotal += Number(resposta.questao.valor || 0);
        }
      }

      if (resposta.questao.tipo === "discursiva") {
        notaTotal += Number(resposta.nota || 0);
      }
    }

    await prisma.tentativaProva.update({
  where: { id: tentativaId },
  data: {
    notaFinal: notaTotal,
    status: "CORRIGIDA",
  },
});

    /*
     * A correcao definitiva da prova altera
     * o desempenho academico do aluno.
     *
     * A falha da reanalise nao pode impedir
     * a correcao da tentativa.
     */
    try {
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId: auth.instituicaoId,

        alunoIds: [
          tentativa.alunoId,
        ],

        executadoPorId:
          auth.userId,
      });
    }
    catch (error) {
      console.error(
        "[STUDENT_SUCCESS_CORRECAO_PROVA_REANALISE]",
        error
      );
    }

    return NextResponse.json({
      success: true,
      nota: notaTotal,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}