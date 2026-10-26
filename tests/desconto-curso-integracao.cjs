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
const livre=require('../app/api/admin/matriculas/cursos-livres/route.ts'),cursosApi=require('../app/api/admin/cursos/route.ts'),{mensalidadeComDesconto}=require('../lib/matriculas/desconto-curso.ts');
const unique=crypto.randomUUID();let inst,polo,aluno,curso,turma,disciplina;
const req=b=>new Request('http://localhost/api/matricula',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});
const body=more=>({alunoId:aluno.id,cursoId:curso.id,turmaPrincipalId:turma.id,etapaNumero:1,semestre:null,tipoContratacao:'CURSO_COMPLETO',itensMatricula:[{turmaId:turma.id,disciplinaId:disciplina.id,tipoItem:'GRADE_PRINCIPAL'}],valorMatricula:98.5,valorPagoMatricula:0,valorMensalidade:539.1,quantidadeMensalidades:12,dataPrimeiroVencimento:'2027-01-10',periodoLetivo:'2027',...more});
test('desconto de curso integrado ao financeiro em PostgreSQL',async t=>{try{
inst=await db.instituicao.create({data:{nome:'TESTE MATRÍCULA ANUAL',slug:'test-anual-'+unique,updatedAt:new Date(),isentaPagamento:true}});
const admin=await db.user.create({data:{nome:'Admin teste',email:'admin-anual-'+unique+'@example.invalid',senha:'sem-login',role:'ADMIN',instituicaoId:inst.id}});user={id:admin.id,instituicaoId:inst.id,role:'ADMIN'};
polo=await db.polo.create({data:{nome:'Polo teste',instituicaoId:inst.id}});
const u=await db.user.create({data:{nome:'Aluno teste',email:'aluno-anual-'+unique+'@example.invalid',senha:'sem-login',role:'ALUNO',instituicaoId:inst.id}});
aluno=await db.aluno.create({data:{nome:'Aluno teste',userId:u.id,instituicaoId:inst.id,poloId:polo.id,dataNascimento:new Date('1990-01-01')}});
curso=await db.curso.create({data:{nome:'PEVI / Robótica teste',codigo:'TEST-'+unique,instituicaoId:inst.id,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,valorMatricula:98.5,valorMensalidade:539.1,quantidadeParcelas:12}});
disciplina=await db.disciplina.create({data:{nome:'PEVI e Robótica teste',cursoId:curso.id,instituicaoId:inst.id,semestre:null,cargaHoraria:100}});
turma=await db.turma.create({data:{nome:'PEVI teste 2027',cursoId:curso.id,instituicaoId:inst.id,poloId:polo.id,organizacaoCurricular:'ANUAL',etapaNumero:1,semestre:'',periodoLetivo:'2027'}});
await db.turmaDisciplina.create({data:{instituicaoId:inst.id,turmaId:turma.id,disciplinaId:disciplina.id}});

await t.test('curso salva e edita percentual opcional sem modificar o preço integral',async()=>{
 const r=await cursosApi.POST(req({nome:'Curso desconto API '+unique,codigo:'DESC-'+unique,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,valorMatricula:98.5,valorMensalidade:539.1,quantidadeParcelas:12,descontoMensalidadePercentual:40,poloIds:[polo.id]}));const c=await r.json();assert.equal(r.status,201,JSON.stringify(c));assert.equal(Number(c.descontoMensalidadePercentual),40);assert.equal(Number(c.valorMensalidade),539.1);
 const base={id:c.id,nome:c.nome,codigo:c.codigo,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,valorMatricula:98.5,valorMensalidade:539.1,quantidadeParcelas:12};
 for(const p of ['',25]){const r=await cursosApi.PUT(req({...base,descontoMensalidadePercentual:p}));assert.equal(r.status,200,JSON.stringify(await r.clone().json()));const saved=await db.curso.findUnique({where:{id:c.id}});assert.equal(saved.descontoMensalidadePercentual==null?null:Number(saved.descontoMensalidadePercentual),p===''?null:25);}
 for(const invalid of [-1,101,true])assert.equal((await cursosApi.PUT(req({...base,descontoMensalidadePercentual:invalid}))).status,400);
});
let mid;
await t.test('mensalidade líquida entra uma vez e gera 12 parcelas de 323,46 com taxa integral',async()=>{
 await db.curso.update({where:{id:curso.id},data:{descontoMensalidadePercentual:40}});
 const valor=mensalidadeComDesconto(curso.valorMensalidade,40);const r=await api.POST(req(body({valorMensalidade:valor})));const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));mid=j.matricula.id;
 const ls=await db.lancamentoFinanceiro.findMany({where:{matriculaId:mid}});assert.equal(ls.length,13);assert.ok(ls.filter(l=>l.tipo==='MENSALIDADE').every(l=>l.valorFinal===323.46&&l.status==='PENDENTE'));assert.equal(ls.find(l=>l.tipo==='MATRICULA').valorFinal,98.5);
 await db.curso.update({where:{id:curso.id},data:{descontoMensalidadePercentual:null}});assert.equal(Number((await db.matricula.findUnique({where:{id:mid}})).valorMensalidade),323.46);assert.ok((await db.lancamentoFinanceiro.findMany({where:{matriculaId:mid,tipo:'MENSALIDADE'}})).every(l=>l.valorFinal===323.46));
});
await t.test('100% gera matrícula sem mensalidades a pagar e a edição preserva zero',async()=>{
 const u2=await db.user.create({data:{nome:'Aluno isento teste',email:'aluno-isento-'+unique+'@example.invalid',senha:'sem-login',role:'ALUNO',instituicaoId:inst.id}});const a2=await db.aluno.create({data:{nome:u2.nome,userId:u2.id,instituicaoId:inst.id,poloId:polo.id,dataNascimento:new Date('1990-01-01')}});
 await db.curso.update({where:{id:curso.id},data:{descontoMensalidadePercentual:100}});const r=await api.POST(req(body({alunoId:a2.id,valorMensalidade:0})));const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));assert.equal(await db.lancamentoFinanceiro.count({where:{matriculaId:j.matricula.id,tipo:'MENSALIDADE'}}),0);
 const edit=await api.PUT(req({id:j.matricula.id,valorMensalidade:0}));assert.equal(edit.status,200,JSON.stringify(await edit.clone().json()));assert.equal(Number((await db.matricula.findUnique({where:{id:j.matricula.id}})).valorMensalidade),0);
});
let cLivre,trLivre;
await t.test('curso livre semanal conserva 150; mensal recebe 40% e cobra 288 uma única vez',async()=>{
 cLivre=await db.curso.create({data:{nome:'Livre desconto teste',instituicaoId:inst.id,organizacaoCurricular:'LIVRE',valorMatricula:0,valorSemanal:150,valorMensalidade:480,descontoMensalidadePercentual:40}});
 const d=await db.disciplina.create({data:{nome:'Livre desconto',cursoId:cLivre.id,instituicaoId:inst.id}});trLivre=await db.turma.create({data:{nome:'Livre desconto teste',cursoId:cLivre.id,instituicaoId:inst.id,poloId:polo.id,organizacaoCurricular:'LIVRE',semestre:'',periodoLetivo:'2027',disciplinas:{create:{instituicaoId:inst.id,disciplinaId:d.id}}}});
 for(const [periodicidade,dataInicio,dataFim,valor] of [['SEMANAL','2027-05-01','2027-05-07',150],['MENSAL','2027-06-01','2027-06-30',288]]){
  const b={alunoId:aluno.id,cursoId:cLivre.id,turmaId:trLivre.id,periodicidade,dataInicio,dataFim,chave:crypto.randomUUID(),valor:1};const r=await livre.POST(req(b));const j=await r.json();assert.equal(r.status,201,JSON.stringify(j));const l=await db.lancamentoFinanceiro.findUnique({where:{id:j.lancamentoId}});assert.equal(l.valorFinal,valor);assert.equal(l.valorOriginal,periodicidade==='SEMANAL'?150:480);assert.equal(l.status,'PENDENTE');assert.equal((await livre.POST(req(b))).status,201);assert.equal(await db.periodoCursoLivre.count({where:{lancamentoId:j.lancamentoId}}),1);
 }
});
await t.test('desconto integral mensal livre quita o período sem recebimento ou movimento de caixa',async()=>{
 await db.curso.update({where:{id:cLivre.id},data:{descontoMensalidadePercentual:100}});const r=await livre.POST(req({alunoId:aluno.id,cursoId:cLivre.id,turmaId:trLivre.id,periodicidade:'MENSAL',dataInicio:'2027-07-01',dataFim:'2027-07-31',chave:crypto.randomUUID()}));const j=await r.json();assert.equal(r.status,201,JSON.stringify(j));const p=await db.periodoCursoLivre.findUnique({where:{id:j.periodoId},include:{lancamento:true}});assert.equal(Number(p.valor),0);assert.equal(p.lancamento.valorOriginal,480);assert.equal(p.lancamento.descontoValor,480);assert.equal(p.lancamento.valorFinal,0);assert.equal(p.lancamento.valorPago,0);assert.equal(p.lancamento.status,'PAGO');assert.equal(p.lancamento.pagoEm,null);assert.equal(await db.movimentoCaixa.count({where:{instituicaoId:inst.id}}),0);
 await assert.rejects(db.periodoCursoLivre.update({where:{id:p.id},data:{valor:-1}}));await assert.rejects(db.curso.update({where:{id:cLivre.id},data:{descontoMensalidadePercentual:101}}));
});
}finally{await db.$disconnect();}});
}
