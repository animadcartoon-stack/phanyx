const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname,'../lib/documentos-docentes/identidade-automatica.ts');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api,module:{exports:api}},{filename:file});
const preencher = api.preencherIdentidadeDocente;
const dados = {professor:'Maria Silva',instituicao:'Escola Exemplo'};
test('resolve identidade em portugues e ingles',()=>{
  assert.equal(preencher('<p>{{docente:teacherName}} / {{docente:nomeProfessor}} / {{docente:institutionName}} / {{docente:nomeInstituicao}}</p>',dados),'<p>Maria Silva / Maria Silva / Escola Exemplo / Escola Exemplo</p>');
});
test('preserva os campos manuais e as variaveis tradicionais',()=>{
  const html = '<p>{{campo:Professor}} {{campo:Período}} {{nomeInstituicao}} {{campo:Objetivos|linhas:5}}</p>';
  assert.equal(preencher(html,dados),html);
});
test('um snapshot separado para cada destinatario',()=>{
  const html='<p>{{docente:teacherName}}</p>';
  const primeiro=preencher(html,dados);
  const segundo=preencher(html,{...dados,professor:'João Lima'});
  assert.equal(primeiro,'<p>Maria Silva</p>');
  assert.equal(segundo,'<p>João Lima</p>');
  assert.equal(preencher(primeiro,{...dados,professor:'Outro nome'}),primeiro);
});
test('escapa HTML e marcadores em valores reais',()=>{
  const html = preencher('<p>{{docente:teacherName}}</p>',{...dados,professor:'<img src=x> & {{campo:Teste}}'});
  assert.equal(html,'<p>&lt;img src=x&gt; &amp; &#123;&#123;campo:Teste&#125;&#125;</p>');
});
test('nao troca dentro de atributos ou comentarios',()=>{
  const html='<p title="a > {{docente:teacherName}}">{{docente:teacherName}}</p><!-- {{docente:institutionName}} -->';
  assert.equal(preencher(html,dados),'<p title="a > {{docente:teacherName}}">Maria Silva</p><!-- {{docente:institutionName}} -->');
});