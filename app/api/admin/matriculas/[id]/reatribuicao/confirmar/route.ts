import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { conferirHashPdf, referenciaPlanoReatribuicao } from "@/lib/matriculas/reatribuicao-vinculo-termo";
import { getR2Client } from "@/lib/storage/r2";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { diaFinanceiro } from "@/lib/financeiro/desconto-pontualidade";
import { prisma } from "@/lib/prisma";
import { origemOfertaVinculada } from "@/lib/matriculas/vagas-ofertas-compartilhadas";
import { bloquearSessoesOptativas } from "@/lib/matriculas/optativas-avulsas-servidor";
import {
  prepararContratacaoModalidades, confirmarContratacaoModalidades,
} from "@/lib/matriculas/modalidades-servidor";
import { ErroPropostaReatribuicao, conferirOrigemProposta, validarEntradaProposta } from "@/lib/matriculas/reatribuicao-proposta";
import {
  ErroExecucaoReatribuicao, conferirDatasExecucao, conferirPlanoExecutavel,
  conferirRestricoesOrigem, execucaoHabilitada, numeroHistorico,
  validarConfirmacaoReatribuicao,
} from "@/lib/matriculas/reatribuicao-execucao";

type Contexto = { params: { id: string } };

const HOST_LAB_REATRIBUICAO_NEON = "ep-ancient-mud-b6ptxf53.c-2.sa-east-1.aws.neon.tech";

function habilitada() {
  return process.env.PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST?.trim().toLowerCase() === HOST_LAB_REATRIBUICAO_NEON &&
    execucaoHabilitada({
    flag: process.env.PHANYX_REATRIBUICAO_EXECUCAO_HABILITADA,
    seloHomologacao: process.env.PHANYX_REATRIBUICAO_AMBIENTE_CONFIRMADO,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    hostAutorizado: process.env.PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST,
  });
}

/** Apenas indica disponibilidade, sem mutação. Production sempre desabilitada. */
export async function GET() {
  try {
    await administradorCombos();
    return NextResponse.json({
      habilitada: habilitada(),
      modalidade: "SUCESSAO_SEM_FINANCEIRO_NA_ORIGEM",
      mensagem: "Execução experimental apenas em homologação isolada e com host Neon autorizado explicitamente. Não substitui conferência de autorizações.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    return erroCombos(erro);
  }
}

/**
 * Confirmação atômica apenas em homologação: cria sucessora usando o mecanismo
 * completo de matrícula, gera SEUS lançamentos internos e contrato PENDENTE,
 * e marca origem TRANSFERIDA; NÃO altera nenhum título, pagamento, contrato,
 * documento ou nota associado à origem.
 */
export async function POST(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    if (!habilitada()) {
      return NextResponse.json({ codigo: "EXECUCAO_DESABILITADA", error: "Execução bloqueada: somente homologação isolada com endpoint Neon explicitamente autorizado." }, { status: 403 });
    }
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = Number(params.id);
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0) {
      throw new ErroExecucaoReatribuicao("MATRICULA_INVALIDA", 400);
    }
    const corpo = await request.json().catch(() => null);
    const entrada = validarConfirmacaoReatribuicao(corpo);
    const documentoId = corpo && typeof corpo === "object" && !Array.isArray(corpo)
      ? (corpo as Record<string, unknown>).documentoTermoAssinadoId : null;
    if (typeof documentoId !== "number" || !Number.isSafeInteger(documentoId) || documentoId <= 0) {
      throw new ErroExecucaoReatribuicao("TERMO_ASSINADO_OBRIGATORIO", 409,
        "Anexe um termo assinado vinculado à solicitação antes de confirmar.");
    }
    const documento = await prisma.transferenciaMatriculaDocumento.findFirst({
      where: {
        id: documentoId, instituicaoId, matriculaId, transferenciaId: entrada.transferenciaId,
        tipo: "TERMO_ASSINADO", status: "VINCULADO", removidoEm: null,
        OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }],
      },
      select: { pathnameBlob: true, mimeType: true, numeroDocumento: true, descricao: true },
    });
    const prefixo = `instituicoes/${instituicaoId}/matriculas/${matriculaId}/reatribuicoes/${entrada.transferenciaId}/termos/`;
    if (!documento?.pathnameBlob?.startsWith(prefixo) || documento.mimeType !== "application/pdf") {
      throw new ErroExecucaoReatribuicao("TERMO_NAO_VINCULADO", 409);
    }
    const bucketPrivado = process.env.PHANYX_REATRIBUICAO_R2_BUCKET_PRIVADO;
    if (!bucketPrivado || bucketPrivado === process.env.R2_BUCKET_NAME) {
      throw new ErroExecucaoReatribuicao("BUCKET_PRIVADO_NAO_CONFIGURADO", 503);
    }
    try {
      await getR2Client().send(new HeadObjectCommand({ Bucket: bucketPrivado, Key: documento.pathnameBlob }));
      const objeto = await getR2Client().send(new GetObjectCommand({ Bucket: bucketPrivado, Key: documento.pathnameBlob }));
      if (!objeto.Body) throw new Error("PDF ausente");
      const bytesPdf = await objeto.Body.transformToByteArray();
      if (bytesPdf.length < 100 || bytesPdf.length > 10 * 1024 * 1024 ||
          !conferirHashPdf(documento.descricao, bytesPdf)) throw new Error("Integridade do PDF divergente");
    } catch {
      throw new ErroExecucaoReatribuicao("ARQUIVO_TERMO_INDISPONIVEL", 409,
        "O arquivo não foi localizado no armazenamento privado.");
    }
    const resultado = await prisma.$transaction(async tx => {
      // Ordem global: matrícula -> transferência -> alunos -> turmas -> optativas.
      const origemBloqueada = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT "id" FROM "Matricula" WHERE "id" = ${matriculaId}
        AND "instituicaoId" = ${instituicaoId} AND "excluidaEm" IS NULL FOR UPDATE`;
      if (origemBloqueada.length !== 1) throw new ErroExecucaoReatribuicao("MATRICULA_NAO_ENCONTRADA", 404);
      const transferenciaBloqueada = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT "id" FROM "TransferenciaMatricula"
        WHERE "id" = ${entrada.transferenciaId} AND "matriculaId" = ${matriculaId}
        AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
      if (transferenciaBloqueada.length !== 1) throw new ErroExecucaoReatribuicao("SOLICITACAO_NAO_ENCONTRADA", 404);
      const [matricula, transferencia] = await Promise.all([
        tx.matricula.findFirst({
          where: { id: matriculaId, instituicaoId, excluidaEm: null },
          select: { id: true, alunoId: true, status: true, canceladaEm: true,
            updatedAt: true, numeroMatricula: true },
        }),
        tx.transferenciaMatricula.findFirst({
          where: { id: entrada.transferenciaId, instituicaoId, matriculaId },
          select: { id: true, tipo: true, status: true, dataTransferencia: true,
            alunoOrigemId: true, alunoDestinoId: true, matriculaDestinoId: true,
            snapshotAnterior: true, snapshotPosterior: true },
        }),
      ]);
      if (!matricula || !transferencia) throw new ErroExecucaoReatribuicao("DADOS_NAO_ENCONTRADOS", 404);
      // Idempotência: reenvio do mesmo protocolo não cria uma terceira matrícula.
      if (transferencia.tipo === "REATRIBUICAO_ALUNO" && transferencia.status === "CONCLUIDA" &&
          transferencia.matriculaDestinoId) {
        return { matriculaOrigemId: matriculaId,
          matriculaDestinoId: transferencia.matriculaDestinoId, repetida: true };
      }
      if (!transferencia.alunoDestinoId || transferencia.alunoDestinoId === matricula.alunoId) {
        throw new ErroExecucaoReatribuicao("ALUNOS_INVALIDOS", 409);
      }
      const outrosPendentes = await tx.transferenciaMatricula.count({ where: {
        instituicaoId, matriculaId, id: { not: transferencia.id },
        status: { in: ["PENDENTE", "AGUARDANDO_ACEITE_DESTINO", "ACEITA_DESTINO"] },
      } });
      if (outrosPendentes > 0) throw new ErroExecucaoReatribuicao("OUTRA_TRANSFERENCIA_PENDENTE", 409,
        "Existe outra operação de transferência pendente para esta matrícula.");
      const bloqueios = [matricula.alunoId, transferencia.alunoDestinoId].sort((a, b) => a - b);
      const alunosBloqueados: Array<{ id: number }> = await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "Aluno" WHERE "instituicaoId" = ${instituicaoId}
          AND "id" IN (${Prisma.join(bloqueios)}) ORDER BY "id" FOR UPDATE`);
      if (alunosBloqueados.length !== 2) throw new ErroExecucaoReatribuicao("ALUNO_NAO_ENCONTRADO", 404);

      // Revalida o documento dentro da mesma transação que efetiva a sucessão.
      const termoNaTransacao = await tx.transferenciaMatriculaDocumento.findFirst({
        where: {
          id: documentoId, instituicaoId, matriculaId, transferenciaId: transferencia.id,
          tipo: "TERMO_ASSINADO", status: "VINCULADO", removidoEm: null,
          OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }],
        },
        select: { pathnameBlob: true, mimeType: true, numeroDocumento: true, descricao: true },
      });
      if (!termoNaTransacao || termoNaTransacao.pathnameBlob !== documento.pathnameBlob ||
          termoNaTransacao.mimeType !== "application/pdf" ||
          termoNaTransacao.numeroDocumento !== referenciaPlanoReatribuicao(transferencia.snapshotPosterior) ||
          termoNaTransacao.descricao !== documento.descricao ||
          documento.numeroDocumento !== termoNaTransacao.numeroDocumento) {
        throw new ErroExecucaoReatribuicao("TERMO_NAO_VINCULADO", 409);
      }

      const plano = conferirPlanoExecutavel({ snapshot: transferencia.snapshotPosterior,
        matriculaId, alunoOrigemId: matricula.alunoId, alunoDestinoId: transferencia.alunoDestinoId });
      conferirOrigemProposta(transferencia, matricula, plano.dataInicioCurso as string);
      const proposta = validarEntradaProposta({
        acao: "PREVIA", transferenciaId: entrada.transferenciaId,
        turmaIds: plano.turmaIds, optativaSessaoIds: plano.optativaSessaoIds,
        cursoPrincipalId: plano.cursoPrincipalId, dataInicioCurso: plano.dataInicioCurso,
      });
      const hoje = diaFinanceiro(new Date());
      conferirDatasExecucao({ hoje,
        dataTransferencia: transferencia.dataTransferencia.toISOString().slice(0, 10),
        dataInicioCurso: proposta.dataInicioCurso,
        primeiroVencimento: entrada.primeiroVencimento });

      // Fixar a disponibilidade de todas as ofertas, inclusive vagas compartilhadas.
      const referencias = await tx.turma.findMany({ where: { instituicaoId, id: { in: proposta.turmaIds } },
        select: { id: true, nome: true, codigo: true, cursoId: true, poloId: true,
          curso: { select: { nome: true } } } });
      if (referencias.length !== proposta.turmaIds.length) {
        throw new ErroExecucaoReatribuicao("TURMA_INDISPONIVEL", 409);
      }
      const compartilhadas = referencias.map(origemOfertaVinculada).filter((id): id is number => id !== null);
      const travasTurma = [...new Set([...proposta.turmaIds, ...compartilhadas])].sort((a, b) => a - b);
      const travadas: Array<{ id: number }> = await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "Turma" WHERE "instituicaoId" = ${instituicaoId}
          AND "id" IN (${Prisma.join(travasTurma)}) ORDER BY "id" FOR UPDATE`);
      if (travadas.length !== travasTurma.length) throw new ErroExecucaoReatribuicao("TURMA_INDISPONIVEL", 409);
      await bloquearSessoesOptativas(tx, instituicaoId, proposta.optativaSessaoIds);

      const [lancamentos, cobrancas, contratosAssinados, documentosAssinados, documentosAssinaveis,
        trancamentos, cancelamentos, rematriculas, periodosCursoLivre] = await Promise.all([
        tx.lancamentoFinanceiro.count({ where: { instituicaoId, matriculaId } }),
        tx.cobrancaFinanceira.count({ where: { instituicaoId, OR: [
          { matriculaId }, { lancamentoFinanceiro: { matriculaId } },
        ] } }),
        tx.contrato.count({ where: { instituicaoId, matriculaId, OR: [
          { status: "ASSINADO" }, { dataAssinatura: { not: null } },
        ] } }),
        tx.documentoGerado.count({ where: { instituicaoId, matriculaId, OR: [
          { status: "ASSINADO" }, { assinadoEm: { not: null } },
        ] } }),
        tx.documentoGerado.count({ where: { instituicaoId, matriculaId,
          exigeAssinatura: true, status: { in: ["RASCUNHO", "GERADO"] } } }),
        tx.trancamentoMatricula.count({ where: { instituicaoId, matriculaId } }),
        tx.cancelamentoMatricula.count({ where: { instituicaoId, matriculaId } }),
        tx.rematriculaSemestral.count({ where: { instituicaoId, OR: [
          { matriculaOrigemId: matriculaId }, { matriculaGeradaId: matriculaId },
        ] } }),
        tx.periodoCursoLivre.count({ where: { instituicaoId, matriculaId } }),
      ]);
      conferirRestricoesOrigem({ lancamentos, cobrancas, contratosAssinados,
        documentosAssinados, documentosAssinaveis, trancamentos, cancelamentos, rematriculas, periodosCursoLivre });

      const baseProposta = {
        alunoId: transferencia.alunoDestinoId,
        turmaIds: proposta.turmaIds,
        optativaSessaoIds: proposta.optativaSessaoIds,
        dataInicioCurso: proposta.dataInicioCurso,
        ...(proposta.cursoPrincipalId ? { cursoPrincipalId: proposta.cursoPrincipalId } : {}),
      };
      // Revalidação exata da proposta SALVA antes de liberar a vaga anterior.
      const previa = await prepararContratacaoModalidades(tx, instituicaoId, baseProposta);
      if (previa.versao !== plano.versaoOfertas ||
          JSON.stringify(previa.calculo) !== JSON.stringify(plano.calculo)) {
        throw new ErroExecucaoReatribuicao("PROPOSTA_DESATUALIZADA", 409,
          "O valor, as vagas ou as regras foram alterados. Gere e salve uma nova proposta.");
      }

      const publico = matricula.numeroMatricula;
      // Um contrato antigo ainda PENDENTE não deve continuar assinável após a
      // sucessão: cancela o status, mantendo conteúdo, token e trilha histórica.
      const antigosPendentes = await tx.contrato.updateMany({
        where: { instituicaoId, matriculaId, status: "PENDENTE" },
        data: { status: "CANCELADO" },
      });
      // Origem permanece no banco e conserva itens, notas, presenças, títulos
      // e documentos anteriores. Apenas status/número e contrato pendente mudam.
      await tx.matricula.update({ where: { id: matriculaId },
        data: { status: "TRANSFERIDA",
          ...(publico ? { numeroMatricula: numeroHistorico(publico, matriculaId, transferencia.id) } : {}),
        } });
      // A retirada da origem altera a ocupação. Revalida a proposta novamente,
      // agora contra o estado definitivo de vagas dentro da mesma transação.
      const definitiva = await prepararContratacaoModalidades(tx, instituicaoId, baseProposta);
      if (JSON.stringify(definitiva.calculo) !== JSON.stringify(previa.calculo)) {
        throw new ErroExecucaoReatribuicao("VALORES_ALTERADOS", 409);
      }
      const situacao = proposta.dataInicioCurso > hoje ? "A_INICIAR" : "ATIVA";
      const pedidoHash = createHash("sha256").update(JSON.stringify({
        solicitacao: transferencia.id, matriculaOrigem: matriculaId,
        alunoDestino: transferencia.alunoDestinoId,
        ofertas: proposta.turmaIds, optativas: proposta.optativaSessaoIds,
        primeiroVencimento: entrada.primeiroVencimento,
      })).digest("hex");
      // Usa o mesmo motor de contratação já homologado para cursos, disciplinas,
      // optativas, financeiro NOVO, taxas e contrato pendente do aluno destino.
      const nova = await confirmarContratacaoModalidades(tx, usuario, {
        ...baseProposta,
        versao: definitiva.versao,
        primeiroVencimento: entrada.primeiroVencimento,
        status: situacao,
        chave: `${instituicaoId}:${usuario.id}:${randomUUID()}`,
        pedidoHash,
        bolsaPercentual: 0,
        valorPagoMatricula: 0,
        confirmacaoMenorAceita: false,
      }, request);
      if (publico) {
        await tx.matricula.update({ where: { id: nova.id }, data: { numeroMatricula: publico } });
      }
      const agora = new Date();
      const turmaPrincipalNova = referencias.find(t =>
        proposta.cursoPrincipalId ? t.cursoId === proposta.cursoPrincipalId
          : t.id === proposta.turmaIds[0]);
      if (!turmaPrincipalNova) throw new ErroExecucaoReatribuicao("TURMA_DESTINO_INVALIDA", 409);
      await tx.transferenciaMatricula.update({ where: { id: transferencia.id }, data: {
        status: "CONCLUIDA", matriculaDestinoId: nova.id, concluidaEm: agora,
        instituicaoDestinoId: instituicaoId,
        cursoDestinoId: turmaPrincipalNova.cursoId,
        cursoDestinoNomeSnapshot: turmaPrincipalNova.curso?.nome ?? null,
        turmaDestinoId: turmaPrincipalNova.id,
        turmaDestinoNomeSnapshot: turmaPrincipalNova.nome,
        poloDestinoId: turmaPrincipalNova.poloId,
        snapshotPosterior: JSON.parse(JSON.stringify({
          versao: 1, finalidade: "SUCESSAO_CONCLUIDA_SEM_FINANCEIRO_ORIGEM",
          planoAcademicoAnterior: plano,
          matriculaOrigemId: matriculaId, matriculaDestinoId: nova.id,
          numeroMatriculaPublico: publico || nova.numeroMatricula,
          numeroHistoricoOrigem: publico ? numeroHistorico(publico, matriculaId, transferencia.id) : null,
          dataEfetivacao: agora.toISOString(),
          primeiroVencimento: entrada.primeiroVencimento,
          referenciaTermoAssinado: `DOCUMENTO_ID:${documentoId}`,
          documentoTermoAssinadoId: documentoId,
          documentoTermoVersaoPlano: termoNaTransacao.numeroDocumento,
          documentoTermoSha256: documento.descricao?.match(/^PDF_SHA256:([0-9a-f]{64});/)?.[1] ?? null,
          documentoTermoAssinadoConferidoPorId: usuario.id,
          contratosAnterioresPendentesCancelados: antigosPendentes.count,
          autorizacoesConferidasPeloAdministrador: true,
          executadoPorId: usuario.id,
          observacao: "Origem sem lançamentos ou títulos. Contratos PENDENTES anteriores marcados CANCELADO sem apagar conteúdo. Financeiro e novo contrato PENDENTE gerados pela contratação da sucessora.",
        })) as Prisma.InputJsonValue,
      } });
      return { matriculaOrigemId: matriculaId, matriculaDestinoId: nova.id,
        numeroMatricula: publico || nova.numeroMatricula, repetida: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000, timeout: 30000 });
    return NextResponse.json({
      success: true, modo: "SUCESSAO_SEM_FINANCEIRO_ORIGEM",
      resultado, contratoDestinoPendenteAssinatura: true,
      mensagem: resultado.repetida ? "A solicitação já foi concluída. Nenhuma nova matrícula foi criada."
        : "Sucessão concluída no ambiente de teste. A origem foi preservada; o novo contrato deve ser assinado.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    if (erro instanceof ErroExecucaoReatribuicao || erro instanceof ErroPropostaReatribuicao) {
      return NextResponse.json({ codigo: erro.codigo, error: erro.message }, { status: erro.status });
    }
    return erroCombos(erro);
  }
}
