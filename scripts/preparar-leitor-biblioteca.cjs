const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const pacote = path.dirname(require.resolve("pdfjs-dist/package.json"));
const destino = path.join(root, "public", "biblioteca", "pdfjs");
const versao = require(path.join(pacote, "package.json")).version;
fs.mkdirSync(destino, { recursive: true });
fs.copyFileSync(path.join(pacote, "build", "pdf.min.mjs"), path.join(destino, "pdf.min.mjs"));
fs.copyFileSync(path.join(pacote, "build", "pdf.worker.min.mjs"), path.join(destino, "pdf.worker.min.mjs"));
fs.copyFileSync(path.join(pacote, "LICENSE"), path.join(destino, "LICENSE"));
for (const pasta of ["cmaps", "standard_fonts", "wasm"]) {
  if (fs.existsSync(path.join(pacote, pasta))) fs.cpSync(path.join(pacote, pasta), path.join(destino, pasta), { recursive: true });
}
// Preserva as URLs anteriores e acrescenta URLs por versão, próprias para cache imutável.
const versionado = path.join(destino, versao);
fs.mkdirSync(versionado, { recursive: true });
for (const arquivo of ["pdf.min.mjs", "pdf.worker.min.mjs", "LICENSE", "cmaps", "standard_fonts", "wasm"]) {
  const origem = path.join(destino, arquivo);
  if (fs.existsSync(origem)) fs.cpSync(origem, path.join(versionado, arquivo), { recursive: true });
}
console.log("OK: arquivos do leitor PDF preparados localmente.");
