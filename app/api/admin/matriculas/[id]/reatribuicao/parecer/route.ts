import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prepararContratacaoModalidades } from "@/lib/matriculas/modalidades-servidor";
import { prisma } from "@/lib/prisma";
import { montarParecerReatribuicao } from "@/lib/matriculas/reatribuicao-parecer";
import { validarEntradaProposta } from "@/lib/matriculas/reatribuicao-proposta";

type Contexto = { params: { id: string } };

/**
 * Parecer de segurança SOMENTE LEITURA. Propositadamente não existe POST/PATCH.
 * Nunca confundir este GET com autorização para trocar Matricula.alunoId.
 */
export async function GET(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = Number(params.id);
    const transferenciaId = Number(new URL(request.url).searchParams.get("transferenciaId"));
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0 ||
        !Number.isSafeInteger(transferenciaId) || transferenciaId <= 0) {
      return NextResponse.json({ codigo: "IDENTIFICADORES_INVALIDOS", error: "Informe matrícula e solicitação válidas." }, { status: 400 });
    }

    const resultado = await prisma.$transaction(async tx => {
      const [matricula, transferencia] = await Promise.all([
        tx.matricula.findFirst({
          where: { id: matriculaId, instituicaoId, excluidaEm: null },
          select: {
            id: true, numeroMatricula: true, alunoId: true, status: true,
            canceladaEm: true, updatedAt: true, dataInicioCurso: true,
          },
        }),
        tx.transferenciaMatricula.findFirst({
          where: { id: transferenciaId, matriculaId, instituicaoId },
          select: {
            id: true, tipo: true, status: true, alunoOrigemId: true,
            alunoDestinoId: true, snapshotAnterior: true, snapshotPosterior: true,
          },
        }),
      ]);
      if (!matricula || !transferencia) return null;
      const alunoDestinoId = transferencia.alunoDestinoId;
      const destino = alunoDestinoId ? await tx.aluno.findFirst({
        where: { id: alunoDestinoId, instituicaoId },
        select: { id: true, ativo: true, dataNascimento: true, nome: true, nomeSocial: true },
      }) : null;
      const destinoValido = !!destino?.ativo && !!destino.dataNascimento;

      const [itens, avulsos] = await Promise.all([
        tx.itemMatricula.findMany({
          where: { instituicaoId, matriculaId },
          select: { turmaId: true },
        }),
        tx.matriculaTurmaAvulsa.findMany({
          where: { instituicaoId, matriculaId },
          select: { turmaId: true },
        }),
      ]);
      const turmaIds = [...new Set([...itens, ...avulsos].map(v => v.turmaId))];
      const escopo = { instituicaoId, alunoId: matricula.alunoId };
      const emTurmas = { in: turmaIds };

      // Os registros acadêmicos em turmas podem pertencer também a outras matrículas.
      // Por segurança, são contados como sinais de revisão (nunca movidos).
      const [presencas, notas, presencasOptativas, resultados, progresso,
        sessoesVideo, eventosAprendizagem, entregas,
        lancamentos, cobrancas, contratos, documentosGerados,
        documentosAluno, trancamentos, cancelamentos, rematriculas, periodosCursoLivre] = await Promise.all([
        turmaIds.length ? tx.presencaAula.count({ where: { ...escopo, aula: { turmaId: emTurmas } } }) : 0,
        turmaIds.length ? tx.nota.count({ where: { ...escopo, turmaId: emTurmas } }) : 0,
        tx.presencaOptativaAvulsa.count({ where: { instituicaoId, matriculaOptativa: { vinculo: { matriculaId } } } }),
        turmaIds.length ? tx.resultadoFinal.count({ where: { ...escopo, turmaId: emTurmas } }) : 0,
        turmaIds.length ? tx.progressoAula.count({ where: { ...escopo, aula: { turmaId: emTurmas } } }) : 0,
        turmaIds.length ? tx.sessaoVideoAluno.count({ where: { ...escopo, turmaId: emTurmas } }) : 0,
        turmaIds.length ? tx.eventoAprendizagemAluno.count({ where: { ...escopo, turmaId: emTurmas } }) : 0,
        turmaIds.length ? tx.entregaAtividade.count({ where: { ...escopo, atividade: { turmaId: emTurmas } } }) : 0,
        tx.lancamentoFinanceiro.count({ where: { instituicaoId, matriculaId } }),
        tx.cobrancaFinanceira.count({ where: { instituicaoId, OR: [
          { matriculaId }, { lancamentoFinanceiro: { matriculaId } },
        ] } }),
        tx.contrato.count({ where: { instituicaoId, matriculaId } }),
        tx.documentoGerado.count({ where: { instituicaoId, matriculaId } }),
        tx.documentoAluno.count({ where: { instituicaoId, matriculaId } }),
        tx.trancamentoMatricula.count({ where: { instituicaoId, matriculaId } }),
        tx.cancelamentoMatricula.count({ where: { instituicaoId, matriculaId } }),
        tx.rematriculaSemestral.count({ where: { instituicaoId, OR: [
          { matriculaOrigemId: matriculaId }, { matriculaGeradaId: matriculaId },
        ] } }),
        tx.periodoCursoLivre.count({ where: { instituicaoId, matriculaId } }),
      ]);

      const plano = transferencia.snapshotPosterior;
      const salvo = plano && typeof plano === "object" && !Array.isArray(plano)
        ? plano as Record<string, unknown> : null;
      const planoSalvo = salvo?.finalidade === "PLANO_ACADEMICO_SEM_EXECUCAO";
      const planoConsistente = planoSalvo &&
        salvo?.matriculaOrigemId === matriculaId &&
        salvo?.alunoOrigemId === matricula.alunoId &&
        salvo?.alunoDestinoId === alunoDestinoId &&
        typeof salvo?.versaoOfertas === "string" &&
        /^[a-f0-9]{64}$/i.test(salvo.versaoOfertas);

      let ofertasRevalidadas = false;
      if (planoConsistente && destinoValido) {
        try {
          const entrada = validarEntradaProposta({
            acao: "PREVIA", transferenciaId,
            turmaIds: salvo?.turmaIds,
            optativaSessaoIds: salvo?.optativaSessaoIds,
            cursoPrincipalId: salvo?.cursoPrincipalId,
            dataInicioCurso: salvo?.dataInicioCurso,
          });
          const preparado = await prepararContratacaoModalidades(tx, instituicaoId, {
            alunoId: alunoDestinoId,
            turmaIds: entrada.turmaIds,
            optativaSessaoIds: entrada.optativaSessaoIds,
            dataInicioCurso: entrada.dataInicioCurso,
            ...(entrada.cursoPrincipalId ? { cursoPrincipalId: entrada.cursoPrincipalId } : {}),
          });
          ofertasRevalidadas = preparado.versao === salvo?.versaoOfertas;
        } catch {
          // A oferta mudou ou deixou de ser válida. Parecer explicita o impedimento.
        }
      }

      const parecer = montarParecerReatribuicao({
        matricula, transferencia, destinoValido,
        planoSalvo, planoConsistente: !!planoConsistente, ofertasRevalidadas,
        contagens: {
          presencas, notas, presencasOptativas, resultados,
          progresso, sessoesVideo, eventosAprendizagem, entregas,
          lancamentos, cobrancas, contratos, documentosGerados,
          documentosAluno, trancamentos, cancelamentos, rematriculas,
          periodosCursoLivre,
        },
      });
      return {
        ...parecer,
        matricula: { id: matricula.id, numeroMatricula: matricula.numeroMatricula },
        transferencia: { id: transferencia.id, status: transferencia.status },
        destino: destino ? { id: destino.id, nome: destino.nomeSocial || destino.nome } : null,
        versaoOfertasAtual: ofertasRevalidadas,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 });

    if (!resultado) {
      return NextResponse.json({ codigo: "SOLICITACAO_NAO_ENCONTRADA", error: "Matrícula ou solicitação não encontrada nesta instituição." }, { status: 404 });
    }
    return NextResponse.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    return erroCombos(erro);
  }
}
