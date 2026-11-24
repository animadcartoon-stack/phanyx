import { prisma } from "@/lib/prisma";
import { obterSubstituicoesAtivasProfessor, montarFiltroTurmaDisciplinaProfessor } from "@/lib/professor-escopo-academico";
import { camposAcademicos, preencherAcademico, legendaAcademica, type ChaveAcademica } from "./academico-automatico";
export async function opcoesAcademicas(instituicaoId: number, professorId: number) {
  const substituicoes = await obterSubstituicoesAtivasProfessor({ instituicaoId, professorId });
  const filtro = montarFiltroTurmaDisciplinaProfessor({ instituicaoId, professorId, substituicoes });
  const turmas = await prisma.turma.findMany({
    where: { instituicaoId, OR: [{ disciplinas: { some: filtro } }, { professorId, disciplinas: { none: {} } }] },
    select: { id:true, nome:true, modalidade:true, periodoLetivo:true, semestre:true, turno:true, sala:true,
      curso: { select: { nome:true, instituicaoId:true } }, polo: { select: { nome:true, instituicaoId:true } },
      disciplinas: { where: filtro, select: { id:true, disciplina: { select: { nome:true, instituicaoId:true, curso:{select:{nome:true,instituicaoId:true}} } } } } },
    orderBy: [{ nome:"asc" }, { id:"asc" }],
  });
  return turmas.flatMap(t => {
    const base = { turmaId:t.id, turma:t.nome, modalidade:t.modalidade, periodo:t.periodoLetivo, semestre:t.semestre, turno:t.turno, sala:t.sala,
      curso:t.curso?.instituicaoId===instituicaoId?t.curso.nome:null, polo:t.polo?.instituicaoId===instituicaoId?t.polo.nome:null };
    if (!t.disciplinas.length) return [{...base, ofertaId:0, disciplina:null as string|null}];
    return t.disciplinas.filter(d=>d.disciplina.instituicaoId===instituicaoId).map(d=>({...base, ofertaId:d.id, disciplina:d.disciplina.nome as string|null, curso:base.curso ?? (d.disciplina.curso?.instituicaoId===instituicaoId?d.disciplina.curso.nome:null)}));
  });
}
export async function resolverAcademico(html:string, instituicaoId:number, professorId:number, entrada:unknown) {
  const chaves = camposAcademicos(html);
  if (!chaves.length) return { html, turmaId:undefined };
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return null;
  const e = entrada as Record<string,unknown>;
  const turmaId = Number(e.turmaId), ofertaId = Number(e.ofertaId), ano = Number(e.ano), bimestre = Number(e.bimestre);
  const exigeTurma = chaves.some(k=>k!=="academicYear" && k!=="twoMonthTerm");
  const opcao = exigeTurma ? (await opcoesAcademicas(instituicaoId,professorId)).find(o=>o.turmaId===turmaId && o.ofertaId===ofertaId) : undefined;
  if (exigeTurma && !opcao) return null;
  if (chaves.includes("academicYear") && (!Number.isInteger(ano)||ano<1900||ano>2200)) return null;
  if (chaves.includes("twoMonthTerm") && (!Number.isInteger(bimestre)||bimestre<1||bimestre>4)) return null;
  const locale = typeof e.locale === "string" ? e.locale : "pt-BR";
  const falta = legendaAcademica(locale)[5];
  const valores: Partial<Record<ChaveAcademica,string>> = {
    className:opcao?.turma, courseName:opcao?.curso||falta, subjectName:opcao?.disciplina||legendaAcademica(locale)[3],
    academicModality:opcao?.modalidade||falta, academicPeriod:opcao?.periodo||falta, academicSemester:opcao?.semestre||falta,
    campusName:opcao?.polo||falta, classShift:opcao?.turno||falta, classroom:opcao?.sala||falta,
    academicYear:String(ano), twoMonthTerm:String(bimestre),
  };
  return { html:preencherAcademico(html,valores), turmaId:opcao?.turmaId };
}