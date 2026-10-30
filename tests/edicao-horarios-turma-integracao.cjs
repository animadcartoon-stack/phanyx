'use strict';
// Teste explícito: grava fixtures temporárias SOMENTE na branch isolada e remove em finally.
// Não lê DATABASE_URL, não executa migração e não usa Asaas, e-mail ou WhatsApp.
const assert=require('node:assert/strict'),{PrismaClient}=require('@prisma/client'),Module=require('node:module'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
if(!process.argv.includes('--test'))throw Error('Use --test com a configuração explícita do banco isolado.');
const url=process.env.PHANYX_TEST_DATABASE_URL;
if(process.env.PHANYX_TEST_BRANCH_ID!=='br-blue-base-aclw74mj'||!new URL(url).hostname.startsWith('ep-patient-wind-acuj36yq'))throw Error('Banco isolado obrigatório');
const db=new PrismaClient({datasources:{db:{url}}}),tag='TESTE-EDICAO-HORARIO-'+Date.now(),ids={courses:[],classes:[],disciplines:[],users:[],students:[],professors:[]};
let usuario={id:105,role:'ADMIN',instituicaoId:26},n=0;const pass=s=>console.log('OK '+(++n)+': '+s);
const original=Module._load,resolve=Module._resolveFilename,ext=Module._extensions['.ts'],root=path.resolve(__dirname,'..');
Module._resolveFilename=function(req,parent,...rest){if(req.startsWith('@/'))req=path.join(root,req.slice(2));return resolve.call(this,req,parent,...rest);};
Module._extensions['.ts']=function(m,file){m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);};
Module._load=function(req,parent,isMain){
 if(req==='@/lib/prisma')return {prisma:db};
 if(req==='@/lib/server-auth')return {getUserFromToken:async()=>usuario,isAdminLike:r=>r==='ADMIN'};
 if(req==='@/lib/contratos/contrato-matricula')return {criarContratoPendenteMatricula:()=>{throw Error('Contrato não autorizado no teste de edição')}};
 if(req==='next/headers')return {cookies:async()=>({get:()=>usuario?{value:'fixture-sem-login'}:undefined})};
 if(req==='jsonwebtoken')return {verify:()=>usuario};
 if(req==='next/server')return {NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),{status:init?.status||200,headers:{...init?.headers,'Content-Type':'application/json'}})}};
 return original.call(this,req,parent,isMain);
};
const api=require('../app/api/turma/[id]/route.ts'),agenda={...require('../lib/matriculas/modalidades-servidor.ts'),...require('../lib/matriculas/validar-agenda.ts')};Module._load=original;Module._resolveFilename=resolve;if(ext)Module._extensions['.ts']=ext;else delete Module._extensions['.ts'];
const slot=(inicio='13:30',fim='15:10')=>[{diaSemana:2,horaInicio:inicio,horaFim:fim}];
async function put(id,body){const r=await api.PUT(new Request('http://test.invalid/api/turma/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{params:{id:String(id)}});return {status:r.status,body:await r.json()};}
async function klass(c,nome,extra={}){const t=await db.turma.create({data:{nome:tag+' '+nome,instituicaoId:26,cursoId:c.id,organizacaoCurricular:'ANUAL',etapaNumero:1,semestre:'',periodoLetivo:'2027',turno:'VESPERTINO',modalidade:'PRESENCIAL',ativa:true,statusTurma:'A_INICIAR',capacidadeMinima:8,capacidadeMaxima:12,...extra}});ids.classes.push(t.id);return t;}
async function course(nome,direta=false){const c=await db.curso.create({data:{nome:tag+' '+nome,instituicaoId:26,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,matriculaDiretaTurma:direta,ativo:true}});ids.courses.push(c.id);return c;}
async function user(role){const u=await db.user.create({data:{nome:tag+' '+role,instituicaoId:26,email:tag.toLowerCase()+'-'+role+'@example.invalid',senha:'fixture-sem-login',role}});ids.users.push(u.id);return u;}
async function own(id){return db.turmaHorarioAvulso.findMany({where:{turmaId:id,instituicaoId:26},orderBy:{id:'asc'}});}
(async()=>{
 const c=await course('PEVI'),d=await db.disciplina.create({data:{instituicaoId:26,cursoId:c.id,nome:tag+' Disciplina'}});ids.disciplines.push(d.id);
 const etapa=await db.cursoSemestre.create({data:{instituicaoId:26,cursoId:c.id,numero:1,organizacaoCurricular:'ANUAL',disciplinas:{create:{instituicaoId:26,disciplinaId:d.id}}}});
 const u=await user('ALUNO'),a=await db.aluno.create({data:{nome:tag,instituicaoId:26,userId:u.id}});ids.students.push(a.id);
 const up=await user('PROFESSOR'),prof=await db.professor.create({data:{instituicaoId:26,userId:up.id,nome:tag+' Professor'}});ids.professors.push(prof.id);
 const t=await klass(c,'I3V',{professorId:prof.id,codigo:'TESTE-I3V'}),outra=await klass(c,'I3M',{professorId:prof.id});
 const td=await db.turmaDisciplina.create({data:{instituicaoId:26,turmaId:t.id,disciplinaId:d.id,horarios:{create:{instituicaoId:26,diaSemana:2,horaInicio:'08:00',horaFim:'09:40'}}}});
 const cursoAntes=await db.curso.findUnique({where:{id:c.id},include:{semestres:{include:{disciplinas:true}}}}),outraAntes=await db.turma.findUnique({where:{id:outra.id}});
 let r=await put(t.id,{nome:tag+' I3V editada',disciplinaIds:[],horariosTurma:slot(),professorId:prof.id});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.cursoId,c.id);assert.equal(r.body.disciplinas.length,0);assert.equal(r.body.horariosAvulsos[0].horaInicio,'13:30');
 assert.deepEqual(await db.curso.findUnique({where:{id:c.id},include:{semestres:{include:{disciplinas:true}}}}),cursoAntes);assert.deepEqual(await db.turma.findUnique({where:{id:outra.id}}),outraAntes);assert.equal(await db.disciplina.count({where:{id:d.id}}),1);assert.equal(await db.turmaDisciplina.count({where:{id:td.id}}),0);pass('Editar sem disciplina grava horário geral e preserva curso, grade, catálogo e outra turma');
 const detalhe=await api.GET(new Request('http://test.invalid'),{params:{id:String(t.id)}});assert.equal((await detalhe.json()).horariosAvulsos[0].horaFim,'15:10');pass('Leitura após gravação devolve os horários próprios');
 r=await put(t.id,{nome:tag+' Nome parcial'});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.codigo,'TESTE-I3V');assert.equal(r.body.capacidadeMinima,8);assert.equal(r.body.capacidadeMaxima,12);assert.equal(r.body.horariosAvulsos[0].horaInicio,'13:30');pass('Edição parcial preserva dados e horários omitidos');
 const antes=await db.turma.findUnique({where:{id:t.id}}),hAntes=await own(t.id);
 for(const h of [[{diaSemana:2,horaInicio:'',horaFim:'15:10'}],slot('16:00','15:10'),[...slot(),...slot('14:00','16:00')]]){r=await put(t.id,{nome:'NÃO SALVAR',disciplinaIds:[],horariosTurma:h});assert.equal(r.status,400,JSON.stringify(r));assert.deepEqual(await db.turma.findUnique({where:{id:t.id}}),antes);assert.deepEqual(await own(t.id),hAntes);}pass('Horário incompleto, invertido ou sobreposto é rejeitado sem gravação parcial');
 assert.equal((await put(outra.id,{disciplinaIds:[],horariosTurma:slot(),professorId:prof.id})).status,200);assert.equal((await own(outra.id))[0].horaInicio,'13:30');pass('Várias turmas do mesmo curso e professor podem compartilhar dia e horário');
 assert.equal((await put(outra.id,{disciplinaIds:[],horariosTurma:[]})).status,200);assert.equal((await own(outra.id)).length,0);pass('Horário geral opcional pode ser removido em turma sem uso');
 usuario={...usuario,instituicaoId:1};assert.equal((await put(t.id,{disciplinaIds:[],horariosTurma:slot('16:00','17:00')})).status,404);usuario={...usuario,instituicaoId:26};assert.deepEqual(await own(t.id),hAntes);pass('Isolamento institucional preserva a turma e seus horários');
 usuario=null;assert.equal((await put(t.id,{})).status,401);usuario={id:105,instituicaoId:26,role:'PROFESSOR'};assert.equal((await put(t.id,{})).status,403);usuario.role='ADMIN';pass('Edição continua exigindo autenticação e administrador');
 const direto=await course('Avulso',true),ta=await klass(direto,'Turma direta');assert.equal((await put(ta.id,{disciplinaIds:[],horariosTurma:slot()})).status,400);assert.equal((await own(ta.id)).length,0);pass('Rota legada não contorna as proteções de edição de turmas avulsas');
 const comHistorico=await klass(c,'Com histórico',{professorId:prof.id});await db.turmaDisciplina.create({data:{instituicaoId:26,turmaId:comHistorico.id,disciplinaId:d.id}});
 const m=await db.matricula.create({data:{instituicaoId:26,alunoId:a.id,cursoId:c.id,turmaPrincipalId:comHistorico.id,cursoSemestreId:etapa.id,organizacaoCurricular:'ANUAL',etapaNumero:1,status:'CANCELADA'}});
 const mAntes=await db.matricula.findUnique({where:{id:m.id}});r=await put(comHistorico.id,{nome:'NÃO ALTERAR',disciplinaIds:[],horariosTurma:slot()});assert.equal(r.status,409,JSON.stringify(r));assert.deepEqual(await db.matricula.findUnique({where:{id:m.id}}),mAntes);assert.equal(await db.turmaDisciplina.count({where:{turmaId:comHistorico.id}}),1);pass('Matrícula principal cancelada, sem itens, protege a retirada de vínculo');
 const snap=await klass(c,'Snapshot');await db.matricula.update({where:{id:m.id},data:{contratacaoModalidades:{ofertas:[{turmaId:snap.id}]}}});assert.equal((await put(snap.id,{horariosTurma:slot(),disciplinaIds:[]})).status,409);assert.equal((await own(snap.id)).length,0);pass('Snapshot contratual sem FK impede mudanças de estrutura e horário');
 const origem=await klass(c,'Origem');await klass(c,'Derivada',{codigo:'OFERTA-'+origem.id+'-'+c.id});assert.equal((await put(origem.id,{horariosTurma:slot(),disciplinaIds:[]})).status,409);pass('Oferta compartilhada protege horários da origem');
 // Os horários gerais também participam da agenda quando há ofertas curriculares.
 const existente=await klass(c,'Agenda existente'),candidata=await klass(c,'Agenda candidata');
 for(const x of [existente,candidata])await db.turmaDisciplina.create({data:{instituicaoId:26,turmaId:x.id,disciplinaId:d.id}});
 assert.equal((await put(existente.id,{disciplinaIds:[d.id],horariosTurma:slot()})).status,200);assert.equal((await put(candidata.id,{disciplinaIds:[d.id],horariosTurma:slot('14:00','16:00')})).status,200);
 const me=await db.matricula.create({data:{instituicaoId:26,alunoId:a.id,cursoId:c.id,turmaPrincipalId:existente.id,organizacaoCurricular:'ANUAL',etapaNumero:1,status:'ATIVA',dataInicioCurso:new Date('2027-02-01T12:00:00Z')}});
 await db.itemMatricula.create({data:{instituicaoId:26,matriculaId:me.id,turmaId:existente.id,disciplinaId:d.id}});
 const atuais=await agenda.horariosAtuaisAluno(db,26,a.id);assert.ok(atuais.horarios.some(h=>h.turmaId===existente.id&&h.horaInicio==='13:30'));pass('Agenda de matrícula anterior usa horário geral quando a disciplina não tem horário específico');
 const ofertas=await agenda.carregarOfertasModalidades(db,26),o=ofertas.find(o=>o.id===candidata.id);assert.equal(o.horarios[0].horaInicio,'14:00');assert.equal(o.horariosPendentes,false);assert.equal(ofertas.find(o=>o.id===t.id).horariosPendentes,true);pass('Prévia usa horário geral e mantém pendente a matrícula curricular sem ofertas, sem inventar disciplina');
 let conflito;try{await db.$transaction(tx=>agenda.validarAgendaMatricula(tx,{instituicaoId:26,alunoId:a.id,itens:[{turmaId:candidata.id,disciplinaId:d.id}],exigirHorarios:true}));}catch(e){conflito=e;}assert.equal(conflito?.codigo,'CONFLITO_HORARIO');pass('Matrícula tradicional detecta sobreposição com horário geral e matrícula anterior');
 assert.equal((await put(candidata.id,{disciplinaIds:[d.id],horariosTurma:slot('16:00','17:00')})).status,200);await db.$transaction(tx=>agenda.validarAgendaMatricula(tx,{instituicaoId:26,alunoId:a.id,itens:[{turmaId:candidata.id,disciplinaId:d.id}],exigirHorarios:true}));pass('Horários gerais compatíveis são aceitos pela verificação da matrícula');
 const v=await db.turmaDisciplina.findFirst({where:{turmaId:candidata.id,disciplinaId:d.id}});await db.turmaDisciplinaHorario.create({data:{instituicaoId:26,turmaDisciplinaId:v.id,diaSemana:2,horaInicio:'08:00',horaFim:'09:40'}});assert.equal((await agenda.carregarOfertasModalidades(db,26)).find(o=>o.id===candidata.id).horarios[0].horaInicio,'08:00');pass('Horário específico da disciplina prevalece sobre o horário geral');
 const existentesAntes=await own(existente.id);assert.equal((await put(existente.id,{nome:tag+' Renomeada com histórico',disciplinaIds:[d.id],horariosTurma:slot()})).status,200);assert.deepEqual(await own(existente.id),existentesAntes);assert.equal((await put(existente.id,{disciplinaIds:[d.id],horariosTurma:slot('10:00','11:40')})).status,409);assert.deepEqual(await own(existente.id),existentesAntes);pass('Horário inalterado permite edição básica com histórico; mudança é bloqueada atomicamente');
 console.log('APROVADO: '+n+' verificações dos handlers atuais com PostgreSQL real');
})().catch(e=>{console.error('FALHA: '+String(e.stack||e.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[conexão omitida]'));process.exitCode=1;}).finally(async()=>{try{
 await db.$transaction(async tx=>{
  await tx.matricula.deleteMany({where:{instituicaoId:26,alunoId:{in:ids.students}}});
  await tx.turma.deleteMany({where:{id:{in:ids.classes},instituicaoId:26,nome:{startsWith:tag}}});
  await tx.cursoSemestre.deleteMany({where:{instituicaoId:26,cursoId:{in:ids.courses}}});
  await tx.disciplina.deleteMany({where:{id:{in:ids.disciplines},instituicaoId:26,nome:{startsWith:tag}}});
  await tx.curso.deleteMany({where:{id:{in:ids.courses},instituicaoId:26,nome:{startsWith:tag}}});
  await tx.professor.deleteMany({where:{id:{in:ids.professors},instituicaoId:26,nome:{startsWith:tag}}});
  await tx.user.deleteMany({where:{id:{in:ids.users},instituicaoId:26,nome:{startsWith:tag}}});
 },{timeout:20000});
 assert.equal(await db.turma.count({where:{id:{in:ids.classes}}}),0);assert.equal(await db.curso.count({where:{id:{in:ids.courses}}}),0);assert.equal(await db.user.count({where:{id:{in:ids.users}}}),0);console.log('OK: Dados fictícios removidos e ausência confirmada');
 }catch(e){console.error('FALHA NA LIMPEZA: '+e.message);process.exitCode=1;}finally{await db.$disconnect();}});
