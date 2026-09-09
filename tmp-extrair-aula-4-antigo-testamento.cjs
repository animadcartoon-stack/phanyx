const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

async function main() {
  const origem = path.resolve(
    "recovery-vercel-blob-antigo-testamento",
    "1775843805264-apostila-completa-de-antigo-testamento-a-1UcytMoeKnUAuOaLKgAU7PgzPYBcI0.pdf"
  );

  const pastaDestino = path.resolve(
    "recovery-aula-4-antigo-testamento"
  );

  fs.mkdirSync(pastaDestino, { recursive: true });

  const destino = path.join(
    pastaDestino,
    "AULA 4 - QUAL A IDADE DA TERRA.pdf"
  );

  if (!fs.existsSync(origem)) {
    throw new Error("Apostila completa não encontrada: " + origem);
  }

  const bytes = fs.readFileSync(origem);
  const original = await PDFDocument.load(bytes);

  const novo = await PDFDocument.create();

  // PDF pages 23 a 28 = índices 22 a 27
  const paginas = await novo.copyPages(
    original,
    [22, 23, 24, 25, 26, 27]
  );

  for (const pagina of paginas) {
    novo.addPage(pagina);
  }

  const saida = await novo.save();

  fs.writeFileSync(destino, saida);

  console.log("");
  console.log("=== AULA 4 EXTRAÍDA ===");
  console.log("Arquivo:", destino);
  console.log("Páginas:", paginas.length);
  console.log("Tamanho:", fs.statSync(destino).size, "bytes");
}

main().catch((erro) => {
  console.error("ERRO:", erro.message);
  process.exit(1);
});
