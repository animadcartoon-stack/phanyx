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
const cursosApi=require('../app/api/admin/cursos/route.ts');
const unique=crypto.randomUUID();let inst,polo,aluno,curso,turma,disciplina;
const req=b=>new Request('http://localhost/api/matricula',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});
const body=more=>({alunoId:aluno.id,cursoId:curso.id,turmaPrincipalId:turma.id,etapaNumero:1,semestre:null,tipoContratacao:'CURSO_COMPLETO',itensMatricula:[{turmaId:turma.id,disciplinaId:disciplina.id,tipoItem:'GRADE_PRINCIPAL'}],valorMatricula:98.5,valorPagoMatricula:0,valorMensalidade:539.1,quantidadeMensalidades:12,dataPrimeiroVencimento:'2027-01-10',periodoLetivo:'2027',...more});

const regras={versao:1,faixas:[{quantidade:1,descontoPercentual:0},{quantidade:2,descontoPercentual:10}]};
test('preço por disciplinas integrado em PostgreSQL',async t=>{try{
inst=await db.instituicao.create({data:{nome:'TESTE PREÇO DISCIPLINAS',slug:'test-disciplinas-'+unique,updatedAt:new Date(),isentaPagamento:true}});
const admin=await db.user.create({data:{nome:'Admin teste',email:'admin-disciplinas-'+unique+'@example.invalid',senha:'sem-login',role:'ADMIN',instituicaoId:inst.id}});user={id:admin.id,instituicaoId:inst.id,role:'ADMIN'};
polo=await db.polo.create({data:{nome:'Polo teste',instituicaoId:inst.id}});
async function alunoTeste(n){const u=await db.user.create({data:{nome:'Aluno teste '+n,email:`aluno-disc-${n}-${unique}@example.invalid`,senha:'sem-login',role:'ALUNO',instituicaoId:inst.id}});return db.aluno.create({data:{nome:u.nome,userId:u.id,instituicaoId:inst.id,poloId:polo.id,dataNascimento:new Date('1990-01-01')}});}
const a1=await alunoTeste(1),a2=await alunoTeste(2),a3=await alunoTeste(3);aluno=a1;
const origem=await db.curso.create({data:{nome:'Acervo de atividades teste',instituicaoId:inst.id}});
curso=await db.curso.create({data:{nome:'PEVI COMPLEMENTAR TESTE',codigo:'TEST-'+unique,instituicaoId:inst.id,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,valorMatricula:98.5,valorMensalidade:139,quantidadeParcelas:12}});
const ds=[];for(const nome of ['Jiu-Jitsu teste','Dança teste','Xadrez teste'])ds.push(await db.disciplina.create({data:{nome,cursoId:origem.id,instituicaoId:inst.id,semestre:1,cargaHoraria:100}}));
const etapa=await db.cursoSemestre.create({data:{cursoId:curso.id,instituicaoId:inst.id,numero:1,organizacaoCurricular:'ANUAL',disciplinas:{create:ds.map(d=>({disciplinaId:d.id,instituicaoId:inst.id}))}}});
turma=await db.turma.create({data:{nome:'Complementar teste 2027',cursoId:curso.id,instituicaoId:inst.id,poloId:polo.id,organizacaoCurricular:'ANUAL',etapaNumero:1,semestre:'',periodoLetivo:'2027'}});
const ofertas=[];for(let i=0;i<ds.length;i++)ofertas.push(await db.turmaDisciplina.create({data:{instituicaoId:inst.id,turmaId:turma.id,disciplinaId:ds[i].id,horarios:{create:{instituicaoId:inst.id,diaSemana:i===1?4:2,horaInicio:'10:00',horaFim:'11:40'}}}}));
const pedido=(a,ids,valor,more={})=>({alunoId:a.id,cursoId:curso.id,cursoSemestreId:etapa.id,etapaNumero:1,semestre:null,turmaPrincipalId:turma.id,tipoContratacao:'PARCIAL',disciplinaIdsContratadas:ids,itensMatricula:ids.map(disciplinaId=>({turmaId:turma.id,disciplinaId,tipoItem:'GRADE_PRINCIPAL'})),valorMatricula:98.5,valorPagoMatricula:0,valorMensalidade:valor,quantidadeMensalidades:12,dataPrimeiroVencimento:'2027-01-10',periodoLetivo:'2027',...more});
async function post(b,status=200){const r=await api.POST(req(b));const j=await r.json();assert.equal(r.status,status,JSON.stringify(j));return j;}
let legacy,m1,m2;
await t.test('matrícula anterior sem regra conserva sua condição contratada',async()=>{legacy=(await post(pedido(a3,[ds[0].id],170))).matricula.id;});
await t.test('ativa preço por disciplinas no curso existente e não acumula desconto geral',async()=>{
 const r=await cursosApi.PUT(req({id:curso.id,nome:curso.nome,codigo:curso.codigo,organizacaoCurricular:'ANUAL',quantidadeEtapas:1,valorMatricula:98.5,valorMensalidade:139,quantidadeParcelas:12,participaCombo:false,descontoMensalidadePercentual:40,regrasPrecoDisciplinas:regras}));const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));const c=await db.curso.findUnique({where:{id:curso.id}});assert.deepEqual(c.regrasPrecoDisciplinas,regras);assert.equal(c.descontoMensalidadePercentual,null);
 const edit=await api.PUT(req({id:legacy}));assert.equal(edit.status,200,JSON.stringify(await edit.clone().json()));const m=await db.matricula.findUnique({where:{id:legacy}});assert.equal(Number(m.valorMensalidade),170);assert.equal(m.contratacaoDisciplinas,null);
});
await t.test('uma disciplina gera 12 parcelas de 139 e uma taxa do curso',async()=>{
 m1=(await post(pedido(a1,[ds[0].id],139))).matricula.id;const ls=await db.lancamentoFinanceiro.findMany({where:{matriculaId:m1}});assert.equal(ls.length,13);assert.equal(ls.filter(l=>l.tipo==='MATRICULA').length,1);assert.equal(ls.find(l=>l.tipo==='MATRICULA').valorFinal,98.5);assert.ok(ls.filter(l=>l.tipo==='MENSALIDADE').every(l=>l.valorFinal===139));
});
await t.test('duas disciplinas com horários compatíveis geram 250,20 sem duplicar taxa ou desconto',async()=>{
 m2=(await post(pedido(a2,[ds[0].id,ds[1].id],250.2))).matricula.id;const m=await db.matricula.findUnique({where:{id:m2},include:{itens:true,disciplinasContratadas:true}});assert.equal(Number(m.valorMensalidade),250.2);assert.equal(m.itens.length,2);assert.equal(m.disciplinasContratadas.length,2);assert.equal(m.contratacaoDisciplinas.quantidade,2);assert.equal(m.contratacaoDisciplinas.descontoValor,27.8);const ls=await db.lancamentoFinanceiro.findMany({where:{matriculaId:m2}});assert.equal(ls.length,13);assert.ok(ls.filter(l=>l.tipo==='MENSALIDADE').every(l=>l.valorFinal===250.2));assert.equal(ls.find(l=>l.tipo==='MATRICULA').valorFinal,98.5);
});
await t.test('recusa terceira disciplina, preço adulterado, horários conflitantes e contratação divergente sem gravar cobranças',async()=>{
 const a=await alunoTeste(4);const before=await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}});
 assert.equal((await post(pedido(a,ds.map(d=>d.id),375),400)).codigo,'QUANTIDADE_DISCIPLINAS_NAO_CONFIGURADA');
 assert.equal((await post(pedido(a,[ds[0].id,ds[1].id],1),409)).codigo,'PRECO_DISCIPLINAS_ALTERADO');
 assert.equal((await post(pedido(a,[ds[0].id,ds[2].id],250.2),409)).codigo,'CONFLITO_HORARIO');
 assert.equal((await post(pedido(a,[ds[0].id,ds[1].id],250.2,{itensMatricula:[{turmaId:turma.id,disciplinaId:ds[0].id,tipoItem:'GRADE_PRINCIPAL'}]}),400)).codigo,'DISCIPLINAS_CONTRATADAS_DIVERGENTES');
 assert.equal((await post(pedido(a,[ds[0].id],139,{dataPrimeiroVencimento:null}),400)).codigo,'PRIMEIRO_VENCIMENTO_NECESSARIO');
 await db.turmaDisciplinaHorario.updateMany({where:{turmaDisciplinaId:ofertas[1].id},data:{ativo:false}});
 assert.equal((await post(pedido(a,[ds[0].id,ds[1].id],250.2),409)).codigo,'HORARIOS_INCOMPLETOS');
 await db.turmaDisciplinaHorario.updateMany({where:{turmaDisciplinaId:ofertas[1].id},data:{ativo:true}});
 assert.equal(await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}}),before);
});
await t.test('mudança futura do curso não reprifica a matrícula nem seus lançamentos',async()=>{
 await db.curso.update({where:{id:curso.id},data:{valorMensalidade:200,regrasPrecoDisciplinas:{versao:1,faixas:[{quantidade:1,descontoPercentual:0},{quantidade:2,descontoPercentual:20}]}}});
 const r=await api.PUT(req({id:m2}));assert.equal(r.status,200,JSON.stringify(await r.clone().json()));assert.equal(Number((await db.matricula.findUnique({where:{id:m2}})).valorMensalidade),250.2);
});
await t.test('editar disciplinas usa condições congeladas, preserva a parcela paga e registra revisão',async()=>{
 const primeira=await db.lancamentoFinanceiro.findFirst({where:{matriculaId:m2,tipo:'MENSALIDADE'},orderBy:{vencimento:'asc'}});await db.lancamentoFinanceiro.update({where:{id:primeira.id},data:{status:'PAGO',valorPago:250.2,pagoEm:new Date()}});
 const b=pedido(a2,[ds[0].id],139);const r=await api.PUT(req({...b,id:m2}));assert.equal(r.status,200,JSON.stringify(await r.clone().json()));const m=await db.matricula.findUnique({where:{id:m2},include:{itens:true}});assert.equal(Number(m.valorMensalidade),139);assert.equal(m.contratacaoDisciplinas.valorUnitario,139);assert.equal(m.contratacaoDisciplinas.revisoes.length,1);assert.equal(m.itens.find(i=>i.disciplinaId===ds[1].id).status,'CANCELADO');const paga=await db.lancamentoFinanceiro.findUnique({where:{id:primeira.id}});assert.equal(paga.valorFinal,250.2);assert.equal(paga.valorPago,250.2);const pendentes=await db.lancamentoFinanceiro.findMany({where:{matriculaId:m2,tipo:'MENSALIDADE',status:{notIn:['PAGO','CANCELADO']}}});assert.equal(pendentes.length,11);assert.ok(pendentes.every(l=>l.valorFinal===139));
});
await t.test('isolamento da instituição continua obrigatório',async()=>{const original=user;user={...user,instituicaoId:-1};assert.equal((await api.POST(req(pedido(a1,[ds[0].id],200)))).status,404);user=original;});
}finally{await db.$disconnect();}});
}
