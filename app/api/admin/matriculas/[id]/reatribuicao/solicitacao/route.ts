import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { prisma } from "@/lib/prisma";
import {
  ErroSolicitacaoReatribuicao,
  STATUS_PENDENTES_REATRIBUICAO,
  validarPropostaReatribuicao,
} from "@/lib/matriculas/reatribuicao-solicitacao";

type Contexto = { params: { id: string } };

/** Registra apenas uma solicitação. NÃO altera alunoId, contrato, lançamentos ou matrícula. */
export async function POST(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = Number(params.id);
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0) {
      throw new ErroSolicitacaoReatribuicao("MATRICULA_INVALIDA", 400, "Matrícula inválida.");
    }
    const entrada: unknown = await request.json().catch(() => null);
    const proposta = validarPropostaReatribuicao(entrada);

    const resultado = await prisma.$transaction(async tx => {
      // Serializa pedidos concorrentes da mesma matrícula, inclusive entre administradores.
      const linhas = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT "id" FROM "Matricula"
        WHERE "id" = ${matriculaId} AND "instituicaoId" = ${instituicaoId}
          AND "excluidaEm" IS NULL
        FOR UPDATE
      `;
      if (!linhas.length) {
        throw new ErroSolicitacaoReatribuicao("MATRICULA_NAO_ENCONTRADA", 404, "Matrícula não encontrada.");
      }
      const matricula = await tx.matricula.findFirst({
        where: { id: matriculaId, instituicaoId, excluidaEm: null },
        select: {
          id: true, alunoId: true, numeroMatricula: true, status: true,
          canceladaEm: true, updatedAt: true, cursoId: true, turmaPrincipalId: true,
          periodoLetivo: true, poloId: true,
          aluno: { select: { id: true, nome: true, nomeSocial: true } },
          curso: { select: { id: true, nome: true } },
          turmaPrincipal: { select: { id: true, nome: true } },
        },
      });
      if (!matricula) throw new ErroSolicitacaoReatribuicao("MATRICULA_NAO_ENCONTRADA", 404, "Matrícula não encontrada.");
      if (matricula.canceladaEm || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status)) {
        throw new ErroSolicitacaoReatribuicao("STATUS_BLOQUEADO", 409,
          "A matrícula precisa estar ativa ou aguardando início para registrar a solicitação.");
      }
      if (matricula.alunoId === proposta.alunoDestinoId) {
        throw new ErroSolicitacaoReatribuicao("MESMO_ALUNO", 400, "Selecione outra pessoa como aluno de destino.");
      }
      const pendente = await tx.transferenciaMatricula.findFirst({
        where: {
          instituicaoId, matriculaId,
          status: { in: [...STATUS_PENDENTES_REATRIBUICAO] },
        },
        select: { id: true },
      });
      if (pendente) {
        throw new ErroSolicitacaoReatribuicao("TRANSFERENCIA_PENDENTE", 409,
          `Já existe uma transferência pendente (#${pendente.id}) para esta matrícula.`);
      }
      const destino = await tx.aluno.findFirst({
        where: { id: proposta.alunoDestinoId, instituicaoId, ativo: true },
        select: { id: true, nome: true, nomeSocial: true },
      });
      if (!destino) {
        throw new ErroSolicitacaoReatribuicao("ALUNO_DESTINO_NAO_ENCONTRADO", 404,
          "Aluno de destino não encontrado ou inativo nesta instituição.");
      }
      const operador = await tx.user.findFirst({
        where: { id: usuario.id, instituicaoId },
        select: { nome: true, email: true },
      });
      const registrado = await tx.transferenciaMatricula.create({
        data: {
          instituicaoId, matriculaId,
          tipo: "REATRIBUICAO_ALUNO", status: "PENDENTE",
          dataTransferencia: proposta.dataTransferencia,
          motivo: proposta.motivo,
          observacoes: proposta.observacoes,
          alunoOrigemId: matricula.alunoId,
          alunoOrigemNomeSnapshot: matricula.aluno.nomeSocial || matricula.aluno.nome,
          alunoDestinoId: destino.id,
          alunoDestinoNomeSnapshot: destino.nomeSocial || destino.nome,
          cursoOrigemId: matricula.cursoId,
          cursoOrigemNomeSnapshot: matricula.curso?.nome ?? null,
          turmaOrigemId: matricula.turmaPrincipalId,
          turmaOrigemNomeSnapshot: matricula.turmaPrincipal?.nome ?? null,
          poloOrigemId: matricula.poloId,
          realizadoPorId: usuario.id,
          realizadoPorNomeSnapshot: operador?.nome?.trim() || operador?.email?.trim() || `User ${usuario.id}`,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
          userAgent: request.headers.get("user-agent"),
          snapshotAnterior: {
            versao: 1,
            finalidade: "SOLICITACAO_SEM_EXECUCAO",
            matriculaId,
            numeroMatricula: matricula.numeroMatricula,
            alunoId: matricula.alunoId,
            status: matricula.status,
            atualizadoEm: matricula.updatedAt.toISOString(),
            cursoId: matricula.cursoId,
            turmaPrincipalId: matricula.turmaPrincipalId,
            poloId: matricula.poloId,
            periodoLetivo: matricula.periodoLetivo,
          },
        },
        select: { id: true, status: true, alunoDestinoId: true, dataTransferencia: true },
      });
      return registrado;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({
      modo: "SOLICITACAO_PENDENTE_SEM_TRANSFERENCIA",
      solicitacao: resultado,
      mensagem: "Solicitação registrada. A matrícula e os vínculos financeiros e acadêmicos continuam inalterados.",
      podeConfirmarNestaEtapa: false,
    }, { status: 201 });
  } catch (erro) {
    if (erro instanceof ErroSolicitacaoReatribuicao) {
      return NextResponse.json({ codigo: erro.codigo, error: erro.message }, { status: erro.status });
    }
    // Mantém o tratamento centralizado de códigos Prisma e erros inesperados.
    return erroCombos(erro);
  }
}
