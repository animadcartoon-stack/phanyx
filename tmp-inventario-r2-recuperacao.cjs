const { loadEnvConfig } = require("@next/env");
const {
  S3Client,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const fs = require("fs");

loadEnvConfig(process.cwd());

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  throw new Error(
    "Faltam variáveis R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY ou R2_BUCKET_NAME."
  );
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const conhecidos = new Set([
  "uploads/6c28b10f-0895-49e7-bf82-962638ee9a92-aula-5-apostila.pdf",
  "uploads/234c11f0-38f3-42d4-8005-6dbb5afe9eb3-caderno-de-orientacao-para-elaboracao-de-um-tcc.pdf",
  "uploads/390c2f13-29e4-44cc-9ac8-9a87ea291687-aula-1-apostila.pdf",
  "uploads/c2dfa2d4-d39f-4630-add8-4516793cee92-apostila-de-canonicidade-em-pdf.pdf",
]);

async function main() {
  const objetos = [];
  let ContinuationToken;

  do {
    const resposta = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken,
      })
    );

    for (const obj of resposta.Contents || []) {
      objetos.push({
        Key: obj.Key,
        Size: obj.Size,
        LastModified: obj.LastModified
          ? obj.LastModified.toISOString()
          : null,
        conhecidoNoBancoHistorico: conhecidos.has(obj.Key),
      });
    }

    ContinuationToken = resposta.IsTruncated
      ? resposta.NextContinuationToken
      : undefined;
  } while (ContinuationToken);

  objetos.sort((a, b) =>
    String(a.LastModified).localeCompare(String(b.LastModified))
  );

  fs.writeFileSync(
    "tmp-r2-inventario-completo-20260909.json",
    JSON.stringify(objetos, null, 2),
    "utf8"
  );

  const inicio = new Date("2026-05-06T00:00:00Z");
  const fim = new Date("2026-07-29T00:00:00Z");

  const candidatos = objetos.filter((obj) => {
    if (!obj.LastModified) return false;

    const data = new Date(obj.LastModified);

    return (
      obj.Key &&
      obj.Key.startsWith("uploads/") &&
      !obj.conhecidoNoBancoHistorico &&
      data >= inicio &&
      data < fim
    );
  });

  fs.writeFileSync(
    "tmp-r2-candidatos-aulas-20260909.json",
    JSON.stringify(candidatos, null, 2),
    "utf8"
  );

  console.log("");
  console.log("=== INVENTÁRIO R2 ===");
  console.log("Total de objetos:", objetos.length);
  console.log(
    "Objetos conhecidos dos 4 materiais recuperados:",
    objetos.filter((x) => x.conhecidoNoBancoHistorico).length
  );
  console.log(
    "Candidatos órfãos entre 06/05 e 28/07:",
    candidatos.length
  );

  console.log("");
  console.log("=== CANDIDATOS ===");

  console.table(
    candidatos.map((x) => ({
      Key: x.Key,
      Size: x.Size,
      LastModified: x.LastModified,
    }))
  );

  console.log("");
  console.log("Arquivos gravados:");
  console.log("  tmp-r2-inventario-completo-20260909.json");
  console.log("  tmp-r2-candidatos-aulas-20260909.json");
}

main().catch((erro) => {
  console.error("ERRO:", erro.message);
  process.exit(1);
});
