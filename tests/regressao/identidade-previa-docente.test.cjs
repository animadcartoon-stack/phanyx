const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/documentos-docentes/identidade-automatica.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api});
const academic = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/documentos-docentes/academico-automatico.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:academic});
const route = fs.readFileSync('app/api/admin/documentos/templates/preview-pdf-fiel/route.ts','utf8');
const start = route.indexOf('function substituirExemplos(');
const end = route.indexOf('export async function POST',start);
const scope = {preencherAcademico:academic.preencherAcademico,preencherIdentidadeDocente:api.preencherIdentidadeDocente,montarValoresPreviewDocumento:c=>({nomeInstituicao:c.nomeFantasia || 'Instituição Exemplo'}),substituirVariaveisPreviewDocumento:(h,c)=>h.replace(/\{\{institutionName\}\}/g,c.nomeFantasia || 'Instituição Exemplo')};
vm.runInNewContext(ts.transpileModule(route.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+'\nthis.previa=substituirExemplos;',scope);
test('preview resolves both teacher identity aliases without losing formatting',()=>{
 const input='<p><span style="font-family:Segoe Script;color:blue">{{docente:institutionName}}</span> {{docente:nomeInstituicao}} {{institutionName}} {{docente:teacherName}} {{docente:nomeProfessor}}</p>';
 assert.equal(scope.previa(input,{nomeFantasia:'Escola Teste',__documentLocale:'pt-BR'}),'<p><span style="font-family:Segoe Script;color:blue">Escola Teste</span> Escola Teste Escola Teste Professor Exemplo Professor Exemplo</p>');
});
test('preview escapes institution values and localizes sample teacher',()=>{
 assert.equal(scope.previa('<p>{{docente:institutionName}} / {{docente:teacherName}}</p>',{nomeFantasia:'A & B <Teste>',__documentLocale:'en-US'}),'<p>A &amp; B &lt;Teste&gt; / Example Teacher</p>');
});

test('preview academic aliases preserve formatting in all five locales',()=>{
 const input='<p><span style="font-family:Segoe Script;color:orange">{{docente:courseName}}</span> {{docente:nomeCurso}} / {{docente:className}} {{docente:nomeTurma}} / {{docente:subjectName}} {{docente:nomeDisciplina}}</p>';
 for(const [locale,course,group,subject] of [['pt-BR','curso aqui','turma aqui','disciplina aqui'],['pt-PT','curso aqui','turma aqui','disciplina aqui'],['en-US','course here','class here','subject here'],['es-ES','curso aquí','grupo aquí','asignatura aquí'],['fr-FR','cursus ici','classe ici','matière ici']]) {
  assert.equal(scope.previa(input,{nomeFantasia:'Escola Teste',__documentLocale:locale}),'<p><span style="font-family:Segoe Script;color:orange">'+course+'</span> '+course+' / '+group+' '+group+' / '+subject+' '+subject+'</p>');
 }
});

test('a prévia preserva a tabela e a seção depois de um campo incompleto', () => {
 const periodo = '<p>Período: <span>{{campo:periodoD</span></p>';
 const tabela = '<table data-phanyx-table-mode="free" style="left: 200px; top: 150px"><tbody>' +
  '<tr><th colspan="2" style="background-color: #c81d36"><p>Abacaxi</p></th></tr>' +
  '<tr><td><p></p></td><td><p></p></td></tr></tbody></table>';
 const secao = '<hr><h2>1. TEMA DA AULA</h2>';
 const objetivo = '<h2>2. OBJETIVOS DE APRENDIZAGEM</h2>';
 const html = periodo + tabela + secao + '<p>{{campo:tema}}</p>' + objetivo;

 assert.equal(scope.previa(html, {}), periodo + tabela + secao + '<p>-</p>' + objetivo);
});

test('a prévia substitui apenas marcadores inteiros sem consumir outras linhas ou marcas HTML', () => {
 const fragmento = '<span>{{campo:incompleto</span><strong>texto</strong><span>}}</span>';
 const quebra = '{{campo:rascunho\ntexto da próxima linha}}';
 const html = `<p>${fragmento} ${quebra} {{campo:parcial {{campo:Plano de aula|linhas:3}}</p>`;

 assert.equal(scope.previa(html, {}), `<p>${fragmento} ${quebra} {{campo:parcial -</p>`);
});
