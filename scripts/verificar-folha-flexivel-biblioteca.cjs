// Geometria da folha; testes locais sem contas nem dados da instituição.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const assert = require("node:assert/strict"), ts = require("typescript");
const { execFileSync } = require("node:child_process");
const fonte = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/biblioteca-virada-folha.ts"), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const modulo = { exports: {} }; vm.runInThisContext(`(function(exports,module){${fonte}\n})`)(modulo.exports, modulo);
const { curvaFolha, DURACAO_VIRADA_FOLHA } = modulo.exports;
let verificacoes = 0;
function testar(nome, fn) { fn(); verificacoes++; }
function area(pontos) { return Math.abs(pontos.reduce((a, p, i) => { const q = pontos[(i + 1) % pontos.length]; return a + p.x * q.y - p.y * q.x; }, 0)) / 2; }
const w = 460, h = 620;
for (const sentido of ["next", "previous"]) {
  testar("a folha começa inteira: " + sentido, () => {
    const curva = curvaFolha(w, h, 0, sentido);
    assert.ok(Math.abs(area(curva.frente) - w * h) < .0001); assert.equal(area(curva.verso), 0);
  });
  testar("a folha termina fora da página: " + sentido, () => {
    const curva = curvaFolha(w, h, 1, sentido); assert.equal(curva.frente.length, 0); assert.equal(curva.faixas.length, 0);
    assert.ok(curva.verso.every(p => sentido === "next" ? p.x < 0 : p.x > w));
  });
  testar("a curvatura muda ao longo da dobra: " + sentido, () => {
    const curva = curvaFolha(w, h, .4, sentido);
    assert.ok(curva.faixas.length > 20); assert.ok(area(curva.frente) > 0); assert.ok(area(curva.verso) > 0);
    assert.ok(new Set(curva.faixas.map(f => f.matriz.a.toFixed(4))).size > 20);
  });
  testar("a curva mantém coordenadas finitas: " + sentido, () => {
    for (const p of [NaN, -1, .001, .1, .3, .5, .7, .9, .999, 2]) {
      const curva = curvaFolha(w, h, p, sentido);
      assert.ok(curva.progresso >= 0 && curva.progresso <= 1);
      for (const f of curva.faixas) {
        assert.ok(Object.values(f.matriz).every(Number.isFinite)); assert.ok(f.pontos.every(v => Number.isFinite(v.x) && Number.isFinite(v.y)));
      }
    }
  });
}
testar("viradas opostas são simétricas", () => {
  for (const p of [.1, .25, .5, .75, .9]) {
    const a = curvaFolha(w, h, p, "next"), b = curvaFolha(w, h, p, "previous");
    assert.ok(Math.abs(area(a.frente) - area(b.frente)) < .0001);
    assert.ok(Math.abs(area(a.verso) - area(b.verso)) < .0001);
  }
});
testar("as faixas vizinhas se encontram sem saltos", () => {
  const curva = curvaFolha(w, h, .4, "next");
  for (let i = 0; i < curva.faixas.length - 1; i++) {
    const a = curva.faixas[i], b = curva.faixas[i + 1];
    assert.ok(a.pontos.some(p => b.pontos.some(q => Math.hypot(p.x - q.x, p.y - q.y) < .0001)));
  }
});
testar("a animação tem tempo suficiente para uma dobra suave", () => assert.ok(DURACAO_VIRADA_FOLHA >= 600 && DURACAO_VIRADA_FOLHA <= 1400));
execFileSync(process.execPath, [path.join(__dirname, "verificar-leitor-livro.cjs")], { stdio: "inherit" });
console.log(`OK: ${verificacoes} verificações da folha flexível, simetria, continuidade e duração.`);
