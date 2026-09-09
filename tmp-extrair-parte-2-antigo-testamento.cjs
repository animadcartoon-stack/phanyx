const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PDFDocument } = require("pdf-lib");

function sha256(bytes) {
  return crypto
    .createHash("sha256")
    .update(bytes)
    .digest("hex")
    .toUpperCase();
}

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
    tamanho: bytes.length,
    sha256: sha256(bytes)
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

  const pasta = path.resolve(
    "recovery-parte-2-antigo-testamento"
  );

  fs.mkdirSync(pasta, { recursive: true });

  const original = await PDFDocument.load(
    fs.readFileSync(origem)
  );

  const partes = [
    {
      tipo: "introducao",
      inicio: 73,
      fim: 73,
      arquivo: "PARTE 2 - INTRODUÇÃO.pdf"
    },
    {
      aula: 1,
      inicio: 74,
      fim: 82,
      arquivo: "PARTE 2 - AULA 1 - ABRAÃO, SUA ÉPOCA E SEU CHAMADO.pdf"
    },
    {
      aula: 2,
      inicio: 83,
      fim: 87,
      arquivo: "PARTE 2 - AULA 2 - ABRAÃO E LÓ SE SEPARAM.pdf"
    },
    {
      aula: 3,
      inicio: 88,
      fim: 96,
      arquivo: "PARTE 2 - AULA 3 - ABRAÃO, ISAQUE E JACÓ.pdf"
    },
    {
      aula: 4,
      inicio: 97,
      fim: 107,
      arquivo: "PARTE 2 - AULA 4 - O EGITO.pdf"
    },
    {
      aula: 5,
      inicio: 108,
      fim: 112,
      arquivo: "PARTE 2 - AULA 5 - A ORIGEM DA NAÇÃO DE ISRAEL NO EGITO.pdf"
    },
    {
      aula: 6,
      inicio: 113,
      fim: 123,
      arquivo: "PARTE 2 - AULA 6 - O ÊXODO - PARTE I.pdf"
    },
    {
      aula: 7,
      inicio: 124,
      fim: 130,
      arquivo: "PARTE 2 - AULA 7 - O ÊXODO - PARTE II.pdf"
    },
    {
      aula: 8,
      inicio: 131,
      fim: 134,
      arquivo: "PARTE 2 - AULA 8 - ISRAEL NO SINAI.pdf"
    },
    {
      aula: 9,
      inicio: 135,
      fim: 151,
      arquivo: "PARTE 2 - AULA 9 - O TABERNÁCULO.pdf"
    },
    {
      aula: 10,
      inicio: 152,
      fim: 156,
      arquivo: "PARTE 2 - AULA 10 - RUMO A CANAÃ.pdf"
    },
    {
      aula: 11,
      inicio: 157,
      fim: 163,
      arquivo: "PARTE 2 - AULA 11 - A CONQUISTA DE CANAÃ.pdf"
    }
  ];

  const metadata = [];

  console.log("");
  console.log("=== EXTRAÇÃO PARTE 2 ===");

  for (const item of partes) {
    const destino = path.join(pasta, item.arquivo);

    const resultado = await extrair(
      original,
      item.inicio,
      item.fim,
      destino
    );

    metadata.push({
      aula: item.aula || null,
      tipo: item.tipo || "aula",
      paginasOriginais: `${item.inicio}-${item.fim}`,
      arquivo: item.arquivo,
      paginas: resultado.paginas,
      tamanho: resultado.tamanho,
      sha256: resultado.sha256
    });

    console.log("");
    console.log(
      item.aula
        ? `Aula ${item.aula}`
        : "Introdução"
    );

    console.log(
      `  páginas: ${item.inicio}-${item.fim}`
    );
    console.log(
      `  extraídas: ${resultado.paginas}`
    );
    console.log(
      `  tamanho: ${resultado.tamanho} bytes`
    );
    console.log(
      `  SHA256: ${resultado.sha256}`
    );
  }

  fs.writeFileSync(
    path.join(pasta, "metadata-parte-2.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  console.log("");
  console.log("=== CONCLUÍDO ===");
  console.log("Pasta:");
  console.log(pasta);
  console.log("");
  console.log("metadata-parte-2.json criado.");
}

main().catch((erro) => {
  console.error("");
  console.error("ERRO:", erro.message);
  process.exit(1);
});
