const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const {Schema} = require('@tiptap/pm/model');
const {EditorState, TextSelection} = require('@tiptap/pm/state');
const filename = path.resolve(__dirname, '../lib/documentos/cor-selecao-editor.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText, filename);
const {corCssParaHex, obterCorTextoSelecionado} = loaded.exports;
const schema = new Schema({nodes: {doc: {content:'paragraph+'}, paragraph:{content:'text*'}, text:{}}, marks:{textStyle:{attrs:{color:{default:null}}}}});
const mark = color => schema.marks.textStyle.create({color});
function fixture(from, to=from, storedMarks=null) {
  const doc = schema.node('doc',null,[schema.node('paragraph',null,[schema.text('Azul',[mark('#1a5db3')]),schema.text(' azul',[mark('rgb(26, 93, 179)')]),schema.text(' vermelho',[mark('#ff0000')]),schema.text(' normal')])]);
  const state=EditorState.create({doc,selection:TextSelection.create(doc,from,to),storedMarks});
  let consultas=0;
  const colors = new Map();
  doc.descendants((node,pos)=>{if(node.isText) for(let i=pos;i<pos+node.nodeSize;i++) colors.set(i,node.marks[0]?.attrs.color || 'rgb(15, 23, 42)');});
  return {state,consultas:()=>consultas,view:{dom:{ownerDocument:{defaultView:{getComputedStyle:element=>({color:element.cor})}}},domAtPos(pos){consultas++;return {node:{nodeType:3,parentElement:{cor:colors.get(pos)||'rgb(15, 23, 42)'}},offset:0};}}};
}
test('normaliza HEX e RGB sem perder canais; recusa valores inválidos ou translúcidos',()=>{
  for(const [css,hex] of [['#AbC','#aabbcc'],['#1A5DB3','#1a5db3'],['rgb(26, 93, 179)','#1a5db3'],['rgb(26 93 179 / 1)','#1a5db3'],['rgba(0, 255, 0, 1)','#00ff00']]) assert.equal(corCssParaHex(css),hex);
  for(const css of ['rgba(0, 0, 0, 0.5)','rgb(999, 0, 0)','invalid','']) assert.equal(corCssParaHex(css),null);
});
test('seleção de uma única cor reconhece formatos HEX e RGB equivalentes',()=>{
  assert.equal(obterCorTextoSelecionado(fixture(1,10)),'#1a5db3');
});
test('seleção parcial não inclui o trecho vermelho vizinho',()=>{
  assert.equal(obterCorTextoSelecionado(fixture(2,9)),'#1a5db3');
});
test('seleção com várias cores não informa uma cor única falsa',()=>{
  assert.equal(obterCorTextoSelecionado(fixture(1,15)),null);
  assert.equal(obterCorTextoSelecionado(fixture(15,25)),null);
});
test('texto sem marca usa a cor herdada realmente calculada no documento',()=>{
  assert.equal(obterCorTextoSelecionado(fixture(20,25)),'#0f172a');
});
test('cursor usa a cor da próxima digitação e acompanha mudança de cor sem texto novo',()=>{
  assert.equal(obterCorTextoSelecionado(fixture(2)),'#1a5db3');
  const editor=fixture(2,2,[mark('#00ff00')]);
  assert.equal(obterCorTextoSelecionado(editor),'#00ff00');
  assert.equal(editor.consultas(),0);
});
test('consulta da seleção não modifica o documento nem dispara transações',()=>{
  const editor=fixture(1,10);const before=JSON.stringify(editor.state.toJSON());
  editor.view.dispatch=()=>assert.fail('A leitura não deve despachar transações');
  obterCorTextoSelecionado(editor);
  assert.equal(JSON.stringify(editor.state.toJSON()),before);
});
test('mensagens de cores diferentes e HEX existem nos cinco idiomas',()=>{
  for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']) {
    const main=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../messages/${locale}.json`),'utf8')).AdminDocumentsEditorToolbar.main;
    assert.ok(main.mixedTextColors); assert.match(main.textColorHex,/HEX/);
  }
});
