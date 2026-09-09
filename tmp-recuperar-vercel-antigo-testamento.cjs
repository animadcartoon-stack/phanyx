const { loadEnvConfig } = require("@next/env");
const { list } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
const https = require("https");

loadEnvConfig(process.cwd());

const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  throw new Error("BLOB_READ_WRITE_TOKEN não encontrado no ambiente.");
}

const destino = path.resolve(
  process.cwd(),
  "recovery-vercel-blob-antigo-testamento"
);

fs.mkdirSync(destino, { recursive: true });

function baixar(url, arquivo) {
  return new Promise((resolve, reject) => {
    const destinoArquivo = fs.createWriteStream(arquivo);

    https.get(url, (res) => {
      if (
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        destinoArquivo.close();
        fs.unlinkSync(arquivo);
        return baixar(res.headers.location, arquivo)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        destinoArquivo.close();
        reject(
          new Error(`HTTP ${res.statusCode} ao baixar ${url}`)
        );
        return;
      }

      res.pipe(destinoArquivo);

      destinoArquivo.on("finish", () => {
        destinoArquivo.close();
        resolve();
      });
    }).on("error", reject);
  });
}

async function main() {
  const encontrados = [];

  let cursor;

  do {
    const resposta = await list({
      prefix: "materiais-aula/1/",
      cursor,
      limit: 100,
      token,
    });

    encontrados.push(...resposta.blobs);

    cursor = resposta.hasMore
      ? resposta.cursor
      : undefined;

  } while (cursor);

  const candidatos = encontrados.filter((blob) =>
    blob.pathname
      .toLowerCase()
      .includes("apostila-completa-de-antigo-testamento-a")
  );

  console.log("");
  console.log("=== ARQUIVOS ENCONTRADOS ===");
  console.log("Total no prefixo materiais-aula/1/:", encontrados.length);
  console.log("Apostilas candidatas:", candidatos.length);
  console.log("");

  for (const blob of candidatos) {
    const nome = path.basename(blob.pathname);
    const arquivo = path.join(destino, nome);

    console.log("Baixando:", nome);

    await baixar(blob.url, arquivo);

    const stat = fs.statSync(arquivo);

    console.log(
      `OK: ${nome} (${stat.size.toLocaleString("pt-BR")} bytes)`
    );
  }

  fs.writeFileSync(
    path.join(destino, "metadata.json"),
    JSON.stringify(
      candidatos.map((b) => ({
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
        url: b.url,
      })),
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log("Pasta:");
  console.log(destino);
  console.log("");
  console.log("metadata.json também foi criado.");
}

main().catch((erro) => {
  console.error("ERRO:", erro.message);
  process.exit(1);
});
