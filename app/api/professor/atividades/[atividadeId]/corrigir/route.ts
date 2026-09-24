import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { corrigirEntregaSchema } from "@/lib/validators/atividade";
import { atividadePertenceAoProfessor } from "@/lib/services/atividadeProfessor.service";
import { solicitarReanalisePorAlteracaoAcademica } from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export async function POST(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId =
      Number(ctx.params.atividadeId);

    if (
      !Number.isFinite(atividadeId) ||
      atividadeId <= 0
    ) {
      return NextResponse.json(
        { error: "Atividade inv?lida" },
        { status: 400 }
      );
    }

    let atividade;

    try {
      atividade =
        await atividadePertenceAoProfessor({
          atividadeId,
          professorId: auth.professorId!,
          instituicaoId: auth.instituicaoId,
        });
    } catch {
      return NextResponse.json(
        {
          error:
            "Atividade n?o encontrada ou sem permiss?o",
        },
        { status: 404 }
      );
    }

    const body = await req.json();

    const alunoId =
      Number(body.alunoId);

    if (
      !Number.isFinite(alunoId) ||
      alunoId <= 0
    ) {
      return NextResponse.json(
        { error: "Aluno n?o informado" },
        { status: 400 }
      );
    }

    const parsed =
      corrigirEntregaSchema.safeParse({
        nota:
          body.nota !== undefined &&
          body.nota !== null &&
          body.nota !== ""
            ? Number(body.nota)
            : undefined,

        feedback:
          body.feedback ?? "",
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inv?lidos",
          details:
            parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (
      parsed.data.nota >
      Number(atividade.notaMaxima || 10)
    ) {
      return NextResponse.json(
        {
          error:
            "Nota n?o pode ser maior que a nota m?xima da atividade",
        },
        { status: 400 }
      );
    }

    const entrega =
      await prisma.entregaAtividade.findFirst({
        where: {
          atividadeId,
          alunoId,
          instituicaoId:
            auth.instituicaoId,
        },
      });

    if (!entrega) {
      return NextResponse.json(
        {
          error:
            "Entrega n?o encontrada",
        },
        { status: 404 }
      );
    }

    const atualizada =
      await prisma.entregaAtividade.update({
        where: {
          id: entrega.id,
        },

        data: {
          nota: parsed.data.nota,
          feedback:
            parsed.data.feedback || null,
          corrigidaEm: new Date(),
        },
      });

    try {
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId:
          auth.instituicaoId,

        alunoIds: [
          entrega.alunoId,
        ],

        executadoPorId:
          auth.userId,
      });
    } catch (error) {
      console.error(
        "[STUDENT_SUCCESS_CORRECAO_ATIVIDADE_REANALISE]",
        error
      );
    }

    return NextResponse.json({
      ok: true,
      entrega: atualizada,
    });
  } catch (e: any) {
    console.error(
      "ERRO AO CORRIGIR:",
      e
    );

    return NextResponse.json(
      {
        error:
          e.message ||
          "Erro ao corrigir",
      },
      { status: 500 }
    );
  }
}
