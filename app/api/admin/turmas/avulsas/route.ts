import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { ErroCadastroTurmaAvulsa, validarCapacidadeTurmaAvulsa, validarHorariosTurmaAvulsa } from "@/lib/academico/validar-turma-avulsa";
import { validarProntidaoAtivacaoTurmaAvulsa } from "@/lib/academico/validar-prontidao-ativacao-turma-avulsa";

export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
// Flag separada da confirmacao de matriculas. DESATIVADA ate homologacao em banco isolado.
const ativacaoHabilitada = () => process.env.PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA === "true";
const inteiroOpcional = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  if (!Number.isSafeInteger(n) || n <= 0) throw new ErroCadastroTurmaAvulsa("ID_INVALIDO", "Identificador inválido.");
  return n;
};
async function admin() {
  const user = await getUserFromToken();
  if (!user || !isAdminLike(user.role) || !Number.isInteger(user.instituicaoId) || user.instituicaoId <= 0) {
    throw new ErroCadastroTurmaAvulsa("SEM_PERMISSAO", "Sem permissão para gerenciar turmas.");
  }
  return user;
}
async function referenciasValidas(tx: Prisma.TransactionClient, instituicaoId: number, professorId: number | null, poloId: number | null) {
  if (professorId && !(await tx.professor.findFirst({ where: { id: professorId, instituicaoId }, select: { id: true } })))
    throw new ErroCadastroTurmaAvulsa("PROFESSOR_INVALIDO", "Professor não pertence à instituição.");
  if (poloId && !(await tx.polo.findFirst({ where: { id: poloId, instituicaoId, ativo: true }, select: { id: true } })))
    throw new ErroCadastroTurmaAvulsa("POLO_INVALIDO", "Polo inativo ou de outra instituição.");
}
function dados(body: Record<string, unknown>) {
  const nome = String(body.nome ?? "").trim();
  const codigo = String(body.codigo ?? "").trim();
  const periodoLetivo = String(body.periodoLetivo ?? "").trim();
  const turno = String(body.turno ?? "").trim();
  const professorId = inteiroOpcional(body.professorId);
  const poloId = inteiroOpcional(body.poloId);
  const capacidadeMaxima = validarCapacidadeTurmaAvulsa(body.capacidadeMaxima);
  const horarios = validarHorariosTurmaAvulsa(body.horarios);
  if (nome.length < 2 || nome.length > 120 || !/^\d{4}$/.test(periodoLetivo) ||
      !["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL", "FLEXIVEL"].includes(turno) || codigo.length > 80) {
    throw new ErroCadastroTurmaAvulsa("DADOS_INVALIDOS", "Informe nome, ano letivo e turno da turma.");
  }
  return { nome, codigo: codigo || null, periodoLetivo, turno, professorId, poloId, capacidadeMaxima, horarios };
}
function erroResposta(erro: unknown) {
  if (erro instanceof ErroCadastroTurmaAvulsa) return json({ codigo: erro.codigo, error: erro.message }, erro.codigo === "SEM_PERMISSAO" ? 403 : erro.codigo === "ATIVACAO_BLOQUEADA" || erro.codigo === "TURMA_ATIVA" || erro.codigo === "TURMA_COM_HISTORICO" || erro.codigo === "GRADE_EXISTENTE" || erro.codigo === "TURMA_ALTERADA" ? 409 : 400);
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034") return json({ codigo: "CONCORRENCIA", error: "Turma alterada simultaneamente. Recarregue e tente novamente." }, 409);
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") return json({ error: "Já existe uma turma ou horário com esses dados.", codigo: "DUPLICADO" }, 409);
  console.error("Falha ao gerenciar turma avulsa sem grade:", erro);
  return json({ error: "Não foi possível gerenciar a turma avulsa." }, 500);
}

export async function GET() {
  try {
    const user = await admin();
    const [cursos, professores, polos] = await Promise.all([
      prisma.curso.findMany({ where: { instituicaoId: user.instituicaoId, ativo: true, excluidoEm: null,
        organizacaoCurricular: { in: ["ANUAL", "SEMESTRAL"] } },
        select: { id: true, nome: true, organizacaoCurricular: true, matriculaDiretaTurma: true }, orderBy: { nome: "asc" } }),
      prisma.professor.findMany({ where: { instituicaoId: user.instituicaoId }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
      prisma.polo.findMany({ where: { instituicaoId: user.instituicaoId, ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    ]);
    const ativos = cursos.filter(c => c.matriculaDiretaTurma).map(c => c.id);
    const turmas = ativos.length ? await prisma.turma.findMany({
      where: { instituicaoId: user.instituicaoId, cursoId: { in: ativos }, horariosAvulsos: { some: {} } },
      select: { id: true, nome: true, cursoId: true, codigo: true, turno: true, periodoLetivo: true,
        capacidadeMaxima: true, ativa: true, professorId: true, poloId: true,
        horariosAvulsos: { where: { ativo: true }, select: { diaSemana: true, horaInicio: true, horaFim: true },
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] } },
      orderBy: [{ cursoId: "asc" }, { nome: "asc" }],
    }) : [];
    return json({ cursos, professores, polos, turmas, ativacaoHabilitada: ativacaoHabilitada() });
  } catch (error) { return erroResposta(error); }
}

export async function POST(request: Request) {
  try {
    const user = await admin();
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || body.acao !== "CRIAR_TURMA") throw new ErroCadastroTurmaAvulsa("ACAO_INVALIDA", "Operação inválida.");
    const cursoId = inteiroOpcional(body.cursoId);
    if (!cursoId) throw new ErroCadastroTurmaAvulsa("CURSO_INVALIDO", "Selecione um curso avulso.");
    const form = dados(body);
    const turma = await prisma.$transaction(async tx => {
      // A turma fica inativa até que matrícula, chamada e contratos estejam integrados.
      const curso = await tx.curso.findFirst({ where: { id: cursoId, instituicaoId: user.instituicaoId,
        matriculaDiretaTurma: true, ativo: true, excluidoEm: null },
        select: { id: true, organizacaoCurricular: true } });
      if (!curso) throw new ErroCadastroTurmaAvulsa("CURSO_INDISPONIVEL", "Este curso ainda não foi habilitado para matrícula sem grade.");
      if (await tx.cursoSemestreDisciplina.count({ where: { instituicaoId: user.instituicaoId, cursoSemestre: { cursoId } } }))
        throw new ErroCadastroTurmaAvulsa("GRADE_EXISTENTE", "Revise a grade antiga antes de criar uma turma sem disciplinas.");
      await referenciasValidas(tx, user.instituicaoId, form.professorId, form.poloId);
      if (await tx.turma.findFirst({ where: { instituicaoId: user.instituicaoId, cursoId, nome: form.nome,
        periodoLetivo: form.periodoLetivo }, select: { id: true } }))
        throw new ErroCadastroTurmaAvulsa("TURMA_DUPLICADA", "Esta turma já existe para o mesmo curso e ano.");
      const criada = await tx.turma.create({ data: { instituicaoId: user.instituicaoId, cursoId,
        nome: form.nome, codigo: form.codigo, semestre: "1", organizacaoCurricular: curso.organizacaoCurricular,
        etapaNumero: 1, periodoLetivo: form.periodoLetivo, turno: form.turno, modalidade: "PRESENCIAL",
        professorId: form.professorId, poloId: form.poloId, capacidadeMaxima: form.capacidadeMaxima,
        ativa: false, statusTurma: "A_INICIAR",
        horariosAvulsos: { create: form.horarios.map(h => ({ ...h, instituicaoId: user.instituicaoId, ativo: true })) },
      }, select: { id: true, nome: true, ativa: true } });
      return criada;
    }, { isolationLevel: "Serializable", timeout: 20000 });
    return json({ turma, aviso: "Turma criada inativa. Ainda não pode receber matrículas." }, 201);
  } catch (error) { return erroResposta(error); }
}

// Ativacao isolada: nenhuma turma existente e liberada sem flag explicita.
// Executada com bloqueio de linha e verificacao completa dentro da transacao.
async function ativarTurmaAvulsa(instituicaoId: number, turmaId: number) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Turma" WHERE "id" = ${turmaId} AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
    const atual = await tx.turma.findFirst({
      where: { id: turmaId, instituicaoId,
        curso: { instituicaoId, matriculaDiretaTurma: true, ativo: true, excluidoEm: null },
        horariosAvulsos: { some: {} } },
      select: {
        id: true, ativa: true, statusTurma: true, cursoId: true,
        professorId: true, poloId: true, periodoLetivo: true, turno: true,
        capacidadeMaxima: true,
        curso: { select: {
          organizacaoCurricular: true, regrasPrecoDisciplinas: true,
          regrasSelecaoDisciplinas: true, valorMensalidade: true,
          valorMatricula: true, quantidadeParcelas: true,
        } },
        horariosAvulsos: { where: { ativo: true }, select: {
          diaSemana: true, horaInicio: true, horaFim: true,
        } },
      },
    });
    if (!atual) throw new ErroCadastroTurmaAvulsa("TURMA_INDISPONIVEL", "Turma ou curso sem grade indisponivel.");
    if (atual.ativa) throw new ErroCadastroTurmaAvulsa("TURMA_ATIVA", "Esta turma ja esta ativa.");
    if (atual.statusTurma !== "A_INICIAR")
      throw new ErroCadastroTurmaAvulsa("STATUS_INVALIDO", "Somente turmas a iniciar podem ser ativadas.");

    // Impede alteracao do curso enquanto se valida a prontidao da turma.
    await tx.$queryRaw`SELECT "id" FROM "Curso" WHERE "id" = ${atual.cursoId} AND "instituicaoId" = ${instituicaoId} FOR SHARE`;
    validarProntidaoAtivacaoTurmaAvulsa(atual);
    const [etapas, disciplinasSoltas, vinculosDisciplina, itensLegados, matriculasDiretas] = await Promise.all([
      tx.cursoSemestre.count({ where: { instituicaoId, cursoId: atual.cursoId } }),
      tx.disciplina.count({ where: { instituicaoId, cursoId: atual.cursoId } }),
      tx.turmaDisciplina.count({ where: { instituicaoId, turmaId } }),
      tx.itemMatricula.count({ where: { instituicaoId, turmaId } }),
      tx.matriculaTurmaAvulsa.count({ where: { instituicaoId, turmaId } }),
    ]);
    if (etapas || disciplinasSoltas || vinculosDisciplina)
      throw new ErroCadastroTurmaAvulsa("GRADE_EXISTENTE", "O curso ou a turma possui grade ou disciplinas vinculadas.");
    if (itensLegados || matriculasDiretas)
      throw new ErroCadastroTurmaAvulsa("TURMA_COM_HISTORICO", "A turma possui historico de matriculas e precisa de revisao.");

    await referenciasValidas(tx, instituicaoId, atual.professorId, atual.poloId);
    const atualizada = await tx.turma.updateMany({
      where: { id: turmaId, instituicaoId, ativa: false, curso: { matriculaDiretaTurma: true, ativo: true, excluidoEm: null } },
      data: { ativa: true, statusTurma: "A_INICIAR" },
    });
    if (atualizada.count !== 1)
      throw new ErroCadastroTurmaAvulsa("TURMA_ALTERADA", "A turma mudou antes da ativacao. Recarregue a pagina.");
    return { id: turmaId, ativa: true };
  }, { isolationLevel: "Serializable", timeout: 20000 });
}

export async function PATCH(request: Request) {
  try {
    const user = await admin();
    const body = (await request.json()) as Record<string, unknown>;
    if (body?.acao === "ATIVAR_TURMA") {
      if (!ativacaoHabilitada())
        throw new ErroCadastroTurmaAvulsa("ATIVACAO_BLOQUEADA", "Ativacao indisponivel ate a homologacao das matriculas sem grade.");
      const turmaId = inteiroOpcional(body.turmaId);
      if (!turmaId) throw new ErroCadastroTurmaAvulsa("TURMA_INVALIDA", "Selecione a turma que deseja ativar.");
      const turma = await ativarTurmaAvulsa(user.instituicaoId, turmaId);
      return json({ turma, mensagem: "Turma ativada com validacoes de capacidade, professor e horarios." });
    }
    if (!body || body.acao !== "EDITAR_TURMA") throw new ErroCadastroTurmaAvulsa("ACAO_INVALIDA", "Operação inválida.");
    const turmaId = inteiroOpcional(body.turmaId);
    if (!turmaId) throw new ErroCadastroTurmaAvulsa("TURMA_INVALIDA", "Selecione uma turma.");
    const form = dados(body);
    const turma = await prisma.$transaction(async tx => {
      const atual = await tx.turma.findFirst({ where: { id: turmaId, instituicaoId: user.instituicaoId,
        curso: { matriculaDiretaTurma: true }, horariosAvulsos: { some: {} } },
        select: { id: true, ativa: true, cursoId: true } });
      if (!atual) throw new ErroCadastroTurmaAvulsa("TURMA_INDISPONIVEL", "Turma sem grade não encontrada.");
      if (atual.ativa) throw new ErroCadastroTurmaAvulsa("TURMA_ATIVA", "Desative a oferta antes de alterar horários.");
      const [comItens, comDiretos] = await Promise.all([
        tx.itemMatricula.count({ where: { turmaId, instituicaoId: user.instituicaoId } }),
        tx.matriculaTurmaAvulsa.count({ where: { turmaId, instituicaoId: user.instituicaoId } }),
      ]);
      if (comItens || comDiretos) throw new ErroCadastroTurmaAvulsa("TURMA_COM_ALUNOS", "Turma com histórico de matrícula: preserve os horários e faça uma nova oferta.");
      await referenciasValidas(tx, user.instituicaoId, form.professorId, form.poloId);
      const atualizada = await tx.turma.update({ where: { id: turmaId }, data: {
        nome: form.nome, codigo: form.codigo, periodoLetivo: form.periodoLetivo, turno: form.turno,
        professorId: form.professorId, poloId: form.poloId, capacidadeMaxima: form.capacidadeMaxima,
        ativa: false,
      }, select: { id: true, nome: true, ativa: true } });
      await tx.turmaHorarioAvulso.deleteMany({ where: { turmaId, instituicaoId: user.instituicaoId } });
      await tx.turmaHorarioAvulso.createMany({ data: form.horarios.map(h => ({ ...h, turmaId, instituicaoId: user.instituicaoId, ativo: true })) });
      return atualizada;
    }, { isolationLevel: "Serializable", timeout: 20000 });
    return json({ turma });
  } catch (error) { return erroResposta(error); }
}
