import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth, assertProfessor } from "@/lib/auth/getAuth";
import { updateAtividadeSchema } from "@/lib/validators/atividade";
import { atividadePertenceAoProfessor } from "@/lib/services/atividadeProfessor.service";
import {
  solicitarReanalisePorAlteracaoAcademica,
} from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";

export async function GET(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    await atividadePertenceAoProfessor({
      atividadeId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
      },
      include: {
  turma: {
    include: {
      disciplinas: {
        include: {
          disciplina: true,
        },
      },
    },
  },

  disciplina: true,
  anexos: true,

  entregas: {
    include: {
      aluno: true,
    },
    orderBy: {
      entregueEm: "desc",
    } as any,
  },
},
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(atividade);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao buscar atividade" },
      { status: 401 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    const atividade: any = await atividadePertenceAoProfessor({
      atividadeId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (atividade.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só é permitido editar atividade em RASCUNHO" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = updateAtividadeSchema.safeParse({
      ...body,
      turmaId:
        body.turmaId === null
          ? null
          : body.turmaId !== undefined && body.turmaId !== ""
          ? Number(body.turmaId)
          : undefined,
      notaMaxima:
        body.notaMaxima !== undefined && body.notaMaxima !== ""
          ? Number(body.notaMaxima)
          : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        titulo:
          parsed.data.titulo !== undefined
            ? parsed.data.titulo
            : atividade.titulo,
        descricao:
          parsed.data.descricao !== undefined
            ? parsed.data.descricao || null
            : atividade.descricao,
        prazo:
          parsed.data.prazo !== undefined
            ? parsed.data.prazo
              ? new Date(parsed.data.prazo)
              : null
            : atividade.prazo,
        notaMaxima:
          parsed.data.notaMaxima !== undefined
            ? parsed.data.notaMaxima
            : atividade.notaMaxima,
        turmaId:
          parsed.data.turmaId !== undefined
            ? parsed.data.turmaId
            : atividade.turmaId,
      } as any,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao atualizar atividade" },
      { status: 401 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    const atividade: any = await atividadePertenceAoProfessor({
      atividadeId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (atividade.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só é permitido excluir atividade em RASCUNHO" },
        { status: 400 }
      );
    }

    await prisma.atividade.delete({
      where: { id: atividadeId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao excluir atividade" },
      { status: 401 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertProfessor(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    const atividade: any = await atividadePertenceAoProfessor({
      atividadeId,
      professorId: auth.professorId!,
      instituicaoId: auth.instituicaoId,
    });

    if (atividade.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Somente atividades em RASCUNHO podem ser publicadas." },
        { status: 400 }
      );
    }

    const publicada = await prisma.atividade.update({
      where: { id: atividadeId },
      data: {
        status: "PUBLICADA",
        publicadaAt: new Date(),
        publicadoPorId: auth.userId,
      },
      include: {
        anexos: true,
        turma: true,
        disciplina: true,
      },
    });

    /*
 * Uma atividade recém-publicada só altera
 * imediatamente as pendências do Student
 * Success quando o prazo já está vencido.
 *
 * Se o prazo estiver no futuro, o vencimento
 * será percebido pelo processamento periódico.
 */
if (
  publicada.prazo &&
  publicada.prazo <
    new Date()
) {
  try {
    /*
     * Localizamos somente alunos realmente
     * vinculados à turma da atividade.
     *
     * Quando a atividade possui disciplina,
     * exigimos também o vínculo específico
     * turma + disciplina, exatamente como
     * o motor do Student Success faz.
     */
    const itensAfetados =
      await prisma.itemMatricula.findMany({
        where: {
          instituicaoId:
            auth.instituicaoId,

          turmaId:
            publicada.turmaId,

          ...(publicada.disciplinaId !==
          null
            ? {
                disciplinaId:
                  publicada.disciplinaId,
              }
            : {}),
        },

        select: {
          matricula: {
            select: {
              alunoId:
                true,
            },
          },
        },
      });

   const alunoIds =
  Array.from(
    new Set(
      itensAfetados
        .map(
          (
            item
          ) =>
            item.matricula
              .alunoId
        )
        .filter(
          (
            alunoId
          ): alunoId is number =>
            typeof alunoId ===
              "number" &&
            Number.isInteger(
              alunoId
            ) &&
            alunoId > 0
        )
    )
  );

    if (
      alunoIds.length >
      0
    ) {
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId:
          auth.instituicaoId,

        alunoIds,

        executadoPorId:
          auth.userId,
      });
    }
  }
  catch (error) {
    /*
     * A atividade já foi publicada.
     *
     * Uma eventual falha do Student Success
     * não pode transformar a publicação
     * da atividade em erro para o professor.
     */
    console.error(
      "[STUDENT_SUCCESS_ATIVIDADE_PUBLICADA_REANALISE]",
      error
    );
  }
}

    return NextResponse.json(publicada);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao publicar atividade" },
      { status: 401 }
    );
  }
}