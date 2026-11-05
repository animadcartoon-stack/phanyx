import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { ErroChamada, validarEncontro, validarPresencasEncontro } from "@/lib/chamada-encontro";
import { vinculoOptativaOcupante } from "@/lib/matriculas/optativas-avulsas-servidor";
import { cabeNoHorario, distribuirRegencia, type HorarioOptativa } from "@/lib/matriculas/optativas-avulsas";

export const dynamic = "force-dynamic";

async function identidade() {
  const user = await getUserFromToken();
  if (!user || user.role !== "PROFESSOR" || !user.instituicaoId) throw new ErroChamada("unauthorized", 401);
  const professor = await prisma.professor.findFirst({
    where: { instituicaoId: user.instituicaoId, userId: user.id, ativo: true }, select: { id: true },
  });
  if (!professor) throw new ErroChamada("forbidden", 403);
  return {
    instituicaoId: user.instituicaoId,
    professorId: professor.id,
    operadorId: user.impersonacao ? (user.masterOriginalId ?? user.id) : user.id,
  };
}
type Identidade = Awaited<ReturnType<typeof identidade>>;

function sessoesVisiveis({ instituicaoId, professorId }: Identidade): Prisma.SessaoOptativaAvulsaWhereInput {
  return {
    instituicaoId,
    OR: [{ professorId }, { turmas: { some: { turma: { professorId } } } }],
  };
}

async function chamada(db: Prisma.TransactionClient, contexto: Identidade, sessaoId: unknown, data: unknown) {
  const id = Number(sessaoId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErroChamada("invalidClass");
  const sessao = await db.sessaoOptativaAvulsa.findFirst({
    where: { ...sessoesVisiveis(contexto), id },
    select: { id: true, ativa: true, professorId: true, diaSemana: true, horaInicio: true, horaFim: true,
      cursoId: true, curso: { select: { ativo: true, excluidoEm: true, matriculaDiretaTurma: true } } },
  });
  if (!sessao) throw new ErroChamada("forbidden", 403);
  const { dataEncontro } = validarEncontro(data, sessao.horaInicio);
  if (dataEncontro.getUTCDay() !== sessao.diaSemana) throw new ErroChamada("invalidMeeting");
  const propria = sessao.professorId === contexto.professorId;
  const podeRegistrar = propria && sessao.ativa && sessao.curso.ativo && !sessao.curso.excluidoEm && sessao.curso.matriculaDiretaTurma;
  const inscricoes = await db.matriculaOptativaAvulsa.findMany({
    where: {
      instituicaoId: contexto.instituicaoId, sessaoId: sessao.id,
      ...(!propria ? { oferta: { turma: { professorId: contexto.professorId } } } : {}),
      OR: [
        { vinculo: { ...vinculoOptativaOcupante, cursoId: sessao.cursoId,
          matricula: { ...vinculoOptativaOcupante.matricula, aluno: { ativo: true } } } },
        { presencas: { some: { data: dataEncontro } } },
      ],
    },
    select: {
      id: true,
      presencas: { where: { data: dataEncontro }, select: { status: true, observacao: true } },
      vinculo: { select: {
        status: true,
        turma: { select: { nome: true, ativa: true, dataInicio: true, dataFim: true,
          horariosAvulsos: { where: { ativo: true }, select: { diaSemana: true, horaInicio: true, horaFim: true } } } },
        matricula: { select: { status: true, excluidaEm: true, canceladaEm: true, dataInicioCurso: true,
          aluno: { select: { id: true, nome: true, ativo: true } } } },
      } },
    },
  });
  const civil = (valor: Date) => valor.toISOString().slice(0, 10);
  const dia = civil(dataEncontro);
  const alunos = inscricoes.flatMap(item => {
    const { matricula, turma, status } = item.vinculo;
    const cursando = vinculoOptativaOcupante.status.in.some(s => s === status) &&
      vinculoOptativaOcupante.matricula.status.in.some(s => s === matricula.status) &&
      !matricula.excluidaEm && !matricula.canceladaEm && matricula.aluno.ativo && turma.ativa &&
      (!matricula.dataInicioCurso || civil(matricula.dataInicioCurso) <= dia) &&
      (!turma.dataInicio || civil(turma.dataInicio) <= dia) &&
      (!turma.dataFim || civil(turma.dataFim) >= dia) && cabeNoHorario(sessao, turma.horariosAvulsos);
    const presenca = item.presencas[0];
    if (!cursando && !presenca) return [];
    return [{
      inscricaoId: item.id, alunoId: matricula.aluno.id, nome: matricula.aluno.nome, turma: turma.nome,
      status: presenca?.status ?? "", observacao: presenca?.observacao ?? "",
      editavel: podeRegistrar && cursando,
    }];
  }).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { dataEncontro, alunos, podeRegistrar };
}

async function regencia(contexto: Identidade, turmaId: string, data: unknown) {
  const id = Number(turmaId);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ErroChamada("invalidClass");
  const { dataEncontro } = validarEncontro(data, "00:00");
  const diaSemana = dataEncontro.getUTCDay();
  const dataCivil = dataEncontro.toISOString().slice(0, 10);
  const turma = await prisma.turma.findFirst({
    where: {
      id, instituicaoId: contexto.instituicaoId, professorId: contexto.professorId, ativa: true,
      curso: { matriculaDiretaTurma: true },
      sessoesOptativasAvulsas: { some: { sessao: { ativa: true } } },
    },
    select: {
      dataInicio: true, dataFim: true,
      horariosAvulsos: { where: { ativo: true, diaSemana }, orderBy: { horaInicio: "asc" } },
      matriculasAvulsas: {
        where: { ...vinculoOptativaOcupante, matricula: { ...vinculoOptativaOcupante.matricula, aluno: { ativo: true } } },
        select: {
          matricula: { select: { dataInicioCurso: true, aluno: { select: { id: true, nome: true } } } },
          optativas: { where: { oferta: { sessao: { ativa: true, diaSemana } } },
            select: { oferta: { select: { sessao: { select: { diaSemana: true, horaInicio: true, horaFim: true } } } } } },
        },
      },
    },
  });
  if (!turma) throw new ErroChamada("forbidden", 403);
  const civil = (valor: Date) => valor.toISOString().slice(0, 10);
  if ((turma.dataInicio && civil(turma.dataInicio) > dataCivil) ||
      (turma.dataFim && civil(turma.dataFim) < dataCivil) || !turma.horariosAvulsos.length)
    throw new ErroChamada("invalidMeeting");
  const alunos = turma.matriculasAvulsas
    .filter(v => !v.matricula.dataInicioCurso || civil(v.matricula.dataInicioCurso) <= dataCivil)
    .map(v => ({ ...v.matricula.aluno, optativas: v.optativas.map(o => o.oferta.sessao) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return turma.horariosAvulsos.flatMap(h => distribuirRegencia<{ id: number; nome: string; optativas: HorarioOptativa[] }>(h, alunos).map(faixa => ({
    inicio: faixa.inicio, fim: faixa.fim, alunos: faixa.alunos.map(({ id, nome }) => ({ id, nome })),
  })));
}

function respostaErro(error: unknown) {
  if (error instanceof ErroChamada) return NextResponse.json({ errorCode: error.codigo }, { status: error.status });
  if ((error as { code?: string })?.code === "P2034")
    return NextResponse.json({ errorCode: "conflict" }, { status: 409 });
  console.error("[CHAMADA_OPTATIVAS_AVULSAS]", error);
  return NextResponse.json({ errorCode: "unexpected" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const contexto = await identidade();
    const params = new URL(request.url).searchParams;
    const turmaId = params.get("turmaId");
    if (turmaId !== null) return NextResponse.json(await regencia(contexto, turmaId, params.get("data")));
    const sessaoId = params.get("sessaoId");
    if (sessaoId !== null) {
      const resultado = await chamada(prisma, contexto, sessaoId, params.get("data"));
      return NextResponse.json(resultado);
    }
    const sessoes = await prisma.sessaoOptativaAvulsa.findMany({
      where: sessoesVisiveis(contexto),
      select: { id: true, ativa: true, diaSemana: true, horaInicio: true, horaFim: true, professorId: true,
        disciplina: { select: { nome: true } }, curso: { select: { nome: true } },
        turmas: { select: { turma: { select: { id: true, nome: true, professorId: true, ativa: true } } } } },
      orderBy: [{ ativa: "desc" }, { diaSemana: "asc" }, { horaInicio: "asc" }, { id: "asc" }],
    });
    const turmasRegencia = sessoes.filter(s => s.ativa).flatMap(s => s.turmas)
      .map(t => t.turma).filter(t => t.ativa && t.professorId === contexto.professorId);
    return NextResponse.json({
      turmasRegencia: [...new Map(turmasRegencia.map(t => [t.id, { id: t.id, nome: t.nome }])).values()],
      sessoes: sessoes.map(({ professorId, turmas, ...sessao }) => ({
        ...sessao, propria: professorId === contexto.professorId,
        turmas: turmas.filter(({ turma }) => professorId === contexto.professorId || turma.professorId === contexto.professorId)
          .map(({ turma }) => turma.nome),
      })),
    });
  } catch (error) { return respostaErro(error); }
}

export async function POST(request: Request) {
  try {
    const contexto = await identidade();
    const body = await request.json();
    const presencas = validarPresencasEncontro(body?.presencas);
    await prisma.$transaction(async tx => {
      const { alunos, dataEncontro, podeRegistrar } = await chamada(tx, contexto, body?.sessaoId, body?.data);
      if (!podeRegistrar) throw new ErroChamada("forbidden", 403);
      const editaveis = new Map(alunos.filter(a => a.editavel).map(a => [a.alunoId, a]));
      if (editaveis.size !== presencas.length || presencas.some(p => !editaveis.has(p.alunoId)))
        throw new ErroChamada("rosterChanged", 409);
      for (const { alunoId, status, observacao } of presencas) {
        const aluno = editaveis.get(alunoId)!;
        if (aluno.status === status && (aluno.observacao || null) === observacao) continue;
        const valores = { status, observacao, atualizadaPorId: contexto.operadorId };
        await tx.presencaOptativaAvulsa.upsert({
          where: { matriculaOptativaId_data: { matriculaOptativaId: aluno.inscricaoId, data: dataEncontro } },
          create: { instituicaoId: contexto.instituicaoId, matriculaOptativaId: aluno.inscricaoId, data: dataEncontro, ...valores },
          update: valores,
        });
      }
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return NextResponse.json({ ok: true });
  } catch (error) { return respostaErro(error); }
}
