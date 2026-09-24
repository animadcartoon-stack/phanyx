import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { montarFiltroAtividadesProfessor } from "@/lib/services/atividadeProfessor.service";
import { solicitarReanalisePorAlteracaoAcademica } from "@/lib/student-success/solicitar-reanalise-por-alteracao-academica";
import { atividadePertenceAoProfessor } from "@/lib/services/atividadeProfessor.service";
import { corrigirEntregaSchema } from "@/lib/validators/atividade";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || String(user.role).toUpperCase() !== "PROFESSOR") {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
    }

        const filtroAtividades =
      await montarFiltroAtividadesProfessor({
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
      });

const atividades = await prisma.atividade.findMany({
      where: filtroAtividades,
      orderBy: { createdAt: "desc" },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
            semestre: true,
            periodoLetivo: true,
            curso: { select: { nome: true } },
          },
        },
        entregas: {
          orderBy: { entregueEm: "desc" },
          include: {
  aluno: {
    select: {
      id: true,
      nome: true,
      matricula: true,
    },
  },
  historicos: {
    orderBy: {
      versao: "desc",
    },
  },
},
        },
      },
    });

    const trabalhos = atividades.flatMap((atividade) =>
      atividade.entregas.map((entrega) => ({
        entregaId: entrega.id,
        atividadeId: atividade.id,
        titulo: atividade.titulo,
        notaMaxima: atividade.notaMaxima,
        statusAtividade: atividade.status,
        prazo: atividade.prazo,
        alunoId: entrega.alunoId,
        aluno: entrega.aluno?.nome || "Aluno não informado",
        matricula: entrega.aluno?.matricula || "",
        turmaId: atividade.turmaId,
        turma: atividade.turma?.nome || "Turma não informada",
        curso: atividade.turma?.curso?.nome || "",
        semestre: atividade.turma?.semestre || "Semestre não informado",
        periodoLetivo: atividade.turma?.periodoLetivo || "Período não informado",
        texto: entrega.texto,
        link: entrega.link,
        arquivoUrl: entrega.arquivoUrl,
        nota: entrega.nota,
        feedback: entrega.feedback,
        entregueEm: entrega.entregueEm,
        corrigidaEm: entrega.corrigidaEm,
        historicos: entrega.historicos || [],
        status: entrega.corrigidaEm || entrega.nota !== null ? "Avaliado" : "Enviado",
      }))
    );

    console.log(trabalhos);

    return NextResponse.json({ ok: true, trabalhos });
  } catch (e: any) {
    console.error("ERRO AO LISTAR TRABALHOS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar trabalhos" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      String(user.role).toUpperCase() !==
        "PROFESSOR"
    ) {
      return NextResponse.json(
        { error: "NAO_AUTORIZADO" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const entregaId =
      Number(body.entregaId);

    if (
      !Number.isFinite(entregaId) ||
      entregaId <= 0
    ) {
      return NextResponse.json(
        { error: "Entrega inv?lida" },
        { status: 400 }
      );
    }

    const professor =
      await prisma.professor.findFirst({
        where: {
          userId: user.id,
          instituicaoId:
            user.instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!professor) {
      return NextResponse.json(
        {
          error:
            "Professor n?o encontrado",
        },
        { status: 404 }
      );
    }

    const entrega =
      await prisma.entregaAtividade.findFirst({
        where: {
          id: entregaId,
          instituicaoId:
            user.instituicaoId,
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
        atividadeId:
          entrega.atividadeId,

        professorId:
          professor.id,

        instituicaoId:
          user.instituicaoId,
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
        entrega.atividade?.notaMaxima ||
          10
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

    const atualizada =
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

    try {
      await solicitarReanalisePorAlteracaoAcademica({
        instituicaoId:
          user.instituicaoId,

        alunoIds: [
          entrega.alunoId,
        ],

        executadoPorId:
          user.id,
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
      "ERRO AO AVALIAR TRABALHO:",
      e
    );

    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erro ao avaliar trabalho",
      },
      { status: 500 }
    );
  }
}
