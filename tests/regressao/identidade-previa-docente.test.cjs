const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/documentos-docentes/identidade-automatica.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api});
const route = fs.readFileSync('app/api/admin/documentos/templates/preview-pdf-fiel/route.ts','utf8');
const start = route.indexOf('function substituirExemplos(');
const end = route.indexOf('export async function POST',start);
const scope = {preencherIdentidadeDocente:api.preencherIdentidadeDocente,montarValoresPreviewDocumento:c=>({nomeInstituicao:c.nomeFantasia || 'Instituição Exemplo'}),substituirVariaveisPreviewDocumento:(h,c)=>h.replace(/\{\{institutionName\}\}/g,c.nomeFantasia || 'Instituição Exemplo')};
vm.runInNewContext(ts.transpileModule(route.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nthis.previa=substituirExemplos;',scope);
test('preview resolves both teacher identity aliases without losing formatting',()=>{
 const input='<p><span style="font-family:Segoe Script;color:blue">{{docente:institutionName}}</span> {{docente:nomeInstituicao}} {{institutionName}} {{docente:teacherName}} {{docente:nomeProfessor}}</p>';
 assert.equal(scope.previa(input,{nomeFantasia:'Escola Teste',__documentLocale:'pt-BR'}),'<p><span style="font-family:Segoe Script;color:blue">Escola Teste</span> Escola Teste Escola Teste Professor Exemplo Professor Exemplo</p>');
});
test('preview escapes institution values and localizes sample teacher',()=>{
 assert.equal(scope.previa('<p>{{docente:institutionName}} / {{docente:teacherName}}</p>',{nomeFantasia:'A & B <Teste>',__documentLocale:'en-US'}),'<p>A &amp; B &lt;Teste&gt; / Example Teacher</p>');
});
