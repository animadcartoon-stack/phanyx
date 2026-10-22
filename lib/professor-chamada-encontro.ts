import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UsuarioLogado } from "@/lib/server-auth";
import { montarFiltroTurmaDisciplinaProfessor, obterSubstituicoesAtivasProfessor } from "@/lib/professor-escopo-academico";
import { ErroChamada, validarEncontro, validarPresencasEncontro, type StatusChamada } from "@/lib/chamada-encontro";

const db = prisma as PrismaClient;

type PresencaAnterior = { alunoId: number; status: StatusChamada; observacao: string | null };

export async function autorizarChamadaEncontro(user: UsuarioLogado, turmaId: number, disciplinaId: number) {
  if (!user || user.role?.toUpperCase() !== "PROFESSOR" || !user.instituicaoId) {
    throw new ErroChamada("unauthorized", 401);
  }
  if (![turmaId, disciplinaId].every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new ErroChamada("invalidClass");
  }
  const instituicaoId = user.instituicaoId;
  const professor = await db.professor.findFirst({
    where: { userId: user.id, instituicaoId }, select: { id: true },
  });
  if (!professor) throw new ErroChamada("forbidden", 403);
  const substituicoes = await obterSubstituicoesAtivasProfessor({ instituicaoId, professorId: professor.id });
  const oferta = await db.turmaDisciplina.findFirst({
    where: {
      AND: [
        montarFiltroTurmaDisciplinaProfessor({ instituicaoId, professorId: professor.id, substituicoes }),
        { turmaId, disciplinaId, turma: { instituicaoId }, disciplina: { instituicaoId } },
      ],
    },
    select: {
      turma: { select: { id: true, nome: true } },
      disciplina: { select: { id: true, nome: true } },
    },
  });
  if (!oferta) throw new ErroChamada("forbidden", 403);
  return { instituicaoId, turmaId, disciplinaId, professorId: professor.id, ...oferta };
}

type ContextoChamada = Awaited<ReturnType<typeof autorizarChamadaEncontro>>;

function filtroAlunos(contexto: ContextoChamada): Prisma.ItemMatriculaWhereInput {
  return {
    instituicaoId: contexto.instituicaoId,
    turmaId: contexto.turmaId,
    disciplinaId: contexto.disciplinaId,
    status: { notIn: ["CANCELADO", "TRANCADO", "TRANSFERIDO"] },
    matricula: {
      instituicaoId: contexto.instituicaoId,
      excluidaEm: null,
      status: { notIn: ["CANCELADA", "TRANCADA", "TRANSFERIDA", "SUSPENSA"] },
      aluno: { instituicaoId: contexto.instituicaoId },
    },
  };
}

export async function carregarChamadaEncontro(contexto: ContextoChamada, data: unknown, hora: unknown) {
  const encontro = validarEncontro(data, hora);
  const filtro = { instituicaoId: contexto.instituicaoId, turmaId: contexto.turmaId, disciplinaId: contexto.disciplinaId };
  const [aula, itens, historico] = await Promise.all([
    db.aula.findFirst({
      where: { ...filtro, ...encontro },
      select: { id: true, presencas: { where: { instituicaoId: contexto.instituicaoId }, select: { alunoId: true, status: true, observacao: true } } },
    }),
    db.itemMatricula.findMany({
      where: filtroAlunos(contexto),
      select: { matricula: { select: { aluno: { select: { id: true, nome: true } } } } },
      orderBy: { matricula: { aluno: { nome: "asc" } } },
    }),
    db.aula.findMany({
      where: { ...filtro, dataEncontro: { not: null } },
      select: { id: true, dataEncontro: true, horaEncontro: true, _count: { select: { presencas: true } } },
      orderBy: [{ dataEncontro: "desc" }, { horaEncontro: "desc" }], take: 50,
    }),
  ]);
  const presencas = new Map<number, PresencaAnterior>(aula?.presencas.map((item: PresencaAnterior) => [item.alunoId, item]) ?? []);
  const alunos = new Map(itens.map((item) => {
    const aluno = item.matricula.aluno;
    return [aluno.id, { alunoId: aluno.id, nome: aluno.nome, status: presencas.get(aluno.id)?.status ?? "", observacao: presencas.get(aluno.id)?.observacao ?? "" }];
  }));
  return {
    turma: contexto.turma, disciplina: contexto.disciplina,
    encontro: { data, hora, salvo: Boolean(aula) },
    alunos: Array.from(alunos.values()),
    historico: historico.map((item) => ({ data: item.dataEncontro!.toISOString().slice(0, 10), hora: item.horaEncontro, alunos: item._count.presencas })),
  };
}

export async function salvarChamadaEncontro(
  contexto: ContextoChamada,
  body: { data?: unknown; hora?: unknown; presencas?: unknown },
  operador: { usuarioId: number; impersonacaoId: number | null; ip: string | null; userAgent: string | null }
) {
  const encontro = validarEncontro(body.data, body.hora);
  const presencas = validarPresencasEncontro(body.presencas);
  const filtro = { instituicaoId: contexto.instituicaoId, turmaId: contexto.turmaId, disciplinaId: contexto.disciplinaId };

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      return await db.$transaction(async (tx) => {
        // Revalida os alunos dentro da mesma transação da gravação.
        const itens = await tx.itemMatricula.findMany({
          where: filtroAlunos(contexto), select: { matricula: { select: { alunoId: true } } },
        });
        const permitidos = new Set(itens.map((item) => item.matricula.alunoId));
        if (presencas.some((item) => !permitidos.has(item.alunoId))) throw new ErroChamada("studentOutsideClass", 403);
        if (permitidos.size !== presencas.length) throw new ErroChamada("rosterChanged", 409);

        let aula = await tx.aula.findFirst({ where: { ...filtro, ...encontro }, select: { id: true } });
        if (!aula) {
          // Ordens negativas reservam os encontros sem alterar a sequência de conteúdo.
          const menor = await tx.aula.aggregate({ where: { ...filtro, dataEncontro: { not: null } }, _min: { ordem: true } });
          aula = await tx.aula.create({
            data: {
              ...filtro, ...encontro, publicada: false,
              titulo: contexto.disciplina.nome,
              ordem: Math.min(0, menor._min.ordem ?? 0) - 1,
            }, select: { id: true },
          });
        }
        const anteriores = await tx.presencaAula.findMany({
          where: { instituicaoId: contexto.instituicaoId, aulaId: aula.id },
          select: { alunoId: true, status: true, observacao: true },
        });
        const mapa = new Map<number, PresencaAnterior>(anteriores.map((item: PresencaAnterior) => [item.alunoId, item]));
        for (const item of presencas) {
          const anterior = mapa.get(item.alunoId);
          if (anterior?.status === item.status && anterior.observacao === item.observacao) continue;
          const presenca = await tx.presencaAula.upsert({
            where: { aulaId_alunoId: { aulaId: aula.id, alunoId: item.alunoId } },
            create: { instituicaoId: contexto.instituicaoId, aulaId: aula.id, ...item },
            update: { status: item.status, observacao: item.observacao },
            select: { id: true },
          });
          await tx.historicoPresencaAula.create({
            data: {
              instituicaoId: contexto.instituicaoId, presencaAulaId: presenca.id, ...operador,
              statusAnterior: anterior?.status ?? null, observacaoAnterior: anterior?.observacao ?? null,
              status: item.status, observacao: item.observacao,
            },
          });
        }
        return { aulaId: aula.id, alunoIds: presencas.map((item) => item.alunoId) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 30000 });
    } catch (error) {
      const codigo = (error as { code?: string })?.code;
      if (codigo !== "P2002" && codigo !== "P2034") throw error;
      if (tentativa === 2) throw new ErroChamada("conflict", 409);
    }
  }
  throw new ErroChamada("conflict", 409);
}
