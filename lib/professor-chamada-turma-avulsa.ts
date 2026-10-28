// Chamada de turmas com matricula direta, sem disciplina sintetica.
// Mantem as aulas e presencas legadas intactas.
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UsuarioLogado } from "@/lib/server-auth";
import { ErroChamada, validarEncontro, validarPresencasEncontro } from "@/lib/chamada-encontro";

const TITULO_PREFIXO = "Chamada avulsa: ";
type Banco = PrismaClient;
type DadosTurma = {
  id: number;
  nome: string;
  dataInicio: Date | null;
  dataFim: Date | null;
  curso: { id: number; nome: string } | null;
  horariosAvulsos: { diaSemana: number; horaInicio: string; horaFim: string }[];
};

export function validarHorarioChamadaAvulsa(
  turma: DadosTurma,
  data: unknown,
  hora: unknown,
) {
  const encontro = validarEncontro(data, hora);
  const dia = encontro.dataEncontro.getUTCDay();
  const dataCivil = encontro.dataEncontro.toISOString().slice(0, 10);
  if ((turma.dataInicio && dataCivil < turma.dataInicio.toISOString().slice(0, 10)) ||
      (turma.dataFim && dataCivil > turma.dataFim.toISOString().slice(0, 10)) ||
      !turma.horariosAvulsos.some(h => h.diaSemana === dia && h.horaInicio === hora)) {
    throw new ErroChamada("invalidMeeting", 400);
  }
  return encontro;
}

const filtroTurma = (instituicaoId: number, turmaId: number, professorId: number): Prisma.TurmaWhereInput => ({
  id: turmaId,
  instituicaoId,
  professorId,
  ativa: true,
  statusTurma: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] },
  curso: { instituicaoId, ativo: true, excluidoEm: null, matriculaDiretaTurma: true },
});
const selecaoTurma = {
  id: true,
  nome: true,
  dataInicio: true,
  dataFim: true,
  curso: { select: { id: true, nome: true } },
  horariosAvulsos: { where: { ativo: true }, select: { diaSemana: true, horaInicio: true, horaFim: true } },
} as const;

export async function autorizarChamadaTurmaAvulsa(
  user: UsuarioLogado,
  turmaId: number,
  database: Banco = prisma,
) {
  if (!user || String(user.role || "").toUpperCase() !== "PROFESSOR" ||
      !Number.isSafeInteger(user.instituicaoId) || user.instituicaoId <= 0) {
    throw new ErroChamada("unauthorized", 401);
  }
  if (!Number.isSafeInteger(turmaId) || turmaId <= 0) throw new ErroChamada("invalidClass");
  const professor = await database.professor.findFirst({
    where: { instituicaoId: user.instituicaoId, userId: user.id }, select: { id: true },
  });
  if (!professor) throw new ErroChamada("forbidden", 403);
  const turma = await database.turma.findFirst({
    where: filtroTurma(user.instituicaoId, turmaId, professor.id),
    select: selecaoTurma,
  });
  if (!turma?.curso || !turma.horariosAvulsos.length) throw new ErroChamada("forbidden", 403);
  return {
    instituicaoId: user.instituicaoId,
    professorId: professor.id,
    turmaId,
    turma,
  };
}

type Contexto = Awaited<ReturnType<typeof autorizarChamadaTurmaAvulsa>>;

function filtroVinculos(contexto: Contexto): Prisma.MatriculaTurmaAvulsaWhereInput {
  return {
    instituicaoId: contexto.instituicaoId,
    turmaId: contexto.turmaId,
    cursoId: contexto.turma.curso!.id,
    status: { in: ["A_CURSAR", "EM_CURSO"] },
    matricula: {
      instituicaoId: contexto.instituicaoId,
      excluidaEm: null,
      canceladaEm: null,
      status: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] },
      aluno: { instituicaoId: contexto.instituicaoId, ativo: true },
    },
  };
}

async function alunosDaTurma(database: Banco | Prisma.TransactionClient, contexto: Contexto, dataCivil: string) {
  const vinculos = await database.matriculaTurmaAvulsa.findMany({
    where: filtroVinculos(contexto),
    select: {
      matricula: {
        select: { alunoId: true, dataInicioCurso: true, aluno: { select: { id: true, nome: true } } },
      },
    },
  });
  const alunos = new Map<number, { alunoId: number; nome: string }>();
  for (const vinculo of vinculos) {
    const matricula = vinculo.matricula;
    if (matricula.dataInicioCurso && matricula.dataInicioCurso.toISOString().slice(0, 10) > dataCivil) continue;
    alunos.set(matricula.alunoId, { alunoId: matricula.alunoId, nome: matricula.aluno.nome });
  }
  return [...alunos.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function carregarChamadaTurmaAvulsa(
  contexto: Contexto,
  data: unknown,
  hora: unknown,
  database: Banco = prisma,
) {
  const encontro = validarHorarioChamadaAvulsa(contexto.turma, data, hora);
  const dataCivil = encontro.dataEncontro.toISOString().slice(0, 10);
  const filtro = {
    instituicaoId: contexto.instituicaoId,
    turmaId: contexto.turmaId,
    disciplinaId: null,
    titulo: { startsWith: TITULO_PREFIXO },
  };
  const [aulas, alunos, historico] = await Promise.all([
    database.aula.findMany({
      where: { ...filtro, ...encontro },
      take: 2,
      select: { id: true, presencas: {
        where: { instituicaoId: contexto.instituicaoId },
        select: { alunoId: true, status: true, observacao: true },
      } },
    }),
    alunosDaTurma(database, contexto, dataCivil),
    database.aula.findMany({
      where: { ...filtro, dataEncontro: { not: null } },
      orderBy: [{ dataEncontro: "desc" }, { horaEncontro: "desc" }],
      take: 50,
      select: { dataEncontro: true, horaEncontro: true, _count: { select: { presencas: true } } },
    }),
  ]);
  if (aulas.length > 1) throw new ErroChamada("conflict", 409);
  const anteriores = new Map((aulas[0]?.presencas || []).map(p => [p.alunoId, p]));
  return {
    turma: { id: contexto.turma.id, nome: contexto.turma.nome },
    curso: contexto.turma.curso,
    encontro: { data, hora, salvo: aulas.length === 1 },
    alunos: alunos.map(aluno => ({
      ...aluno,
      status: anteriores.get(aluno.alunoId)?.status ?? "",
      observacao: anteriores.get(aluno.alunoId)?.observacao ?? "",
    })),
    historico: historico.map(a => ({
      data: a.dataEncontro!.toISOString().slice(0, 10),
      hora: a.horaEncontro,
      alunos: a._count.presencas,
    })),
  };
}

export async function salvarChamadaTurmaAvulsa(
  contexto: Contexto,
  body: { data?: unknown; hora?: unknown; presencas?: unknown },
  operador: { usuarioId: number; impersonacaoId: number | null; ip: string | null; userAgent: string | null },
  database: Banco = prisma,
) {
  const encontro = validarHorarioChamadaAvulsa(contexto.turma, body.data, body.hora);
  const presencas = validarPresencasEncontro(body.presencas);
  const dataCivil = encontro.dataEncontro.toISOString().slice(0, 10);
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      return await database.$transaction(async tx => {
        // Serializa criacao do encontro para nao depender de UNIQUE com disciplinaId NULL.
        await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Turma" WHERE "id" = ${contexto.turmaId} AND "instituicaoId" = ${contexto.instituicaoId} FOR UPDATE`);
        const turmaAtual = await tx.turma.findFirst({
          where: filtroTurma(contexto.instituicaoId, contexto.turmaId, contexto.professorId),
          select: selecaoTurma,
        });
        if (!turmaAtual?.curso) throw new ErroChamada("forbidden", 403);
        validarHorarioChamadaAvulsa(turmaAtual, body.data, body.hora);
        const matriculados = await alunosDaTurma(tx, contexto, dataCivil);
        const permitidos = new Set(matriculados.map(aluno => aluno.alunoId));
        if (presencas.some(p => !permitidos.has(p.alunoId))) throw new ErroChamada("studentOutsideClass", 403);
        if (permitidos.size !== presencas.length) throw new ErroChamada("rosterChanged", 409);
        const filtro = {
          instituicaoId: contexto.instituicaoId,
          turmaId: contexto.turmaId,
          disciplinaId: null,
          titulo: { startsWith: TITULO_PREFIXO },
        };
        const aulas = await tx.aula.findMany({ where: { ...filtro, ...encontro }, take: 2, select: { id: true } });
        if (aulas.length > 1) throw new ErroChamada("conflict", 409);
        let aula = aulas[0];
        if (!aula) {
          const menor = await tx.aula.aggregate({ where: { ...filtro, dataEncontro: { not: null } }, _min: { ordem: true } });
          aula = await tx.aula.create({
            data: {
              instituicaoId: contexto.instituicaoId,
              turmaId: contexto.turmaId,
              disciplinaId: null,
              ...encontro,
              publicada: false,
              titulo: TITULO_PREFIXO + turmaAtual.curso.nome,
              ordem: Math.min(0, menor._min.ordem ?? 0) - 1,
            }, select: { id: true },
          });
        }
        const anteriores = await tx.presencaAula.findMany({
          where: { instituicaoId: contexto.instituicaoId, aulaId: aula.id },
          select: { alunoId: true, status: true, observacao: true },
        });
        const mapa = new Map(anteriores.map(a => [a.alunoId, a]));
        for (const item of presencas) {
          const anterior = mapa.get(item.alunoId);
          if (anterior?.status === item.status && anterior?.observacao === item.observacao) continue;
          const presenca = await tx.presencaAula.upsert({
            where: { aulaId_alunoId: { aulaId: aula.id, alunoId: item.alunoId } },
            create: { instituicaoId: contexto.instituicaoId, aulaId: aula.id, ...item },
            update: { status: item.status, observacao: item.observacao },
            select: { id: true },
          });
          await tx.historicoPresencaAula.create({
            data: {
              instituicaoId: contexto.instituicaoId,
              presencaAulaId: presenca.id,
              ...operador,
              statusAnterior: anterior?.status ?? null,
              observacaoAnterior: anterior?.observacao ?? null,
              status: item.status,
              observacao: item.observacao,
            },
          });
        }
        return { aulaId: aula.id, alunoIds: presencas.map(p => p.alunoId) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 30000 });
    } catch (error) {
      const codigo = (error as { code?: string })?.code;
      if (codigo !== "P2002" && codigo !== "P2034") throw error;
      if (tentativa === 2) throw new ErroChamada("conflict", 409);
    }
  }
  throw new ErroChamada("conflict", 409);
}
