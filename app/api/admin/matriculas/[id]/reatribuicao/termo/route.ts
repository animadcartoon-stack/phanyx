import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prisma } from "@/lib/prisma";
import { gerarMinutaReatribuicao } from "@/lib/matriculas/reatribuicao-termo";
import { referenciaPlanoReatribuicao } from "@/lib/matriculas/reatribuicao-vinculo-termo";

type Contexto = { params: { id: string } };

/** Gera somente uma minuta em JSON. Sem escrita, upload ou assinatura automática. */
export async function GET(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = Number(params.id);
    const transferenciaId = Number(new URL(request.url).searchParams.get("transferenciaId"));
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0 ||
        !Number.isSafeInteger(transferenciaId) || transferenciaId <= 0) {
      return NextResponse.json({ codigo: "IDENTIFICADORES_INVALIDOS", error: "Solicitação ou matrícula inválida." }, { status: 400 });
    }
    const resultado = await prisma.$transaction(async tx => {
      const matricula = await tx.matricula.findFirst({
        where: { id: matriculaId, instituicaoId, excluidaEm: null },
        select: {
          id: true, numeroMatricula: true, alunoId: true, status: true, canceladaEm: true,
          updatedAt: true,
          instituicao: { select: { nome: true } },
          aluno: { select: { nome: true, nomeSocial: true, cpf: true, nomeResponsavel: true, cpfResponsavel: true } },
        },
      });
      const transferencia = await tx.transferenciaMatricula.findFirst({
        where: { id: transferenciaId, instituicaoId, matriculaId },
        select: { id: true, tipo: true, status: true, motivo: true, observacoes: true,
          dataTransferencia: true, alunoOrigemId: true, alunoDestinoId: true,
          snapshotAnterior: true, snapshotPosterior: true },
      });
      if (!matricula || !transferencia) return null;
      const anterior = transferencia.snapshotAnterior;
      const antes = anterior && typeof anterior === "object" && !Array.isArray(anterior)
        ? anterior as Record<string, unknown> : null;
      if (matricula.canceladaEm || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status) ||
          transferencia.tipo !== "REATRIBUICAO_ALUNO" || transferencia.status !== "PENDENTE" ||
          transferencia.alunoOrigemId !== matricula.alunoId ||
          !transferencia.alunoDestinoId || transferencia.alunoDestinoId === matricula.alunoId ||
          antes?.finalidade !== "SOLICITACAO_SEM_EXECUCAO" ||
          antes?.matriculaId !== matriculaId || antes?.alunoId !== matricula.alunoId ||
          antes?.atualizadoEm !== matricula.updatedAt.toISOString()) {
        return { erro: "A matrícula ou solicitação foi alterada. Revise o pedido antes de gerar o termo." };
      }
      const plano = transferencia.snapshotPosterior;
      const salvo = plano && typeof plano === "object" && !Array.isArray(plano)
        ? plano as Record<string, unknown> : null;
      if (salvo?.finalidade !== "PLANO_ACADEMICO_SEM_EXECUCAO" ||
          salvo?.matriculaOrigemId !== matriculaId || salvo?.alunoOrigemId !== matricula.alunoId ||
          salvo?.alunoDestinoId !== transferencia.alunoDestinoId ||
          typeof salvo?.dataInicioCurso !== "string" ||
          !Array.isArray(salvo?.turmaIds) || salvo.turmaIds.length === 0) {
        return { erro: "Salve uma proposta acadêmica válida antes de gerar o termo." };
      }
      if (!referenciaPlanoReatribuicao(salvo)) return { erro: "Proposta acadêmica não possui uma versão válida. Salve novamente a proposta." };
      const modalidade = salvo.snapshotModalidades;
      const snapshot = modalidade && typeof modalidade === "object" && !Array.isArray(modalidade)
        ? modalidade as Record<string, unknown> : null;
      const ofertas = snapshot?.ofertas;
      if (!Array.isArray(ofertas) || ofertas.length === 0 || ofertas.length > 24 ||
          ofertas.some(o => !o || typeof o !== "object" || Array.isArray(o) ||
            typeof o.cursoNome !== "string" || typeof o.turmaNome !== "string")) {
        return { erro: "A proposta acadêmica não possui ofertas válidas." };
      }
      const destino = await tx.aluno.findFirst({
        where: { id: transferencia.alunoDestinoId, instituicaoId, ativo: true },
        select: { nome: true, nomeSocial: true, cpf: true, nomeResponsavel: true, cpfResponsavel: true },
      });
      if (!destino) return { erro: "O aluno de destino não está disponível nesta instituição." };
      const [lancamentos, titulos, contratos, documentosGerados, documentosAluno] = await Promise.all([
        tx.lancamentoFinanceiro.findMany({ where: { instituicaoId, matriculaId },
          select: { id: true, status: true, valorPago: true, pagoEm: true, _count: { select: { pagamentos: true } } } }),
        tx.cobrancaFinanceira.findMany({ where: { instituicaoId, OR: [
          { matriculaId }, { lancamentoFinanceiro: { matriculaId } },
        ] }, select: { id: true, cobrancaExternaId: true, clienteExternoId: true } }),
        tx.contrato.count({ where: { instituicaoId, matriculaId } }),
        tx.documentoGerado.count({ where: { instituicaoId, matriculaId } }),
        tx.documentoAluno.count({ where: { instituicaoId, matriculaId } }),
      ]);
      const origem = matricula.aluno;
      return gerarMinutaReatribuicao({
        instituicao: matricula.instituicao.nome,
        numeroMatricula: matricula.numeroMatricula,
        matriculaId,
        transferenciaId,
        referenciaPlano: referenciaPlanoReatribuicao(salvo)!,
        origem: { nome: origem.nomeSocial || origem.nome, cpf: origem.cpf,
          responsavelNome: origem.nomeResponsavel, responsavelCpf: origem.cpfResponsavel },
        destino: { nome: destino.nomeSocial || destino.nome, cpf: destino.cpf,
          responsavelNome: destino.nomeResponsavel, responsavelCpf: destino.cpfResponsavel },
        dataTransferencia: transferencia.dataTransferencia,
        dataInicio: salvo.dataInicioCurso,
        motivo: transferencia.motivo,
        observacoes: transferencia.observacoes,
        ofertas: ofertas.map(o => ({ cursoNome: o.cursoNome as string, turmaNome: o.turmaNome as string })),
        financeiro: {
          lancamentos: lancamentos.length,
          pagosOuParciais: lancamentos.filter(l => l.status === "PAGO" || l.status === "PARCIAL" ||
            Number(l.valorPago ?? 0) > 0 || l.pagoEm !== null || l._count.pagamentos > 0).length,
          titulos: titulos.length,
          titulosExternos: titulos.filter(t => Boolean(t.cobrancaExternaId || t.clienteExternoId)).length,
        },
        contratos,
        documentos: documentosGerados + documentosAluno,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 });

    if (!resultado) return NextResponse.json({ codigo: "SOLICITACAO_NAO_ENCONTRADA", error: "Solicitação não encontrada." }, { status: 404 });
    if ("erro" in resultado) return NextResponse.json({ codigo: "MINUTA_INDISPONIVEL", error: resultado.erro }, { status: 409 });
    return NextResponse.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    return erroCombos(erro);
  }
}
