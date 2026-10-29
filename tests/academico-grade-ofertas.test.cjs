const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
let tables, calls, usuario;
const assignDefined = (target, data) => Object.assign(target, Object.fromEntries(Object.entries(data).filter(([,v]) => v !== undefined)));
function match(row, where = {}) {
  return Object.entries(where).every(([key,value]) => {
    if (value === undefined) return true;
    if (key === 'OR') return value.some(w => match(row,w));
    if (value && typeof value === 'object' && 'in' in value) return value.in.includes(row[key]);
    if (value && typeof value === 'object') return !!row[key] && match(row[key],value);
    return row[key] === value;
  });
}
const currentClass = row => row && ({...row, disciplinas:tables.offers.filter(o=>o.turmaId===row.id).map(o=>({
  ...o, disciplina:tables.subjects.find(d=>d.id===o.disciplinaId), horarios:tables.hours.filter(h=>h.turmaDisciplinaId===o.id), professor:null,
})), _count:{itensMatricula:0}});
const model = table => ({
  findMany:async ({where}={})=>tables[table].filter(r=>match(r,where)),
  findFirst:async ({where}={})=>tables[table].find(r=>match(r,where)) || null,
  count:async ({where}={})=>tables[table].filter(r=>match(r,where)).length,
});
const db = {
  curso:model('courses'), professor:model('teachers'), polo:model('campuses'),
  disciplina:{...model('subjects'), findFirst:async ({where})=>{
    const row=tables.subjects.find(r=>match(r,where));
    return row?{...row,curso:row.cursoId?{instituicaoId:row.instituicaoId,publicacaoRedeDestino:null}:null,
      turmaDisciplinas:tables.offers.filter(o=>o.disciplinaId===row.id).map(o=>({...o,turma:tables.classes.find(t=>t.id===o.turmaId)}))}:null;
  },update:async ({where,data})=>{calls.push(['subject.update',data]);return assignDefined(tables.subjects.find(r=>r.id===where.id),data);}},
  turma:{...model('classes'),findFirst:async ({where})=>currentClass(tables.classes.find(r=>match(r,where))),
    findUnique:async ({where})=>currentClass(tables.classes.find(r=>match(r,where))),
    update:async ({where,data})=>{calls.push(['class.update',data]);return assignDefined(tables.classes.find(r=>r.id===where.id),data);},
    create:async ({data})=>{const row={id:100+tables.classes.length,...data};tables.classes.push(row);return row;},
  },
  turmaSemestre:{...model('stages'),create:async ({data})=>{const row={id:200+tables.stages.length,...data};tables.stages.push(row);return row;}},
  turmaDisciplina:{...model('offers'),deleteMany:async ({where})=>{
    calls.push(['offer.delete',where]);const ids=tables.offers.filter(r=>match(r,where)).map(r=>r.id);
    tables.offers=tables.offers.filter(r=>!ids.includes(r.id));tables.hours=tables.hours.filter(h=>!ids.includes(h.turmaDisciplinaId));return {count:ids.length};
  },createMany:async ({data})=>{for(const d of data){tables.offers.push({id:300+tables.offers.length,...d});}calls.push(['offer.create',data]);},
  create:async ({data})=>{const row={id:300+tables.offers.length,...data};tables.offers.push(row);return row;},
  upsert:async ({where,create,update})=>{
    calls.push(['offer.upsert',update]);const row=tables.offers.find(o=>match(o,where.turmaId_disciplinaId));
    if(row)return assignDefined(row,update);const novo={id:300+tables.offers.length,...create};tables.offers.push(novo);return novo;
  }},
  turmaDisciplinaHorario:{deleteMany:async ({where})=>{calls.push(['hours.delete',where]);tables.hours=tables.hours.filter(h=>!match(h,where));},createMany:async ({data})=>{tables.hours.push(...data);}},
  professorDisciplina:{deleteMany:async()=>calls.push(['qualified.delete']),createMany:async()=>calls.push(['qualified.create'])},
  disciplinaPreRequisito:{deleteMany:async()=>calls.push(['prerequisite.delete']),createMany:async()=>calls.push(['prerequisite.create'])},
};
for(const name of ['itemMatricula','aula','atividade','prova','resultadoFinal','nota','matriculaDisciplinaContratada','rematriculaSemestralItem'])db[name]={count:async ({where})=>{
  assert.equal(where.instituicaoId,10);return tables.history.filter(r=>r.model===name&&match(r,where)).length;
}};
db.$transaction=async (fn,options)=>{
  assert.equal(options?.isolationLevel,'Serializable');
  const snapshot=structuredClone(tables);
  try{return await fn(db);}catch(e){tables=snapshot;throw e;}
};
const resolver=Module._resolveFilename;
Module._resolveFilename=function(req,parent,...rest){if(req.startsWith('@/'))req=path.resolve(__dirname,'..',req.slice(2));return resolver.call(this,req,parent,...rest);};
const loader=Module._load;
Module._load=function(req,parent,isMain){
  if(req==='@/lib/prisma')return {prisma:db};
  if(req==='@/lib/server-auth')return {getUserFromToken:async()=>usuario,isAdminLike:role=>['ADMIN','GERENCIA','SUPER_ADMIN'].includes(role)};
  if(req==='@/lib/publicacao-cursos-rede')return {sincronizarPublicacoesAtivasDoCurso:async()=>[]};
  if(req==='next/headers')return {cookies:async()=>({get:()=>usuario?{value:'fixture-token'}:null})};
  if(req==='jsonwebtoken')return {verify:()=>usuario};
  return loader.call(this,req,parent,isMain);
};
Module._extensions['.ts']=function(m,filename){m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);};
const pure=require('../lib/academico/grade-oferta.ts');
const rules=require('../lib/academico/integridade-ofertas.ts');
const subjectApi=require('../app/api/disciplina/[id]/route.ts');
const classApi=require('../app/api/turma/route.ts');
const classDetail=require('../app/api/turma/[id]/route.ts');
const req=body=>new Request('http://localhost/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function reset(){
  usuario={id:1,instituicaoId:10,role:'ADMIN'};calls=[];
  tables={courses:[{id:1,instituicaoId:10,semestres:[{numero:1,disciplinas:[{disciplinaId:11},{disciplinaId:12}]}]},
    {id:2,instituicaoId:10,semestres:[]},{id:9,instituicaoId:20,semestres:[]}],
    subjects:[{id:11,instituicaoId:10,nome:'Matemática',cursoId:2,semestre:2,codigo:'MAT',descricao:'Descrição',cargaHoraria:40,professorId:41},
      {id:12,instituicaoId:10,nome:'Ciências',cursoId:1,semestre:1,professorId:null},
      {id:13,instituicaoId:10,nome:'Fora da grade',cursoId:1,semestre:1},
      {id:91,instituicaoId:20,nome:'Disciplina externa',cursoId:9,semestre:1}],
    classes:[{id:31,instituicaoId:10,cursoId:1,nome:'Turma 2027',semestre:'1',periodoLetivo:'2027.1',professorId:41,poloId:51},
      {id:32,instituicaoId:10,cursoId:1,nome:'Outra turma',semestre:'1',professorId:41,poloId:51},
      {id:39,instituicaoId:20,cursoId:9,semestre:'1',professorId:49,poloId:59}],
    teachers:[{id:41,instituicaoId:10},{id:42,instituicaoId:10},{id:49,instituicaoId:20}],campuses:[{id:51,instituicaoId:10},{id:59,instituicaoId:20}],
    offers:[{id:61,instituicaoId:10,turmaId:31,disciplinaId:11,professorId:42,turmaSemestreId:71,dataInicio:new Date('2027-02-01'),dataFim:new Date('2027-12-01'),status:'EM_ANDAMENTO'}],
    stages:[{id:71,instituicaoId:10,turmaId:31,numero:1}],
    hours:[{id:81,instituicaoId:10,turmaDisciplinaId:61,diaSemana:2,horaInicio:'14:00',horaFim:'15:00',ativo:true}],history:[]};
}
const ctx=id=>({params:{id:String(id)}});
const expectCode=async (promise,code,status=400)=>{const res=await promise;assert.equal(res.status,status,JSON.stringify(await res.clone().json()));assert.equal((await res.json()).codigo,code);};
test('grade explícita vence campos diretos de curso e semestre',()=>{reset();assert.equal(pure.disciplinaPermitidaNaOferta(tables.subjects[0],tables.courses[0],1),true);assert.equal(pure.disciplinaPermitidaNaOferta(tables.subjects[2],tables.courses[0],1),false);});
test('grade vazia ou etapa diferente não usa fallback direto',()=>{reset();const curso={id:1,semestres:[{numero:1,disciplinas:[]}]};assert.equal(pure.disciplinaPermitidaNaOferta(tables.subjects[2],curso,1),false);assert.equal(pure.disciplinaPermitidaNaOferta(tables.subjects[0],tables.courses[0],2),false);});
test('curso legado sem grade preserva a classificação direta',()=>{reset();assert.equal(pure.disciplinaPermitidaNaOferta(tables.subjects[0],tables.courses[1],2),true);assert.equal(pure.disciplinaPermitidaNaOferta(tables.subjects[0],tables.courses[1],1),false);});
test('representações equivalentes de semestre são a mesma etapa',()=>{assert.equal(pure.mesmaEtapaOferta('2º semestre','2'),true);assert.equal(pure.mesmaEtapaOferta('1','2'),false);assert.equal(pure.numeroSemestreOferta('2º semestre'),2);});
test('IDs repetidos são normalizados; IDs malformados não são ignorados',()=>{assert.deepEqual(rules.idsOferta([11,'11',12]),[11,12]);for(const invalid of [[true],[null],[''],['abc'],[-1],[1.2]])assert.throws(()=>rules.idsOferta(invalid),e=>e.codigo==='VINCULO_INVALIDO');});
test('edição completa de disciplina preserva oferta, professor, datas, etapa e horários',async()=>{reset();const before=structuredClone([tables.offers,tables.hours]);const res=await subjectApi.PUT(req({nome:'Matemática atualizada',turmaIds:[31],professorId:41}),ctx(11));assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.deepEqual([tables.offers,tables.hours],before);assert.equal(tables.subjects[0].codigo,'MAT');assert.equal(tables.subjects[0].semestre,2);assert.equal(calls.some(c=>c[0]==='offer.delete'||c[0]==='offer.create'),false);});
test('edição parcial sem listas não remove associações',async()=>{reset();const res=await subjectApi.PUT(req({nome:'Novo nome'}),ctx(11));assert.equal(res.status,200);assert.equal(calls.some(c=>c[0].endsWith('.delete')),false);assert.equal(tables.hours.length,1);});
test('nova oferta usa a grade compartilhada e vincula a etapa da turma',async()=>{reset();const res=await subjectApi.PUT(req({turmaIds:[31,32]}),ctx(11));assert.equal(res.status,200,JSON.stringify(await res.clone().json()));const nova=tables.offers.find(o=>o.turmaId===32);assert.ok(nova);assert.equal(tables.stages.find(e=>e.id===nova.turmaSemestreId).numero,1);assert.equal(tables.offers.find(o=>o.id===61).professorId,42);assert.equal(tables.hours.length,1);});
test('retirada de oferta sem histórico remove somente a oferta escolhida',async()=>{reset();await expectCode(subjectApi.PUT(req({turmaIds:[39]}),ctx(11)),'TURMA_INVALIDA');assert.equal(tables.hours.length,1);const res=await subjectApi.PUT(req({turmaIds:[]}),ctx(11));assert.equal(res.status,200);assert.equal(tables.offers.length,0);});
for(const model of ['itemMatricula','aula','atividade','prova','resultadoFinal','nota','matriculaDisciplinaContratada','rematriculaSemestralItem'])test(`retirada com ${model} é bloqueada sem alteração parcial`,async()=>{reset();tables.history=[{model,instituicaoId:10,turmaId:31,disciplinaId:11,matricula:{instituicaoId:10,turmaPrincipalId:31},turmaDisciplina:{instituicaoId:10,turmaId:31}}];const before=structuredClone(tables);await expectCode(subjectApi.PUT(req({nome:'Não deve salvar',turmaIds:[]}),ctx(11)),'OFERTA_COM_HISTORICO',409);assert.deepEqual(tables,before);});
test('pré-requisito de outra instituição é recusado antes de gravar',async()=>{reset();await expectCode(subjectApi.PUT(req({preRequisitoIds:[91]}),ctx(11)),'PRE_REQUISITO_INVALIDO');assert.equal(calls.length,0);});
const newClass=extra=>({nome:'Nova turma',semestre:'1',periodoLetivo:'2027.1',cursoId:1,disciplinaIds:[11],professorId:41,poloId:51,...extra});
test('criação de turma aceita disciplina da grade mesmo com campo direto diferente',async()=>{reset();const res=await classApi.POST(req(newClass({semestre:'1º semestre'})));assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.ok(tables.classes.some(c=>c.nome==='Nova turma'));});
for(const [extra,code] of [[{cursoId:9},'CURSO_INVALIDO'],[{disciplinaIds:[91]},'DISCIPLINAS_INVALIDAS'],[{disciplinaIds:[13]},'GRADE_INCOMPATIVEL'],[{professorId:49},'PROFESSOR_INVALIDO'],[{professoresPorDisciplina:{11:49}},'PROFESSOR_INVALIDO'],[{poloId:59},'POLO_INVALIDO']])test(`criação bloqueia ${code}`,async()=>{reset();await expectCode(classApi.POST(req(newClass(extra))),code);assert.equal(tables.classes.length,3);});
test('edição parcial da turma mantém professores, datas e horários omitidos',async()=>{reset();const before=structuredClone([tables.offers,tables.hours]);const res=await classDetail.PUT(req({nome:'Turma renomeada',disciplinaIds:[11]}),ctx(31));assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.deepEqual([tables.offers,tables.hours],before);assert.equal(calls.some(c=>c[0]==='hours.delete'),false);});
test('disciplina histórica fora da grade atual é mantida, sem admitir nova disciplina inválida',async()=>{reset();tables.courses[0].semestres[0].disciplinas=[];assert.equal((await classDetail.PUT(req({disciplinaIds:[11]}),ctx(31))).status,200);await expectCode(classDetail.PUT(req({disciplinaIds:[11,13]}),ctx(31)),'GRADE_INCOMPATIVEL');});
test('troca de etapa exige validar novamente todas as disciplinas',async()=>{reset();await expectCode(classDetail.PUT(req({semestre:'2',disciplinaIds:[11]}),ctx(31)),'GRADE_INCOMPATIVEL');assert.equal(tables.classes[0].semestre,'1');});
test('mapa de horários malformado não apaga horários existentes',async()=>{reset();const before=structuredClone(tables);await expectCode(classDetail.PUT(req({disciplinaIds:[11],horariosPorDisciplina:{11:'inválido'}}),ctx(31)),'VINCULO_INVALIDO');assert.deepEqual(tables,before);});
test('conflito serializável retorna mensagem de atualização, sem erro genérico',async()=>{const res=rules.respostaErroAcademico({code:'P2034'});assert.equal(res.status,409);assert.equal((await res.json()).codigo,'DADOS_ALTERADOS');});
test('mensagens de integridade têm as mesmas chaves nos cinco idiomas',()=>{let expected;for(const lang of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']){const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../messages/${lang}.json`),'utf8')).AcademicIntegrity;const keys=Object.keys(data).sort();if(expected)assert.deepEqual(keys,expected);expected=keys;assert.ok(data.OFERTA_COM_HISTORICO);}});

test('mudança de etapa de turma com aulas é bloqueada e preserva o cadastro',async()=>{reset();tables.history=[{model:'aula',instituicaoId:10,turmaId:31,disciplinaId:11}];const before=structuredClone(tables);await expectCode(classDetail.PUT(req({semestre:'2',disciplinaIds:[11]}),ctx(31)),'ETAPA_COM_HISTORICO',409);assert.deepEqual(tables,before);});
test('mudança de curso de disciplina com matrículas não altera seu histórico',async()=>{reset();tables.history=[{model:'itemMatricula',instituicaoId:10,turmaId:31,disciplinaId:11}];const before=structuredClone(tables);await expectCode(subjectApi.PUT(req({cursoId:1}),ctx(11)),'ETAPA_COM_HISTORICO',409);assert.deepEqual(tables,before);});

const organization = require('../lib/academico/organizacao.ts');
function annualFixture() {
  reset();
  Object.assign(tables.courses[0],{organizacaoCurricular:'ANUAL',quantidadeEtapas:3,quantidadeSemestres:null});
  tables.courses[0].semestres=[{numero:2,organizacaoCurricular:'ANUAL',disciplinas:[{disciplinaId:11},{disciplinaId:12}]}];
  tables.curriculum=[{id:101,cursoId:1,instituicaoId:10,numero:2,organizacaoCurricular:'ANUAL'}];
  db.cursoSemestre=model('curriculum');
}
test('turma anual grava ano 2 com período 2027 e etapa tipada, sem semestre fictício',async()=>{
  annualFixture();
  const res=await classApi.POST(req(newClass({semestre:'',etapaNumero:2,periodoLetivo:'2027'})));
  assert.equal(res.status,200,JSON.stringify(await res.clone().json()));
  const row=tables.classes.find(t=>t.nome==='Nova turma');
  assert.equal(row.organizacaoCurricular,'ANUAL');assert.equal(row.etapaNumero,2);assert.equal(row.semestre,'');assert.equal(row.periodoLetivo,'2027');
  const stage=tables.stages.find(s=>s.turmaId===row.id);assert.equal(stage.organizacaoCurricular,'ANUAL');assert.equal(stage.numero,2);
  assert.equal(tables.offers.find(o=>o.turmaId===row.id).turmaSemestreId,stage.id);
});
test('turma anual não aceita disciplina de outro ano nem fallback direto',async()=>{
  annualFixture();await expectCode(classApi.POST(req(newClass({etapaNumero:1,semestre:''}))),'GRADE_INCOMPATIVEL');
  tables.courses[0].semestres=[];await expectCode(classApi.POST(req(newClass({etapaNumero:2,semestre:''}))),'GRADE_INCOMPATIVEL');
  assert.equal(tables.classes.length,3);
});
test('ano informado fora da duração ou malformado é rejeitado sem gravação',async()=>{
  for(const value of [0,-1,1.5,'2abc','2027.1',true,4]) {
    annualFixture();await expectCode(classApi.POST(req(newClass({etapaNumero:value,semestre:''}))),'ETAPA_INVALIDA');assert.equal(tables.classes.length,3);
  }
});
test('cliente não pode criar turma semestral para curso anual',async()=>{
  annualFixture();await expectCode(classApi.POST(req(newClass({etapaNumero:2,organizacaoCurricular:'SEMESTRAL'}))),'ORGANIZACAO_INVALIDA');
});
test('editar turma anual mantém etapa, oferta, professor e horários históricos',async()=>{
  annualFixture();Object.assign(tables.classes[0],{organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:'',periodoLetivo:'2027'});
  Object.assign(tables.stages[0],{organizacaoCurricular:'ANUAL',numero:2});
  const before=structuredClone([tables.offers,tables.hours]);
  const res=await classDetail.PUT(req({nome:'Nome atualizado',disciplinaIds:[11],etapaNumero:2}),ctx(31));
  assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.deepEqual([tables.offers,tables.hours],before);assert.equal(tables.classes[0].semestre,'');
});
test('troca de ano curricular com aulas preserva toda a turma e seu histórico',async()=>{
  annualFixture();Object.assign(tables.classes[0],{organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:''});
  tables.history=[{model:'aula',instituicaoId:10,turmaId:31,disciplinaId:11}];const before=structuredClone(tables);
  await expectCode(classDetail.PUT(req({etapaNumero:3,disciplinaIds:[11]}),ctx(31)),'ETAPA_COM_HISTORICO',409);assert.deepEqual(tables,before);
});
test('matrícula anual resolve grade e snapshot próprios sem preencher semestre',async()=>{
  annualFixture();const result=await rules.resolverEtapaDaMatricula(db,10,1,101,null);
  assert.deepEqual(result,{organizacaoCurricular:'ANUAL',etapaNumero:2,cursoSemestreId:101,semestre:null});
  assert.deepEqual(await rules.resolverEtapaDaMatricula(db,10,1,null,2),result);
});
test('matrícula recusa etapa de outro curso, instituição ou organização e número divergente',async()=>{
  for(const mutate of [()=>{},()=>tables.curriculum[0].cursoId=2,()=>tables.curriculum[0].instituicaoId=20,()=>tables.curriculum[0].organizacaoCurricular='SEMESTRAL']) {
    annualFixture();mutate();await assert.rejects(rules.resolverEtapaDaMatricula(db,10,1,101,1),e=>e.codigo==='ETAPA_INVALIDA');
  }
  annualFixture();await assert.rejects(rules.resolverEtapaDaMatricula(db,10,1,null,null),e=>e.codigo==='ETAPA_INVALIDA');
});
test('matrícula semestral conserva o número e os IDs legados',async()=>{
  annualFixture();tables.courses[0].organizacaoCurricular='SEMESTRAL';tables.curriculum[0].organizacaoCurricular='SEMESTRAL';
  assert.deepEqual(await rules.resolverEtapaDaMatricula(db,10,1,101,2),{organizacaoCurricular:'SEMESTRAL',etapaNumero:2,cursoSemestreId:101,semestre:2});
});
test('curso em uso não permite trocar organização mesmo se não houver turma ativa',async()=>{
  for(const inUse of ['cursoSemestre','disciplina','turma','matricula','cursoPublicacaoRede']) {
    const fixture=Object.fromEntries(['cursoSemestre','disciplina','turma','matricula','cursoPublicacaoRede'].map(name=>[name,{count:async args=>{assert.ok(args.where.instituicaoId===10||args.where.instituicaoOrigemId===10);return name===inUse?1:0;}}]));
    await assert.rejects(rules.protegerOrganizacaoDoCurso(fixture,10,1),e=>e.codigo==='ORGANIZACAO_EM_USO');
  }
});
test('documentos separam ano curricular de semestre com aliases neutros',()=>{
  assert.deepEqual(organization.valoresEtapaDocumento({organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:null}),{etapaAtual:'Ano 2',organizacaoCurricular:'Anual',anoCurricular:'2'});
  assert.equal(organization.valoresEtapaDocumento({semestre:3}).etapaAtual,'Semestre 3');
  assert.equal(organization.valoresEtapaDocumento({organizacaoCurricular:'ANUAL',etapaNumero:2},'en-US').etapaAtual,'Year 2');
});
test('organização tem chaves e traduções completas nos cinco idiomas',()=>{
  let keys;for(const lang of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']) {
    const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../messages/${lang}.json`),'utf8')).AcademicStructure;
    if(keys)assert.deepEqual(Object.keys(data).sort(),keys);keys=Object.keys(data).sort();assert.ok(data.ANUAL&&data.SEMESTRAL&&data.annualSubjectHelp);
  }
});

const courseApi=require('../app/api/admin/cursos/route.ts');
function courseEditingFixture() {
  reset();tables.curriculum=[];tables.matriculas=[];tables.publications=[];
  db.cursoSemestre=model('curriculum');db.matricula=model('matriculas');db.cursoPublicacaoRede=model('publications');
  db.periodoMatricula={count:async()=>0};db.rematriculaSemestral={count:async()=>0};
  db.curso.update=async ({where,data})=>assignDefined(tables.courses.find(c=>c.id===where.id),data);
  db.curso.findUnique=async ({where})=>tables.courses.find(c=>c.id===where.id);
  tables.courses.forEach(c=>Object.assign(c,{organizacaoCurricular:'SEMESTRAL',publicacaoRedeDestino:null,nome:`Curso ${c.id}`,codigo:null}));
  tables.courses.push({id:3,instituicaoId:10,organizacaoCurricular:'SEMESTRAL',publicacaoRedeDestino:null,nome:'Curso novo',codigo:null});
}
test('API de curso vazio permite organização anual sem impor 12 parcelas',async()=>{
  courseEditingFixture();
  const res=await courseApi.PUT(req({id:3,organizacaoCurricular:'ANUAL',quantidadeEtapas:2,valorMatricula:80,valorMensalidade:200,quantidadeParcelas:10}));
  assert.equal(res.status,200,JSON.stringify(await res.clone().json()));const row=tables.courses.find(c=>c.id===3);
  assert.equal(row.organizacaoCurricular,'ANUAL');assert.equal(row.quantidadeEtapas,2);assert.equal(row.quantidadeSemestres,null);assert.equal(row.quantidadeParcelas,10);assert.equal(row.valorMensalidade,200);
});
test('API de curso bloqueia conversão com estrutura e responde 409 sem mudanças',async()=>{
  courseEditingFixture();const before=structuredClone(tables);
  await expectCode(courseApi.PUT(req({id:1,organizacaoCurricular:'ANUAL',quantidadeEtapas:1})),'ORGANIZACAO_COM_VINCULOS',409);assert.deepEqual(tables,before);
});
test('API de curso conserva a organização anual e quantidade quando omitidas',async()=>{
  courseEditingFixture();Object.assign(tables.courses.find(c=>c.id===3),{organizacaoCurricular:'ANUAL',quantidadeEtapas:2});
  const res=await courseApi.PUT(req({id:3,nome:'Nome atualizado',valorMensalidade:200,quantidadeParcelas:10}));
  assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.equal(tables.courses.find(c=>c.id===3).organizacaoCurricular,'ANUAL');assert.equal(tables.courses.find(c=>c.id===3).quantidadeEtapas,2);
});
test('API de curso não edita outra instituição nem aceita organização desconhecida',async()=>{
  courseEditingFixture();assert.equal((await courseApi.PUT(req({id:9,organizacaoCurricular:'ANUAL'}))).status,404);
  await expectCode(courseApi.PUT(req({id:3,organizacaoCurricular:'BIMESTRAL'})),'ORGANIZACAO_INVALIDA');
});
test('rematrícula anual aceita turma do ano de destino e rejeita ano, curso ou organização diferentes',async()=>{
  annualFixture();Object.assign(tables.classes[0],{organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:'',ativa:true});
  await rules.validarTurmasDaEtapa(db,10,1,101,[31]);
  for (const delta of [{etapaNumero:1},{cursoId:2},{organizacaoCurricular:'SEMESTRAL'},{instituicaoId:20},{ativa:false}]) {
    annualFixture();Object.assign(tables.classes[0],{organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:'',ativa:true},delta);
    await assert.rejects(rules.validarTurmasDaEtapa(db,10,1,101,[31]),e=>e.codigo==='ETAPA_INVALIDA');
  }
});
test('matrícula anual valida todas as novas ofertas principais, preservando ofertas já contratadas',async()=>{
  annualFixture();Object.assign(tables.classes[0],{organizacaoCurricular:'ANUAL',etapaNumero:2,semestre:'',ativa:true});
  const item={turmaId:31,disciplinaId:11,tipoItem:'GRADE_PRINCIPAL'};
  db.cursoSemestreDisciplina={count:async ({where})=>{assert.equal(where.cursoSemestreId,101);assert.equal(where.instituicaoId,10);return where.disciplinaId.in.includes(11)?1:0;}};
  db.itemMatricula.findMany=async()=>[{...item}];
  await rules.validarItensAnuaisDaMatricula(db,10,1,101,[item]);
  await assert.rejects(rules.validarItensAnuaisDaMatricula(db,10,1,101,[{...item,disciplinaId:13}]),e=>e.codigo==='GRADE_INCOMPATIVEL');
  tables.classes[0].etapaNumero=1;
  await assert.rejects(rules.validarItensAnuaisDaMatricula(db,10,1,101,[item]),e=>e.codigo==='ETAPA_INVALIDA');
  await rules.validarItensAnuaisDaMatricula(db,10,1,101,[item],1000);
});
