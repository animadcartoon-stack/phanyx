"use strict";
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict"), ts = require("typescript");
const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/biblioteca-cores-marcacoes.ts"), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const modulo = { exports: {} };
vm.runInNewContext(codigo, { exports: modulo.exports, module: modulo });
const { CORES_MARCACOES, rgbMarcacao, textoMarcacaoBranco, pintarMarcacoesPdf } = modulo.exports;
let verificacoes = 0;
function testar(nome, fn) { fn(); verificacoes++; }
function luminancia(rgb) { const v = rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; }
for (const cor of Object.keys(CORES_MARCACOES)) {
  testar("texto mantém contraste mínimo de 4,5:1: " + cor, () => {
    const l = luminancia(rgbMarcacao(cor));
    assert.ok((textoMarcacaoBranco(cor) ? 1.05 / (l + .05) : (l + .05) / .05) >= 4.5);
  });
}
testar("azul-marinho usa letras brancas", () => assert.equal(textoMarcacaoBranco("AZUL"), true));
testar("cores claras usam letras escuras", () => { for (const cor of ["AMARELO", "VERDE", "ROSA"]) assert.equal(textoMarcacaoBranco(cor), false); });
testar("código desconhecido mantém amarelo legível", () => assert.deepEqual([...rgbMarcacao("inexistente")], [255, 255, 0]));
testar("cada desenho começa na página limpa e restaura o estado gráfico", () => {
  const chamadas = [], ctx = new Proxy({ canvas: { width: 100, height: 200 } }, { get(obj, nome) {
    if (nome in obj) return obj[nome]; return (...args) => chamadas.push([nome, ...args]);
  } });
  const original = { width: 100, height: 200 };
  pintarMarcacoesPdf(ctx, original, { x: 0, y: 0, w: 1, h: 1 }, [{ cor: "AZUL", areas: [{ x: .1, y: .2, largura: .5, altura: .1 }] }]);
  assert.equal(chamadas[0][0], "save"); assert.equal(chamadas.at(-1)[0], "restore");
  const desenhos = chamadas.filter(c => c[0] === "drawImage"); assert.equal(desenhos.length, 2);
  assert.ok(desenhos.every(c => c[1] === original));
});
console.log("OK: " + verificacoes + " verificações de cores vivas, contraste automático e preservação da página original.");
