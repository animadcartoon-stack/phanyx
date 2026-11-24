const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname,'../lib/documentos/contextos-documento.ts');
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api,module:{exports:api}},{filename:file});
test('contextos institucionais e docentes coexistem',()=>{
 const opcoes=api.contextosOutros([],[]);
 for(const c of ['INSTITUCIONAL','FINANCEIRO','JURIDICO','DOCENTE_PLANO_AULA','RH','CANCELAMENTO_MATRICULA']) assert.ok(opcoes.includes(c));
});
test('cada contexto novo tem rotulos em cinco idiomas',()=>{
 for(const c of api.CONTEXTOS_EXTRAS) for(const l of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']) assert.ok(api.rotuloContextoExtra(c[0],l));
});
test('nomes personalizados e contextos legados sao preservados sem duplicatas',()=>{
 const opcoes=api.contextosOutros(['LEGADO','LEGADO',null],['Conselho']);
 assert.equal(opcoes.filter(c=>c==='LEGADO').length,1);
 assert.ok(opcoes.includes('PERSONALIZADO:Conselho'));
 assert.equal(api.nomeContextoPersonalizado('PERSONALIZADO:Conselho'),'Conselho');
});
test('normaliza espacos, caixa e acentos para unicidade',()=>{
 assert.equal(api.normalizarNomeContexto('  Conselho   de Ética '),'Conselho de Ética');
 assert.equal(api.chaveNomeContexto('ÉTICA'),api.chaveNomeContexto('Etica'));
});
test('rejeita nomes vazios, HTML, marcadores e controles',()=>{
 for(const n of ['', 'a', '<script>', '{{tag}}','a\nb','a'.repeat(101),null]) assert.equal(api.normalizarNomeContexto(n),null);
});
test('personalizado nunca coincide com codigo docente',()=>{
 assert.notEqual(api.valorContextoPersonalizado('DOCENTE_PLANO_AULA'),'DOCENTE_PLANO_AULA');
});
