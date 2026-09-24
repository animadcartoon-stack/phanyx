import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { corrigirEntregaSchema } from "@/lib/validators/atividade";
import { atividadePertenceAoProfessor } from "@/lib/services/atividadeProfessor.service";
import { solicitarReanalisePorAlteracaoAcademica } from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export async function PATCH(
  req: NextRequest,
  ctx: { params: { entregaId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const entregaId = Number(ctx.params.entregaId);

    if (
      !Number.isFinite(entregaId) ||
      entregaId <= 0
    ) {
      return NextResponse.json(
        { error: "Entrega inv?lida" },
        { status: 400 }
      );
    }

    const entrega =
      await prisma.entregaAtividade.findFirst({
        where: {
          id: entregaId,
          instituicaoId: auth.instituicaoId,
        },
        include: {
          atividade: true,
        },
      });

    if (!entrega) {
      return NextResponse.json(
        {
          error:
            "Entrega n?o encontrada ou sem permiss?o",
        },
        { status: 404 }
      );
    }

    try {
      await atividadePertenceAoProfessor({
        atividadeId: entrega.atividadeId,
        professorId: auth.professorId!,
        instituicaoId: auth.instituicaoId,
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Entrega n?o encontrada ou sem permiss?o",
        },
        { status: 404 }
      );
    }

    const body = await req.json();

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
      Number(
        entrega.atividade?.notaMaxima || 10
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Nota n?o pode ser maior que a nota m?xima da atividade",
        },
        { status: 400 }
      );
    }

    const updated =
      await prisma.entregaAtividade.update({
        where: {
          id: entregaId,
        },
        data: {
          nota: parsed.data.nota,
          feedback:
            parsed.data.feedback || null,
          corrigidaEm: new Date(),
        },
      });

    /*
     * Uma correcao altera o desempenho academico
     * e deve solicitar nova analise do Student Success.
     *
     * Uma eventual falha nessa reanalise nao deve
     * desfazer nem impedir a correcao da entrega.
     */
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

    return NextResponse.json(
      updated
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error:
          e.message ||
          "Erro ao corrigir entrega",
      },
      { status: 401 }
    );
  }
}
