'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function resumo(snapshot,cursoPadrao=null){
 const exports={};
 const js=ts.transpileModule(read('lib/documentos/cursos-contratados.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,{exports});
 return exports.resumoCursosDocumento(snapshot,cursoPadrao);
}
function textoContrato(disciplinasLista,dadosCursosContratados){
 const fonte=read('lib/contratos/contrato-matricula.ts');
 const start=fonte.indexOf('  const disciplinasTexto =');
 const end=fonte.indexOf('\n\n  const valorLancamentos =',start);
 assert.ok(start>=0&&end>start,'Trecho de contrato ausente');
 const codigo=fonte.slice(start,end)+'\nresultado = disciplinasTexto;';
 const c={disciplinasLista,dadosCursosContratados};
 vm.runInNewContext(codigo,c);
 return c.resultado;
}
test('contrato individual sem grade identifica o curso, nao disciplina inexistente',()=>{
 const r=resumo({versao:1,ofertas:[{cursoNome:'Balé',disciplinas:[]}]});
 assert.equal(r.temModalidades,true);
 assert.equal(textoContrato([],r),'- Balé');
});
test('contrato casadinho sem grade identifica os dois cursos sem disciplina ficticia',()=>{
 const r=resumo({versao:1,ofertas:[{cursoNome:'Balé',disciplinas:[]},{cursoNome:'Robótica',disciplinas:[]}]});
 assert.equal(textoContrato([],r),'- Balé\n- Robótica');
 assert.equal(r.cursosContratados,'- Balé\n- Robótica');
});
test('contrato tradicional continua mostrando as disciplinas curriculares',()=>{
 const r=resumo({versao:1,ofertas:[{cursoNome:'Teologia',disciplinas:[{nome:'História da Igreja'}]}]});
 assert.equal(textoContrato(['História da Igreja'],r),'- História da Igreja');
});
test('contrato legado sem snapshot preserva resposta anterior',()=>{
 const r=resumo(null,'Curso antigo');
 assert.equal(r.temModalidades,false);
 assert.equal(textoContrato([],r),'- Não informado');
});
test('precos, parcelas e criacao de contrato permanecem no servidor existente',()=>{
 const servidor=read('lib/matriculas/modalidades-servidor.ts');
 const contrato=read('lib/contratos/contrato-matricula.ts');
 assert.ok(servidor.includes('calcularContratacaoModalidades('));
 assert.ok(servidor.includes('lancamentoFinanceiro.createMany('));
 assert.ok(servidor.includes('criarContratoPendenteMatricula({'));
 assert.ok(servidor.includes('turmasAvulsas: {'));
 assert.ok(servidor.includes('PHANYX_MATRICULA_SEM_GRADE_HABILITADA'));
 assert.ok(contrato.includes('anexarResumoModalidades(conteudoBase'));
});
