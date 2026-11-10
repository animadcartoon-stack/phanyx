import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoProfessorAlgumaPagina, periodicidadeTurma } from "@/lib/acompanhamento-permissoes";

export const dynamic = "force-dynamic";
export async function GET() {
  const ctx = await contextoProfessorAlgumaPagina();
  if (!ctx) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const turmas = await prisma.turma.findMany({
    where: { instituicaoId: ctx.instituicaoId, ativa: true,
      OR: [{ professorId: ctx.professor.id }, { disciplinas: { some: { instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id } } }, { sessoesOptativasAvulsas: { some: { instituicaoId: ctx.instituicaoId, sessao: { instituicaoId: ctx.instituicaoId, professorId: ctx.professor.id, ativa: true } } } }],
    },
    select: { id: true, nome: true, cursoId: true, professorId: true, disciplinas: {where:{instituicaoId:ctx.instituicaoId,professorId:ctx.professor.id},select:{id:true}}, curso: { select: { nome: true } } },
    orderBy: { nome: "asc" }, take: 200,
  });
  const saida = await Promise.all(turmas.map(async turma => {
    const matriculas = await prisma.matricula.findMany({
      where: { instituicaoId: ctx.instituicaoId, excluidaEm: null, canceladaEm: null,
        OR: [{ turmaPrincipalId: turma.id }, { itens: { some: { turmaId: turma.id, instituicaoId: ctx.instituicaoId } } }, { turmasAvulsas: { some: { turmaId: turma.id, instituicaoId: ctx.instituicaoId } } }],
      }, select: { aluno: { select: { id: true, nome: true } } }, take: 250,
    });
    const geral = turma.professorId === ctx.professor.id || turma.disciplinas.length > 0;
    const optativas = geral ? [] : await prisma.matriculaOptativaAvulsa.findMany({where:{instituicaoId:ctx.instituicaoId,turmaId:turma.id,
      oferta:{sessao:{instituicaoId:ctx.instituicaoId,professorId:ctx.professor.id,ativa:true}},
      vinculo:{matricula:{instituicaoId:ctx.instituicaoId,excluidaEm:null,canceladaEm:null,status:{not:"CANCELADA"}}},
    },select:{vinculo:{select:{matricula:{select:{aluno:{select:{id:true,nome:true}}}}}}},take:250});
    const alunos = [...new Map<number, { id: number; nome: string }>((geral ? matriculas.map(m=>m.aluno) : optativas.map(o=>o.vinculo.matricula.aluno)).map(a => [a.id,a] as const)).values()].sort((a,b)=>a.nome.localeCompare(b.nome));
    return { id:turma.id,nome:turma.nome,cursoId:turma.cursoId,curso:turma.curso, alunos, regra: await periodicidadeTurma(ctx.instituicaoId, turma.cursoId) };
  }));
  return NextResponse.json({ turmas: saida }, { headers: { "Cache-Control": "private, no-store" } });
}
