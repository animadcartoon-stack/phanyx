import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prisma } from "@/lib/prisma";
import { classificarLancamentosReatribuicao, estrategiaIntegridadeReatribuicao } from "@/lib/matriculas/reatribuicao-dossie";

type Contexto = { params: { id: string } };

/**
 * Inventário detalhado somente de leitura. Não tem POST/PATCH/DELETE.
 * Não efetiva reatribuição, movimenta financeiro ou emite contratos.
 */
export async function GET(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = Number(params.id);
    const transferenciaId = Number(new URL(request.url).searchParams.get("transferenciaId"));
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0 ||
        !Number.isSafeInteger(transferenciaId) || transferenciaId <= 0) {
      return NextResponse.json({ codigo: "IDENTIFICADORES_INVALIDOS", error: "Matrícula e solicitação inválidas." }, { status: 400 });
    }

    const dossie = await prisma.$transaction(async tx => {
      const matricula = await tx.matricula.findFirst({
        where: { id: matriculaId, instituicaoId, excluidaEm: null },
        select: { id: true, numeroMatricula: true, status: true, alunoId: true, updatedAt: true,
          aluno: { select: { id: true, nome: true, nomeSocial: true } } },
      });
      const transferencia = await tx.transferenciaMatricula.findFirst({
        where: { id: transferenciaId, matriculaId, instituicaoId },
        select: { id: true, tipo: true, status: true, dataTransferencia: true,
          alunoOrigemId: true, alunoOrigemNomeSnapshot: true,
          alunoDestinoId: true, alunoDestinoNomeSnapshot: true,
          snapshotAnterior: true, snapshotPosterior: true },
      });
      if (!matricula || !transferencia) return null;
      if (transferencia.tipo !== "REATRIBUICAO_ALUNO" || transferencia.status !== "PENDENTE" ||
          transferencia.alunoOrigemId !== matricula.alunoId || !transferencia.alunoDestinoId ||
          transferencia.alunoDestinoId === matricula.alunoId) {
        return { erro: "A solicitação não está pendente ou os alunos não conferem." };
      }
      const [destino, lancamentos, cobrancas, contratos, documentosGerados, documentosAluno, itens, avulsos] = await Promise.all([
        tx.aluno.findFirst({ where: { id: transferencia.alunoDestinoId, instituicaoId },
          select: { id: true, nome: true, nomeSocial: true, ativo: true } }),
        tx.lancamentoFinanceiro.findMany({ where: { instituicaoId, matriculaId }, orderBy: { id: "asc" },
          select: { id: true, alunoId: true, tipo: true, status: true, valorOriginal: true,
            valorPago: true, valorFinal: true, vencimento: true, pagoEm: true,
            _count: { select: { pagamentos: true, movimentosCaixa: true } } } }),
        tx.cobrancaFinanceira.findMany({ where: { instituicaoId, OR: [
          { matriculaId }, { lancamentoFinanceiro: { matriculaId } },
        ] }, orderBy: { id: "asc" },
          select: { id: true, alunoId: true, matriculaId: true, lancamentoFinanceiroId: true,
            statusBancario: true, statusOperacional: true, cobrancaExternaId: true,
            clienteExternoId: true, pagoEm: true, compensadoEm: true, baixadoEm: true } }),
        tx.contrato.findMany({ where: { instituicaoId, matriculaId }, orderBy: { id: "asc" },
          select: { id: true, alunoId: true, status: true, dataAssinatura: true } }),
        tx.documentoGerado.findMany({ where: { instituicaoId, matriculaId }, orderBy: { id: "asc" },
          select: { id: true, alunoId: true, status: true, tipo: true, assinadoEm: true } }),
        tx.documentoAluno.findMany({ where: { instituicaoId, matriculaId }, orderBy: { id: "asc" },
          select: { id: true, alunoId: true, titulo: true, arquivado: true } }),
        tx.itemMatricula.count({ where: { instituicaoId, matriculaId } }),
        tx.matriculaTurmaAvulsa.count({ where: { instituicaoId, matriculaId } }),
      ]);
      const financeiro = classificarLancamentosReatribuicao(
        matricula.alunoId,
        lancamentos.map(item => ({
          ...item, pagamentosRegistrados: item._count.pagamentos,
          movimentosCaixaRegistrados: item._count.movimentosCaixa,
        })),
        cobrancas,
      );
      const estrategia = estrategiaIntegridadeReatribuicao({
        numeroMatricula: matricula.numeroMatricula,
        origemAtualizadaEm: matricula.updatedAt,
        snapshotAnterior: transferencia.snapshotAnterior,
        alunoOrigemId: matricula.alunoId, matriculaId,
        quantidadeItens: itens, quantidadeTurmasAvulsas: avulsos,
        quantidadeContratos: contratos.length,
        quantidadeDocumentos: documentosGerados.length + documentosAluno.length,
        quantidadeLancamentos: lancamentos.length,
      });
      return {
        modo: "DOSSIE_SEM_EXECUCAO" as const,
        matricula: { id: matricula.id, numeroMatricula: matricula.numeroMatricula, status: matricula.status },
        origem: { id: matricula.aluno.id, nome: matricula.aluno.nomeSocial || matricula.aluno.nome },
        destino: destino ? { id: destino.id, nome: destino.nomeSocial || destino.nome, ativo: destino.ativo } : null,
        transferencia: { id: transferencia.id, status: transferencia.status,
          dataTransferencia: transferencia.dataTransferencia },
        possuiProposta: Boolean(transferencia.snapshotPosterior &&
          typeof transferencia.snapshotPosterior === "object" &&
          !Array.isArray(transferencia.snapshotPosterior) &&
          (transferencia.snapshotPosterior as Record<string, unknown>).finalidade === "PLANO_ACADEMICO_SEM_EXECUCAO"),
        estrategia,
        financeiro,
        contratos: contratos.map(c => ({ ...c, preservarOrigem: true })),
        documentosGerados: documentosGerados.map(d => ({ ...d, preservarOrigem: true })),
        documentosAluno: documentosAluno.map(d => ({ ...d, preservarOrigem: true })),
        itensAcademicos: itens,
        vinculosTurmasAvulsas: avulsos,
        mensagem: "Dossiê de conferência. Não autoriza mover títulos, contratos, histórico ou número de matrícula.",
        podeExecutarTransferencia: false as const,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 });
    if (!dossie) return NextResponse.json({ codigo: "SOLICITACAO_NAO_ENCONTRADA", error: "Solicitação não encontrada." }, { status: 404 });
    if ("erro" in dossie) return NextResponse.json({ codigo: "SOLICITACAO_INCONSISTENTE", error: dossie.erro }, { status: 409 });
    return NextResponse.json(dossie, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    return erroCombos(erro);
  }
}
