const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const { history, redo, undo } = require("@tiptap/pm/history");
const { Schema } = require("@tiptap/pm/model");
const { EditorState, TextSelection } = require("@tiptap/pm/state");

const raiz = path.resolve(__dirname, "../..");
const arquivo = path.join(raiz, "lib/documentos/limpar-fim-modelo.ts");
const modulo = new Module(arquivo, module);
modulo.paths = module.paths;
modulo._compile(ts.transpileModule(fs.readFileSync(arquivo, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, arquivo);
const { limparFimModelo } = modulo.exports;

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    heading: { group: "block", content: "inline*" },
    pageBreak: { group: "block", atom: true },
    table: { group: "block", content: "paragraph+" },
    image: { group: "inline", inline: true },
    hardBreak: { group: "inline", inline: true },
    linhaDigitadaPHANYX: { group: "inline", inline: true, atom: true },
    text: { group: "inline" },
  },
  marks: { bold: {} },
});
const paragrafo = (...nos) => schema.node("paragraph", null, nos);
const quebra = schema.node("hardBreak");
const guia = schema.node("pageBreak");
const estado = (...blocos) => EditorState.create({
  doc: schema.node("doc", null, blocos),
  plugins: [history()],
});

test("remove linhas vazias e a guia da página final, mantendo as linhas entre seções", () => {
  const titulo = schema.node("heading", null, schema.text("Plano de Aula"));
  const ultimaSecao = paragrafo(schema.text("Avaliação", [schema.mark("bold")]));
  const separador = paragrafo();
  const inicial = estado(titulo, separador, ultimaSecao, guia, paragrafo(quebra), paragrafo(schema.text("\u00a0\u200b")));
  const alterado = inicial.apply(limparFimModelo(inicial));
  assert.ok(alterado.doc.eq(estado(titulo, separador, ultimaSecao).doc));
  assert.equal(limparFimModelo(alterado), null);
});

test("remove apenas as quebras de linha no fim do último parágrafo", () => {
  const nome = schema.text("Nome");
  const docente = schema.text("{{docente:teacherName}}", [schema.mark("bold")]);
  const inicial = estado(paragrafo(nome, quebra, docente, quebra, schema.text("\u00a0"), quebra), paragrafo());
  const alterado = inicial.apply(limparFimModelo(inicial));
  assert.ok(alterado.doc.eq(estado(paragrafo(nome, quebra, docente)).doc));
});

test("preserva tabela, imagem, campo preenchível e bloco de assinatura", () => {
  const assinatura = paragrafo(schema.text("{{blocoAssinaturaDiretor}}"));
  const campo = paragrafo(schema.node("linhaDigitadaPHANYX"));
  const figura = paragrafo(schema.node("image"));
  const tabela = schema.node("table", null, paragrafo());
  const inicial = estado(assinatura, campo, figura, tabela, guia, paragrafo());
  const alterado = inicial.apply(limparFimModelo(inicial));
  assert.ok(alterado.doc.eq(estado(assinatura, campo, figura, tabela).doc));
  assert.equal(limparFimModelo(alterado), null);
});

test("deixa um parágrafo editável no modelo vazio e não remove um título vazio", () => {
  const inicial = estado(paragrafo(quebra), guia, paragrafo());
  const alterado = inicial.apply(limparFimModelo(inicial));
  assert.ok(alterado.doc.eq(estado(paragrafo()).doc));
  assert.equal(limparFimModelo(alterado), null);
  assert.equal(limparFimModelo(estado(schema.node("heading"))), null);
});

test("remapeia o cursor da folha removida e desfaz a limpeza em uma ação", () => {
  let atual = estado(paragrafo(schema.text("Conteúdo"), quebra), guia, paragrafo());
  atual = atual.apply(atual.tr.setSelection(TextSelection.atEnd(atual.doc)));
  const anterior = atual.doc;
  atual = atual.apply(limparFimModelo(atual));
  assert.equal(atual.selection.$from.parent.textContent, "Conteúdo");
  const limpo = atual.doc;
  assert.ok(undo(atual, tr => { atual = atual.apply(tr); }));
  assert.ok(atual.doc.eq(anterior));
  assert.ok(redo(atual, tr => { atual = atual.apply(tr); }));
  assert.ok(atual.doc.eq(limpo));
});

test("oferece a limpeza na barra do editor e nos cinco idiomas", () => {
  const editor = fs.readFileSync(path.join(raiz, "components/documentos/EditorTemplatePHANYX.tsx"), "utf8");
  assert.match(editor, /onClick=\{limparLinhasVaziasDoFim\}/);
  for (const locale of ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"]) {
    const mensagens = JSON.parse(fs.readFileSync(path.join(raiz, `messages/${locale}.json`), "utf8"));
    const rotulos = mensagens.AdminDocumentsEditorToolbar.main;
    for (const chave of ["cleanEnd", "endCleaned", "endAlreadyClean"]) assert.ok(rotulos[chave], `${locale} ${chave}`);
  }
});
