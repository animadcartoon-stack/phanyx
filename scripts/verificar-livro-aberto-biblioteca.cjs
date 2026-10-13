const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), ts = require("typescript");
const assert = require("node:assert/strict"), { execFileSync } = require("node:child_process");
function carregar(nome) {
  const modulo = { exports: {} }, fonte = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/" + nome + ".ts"), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInThisContext(`(function(exports,module){${fonte}\n})`)(modulo.exports, modulo); return modulo.exports;
}
const { paginasLivro, destinoViradaLivro } = carregar("biblioteca-livro-paginas");
const { malhaFolha, COLUNAS_FOLHA, LINHAS_FOLHA } = carregar("biblioteca-folha-3d");
let count = 0;
function teste(nome, fn) { fn(); count++; }
teste("a primeira página fica à direita", () => assert.deepEqual(paginasLivro(1, 8, true), { esquerda: null, direita: 1 }));
teste("as páginas 2 e 3 formam a mesma abertura", () => assert.deepEqual(paginasLivro(2, 8, true), paginasLivro(3, 8, true)));
teste("o último número par não inventa página posterior", () => assert.deepEqual(paginasLivro(8, 8, true), { esquerda: 8, direita: null }));
teste("o modo individual mantém a página selecionada", () => assert.deepEqual(paginasLivro(3, 8, false), { esquerda: null, direita: 3 }));
teste("a primeira virada abre as páginas 2 e 3", () => assert.equal(destinoViradaLivro(1, 8, true, 1), 2));
teste("uma folha avança duas páginas impressas", () => assert.equal(destinoViradaLivro(2, 8, true, 1), 4));
teste("o retorno da primeira abertura volta à página 1", () => assert.equal(destinoViradaLivro(3, 8, true, -1), 1));
teste("a última abertura não avança", () => assert.equal(destinoViradaLivro(7, 7, true, 1), 7));
teste("o modo individual avança uma página", () => assert.equal(destinoViradaLivro(2, 8, false, 1), 3));
for (const sentido of ["next", "previous"]) {
  teste("a folha permanece presa à lombada: " + sentido, () => {
    for (const p of [0, .1, .3, .5, .8, 1]) {
      const mesh = malhaFolha(400, 600, p, sentido, true); assert.ok([...mesh].every(Number.isFinite));
      for (let y = 0; y <= LINHAS_FOLHA; y++) { const i = y * (COLUNAS_FOLHA + 1) * 5; assert.equal(mesh[i], 400); assert.equal(mesh[i + 2], 0); }
    }
  });
  teste("a folha pousa inteira na página oposta: " + sentido, () => {
    const mesh = malhaFolha(400, 600, 1, sentido, true);
    const edge = COLUNAS_FOLHA * 5; assert.ok(Math.abs(mesh[edge] - (sentido === "next" ? 0 : 800)) < .001); assert.ok(Math.abs(mesh[edge + 2]) < .001);
  });
  teste("a folha flexiona e levanta ao longo da largura: " + sentido, () => {
    const mesh = malhaFolha(400, 600, .4, sentido, true); const zs = Array.from({ length: COLUNAS_FOLHA + 1 }, (_, i) => mesh[i * 5 + 2]);
    assert.ok(Math.max(...zs) > 200); assert.ok(zs[10] / 10 > zs[40] / 40 || zs[10] / 10 < zs[40] / 40);
  });
  teste("o papel mantém o comprimento durante a virada: " + sentido, () => {
    for (const p of [.15, .4, .6, .85]) {
      const mesh = malhaFolha(400, 600, p, sentido, true);
      for (const y of [0, 12, 24]) {
        let length = 0;
        for (let x = 1; x <= COLUNAS_FOLHA; x++) {
          const i = (y * (COLUNAS_FOLHA + 1) + x) * 5, j = i - 5;
          length += Math.hypot(mesh[i] - mesh[j], mesh[i + 1] - mesh[j + 1], mesh[i + 2] - mesh[j + 2]);
        }
        assert.ok(Math.abs(length - 400) < 2);
      }
    }
  });
}
execFileSync(process.execPath, [path.join(__dirname, "verificar-folha-flexivel-biblioteca.cjs")], { stdio: "inherit" });
console.log(`OK: ${count} verificações de lombada, flexão do papel, paginação e aberturas.`);
