'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('lib/professor-chamada-turma-avulsa.ts');
const route=read('app/api/professor/turmas/[turmaId]/chamadas-avulsas/route.ts');
const exported={};
class ErroChamada extends Error{constructor(codigo,status=400){super(codigo);this.codigo=codigo;this.status=status;}}
function validarEncontro(data,hora){if(typeof data!=='string'||typeof hora!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(data)||!/^\d\d:\d\d$/.test(hora))throw new ErroChamada('invalidMeeting');const dt=new Date(data+'T00:00:00Z');if(Number.isNaN(dt.getTime())||dt.toISOString().slice(0,10)!==data)throw new ErroChamada('invalidMeeting');return{dataEncontro:dt,horaEncontro:hora};}
vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports:exported,require:n=>{
  if(n==='@/lib/chamada-encontro')return{ErroChamada,validarEncontro,validarPresencasEncontro:()=>[]};
  if(n==='@/lib/prisma')return{prisma:{}};
  if(n==='@prisma/client')return{Prisma:{TransactionIsolationLevel:{Serializable:'Serializable'},sql:()=>({})}};
  throw Error(n);
 },Date,Set,Map,Number,String,Promise,console});
const turno=(horarios=[{diaSemana:1,horaInicio:'09:00',horaFim:'10:00'}])=>({dataInicio:new Date('2027-01-01'),dataFim:new Date('2027-12-31'),horariosAvulsos:horarios});
test('validacao de chamada exige o dia e a hora da turma, nao uma disciplina',()=>{
 assert.equal(exported.validarHorarioChamadaAvulsa(turno(),'2027-03-01','09:00').horaEncontro,'09:00');
 for(const [d,h] of [['2027-03-02','09:00'],['2027-03-01','08:00'],['2028-03-06','09:00'],['2026-03-02','09:00']])assert.throws(()=>exported.validarHorarioChamadaAvulsa(turno(),d,h));
});
test('professor e vinculo tenant sao obrigatorios; não permite turma alheia',async()=>{
 let professorConsultado=false;
 const db={professor:{findFirst:async()=>{professorConsultado=true;return{id:4}}},turma:{findFirst:async({where})=>{assert.equal(where.instituicaoId,26);assert.equal(where.professorId,4);assert.equal(where.curso.matriculaDiretaTurma,true);return null;}}};
 await assert.rejects(exported.autorizarChamadaTurmaAvulsa({role:'ALUNO',instituicaoId:26,id:9},5,db),e=>e.codigo==='unauthorized');
 assert.equal(professorConsultado,false);
 await assert.rejects(exported.autorizarChamadaTurmaAvulsa({role:'PROFESSOR',instituicaoId:26,id:9},5,db),e=>e.codigo==='forbidden');
});
test('lista de chamada filtra matriculas encerradas e alunos fora do curso',()=>{
 assert.match(src,/status: \{ in: \["A_CURSAR", "EM_CURSO"\] \}/);
 assert.match(src,/excluidaEm: null/);assert.match(src,/canceladaEm: null/);
 assert.match(src,/cursoId: contexto\.turma\.curso!\.id/);
 assert.match(src,/matricula\.dataInicioCurso/);
 assert.match(src,/status: \{ in: \["ATIVA", "A_INICIAR", "AGUARDANDO"\] \}/);
});
test('salva na Aula existente com disciplina nula e trilha de auditoria',()=>{
 assert.match(src,/disciplinaId: null/);
 assert.match(src,/titulo: \{ startsWith: TITULO_PREFIXO \}/);
 assert.match(src,/FOR UPDATE/); assert.match(src,/TransactionIsolationLevel\.Serializable/);
 assert.match(src,/historicoPresencaAula\.create/);assert.match(src,/validarPresencasEncontro/);
 assert.match(src,/studentOutsideClass/);assert.match(src,/rosterChanged/);
});
test('rota avulsa fica isolada da rota de disciplinas e reanalisa presencas',()=>{
 assert.match(route,/export async function GET/);assert.match(route,/export async function POST/);
 assert.match(route,/autorizarChamadaTurmaAvulsa/);
 assert.match(route,/solicitarReanalisePorAlteracaoAcademica/);
 assert.doesNotMatch(read('lib/professor-chamada-encontro.ts'),/TITULO_PREFIXO/);
});
