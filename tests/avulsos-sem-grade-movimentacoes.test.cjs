'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const modulo={};
const transpiled=ts.transpileModule(read('lib/matriculas/bloqueio-transferencia-avulsa.ts'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
vm.runInNewContext(transpiled,{exports:modulo,Error,Number,Boolean});
const check=modulo.possuiVinculoDiretoMatricula;

test('transferencia consulta vinculo direto somente na mesma instituicao e matricula',async()=>{
 const calls=[];
 const db={matriculaTurmaAvulsa:{findFirst:async q=>{calls.push(q);return {id:33};}}};
 assert.equal(await check(db,26,123),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].where.instituicaoId,26);
 assert.equal(calls[0].where.matriculaId,123);
 assert.equal(calls[0].select.id,true);
});
test('matricula sem vinculo direto continua transferivel; ids invalidos sao recusados',async()=>{
 const db={matriculaTurmaAvulsa:{findFirst:async()=>null}};
 assert.equal(await check(db,26,123),false);
 await assert.rejects(check(db,0,123));
 await assert.rejects(check(db,26,-5));
});
test('transferencia bloqueia curso direto antes de criar evento, itens ou alterar polo',()=>{
 const src=read('app/api/admin/matriculas/[id]/transferencias/route.ts');
 const guard=src.indexOf('if (await possuiVinculoDiretoMatricula(');
 const write=src.indexOf('await tx.transferenciaMatricula.create(');
 const move=src.indexOf('await tx.matricula.update(');
 assert.ok(guard>0&&guard<write&&guard<move);
 assert.ok(src.includes('TRANSFERENCIA_AVULSO_SEM_GRADE_NAO_SUPORTADA'));
 assert.ok(src.includes('409,'));
});
test('cancelamento libera vaga pelo estado da matricula e preserva historico',()=>{
 const cancel=read('app/api/admin/matriculas/[id]/cancelamento/route.ts');
 const ser=read('lib/matriculas/modalidades-servidor.ts');
 const chamada=read('lib/professor-chamada-turma-avulsa.ts');
 assert.ok(cancel.includes('StatusMatricula.CANCELADA'));
 assert.ok(cancel.includes('canceladaEm:'));
 assert.ok(ser.includes('canceladaEm: null'));
 assert.ok(chamada.includes('canceladaEm: null'));
 assert.ok(!cancel.includes('matriculaTurmaAvulsa.delete'));
});
test('trancamento retira aluno das vagas/chamada sem apagar o vinculo',()=>{
 const trancar=read('app/api/admin/matriculas/[id]/trancamento/route.ts');
 const ser=read('lib/matriculas/modalidades-servidor.ts');
 const chamada=read('lib/professor-chamada-turma-avulsa.ts');
 assert.ok(trancar.includes('StatusMatricula')&&trancar.includes('.TRANCADA'));
 assert.ok(ser.includes('status: { in: [...matriculasOcupantes] }'));
 assert.ok(chamada.includes('status: { in: ["ATIVA", "A_INICIAR", "AGUARDANDO"] }'));
 assert.ok(!trancar.includes('matriculaTurmaAvulsa.delete'));
});
