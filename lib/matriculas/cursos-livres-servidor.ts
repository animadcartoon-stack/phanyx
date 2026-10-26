import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { ErroCursoLivre, idCursoLivre, validarPeriodoLivre, precoLivre } from "./cursos-livres";
import { calcularIdade, verificarDadosResponsavel } from "./confirmacao-menor";
import { validarAgendaMatricula } from "./validar-agenda";

type Banco = Prisma.TransactionClient;
type Operador = { id: number; instituicaoId: number; nome: string | null; impersonacaoId?: number | null };
const statusEncerrados = ["CANCELADA", "CONCLUIDA", "TRANSFERIDA"] as const;

export async function contratarPeriodoCursoLivre(db: Banco, user: Operador, body: Record<string, unknown>, request: Request) {
  const periodo = validarPeriodoLivre(body);
  if (typeof body.chave !== "string" || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(body.chave)) throw new ErroCursoLivre("DADOS_INVALIDOS");
  const matriculaId = body.matriculaId ? idCursoLivre(body.matriculaId) : null;
  const alunoId = matriculaId ? null : idCursoLivre(body.alunoId);
  const cursoId = matriculaId ? null : idCursoLivre(body.cursoId);
  const turmaId = matriculaId ? null : idCursoLivre(body.turmaId);
  const chaveOperacao = `${user.instituicaoId}:${user.id}:${body.chave}`;
  const pedidoHash = createHash("sha256").update(JSON.stringify({ matriculaId, alunoId, cursoId, turmaId, periodicidade: periodo.periodicidade, inicio: periodo.dataInicio.toISOString(), fim: periodo.dataFim.toISOString() })).digest("hex");
  const anterior = await db.periodoCursoLivre.findUnique({ where: { chaveOperacao } });
  if (anterior) {
    if (anterior.pedidoHash !== pedidoHash) throw new ErroCursoLivre("DADOS_ALTERADOS", 409);
    return { matriculaId: anterior.matriculaId, periodoId: anterior.id, lancamentoId: anterior.lancamentoId };
  }
  let matricula = matriculaId ? await db.matricula.findFirst({
    where: { id: matriculaId, instituicaoId: user.instituicaoId, organizacaoCurricular: "LIVRE", excluidaEm: null },
  }) : null;
  if (matriculaId && !matricula) throw new ErroCursoLivre("MATRICULA_INVALIDA", 404);
  const alunoFinal = matricula?.alunoId ?? alunoId!;
  // Serializa criação/renovação do mesmo aluno e disputa de capacidade da turma.
  await db.$queryRaw`SELECT "id" FROM "Aluno" WHERE "id" = ${alunoFinal} AND "instituicaoId" = ${user.instituicaoId} FOR UPDATE`;
  const aluno = await db.aluno.findFirst({ where: { id: alunoFinal, instituicaoId: user.instituicaoId }, select: {
    id: true, poloId: true, dataNascimento: true, nomeResponsavel: true, cpfResponsavel: true,
    telefoneResponsavel: true, emailResponsavel: true, parentescoResponsavel: true,
  } });
  if (!aluno) throw new ErroCursoLivre("ALUNO_INVALIDO", 404);
  if (!matricula) matricula = await db.matricula.findFirst({ where: {
    instituicaoId: user.instituicaoId, alunoId: alunoFinal, cursoId: cursoId!, organizacaoCurricular: "LIVRE",
    excluidaEm: null, status: { notIn: [...statusEncerrados] },
  } });
  if (matricula) {
    await db.$queryRaw`SELECT "id" FROM "Matricula" WHERE "id" = ${matricula.id} AND "instituicaoId" = ${user.instituicaoId} FOR UPDATE`;
    matricula = await db.matricula.findFirst({ where: { id: matricula.id, instituicaoId: user.instituicaoId, excluidaEm: null } });
    if (!matricula || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status) || matricula.canceladaEm) throw new ErroCursoLivre("MATRICULA_INATIVA", 409);
    if (turmaId && matricula.turmaPrincipalId !== turmaId) throw new ErroCursoLivre("VINCULO_EXISTENTE", 409, { matriculaId: matricula.id });
  }
  const curso = await db.curso.findFirst({ where: {
    id: matricula?.cursoId ?? cursoId!, instituicaoId: user.instituicaoId, organizacaoCurricular: "LIVRE", ativo: true, excluidoEm: null,
  }, select: { id: true, nome: true, valorSemanal: true, valorMensalidade: true } });
  if (!curso) throw new ErroCursoLivre("CURSO_INVALIDO", 404);
  const valor = precoLivre(periodo.periodicidade === "SEMANAL" ? curso.valorSemanal?.toString() : curso.valorMensalidade);
  if (valor === null) throw new ErroCursoLivre("PRECO_NAO_CONFIGURADO");
  const turmaFinal = matricula?.turmaPrincipalId ?? turmaId!;
  if (!turmaFinal) throw new ErroCursoLivre("TURMA_INVALIDA");
  await db.$queryRaw`SELECT "id" FROM "Turma" WHERE "id" = ${turmaFinal} AND "instituicaoId" = ${user.instituicaoId} FOR UPDATE`;
  const turma = await db.turma.findFirst({ where: {
    id: turmaFinal, cursoId: curso.id, instituicaoId: user.instituicaoId, ativa: true, organizacaoCurricular: "LIVRE",
    statusTurma: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] }, polo: { ativo: true },
  }, select: { id: true, poloId: true, periodoLetivo: true, capacidadeMaxima: true, dataInicio: true, dataFim: true,
    disciplinas: { where: { instituicaoId: user.instituicaoId, disciplina: { instituicaoId: user.instituicaoId, ativo: true } }, select: { disciplinaId: true, disciplina: { select: { nome: true, cargaHoraria: true } } } },
  } });
  if (!turma?.poloId || !turma.disciplinas.length) throw new ErroCursoLivre("TURMA_INVALIDA");
  if ((turma.dataInicio && periodo.dataInicio.toISOString().slice(0, 10) < turma.dataInicio.toISOString().slice(0, 10)) ||
      (turma.dataFim && periodo.dataFim.toISOString().slice(0, 10) > turma.dataFim.toISOString().slice(0, 10))) throw new ErroCursoLivre("PERIODO_FORA_TURMA");
  if (matricula) {
    const sobreposto = await db.periodoCursoLivre.findFirst({ where: {
      instituicaoId: user.instituicaoId, matriculaId: matricula.id, dataInicio: { lte: periodo.dataFim }, dataFim: { gte: periodo.dataInicio }, lancamento: { status: { not: "CANCELADO" } },
    }, select: { id: true } });
    if (sobreposto) throw new ErroCursoLivre("PERIODO_SOBREPOSTO", 409);
  }
  // Verifica a agenda e a capacidade inclusive em renovações.
  await validarAgendaMatricula(db, { instituicaoId: user.instituicaoId, alunoId: alunoFinal, matriculaId: matricula?.id,
    itens: turma.disciplinas.map(d => ({ turmaId: turma.id, disciplinaId: d.disciplinaId })), inicio: periodo.dataInicio, fim: periodo.dataFim });
  if (turma.capacidadeMaxima !== null) {
    const ocupantes = await db.itemMatricula.findMany({ where: {
      instituicaoId: user.instituicaoId, turmaId: turma.id, status: { in: ["A_CURSAR", "EM_CURSO"] },
      matricula: { instituicaoId: user.instituicaoId, alunoId: { not: alunoFinal }, excluidaEm: null,
        status: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] }, OR: [
          { organizacaoCurricular: { not: "LIVRE" } },
          { periodosCursoLivre: { some: { instituicaoId: user.instituicaoId, dataInicio: { lte: periodo.dataFim }, dataFim: { gte: periodo.dataInicio }, lancamento: { status: { not: "CANCELADO" } } } } },
        ] },
    }, select: { matricula: { select: { alunoId: true } } } });
    if (new Set(ocupantes.map(i => i.matricula.alunoId)).size >= turma.capacidadeMaxima) throw new ErroCursoLivre("SEM_VAGAS", 409);
  }
  if (!matricula) {
    if (!aluno.dataNascimento) throw new ErroCursoLivre("NASCIMENTO_NAO_INFORMADO");
    const idade = calcularIdade(aluno.dataNascimento);
    if (idade < 0 || idade > 120) throw new ErroCursoLivre("DATA_INVALIDA");
    const pendencias = idade < 18 ? verificarDadosResponsavel(aluno) : [];
    if (idade < 18 && body.confirmacaoMenorAceita !== true) throw new ErroCursoLivre("CONFIRMACAO_MENOR_NECESSARIA", 409, { idade, pendencias });
    const contador = await db.instituicao.update({ where: { id: user.instituicaoId }, data: { proximoNumeroMatricula: { increment: 1 } }, select: { proximoNumeroMatricula: true } });
    const numeroMatricula = `PHX-${user.instituicaoId}-${new Date().getFullYear()}-${String(contador.proximoNumeroMatricula - 1).padStart(6, "0")}`;
    matricula = await db.matricula.create({ data: {
      instituicaoId: user.instituicaoId, alunoId: alunoFinal, cursoId: curso.id, turmaPrincipalId: turma.id,
      poloId: turma.poloId, organizacaoCurricular: "LIVRE", etapaNumero: null, semestre: null, cursoSemestreId: null,
      numeroMatricula, modalidade: "CURSO_LIVRE", tipoContratacao: "CURSO_COMPLETO", status: "ATIVA", confirmadaEm: new Date(),
      dataInicioCurso: periodo.dataInicio, periodoLetivo: turma.periodoLetivo, valorMatricula: 0,
      valorMensalidade: null, quantidadeMensalidades: null, quantidadeParcelas: null,
      alunoMenorNoMomentoMatricula: idade < 18, idadeNoMomentoMatricula: idade, responsavelIncompletoNoMomentoMatricula: pendencias.length > 0,
      confirmacaoMenorEm: idade < 18 ? new Date() : null, confirmacaoMenorPorUserId: idade < 18 ? user.id : null,
      confirmacaoMenorPorNomeSnapshot: idade < 18 ? user.nome : null,
      textoConfirmacaoMenor: idade < 18 ? JSON.stringify({ idade, pendencias, usuarioId: user.id }) : null,
      itens: { create: turma.disciplinas.map(d => ({ instituicaoId: user.instituicaoId, turmaId: turma.id, disciplinaId: d.disciplinaId, tipoItem: "GRADE_PRINCIPAL", status: "EM_CURSO" })) },
    } });
  }
  // Novas ofertas da turma entram no próximo período; os vínculos históricos não são removidos.
  await db.itemMatricula.createMany({ data: turma.disciplinas.map(d => ({ instituicaoId: user.instituicaoId, matriculaId: matricula.id,
    turmaId: turma.id, disciplinaId: d.disciplinaId, tipoItem: "GRADE_PRINCIPAL" as const, status: "EM_CURSO" as const })), skipDuplicates: true });
  await db.matriculaDisciplinaContratada.createMany({ data: turma.disciplinas.map((d, ordemSnapshot) => ({ instituicaoId: user.instituicaoId, matriculaId: matricula.id,
    disciplinaId: d.disciplinaId, disciplinaNomeSnapshot: d.disciplina.nome, cargaHorariaSnapshot: d.disciplina.cargaHoraria, ordemSnapshot })), skipDuplicates: true });
  const lancamento = await db.lancamentoFinanceiro.create({ data: {
    instituicaoId: user.instituicaoId, matriculaId: matricula.id, alunoId: alunoFinal, poloId: matricula.poloId,
    tipo: "OUTRO", descricao: `${curso.nome} · ${periodo.periodicidade} · ${body.dataInicio} – ${body.dataFim}`,
    valorOriginal: valor, valorFinal: valor, valorPago: 0, status: "PENDENTE", vencimento: periodo.dataInicio,
  } });
  const contratado = await db.periodoCursoLivre.create({ data: {
    instituicaoId: user.instituicaoId, matriculaId: matricula.id, lancamentoId: lancamento.id, ...periodo, valor,
    chaveOperacao, pedidoHash, criadoPorId: user.id, impersonacaoId: user.impersonacaoId ?? null,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 100) || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 1000) || null,
  } });
  return { matriculaId: matricula.id, periodoId: contratado.id, lancamentoId: lancamento.id };
}
