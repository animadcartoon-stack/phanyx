import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// Listagem independente das turmas/disciplina tradicionais. O servidor
// define o escopo (professor + instituicao); a UI jamais escolhe esse escopo.
export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user || String(user.role || "").toUpperCase() !== "PROFESSOR" ||
        !Number.isSafeInteger(user.instituicaoId) || user.instituicaoId <= 0) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    const professor = await prisma.professor.findFirst({
      where: { instituicaoId: user.instituicaoId, userId: user.id },
      select: { id: true },
    });
    if (!professor) return NextResponse.json({ error: "Professor não encontrado" }, { status: 403 });

    const turmas = await prisma.turma.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        professorId: professor.id,
        ativa: true,
        statusTurma: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] },
        curso: { instituicaoId: user.instituicaoId, ativo: true, excluidoEm: null, matriculaDiretaTurma: true },
        horariosAvulsos: { some: { instituicaoId: user.instituicaoId, ativo: true } },
      },
      select: {
        id: true,
        nome: true,
        turno: true,
        periodoLetivo: true,
        statusTurma: true,
        capacidadeMaxima: true,
        curso: { select: { id: true, nome: true } },
        horariosAvulsos: {
          where: { instituicaoId: user.instituicaoId, ativo: true },
          select: { diaSemana: true, horaInicio: true, horaFim: true },
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
        },
        matriculasAvulsas: {
          where: {
            instituicaoId: user.instituicaoId,
            status: { in: ["A_CURSAR", "EM_CURSO"] },
            matricula: {
              instituicaoId: user.instituicaoId,
              excluidaEm: null,
              canceladaEm: null,
              status: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] },
              aluno: { instituicaoId: user.instituicaoId, ativo: true },
            },
          },
          select: { cursoId: true, matricula: { select: { alunoId: true } } },
        },
      },
      orderBy: [{ nome: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(turmas.map(turma => ({
      id: turma.id,
      nome: turma.nome,
      turno: turma.turno,
      periodoLetivo: turma.periodoLetivo,
      statusTurma: turma.statusTurma,
      capacidadeMaxima: turma.capacidadeMaxima,
      curso: turma.curso,
      horarios: turma.horariosAvulsos,
      alunos: new Set(turma.matriculasAvulsas.filter(v => v.cursoId === turma.curso?.id).map(v => v.matricula.alunoId)).size,
    })), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[PROFESSOR_TURMAS_AVULSAS_LISTA]", error);
    return NextResponse.json({ error: "Não foi possível carregar as turmas avulsas" }, { status: 500 });
  }
}
