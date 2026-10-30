import { etapaDaOferta, numeroEtapa, organizacaoAcademica } from "./organizacao";
import { cursoDisponivelParaMatricula } from "@/lib/cursos/estado-curso";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { disciplinaPermitidaNaOferta, numeroSemestreOferta } from "./grade-oferta";

type BancoAcademico = Prisma.TransactionClient;
const mensagens = {
  ORGANIZACAO_INVALIDA: "Escolha organização anual, semestral ou livre.",
  ORGANIZACAO_EM_USO: "Este curso já possui grade, disciplinas, turmas ou matrículas. Preserve sua organização e cadastre outro curso para uma estrutura diferente.",
  ORGANIZACAO_COM_VINCULOS: "Este curso já possui turmas, matrículas, períodos de matrícula ou vínculos de rede. A alteração exige revisão desses vínculos para preservar o histórico.",
  ORGANIZACAO_GRADE_NECESSARIA: "Organize as disciplinas diretas em etapas antes de mudar entre semestral e anual. A grade precisa ser explícita para preservar seus vínculos.",
  ETAPA_INVALIDA: "Informe uma etapa curricular válida para o curso.",
  VINCULO_INVALIDO: "Um dos identificadores informados é inválido.",
  CURSO_INVALIDO: "O curso não pertence a esta instituição.",
  CURSO_INDISPONIVEL: "Este curso está inativo ou excluído e não pode receber uma nova matrícula. Atualize a lista e escolha um curso ativo.",
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
      status: ["ORGANIZACAO_EM_USO", "ORGANIZACAO_COM_VINCULOS", "ORGANIZACAO_GRADE_NECESSARIA", "OFERTA_COM_HISTORICO", "ETAPA_COM_HISTORICO", "DADOS_ALTERADOS"].includes(error.codigo) ? 409 : 400,
    });
  }
  if ((error as { code?: string })?.code === "P2034") {
    return NextResponse.json({ codigo: "DADOS_ALTERADOS", error: mensagens.DADOS_ALTERADOS }, { status: 409 });
  }
  return null;
}

export async function validarCursoAtivoParaMatricula(db: BancoAcademico, instituicaoId: number, cursoId: number) {
  const curso = await db.curso.findFirst({ where: { id: cursoId, instituicaoId }, select: { id: true, ativo: true, excluidoEm: true } });
  if (!cursoDisponivelParaMatricula(curso)) throw new ErroIntegridadeAcademica("CURSO_INDISPONIVEL");
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
        organizacaoCurricular: true,
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
    where: { id: cursoId, instituicaoId }, select: { id: true, organizacaoCurricular: true, quantidadeSemestres: true, quantidadeEtapas: true, ...incluirGradeOferta(instituicaoId) },
  });
  if (cursoId !== null && !curso) throw new ErroIntegridadeAcademica("CURSO_INVALIDO");
  if (curso) curso.semestres = curso.semestres.filter(e => e.organizacaoCurricular === undefined || e.organizacaoCurricular === curso.organizacaoCurricular);
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
    await validarDisciplinasDaOferta(db, instituicaoId, turma.cursoId, etapaDaOferta(turma), [disciplinaId]);
  }
  if (remover.length) await db.turmaDisciplina.deleteMany({
    where: { instituicaoId, id: { in: remover.map(v => v.id) } },
  });
  const novas = turmas.filter(t => !mantidos.has(t.id));
  for (const turma of novas) {
    await validarResponsaveisDaOferta(db, instituicaoId, turma.poloId, turma.professorId,
      [disciplinaId], { [disciplinaId]: professorPadraoId });
    const numero = etapaDaOferta(turma);
    let etapa = numero === null ? null : await db.turmaSemestre.findFirst({
      where: { instituicaoId, turmaId: turma.id, numero, organizacaoCurricular: turma.organizacaoCurricular }, orderBy: { id: "desc" },
    });
    if (numero !== null && !etapa) etapa = await db.turmaSemestre.create({
      data: { instituicaoId, turmaId: turma.id, numero, organizacaoCurricular: turma.organizacaoCurricular, status: "A_INICIAR" },
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

export function validarOrganizacao(valor: unknown) {
  if (valor !== "SEMESTRAL" && valor !== "ANUAL" && valor !== "LIVRE") throw new ErroIntegridadeAcademica("ORGANIZACAO_INVALIDA");
  return valor;
}

export async function protegerOrganizacaoDoCurso(db: BancoAcademico, instituicaoId: number, cursoId: number) {
  const where = { instituicaoId, cursoId };
  const usos = await Promise.all([
    db.cursoSemestre.count({ where }), db.disciplina.count({ where }),
    db.turma.count({ where }), db.matricula.count({ where }),
    db.cursoPublicacaoRede.count({ where: { instituicaoOrigemId: instituicaoId, cursoOrigemId: cursoId } }),
  ]);
  if (usos.some(n => n > 0)) throw new ErroIntegridadeAcademica("ORGANIZACAO_EM_USO");
}

// Deve ser chamada dentro da mesma transação serializável que salva o curso.
// Muda apenas o tipo das etapas; mantém IDs, números, títulos e disciplinas.
export async function converterOrganizacaoDaGradeDoCurso(
  db: BancoAcademico, instituicaoId: number, cursoId: number,
  origem: string, destino: string,
) {
  const organizacaoOrigem = validarOrganizacao(origem);
  const organizacaoDestino = validarOrganizacao(destino);
  if (organizacaoOrigem === organizacaoDestino) return;
  // LIVRE envolve outras regras financeiras e conserva sua proteção anterior.
  if (organizacaoOrigem === "LIVRE" || organizacaoDestino === "LIVRE") {
    await protegerOrganizacaoDoCurso(db, instituicaoId, cursoId);
    return;
  }
  const curso = await db.curso.findFirst({
    where: { id: cursoId, instituicaoId },
    select: { organizacaoCurricular: true, matriculaDiretaTurma: true },
  });
  if (!curso) throw new ErroIntegridadeAcademica("CURSO_INVALIDO");
  if (curso.organizacaoCurricular !== organizacaoOrigem) {
    throw new ErroIntegridadeAcademica("DADOS_ALTERADOS");
  }
  const etapas = await db.cursoSemestre.findMany({
    where: { cursoId, instituicaoId },
    select: { id: true, organizacaoCurricular: true,
      _count: { select: { semestresPublicadosRede: true } } },
  });
  const ids = etapas.map(etapa => etapa.id);
  const usos = await Promise.all([
    curso.matriculaDiretaTurma ? Promise.resolve(0) : db.turma.count({ where: { instituicaoId, cursoId } }),
    db.matricula.count({ where: { instituicaoId, OR: [
      { cursoId }, { cursoSemestreId: { in: ids } },
    ] } }),
    db.periodoMatricula.count({ where: { instituicaoId, OR: [
      { cursoId }, { cursoSemestreId: { in: ids } },
    ] } }),
    db.rematriculaSemestral.count({
      where: { instituicaoId, cursoSemestreDestino: { cursoId, instituicaoId } },
    }),
    db.matriculaDisciplinaContratada.count({ where: { instituicaoId, OR: [
      { matricula: { cursoId, instituicaoId } },
      { cursoSemestreIdSnapshot: { in: ids } },
    ] } }),
    db.cursoPublicacaoRede.count({ where: { OR: [
      { instituicaoOrigemId: instituicaoId, cursoOrigemId: cursoId },
      { instituicaoDestinoId: instituicaoId, cursoDestinoId: cursoId },
    ] } }),
  ]);
  if (usos.some(n => n > 0) || etapas.some(e => e._count.semestresPublicadosRede > 0)) {
    throw new ErroIntegridadeAcademica("ORGANIZACAO_COM_VINCULOS");
  }
  if (etapas.some(e => e.organizacaoCurricular !== organizacaoOrigem)) {
    throw new ErroIntegridadeAcademica("DADOS_ALTERADOS");
  }
  // Não inferimos em qual ano/semestre colocar uma disciplina sem grade.
  if (!etapas.length && await db.disciplina.count({ where: { cursoId, instituicaoId } })) {
    throw new ErroIntegridadeAcademica("ORGANIZACAO_GRADE_NECESSARIA");
  }
  if (curso.matriculaDiretaTurma) {
    // Uma turma sem disciplinas não exige preservar uma grade inexistente.
    // Só retipamos configurações sem uso; horários e demais dados ficam intactos.
    if (etapas.length) throw new ErroIntegridadeAcademica("ORGANIZACAO_COM_VINCULOS");
    await db.$queryRaw`SELECT "id" FROM "Turma" WHERE "cursoId"=${cursoId} AND "instituicaoId"=${instituicaoId} ORDER BY "id" FOR UPDATE`;
    const turmas = await db.turma.findMany({ where: { cursoId, instituicaoId }, orderBy: { id: "asc" }, select: {
      id: true, organizacaoCurricular: true, etapaNumero: true, semestre: true,
      _count: { select: { disciplinas: true, semestres: true, atividades: true, aulas: true, itensMatricula: true,
        matriculasComoPrincipal: true, modulos: true, notas: true, provas: true, sessoesVideoAluno: true,
        eventosAprendizagemAluno: true, resultadosFinais: true, periodosMatriculaParticipantes: true,
        reunioes: true, substituicoesDocentes: true, destinosRecomendacoesBiblioteca: true,
        atividadesExternas: true, matriculasAvulsas: true } },
    } });
    const planos = [];
    const cursoSnapshot = await db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
      WHERE "instituicaoId"=${instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ cursoId }] })}::jsonb`;
    if (cursoSnapshot[0]?.total) throw new ErroIntegridadeAcademica("ORGANIZACAO_COM_VINCULOS");
    for (const turma of turmas) {
      if (turma.organizacaoCurricular !== organizacaoOrigem) throw new ErroIntegridadeAcademica("DADOS_ALTERADOS");
      if (Object.values(turma._count).some(n => n > 0)) throw new ErroIntegridadeAcademica("ORGANIZACAO_COM_VINCULOS");
      const numero = etapaDaOferta(turma);
      if (!numero) throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
      const snapshots = await db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
        WHERE "instituicaoId"=${instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ turmaId: turma.id }] })}::jsonb`;
      const derivadas = await db.turma.findMany({ where: { instituicaoId, codigo: { startsWith: `OFERTA-${turma.id}-` } }, select: { cursoId: true, codigo: true } });
      if (snapshots[0]?.total || derivadas.some(t => t.codigo === `OFERTA-${turma.id}-${t.cursoId}`)) throw new ErroIntegridadeAcademica("ORGANIZACAO_COM_VINCULOS");
      planos.push({ id: turma.id, numero });
    }
    for (const plano of planos) await db.turma.update({ where: { id: plano.id }, data: {
      organizacaoCurricular: organizacaoDestino, etapaNumero: plano.numero,
      semestre: organizacaoDestino === "SEMESTRAL" ? String(plano.numero) : "",
    } });
  }
  if (etapas.length) {
    const alteradas = await db.cursoSemestre.updateMany({
      where: { cursoId, instituicaoId, organizacaoCurricular: organizacaoOrigem },
      data: { organizacaoCurricular: organizacaoDestino },
    });
    if (alteradas.count !== etapas.length) throw new ErroIntegridadeAcademica("DADOS_ALTERADOS");
  }
}

export async function validarEtapaDoCurso(db: BancoAcademico, instituicaoId: number, cursoId: number | null,
  valor: unknown, organizacaoInformada?: unknown) {
  const curso = cursoId == null ? null : await db.curso.findFirst({
    where: { id: cursoId, instituicaoId },
    select: { id: true, organizacaoCurricular: true, quantidadeEtapas: true, quantidadeSemestres: true },
  });
  if (cursoId !== null && !curso) throw new ErroIntegridadeAcademica("CURSO_INVALIDO");
  const organizacaoCurricular = organizacaoAcademica(curso?.organizacaoCurricular);
  if (organizacaoInformada != null && organizacaoInformada !== organizacaoCurricular)
    throw new ErroIntegridadeAcademica("ORGANIZACAO_INVALIDA");
  if (organizacaoCurricular === "LIVRE") return { organizacaoCurricular, etapaNumero: null, semestre: "" };
  const etapaNumero = numeroEtapa(valor);
  const limite = organizacaoCurricular === "ANUAL" ? curso?.quantidadeEtapas : curso?.quantidadeSemestres;
  if (etapaNumero === null || (limite && etapaNumero > limite)) throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
  return { organizacaoCurricular, etapaNumero,
    semestre: organizacaoCurricular === "SEMESTRAL" ? String(etapaNumero) : "" };
}

export async function resolverEtapaDaMatricula(db: BancoAcademico, instituicaoId: number, cursoId: number,
  cursoEtapaId: number | null, valor: unknown) {
  const curso = await db.curso.findFirst({ where: { id: cursoId, instituicaoId },
    select: { organizacaoCurricular: true, quantidadeEtapas: true } });
  if (!curso) throw new ErroIntegridadeAcademica("CURSO_INVALIDO");
  const organizacaoCurricular = organizacaoAcademica(curso.organizacaoCurricular);
  if (organizacaoCurricular === "LIVRE") return { organizacaoCurricular, etapaNumero: null, cursoSemestreId: null, semestre: null };
  const etapa = cursoEtapaId == null ? null : await db.cursoSemestre.findFirst({
    where: { id: cursoEtapaId, cursoId, instituicaoId, organizacaoCurricular },
    select: { id: true, numero: true },
  });
  if (cursoEtapaId != null && !etapa) throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
  const informado = valor == null || valor === "" ? null : numeroEtapa(valor);
  if ((valor != null && valor !== "" && informado == null) || (etapa && informado && etapa.numero !== informado))
    throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
  const etapaNumero = etapa?.numero ?? informado;
  if (organizacaoCurricular === "ANUAL") {
    const grade = etapa ?? await db.cursoSemestre.findFirst({
      where: { cursoId, instituicaoId, ...(etapaNumero ? { numero: etapaNumero } : {}), organizacaoCurricular }, select: { id: true, numero: true },
    });
    if (etapaNumero && grade) return { organizacaoCurricular, etapaNumero, cursoSemestreId: grade.id, semestre: null };
    // Oferta anual de um único ano pode usar suas disciplinas diretas, sem grade estruturada.
    const algumaGrade = grade ?? await db.cursoSemestre.findFirst({ where: { cursoId, instituicaoId }, select: { id: true } });
    if (!algumaGrade && (curso.quantidadeEtapas == null || curso.quantidadeEtapas === 1) && (etapaNumero == null || etapaNumero === 1))
      return { organizacaoCurricular, etapaNumero: 1, cursoSemestreId: null, semestre: null };
    throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
  }
  return { organizacaoCurricular, etapaNumero, cursoSemestreId: etapa?.id ?? null, semestre: etapaNumero };
}

export async function validarTurmasDaEtapa(db: BancoAcademico, instituicaoId: number, cursoId: number,
  cursoEtapaId: number, turmaIds: number[]) {
  const etapa = await db.cursoSemestre.findFirst({ where: { id: cursoEtapaId, instituicaoId, cursoId },
    select: { numero: true, organizacaoCurricular: true } });
  if (!etapa) throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
  const turmas = await db.turma.findMany({ where: { id: { in: turmaIds }, instituicaoId, cursoId, ativa: true },
    select: { id: true, etapaNumero: true, semestre: true, organizacaoCurricular: true,
      semestres: { where: { instituicaoId }, select: { numero: true } } } });
  if (turmas.length !== turmaIds.length || turmas.some(t =>
    t.organizacaoCurricular !== etapa.organizacaoCurricular ||
    (t.organizacaoCurricular === "ANUAL" ? etapaDaOferta(t) !== etapa.numero
      : t.semestres.length ? !t.semestres.some(e => e.numero === etapa.numero) : etapaDaOferta(t) !== etapa.numero))) {
    throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
  }
}

export async function validarItensAnuaisDaMatricula(db: BancoAcademico, instituicaoId: number, cursoId: number,
  cursoEtapaId: number | null, itens: { turmaId: number; disciplinaId: number; tipoItem: string }[], matriculaId?: number) {
  const anteriores = matriculaId ? await db.itemMatricula.findMany({
    where: { instituicaoId, matriculaId }, select: { turmaId: true, disciplinaId: true, tipoItem: true },
  }) : [];
  const novos = itens.filter(item => item.tipoItem === "GRADE_PRINCIPAL" && !anteriores.some(a =>
    a.turmaId === item.turmaId && a.disciplinaId === item.disciplinaId && a.tipoItem === item.tipoItem));
  if (!novos.length) return;
  if (cursoEtapaId == null) {
    const contexto = await resolverEtapaDaMatricula(db, instituicaoId, cursoId, null, 1);
    if (contexto.organizacaoCurricular !== "ANUAL" || contexto.cursoSemestreId) throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
    const idsTurmas = [...new Set(novos.map(i => i.turmaId))];
    const turmas = await db.turma.findMany({ where: { id: { in: idsTurmas }, instituicaoId, cursoId, ativa: true, organizacaoCurricular: "ANUAL", etapaNumero: 1 }, select: { id: true } });
    if (turmas.length !== idsTurmas.length) throw new ErroIntegridadeAcademica("ETAPA_INVALIDA");
    const ids = [...new Set(novos.map(i => i.disciplinaId))];
    if (await db.disciplina.count({ where: { id: { in: ids }, instituicaoId, cursoId, ativo: true } }) !== ids.length) throw new ErroIntegridadeAcademica("GRADE_INCOMPATIVEL");
    return;
  }
  await validarTurmasDaEtapa(db, instituicaoId, cursoId, cursoEtapaId, [...new Set(novos.map(i => i.turmaId))]);
  const ids = [...new Set(novos.map(i => i.disciplinaId))];
  const validos = await db.cursoSemestreDisciplina.count({ where: {
    instituicaoId, cursoSemestreId: cursoEtapaId, disciplinaId: { in: ids }, disciplina: { instituicaoId },
  } });
  if (validos !== ids.length) throw new ErroIntegridadeAcademica("GRADE_INCOMPATIVEL");
}
