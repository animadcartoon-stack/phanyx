import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuth, assertAluno } from "@/lib/auth/getAuth";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
import { parseUrl } from "@smithy/url-parser";

function sanitizeFileName(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(
  req: NextRequest,
  ctx: { params: { atividadeId: string } }
) {
  try {
    const auth = getAuth(req);
    assertAluno(auth);

    const atividadeId = Number(ctx.params.atividadeId);

    if (!Number.isFinite(atividadeId) || atividadeId <= 0) {
      return NextResponse.json(
        { error: "Atividade inválida" },
        { status: 400 }
      );
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL?.trim();

    if (!bucketName) {
      return NextResponse.json(
        { error: "R2_BUCKET_NAME não configurado" },
        { status: 500 }
      );
    }

    if (!publicUrlBase) {
      return NextResponse.json(
        { error: "R2_PUBLIC_URL não configurado" },
        { status: 500 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: auth.userId,
        instituicaoId: auth.instituicaoId,
      },
      select: {
        id: true,
        instituicaoId: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Perfil de aluno não encontrado" },
        { status: 404 }
      );
    }

    const atividade = await prisma.atividade.findFirst({
      where: {
        id: atividadeId,
        instituicaoId: auth.instituicaoId,
        status: "PUBLICADA",
      },
      select: {
        id: true,
        prazo: true,
      },
    });

    if (!atividade) {
      return NextResponse.json(
        { error: "Atividade não encontrada ou indisponível" },
        { status: 404 }
      );
    }

    if (atividade.prazo && new Date() > new Date(atividade.prazo)) {
      return NextResponse.json(
        { error: "Prazo da atividade encerrado" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const nomeOriginal =
      typeof body?.nomeOriginal === "string" ? body.nomeOriginal.trim() : "";
    const mimeType =
      typeof body?.mimeType === "string" ? body.mimeType.trim() : "";
    const tamanho =
      typeof body?.tamanho === "number" ? body.tamanho : Number(body?.tamanho);

    if (!nomeOriginal) {
      return NextResponse.json(
        { error: "Nome do arquivo é obrigatório" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(tamanho) || tamanho <= 0) {
      return NextResponse.json(
        { error: "Tamanho do arquivo inválido" },
        { status: 400 }
      );
    }

    const limiteBytes = 500 * 1024 * 1024;

    if (tamanho > limiteBytes) {
      return NextResponse.json(
        { error: "Arquivo excede o limite de 500 MB" },
        { status: 400 }
      );
    }

    const nomeSeguro = sanitizeFileName(nomeOriginal);
    const key = `atividades/${atividade.id}/aluno-${aluno.id}/${randomUUID()}-${nomeSeguro}`;

    const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  return NextResponse.json(
    { error: "Credenciais do R2 não configuradas corretamente" },
    { status: 500 }
  );
}

const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
const objectUrl = `${endpoint}/${bucketName}/${key}`;
const contentType = "application/octet-stream";

const presigner = new S3RequestPresigner({
  region: "auto",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  sha256: Hash.bind(null, "sha256"),
});

const signedRequest = await presigner.presign(
  new HttpRequest({
    ...parseUrl(objectUrl),
    method: "PUT",
    headers: {
      host: `${accountId}.r2.cloudflarestorage.com`,
      "content-type": contentType,
    },
  }),
  {
    expiresIn: 60 * 10,
  }
);

const uploadUrl = formatUrl(signedRequest);

    const arquivoUrl = `${publicUrlBase}/${key}`;

  return NextResponse.json({
  ok: true,
  uploadUrl,
  key,
  arquivoUrl,
  nomeOriginal,
  mimeType: mimeType || "application/octet-stream",
  tamanho,
  debugAccountId: accountId,
  debugEndpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  debugObjectUrl: objectUrl,
});

  } catch (e: any) {
    console.error("ERRO AO GERAR URL DE UPLOAD:", e);

    return NextResponse.json(
      { error: e.message || "Erro ao gerar URL de upload" },
      { status: 401 }
    );
  }
}