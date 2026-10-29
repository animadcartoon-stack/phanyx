import { S3Client } from "@aws-sdk/client-s3";

let clienteR2: S3Client | null = null;

export function getR2Client() {
  if (clienteR2) return clienteR2;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId) {
    throw new Error("R2_ACCOUNT_ID não configurado no .env");
  }

  if (!accessKeyId) {
    throw new Error("R2_ACCESS_KEY_ID não configurado no .env");
  }

  if (!secretAccessKey) {
    throw new Error("R2_SECRET_ACCESS_KEY não configurado no .env");
  }

  clienteR2 = new S3Client({
  region: "auto",
  endpoint: `https://3e8824a5b2e49910aa8bf310cf11b169.r2.cloudflarestorage.com`,
forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
  return clienteR2;
}
