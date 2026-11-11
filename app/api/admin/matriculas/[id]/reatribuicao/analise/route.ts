import { NextResponse } from "next/server";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prisma } from "@/lib/prisma";
import { montarPreviaFinanceira } from "@/lib/matriculas/reatribuicao-previa-financeira";

// Etapa somente de leitura: não realiza transferência, baixa, cobrança ou alteração cadastral.
type Contexto = { params: { id: string } };

function resumirPlano(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const plano = valor as Record<string, unknown>;
  if (plano.finalidade !== "PLANO_ACADEMICO_SEM_EXECUCAO" ||
      !Array.isArray(plano.turmaIds) || !Array.isArray(plano.optativaSessaoIds) ||
      typeof plano.dataInicioCurso !== "string") return null;
  const snapshot = plano.snapshotModalidades;
  const modalidades = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? (snapshot as Record<string, unknown>) : null;
  return {
    turmaIds: plano.turmaIds,
    optativaSessaoIds: plano.optativaSessaoIds,
    cursoPrincipalId: typeof plano.cursoPrincipalId === "number" ? plano.cursoPrincipalId : null,
    dataInicioCurso: plano.dataInicioCurso,
    registradoEm: typeof plano.registradoEm === "string" ? plano.registradoEm : null,
    nome: typeof modalidades?.nome === "string" ? modalidades.nome : "Proposta acadêmica",
  };
}

function inteiroPositivo(valor: unknown): number | null {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

export async function GET(request: Request, { params }: Contexto) {
  try {
    const { instituicaoId } = await administradorCombos();
    const matriculaId = inteiroPositivo(params.id);
    if (!matriculaId) {
      return NextResponse.json({ error: "Matrícula inválida." }, { status: 400 });
    }

    const url = new URL(request.url);
    const destinoInformado = url.searchParams.get("alunoDestinoId");
    const alunoDestinoId = destinoInformado === null ? null : inteiroPositivo(destinoInformado);
    if (destinoInformado !== null && !alunoDestinoId) {
      return NextResponse.json({ error: "Selecione um aluno de destino válido." }, { status: 400 });
    }

    const matricula = await prisma.matricula.findFirst({
      where: { id: matriculaId, instituicaoId, excluidaEm: null },
      select: {
        id: true,
        numeroMatricula: true,
        status: true,
        alunoId: true,
        canceladaEm: true,
        dataInicioCurso: true,
        periodoLetivo: true,
        curso: { select: { id: true, nome: true } },
        turmaPrincipal: { select: { id: true, nome: true } },
        aluno: { select: { id: true, nome: true, nomeSocial: true } },
      },
    });
    if (!matricula) {
      return NextResponse.json({ error: "Matrícula não encontrada nesta instituição." }, { status: 404 });
    }
    if (alunoDestinoId === matricula.alunoId) {
      return NextResponse.json({ error: "O destino deve ser um aluno diferente do aluno atual." }, { status: 400 });
    }

    const [alunoDestino, itens, turmasAvulsas, lancamentos, cobrancas, contratos,
      optativas, presencasOptativas, documentos, transferenciasPendentes] = await Promise.all([
      alunoDestinoId
        ? prisma.aluno.findFirst({
            where: { id: alunoDestinoId, instituicaoId },
            select: { id: true, nome: true, nomeSocial: true, dataNascimento: true, ativo: true },
          })
        : Promise.resolve(null),
      prisma.itemMatricula.findMany({
        where: { instituicaoId, matriculaId },
        select: { turmaId: true, disciplinaId: true, status: true },
      }),
      prisma.matriculaTurmaAvulsa.findMany({
        where: { instituicaoId, matriculaId },
        select: { turmaId: true, cursoId: true, status: true },
      }),
      prisma.lancamentoFinanceiro.findMany({
        where: { instituicaoId, matriculaId },
        select: {
          id: true, alunoId: true, status: true, valorOriginal: true, valorPago: true,
          vencimento: true, pagoEm: true,
          _count: { select: { pagamentos: true, movimentosCaixa: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.cobrancaFinanceira.findMany({
        where: { instituicaoId, OR: [{ matriculaId }, { lancamentoFinanceiro: { matriculaId } }] },
        select: {
          id: true, alunoId: true, lancamentoFinanceiroId: true,
          statusBancario: true, statusOperacional: true, valorCobrado: true,
          vencimento: true, cobrancaExternaId: true, pagoEm: true, compensadoEm: true,
        },
        orderBy: { id: "asc" },
      }),
      prisma.contrato.findMany({
        where: { instituicaoId, matriculaId },
        select: { id: true, status: true, dataAssinatura: true },
        orderBy: { id: "asc" },
      }),
      prisma.matriculaOptativaAvulsa.count({
        where: { instituicaoId, vinculo: { matriculaId } },
      }),
      prisma.presencaOptativaAvulsa.count({
        where: { instituicaoId, matriculaOptativa: { vinculo: { matriculaId } } },
      }),
      prisma.documentoGerado.count({ where: { instituicaoId, matriculaId } }),
      prisma.transferenciaMatricula.count({
        where: { instituicaoId, matriculaId, status: {
          in: ["PENDENTE", "AGUARDANDO_ACEITE_DESTINO", "ACEITA_DESTINO"],
        } },
      }),
    ]);

    if (alunoDestinoId && !alunoDestino) {
      return NextResponse.json({ error: "Aluno de destino não encontrado nesta instituição." }, { status: 404 });
    }

    const solicitacaoPendente = await prisma.transferenciaMatricula.findFirst({
      where: { instituicaoId, matriculaId, status: {
        in: ["PENDENTE", "AGUARDANDO_ACEITE_DESTINO", "ACEITA_DESTINO"],
      } },
      select: {
        id: true, tipo: true, status: true, motivo: true,
        alunoOrigemNomeSnapshot: true, alunoDestinoNomeSnapshot: true, alunoDestinoId: true,
        dataTransferencia: true, createdAt: true, snapshotPosterior: true,
      },
      orderBy: { id: "desc" },
    });

    const turmaIds = [...new Set([
      ...itens.map(item => item.turmaId),
      ...turmasAvulsas.map(item => item.turmaId),
    ])];

    // Notas e presenças estão ligadas ao aluno, e não exclusivamente à matrícula.
    // Estes números são indicadores de revisão, NÃO uma atribuição automática.
    const [presencasEmTurmas, notasEmTurmas] = turmaIds.length
      ? await Promise.all([
          prisma.presencaAula.count({
            where: { instituicaoId, alunoId: matricula.alunoId, aula: { turmaId: { in: turmaIds } } },
          }),
          prisma.nota.count({
            where: { instituicaoId, alunoId: matricula.alunoId, turmaId: { in: turmaIds } },
          }),
        ])
      : [0, 0];

    const previaFinanceira = montarPreviaFinanceira(
      matricula.alunoId,
      lancamentos.map(item => ({
        id: item.id, alunoId: item.alunoId, status: item.status,
        valorPago: item.valorPago, pagoEm: item.pagoEm,
        pagamentosRegistrados: item._count.pagamentos,
        movimentosCaixaRegistrados: item._count.movimentosCaixa,
      })),
      cobrancas.map(item => ({
        id: item.id, alunoId: item.alunoId,
        lancamentoFinanceiroId: item.lancamentoFinanceiroId,
      })),
    );
    const alertas: string[] = [];
    if (matricula.canceladaEm) alertas.push("A matrícula está cancelada. Será necessário revisar sua situação antes de reatribuir.");
    if (transferenciasPendentes) alertas.push("Há transferência pendente para esta matrícula.");
    if (presencasEmTurmas || notasEmTurmas || presencasOptativas) {
      alertas.push("Existem registros acadêmicos do aluno original. Eles não podem ser transferidos para outra pessoa.");
    }
    if (contratos.length || documentos) {
      alertas.push("Existem contratos ou documentos vinculados. Devem permanecer preservados e a documentação do novo aluno precisa ser revisada.");
    }
    if (lancamentos.length || cobrancas.length) {
      alertas.push("Existem lançamentos ou cobranças vinculados. Pagamentos e títulos emitidos não devem ser reatribuídos automaticamente.");
    }

    return NextResponse.json({
      modo: "ANALISE_SOMENTE_LEITURA",
      matricula,
      alunoDestino,
      academico: {
        itens: itens.length,
        turmasAvulsas: turmasAvulsas.length,
        optativas,
        presencasOptativas,
        presencasEmTurmas,
        notasEmTurmas,
        observacao: "Notas e presenças em turmas são registros do aluno original, possivelmente abrangendo outras matrículas dele.",
      },
      financeiro: {
        previaFinanceira,
        lancamentos: lancamentos.map(item => ({
          id: item.id, alunoId: item.alunoId, status: item.status, valorOriginal: item.valorOriginal,
          valorPago: item.valorPago, vencimento: item.vencimento,
        })),
        cobrancas: cobrancas.map(item => ({
          id: item.id, alunoId: item.alunoId, lancamentoFinanceiroId: item.lancamentoFinanceiroId,
          statusBancario: item.statusBancario,
          statusOperacional: item.statusOperacional,
          valorCobrado: item.valorCobrado, vencimento: item.vencimento,
        })),
      },
      contratos: contratos.map(item => ({ id: item.id, status: item.status, dataAssinatura: item.dataAssinatura })),
      documentos,
      transferenciasPendentes,
      solicitacaoPendente: solicitacaoPendente ? {
        id: solicitacaoPendente.id,
        tipo: solicitacaoPendente.tipo,
        status: solicitacaoPendente.status,
        motivo: solicitacaoPendente.motivo,
        alunoOrigemNomeSnapshot: solicitacaoPendente.alunoOrigemNomeSnapshot,
        alunoDestinoNomeSnapshot: solicitacaoPendente.alunoDestinoNomeSnapshot,
        alunoDestinoId: solicitacaoPendente.alunoDestinoId,
        dataTransferencia: solicitacaoPendente.dataTransferencia,
        createdAt: solicitacaoPendente.createdAt,
        propostaAcademica: solicitacaoPendente.tipo === "REATRIBUICAO_ALUNO"
          ? resumirPlano(solicitacaoPendente.snapshotPosterior) : null,
      } : null,
      alertas,
      podeConfirmarNestaEtapa: false,
    });
  } catch (erro) {
    return erroCombos(erro);
  }
}
