"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
function carregar(caminho) {
  const nome = path.resolve(__dirname, "..", caminho);
  const modulo = new Module(nome, module);
  modulo.filename = nome;
  modulo.paths = Module._nodeModulePaths(path.dirname(nome));
  modulo._compile(ts.transpileModule(fs.readFileSync(nome, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, nome);
  return modulo.exports;
}
const { lerRespostaPerfilJson } = carregar("lib/client/ler-resposta-perfil.ts");
const { prepararFotoPerfil } = carregar("lib/client/preparar-foto-perfil.ts");
test("resposta 413 em texto recebe mensagem clara sem lançar SyntaxError", async () => {
  await assert.rejects(lerRespostaPerfilJson(new Response("A server error", { status: 413, headers: { "Content-Type": "text/plain" } }), "Falha no envio"), /limite/);
});
test("resposta 500 em texto preserva o HTTP e nao mostra conteudo bruto", async () => {
  await assert.rejects(lerRespostaPerfilJson(new Response("A server error", { status: 500 }), "Falha ao guardar"), /HTTP 500/);
});
test("erro JSON da API e sucesso JSON sao mantidos", async () => {
  await assert.rejects(lerRespostaPerfilJson(Response.json({ error: "Falha de teste" }, { status: 400 }), "Erro"), /Falha de teste/);
  assert.deepEqual(await lerRespostaPerfilJson(Response.json({ fotoPerfil: "foto" }), "Erro"), { fotoPerfil: "foto" });
  await assert.rejects(lerRespostaPerfilJson(new Response("ok", { status: 200 }), "Erro"), /resposta invalida/);
});
test("arquivo pequeno e preservado e arquivo maior que 5 MB e rejeitado", async () => {
  const foto = new File(["abc"], "foto.jpg", { type: "image/jpeg" });
  assert.equal(await prepararFotoPerfil(foto), foto);
  const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "foto.jpg", { type: "image/jpeg" });
  await assert.rejects(prepararFotoPerfil(grande), /5 MB/);
});
test("foto entre 4 MB e 5 MB e reduzida antes de enviar", async () => {
  const originalBitmap = global.createImageBitmap, originalDoc = global.document;
  let fechou = false;
  global.createImageBitmap = async () => ({ width: 3000, height: 2000, close() { fechou = true; } });
  global.document = { createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob: done => done(new Blob(["arquivo pequeno"], { type: "image/webp" })),
  }) };
  try {
    const grande = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "foto.jpg", { type: "image/jpeg" });
    const reduzida = await prepararFotoPerfil(grande);
    assert.equal(reduzida.type, "image/webp");
    assert.ok(reduzida.size < grande.size);
    assert.equal(fechou, true);
  } finally {
    if (originalBitmap === undefined) delete global.createImageBitmap; else global.createImageBitmap = originalBitmap;
    if (originalDoc === undefined) delete global.document; else global.document = originalDoc;
  }
});
test("rotas e interfaces nao dependem do cadastro Funcionario para foto administrativa", () => {
  const arquivo = p => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
  assert.match(arquivo("app/api/funcionario/foto-perfil/imagem/route.ts"), /perfilAdministrativoUsuario\.findUnique/);
  assert.match(arquivo("app/admin/AdminShell.tsx"), /phanyx:perfil-atualizado/);
  assert.match(arquivo("app/admin/perfil/page.tsx"), /lerRespostaPerfilJson/);
  assert.match(arquivo("app/admin/perfil/page.tsx"), /prepararFotoPerfil/);
  assert.match(arquivo("app/api/admin/funcionarios/me/route.ts"), /body\.telefone === undefined/);
});
