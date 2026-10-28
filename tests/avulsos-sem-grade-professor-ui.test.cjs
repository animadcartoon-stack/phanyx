'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files={
 api:'app/api/professor/turmas/avulsas/route.ts',
 lista:'app/professor/turmas/avulsas/page.tsx',
 chamada:'app/professor/turmas/[id]/chamadas-avulsas/page.tsx',
 copias:'lib/professor/turmas-avulsas-copy.ts',
 antigo:'app/professor/turmas/page.tsx',
 rota:'app/api/professor/turmas/[turmaId]/chamadas-avulsas/route.ts',
};
const loadEndpoint=(user,db)=>{
 const exports={};
 const code=ts.transpileModule(read(files.api),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,Set,Number,String,console,require:p=>{
  if(p==='next/server')return{NextResponse:{json:(data,opts)=>({data,status:opts?.status||200})}};
  if(p==='@/lib/prisma')return{prisma:db};
  if(p==='@/lib/server-auth')return{getUserFromToken:async()=>user};
  throw Error(p);
 }});
 return exports;
};
test('API do professor retorna 403 a outros perfis sem consultar turmas',async()=>{
 let consultado=false;
 const api=loadEndpoint({role:'ALUNO',instituicaoId:26,id:8},{turma:{findMany:async()=>{consultado=true;return[];}}});
 assert.equal((await api.GET()).status,403);assert.equal(consultado,false);
});
test('lista usa escopo do professor autenticado e apenas curso avulso ativo; ocupa um aluno uma vez',async()=>{
 const consultas=[];
 const user={role:'PROFESSOR',instituicaoId:26,id:8};
 const db={professor:{findFirst:async q=>{consultas.push(q);return{id:9};}},turma:{findMany:async q=>{
  consultas.push(q);
  assert.equal(q.where.instituicaoId,26); assert.equal(q.where.professorId,9);
  assert.equal(q.where.curso.instituicaoId,26); assert.equal(q.where.curso.matriculaDiretaTurma,true);
  assert.equal(q.where.ativa,true);assert.equal(q.select.matriculasAvulsas.where.matricula.canceladaEm,null);
  return [{id:12,nome:'Balé',curso:{id:28,nome:'Avulso Balé'},turno:'VESPERTINO',periodoLetivo:'2027',statusTurma:'ATIVA',capacidadeMaxima:10,horariosAvulsos:[{diaSemana:2,horaInicio:'10:00',horaFim:'11:00'}],matriculasAvulsas:[
   {cursoId:28,matricula:{alunoId:11}},{cursoId:28,matricula:{alunoId:11}},
   {cursoId:28,matricula:{alunoId:13}},{cursoId:99,matricula:{alunoId:40}}] }];
 }}};
 const r=await loadEndpoint(user,db).GET();assert.equal(r.status,200);
 assert.equal(r.data.length,1);assert.equal(r.data[0].alunos,2);
 assert.equal(r.data[0].horarios[0].diaSemana,2);assert.ok(!('matriculasAvulsas' in r.data[0]));
 assert.equal(consultas.length,2);assert.equal(consultas[0].where.userId,8);
});
test('interface de chamada avulsa usa rota propria, status validos e controles anti-perda',()=>{
 const s=read(files.chamada);
 assert.match(s,/\/chamadas-avulsas/);
 assert.match(s,/STATUS_CHAMADA/);assert.match(s,/useConfirmDialog/);
 assert.match(s,/invalidAttendance/);assert.match(s,/invalidReason/);
 assert.match(s,/presencas: alunos\.map/);assert.match(s,/historico\.map/);
 assert.doesNotMatch(s,/disciplinaId:/);
 assert.match(read(files.lista),/\/api\/professor\/turmas\/avulsas/);
 assert.match(read(files.antigo),/\/professor\/turmas\/avulsas/);
 assert.match(read(files.rota),/autorizarChamadaTurmaAvulsa/);
});
test('copias estao presentes para cinco idiomas e paginas TSX possuem sintaxe valida',()=>{
 const exp={};vm.runInNewContext(ts.transpileModule(read(files.copias),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exp});
 for(const l of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']){
  const c=exp.copyTurmasAvulsas(l);
  assert.equal(c.days.length,7);
  for(const k of ['title','openAttendance','attendanceTitle','save','history','discardTitle','noStudents'])assert.ok(c[k]?.length>2,k+' '+l);
  assert.equal(Object.keys(c.statuses).length,4);
 }
 for(const p of [files.lista,files.chamada]){
  const result=ts.transpileModule(read(p),{fileName:p,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
  assert.equal((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,p);
 }
});
