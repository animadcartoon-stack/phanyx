import { Prisma, type StatusMatricula } from "@prisma/client";
import { matriculaSemGradeHabilitada } from "@/lib/academico/liberacao-avulsos";
import { diaFinanceiro } from "@/lib/financeiro/desconto-pontualidade";
import { idsPositivos, type calcularContratacaoModalidades } from "./combos";
import { validarOfertasDiretasParaGravacao } from "./gravar-matricula-turma-avulsa";
import { carregarOfertasModalidades, itensOcupantes, matriculasOcupantes, prepararContratacaoModalidades } from "./modalidades-servidor";
import { bloquearSessoesOptativas } from "./optativas-avulsas-servidor";
import { ErroRevisaoValores } from "./revisao-valores";
import { origemOfertaVinculada } from "./vagas-ofertas-compartilhadas";

type Banco = Prisma.TransactionClient;
type Vinculo = { matriculaId: number; instituicaoId: number };
type Matricula = {
  alunoId: number;
  status: StatusMatricula;
  canceladaEm: Date | null;
  dataInicioCurso: Date | null;
  turmaPrincipalId: number | null;
  poloId: number | null;
  periodoLetivo: string | null;
  contratacaoModalidades: Prisma.JsonValue;
};

export function objetoJson(valor: Prisma.JsonValue | undefined): Prisma.JsonObject | null {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : null;
}

function ofertasContratadas(matricula: Matricula) {
  const snapshot = objetoJson(matricula.contratacaoModalidades);
  if (!snapshot || !Array.isArray(snapshot.ofertas) || !snapshot.ofertas.length) {
    throw new ErroRevisaoValores("Esta matrícula precisa ter modalidades registradas para usar este fluxo.");
  }
  const ofertas = snapshot.ofertas.map(item => {
    const oferta = objetoJson(item);
    if (!oferta || typeof oferta.turmaId !== "number" || typeof oferta.cursoId !== "number" ||
        typeof oferta.cursoNome !== "string" || typeof oferta.turmaNome !== "string") {
      throw new ErroRevisaoValores("Confira as modalidades registradas nesta matrícula.");
    }
    return { turmaId: oferta.turmaId, cursoId: oferta.cursoId, cursoNome: oferta.cursoNome, turmaNome: oferta.turmaNome };
  });
  return { snapshot, ofertas };
}

export function conferirInicioRevisao(matricula: Matricula) {
  if (matricula.canceladaEm || !matriculasOcupantes.some(status => status === matricula.status)) {
    throw new ErroRevisaoValores("A matrícula precisa estar ativa ou aguardando início.");
  }
  const inicio = matricula.dataInicioCurso?.toISOString().slice(0, 10);
  if (!inicio) throw new ErroRevisaoValores("Informe a data de início em Editar para revisar as modalidades.");
  if (inicio <= diaFinanceiro(new Date())) {
    throw new ErroRevisaoValores("Com o atendimento iniciado, a troca exige uma revisão do contrato e das cobranças.");
  }
  return inicio;
}

export async function listarModalidadesParaRevisao(db: Banco, vinculo: Vinculo) {
  const matricula = await db.matricula.findFirst({
    where: { id: vinculo.matriculaId, instituicaoId: vinculo.instituicaoId, excluidaEm: null },
    select: {
      alunoId: true, status: true, canceladaEm: true, dataInicioCurso: true,
      turmaPrincipalId: true, poloId: true, periodoLetivo: true, contratacaoModalidades: true,
    },
  });
  if (!matricula) throw new ErroRevisaoValores("Matrícula não encontrada.", 404);
  const { ofertas } = ofertasContratadas(matricula);
  const disponiveis = await carregarOfertasModalidades(db, vinculo.instituicaoId, vinculo.matriculaId);
  return {
    atuais: ofertas,
    turmas: disponiveis.filter(o => o.poloId === matricula.poloId && o.periodoLetivo === matricula.periodoLetivo &&
      o.organizacaoCurricular !== "LIVRE" && !o.horariosPendentes && !o.capacidadePendente && o.vagas !== 0)
      .map(o => ({ turmaId: o.id, cursoId: o.curso.id, cursoNome: o.curso.nome, turmaNome: o.nome })),
  };
}

export async function prepararRevisaoModalidades(
  db: Banco, vinculo: Vinculo, matricula: Matricula, selecionadas: unknown, confirmar: boolean,
) {
  const { matriculaId, instituicaoId } = vinculo;
  const inicio = conferirInicioRevisao(matricula);
  const { snapshot, ofertas } = ofertasContratadas(matricula);
  if (!Array.isArray(selecionadas) || !selecionadas.length) {
    throw new ErroRevisaoValores("Mantenha pelo menos uma modalidade. Para retirar todas, use Cancelar matrícula.", 400);
  }
  const turmaIds = idsPositivos(selecionadas).sort((a, b) => a - b);
  const anteriores = ofertas.map(o => o.turmaId).sort((a, b) => a - b);
  if (turmaIds.length !== selecionadas.length) throw new ErroRevisaoValores("Selecione turmas válidas e distintas.", 400);
  if (turmaIds.join() === anteriores.join()) {
    throw new ErroRevisaoValores("Inclua, retire ou troque uma modalidade antes de calcular a prévia.", 400);
  }
  const idsTurmas = [...new Set([...turmaIds, ...anteriores])];
  const turmas = await db.turma.findMany({
    where: { instituicaoId, id: { in: idsTurmas } },
    select: { id: true, cursoId: true, codigo: true, organizacaoCurricular: true },
  });
  if (turmas.length !== idsTurmas.length) throw new ErroRevisaoValores("Uma das turmas selecionadas está indisponível.");
  if (turmas.some(t => turmaIds.includes(t.id) && t.organizacaoCurricular === "LIVRE")) {
    throw new ErroRevisaoValores("Cursos por período usam o fluxo próprio de cursos livres.", 400);
  }
  const bloquear = [...new Set([...idsTurmas, ...turmas.map(origemOfertaVinculada).filter((id): id is number => id !== null)])];
  if (confirmar) {
    await db.$queryRaw(Prisma.sql`SELECT "id" FROM "Turma" WHERE "instituicaoId" = ${instituicaoId}
      AND "id" IN (${Prisma.join(bloquear)}) ORDER BY "id" FOR UPDATE`);
  }
  const removidas = anteriores.filter(id => !turmaIds.includes(id));
  const optativas = await db.matriculaOptativaAvulsa.findMany({
    where: { instituicaoId, vinculo: { matriculaId, status: { in: [...itensOcupantes] } } },
    select: { id: true, turmaId: true, sessaoId: true },
    orderBy: { id: "asc" },
  });
  if (confirmar) {
    await bloquearSessoesOptativas(db, instituicaoId, [...new Set(optativas.map(o => o.sessaoId))]);
    // As presenças referenciam a inscrição na optativa. A trava impede que
    // uma presença seja inserida entre a conferência e a retirada do vínculo.
    const ids = optativas.filter(o => removidas.includes(o.turmaId)).map(o => o.id);
    if (ids.length) await db.$queryRaw(Prisma.sql`SELECT "id" FROM "MatriculaOptativaAvulsa"
      WHERE "instituicaoId" = ${instituicaoId} AND "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`);
  }
  const optativasRetiradas = optativas.filter(o => removidas.includes(o.turmaId));
  const atividadeRegistrada = removidas.length ? await Promise.all([
    db.presencaAula.findFirst({ where: { instituicaoId, alunoId: matricula.alunoId, aula: { turmaId: { in: removidas } } }, select: { id: true } }),
    db.nota.findFirst({ where: { instituicaoId, alunoId: matricula.alunoId, turmaId: { in: removidas } }, select: { id: true } }),
    db.presencaOptativaAvulsa.findFirst({ where: { instituicaoId, matriculaOptativaId: { in: optativasRetiradas.map(o => o.id) } }, select: { id: true } }),
  ]) : [];
  if (atividadeRegistrada.some(Boolean)) {
    throw new ErroRevisaoValores("Uma das modalidades que sairiam já tem presença ou nota registrada.");
  }
  const cursoPrincipalAnterior = ofertas.find(o => o.turmaId === matricula.turmaPrincipalId)?.cursoId;
  const turmaPrincipal = turmaIds.includes(matricula.turmaPrincipalId ?? 0)
    ? matricula.turmaPrincipalId! : (turmas.find(t => turmaIds.includes(t.id) && t.cursoId === cursoPrincipalAnterior)?.id ?? turmaIds[0]);
  const cursoPrincipalId = typeof snapshot.cursoPrincipalId === "number"
    ? turmas.find(t => t.id === turmaPrincipal)?.cursoId : null;
  const cursosSelecionados = turmas.filter(t => turmaIds.includes(t.id)).map(t => t.cursoId).sort();
  const preservarValores = cursosSelecionados.join() === ofertas.map(o => o.cursoId).sort().join();
  const anterior = objetoJson(snapshot.calculo);
  if (preservarValores && !anterior) {
    throw new ErroRevisaoValores("Confira os valores registrados antes de trocar as turmas.");
  }
  const proposta = await prepararContratacaoModalidades(db, instituicaoId, {
    alunoId: matricula.alunoId, turmaIds, cursoPrincipalId, dataInicioCurso: inicio,
    optativaSessaoIds: optativas.filter(o => turmaIds.includes(o.turmaId)).map(o => o.sessaoId),
  }, matriculaId, preservarValores ? anterior as ReturnType<typeof calcularContratacaoModalidades> : undefined);
  if (proposta.escolhidas.some(o => o.poloId !== matricula.poloId || o.periodoLetivo !== matricula.periodoLetivo)) {
    throw new ErroRevisaoValores("Selecione turmas do mesmo polo e período letivo da matrícula.");
  }
  if (proposta.escolhidas.some(o => !anteriores.includes(o.id) && o.curso.matriculaDiretaTurma) &&
      !matriculaSemGradeHabilitada(instituicaoId)) {
    throw new ErroRevisaoValores("A instituição precisa habilitar a matrícula direta para incluir esta turma.");
  }
  validarOfertasDiretasParaGravacao(proposta.escolhidas);
  const mantidas = proposta.escolhidas.filter(o => anteriores.includes(o.id));
  const idsMantidas = mantidas.map(o => o.id);
  if (idsMantidas.length) {
    const where = { ...vinculo, turmaId: { in: idsMantidas }, status: { in: [...itensOcupantes] } };
    const [diretas, itens] = await Promise.all([
      db.matriculaTurmaAvulsa.findMany({ where, select: { turmaId: true, cursoId: true } }),
      db.itemMatricula.findMany({ where, select: { turmaId: true, disciplinaId: true } }),
    ]);
    const divergentes = mantidas.some(o => {
      const direto = diretas.find(d => d.turmaId === o.id);
      const grade = itens.filter(i => i.turmaId === o.id).map(i => i.disciplinaId).sort((a, b) => a - b);
      return o.curso.matriculaDiretaTurma ? direto?.cursoId !== o.curso.id || grade.length > 0
        : Boolean(direto) || grade.join() !== [...o.disciplinaIds].sort((a, b) => a - b).join();
    });
    if (divergentes) throw new ErroRevisaoValores("Os vínculos de uma turma mantida mudaram. Confira a grade da matrícula.");
  }
  const disciplinas = proposta.escolhidas.filter(o => !o.curso.matriculaDiretaTurma).flatMap(o => o.disciplinas);
  if (new Set(disciplinas.map(d => d.id)).size !== disciplinas.length) {
    throw new ErroRevisaoValores("As turmas selecionadas incluem a mesma disciplina mais de uma vez.", 400);
  }
  const principal = proposta.escolhidas.find(o => o.id === turmaPrincipal)!;
  return { proposta, ofertas, removidas, principal, disciplinas, bloquear, optativasRetiradas, preservarValores };
}

export async function aplicarRevisaoAcademica(
  db: Banco, vinculo: Vinculo, matricula: Matricula,
  revisao: Awaited<ReturnType<typeof prepararRevisaoModalidades>>,
) {
  const { matriculaId, instituicaoId } = vinculo;
  const { proposta, removidas, disciplinas, optativasRetiradas, bloquear } = revisao;
  const status = matricula.status === "ATIVA" ? "EM_CURSO" : "A_CURSAR";
  const ocupantes = { in: [...itensOcupantes] };

  // Um confirmador serializável que já esteja aguardando a turma deve
  // repetir a leitura das vagas, em vez de usar o snapshot anterior.
  await db.$executeRaw(Prisma.sql`UPDATE "Turma" SET "updatedAt" = "updatedAt"
    WHERE "instituicaoId" = ${instituicaoId} AND "id" IN (${Prisma.join(bloquear)})`);
  if (optativasRetiradas.length) {
    await db.matriculaOptativaAvulsa.deleteMany({
      where: { instituicaoId, id: { in: optativasRetiradas.map(o => o.id) } },
    });
  }
  if (removidas.length) {
    const removidos = { ...vinculo, turmaId: { in: removidas }, status: ocupantes };
    await db.itemMatricula.updateMany({ where: removidos, data: { status: "CANCELADO" } });
    await db.matriculaTurmaAvulsa.updateMany({ where: removidos, data: { status: "CANCELADO" } });
  }
  const adicionadas = proposta.escolhidas.filter(o => !revisao.ofertas.some(antiga => antiga.turmaId === o.id));
  for (const oferta of adicionadas) {
    const turmaId = oferta.id;
    if (oferta.curso.matriculaDiretaTurma) {
      const cursoId = oferta.curso.id;
      await db.matriculaTurmaAvulsa.upsert({
        where: { matriculaId_cursoId: { matriculaId, cursoId } },
        create: { ...vinculo, turmaId, cursoId, status },
        update: { turmaId, status },
      });
    } else {
      for (const disciplinaId of oferta.disciplinaIds) {
        await db.itemMatricula.upsert({
          where: { matriculaId_turmaId_disciplinaId: { matriculaId, turmaId, disciplinaId } },
          create: { ...vinculo, turmaId, disciplinaId, status },
          update: { status },
        });
      }
    }
  }
  await db.matriculaDisciplinaContratada.deleteMany({
    where: { ...vinculo, disciplinaId: { notIn: disciplinas.map(d => d.id) } },
  });
  if (disciplinas.length) {
    await db.matriculaDisciplinaContratada.createMany({
      data: disciplinas.map((d, ordemSnapshot) => ({
        ...vinculo, disciplinaId: d.id, disciplinaNomeSnapshot: d.nome,
        cargaHorariaSnapshot: d.cargaHoraria, semestreNumeroSnapshot: d.semestre, ordemSnapshot,
      })),
      skipDuplicates: true,
    });
  }
}
