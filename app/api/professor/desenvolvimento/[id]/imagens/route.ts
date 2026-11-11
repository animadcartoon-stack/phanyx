import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";
import { alunoMatriculadoNaTurma, contextoProfessor, turmaDoProfessor } from "@/lib/acompanhamento-permissoes";
import { MAX_ANEXOS_DESENVOLVIMENTO, TIPOS_ANEXO_DESENVOLVIMENTO } from "@/lib/desenvolvimento-materiais";

export const runtime = "nodejs";
const EDICAO = ["RASCUNHO", "DEVOLVIDO"];
const AUDIENCIA = "phanyx-desenvolvimento-anexo";
const MINUTOS_PUT = 10;
const LIMITE_LEGADO = 5 * 1024 * 1024;

type Anexo = { chaveR2: string; mime: string; tamanho: number; nomeOriginal: string };

function erro(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function tipoReal(bytes: Buffer, mime: string) {
  switch (mime) {
    case "image/jpeg": return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png": return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/webp": return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case "application/pdf": return bytes.toString("ascii", 0, 5) === "%PDF-";
    case "video/mp4": return bytes.toString("ascii", 4, 8) === "ftyp";
    case "video/webm": return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    default: return false;
  }
}

async function salvarAnexo(registroId: number, instituicaoId: number, professorId: number, anexo: Anexo) {
  return prisma.$transaction(async tx => {
    // O UPDATE trava o registro até o anexo ser gravado e serializa o envio à coordenação.
    const registro = await tx.registroDesenvolvimento.updateMany({
      where: { id: registroId, instituicaoId, professorId, status: { in: EDICAO } },
      data: { atualizadoEm: new Date() },
    });
    if (registro.count !== 1) return null;
    const existente = await tx.imagemDesenvolvimento.findUnique({ where: { chaveR2: anexo.chaveR2 } });
    if (existente) return existente;
    const total = await tx.imagemDesenvolvimento.count({ where: { registroId, instituicaoId } });
    if (total >= MAX_ANEXOS_DESENVOLVIMENTO) return null;
    return tx.imagemDesenvolvimento.create({ data: { registroId, instituicaoId, ...anexo } });
  });
}

async function registroEditavel(id: number, instituicaoId: number, professorId: number) {
  const registro = await prisma.registroDesenvolvimento.findFirst({
    where: { id, instituicaoId, professorId, status: { in: EDICAO } },
    select: { turmaId: true, alunoId: true, _count: { select: { imagens: true } } },
  });
  if (!registro) return null;
  const [turma, matriculado] = await Promise.all([
    turmaDoProfessor(instituicaoId, professorId, registro.turmaId),
    alunoMatriculadoNaTurma(instituicaoId, registro.alunoId, registro.turmaId, professorId),
  ]);
  return turma && matriculado ? registro : null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = await contextoProfessor("professor.desenvolvimento");
  if (!ctx) return erro("Sem permissão", 403);
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) return erro("ID inválido", 400);
  const instituicaoId = ctx.instituicaoId;
  const professorId = ctx.professor.id;
  const registro = await registroEditavel(id, instituicaoId, professorId);
  if (!registro) {
    return erro("Registro não permite alterações nos anexos", 403);
  }

  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket === process.env.R2_BUCKET_NAME)) {
    return erro("Armazenamento privado indisponível", 503);
  }

  try {
    const cliente = getR2Client();
    const prefixo = `privado/instituicoes/${instituicaoId}/desenvolvimento/${id}/`;

    if (req.headers.get("content-type")?.startsWith("multipart/form-data")) {
      if (registro._count.imagens >= 5) return erro("Limite de imagens atingido", 403);
      if (Number(req.headers.get("content-length") || 0) > LIMITE_LEGADO + 100000) return erro("Arquivo muito grande", 413);
      const arquivo = (await req.formData()).get("arquivo");
      if (!(arquivo instanceof File) || arquivo.size === 0 || arquivo.size > LIMITE_LEGADO || !arquivo.type.startsWith("image/")) {
        return erro("Imagem inválida ou acima de 5 MB", 400);
      }
      const bytes = Buffer.from(await arquivo.arrayBuffer());
      if (!tipoReal(bytes, arquivo.type)) return erro("Somente JPEG, PNG ou WebP válidos", 400);
      const chaveR2 = prefixo + randomUUID();
      await cliente.send(new PutObjectCommand({
        Bucket: bucket, Key: chaveR2, Body: bytes, ContentType: arquivo.type, CacheControl: "private, no-store",
      }));
      let imagem;
      try {
        imagem = await salvarAnexo(id, instituicaoId, professorId, {
          chaveR2, mime: arquivo.type, tamanho: arquivo.size, nomeOriginal: arquivo.name.slice(0, 150),
        });
        if (imagem) return NextResponse.json({ ok: true, imagem: { id: imagem.id, nomeOriginal: imagem.nomeOriginal } }, { status: 201 });
      } finally {
        if (!imagem) await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: chaveR2 })).catch(() => null);
      }
      return erro("O registro já foi enviado ou atingiu o limite de anexos", 409);
    }

    const segredoJwt = process.env.JWT_SECRET;
    if (!segredoJwt) return erro("Configuração de envio indisponível", 503);
    const segredo = createHmac("sha256", segredoJwt).update(AUDIENCIA).digest();
    const dados = await req.json().catch(() => null);
    if (dados?.acao === "PREPARAR") {
      if (registro._count.imagens >= MAX_ANEXOS_DESENVOLVIMENTO) return erro("Limite de anexos atingido", 409);
      const mime = typeof dados.mime === "string" ? dados.mime : "";
      const tamanho = dados.tamanho;
      const nomeOriginal = typeof dados.nome === "string" ? dados.nome.trim().slice(0, 150) : "";
      const limite = TIPOS_ANEXO_DESENVOLVIMENTO[mime];
      if (!Object.hasOwn(TIPOS_ANEXO_DESENVOLVIMENTO, mime) || !Number.isSafeInteger(tamanho) || tamanho < 1 || tamanho > limite || !nomeOriginal) {
        return erro("Formato não aceito ou arquivo acima do limite", 400);
      }
      const chaveR2 = prefixo + randomUUID();
      const url = await getSignedUrl(cliente, new PutObjectCommand({
        Bucket: bucket, Key: chaveR2, ContentType: mime, ContentLength: tamanho, IfNoneMatch: "*",
      }), {
        expiresIn: MINUTOS_PUT * 60,
        signableHeaders: new Set(["content-type", "content-length", "if-none-match"]),
      });
      const token = jwt.sign({ registroId: id, instituicaoId, professorId, chaveR2, mime, tamanho, nomeOriginal }, segredo, {
        audience: AUDIENCIA, algorithm: "HS256", expiresIn: "15m",
      });
      return NextResponse.json({ url, token });
    }

    if (dados?.acao !== "FINALIZAR" || typeof dados.token !== "string") return erro("Ação inválida", 400);
    let anexo;
    try {
      anexo = jwt.verify(dados.token, segredo, { audience: AUDIENCIA, algorithms: ["HS256"] });
    } catch {
      return erro("Envio expirado ou inválido. Selecione o arquivo novamente.", 400);
    }
    if (typeof anexo === "string" || anexo.instituicaoId !== instituicaoId || anexo.professorId !== professorId
        || anexo.registroId !== id || !anexo.chaveR2?.startsWith(prefixo)) return erro("Envio não pertence ao registro", 403);
    const { chaveR2, mime, tamanho, nomeOriginal } = anexo;
    const objeto = await cliente.send(new GetObjectCommand({
      Bucket: bucket, Key: chaveR2, Range: `bytes=0-${Math.min(tamanho, 16) - 1}`,
    }));
    const bytes = Buffer.from(await objeto.Body?.transformToByteArray() ?? []);
    if (objeto.ContentType !== mime || !objeto.ContentRange?.endsWith(`/${tamanho}`) || !tipoReal(bytes, mime)) {
      await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: chaveR2 }));
      return erro("O conteúdo não corresponde ao formato ou tamanho do arquivo", 400);
    }
    const salvo = await salvarAnexo(id, instituicaoId, professorId, { chaveR2, mime, tamanho, nomeOriginal });
    if (!salvo) {
      const existente = await prisma.imagemDesenvolvimento.findUnique({ where: { chaveR2 } });
      if (existente) return NextResponse.json({ ok: true, id: existente.id });
      await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: chaveR2 }));
      return erro("O registro já foi enviado ou atingiu o limite de anexos", 409);
    }
    return NextResponse.json({ ok: true, id: salvo.id }, { status: 201 });
  } catch {
    return erro("Falha ao armazenar o anexo. Tente novamente.", 502);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ctx = await contextoProfessor("professor.desenvolvimento");
  if (!ctx) return erro("Sem permissão", 403);
  const id = Number(params.id);
  const anexoId = Number(new URL(req.url).searchParams.get("anexo"));
  if (![id, anexoId].every(n => Number.isSafeInteger(n) && n > 0 && n <= 2147483647)) {
    return erro("ID inválido", 400);
  }
  const { instituicaoId, professor: { id: professorId } } = ctx;
  if (!await registroEditavel(id, instituicaoId, professorId)) return erro("Registro não permite alterações nos anexos", 403);
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket === process.env.R2_BUCKET_NAME)) {
    return erro("Armazenamento privado indisponível", 503);
  }

  try {
    const cliente = getR2Client();
    const removido = await prisma.$transaction(async tx => {
      const registro = await tx.registroDesenvolvimento.updateMany({
        where: { id, instituicaoId, professorId, status: { in: EDICAO } },
        data: { atualizadoEm: new Date() },
      });
      if (registro.count !== 1) return false;
      const anexo = await tx.imagemDesenvolvimento.findFirst({
        where: { id: anexoId, registroId: id, instituicaoId }, select: { chaveR2: true },
      });
      if (!anexo) return true;
      await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: anexo.chaveR2 }));
      await tx.imagemDesenvolvimento.delete({ where: { id: anexoId } });
      return true;
    });
    if (!removido) return erro("O registro já foi enviado", 409);
    return NextResponse.json({ ok: true });
  } catch {
    return erro("Não foi possível remover o anexo. Tente novamente.", 502);
  }
}
