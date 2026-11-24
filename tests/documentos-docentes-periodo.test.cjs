const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const vm=require('node:vm');
function load(p){const api={};const js=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(js,{exports:api,module:{exports:api}});return api;}
const p=load('lib/documentos-docentes/periodo.ts'),r=load('lib/documentos-docentes/campos-impressao.ts');const m='<p>Período: {{campo:periodoData}}</p>';const c=periodoData=>({periodoData});
test('intervalo válido e mesmo dia',()=>{assert.ok(p.periodoValido(m,c('2027-02-01/2027-02-05')));assert.ok(p.periodoValido(m,c('2027-02-01/2027-02-01')));});
test('rejeita datas impossíveis e invertidas',()=>{for(const v of ['2027-02-29/2027-03-01','2027-02-05/2027-02-01','abc/2027-02-01'])assert.equal(p.periodoValido(m,c(v)),false);});
test('rascunho incompleto não permite envio',()=>{assert.ok(p.periodoValido(m,c('2027-02-01/'),false));assert.equal(p.periodoValido(m,c('2027-02-01/')),false);assert.equal(p.periodoValido(m,{}),false);});
test('PDF mostra datas sem desvio de fuso',()=>{assert.equal(r.renderizarCamposDocentes(m,c('2027-02-01/2027-02-05')),'<p>Período: 01/02/2027 a 05/02/2027</p>');});
test('impressão em branco não revela datas',()=>{assert.match(r.renderizarCamposDocentes(m,c('2027-02-01/2027-02-05'),true),/____/);assert.doesNotMatch(r.renderizarCamposDocentes(m,c('2027-02-01/2027-02-05'),true),/2027/);});
test('campos antigos preservados',()=>{assert.ok(p.periodoValido('{{campo:Período}}',{}));assert.match(r.renderizarCamposDocentes('{{campo:Período}}',{'Período':'Semana 1'}),/Semana 1/);});
test('cinco idiomas na prévia',()=>{for(const l of ['pt-BR','pt-PT','en-US','es-ES','fr-FR'])assert.ok(r.renderizarCamposDocentes(m,c('2027-02-01/2027-02-05'),false,l).includes('2027'));});
