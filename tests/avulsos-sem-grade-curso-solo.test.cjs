'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const moduleCache={};
const exportsTS={};
const source=read('lib/matriculas/cursos-adicionais.ts');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
  {exports:exportsTS, URLSearchParams, require:name=>name==='./combos'?{
    ErroModalidades:class extends Error {constructor(codigo,status){super(codigo);this.codigo=codigo;this.status=status;}},
    idsPositivos:items=>items.map(Number)
  }:require(name)});
const validar=exportsTS.validarCursosAdicionais;
const curso=(extra={})=>({id:20,permiteCursosAdicionais:false,disponivelComoAdicional:false,matriculaDiretaTurma:true,...extra});
test('um unico curso avulso direto e permitido sem ativar cursos adicionais',()=>{
 const p=validar([curso()],20);
 assert.equal(p.id,20);
 assert.throws(()=>validar([curso({matriculaDiretaTurma:false})],20),e=>e.codigo==='PRINCIPAL_NAO_PERMITE_ADICIONAIS');
});
test('avulso que nao permite adicionais rejeita casadinho mesmo que outro esteja disponivel',()=>{
 const adicional={id:21,matriculaDiretaTurma:true,disponivelComoAdicional:true};
 assert.throws(()=>validar([curso(),adicional],20),e=>e.codigo==='PRINCIPAL_NAO_PERMITE_ADICIONAIS');
 const p=validar([curso({permiteCursosAdicionais:true}),adicional],20);
 assert.equal(p.id,20);
 assert.throws(()=>validar([curso({permiteCursosAdicionais:true}),{...adicional,disponivelComoAdicional:false}],20),e=>e.codigo==='CURSO_NAO_DISPONIVEL_ADICIONAL');
});
test('API nao confunde matricula individual com permissao para visualizar outros cursos',()=>{
 const api=read('app/api/admin/matriculas/modalidades/route.ts');
 assert.match(api,/matriculaDiretaTurma: true/);
 assert.match(api,/!principal\?\.permiteCursosAdicionais && !principal\?\.matriculaDiretaTurma/);
 assert.match(api,/principal\?\.permiteCursosAdicionais && o\.curso\.disponivelComoAdicional/);
});
test('UI avulso individual esconde adicionais nao autorizados e mantem calculo proprio',()=>{
 const ui=read('components/admin/SeletorAdicionaisMatricula.tsx');
 const page=read('app/admin/matriculas/page.tsx');
 assert.ok(ui.includes('if (!permiteAdicionais) return []'));
 assert.ok(ui.includes('{permiteAdicionais && <label'));
 assert.ok(ui.includes('principalSemGrade && previa'));
 assert.ok(page.includes('permiteAdicionais={Boolean(cursoSelecionadoObj?.permiteCursosAdicionais)}'));
});
