const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
let usuario, calls, rows, authCalls;
const match = (row, where = {}) => Object.entries(where).every(([key, value]) => {
  if (value && typeof value === 'object') {
    if ('in' in value) return value.in.includes(row[key]);
    if ('not' in value) return row[key] !== value.not;
    return row[key] != null && match(row[key], value);
  }
  return row[key] === value;
});
function project(row, args = {}) {
  if (row == null) return row;
  const out = args.select ? {} : {...row};
  for (const [key, value] of Object.entries(args.select || args.include || {})) {
    if (value === true) out[key] = row[key];
    else if (Array.isArray(row[key])) out[key] = row[key].filter(r => match(r, value.where)).map(r => project(r, value));
    else out[key] = project(row[key], value);
  }
  return out;
}
const db = Object.fromEntries(['turma','itemMatricula','curso','disciplina','professor','polo'].map(model => [model, {
  findMany: async args => {
    calls.push({model, args});
    let selected = rows[model].filter(r => match(r,args.where));
    if (args.distinct) {
      const seen = new Set();
      selected = selected.filter(r => {const key = JSON.stringify(args.distinct.map(k => r[k])); if(seen.has(key)) return false; seen.add(key); return true;});
    }
    return selected.map(r => project(r,args));
  },
}]));
const resolve = Module._resolveFilename;
Module._resolveFilename = function(req,parent,...rest) {
  if(req.startsWith('@/')) req = path.resolve(__dirname,'..',req.slice(2));
  return resolve.call(this,req,parent,...rest);
};
const load = Module._load;
Module._load = function(req,parent,isMain) {
  if(req==='@/lib/prisma') return {prisma:db};
  if(req==='@/lib/server-auth') return {getUserFromToken:async()=>{authCalls++;return usuario;},isAdminLike:r=>['ADMIN','GERENCIA','SUPER_ADMIN'].includes(r)};
  return load.call(this,req,parent,isMain);
};
Module._extensions['.ts'] = (m,file) => m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const api = require('../app/api/admin/turmas/painel/route.ts');
const {iniciarAtualizacaoVisivel} = require('../lib/atualizacao-visivel.ts');
const request = suffix => new Request('http://localhost/api/admin/turmas/painel'+(suffix || ''));
function reset() {
  usuario={id:1,role:'ADMIN',instituicaoId:10}; calls=[]; authCalls=0;
  const teacher={id:41,nome:'Ana',instituicaoId:10,user:{senha:'nao-enviar'},historicosRemuneracaoRH:[{valor:3000}]};
  const course={id:1,nome:'Robótica',codigo:'ROB',instituicaoId:10,organizacaoCurricular:'ANUAL',valorMensalidade:240,
    semestres:[{numero:2,instituicaoId:10,organizacaoCurricular:'ANUAL',disciplinas:[{instituicaoId:10,disciplinaId:11,disciplina:{instituicaoId:10}}]}]};
  const subject={id:11,nome:'Projetos',codigo:'PROJ',descricao:'Construção',instituicaoId:10,cursoId:1,semestre:null,curso:course};
  const campus={id:51,nome:'Sede',instituicaoId:10,ativo:true};
  const offer={id:61,instituicaoId:10,disciplina:subject,professorId:41,professor:teacher,turmaSemestreId:71,
    dataInicio:new Date('2027-02-01'),dataFim:new Date('2027-12-01'),status:'EM_ANDAMENTO',
    horarios:[{id:81,instituicaoId:10,diaSemana:2,horaInicio:'14:00',horaFim:'15:00',ativo:true},
      {id:82,instituicaoId:10,diaSemana:3,horaInicio:'14:00',ativo:false},
      {id:83,instituicaoId:20,diaSemana:4,horaInicio:'14:00',ativo:true}]};
  rows={turma:[{id:31,instituicaoId:10,nome:'Ano 2',codigo:'T2',cursoId:1,curso:course,professorId:41,professor:teacher,poloId:51,polo:campus,
    organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:'',periodoLetivo:'2027',statusTurma:'ATIVA',ativa:true,
    capacidadeMinima:5,capacidadeMaxima:20,modalidade:'PRESENCIAL',sala:'A',dataInicio:new Date('2027-02-01'),disciplinas:[offer]},
    {id:39,instituicaoId:20,nome:'Outra instituição',disciplinas:[]}],
    itemMatricula:[{turmaId:31,matriculaId:101,instituicaoId:10,status:'ATIVO'},
      {turmaId:31,matriculaId:101,instituicaoId:10,status:'ATIVO'},
      {turmaId:31,matriculaId:102,instituicaoId:10,status:'ATIVO'},
      {turmaId:31,matriculaId:103,instituicaoId:10,status:'CANCELADO'},
      {turmaId:31,matriculaId:104,instituicaoId:20,status:'ATIVO'}],
    curso:[course,{...course,id:9,instituicaoId:20}],disciplina:[subject,{...subject,id:91,instituicaoId:20}],
    professor:[teacher,{...teacher,id:49,instituicaoId:20}],polo:[campus,{...campus,id:59,instituicaoId:20}]};
}
test('painel mantém dados de criação, edição, grade anual, ofertas, datas e horários',async()=>{
  reset(); const res=await api.GET(request()); assert.equal(res.status,200);
  const data=await res.json(); assert.equal(authCalls,1); assert.match(res.headers.get('cache-control'),/no-store/);
  assert.equal(data.turmas.length,1); const turma=data.turmas[0];
  assert.equal(turma.curso.nome,'Robótica'); assert.equal(turma.organizacaoCurricular,'ANUAL'); assert.equal(turma.etapaNumero,2);
  assert.equal(turma.semestre,''); assert.equal(turma.periodoLetivo,'2027'); assert.equal(turma.sala,'A'); assert.equal(turma.capacidadeMaxima,20);
  assert.equal(turma.professor.nome,'Ana'); assert.equal(turma.polo.nome,'Sede');
  assert.equal(turma.disciplinas[0].turmaDisciplinaId,61); assert.equal(turma.disciplinas[0].turmaSemestreId,71);
  assert.equal(turma.disciplinas[0].dataInicio,'2027-02-01T00:00:00.000Z'); assert.equal(turma.disciplinas[0].dataFim,'2027-12-01T00:00:00.000Z');
  assert.equal(turma.disciplinas[0].status,'EM_ANDAMENTO'); assert.equal(turma.disciplinas[0].professorId,41);
  assert.deepEqual(turma.disciplinas[0].horarios,[{id:81,diaSemana:2,horaInicio:'14:00',horaFim:'15:00',ativo:true}]);
  assert.deepEqual(data.cursos[0].semestres,[{numero:2,organizacaoCurricular:'ANUAL',disciplinas:[{disciplinaId:11}]}]);
  assert.equal(data.disciplinas[0].descricao,'Construção'); assert.equal(data.professores[0].nome,'Ana'); assert.equal(data.polos[0].id,51);
});
test('vagas contam matrículas distintas, sem canceladas ou alunos de outra instituição',async()=>{
  reset(); const data=await (await api.GET(request())).json(); assert.equal(data.turmas[0].matriculados,2);
});
test('dados de RH, credenciais e preços não são consultados para os seletores de Turmas',async()=>{
  reset(); const data=await (await api.GET(request())).json();
  assert.deepEqual(Object.keys(data.professores[0]).sort(),['id','instituicaoId','nome']);
  assert.doesNotMatch(JSON.stringify(data),/senha|historicosRemuneracaoRH|valorMensalidade/);
  const selects=JSON.stringify(calls.map(c=>c.args)); assert.doesNotMatch(selects,/historicosRemuneracaoRH|"user"|"funcionario"/);
});
test('atualização após salvar recarrega somente turmas e ocupação',async()=>{
  reset(); const data=await (await api.GET(request('?somenteTurmas=1'))).json();
  assert.deepEqual(Object.keys(data),['turmas']); assert.deepEqual(calls.map(c=>c.model),['turma','itemMatricula']);
});
test('turma legada sem curso direto preserva o nome do curso de sua disciplina',async()=>{
  reset(); rows.turma[0].curso=null; rows.turma[0].cursoId=null;
  const data=await (await api.GET(request())).json(); assert.equal(data.turmas[0].curso.nome,'Robótica');
});
test('vínculos legados de outra instituição não vazam pelo painel',async()=>{
  reset(); const turma=rows.turma[0]; turma.curso.instituicaoId=20; turma.professor.instituicaoId=20; turma.polo.instituicaoId=20;
  turma.disciplinas.push({...turma.disciplinas[0],id:69,instituicaoId:20});
  const data=await (await api.GET(request())).json();
  assert.equal(data.turmas[0].curso,null); assert.equal(data.turmas[0].professor,null); assert.equal(data.turmas[0].polo,null);
  assert.equal(data.turmas[0].disciplinas.length,1); assert.equal(data.turmas[0].disciplinas[0].curso,null); assert.equal(data.turmas[0].disciplinas[0].professor,null);
  assert.equal(data.disciplinas[0].curso,null);
});
test('turmas semestrais conservam seus identificadores e não são convertidas em anuais',async()=>{
  reset(); Object.assign(rows.turma[0],{organizacaoCurricular:'SEMESTRAL',etapaNumero:3,semestre:'3',periodoLetivo:'2027.1'});
  const data=await (await api.GET(request())).json(); assert.equal(data.turmas[0].semestre,'3'); assert.equal(data.turmas[0].etapaNumero,3); assert.equal(data.turmas[0].organizacaoCurricular,'SEMESTRAL');
});
test('sem sessão, perfil acadêmico externo ao admin ou instituição inválida não consulta dados',async()=>{
  for(const [user,status] of [[null,401],[{role:'ALUNO',instituicaoId:10},403],[{role:'PROFESSOR',instituicaoId:10},403],[{role:'ADMIN',instituicaoId:null},403],[{role:'ADMIN',instituicaoId:-1},403]]) {
    reset(); usuario=user; assert.equal((await api.GET(request())).status,status); assert.equal(calls.length,0);
  }
});
test('funcionário preserva cursos e turmas sem ganhar acesso ao catálogo de disciplinas',async()=>{
  reset(); usuario.role='SECRETARIA'; const data=await (await api.GET(request())).json();
  assert.equal(data.turmas.length,1); assert.equal(data.cursos.length,1); assert.deepEqual(data.disciplinas,[]);
  assert.ok(calls.some(c=>c.model==='curso')); assert.ok(!calls.some(c=>c.model==='disciplina'));
});
test('instituição vazia não faz consulta desnecessária de ocupação',async()=>{
  reset(); rows.turma=[]; const data=await (await api.GET(request())).json();
  assert.deepEqual(data.turmas,[]); assert.ok(!calls.some(c=>c.model==='itemMatricula'));
});
function visibility() {
  let tick, listener, removed=false, cancelled=false;
  const documento={visibilityState:'visible',addEventListener:(name,fn)=>{listener=fn;},removeEventListener:(name,fn)=>{assert.equal(fn,listener);removed=true;}};
  return {documento,agendar:fn=>{tick=fn;return 1;},cancelar:id=>{assert.equal(id,1);cancelled=true;},tick:()=>tick(),change:value=>{documento.visibilityState=value;listener();},get removed(){return removed;},get cancelled(){return cancelled;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('chat atualiza imediatamente e mantém um único pedido mesmo com vários ticks',async()=>{
  const env=visibility(); let total=0,finish; const stop=iniciarAtualizacaoVisivel(async()=>{total++;await new Promise(r=>finish=r);},5000,env);
  env.tick(); env.tick(); assert.equal(total,1); finish(); await flush(); env.tick(); assert.equal(total,2); stop(); finish(); await flush();
});
test('chat pausa na aba oculta e atualiza ao retornar, sem esperar o próximo intervalo',async()=>{
  const env=visibility(); let total=0; env.documento.visibilityState='hidden';
  const stop=iniciarAtualizacaoVisivel(async()=>{total++;},5000,env); env.tick(); assert.equal(total,0);
  env.change('visible'); await flush(); assert.equal(total,1); env.change('hidden'); env.tick(); assert.equal(total,1); stop();
});
test('fechar chat cancela pedido, intervalo e escuta, sem nova consulta',async()=>{
  const env=visibility(); let signal,total=0; const stop=iniciarAtualizacaoVisivel(async s=>{signal=s;total++;},5000,env);
  stop(); assert.equal(signal.aborted,true); assert.ok(env.removed && env.cancelled); await flush(); env.tick(); env.change('visible'); assert.equal(total,1);
});
test('falha temporária não deixa a atualização permanentemente travada',async()=>{
  const env=visibility(); let total=0; const original=console.error; console.error=()=>{};
  try {const stop=iniciarAtualizacaoVisivel(async()=>{if(++total===1)throw new Error('temporário');},5000,env);await flush();env.tick();await flush();assert.equal(total,2);stop();} finally {console.error=original;}
});
