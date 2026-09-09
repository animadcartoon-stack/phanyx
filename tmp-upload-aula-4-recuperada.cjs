const { loadEnvConfig } = require("@next/env");
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const fs = require("fs");
const path = require("path");

loadEnvConfig(process.cwd());

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Configuração do R2 incompleta.");
}

const arquivo = path.resolve(
  "recovery-aula-4-antigo-testamento",
  "AULA 4 - QUAL A IDADE DA TERRA.pdf"
);

if (!fs.existsSync(arquivo)) {
  throw new Error("PDF da Aula 4 não encontrado.");
}

const key =
  "uploads/recuperacao-aula-4-qual-a-idade-da-terra-20260909.pdf";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function main() {
  const body = fs.readFileSync(arquivo);

  // Impede sobrescrever silenciosamente um arquivo já existente.
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    throw new Error(
      "O arquivo de recuperação já existe no R2. Nenhum upload foi feito."
    );
  }
  catch (erro) {
    const status =
      erro?.$metadata?.httpStatusCode;

    if (status !== 404 && erro.name !== "NotFound") {
      if (
        String(erro.message).includes(
          "já existe no R2"
        )
      ) {
        throw erro;
      }
    }
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/pdf",
    })
  );

  const url =
    "https://pub-b9a1976dc8324121bc90bc36f16157a4.r2.dev/" +
    key;

  console.log("");
  console.log("=== UPLOAD CONCLUÍDO ===");
  console.log("Key:", key);
  console.log("Tamanho:", body.length);
  console.log("URL:", url);
}

main().catch((erro) => {
  console.error("ERRO:", erro.message);
  process.exit(1);
});
