const { loadEnvConfig } = require("@next/env");
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

loadEnvConfig(process.cwd());

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error("Configuração do R2 incompleta.");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const pasta = path.resolve(
  "recovery-aulas-6-a-9-antigo-testamento"
);

const arquivos = [
  {
    numero: 6,
    nome: "AULA 6 - ENTENDENDO O RELATO BÍBLICO DA CRIAÇÃO.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-aula-6-20260909.pdf",
  },
  {
    numero: 7,
    nome: "AULA 7 - NARRATIVA BABILÔNICA DA CRIAÇÃO E A QUEDA.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-aula-7-20260909.pdf",
  },
  {
    numero: 8,
    nome: "AULA 8 - O DILÚVIO BÍBLICO.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-aula-8-20260909.pdf",
  },
  {
    numero: 9,
    nome: "AULA 9 - A TORRE DE BABEL E A ORIGEM DAS NAÇÕES.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-aula-9-20260909.pdf",
  },
];

function sha256(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex")
    .toUpperCase();
}

async function existe(key) {
  try {
    return await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (erro) {
    const status = erro?.$metadata?.httpStatusCode;

    if (status === 404 || erro.name === "NotFound") {
      return null;
    }

    throw erro;
  }
}

async function main() {
  console.log("");
  console.log("=== UPLOAD AULAS 6 A 9 ===");

  for (const item of arquivos) {
    const arquivo = path.join(pasta, item.nome);

    if (!fs.existsSync(arquivo)) {
      throw new Error(
        `Arquivo da Aula ${item.numero} não encontrado: ${arquivo}`
      );
    }

    const body = fs.readFileSync(arquivo);
    const hash = sha256(body);

    const remoto = await existe(item.key);

    if (remoto) {
      const tamanhoRemoto = Number(remoto.ContentLength || 0);
      const hashRemoto =
        remoto.Metadata?.sha256?.toUpperCase() || null;

      if (
        tamanhoRemoto === body.length &&
        (!hashRemoto || hashRemoto === hash)
      ) {
        console.log("");
        console.log(`Aula ${item.numero}: JÁ EXISTE E CONFERE`);
        console.log(`  tamanho: ${body.length}`);
        console.log(`  SHA256: ${hash}`);
        continue;
      }

      throw new Error(
        `Objeto existente diferente para Aula ${item.numero}: ${item.key}`
      );
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: item.key,
        Body: body,
        ContentType: "application/pdf",
        Metadata: {
          sha256: hash.toLowerCase(),
          recuperacao: "antigo-testamento-a-20260909",
        },
      })
    );

    const url =
      "https://pub-b9a1976dc8324121bc90bc36f16157a4.r2.dev/" +
      item.key;

    console.log("");
    console.log(`Aula ${item.numero}: OK`);
    console.log(`  tamanho: ${body.length}`);
    console.log(`  SHA256: ${hash}`);
    console.log(`  Key: ${item.key}`);
    console.log(`  URL: ${url}`);
  }

  console.log("");
  console.log("=== UPLOADS CONCLUÍDOS ===");
}

main().catch((erro) => {
  console.error("");
  console.error("ERRO:", erro.message);
  process.exit(1);
});
