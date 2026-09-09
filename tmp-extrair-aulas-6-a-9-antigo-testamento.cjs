const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

async function extrair(original, inicio, fim, destino) {
  const novo = await PDFDocument.create();
  const indices = [];

  for (let pagina = inicio; pagina <= fim; pagina++) {
    indices.push(pagina - 1);
  }

  const paginas = await novo.copyPages(original, indices);

  for (const pagina of paginas) {
    novo.addPage(pagina);
  }

  const bytes = await novo.save();

  fs.writeFileSync(destino, bytes);

  return {
    paginas: paginas.length,
    tamanho: bytes.length
  };
}

async function main() {
  const origem = path.resolve(
    "recovery-vercel-blob-antigo-testamento",
    "1775843805264-apostila-completa-de-antigo-testamento-a-1UcytMoeKnUAuOaLKgAU7PgzPYBcI0.pdf"
  );

  if (!fs.existsSync(origem)) {
    throw new Error("Apostila completa não encontrada: " + origem);
  }

  const destino = path.resolve(
    "recovery-aulas-6-a-9-antigo-testamento"
  );

  fs.mkdirSync(destino, { recursive: true });

  const bytes = fs.readFileSync(origem);
  const original = await PDFDocument.load(bytes);

  const aulas = [
    {
      numero: 6,
      inicio: 36,
      fim: 45,
      arquivo: "AULA 6 - ENTENDENDO O RELATO BÍBLICO DA CRIAÇÃO.pdf"
    },
    {
      numero: 7,
      inicio: 46,
      fim: 53,
      arquivo: "AULA 7 - NARRATIVA BABILÔNICA DA CRIAÇÃO E A QUEDA.pdf"
    },
    {
      numero: 8,
      inicio: 54,
      fim: 62,
      arquivo: "AULA 8 - O DILÚVIO BÍBLICO.pdf"
    },
    {
      numero: 9,
      inicio: 63,
      fim: 69,
      arquivo: "AULA 9 - A TORRE DE BABEL E A ORIGEM DAS NAÇÕES.pdf"
    }
  ];

  console.log("");
  console.log("=== EXTRAÇÃO DAS AULAS 6 A 9 ===");

  for (const aula of aulas) {
    const arquivoDestino = path.join(destino, aula.arquivo);

    const resultado = await extrair(
      original,
      aula.inicio,
      aula.fim,
      arquivoDestino
    );

    console.log("");
    console.log(`Aula ${aula.numero}:`);
    console.log(`  páginas originais: ${aula.inicio}-${aula.fim}`);
    console.log(`  páginas extraídas: ${resultado.paginas}`);
    console.log(`  tamanho: ${resultado.tamanho} bytes`);
    console.log(`  arquivo: ${arquivoDestino}`);
  }

  console.log("");
  console.log("=== CONCLUÍDO ===");
  console.log("Pasta:");
  console.log(destino);
}

main().catch((erro) => {
  console.error("ERRO:", erro.message);
  process.exit(1);
});
