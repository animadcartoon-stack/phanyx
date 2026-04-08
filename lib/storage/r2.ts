import { S3Client } from "@aws-sdk/client-s3";

function getR2Client() {
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

  return new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
}

export const r2Client = getR2Client();