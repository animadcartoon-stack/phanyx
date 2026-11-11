const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

function carregar(nome) {
  const arquivo = resolve(__dirname, "../lib/documentos-docentes", nome);
  const { outputText } = ts.transpileModule(readFileSync(arquivo, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  runInNewContext(outputText, { module, exports: module.exports, URL, require: () => ({}) }, { filename: arquivo });
  return module.exports;
}

test("importa fragmentos adjacentes como uma palavra e mantém a ordem das linhas do PDF", () => {
  const { linhasDeItensPdf } = carregar("texto-editavel-pdf.ts");
  const item = (str, x, y, width, hasEOL = false) => ({ str, transform: [12, 0, 0, 12, x, y], width, hasEOL, dir: "ltr" });
  assert.deepEqual(Array.from(linhasDeItensPdf([
    item("Obje", 10, 100, 22),
    item("tivo", 32, 100, 17),
    item("geral", 54, 100, 25),
    item("Conteúdo", 10, 80, 46, true),
    item("Atividades", 10, 60, 47),
  ])), ["Objetivo geral", "Conteúdo", "Atividades"]);
});

test("insere imagens em escala original e limita o tamanho mantendo a proporção", () => {
  const { dimensoesImagemPdf } = carregar("imagem-pdf-local.ts");
  assert.equal(dimensoesImagemPdf(240, 120, 600, 500).width, 180);
  assert.equal(dimensoesImagemPdf(240, 120, 600, 500).height, 90);
  const redimensionada = dimensoesImagemPdf(240, 120, 500, 500, 220);
  assert.equal(redimensionada.width, 220);
  assert.equal(redimensionada.height, 110);
  const limitada = dimensoesImagemPdf(1000, 2000, 600, 100);
  assert.equal(limitada.width, 50);
  assert.equal(limitada.height, 100);
});

test("gera o timbrado da primeira página e restringe a origem da imagem", () => {
  const { cssImpressaoPapelPdf, logoPapelPdf, papelPadrao } = carregar("papel-texto-pdf.ts");
  const origem = "https://www.phanyx.com.br";
  assert.equal(logoPapelPdf("/logo.png", origem), `${origem}/logo.png`);
  assert.equal(logoPapelPdf("javascript:alert(1)", origem), null);
  assert.equal(logoPapelPdf("https://conta:senha@example.com/logo.png", origem), null);
  const css = cssImpressaoPapelPdf({ ...papelPadrao, modelo: "marca", primeira: "branco" }, {
    nome: 'Instituição "Teste" </style>', logoUrl: `${origem}/logo.png`,
  });
  assert.match(css, /@page :first/);
  assert.match(css, /background-image:linear-gradient/);
  assert.match(css, /@page :first\s*\{[\s\S]+background-image:none/);
  assert.doesNotMatch(css, /<\/style>/);
});
