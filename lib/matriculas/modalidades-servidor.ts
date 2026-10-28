import { idCursoPrincipal, validarCursosAdicionais } from "./cursos-adicionais";
import { origemOfertaVinculada, capacidadePendenteOferta, vagasOfertaCompartilhada, type OfertaParaVagas } from "./vagas-ofertas-compartilhadas";
import { temDisciplinaIncluidaDuplicada } from "./selecao-disciplinas";
import { validarRequisitosCursos } from "@/lib/matriculas/requisitos-cursos";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  calcularContratacaoModalidades,
  centavos,
  encontrarConflitos,
  ErroModalidades,
  horarioValido,
  idsPositivos,
  type HorarioModalidade,
  vencimentoMensal,
} from "./combos";
import { validarDataInicioCurso } from "./dataInicioCurso";
import { calcularIdade, verificarDadosResponsavel } from "./confirmacao-menor";
import { criarContratoPendenteMatricula } from "@/lib/contratos/contrato-matricula";

// Tanto a leitura de prévia quanto a confirmação usam estas mesmas regras.
type Banco = Prisma.TransactionClient;
export const matriculasOcupantes = [
  "ATIVA",
  "A_INICIAR",
  "AGUARDANDO",
] as const;
export const itensOcupantes = ["A_CURSAR", "EM_CURSO"] as const;
const civil = (data: Date | null) =>
  data ? data.toISOString().slice(0, 10) : null;

export async function carregarOfertasModalidades(
  db: Banco,
  instituicaoId: number,
) {
  const turmas = await db.turma.findMany({
    where: {
      instituicaoId,
      ativa: true,
      statusTurma: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] },
      curso: { instituicaoId, ativo: true, excluidoEm: null },
      OR: [{ poloId: null }, { polo: { ativo: true } }],
    },
    select: {
      id: true,
      nome: true,
      codigo: true,
      cursoId: true,
      poloId: true,
      periodoLetivo: true,
      turno: true,
      etapaNumero: true,
      organizacaoCurricular: true,
      modalidade: true,
      dataInicio: true,
      dataFim: true,
      capacidadeMaxima: true,
      polo: { select: { nome: true } },
      curso: {
        select: {
          id: true,
          nome: true,
          participaCombo: true,
          permiteCursosAdicionais: true,
          disponivelComoAdicional: true,
          requisitosConjuntos: { select: { cursoObrigatorioId: true, cursoObrigatorio: { select: { nome: true } } } },
          valorMatricula: true,
          valorMensalidade: true,
          regrasPrecoDisciplinas: true,
          regrasSelecaoDisciplinas: true,
          descontoMensalidadePercentual: true,
          valorMensalidadeCombo: true,
          precosComboPorQuantidade: true,
          quantidadeParcelas: true,
        },
      },
      disciplinas: {
        where: { instituicaoId, disciplina: { instituicaoId, ativo: true } },
        orderBy: { disciplinaId: "asc" },
        select: {
          disciplinaId: true,
          dataInicio: true,
          dataFim: true,
          disciplina: {
            select: { nome: true, cargaHoraria: true, semestre: true },
          },
          horarios: {
            where: { instituicaoId, ativo: true },
            orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
            select: { diaSemana: true, horaInicio: true, horaFim: true },
          },
        },
      },
    },
    orderBy: [{ curso: { nome: "asc" } }, { nome: "asc" }, { id: "asc" }],
  });
  // Consulta ofertas vinculadas (inclusive inativas) para impedir que o mesmo
  // lugar fisico seja vendido por dois cursos. Nunca modifica os registros.
  const ofertasVinculadas = turmas.length ? await db.turma.findMany({
    where: { instituicaoId, codigo: { startsWith: "OFERTA-" } },
    select: { id: true, codigo: true, cursoId: true, capacidadeMaxima: true,
      disciplinas: { select: { disciplinaId: true } } },
  }) : [];
  const metas = new Map<number, OfertaParaVagas>();
  for (const turma of turmas) metas.set(turma.id, {
    id: turma.id, codigo: turma.codigo, cursoId: turma.cursoId,
    capacidadeMaxima: turma.capacidadeMaxima,
    disciplinas: turma.disciplinas.map(d => ({ disciplinaId: d.disciplinaId })),
  });
  for (const oferta of ofertasVinculadas) metas.set(oferta.id, oferta);
  const origensAusentes = [...new Set(ofertasVinculadas.map(origemOfertaVinculada).filter((n): n is number => n !== null))]
    .filter(id => !metas.has(id));
  if (origensAusentes.length) {
    const origens = await db.turma.findMany({
      where: { instituicaoId, id: { in: origensAusentes } },
      select: { id: true, codigo: true, cursoId: true, capacidadeMaxima: true,
        disciplinas: { select: { disciplinaId: true } } },
    });
    for (const origem of origens) metas.set(origem.id, origem);
  }
  const ocupacoes = turmas.length
    ? await db.itemMatricula.findMany({
        where: {
          instituicaoId,
          turmaId: { in: [...metas.keys()] },
          status: { in: [...itensOcupantes] },
          matricula: {
            instituicaoId,
            excluidaEm: null,
            canceladaEm: null,
            status: { in: [...matriculasOcupantes] },
          },
        },
        select: { turmaId: true, disciplinaId: true, matricula: { select: { alunoId: true } } },
      })
    : [];
  const metasTurmas = [...metas.values()];
  return turmas.filter(t => !t.curso.regrasPrecoDisciplinas && !t.curso.regrasSelecaoDisciplinas).map((turma) => {
    const horarios: HorarioModalidade[] = turma.disciplinas.flatMap((td) =>
      td.horarios.map((h) => ({
        ...h,
        turmaId: turma.id,
        turmaNome: turma.nome,
        disciplinaId: td.disciplinaId,
        disciplinaNome: td.disciplina.nome,
        dataInicio: civil(td.dataInicio || turma.dataInicio),
        dataFim: civil(td.dataFim || turma.dataFim),
      })),
    );
    const eadLivre =
      /^(EAD|ONLINE|A_DISTANCIA)$/i.test(turma.modalidade || "") &&
      horarios.length === 0;
    const horariosPendentes =
      turma.disciplinas.length === 0 ||
      horarios.some((h) => !horarioValido(h)) ||
      (!eadLivre && turma.disciplinas.some((td) => td.horarios.length === 0));
    return {
      id: turma.id,
      nome: turma.nome,
      cursoId: turma.cursoId,
      poloId: turma.poloId,
      poloNome: turma.polo?.nome ?? "Sem polo",
      turno: turma.turno,
      periodoLetivo: turma.periodoLetivo,
      etapaNumero: turma.etapaNumero,
      organizacaoCurricular: turma.organizacaoCurricular,
      horarios,
      dataInicio: civil(turma.dataInicio),
      dataFim: civil(turma.dataFim),
      horariosPendentes,
      eadLivre,
      disciplinaIds: turma.disciplinas.map((td) => td.disciplinaId),
      disciplinas: turma.disciplinas.map((td) => ({
        id: td.disciplinaId,
        nome: td.disciplina.nome,
        cargaHoraria: td.disciplina.cargaHoraria,
        semestre: td.disciplina.semestre,
      })),
      capacidadePendente: capacidadePendenteOferta(metas.get(turma.id)!, metasTurmas),
      vagas: vagasOfertaCompartilhada(metas.get(turma.id)!, metasTurmas, ocupacoes),
      curso: {
        ...turma.curso,
        descontoMensalidadePercentual: turma.curso.descontoMensalidadePercentual?.toString() ?? null,
        valorMensalidadeCombo:
          turma.curso.valorMensalidadeCombo?.toString() ?? null,
      },
    };
  });
}
export type OfertaModalidade = Awaited<
  ReturnType<typeof carregarOfertasModalidades>
>[number];

export async function horariosAtuaisAluno(
  db: Banco,
  instituicaoId: number,
  alunoId: number,
  ignorarMatriculaId?: number,
) {
  const itens = await db.itemMatricula.findMany({
    where: {
      instituicaoId,
      status: { in: [...itensOcupantes] },
      matricula: {
        instituicaoId,
        alunoId,
        excluidaEm: null,
        canceladaEm: null,
        ...(ignorarMatriculaId ? { id: { not: ignorarMatriculaId } } : {}),
        status: { in: [...matriculasOcupantes] },
      },
    },
    select: {
      turmaId: true,
      disciplinaId: true,
      turma: { select: { nome: true, dataInicio: true, dataFim: true } },
      matricula: { select: { dataInicioCurso: true, organizacaoCurricular: true, regrasSelecaoDisciplinas: true,
        periodosCursoLivre: { where: { instituicaoId, lancamento: { status: { not: "CANCELADO" } } }, select: { dataInicio: true, dataFim: true } },
      } },
      disciplina: { select: { nome: true } },
    },
  });
  const vinculos = itens.length
    ? await db.turmaDisciplina.findMany({
        where: {
          instituicaoId,
          OR: itens.map((i) => ({
            turmaId: i.turmaId,
            disciplinaId: i.disciplinaId,
          })),
        },
        select: {
          turmaId: true,
          disciplinaId: true,
          dataInicio: true,
          dataFim: true,
          horarios: {
            where: { instituicaoId, ativo: true },
            select: { diaSemana: true, horaInicio: true, horaFim: true },
          },
        },
      })
    : [];
  const horarios = itens.flatMap((i) => {
    const vinculo = vinculos.find(
      (v) => v.turmaId === i.turmaId && v.disciplinaId === i.disciplinaId,
    );
    const periodos = i.matricula.organizacaoCurricular === "LIVRE" ? i.matricula.periodosCursoLivre : [null];
    return periodos.flatMap(periodo => (vinculo?.horarios || []).map((h) => {
      const inicios = [
        civil(vinculo.dataInicio || i.turma.dataInicio),
        civil(i.matricula.dataInicioCurso),
        civil(periodo?.dataInicio ?? null),
      ]
        .filter(Boolean)
        .sort();
      return {
        ...h,
        turmaId: i.turmaId,
        disciplinaId: i.disciplinaId,
        turmaNome: i.turma.nome,
        disciplinaNome: i.disciplina.nome,
        dataInicio: inicios.pop() || null,
        dataFim: [civil(vinculo.dataFim || i.turma.dataFim), civil(periodo?.dataFim ?? null)].filter(Boolean).sort()[0] || null,
      };
    }));
  });
  return { itens, horarios };
}

export async function prepararContratacaoModalidades(
  db: Banco,
  instituicaoId: number,
  body: Record<string, unknown>,
) {
  const [alunoId] = idsPositivos([body.alunoId]);
  const turmaIds = idsPositivos(body.turmaIds);
  if (!turmaIds.length) throw new ErroModalidades("SELECAO_INVALIDA");
  const aluno = await db.aluno.findFirst({
    where: { id: alunoId, instituicaoId, ativo: true },
  });
  if (!aluno) throw new ErroModalidades("ALUNO_NAO_ENCONTRADO", 404);
  const inicioCurso = validarDataInicioCurso(body.dataInicioCurso);
  if (!inicioCurso.valida) throw new ErroModalidades("DATA_INVALIDA");
  const ofertas = await carregarOfertasModalidades(db, instituicaoId);
  const selecionadas = turmaIds.map((id) => ofertas.find((o) => o.id === id));
  if (selecionadas.some((o) => !o))
    throw new ErroModalidades("TURMA_INDISPONIVEL", 409);
  const escolhidas = selecionadas as OfertaModalidade[];
  const principalId = idCursoPrincipal(body.cursoPrincipalId);
  validarCursosAdicionais(escolhidas.map(o => o.curso), principalId);
  if (escolhidas.length && escolhidas.every(o => o.organizacaoCurricular === "LIVRE")) throw new ErroModalidades("CURSO_LIVRE_FLUXO_PROPRIO");
  if (new Set(escolhidas.map((o) => o.cursoId)).size !== escolhidas.length)
    throw new ErroModalidades("MODALIDADE_DUPLICADA");
  if (new Set(escolhidas.map((o) => o.poloId)).size !== 1)
    throw new ErroModalidades("POLOS_DIFERENTES");
  if (new Set(escolhidas.map((o) => o.periodoLetivo || "")).size !== 1)
    throw new ErroModalidades("PERIODOS_DIFERENTES");
  const requisitosCursos = await validarRequisitosCursos(db, instituicaoId, {
    alunoId, cursoIds: escolhidas.map(o => o.cursoId!), periodoLetivo: escolhidas[0].periodoLetivo,
    inicio: inicioCurso.data,
  });
  if (escolhidas.some((o) => o.horariosPendentes))
    throw new ErroModalidades("HORARIOS_INCOMPLETOS", 409);
  if (escolhidas.some((o) => o.vagas !== null && o.vagas <= 0))
    throw new ErroModalidades("TURMA_SEM_VAGAS", 409);
  const existentes = await horariosAtuaisAluno(db, instituicaoId, alunoId);
  if (escolhidas.some((o) => existentes.itens.some((i) => i.turmaId === o.id)))
    throw new ErroModalidades("ALUNO_JA_MATRICULADO", 409);
  const novasDisciplinas = escolhidas.flatMap(o => o.disciplinaIds.map(disciplinaId => ({ disciplinaId, incluida: false,
    inicio: [civil(o.dataInicio ? new Date(o.dataInicio) : null), civil(inicioCurso.data || null)].filter(Boolean).sort().pop() || null,
    fim: civil(o.dataFim ? new Date(o.dataFim) : null) })));
  const existentesDisciplinas = existentes.itens.flatMap(i => {
    const periodos = i.matricula.organizacaoCurricular === "LIVRE" ? i.matricula.periodosCursoLivre : [{ dataInicio: i.matricula.dataInicioCurso || i.turma.dataInicio, dataFim: i.turma.dataFim }];
    return periodos.map(p => ({ disciplinaId: i.disciplinaId, incluida: Boolean(i.matricula.regrasSelecaoDisciplinas), inicio: civil(p.dataInicio), fim: civil(p.dataFim) }));
  });
  if (temDisciplinaIncluidaDuplicada(novasDisciplinas, existentesDisciplinas)) throw new ErroModalidades("ALUNO_JA_MATRICULADO", 409);
  const adaptarInicio = (horarios: HorarioModalidade[]) =>
    horarios.map((h) => ({
      ...h,
      dataInicio:
        [h.dataInicio, civil(inicioCurso.data || null)]
          .filter(Boolean)
          .sort()
          .pop() || null,
    }));
  const horarios = adaptarInicio(escolhidas.flatMap((o) => o.horarios));
  if (horarios.some((h) => !horarioValido(h)))
    throw new ErroModalidades("DATA_INVALIDA");
  const conflitos = encontrarConflitos(horarios, existentes.horarios);
  if (conflitos.length) {
    const cursosComConflito = escolhidas.filter((o) =>
      conflitos.some(
        (c) => c.primeiro.turmaId === o.id || c.segundo.turmaId === o.id,
      ),
    );
    const alternativas = cursosComConflito.flatMap((atual) =>
      ofertas
        .filter(
          (o) =>
            o.cursoId === atual.cursoId &&
            o.id !== atual.id &&
            o.poloId === atual.poloId &&
            o.periodoLetivo === atual.periodoLetivo &&
            !o.horariosPendentes &&
            (o.vagas === null || o.vagas > 0) &&
            !existentes.itens.some((i) => i.turmaId === o.id) &&
            encontrarConflitos(
              adaptarInicio(
                [...escolhidas.filter((e) => e.id !== atual.id), o].flatMap(
                  (e) => e.horarios,
                ),
              ),
              existentes.horarios,
            ).length === 0,
        )
        .map((o) => ({ substituirTurmaId: atual.id, oferta: o })),
    );
    throw new ErroModalidades("CONFLITO_HORARIO", 409, {
      conflitos,
      alternativas,
    });
  }
  const combos = await db.comboModalidades.findMany({
    where: { instituicaoId, ativo: true },
    include: { cursos: true },
  });
  const calculo = calcularContratacaoModalidades(
    escolhidas.map((o) => o.curso),
    combos.map((c) => ({
      ...c,
      valorMatricula: c.valorMatricula.toString(),
      valorMensalidade: c.valorMensalidade?.toString() ?? null,
      descontoPercentual: c.descontoPercentual?.toString() ?? null,
      cursoIds: c.cursos.map((v) => v.cursoId),
    })),
  );
  const nome = calculo.comboId
    ? calculo.nome
    : escolhidas.map((o) => o.curso.nome).join(" + ");
  const snapshot = {
    ...(principalId !== null ? { cursoPrincipalId: principalId } : {}),
    requisitosCursos,
    versao: 1,
    nome,
    calculo,
    dataInicioCurso: civil(inicioCurso.data || null),
    ofertas: [...escolhidas]
      .sort((a, b) => a.id - b.id)
      .map((o) => ({
        turmaId: o.id,
        turmaNome: o.nome,
        cursoId: o.cursoId,
        cursoNome: o.curso.nome,
        ...(principalId !== null ? { permiteCursosAdicionais: o.curso.permiteCursosAdicionais, disponivelComoAdicional: o.curso.disponivelComoAdicional } : {}),
        descontoMensalidadePercentual: o.curso.descontoMensalidadePercentual,
        disciplinaIds: o.disciplinaIds,
        horarios: adaptarInicio(o.horarios),
        disciplinas: o.disciplinas,
        periodoLetivo: o.periodoLetivo,
        organizacaoCurricular: o.organizacaoCurricular,
        etapaNumero: o.etapaNumero,
        poloId: o.poloId,
      })),
  };
  const versao = createHash("sha256")
    .update(JSON.stringify(snapshot))
    .digest("hex");
  return {
    aluno,
    escolhidas,
    calculo,
    snapshot,
    versao,
    inicioCurso: inicioCurso.data,
  };
}

export async function confirmarContratacaoModalidades(
  db: Banco,
  user: { id: number; nome: string | null; instituicaoId: number },
  body: Record<string, unknown>,
  request: Request,
) {
  const { aluno, escolhidas, calculo, snapshot, versao, inicioCurso } =
    await prepararContratacaoModalidades(db, user.instituicaoId, body);
  if (body.versao !== versao) throw new ErroModalidades("DADOS_ALTERADOS", 409);
  if (!aluno.dataNascimento)
    throw new ErroModalidades("NASCIMENTO_NAO_INFORMADO");
  const idade = calcularIdade(aluno.dataNascimento);
  if (idade < 0 || idade > 120) throw new ErroModalidades("DATA_INVALIDA");
  const pendencias = idade < 18 ? verificarDadosResponsavel(aluno) : [];
  if (idade < 18 && body.confirmacaoMenorAceita !== true) {
    throw new ErroModalidades("CONFIRMACAO_MENOR_NECESSARIA", 409, {
      idade,
      pendencias,
    });
  }
  const ajuste = body.ajuste as Record<string, unknown> | null;
  let taxa = calculo.matriculaCentavos;
  let mensalidade = calculo.mensalidadeCentavos;
  let parcelas = calculo.quantidadeParcelas;
  let auditoriaAjuste = null;
  if (ajuste !== null && ajuste !== undefined) {
    if (typeof ajuste !== "object" || Array.isArray(ajuste))
      throw new ErroModalidades("AJUSTE_INVALIDO");
    const motivo =
      typeof ajuste.motivo === "string" ? ajuste.motivo.trim() : "";
    if (motivo.length < 3 || motivo.length > 1000)
      throw new ErroModalidades("MOTIVO_AJUSTE_OBRIGATORIO");
    taxa = centavos(ajuste.valorMatricula);
    mensalidade = centavos(ajuste.valorMensalidade);
    parcelas = Number(ajuste.quantidadeParcelas);
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 120)
      throw new ErroModalidades("AJUSTE_INVALIDO");
    auditoriaAjuste = {
      motivo,
      usuarioId: user.id,
      usuarioNome: user.nome,
      em: new Date().toISOString(),
      ip:
        request.headers
          .get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim()
          .slice(0, 100) || null,
      userAgent: request.headers.get("user-agent")?.slice(0, 1000) || null,
      anteriores: {
        matriculaCentavos: calculo.matriculaCentavos,
        mensalidadeCentavos: calculo.mensalidadeCentavos,
        quantidadeParcelas: calculo.quantidadeParcelas,
      },
      novos: {
        matriculaCentavos: taxa,
        mensalidadeCentavos: mensalidade,
        quantidadeParcelas: parcelas,
      },
    };
  }
  const bolsaPercentual = Number(body.bolsaPercentual ?? 0);
  if (!Number.isFinite(bolsaPercentual) || bolsaPercentual < 0 || bolsaPercentual > 100 ||
      Math.abs(Number(bolsaPercentual.toFixed(2)) - bolsaPercentual) > 1e-8)
    throw new ErroModalidades("AJUSTE_INVALIDO");
  const mensalidadeLiquida = Math.round(mensalidade * (100 - bolsaPercentual) / 100);
  const recebidoNoAto = Number(body.valorPagoMatricula ?? 0);
  if (!Number.isFinite(recebidoNoAto) || recebidoNoAto < 0) throw new ErroModalidades("AJUSTE_INVALIDO");
  const formaPagamentoAto = typeof body.formaPagamentoMatricula === "string"
    ? body.formaPagamentoMatricula.trim().slice(0,80) : "";
  if (recebidoNoAto > 0 && !formaPagamentoAto) throw new ErroModalidades("AJUSTE_INVALIDO");
  const vencimento = String(body.primeiroVencimento || "");
  const primeiroVencimento = vencimentoMensal(vencimento, 0);
  const situacao = body.status === "A_INICIAR" ? "A_INICIAR" : "ATIVA";
  const agora = new Date();
  const instituicao = await db.instituicao.update({
    where: { id: user.instituicaoId },
    data: { proximoNumeroMatricula: { increment: 1 } },
    select: { proximoNumeroMatricula: true },
  });
  const numeroMatricula = `PHX-${user.instituicaoId}-${agora.getUTCFullYear()}-${String(instituicao.proximoNumeroMatricula - 1).padStart(6, "0")}`;
  const principalId = idCursoPrincipal(body.cursoPrincipalId);
  const principal = principalId !== null ? escolhidas.find(o => o.cursoId === principalId)! : escolhidas[0];
  const disciplinas = escolhidas.flatMap((o) => o.disciplinas);
  if (new Set(disciplinas.map((d) => d.id)).size !== disciplinas.length)
    throw new ErroModalidades("DISCIPLINA_DUPLICADA");
  const matricula = await db.matricula.create({
    data: {
      instituicaoId: user.instituicaoId,
      alunoId: aluno.id,
      poloId: escolhidas[0].poloId,
      cursoId: principalId,
      ...(principalId !== null ? { organizacaoCurricular: principal.organizacaoCurricular, etapaNumero: principal.etapaNumero } : {}),
      turmaPrincipalId: principal.id,
      numeroMatricula,
      status: situacao,
      confirmadaEm: agora,
      dataInicioCurso: inicioCurso,
      periodoLetivo: escolhidas[0].periodoLetivo,
      comboId: calculo.comboId,
      tipoContratacao: "PARCIAL",
      modalidade: "MODALIDADES",
      contratacaoModalidades: {
        ...snapshot,
        versaoCalculo: versao,
        pedidoHash: body.pedidoHash,
        ajuste: auditoriaAjuste,
        finais: {
          matriculaCentavos: taxa,
          mensalidadeCentavos: mensalidadeLiquida,
          quantidadeParcelas: parcelas,
        },
        registradoPorId: user.id,
        registradoEm: agora.toISOString(),
      } as unknown as Prisma.InputJsonValue,
      chaveContratacaoModalidades: String(body.chave),
      valorMatricula: taxa / 100,
      valorMensalidade: mensalidade / 100,
      bolsaPercentual,
      quantidadeMensalidades: parcelas,
      primeiroVencimento,
      alunoMenorNoMomentoMatricula: idade < 18,
      idadeNoMomentoMatricula: idade,
      responsavelIncompletoNoMomentoMatricula: pendencias.length > 0,
      confirmacaoMenorEm: idade < 18 ? agora : null,
      confirmacaoMenorPorUserId: idade < 18 ? user.id : null,
      confirmacaoMenorPorNomeSnapshot: idade < 18 ? user.nome : null,
      textoConfirmacaoMenor:
        idade < 18
          ? `Confirmação de matrícula do menor (${idade} anos) por ${user.nome || user.id}. Pendências: ${pendencias.join(", ") || "nenhuma"}.`
          : null,
      itens: {
        create: escolhidas.flatMap((o) =>
          o.disciplinaIds.map((disciplinaId) => ({
            instituicaoId: user.instituicaoId,
            turmaId: o.id,
            disciplinaId,
            tipoItem: "GRADE_PRINCIPAL",
            status: situacao === "ATIVA" ? "EM_CURSO" : "A_CURSAR",
          })),
        ),
      },
      disciplinasContratadas: {
        create: disciplinas.map((d, ordemSnapshot) => ({
          instituicaoId: user.instituicaoId,
          disciplinaId: d.id,
          disciplinaNomeSnapshot: d.nome,
          cargaHorariaSnapshot: d.cargaHoraria,
          semestreNumeroSnapshot: d.semestre,
          ordemSnapshot,
        })),
      },
    },
    select: {
      id: true,
      numeroMatricula: true,
      valorMatricula: true,
      valorMensalidade: true,
    },
  });
  if (!aluno.poloId)
    await db.aluno.update({
      where: { id: aluno.id },
      data: { poloId: escolhidas[0].poloId },
    });
  const base = {
    instituicaoId: user.instituicaoId,
    alunoId: aluno.id,
    matriculaId: matricula.id,
    poloId: escolhidas[0].poloId,
    status: "PENDENTE" as const,
    valorPago: 0,
  };
  if (taxa > 0)
    await db.lancamentoFinanceiro.create({
      data: {
        ...base,
        tipo: "MATRICULA",
        descricao: `Taxa de matrícula - ${snapshot.nome}`,
        vencimento: primeiroVencimento,
        valorOriginal: taxa / 100,
        valorFinal: taxa / 100,
        observacao: recebidoNoAto > 0
          ? "Pagamento informado no ato: " + formaPagamentoAto + ". A baixa ocorrerá exclusivamente no Caixa."
          : "Gerado na contratação conjunta. A baixa ocorrerá exclusivamente no Caixa.",
      },
    });
  if (mensalidadeLiquida > 0)
    await db.lancamentoFinanceiro.createMany({
      data: Array.from({ length: parcelas }, (_, i) => ({
        ...base,
        tipo: "MENSALIDADE",
        descricao: `${snapshot.nome} - ${i + 1}/${parcelas}`,
        vencimento: vencimentoMensal(vencimento, i),
        valorOriginal: mensalidade / 100,
        valorFinal: mensalidadeLiquida / 100,
      })),
    });
  const contrato = await criarContratoPendenteMatricula({
    db,
    matriculaId: matricula.id,
    instituicaoId: user.instituicaoId,
  });
  await db.documentoAluno.create({
    data: {
      instituicaoId: user.instituicaoId,
      alunoId: aluno.id,
      matriculaId: matricula.id,
      tipo: "CONTRATO",
      titulo: `Contrato de matrícula - ${snapshot.nome}`,
      conteudo: contrato.conteudo,
    },
  });
  return matricula;
}
