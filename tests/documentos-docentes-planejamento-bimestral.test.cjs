const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname, '../lib/documentos-docentes/campos-impressao.ts');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api,module:{exports:api}},{filename:file});
const nomes = ['Período','Modalidade','Professor','Turma','Objetivos','Conteúdo','Materiais','Desenvolvimento','Avaliação','Observações'];
const html = nomes.map(n=>`<p><strong>${n}:</strong> {{campo:${n}}}</p>`).join('');
test('reconhece os dez campos do planejamento bimestral, com acentos',()=>{
  assert.deepEqual(Array.from(api.camposModeloDocente(html)),nomes);
  for(const n of nomes){ assert.equal(api.nomeCampoDocenteValido(n),true); assert.equal(api.marcadorCampoDocente(n,1),`{{campo:${n}}}`); }
});
test('renderiza cada campo preenchido sem deixar marcadores',()=>{
  const dados = Object.fromEntries(nomes.map((n,i)=>[n,`Valor ${i+1} — ${n}`]));
  const saida = api.renderizarCamposDocentes(html,dados);
  for(const valor of Object.values(dados)) assert.ok(saida.includes(valor));
  assert.ok(!saida.includes('{{campo:'));
  assert.equal((saida.match(/phanyx-campo-docente-preenchido/g)||[]).length,10);
});
test('impressao em branco e quantidade de linhas',()=>{
  const branco = api.renderizarCamposDocentes(html,{},true);
  assert.equal((branco.match(/phanyx-campo-docente-em-branco/g)||[]).length,10);
  const alterado = api.atualizarLinhasCampoDocente(html,'Conteúdo',5);
  assert.equal(alterado.quantidade,1);
  assert.ok(alterado.html.includes('{{campo:Conteúdo|linhas:5}}'));
  assert.deepEqual(Array.from(api.camposModeloDocente(alterado.html)),nomes);
  assert.equal((api.renderizarCamposDocentes('{{campo:Conteúdo|linhas:5}}',{},true).match(/border-bottom:1px/g)||[]).length,5);
  assert.equal(api.renderizarCamposDocentes('{{campo:Conteúdo|linhas:0}}',{},true),'');
});
test('texto do professor e escapado e preserva quebras de linha',()=>{
  const saida=api.renderizarCamposDocentes('{{campo:Avaliação}}',{'Avaliação':'<script>alert(1)</script>\nSegunda linha'});
  assert.ok(!saida.includes('<script>'));
  assert.ok(saida.includes('&lt;script&gt;'));
  assert.ok(saida.includes('<br />Segunda linha'));
});