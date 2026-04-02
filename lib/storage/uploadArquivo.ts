import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { r2Client } from "./r2";

const bucketName = process.env.R2_BUCKET_NAME;

if (!bucketName) {
  throw new Error("R2_BUCKET_NAME não configurado no .env");
}

type UploadArquivoInput = {
  file: File;
  pasta?: string;
};

type UploadArquivoOutput = {
  key: string;
  url: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
};

function sanitizeFileName(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function uploadArquivo({
  file,
  pasta = "geral",
}: UploadArquivoInput): Promise<UploadArquivoOutput> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const nomeOriginal = file.name;
  const nomeSeguro = sanitizeFileName(nomeOriginal);
  const key = `${pasta}/${randomUUID()}-${nomeSeguro}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  const publicUrlBase = process.env.R2_PUBLIC_URL?.trim();

  const url = publicUrlBase
    ? `${publicUrlBase}/${key}`
    : key;

  return {
    key,
    url,
    nomeOriginal,
    mimeType: file.type || "application/octet-stream",
    tamanho: file.size,
  };
}