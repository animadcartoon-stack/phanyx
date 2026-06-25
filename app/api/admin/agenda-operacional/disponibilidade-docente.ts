import { prisma } from "@/lib/prisma";

function calcularCargaSemanal(horarios: any[]) {
  return horarios.reduce((total, h) => {
    if (!h.horaInicio || !h.horaFim) return total;

    const [hi, mi] = String(h.horaInicio).split(":").map(Number);
    const [hf, mf] = String(h.horaFim).split(":").map(Number);

    if (!Number.isFinite(hi) || !Number.isFinite(hf)) return total;

    const inicio = hi * 60 + (mi || 0);
    const fim = hf * 60 + (mf || 0);

    return fim > inicio ? total + (fim - inicio) / 60 : total;
  }, 0);
}

export async function montarDisponibilidadeDocente(instituicaoId: number) {
  const professores = await prisma.professor.findMany({
    where: {
      instituicaoId,
      ativo: true,
    },
    include: {
      polo: true,
      turmas: {
        include: {
          curso: true,
        },
      },
      turmaDisciplinas: {
        include: {
          disciplina: true,
          turma: true,
          horarios: true,
        },
      },
    },
    orderBy: {
      nome: "asc",
    },
  });

  return professores.map((professor) => {
    const horarios = professor.turmaDisciplinas.flatMap((td) => td.horarios || []);
    const disciplinas = professor.turmaDisciplinas.map((td) => td.disciplina?.nome).filter(Boolean);
    const turmas = professor.turmaDisciplinas.map((td) => td.turma?.nome).filter(Boolean);

    return {
      id: professor.id,
      nome: professor.nome,
      polo: professor.polo?.nome || "",
      quantidadeTurmas: new Set(turmas).size,
      quantidadeDisciplinas: new Set(disciplinas).size,
      cargaHorariaSemanal: calcularCargaSemanal(horarios),
      status: horarios.length > 0 ? "COM_HORARIO" : "LIVRE_EAD",
      turmas: Array.from(new Set(turmas)),
      disciplinas: Array.from(new Set(disciplinas)),
    };
  });
}