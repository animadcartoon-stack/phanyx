import type { Prisma } from "@prisma/client";
import { incluirGradeOferta } from "./integridade-ofertas";

type Banco = Prisma.TransactionClient;
export async function carregarPainelTurmas(db: Banco, instituicaoId: number, somenteTurmas = false, incluirDisciplinas = true) {
  const cursoSelect = { id: true, nome: true, codigo: true, organizacaoCurricular: true, instituicaoId: true } as const;
  const professorSelect = { id: true, nome: true, instituicaoId: true } as const;
  const carregarTurmas = async () => {
    const turmas = await db.turma.findMany({
      where: { instituicaoId }, orderBy: { createdAt: "desc" },
      include: {
        curso: { select: cursoSelect }, polo: { select: { id: true, nome: true, instituicaoId: true } },
        professor: { select: professorSelect },
        disciplinas: {
          where: { instituicaoId, disciplina: { instituicaoId } },
          select: {
            id: true, professorId: true, dataInicio: true, dataFim: true, status: true, turmaSemestreId: true,
            professor: { select: professorSelect },
            disciplina: { select: { id: true, nome: true, codigo: true, cursoId: true, semestre: true, curso: { select: cursoSelect } } },
            horarios: { where: { instituicaoId, ativo: true }, orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
              select: { id: true, diaSemana: true, horaInicio: true, horaFim: true, ativo: true } },
          },
        },
      },
    });
    const ocupacoes = turmas.length ? await db.itemMatricula.findMany({
      where: { instituicaoId, turmaId: { in: turmas.map(t => t.id) }, status: { not: "CANCELADO" } },
      select: { turmaId: true, matriculaId: true }, distinct: ["turmaId", "matriculaId"],
    }) : [];
    const ocupacao = new Map<number, number>();
    for (const o of ocupacoes) ocupacao.set(o.turmaId, (ocupacao.get(o.turmaId) || 0) + 1);
    return turmas.map(t => ({ ...t,
      curso: (t.curso ?? t.disciplinas[0]?.disciplina.curso)?.instituicaoId === instituicaoId
        ? (t.curso ?? t.disciplinas[0]?.disciplina.curso) : null,
      polo: t.polo?.instituicaoId === instituicaoId ? t.polo : null,
      professor: t.professor?.instituicaoId === instituicaoId ? t.professor : null,
      matriculados: ocupacao.get(t.id) || 0,
      disciplinas: t.disciplinas.map(d => ({ ...d.disciplina,
        curso: d.disciplina.curso?.instituicaoId === instituicaoId ? d.disciplina.curso : null,
        turmaDisciplinaId: d.id, professorId: d.professorId,
        professor: d.professor?.instituicaoId === instituicaoId ? d.professor : null,
        dataInicio: d.dataInicio?.toISOString() ?? null, dataFim: d.dataFim?.toISOString() ?? null,
        status: d.status, turmaSemestreId: d.turmaSemestreId, horarios: d.horarios,
      })),
    }));
  };
  if (somenteTurmas) return { turmas: await carregarTurmas() };
  // Catalogs are loaded once; save/delete refresh only classes and occupancy.
  const [turmas, cursos, disciplinas, professores, polos] = await Promise.all([
    carregarTurmas(),
    db.curso.findMany({ where: { instituicaoId }, orderBy: { nome: "asc" },
      select: { ...cursoSelect, ...incluirGradeOferta(instituicaoId) } }),
    incluirDisciplinas ? db.disciplina.findMany({ where: { instituicaoId }, orderBy: { nome: "asc" },
      select: { id: true, nome: true, codigo: true, descricao: true, cursoId: true, semestre: true,
        curso: { select: cursoSelect } } }) : Promise.resolve([]),
    db.professor.findMany({ where: { instituicaoId }, select: professorSelect, orderBy: { nome: "asc" } }),
    // Selecting the local campus is an academic operation, not management of
    // independent institutions. The write API validates the same tenant scope.
    db.polo.findMany({ where: { instituicaoId }, select: { id: true, nome: true }, orderBy: [{ ativo: "desc" }, { nome: "asc" }] }),
  ]);
  return { turmas, cursos, disciplinas: disciplinas.map(d => ({ ...d,
    curso: d.curso?.instituicaoId === instituicaoId ? d.curso : null,
  })), professores, polos };
}
