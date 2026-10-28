'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript');const root=path.resolve(__dirname,'..');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
// Avalia o helper real, sem conectar ao banco.
const exported={};
const vm=require('node:vm');
vm.runInNewContext(ts.transpileModule(source('lib/matriculas/gravar-matricula-turma-avulsa.ts'),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports:exported,require:p=>p==='./combos'?{ErroModalidades:class extends Error{constructor(codigo,status){super(codigo);this.codigo=codigo;this.status=status;}}}:require(p)});
const validar=exported.validarOfertasDiretasParaGravacao;
const oferta=(x={})=>({curso:{matriculaDiretaTurma:true},disciplinaIds:[],disciplinas:[],horariosPendentes:false,capacidadePendente:false,vagas:3,...x});
test('nao cria vinculo com horario pendente, disciplina indevida ou capacidade ausente',()=>{
 for(const x of [{horariosPendentes:true},{disciplinaIds:[9]},{disciplinas:[{id:9}]},{capacidadePendente:true},{vagas:null},{vagas:0}])
   assert.throws(()=>validar([oferta(x)]));
 assert.doesNotThrow(()=>validar([oferta()]));
 assert.doesNotThrow(()=>validar([{...oferta({vagas:null,disciplinas:[{id:2}]}),curso:{matriculaDiretaTurma:false}}]));
});
test('persistencia direta e atomica na matricula e nao cria disciplina sintética',()=>{
 const s=source('lib/matriculas/modalidades-servidor.ts');
 assert.ok(s.includes('turmasAvulsas: {'));assert.ok(s.includes('create: ofertasDiretas.map'));
 assert.ok(s.includes('escolhidas.filter(o => !o.curso.matriculaDiretaTurma).flatMap'));
 assert.ok(s.includes('contratacaoModalidades: {'));assert.ok(s.includes('criarContratoPendenteMatricula('));
 assert.doesNotMatch(s,/disciplinaId: 0/);
});
test('confirmacao ainda depende de liberacao explicitamente desativada por padrao',()=>{
 const s=source('lib/matriculas/modalidades-servidor.ts');
 assert.ok(s.includes('process.env.PHANYX_MATRICULA_SEM_GRADE_HABILITADA !== "true"'));
 const a=s.indexOf('export async function confirmarContratacaoModalidades');
 const b=s.indexOf('const instituicao = await db.instituicao.update',a);
 const k=s.indexOf('PHANYX_MATRICULA_SEM_GRADE_HABILITADA',a);
 assert.ok(k>a&&k<b);
});
test('registro direto separado dos itens tradicionais preserva os precos oficiais',()=>{
 const s=source('lib/matriculas/modalidades-servidor.ts');
 assert.ok(s.includes('calcularContratacaoModalidades('));
 assert.ok(s.includes('const ofertasDiretas = escolhidas.filter'));
 assert.ok(s.includes('disciplinasContratadas: {'));
 assert.ok(s.includes('lancamentoFinanceiro.createMany'));
});
