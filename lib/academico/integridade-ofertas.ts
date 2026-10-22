import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { disciplinaPermitidaNaOferta, numeroSemestreOferta } from "./grade-oferta";

type BancoAcademico = Prisma.TransactionClient;
const mensagens = {
  VINCULO_INVALIDO: "Um dos identificadores informados é inválido.",
  CURSO_INVALIDO: "O curso não pertence a esta instituição.",
  DISCIPLINAS_INVALIDAS: "Uma ou mais disciplinas não pertencem a esta instituição.",
  GRADE_INCOMPATIVEL: "Uma ou mais disciplinas não fazem parte da grade do curso e semestre selecionados.",
  PROFESSOR_INVALIDO: "Um ou mais professores não pertencem a esta instituição.",
  POLO_INVALIDO: "O polo não pertence a esta instituição.",
  TURMA_INVALIDA: "Uma ou mais turmas não pertencem a esta instituição.",
  PRE_REQUISITO_INVALIDO: "Um ou mais pré-requisitos não pertencem a esta instituição.",
  DADOS_ALTERADOS: "Os dados acadêmicos foram alterados simultaneamente. Atualize a página, confira a seleção e tente novamente.",
  ETAPA_COM_HISTORICO: "Não é possível mudar o curso ou a etapa de uma oferta com histórico acadêmico. Preserve a turma atual e organize a progressão por nova oferta ou rematrícula.",
  OFERTA_COM_HISTORICO: "Não é possível retirar esta oferta porque ela possui matrículas, aulas ou registros acadêmicos. Mantenha o vínculo e gerencie seu encerramento na turma.",
} as const;

export class ErroIntegridadeAcademica extends Error {
  constructor(public readonly codigo: keyof typeof mensagens) {
    super(mensagens[codigo]);
  }
}

export function respostaErroAcademico(error: unknown) {
  if (error instanceof ErroIntegridadeAcademica) {
    return NextResponse.json({ codigo: error.codigo, error: error.message }, {
      status: ["OFERTA_COM_HISTORICO", "ETAPA_COM_HISTORICO", "DADOS_ALTERADOS"].includes(error.codigo) ? 409 : 400,
    });
  }
  if ((error as { code?: string })?.code === "P2034") {
    return NextResponse.json({ codigo: "DADOS_ALTERADOS", error: mensagens.DADOS_ALTERADOS }, { status: 409 });
  }
  return null;
}

export function idOpcionalOferta(valor: unknown): number | null {
  if (valor == null || valor === "") return null;
  if (typeof valor !== "number" && typeof valor !== "string") throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
  return id;
}

export function idsOferta(valor: unknown): number[] {
  if (!Array.isArray(valor)) throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
  return [...new Set(valor.map(id => {
    const numero = idOpcionalOferta(id);
    if (numero === null) throw new ErroIntegridadeAcademica("VINCULO_INVALIDO");
    return numero;
  }))];
}

export function incluirGradeOferta(instituicaoId: number) {
  return {
    semestres: {
      where: { instituicaoId },
      select: {
        numero: true,
        disciplinas: {
          where: { instituicaoId, disciplina: { instituicaoId } },
          select: { disciplinaId: true },
        },
      },
    },
  } satisfies Prisma.CursoInclude;
}

export async function validarDisciplinasDaOferta(
  db: BancoAcademico,
  instituicaoId: number,
  cursoId: number | null,
  semestre: unknown,
  disciplinaIds: number[],
  idsHistoricos: number[] = [],
) {
  const curso = cursoId === null ? null : await db.curso.findFirst({
    where: { id: cursoId, instituicaoId }, select: { id: true, ...incluirGradeOferta(instituicaoId) },
  });
  if (cursoId !== null && !curso) throw new ErroIntegridadeAcademica("CURSO_INVALIDO");
  const disciplinas = await db.disciplina.findMany({
    where: { id: { in: disciplinaIds }, instituicaoId },
    select: { id: true, cursoId: true, semestre: true },
  });
  if (disciplinas.length !== disciplinaIds.length) throw new ErroIntegridadeAcademica("DISCIPLINAS_INVALIDAS");
  if (disciplinas.some(d => !idsHistoricos.includes(d.id) &&
    !disciplinaPermitidaNaOferta(d, curso, numeroSemestreOferta(semestre)))) {
    throw new ErroIntegridadeAcademica("GRADE_INCOMPATIVEL");
  }
}

export async function validarResponsaveisDaOferta(
  db: BancoAcademico, instituicaoId: number, poloId: number | null,
  professorId: number | null, disciplinaIds: number[], professores: Record<string, unknown>,
) {
  if (poloId !== null && !await db.polo.findFirst({ where: { id: poloId, instituicaoId }, select: { id: true } })) {
    throw new ErroIntegridadeAcademica("POLO_INVALIDO");
  }
  const ids = [...new Set([professorId, ...disciplinaIds.map(id => idOpcionalOferta(professores[id]))]
    .filter((id): id is number => id !== null))];
  if (ids.length) {
    const validos = await db.professor.findMany({ where: { id: { in: ids }, instituicaoId }, select: { id: true } });
    if (validos.length !== ids.length) throw new ErroIntegridadeAcademica("PROFESSOR_INVALIDO");
  }
}

export async function protegerHistoricoDasOfertas(
  db: BancoAcademico, instituicaoId: number, ofertas: { turmaId: number; disciplinaId: number }[],
  motivo: "OFERTA_COM_HISTORICO" | "ETAPA_COM_HISTORICO" = "OFERTA_COM_HISTORICO",
) {
  if (!ofertas.length) return;
  const where = { instituicaoId, OR: ofertas.map(({ turmaId, disciplinaId }) => ({ turmaId, disciplinaId })) };
  // Check academic history before changing any selected offering. Notes without
  // a discipline are protected through their class, conservatively.
  const historico = await Promise.all([
    db.itemMatricula.count({ where }), db.aula.count({ where }),
    db.atividade.count({ where }), db.prova.count({ where }), db.resultadoFinal.count({ where }),
    db.matriculaDisciplinaContratada.count({ where: {
      instituicaoId, OR: ofertas.map(({ turmaId, disciplinaId }) => ({
        disciplinaId, matricula: { instituicaoId, turmaPrincipalId: turmaId },
      })),
    } }),
    db.rematriculaSemestralItem.count({ where: {
      instituicaoId, OR: ofertas.map(({ turmaId, disciplinaId }) => ({
        disciplinaId, turmaDisciplina: { instituicaoId, turmaId },
      })),
    } }),
    db.nota.count({ where: { instituicaoId, turmaId: { in: [...new Set(ofertas.map(o => o.turmaId))] } } }),
  ]);
  if (historico.some(total => total > 0)) throw new ErroIntegridadeAcademica(motivo);
}

export async function sincronizarTurmasDaDisciplina(
  db: BancoAcademico, instituicaoId: number, disciplinaId: number,
  turmaIds: number[], professorPadraoId: number | null,
) {
  const turmas = await db.turma.findMany({ where: { id: { in: turmaIds }, instituicaoId } });
  if (turmas.length !== turmaIds.length) throw new ErroIntegridadeAcademica("TURMA_INVALIDA");
  const existentes = await db.turmaDisciplina.findMany({ where: { instituicaoId, disciplinaId } });
  const mantidos = new Set(existentes.map(v => v.turmaId));
  const remover = existentes.filter(v => !turmaIds.includes(v.turmaId));
  await protegerHistoricoDasOfertas(db, instituicaoId, remover);
  for (const turma of turmas.filter(t => !mantidos.has(t.id))) {
    await validarDisciplinasDaOferta(db, instituicaoId, turma.cursoId, turma.semestre, [disciplinaId]);
  }
  if (remover.length) await db.turmaDisciplina.deleteMany({
    where: { instituicaoId, id: { in: remover.map(v => v.id) } },
  });
  const novas = turmas.filter(t => !mantidos.has(t.id));
  for (const turma of novas) {
    await validarResponsaveisDaOferta(db, instituicaoId, turma.poloId, turma.professorId,
      [disciplinaId], { [disciplinaId]: professorPadraoId });
    const numero = numeroSemestreOferta(turma.semestre);
    let etapa = numero === null ? null : await db.turmaSemestre.findFirst({
      where: { instituicaoId, turmaId: turma.id, numero }, orderBy: { id: "desc" },
    });
    if (numero !== null && !etapa) etapa = await db.turmaSemestre.create({
      data: { instituicaoId, turmaId: turma.id, numero, status: "A_INICIAR" },
    });
    await db.turmaDisciplina.createMany({
      data: [{ turmaId: turma.id, disciplinaId, instituicaoId,
        professorId: professorPadraoId, turmaSemestreId: etapa?.id ?? null }],
      skipDuplicates: true,
    });
  }
  // Retained offerings are deliberately untouched: their IDs, schedules,
  // assigned teachers, dates and semester links belong to the offering.
}
