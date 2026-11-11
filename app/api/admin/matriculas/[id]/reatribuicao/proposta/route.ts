import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prepararContratacaoModalidades } from "@/lib/matriculas/modalidades-servidor";
import { prisma } from "@/lib/prisma";
import {
  ErroPropostaReatribuicao,
  conferirOrigemProposta,
  validarEntradaProposta,
} from "@/lib/matriculas/reatribuicao-proposta";

type Contexto = { params: { id: string } };

/**
 * PREVIA: somente leitura; SALVAR: grava um PLANO na transferência PENDENTE.
 * Nenhuma das ações substitui o aluno da matrícula, reserva vagas, muda
 * responsáveis financeiros, gera contrato, boleto ou lançamento.
 */
export async function POST(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = Number(params.id);
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0) {
      throw new ErroPropostaReatribuicao("MATRICULA_INVALIDA", 400, "Matrícula inválida.");
    }
    const entrada: unknown = await request.json().catch(() => null);
    const proposta = validarEntradaProposta(entrada);

    const resultado = await prisma.$transaction(async tx => {
      if (proposta.acao === "SALVAR") {
        // Mesmo ordenamento de locks do registro inicial (Matricula antes da Transferencia).
        await tx.$queryRaw`SELECT "id" FROM "Matricula"
          WHERE "id" = ${matriculaId} AND "instituicaoId" = ${instituicaoId}
            AND "excluidaEm" IS NULL FOR UPDATE`;
        await tx.$queryRaw`SELECT "id" FROM "TransferenciaMatricula"
          WHERE "id" = ${proposta.transferenciaId} AND "matriculaId" = ${matriculaId}
            AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
      }
      const [matricula, transferencia] = await Promise.all([
        tx.matricula.findFirst({
          where: { id: matriculaId, instituicaoId, excluidaEm: null },
          select: { alunoId: true, status: true, canceladaEm: true, updatedAt: true },
        }),
        tx.transferenciaMatricula.findFirst({
          where: { id: proposta.transferenciaId, instituicaoId, matriculaId },
          select: {
            id: true, tipo: true, status: true,
            alunoOrigemId: true, alunoDestinoId: true,
            dataTransferencia: true, snapshotAnterior: true, snapshotPosterior: true,
          },
        }),
      ]);
      if (!matricula || !transferencia) {
        throw new ErroPropostaReatribuicao("SOLICITACAO_NAO_ENCONTRADA", 404,
          "Solicitação ou matrícula não encontrada nesta instituição.");
      }
      const alunoId = conferirOrigemProposta(transferencia, matricula, proposta.dataInicioCurso);

      // Reutiliza exatamente o validador de ofertas, capacidade, horários,
      // dependências, optativas e cálculo empregado nas matrículas novas.
      const preparado = await prepararContratacaoModalidades(tx, instituicaoId, {
        alunoId,
        turmaIds: proposta.turmaIds,
        optativaSessaoIds: proposta.optativaSessaoIds,
        dataInicioCurso: proposta.dataInicioCurso,
        ...(proposta.cursoPrincipalId ? { cursoPrincipalId: proposta.cursoPrincipalId } : {}),
      });

      if (proposta.acao === "SALVAR" && proposta.versao !== preparado.versao) {
        throw new ErroPropostaReatribuicao("PREVIA_DESATUALIZADA", 409,
          "Vagas, horários ou valores mudaram. Gere outra prévia antes de salvar.");
      }
      if (proposta.acao === "SALVAR") {
        // Retém resumos das versões anteriores do plano para auditoria.
        // A solicitação mantém status PENDENTE e nunca vira execução por esta rota.
        const anterior = transferencia.snapshotPosterior;
        const anteriorObj = anterior && typeof anterior === "object" && !Array.isArray(anterior)
          ? anterior as Record<string, unknown> : null;
        const revisoesAntigas = Array.isArray(anteriorObj?.revisoesAnteriores)
          ? anteriorObj.revisoesAnteriores.slice(-18) : [];
        const revisoesAnteriores = anteriorObj?.finalidade === "PLANO_ACADEMICO_SEM_EXECUCAO"
          ? [...revisoesAntigas, {
              registradoEm: anteriorObj.registradoEm || null,
              registradoPorId: anteriorObj.registradoPorId || null,
              turmaIds: anteriorObj.turmaIds || [],
              optativaSessaoIds: anteriorObj.optativaSessaoIds || [],
              cursoPrincipalId: anteriorObj.cursoPrincipalId || null,
              versaoOfertas: anteriorObj.versaoOfertas || null,
            }] : [];
        const plano = {
          revisoesAnteriores,
          versao: 1,
          finalidade: "PLANO_ACADEMICO_SEM_EXECUCAO",
          matriculaOrigemId: matriculaId,
          alunoOrigemId: matricula.alunoId,
          alunoDestinoId: alunoId,
          dataInicioCurso: proposta.dataInicioCurso,
          turmaIds: proposta.turmaIds,
          optativaSessaoIds: proposta.optativaSessaoIds,
          cursoPrincipalId: proposta.cursoPrincipalId,
          versaoOfertas: preparado.versao,
          snapshotModalidades: preparado.snapshot,
          calculo: preparado.calculo,
          registradoEm: new Date().toISOString(),
          registradoPorId: usuario.id,
        };
        await tx.transferenciaMatricula.update({
          where: { id: transferencia.id },
          data: { snapshotPosterior: JSON.parse(JSON.stringify(plano)) as Prisma.InputJsonValue },
        });
      }
      return {
        transferenciaId: transferencia.id,
        alunoDestinoId: alunoId,
        turmaIds: proposta.turmaIds,
        optativaSessaoIds: proposta.optativaSessaoIds,
        cursoPrincipalId: proposta.cursoPrincipalId,
        dataInicioCurso: proposta.dataInicioCurso,
        versao: preparado.versao,
        nome: preparado.snapshot.nome,
        calculo: preparado.calculo,
        ofertas: preparado.snapshot.ofertas.map(item => ({
          turmaId: item.turmaId, turmaNome: item.turmaNome,
          cursoId: item.cursoId, cursoNome: item.cursoNome,
        })),
      };
    }, {
      isolationLevel: proposta.acao === "SALVAR"
        ? Prisma.TransactionIsolationLevel.Serializable
        : Prisma.TransactionIsolationLevel.RepeatableRead,
      maxWait: 5000,
      timeout: 30000,
    });

    return NextResponse.json({
      modo: proposta.acao === "SALVAR" ? "PLANO_ACADEMICO_REGISTRADO_SEM_EXECUCAO" : "PREVIA_ACADEMICA_SEM_EXECUCAO",
      proposta: resultado,
      mensagem: proposta.acao === "SALVAR"
        ? "Plano acadêmico registrado para conferência. A matrícula e o financeiro permanecem inalterados."
        : "Prévia validada. Nenhuma vaga foi reservada e nenhum dado foi alterado.",
      podeConfirmarTransferenciaNestaEtapa: false,
    });
  } catch (erro) {
    if (erro instanceof ErroPropostaReatribuicao) {
      return NextResponse.json({ codigo: erro.codigo, error: erro.message }, { status: erro.status });
    }
    return erroCombos(erro);
  }
}
