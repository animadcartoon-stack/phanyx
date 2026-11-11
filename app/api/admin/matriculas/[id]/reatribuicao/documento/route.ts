import { randomUUID } from "node:crypto";
import { descricaoPdf, referenciaPlanoReatribuicao, sha256Pdf } from "@/lib/matriculas/reatribuicao-vinculo-termo";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { ErroExecucaoReatribuicao, execucaoHabilitada } from "@/lib/matriculas/reatribuicao-execucao";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: { id: string } };
const HOST_LAB = "ep-ancient-mud-b6ptxf53.c-2.sa-east-1.aws.neon.tech";
const MAX_BYTES = 10 * 1024 * 1024;

function laboratorioAutorizado() {
  return process.env.PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST?.trim().toLowerCase() === HOST_LAB &&
    execucaoHabilitada({
      flag: process.env.PHANYX_REATRIBUICAO_EXECUCAO_HABILITADA,
      seloHomologacao: process.env.PHANYX_REATRIBUICAO_AMBIENTE_CONFIRMADO,
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL,
      hostAutorizado: process.env.PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST,
    });
}
function idPositivo(valor: unknown) {
  const numero = typeof valor === "string" && /^\d+$/.test(valor) ? Number(valor) : NaN;
  if (!Number.isSafeInteger(numero) || numero <= 0) throw new ErroExecucaoReatribuicao("IDENTIFICADOR_INVALIDO", 400);
  return numero;
}
function caminhoTermos(instituicaoId: number, matriculaId: number, transferenciaId: number) {
  return `instituicoes/${instituicaoId}/matriculas/${matriculaId}/reatribuicoes/${transferenciaId}/termos/`;
}
function bucket() {
  const nome = process.env.PHANYX_REATRIBUICAO_R2_BUCKET_PRIVADO;
  if (!nome || nome === process.env.R2_BUCKET_NAME) {
    throw new ErroExecucaoReatribuicao("BUCKET_PRIVADO_NAO_CONFIGURADO", 503,
      "Configure um bucket R2 privado, separado do armazenamento público do PHANYX.");
  }
  return nome;
}
function respostaErro(error: unknown) {
  if (error instanceof ErroExecucaoReatribuicao) {
    return NextResponse.json({ codigo: error.codigo, error: error.message }, { status: error.status });
  }
  return erroCombos(error);
}
function escopoDocumento(instituicaoId: number, matriculaId: number, transferenciaId: number) {
  return {
    instituicaoId, matriculaId, transferenciaId,
    tipo: "TERMO_ASSINADO" as const,
    status: "VINCULADO" as const,
    removidoEm: null,
    OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }],
  };
}
async function verificarProtocolo(instituicaoId: number, matriculaId: number, transferenciaId: number) {
  const [matricula, transferencia] = await Promise.all([
    prisma.matricula.findFirst({ where: { id: matriculaId, instituicaoId, excluidaEm: null }, select: { id: true } }),
    prisma.transferenciaMatricula.findFirst({
      where: { id: transferenciaId, matriculaId, instituicaoId, tipo: "REATRIBUICAO_ALUNO" },
      select: { id: true, status: true, snapshotPosterior: true },
    }),
  ]);
  if (!matricula || !transferencia || !["PENDENTE", "CONCLUIDA"].includes(transferencia.status)) {
    throw new ErroExecucaoReatribuicao("SOLICITACAO_NAO_ENCONTRADA", 404);
  }
  return transferencia;
}

/** Documentos privados: nenhuma URL pública, chave ou conteúdo retorna na listagem. */
export async function GET(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    if (!laboratorioAutorizado()) throw new ErroExecucaoReatribuicao("EXECUCAO_DESABILITADA", 403);
    const matriculaId = idPositivo(params.id);
    const busca = new URL(request.url).searchParams;
    const transferenciaId = idPositivo(busca.get("transferenciaId"));
    const transferencia = await verificarProtocolo(usuario.instituicaoId, matriculaId, transferenciaId);
    const referenciaPlanoAtual = referenciaPlanoReatribuicao(transferencia.snapshotPosterior);
    if (transferencia.status === "PENDENTE" && !referenciaPlanoAtual) {
      if (busca.get("baixarId")) throw new ErroExecucaoReatribuicao("PROPOSTA_INDISPONIVEL", 409);
      return NextResponse.json({ documento: null }, { headers: { "Cache-Control": "no-store" } });
    }
    const escopo = { ...escopoDocumento(usuario.instituicaoId, matriculaId, transferenciaId),
      ...(referenciaPlanoAtual ? { numeroDocumento: referenciaPlanoAtual } : {}) };
    const baixar = busca.get("baixarId");
    if (baixar !== null) {
      const documentoId = idPositivo(baixar);
      const documento = await prisma.transferenciaMatriculaDocumento.findFirst({
        where: { ...escopo, id: documentoId },
        select: { pathnameBlob: true, mimeType: true },
      });
      const prefixo = caminhoTermos(usuario.instituicaoId, matriculaId, transferenciaId);
      if (!documento?.pathnameBlob?.startsWith(prefixo) || documento.mimeType !== "application/pdf") {
        throw new ErroExecucaoReatribuicao("DOCUMENTO_INDISPONIVEL", 404);
      }
      const objeto = await getR2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: documento.pathnameBlob }));
      if (!objeto.Body) throw new ErroExecucaoReatribuicao("ARQUIVO_INDISPONIVEL", 404);
      const bytes = await objeto.Body.transformToByteArray();
      return new Response(Buffer.from(bytes) as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="termo-reatribuicao-${transferenciaId}.pdf"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const documento = await prisma.transferenciaMatriculaDocumento.findFirst({
      where: escopo,
      orderBy: { criadoEm: "desc" },
      select: { id: true, nomeOriginal: true, criadoEm: true, tamanhoBytes: true, enviadoPorId: true, pathnameBlob: true, mimeType: true },
    });
    const prefixo = caminhoTermos(usuario.instituicaoId, matriculaId, transferenciaId);
    const documentoPublico = documento && documento.pathnameBlob?.startsWith(prefixo) &&
      documento.mimeType === "application/pdf" ? {
        id: documento.id, nomeOriginal: documento.nomeOriginal, criadoEm: documento.criadoEm,
        tamanhoBytes: documento.tamanhoBytes, enviadoPorId: documento.enviadoPorId,
      } : null;
    return NextResponse.json({ documento: documentoPublico }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return respostaErro(error); }
}

/** Upload isolado: só PDF, no máximo 10 MiB, sem endereço público. */
export async function POST(request: Request, { params }: Contexto) {
  try {
    const usuario = await administradorCombos();
    if (!laboratorioAutorizado()) throw new ErroExecucaoReatribuicao("EXECUCAO_DESABILITADA", 403);
    const instituicaoId = usuario.instituicaoId;
    const matriculaId = idPositivo(params.id);
    const tamanhoDeclarado = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(tamanhoDeclarado) && tamanhoDeclarado > MAX_BYTES + 512 * 1024) {
      throw new ErroExecucaoReatribuicao("PDF_MUITO_GRANDE", 413);
    }
    const formulario = await request.formData();
    const transferenciaId = idPositivo(formulario.get("transferenciaId"));
    const referenciaPlanoInformada = formulario.get("referenciaPlano");
    const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size < 100 || arquivo.size > MAX_BYTES ||
        arquivo.type !== "application/pdf" || !/\.pdf$/i.test(arquivo.name)) {
      throw new ErroExecucaoReatribuicao("PDF_INVALIDO", 400, "Envie um PDF de até 10 MiB.");
    }
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new ErroExecucaoReatribuicao("PDF_INVALIDO", 400, "O arquivo não apresenta cabeçalho de PDF.");
    }
    const transferencia = await verificarProtocolo(instituicaoId, matriculaId, transferenciaId);
    if (transferencia.status !== "PENDENTE") throw new ErroExecucaoReatribuicao("SOLICITACAO_NAO_PENDENTE", 409);
    const referenciaPlano = referenciaPlanoReatribuicao(transferencia.snapshotPosterior);
    if (!referenciaPlano || referenciaPlanoInformada !== referenciaPlano)
      throw new ErroExecucaoReatribuicao("TERMO_PLANO_DIVERGENTE", 409, "Gere a minuta novamente para a versão atual do plano antes de anexar o termo.");
    const hashPdf = sha256Pdf(bytes);
    const pasta = caminhoTermos(instituicaoId, matriculaId, transferenciaId);
    const chave = `${pasta}${randomUUID()}.pdf`;
    await getR2Client().send(new PutObjectCommand({
      Bucket: bucket(), Key: chave, Body: bytes, ContentType: "application/pdf",
      ContentDisposition: "attachment",
    }));
    // Se o registro falhar, um arquivo órfão privado poderá ser limpo por manutenção.
    // Não apagamos automaticamente o objeto após um possível commit de resultado incerto.
    const documento = await prisma.$transaction(async tx => {
      const protocolos: Array<{ id: number }> = await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "TransferenciaMatricula"
        WHERE "id" = ${transferenciaId} AND "matriculaId" = ${matriculaId}
          AND "instituicaoId" = ${instituicaoId} AND "tipo" = 'REATRIBUICAO_ALUNO'
          AND "status" = 'PENDENTE' FOR UPDATE`);
      if (protocolos.length !== 1) throw new ErroExecucaoReatribuicao("SOLICITACAO_ALTERADA", 409);
      const protocolosAtualizados = await tx.transferenciaMatricula.findFirst({
        where: { id: transferenciaId, matriculaId, instituicaoId, tipo: "REATRIBUICAO_ALUNO", status: "PENDENTE" },
        select: { snapshotPosterior: true },
      });
      if (referenciaPlanoReatribuicao(protocolosAtualizados?.snapshotPosterior) !== referenciaPlano)
        throw new ErroExecucaoReatribuicao("TERMO_PLANO_DIVERGENTE", 409);
      return tx.transferenciaMatriculaDocumento.create({
        data: {
          instituicaoId, matriculaId, transferenciaId,
          sessaoUpload: `REATRIBUICAO_${transferenciaId}_${randomUUID()}`,
          tipo: "TERMO_ASSINADO", status: "VINCULADO", vinculadoEm: new Date(),
          numeroDocumento: referenciaPlano,
          nomeOriginal: arquivo.name.slice(0, 180), nomeArquivo: chave.split("/").pop() || "termo.pdf",
          urlArquivo: `r2-privado:${chave}`, pathnameBlob: chave,
          mimeType: "application/pdf", tamanhoBytes: bytes.length,
          visivelAoAluno: false, enviadoPorId: usuario.id,
          enviadoPorNomeSnapshot: null,
          descricao: descricaoPdf(hashPdf),
        },
        select: { id: true, nomeOriginal: true, criadoEm: true, tamanhoBytes: true, enviadoPorId: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ documento }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return respostaErro(error); }
}
