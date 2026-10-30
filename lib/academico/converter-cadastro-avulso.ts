import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { validarProntidaoAtivacaoTurmaAvulsa } from "./validar-prontidao-ativacao-turma-avulsa";
import { validarCapacidadeTurmaAvulsa, validarHorariosTurmaAvulsa, ErroCadastroTurmaAvulsa, type HorarioAvulso } from "./validar-turma-avulsa";

type Banco = Prisma.TransactionClient;
export class ErroConversaoAvulsa extends Error {
  constructor(public codigo: string, mensagem: string, public status = 409) { super(mensagem); }
}
const falhar = (codigo: string, mensagem: string): never => { throw new ErroConversaoAvulsa(codigo, mensagem); };
const id = (valor: unknown) => {
  if ((typeof valor !== "number" && typeof valor !== "string") || !Number.isSafeInteger(Number(valor)) || Number(valor) <= 0)
    throw new ErroConversaoAvulsa("DADOS_INVALIDOS", "Identificador inválido.", 400);
  return Number(valor);
};
const semUso = (contagens: Record<string, number>, mensagem: string) => {
  if (Object.values(contagens).some(total => total > 0)) falhar("CADASTRO_EM_USO", mensagem);
};
const chave = (valor: unknown) => createHash("sha256").update(JSON.stringify(valor)).digest("hex");
export type EntradaConversao = { tipo?: unknown; id?: unknown; cursoDestinoId?: unknown; dadosTurma?: unknown };
export type PreviaConversao = { chave: string; tipo: "curso" | "turma"; id: number; nome: string;
  cursoDestino: string; etapas: number; vinculosDisciplinas: number; disciplinasCatalogo: string[]; horarios: number; converteCurso?: boolean; turmasMantidas?: { id: number; nome: string; professor: string | null; horarios: HorarioAvulso[]; ativa: boolean; revisar: boolean }[] };

async function prepararCursoAvulso(db: Banco, instituicaoId: number, cadastroId: number, turmaPropriaId?: number, incluirTurmas = false) {
    await db.$queryRaw`SELECT "id" FROM "Curso" WHERE "id"=${cadastroId} AND "instituicaoId"=${instituicaoId} FOR UPDATE`;
    const turmasIds = incluirTurmas ? (await db.turma.findMany({ where: { cursoId: cadastroId, instituicaoId }, orderBy: { id: "asc" }, select: { id: true } })).map(t => t.id) : [];
    if (incluirTurmas) await db.$queryRaw`SELECT "id" FROM "Turma" WHERE "cursoId"=${cadastroId} AND "instituicaoId"=${instituicaoId} ORDER BY "id" FOR UPDATE`;
    const curso = await db.curso.findFirst({ where: { id: cadastroId, instituicaoId, ativo: true, excluidoEm: null },
      include: {
        turmas: { orderBy: { id: "asc" }, include: {
          professor: { select: { nome: true, instituicaoId: true } }, polo: { select: { instituicaoId: true } },
          disciplinas: { orderBy: { id: "asc" }, include: {
            professor: { select: { nome: true, instituicaoId: true } },
            disciplina: { select: { id: true, instituicaoId: true } },
            horarios: { orderBy: { id: "asc" } }, _count: { select: { itensRematriculaSemestral: true } },
          } }, semestres: true, horariosAvulsos: { orderBy: { id: "asc" } },
          _count: { select: { atividades: true, aulas: true, itensMatricula: true, matriculasComoPrincipal: true,
            modulos: true, notas: true, provas: true, sessoesVideoAluno: true, eventosAprendizagemAluno: true,
            resultadosFinais: true, periodosMatriculaParticipantes: true, reunioes: true, substituicoesDocentes: true,
            destinosRecomendacoesBiblioteca: true, atividadesExternas: true, matriculasAvulsas: true } },
        } },
        semestres: { orderBy: { id: "asc" }, include: { disciplinas: { orderBy: { id: "asc" }, include: { disciplina: { select: { id: true, nome: true, instituicaoId: true } } } }, _count: { select: {
          matriculas: true, periodosMatricula: true, rematriculasDestino: true,
          disciplinasExtrasPermitidas: true, semestresPublicadosRede: true,
        } } } },
        disciplinas: { orderBy: { id: "asc" }, include: { _count: { select: {
          itensMatricula: true, aulas: true, atividades: true, provas: true, resultadosFinais: true,
          certificados: true, sessoesVideoAluno: true, eventosAprendizagemAluno: true,
          substituicoesDocentes: true, itensRematriculaSemestral: true, turmaDisciplinas: incluirTurmas ? { where: { turmaId: { notIn: turmasIds } } } : turmaPropriaId === undefined ? true : { where: { turmaId: { not: turmaPropriaId } } },
          disciplinasPublicadasRede: true,
        } } } },
        _count: { select: { turmas: true, matriculas: true, vinculosMatriculaTurmaAvulsa: true,
          periodosMatricula: true, documentosGerados: true, disciplinasExtrasPermitidas: true, reunioes: true } },
      } });
    if (!curso) throw new ErroConversaoAvulsa("NAO_ENCONTRADO", "Curso não encontrado nesta instituição.", 404);
    if (curso.matriculaDiretaTurma) falhar("JA_CONVERTIDO", "Este curso já utiliza matrícula direta.");
    if (!["ANUAL", "SEMESTRAL"].includes(curso.organizacaoCurricular) || curso.regrasPrecoDisciplinas || curso.regrasSelecaoDisciplinas)
      falhar("MODO_INCOMPATIVEL", "A conversão exige preço fixo, organização anual ou semestral e ausência de regras de seleção de disciplinas.");
    if (turmaPropriaId !== undefined && (curso._count.turmas !== 1 || await db.turma.count({ where: { id: turmaPropriaId, cursoId: cadastroId, instituicaoId } }) !== 1))
      falhar("OUTRAS_TURMAS", `Esta operação mudaria a estrutura de todo o curso “${curso.nome}” e afetaria outras turmas. Para preservar sua grade, edite esta turma no curso atual ou escolha um curso avulso de destino já habilitado. O curso pode continuar com várias turmas.`);
    if (incluirTurmas && (curso._count.turmas !== turmasIds.length || curso.turmas.length !== turmasIds.length || curso.turmas.some(t => !turmasIds.includes(t.id))))
      falhar("DADOS_ALTERADOS", "As turmas do curso mudaram. Solicite uma nova revisão.");
    semUso(turmaPropriaId === undefined && !incluirTurmas ? curso._count : { ...curso._count, turmas: 0 }, "O curso possui turmas, matrículas, documentos ou configurações em uso. Esses vínculos precisam de revisão antes da conversão.");
    if (await db.cursoPublicacaoRede.count({ where: { OR: [{ cursoOrigemId: cadastroId }, { cursoDestinoId: cadastroId }] } }))
      falhar("VINCULO_REDE", "Cursos publicados ou recebidos da rede precisam de revisão própria.");
    for (const etapa of curso.semestres) {
      if (etapa.instituicaoId !== instituicaoId || etapa.cursoSemestreOrigemRedeId || etapa.disciplinas.some(d => d.instituicaoId !== instituicaoId || d.disciplina.instituicaoId !== instituicaoId))
        falhar("VINCULO_REDE", "A estrutura contém vínculos de rede ou de outra instituição.");
      semUso(etapa._count, "Uma etapa possui registros ou configurações vinculados; a estrutura será preservada.");
    }
    for (const disciplina of curso.disciplinas) {
      if (disciplina.instituicaoId !== instituicaoId || disciplina.disciplinaOrigemRedeId) falhar("VINCULO_REDE", "Disciplina recebida da rede ou de outra instituição.");
      semUso(disciplina._count, "Uma disciplina direta possui ofertas ou registros acadêmicos. A conversão não pode modificar esse vínculo.");
    }
    const etapasIds = curso.semestres.map(e => e.id), disciplinaIds = curso.disciplinas.map(d => d.id);
    if (await db.matriculaDisciplinaContratada.count({ where: { OR: [
      { cursoSemestreIdSnapshot: { in: etapasIds } }, { disciplinaId: { in: disciplinaIds } },
    ] } })) falhar("CADASTRO_EM_USO", "Há disciplinas ou etapas preservadas em contratos anteriores.");
    const snapshots = await db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
      WHERE "instituicaoId"=${instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ cursoId: cadastroId }] })}::jsonb`;
    if (snapshots[0]?.total) falhar("CADASTRO_EM_USO", "O curso está registrado em uma contratação anterior.");
    // A conversão do curso revisa todas as suas turmas sem uso. Cancelamentos e
    // snapshots históricos continuam protegidos; nenhuma matrícula é excluída.
    const planosTurmas = [];
    for (const turma of incluirTurmas ? curso.turmas : []) {
      semUso(turma._count, `A turma “${turma.nome}” possui registros acadêmicos. Seus dados e histórico foram preservados.`);
      if (turma.instituicaoId !== instituicaoId || turma.professor && turma.professor.instituicaoId !== instituicaoId || turma.polo && turma.polo.instituicaoId !== instituicaoId ||
          turma.semestres.some(e => e.instituicaoId !== instituicaoId) || turma.horariosAvulsos.some(h => h.instituicaoId !== instituicaoId) ||
          turma.disciplinas.some(d => d.instituicaoId !== instituicaoId || d.disciplina.instituicaoId !== instituicaoId || d.professor && d.professor.instituicaoId !== instituicaoId || d.horarios.some(h => h.instituicaoId !== instituicaoId)))
        falhar("VINCULO_INVALIDO", `A turma “${turma.nome}” possui uma referência de outra instituição.`);
      for (const oferta of turma.disciplinas) semUso(oferta._count, `A turma “${turma.nome}” tem uma disciplina usada em rematrícula.`);
      const snapshotTurma = await db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
        WHERE "instituicaoId"=${instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ turmaId: turma.id }] })}::jsonb`;
      const derivadas = await db.turma.findMany({ where: { instituicaoId, codigo: { startsWith: `OFERTA-${turma.id}-` } }, select: { cursoId: true, codigo: true } });
      if (snapshotTurma[0]?.total || derivadas.some(t => t.codigo === `OFERTA-${turma.id}-${t.cursoId}`))
        falhar("CADASTRO_EM_USO", `A turma “${turma.nome}” está preservada em uma contratação ou oferta compartilhada.`);
      const professores = [...new Set([turma.professorId, ...turma.disciplinas.map(d => d.professorId)].filter((v): v is number => v !== null))];
      if (professores.length > 1) falhar("PROFESSORES_DIVERGENTES", `A turma “${turma.nome}” possui professores diferentes nas disciplinas. Defina o responsável antes de mudar para sem grade.`);
      const professorId = professores[0] ?? null;
      const professor = turma.professor?.nome || turma.disciplinas.find(d => d.professorId === professorId)?.professor?.nome || null;
      const proprios = turma.horariosAvulsos.filter(h => h.ativo);
      const efetivos: HorarioAvulso[] = [];
      if (turma.disciplinas.length) for (const oferta of turma.disciplinas) {
        const especificos = oferta.horarios.filter(h => h.ativo);
        efetivos.push(...(especificos.length ? especificos : proprios));
      } else efetivos.push(...proprios);
      const unicos = [...new Map(efetivos.map(h => [`${h.diaSemana}|${h.horaInicio}|${h.horaFim}`, { diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFim: h.horaFim }])).values()];
      let horarios: HorarioAvulso[] = [];
      try { if (unicos.length) horarios = validarHorariosTurmaAvulsa(unicos); }
      catch (e) { if (e instanceof ErroCadastroTurmaAvulsa) falhar(e.codigo, `Revise os horários da turma “${turma.nome}”: ${e.message}`); throw e; }
      let revisar = false;
      try { validarProntidaoAtivacaoTurmaAvulsa({ curso, professorId, capacidadeMaxima: turma.capacidadeMaxima, periodoLetivo: turma.periodoLetivo, turno: turma.turno, horarios }); }
      catch (e) { if (!(e instanceof ErroCadastroTurmaAvulsa)) throw e; revisar = true; }
      planosTurmas.push({ id: turma.id, nome: turma.nome, professor, professorId, horarios, ativa: turma.ativa && !revisar, revisar });
    }
    const previa: PreviaConversao = { chave: chave(curso), tipo: "curso", id: cadastroId, nome: curso.nome,
      cursoDestino: curso.nome, etapas: etapasIds.length,
      vinculosDisciplinas: curso.semestres.reduce((total, etapa) => total + etapa.disciplinas.length, 0) + (incluirTurmas ? curso.turmas.reduce((n, t) => n + t.disciplinas.length, 0) : 0),
      disciplinasCatalogo: [...new Map([...curso.disciplinas, ...curso.semestres.flatMap(e => e.disciplinas.map(d => d.disciplina))].map(d => [d.id, d.nome])).values()], horarios: planosTurmas.reduce((n, t) => n + t.horarios.length, 0),
      ...(incluirTurmas ? { turmasMantidas: planosTurmas.map(({ professorId: _, ...t }) => t) } : {}) };
    return { previa, async aplicar() {
      for (const turma of planosTurmas) {
        await db.turmaDisciplina.deleteMany({ where: { turmaId: turma.id, instituicaoId } });
        await db.turmaSemestre.deleteMany({ where: { turmaId: turma.id, instituicaoId } });
        await db.turma.update({ where: { id: turma.id }, data: {
          professorId: turma.professorId, ativa: turma.ativa,
          ...(turma.revisar ? { statusTurma: "A_INICIAR" } : {}),
          horariosAvulsos: { deleteMany: { instituicaoId }, create: turma.horarios.map(h => ({ ...h, ativo: true })) },
        } });
      }
      // Mantém IDs, conteúdos e associações das disciplinas às grades dos demais cursos.
      await db.disciplina.updateMany({ where: { id: { in: disciplinaIds }, instituicaoId, cursoId: cadastroId }, data: { cursoId: null } });
      await db.cursoSemestreDisciplina.deleteMany({ where: { instituicaoId, cursoSemestreId: { in: etapasIds } } });
      await db.cursoSemestre.deleteMany({ where: { instituicaoId, cursoId: cadastroId, id: { in: etapasIds } } });
      await db.curso.update({ where: { id: cadastroId }, data: { matriculaDiretaTurma: true } });
      return { id: cadastroId, tipo: "curso", matriculaDiretaTurma: true };
    } };
}

// Sempre executada dentro de uma transação Serializable, na prévia e na confirmação.
export async function prepararConversaoAvulsa(db: Banco, instituicaoId: number, entrada: EntradaConversao) {
  if (!Number.isSafeInteger(instituicaoId) || instituicaoId <= 0) throw new ErroConversaoAvulsa("SEM_PERMISSAO", "Sem permissão.", 403);
  const cadastroId = id(entrada.id);
  if (entrada.tipo === "curso") return prepararCursoAvulso(db, instituicaoId, cadastroId, undefined, true);
  if (entrada.tipo !== "turma") throw new ErroConversaoAvulsa("DADOS_INVALIDOS", "Tipo de cadastro inválido.", 400);
  const cursoDestinoId = id(entrada.cursoDestinoId);
  // Ordem fixa dos bloqueios evita deadlock com a conversão de curso.
  await db.$queryRaw`SELECT "id" FROM "Curso" WHERE "id"=${cursoDestinoId} AND "instituicaoId"=${instituicaoId} FOR UPDATE`;
  await db.$queryRaw`SELECT "id" FROM "Turma" WHERE "id"=${cadastroId} AND "instituicaoId"=${instituicaoId} FOR UPDATE`;
  const destino = await db.curso.findFirst({ where: { id: cursoDestinoId, instituicaoId, ativo: true, excluidoEm: null },
    include: { _count: { select: { semestres: true, disciplinas: true } } } });
  if (!destino) falhar("DESTINO_INVALIDO", "Selecione um curso ativo habilitado para matrícula diretamente na turma.");
  if (destino.matriculaDiretaTurma && (!["ANUAL", "SEMESTRAL"].includes(destino.organizacaoCurricular) || destino.regrasPrecoDisciplinas || destino.regrasSelecaoDisciplinas || destino._count.semestres || destino._count.disciplinas))
    falhar("DESTINO_INVALIDO", "O curso de destino ainda possui grade ou configuração incompatível.");
  if (await db.cursoPublicacaoRede.count({ where: { OR: [{ cursoOrigemId: cursoDestinoId }, { cursoDestinoId }] } })) falhar("VINCULO_REDE", "Curso de destino vinculado à rede.");
  const turma = await db.turma.findFirst({ where: { id: cadastroId, instituicaoId }, include: {
    curso: true, disciplinas: { orderBy: { id: "asc" }, include: { horarios: { orderBy: { id: "asc" } },
      disciplina: { select: { id: true, nome: true, instituicaoId: true } }, _count: { select: { itensRematriculaSemestral: true } } } },
    semestres: { orderBy: { id: "asc" } }, horariosAvulsos: true,
    _count: { select: { atividades: true, aulas: true, itensMatricula: true, matriculasComoPrincipal: true,
      modulos: true, notas: true, provas: true, sessoesVideoAluno: true, eventosAprendizagemAluno: true,
      resultadosFinais: true, periodosMatriculaParticipantes: true, reunioes: true, substituicoesDocentes: true,
      destinosRecomendacoesBiblioteca: true, atividadesExternas: true, matriculasAvulsas: true } },
  } });
  if (!turma) throw new ErroConversaoAvulsa("NAO_ENCONTRADO", "Turma não encontrada nesta instituição.", 404);
  if (turma.curso?.matriculaDiretaTurma) falhar("JA_CONVERTIDO", "Esta turma já possui configuração de matrícula direta.");
  semUso(turma._count, "A turma possui matrículas, aulas, notas ou outros vínculos. O cadastro e seu histórico serão preservados.");
  for (const oferta of turma.disciplinas) {
    if (oferta.instituicaoId !== instituicaoId || oferta.disciplina.instituicaoId !== instituicaoId || oferta.horarios.some(h => h.instituicaoId !== instituicaoId)) falhar("VINCULO_INVALIDO", "Oferta contém vínculos de outra instituição.");
    semUso(oferta._count, "Uma disciplina da turma está vinculada a uma rematrícula.");
  }
  if (turma.horariosAvulsos.some(h => h.instituicaoId !== instituicaoId) || turma.semestres.some(s => s.instituicaoId !== instituicaoId)) falhar("VINCULO_INVALIDO", "Etapa da turma pertence a outra instituição.");
  if (turma.cursoId && await db.cursoPublicacaoRede.count({ where: { OR: [{ cursoOrigemId: turma.cursoId }, { cursoDestinoId: turma.cursoId }] } })) falhar("VINCULO_REDE", "A turma pertence a um curso vinculado à rede.");
  const snapshots = await db.$queryRaw<{ total: number }[]>`SELECT count(*)::int AS total FROM "Matricula"
    WHERE "instituicaoId"=${instituicaoId} AND "contratacaoModalidades" @> ${JSON.stringify({ ofertas: [{ turmaId: cadastroId }] })}::jsonb`;
  if (snapshots[0]?.total) falhar("CADASTRO_EM_USO", "A turma está preservada em uma contratação anterior.");
  const dados = entrada.dadosTurma;
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) throw new ErroConversaoAvulsa("DADOS_INVALIDOS", "Informe os dados e horários da turma.", 400);
  const form = dados as Record<string, unknown>;
  const nome = String(form.nome ?? turma.nome).trim(), codigo = String(form.codigo ?? turma.codigo ?? "").trim();
  const periodoLetivo = String(form.periodoLetivo ?? turma.periodoLetivo ?? "").trim(), turno = String(form.turno ?? turma.turno ?? "").trim();
  const capacidadeMaxima = validarCapacidadeTurmaAvulsa(form.capacidadeMaxima ?? turma.capacidadeMaxima);
  const horarios = validarHorariosTurmaAvulsa(form.horarios);
  const minimo = form.capacidadeMinima === undefined ? turma.capacidadeMinima : form.capacidadeMinima == null || form.capacidadeMinima === "" ? null : Number(form.capacidadeMinima);
  if (minimo !== null && (!Number.isSafeInteger(minimo) || minimo < 0 || minimo > capacidadeMaxima)) throw new ErroConversaoAvulsa("DADOS_INVALIDOS", "A capacidade mínima deve ser menor ou igual à máxima.", 400);
  const professorId = form.professorId === undefined ? turma.professorId : form.professorId === null || form.professorId === "" ? null : id(form.professorId);
  if (nome.length < 2 || nome.length > 120 || codigo.length > 80 || !/^\d{4}$/.test(periodoLetivo) || !["MATUTINO", "VESPERTINO", "NOTURNO", "INTEGRAL", "FLEXIVEL"].includes(turno))
    throw new ErroConversaoAvulsa("DADOS_INVALIDOS", "Preencha nome, ano letivo, turno, vagas e horários válidos.", 400);
  if (professorId && !await db.professor.findFirst({ where: { id: professorId, instituicaoId }, select: { id: true } })) falhar("VINCULO_INVALIDO", "Professor não pertence à instituição.");
  if (turma.poloId && !await db.polo.findFirst({ where: { id: turma.poloId, instituicaoId, ativo: true }, select: { id: true } })) falhar("VINCULO_INVALIDO", "Polo inativo ou de outra instituição.");
  if (await db.turma.count({ where: { instituicaoId, cursoId: cursoDestinoId, periodoLetivo, nome, id: { not: cadastroId } } })) falhar("TURMA_DUPLICADA", "Já existe uma turma com este nome no curso e ano de destino.");
  const converterCursoAtual = !destino.matriculaDiretaTurma;
  if (converterCursoAtual && turma.cursoId !== cursoDestinoId)
    falhar("DESTINO_INVALIDO", "Para trocar de curso, selecione um destino já habilitado. A conversão conjunta permite manter o próprio curso da turma.");
  const planoCurso = converterCursoAtual ? await prepararCursoAvulso(db, instituicaoId, cursoDestinoId, cadastroId) : null;
  const alteracoes = { nome, codigo: codigo || null, periodoLetivo, turno, capacidadeMaxima, capacidadeMinima: minimo, professorId };
  const previa: PreviaConversao = { chave: chave({ turma, destino, alteracoes, horarios, curso: planoCurso?.previa.chave }), tipo: "turma", id: cadastroId, nome,
    cursoDestino: destino.nome, etapas: turma.semestres.length + (planoCurso?.previa.etapas || 0),
    vinculosDisciplinas: turma.disciplinas.length + (planoCurso?.previa.vinculosDisciplinas || 0),
    disciplinasCatalogo: [...new Set([...turma.disciplinas.map(d => d.disciplina.nome), ...(planoCurso?.previa.disciplinasCatalogo || [])])],
    horarios: horarios.length, converteCurso: converterCursoAtual };
  return { previa, async aplicar() {
    // Remove somente ofertas estruturais sem uso desta turma; o catálogo e os outros cursos ficam preservados.
    await db.turmaDisciplina.deleteMany({ where: { turmaId: cadastroId, instituicaoId } });
    await db.turmaSemestre.deleteMany({ where: { turmaId: cadastroId, instituicaoId } });
    if (planoCurso) await planoCurso.aplicar();
    await db.turma.update({ where: { id: cadastroId }, data: { ...alteracoes, cursoId: cursoDestinoId,
      organizacaoCurricular: destino.organizacaoCurricular, etapaNumero: 1,
      semestre: destino.organizacaoCurricular === "ANUAL" ? "" : "1", ativa: false, statusTurma: "A_INICIAR",
      horariosAvulsos: { deleteMany: { instituicaoId }, create: horarios.map(h => ({ ...h, ativo: true })) } } });
    return { id: cadastroId, tipo: "turma", ativa: false, cursoId: cursoDestinoId };
  } };
}
