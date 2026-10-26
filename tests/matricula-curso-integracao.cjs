// Optativo: somente banco local ou ponte local de uma branch isolada, nunca produção.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
if(process.env.PHANYX_LIVRE_TESTE!=='1'){test('matrícula anual em PostgreSQL',{skip:'Exige banco de teste isolado.'},()=>{});}else{
assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
let user=null;const resolve=Module._resolveFilename;Module._resolveFilename=function(req,parent,...rest){return resolve.call(this,req.startsWith('@/')?path.resolve(__dirname,'..',req.slice(2)):req,parent,...rest);};
const load=Module._load;Module._load=function(req,parent,main){
 if(req==='@/lib/server-auth')return {getUserFromToken:async()=>user,isAdminLike:r=>r==='ADMIN',temPermissao:async()=>true};
 if(req==='@/lib/contratos/contrato-matricula')return {criarContratoPendenteMatricula:async()=>({id:0,conteudo:'Contrato de teste isolado'})};
 if(req==='@/lib/contratos/enviar-contrato-assinatura')return {enviarContratoParaAssinatura:async()=>{throw Error('Envio externo proibido no teste');}};
 if(req==='@/lib/comercial/processar-comissao')return {processarComissaoAutomatica:async()=>{}};
 if(req==='@/lib/comercial/captacao/enfileirar-evento-saida')return {EVENTOS_SAIDA_CAPTACAO:{},enfileirarEventoSaidaCaptacaoSeguro:async()=>{throw Error('Evento externo proibido no teste');}};
 if(req==='next-intl/server')return {getTranslations:async()=>key=>key};
 if(req==='next/headers')return {cookies:async()=>({get:()=>user?{value:'teste'}:undefined})};if(req==='jsonwebtoken')return {verify:()=>user};if(req==='server-only')return {};
 return load.call(this,req,parent,main);
};
Module._extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const {prisma:db}=require('../lib/prisma.ts'),api=require('../app/api/matricula/route.ts'),config=require('../app/api/admin/matriculas/configuracao-curso/route.ts');
const unique=crypto.randomUUID();let inst,polo,aluno,curso,turma,disciplina;
const req=b=>new Request('http://localhost/api/matricula',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});
const body=more=>({alunoId:aluno.id,cursoId:curso.id,turmaPrincipalId:turma.id,etapaNumero:1,semestre:null,tipoContratacao:'CURSO_COMPLETO',itensMatricula:[{turmaId:turma.id,disciplinaId:disciplina.id,tipoItem:'GRADE_PRINCIPAL'}],valorMatricula:98.5,valorPagoMatricula:0,valorMensalidade:539.1,quantidadeMensalidades:12,dataPrimeiroVencimento:'2027-01-10',periodoLetivo:'2027',...more});
test('matrícula acompanha curso no PostgreSQL',async t=>{try{
inst=await db.instituicao.create({data:{nome:'TESTE MATRÍCULA ANUAL',slug:'test-anual-'+unique,updatedAt:new Date(),isentaPagamento:true}});
const admin=await db.user.create({data:{nome:'Admin teste',email:'admin-anual-'+unique+'@example.invalid',senha:'sem-login',role:'ADMIN',instituicaoId:inst.id}});user={id:admin.id,instituicaoId:inst.id,role:'ADMIN'};
polo=await db.polo.create({data:{nome:'Polo teste',instituicaoId:inst.id}});
const u=await db.user.create({data:{nome:'Aluno teste',email:'aluno-anual-'+unique+'@example.invalid',senha:'sem-login',role:'ALUNO',instituicaoId:inst.id}});
aluno=await db.aluno.create({data:{nome:'Aluno teste',userId:u.id,instituicaoId:inst.id,poloId:polo.id,dataNascimento:new Date('1990-01-01')}});
curso=await db.curso.create({data:{nome:'PEVI / Robótica teste',codigo:'TEST-'+unique,instituicaoId:inst.id,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,valorMatricula:98.5,valorMensalidade:539.1,quantidadeParcelas:12}});
disciplina=await db.disciplina.create({data:{nome:'PEVI e Robótica teste',cursoId:curso.id,instituicaoId:inst.id,semestre:null,cargaHoraria:100}});
turma=await db.turma.create({data:{nome:'PEVI teste 2027',cursoId:curso.id,instituicaoId:inst.id,poloId:polo.id,organizacaoCurricular:'ANUAL',etapaNumero:1,semestre:'',periodoLetivo:'2027'}});
await db.turmaDisciplina.create({data:{instituicaoId:inst.id,turmaId:turma.id,disciplinaId:disciplina.id}});
await t.test('configuração anual não cria etapa de grade ou semestre fictício',async()=>{const r=await config.GET(new Request('http://localhost?cursoId='+curso.id));assert.equal(r.status,200);const rows=await r.json();assert.equal(rows[0].virtual,true);assert.equal(rows[0].disciplinas[0].disciplinaId,disciplina.id);assert.equal(await db.cursoSemestre.count({where:{cursoId:curso.id}}),0);});
let mid;
await t.test('cria matrícula anual sem grade, com taxa 98,50 e 12 mensalidades 539,10 pendentes',async()=>{const r=await api.POST(req(body({})));const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));mid=j.matricula.id;const m=await db.matricula.findUnique({where:{id:mid},include:{disciplinasContratadas:true}});assert.equal(m.semestre,null);assert.equal(m.etapaNumero,1);assert.equal(m.cursoSemestreId,null);assert.equal(m.disciplinasContratadas.length,1);assert.equal(Number(m.valorMatricula),98.5);const ls=await db.lancamentoFinanceiro.findMany({where:{matriculaId:mid}});assert.equal(ls.length,13);assert.equal(ls.filter(l=>l.tipo==='MENSALIDADE').length,12);assert.ok(ls.every(l=>l.status==='PENDENTE'&&Number(l.valorPago)===0));assert.ok(ls.filter(l=>l.tipo==='MENSALIDADE').every(l=>Number(l.valorFinal)===539.1));assert.equal(await db.cursoSemestre.count({where:{cursoId:curso.id}}),0);});
await t.test('edição e bolsa específica não reaplicam o preço do curso',async()=>{const r=await api.PUT(req({id:mid,valorMensalidade:500,bolsaPercentual:10}));assert.equal(r.status,200,JSON.stringify(await r.clone().json()));const m=await db.matricula.findUnique({where:{id:mid}});assert.equal(Number(m.valorMensalidade),500);assert.equal(Number(m.bolsaPercentual),10);assert.equal(m.semestre,null);});
await t.test('seleção de ano inexistente não cria matrícula nem novas cobranças',async()=>{const before=await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}});const r=await api.POST(req(body({etapaNumero:2})));assert.equal(r.status,400);assert.equal(await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}}),before);});
await t.test('isolamento não expõe estrutura de outra instituição',async()=>{const original=user;user={...user,instituicaoId:-1};assert.equal((await config.GET(new Request('http://localhost?cursoId='+curso.id))).status,404);user=original;});
}finally{await db.$disconnect();}});
}
