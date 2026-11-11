import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { professorAutorizado, paginaProfessorVisivel } from "@/lib/portal-professor-permissoes";
import { paginaVisivel } from "@/lib/portal-config";

export async function contextoAdmin() {
  const usuario = await getUserFromToken();
  return usuario?.instituicaoId && isAdminLike(usuario.role) ? { usuario, instituicaoId: usuario.instituicaoId } : null;
}

export async function contextoProfessor(chavePagina: string) {
  const usuario = await getUserFromToken();
  if (!usuario?.instituicaoId || usuario.role.toUpperCase() !== "PROFESSOR") return null;
  const professor = await professorAutorizado(usuario.id, usuario.instituicaoId, chavePagina);
  return professor ? { usuario, professor, instituicaoId: usuario.instituicaoId } : null;
}

export async function contextoProfessorAlgumaPagina() {
  const usuario = await getUserFromToken();
  if (!usuario?.instituicaoId || usuario.role.toUpperCase() !== "PROFESSOR") return null;
  const professor = await prisma.professor.findFirst({ where: { userId: usuario.id, instituicaoId: usuario.instituicaoId, ativo: true }, select: { id: true } });
  if (!professor) return null;
  const permitidas = await Promise.all(["professor.planejamento", "professor.relatorios", "professor.desenvolvimento"].map(chave => paginaProfessorVisivel(usuario.instituicaoId!, "PROFESSOR", chave, professor.id, false)));
  return permitidas.some(Boolean) ? { usuario, professor, instituicaoId: usuario.instituicaoId } : null;
}

export async function contextoAluno() {
  const usuario = await getUserFromToken();
  if (!usuario?.instituicaoId || usuario.role.toUpperCase() !== "ALUNO") return null;
  if (!await paginaVisivel(usuario.instituicaoId, "ALUNO", "aluno.desenvolvimento", false)) return null;
  const aluno = await prisma.aluno.findFirst({ where: { instituicaoId: usuario.instituicaoId, userId: usuario.id, ativo: true }, select: { id: true } });
  return aluno ? { usuario, aluno, instituicaoId: usuario.instituicaoId } : null;
}

export async function turmaDoProfessor(instituicaoId: number, professorId: number, turmaId: number) {
  return prisma.turma.findFirst({
    where: { instituicaoId, id: turmaId, ativa: true, OR: [
      { professorId }, { disciplinas: { some: { professorId, instituicaoId } } },
      { sessoesOptativasAvulsas: { some: { instituicaoId, sessao: { professorId, instituicaoId, ativa: true } } } },
    ] },
    select: { id: true, nome: true, cursoId: true },
  });
}

export async function alunoMatriculadoNaTurma(instituicaoId: number, alunoId: number, turmaId: number, professorId?: number) {
  if (professorId) {
    const geral = await prisma.turma.findFirst({where:{instituicaoId,id:turmaId,OR:[{professorId},{disciplinas:{some:{instituicaoId,professorId}}}]},select:{id:true}});
    // Docentes vinculados apenas a sessões optativas só acessam seus próprios alunos.
    if (!geral) {
      const optativa = await prisma.matriculaOptativaAvulsa.findFirst({where:{instituicaoId,turmaId,
        oferta:{sessao:{instituicaoId,professorId,ativa:true}},
        vinculo:{matricula:{instituicaoId,alunoId,excluidaEm:null,canceladaEm:null,status:{not:"CANCELADA"}}},
      },select:{id:true}});
      return Boolean(optativa);
    }
  }
  const matricula = await prisma.matricula.findFirst({
    where: { instituicaoId, alunoId, excluidaEm: null, canceladaEm: null, status: { not: "CANCELADA" },
      OR: [
        { turmaPrincipalId: turmaId },
        { itens: { some: { turmaId, instituicaoId } } },
        { turmasAvulsas: { some: { turmaId, instituicaoId } } },
      ],
    }, select: { id: true },
  });
  return Boolean(matricula);
}

export function textoCurto(valor: unknown, max = 4000) {
  return String(valor ?? "").trim().slice(0, max);
}

export function dataCivil(valor: unknown): Date | null {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const data = new Date(`${valor}T00:00:00.000Z`);
  return Number.isNaN(data.getTime()) || data.toISOString().slice(0,10) !== valor ? null : data;
}

export async function periodicidadeTurma(instituicaoId: number, cursoId: number | null) {
  const regras = await prisma.regraPlanejamentoAula.findMany({
    where: { instituicaoId, cursoId: { in: [0, cursoId ?? 0] } },
  });
  const regra = regras.find(r => r.cursoId === cursoId && cursoId !== 0) ?? regras.find(r => r.cursoId === 0);
  return { periodicidade: regra?.periodicidade ?? "SEMANAL", exigeAprovacao: regra?.exigeAprovacao ?? true };
}

export function periodoCompativel(periodicidade: string, inicio: Date, fim: Date) {
  const dias = Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1;
  if (dias < 1) return false;
  if (periodicidade === "SEMANAL") return dias <= 7;
  if (periodicidade === "MENSAL") return dias <= 31;
  if (periodicidade === "ANUAL") return dias <= 366;
  return false;
}
