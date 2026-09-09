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
  "recovery-parte-2-antigo-testamento"
);

const arquivos = [
  {
    aula: 1,
    nome: "PARTE 2 - AULA 1 - ABRAÃO, SUA ÉPOCA E SEU CHAMADO.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-01-20260909.pdf"
  },
  {
    aula: 2,
    nome: "PARTE 2 - AULA 2 - ABRAÃO E LÓ SE SEPARAM.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-02-20260909.pdf"
  },
  {
    aula: 3,
    nome: "PARTE 2 - AULA 3 - ABRAÃO, ISAQUE E JACÓ.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-03-20260909.pdf"
  },
  {
    aula: 4,
    nome: "PARTE 2 - AULA 4 - O EGITO.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-04-20260909.pdf"
  },
  {
    aula: 5,
    nome: "PARTE 2 - AULA 5 - A ORIGEM DA NAÇÃO DE ISRAEL NO EGITO.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-05-20260909.pdf"
  },
  {
    aula: 6,
    nome: "PARTE 2 - AULA 6 - O ÊXODO - PARTE I.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-06-20260909.pdf"
  },
  {
    aula: 7,
    nome: "PARTE 2 - AULA 7 - O ÊXODO - PARTE II.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-07-20260909.pdf"
  },
  {
    aula: 8,
    nome: "PARTE 2 - AULA 8 - ISRAEL NO SINAI.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-08-20260909.pdf"
  },
  {
    aula: 9,
    nome: "PARTE 2 - AULA 9 - O TABERNÁCULO.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-09-20260909.pdf"
  },
  {
    aula: 10,
    nome: "PARTE 2 - AULA 10 - RUMO A CANAÃ.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-10-20260909.pdf"
  },
  {
    aula: 11,
    nome: "PARTE 2 - AULA 11 - A CONQUISTA DE CANAÃ.pdf",
    key: "uploads/recuperacao-antigo-testamento-a-parte-2-aula-11-20260909.pdf"
  }
];

function sha256(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex")
    .toUpperCase();
}

async function consultar(key) {
  try {
    return await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  }
  catch (erro) {
    const status = erro?.$metadata?.httpStatusCode;

    if (status === 404 || erro.name === "NotFound") {
      return null;
    }

    throw erro;
  }
}

async function main() {
  console.log("");
  console.log("=== UPLOAD PARTE 2 - AULAS 1 A 11 ===");

  for (const item of arquivos) {
    const arquivo = path.join(pasta, item.nome);

    if (!fs.existsSync(arquivo)) {
      throw new Error(
        `Arquivo da Aula ${item.aula} não encontrado: ${arquivo}`
      );
    }

    const body = fs.readFileSync(arquivo);
    const hash = sha256(body);

    const remoto = await consultar(item.key);

    if (remoto) {
      const tamanhoRemoto = Number(
        remoto.ContentLength || 0
      );

      const hashRemoto =
        remoto.Metadata?.sha256?.toUpperCase() || null;

      if (
        tamanhoRemoto === body.length &&
        (!hashRemoto || hashRemoto === hash)
      ) {
        console.log("");
        console.log(
          `Parte 2 - Aula ${item.aula}: JÁ EXISTE E CONFERE`
        );
        console.log(`  tamanho: ${body.length}`);
        console.log(`  SHA256: ${hash}`);
        continue;
      }

      throw new Error(
        `Existe um objeto diferente no R2 para a Aula ${item.aula}: ${item.key}`
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
          recuperacao: "antigo-testamento-a-parte-2-20260909",
          aula: String(item.aula),
        },
      })
    );

    const url =
      "https://pub-b9a1976dc8324121bc90bc36f16157a4.r2.dev/" +
      item.key;

    console.log("");
    console.log(`Parte 2 - Aula ${item.aula}: OK`);
    console.log(`  tamanho: ${body.length}`);
    console.log(`  SHA256: ${hash}`);
    console.log(`  Key: ${item.key}`);
    console.log(`  URL: ${url}`);
  }

  console.log("");
  console.log("=== 11 UPLOADS CONCLUÍDOS ===");
}

main().catch((erro) => {
  console.error("");
  console.error("ERRO:", erro.message);
  process.exit(1);
});
