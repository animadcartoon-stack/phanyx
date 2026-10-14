const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict"), ts = require("typescript");
const root = path.resolve(__dirname, "..");
function carregar(nome) {
  const modulo = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, "lib", nome + ".ts"), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInThisContext(`(function(exports,module,require){${code}\n})`)(modulo.exports, modulo, id => {
    if (id === "./biblioteca-cache-paginas") return carregar("biblioteca-cache-paginas");
    return require(id);
  });
  return modulo.exports;
}
const { CachePaginasLeitor } = carregar("biblioteca-cache-paginas");
const { SessaoPaginasPdf } = carregar("biblioteca-render-paginas");
let testes = 0;
async function teste(nome, fn) { await fn(); testes++; }
function pendente() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }
const canvas = () => ({ width: 0, height: 0, style: {}, dataset: {}, getContext: () => ({ fillRect() {} }) });
const originalDocument = global.document;
global.document = { createElement: () => canvas() };
function documento({ demora, falhar = false } = {}) {
  const estado = { renders: 0, textos: 0, cancelados: 0, consultas: 0 };
  const page = {
    getViewport: ({ scale }) => ({ width: 400 * scale, height: 600 * scale, scale }),
    getTextContent: () => { estado.textos++; return new Promise(() => {}); },
    render: () => { estado.renders++; return { promise: falhar && estado.renders === 1 ? Promise.reject(new Error("Falha simulada")) : demora?.promise || Promise.resolve(), cancel() { estado.cancelados++; demora?.reject(Object.assign(new Error("Cancelado"), { name: "RenderingCancelledException" })); } }; },
  };
  return { estado, pdf: { getPage: async () => { estado.consultas++; return page; } } };
}
(async () => {
  await teste("cache limita a quantidade e preserva páginas recentemente usadas", () => {
    const c = new CachePaginasLeitor(2, 100); c.guardar(1, "a", 10); c.guardar(2, "b", 10); assert.equal(c.obter(1), "a"); c.guardar(3, "c", 10);
    assert.equal(c.obter(2), undefined); assert.equal(c.obter(1), "a");
  });
  await teste("cache respeita orçamento de pixels", () => {
    const c = new CachePaginasLeitor(6, 100); c.guardar(1, "a", 70); c.guardar(2, "b", 40); assert.equal(c.obter(1), undefined); assert.equal(c.obter(2), "b");
    c.guardar(3, "grande", 101); assert.equal(c.obter(3), undefined);
  });
  await teste("substituição não acumula memória", () => {
    const c = new CachePaginasLeitor(6, 100); c.guardar(1, "a", 70); c.guardar(1, "b", 30); c.guardar(2, "c", 60);
    assert.equal(c.obter(1), "b"); assert.equal(c.obter(2), "c"); c.limpar(); assert.equal(c.obter(1), undefined);
  });
  await teste("a imagem fica pronta sem esperar texto lento", async () => {
    const d = documento(), s = new SessaoPaginasPdf(d.pdf, 400, 600, 1);
    const face = await s.preparar(1); assert.equal(d.estado.textos, 0); assert.equal(face.canvas.width, 400); assert.equal(face.canvas.height, 600); s.destruir();
  });
  await teste("uma virada preparada não redesenha nem consulta a página novamente", async () => {
    const d = documento(), s = new SessaoPaginasPdf(d.pdf, 400, 600, 1); const face = await s.preparar(2);
    assert.equal(await s.preparar(2), face); assert.equal(d.estado.renders, 1); assert.equal(d.estado.consultas, 1); s.destruir();
  });
  await teste("clique durante preparo compartilha o trabalho pendente", async () => {
    const espera = pendente(), d = documento({ demora: espera }), s = new SessaoPaginasPdf(d.pdf, 400, 600, 1);
    const a = s.preparar(2), b = s.preparar(2); assert.equal(a, b); espera.resolve(); assert.equal(await a, await b); assert.equal(d.estado.renders, 1); s.destruir();
  });
  await teste("falha de preparo permite tentar novamente", async () => {
    const d = documento({ falhar: true }), s = new SessaoPaginasPdf(d.pdf, 400, 600, 1);
    await assert.rejects(s.preparar(1)); await s.preparar(1); assert.equal(d.estado.renders, 2); s.destruir();
  });
  await teste("sair do documento cancela render e descarta o cache", async () => {
    const espera = pendente(), d = documento({ demora: espera }), s = new SessaoPaginasPdf(d.pdf, 400, 600, 1);
    const render = s.preparar(1); await Promise.resolve(); s.destruir(); await assert.rejects(render); assert.equal(d.estado.cancelados, 1); assert.equal(s.obter(1), undefined);
  });
  await teste("o cache de outro arquivo nunca fornece páginas do anterior", async () => {
    const a = documento(), b = documento(), sa = new SessaoPaginasPdf(a.pdf, 400, 600, 1), sb = new SessaoPaginasPdf(b.pdf, 400, 600, 1);
    await sa.preparar(1); assert.equal(sb.obter(1), undefined); sa.destruir(); sb.destruir();
  });
  await teste("novo tamanho ou zoom tem desenho independente", async () => {
    const d = documento(), a = new SessaoPaginasPdf(d.pdf, 400, 600, 1), b = new SessaoPaginasPdf(d.pdf, 200, 300, 2);
    await a.preparar(1); const face = await b.preparar(1); assert.equal(d.estado.renders, 2); assert.equal(face.canvas.style.width, "200px"); assert.equal(face.viewport.width, 200); a.destruir(); b.destruir();
  });
  console.log(`OK: ${testes} verificações de cache, preparo sem texto, limites, cancelamento e isolamento de PDFs.`);
})().catch(erro => { console.error(erro); process.exitCode = 1; }).finally(() => { global.document = originalDocument; });
