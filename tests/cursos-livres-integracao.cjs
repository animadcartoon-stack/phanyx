// Teste optativo, somente banco local/ponte local de uma branch isolada.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
if(process.env.PHANYX_LIVRE_TESTE!=='1') { test('integração PostgreSQL de cursos livres',{skip:'Exige PHANYX_LIVRE_TESTE=1 e banco isolado local.'},()=>{}); }
else {
 const url=new URL(process.env.DATABASE_URL);assert.ok(['127.0.0.1','localhost'].includes(url.hostname),'Somente banco de teste local');
 let user=null;
 const resolve=Module._resolveFilename;Module._resolveFilename=function(request,parent,...rest){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,parent,...rest);};
 const load=Module._load;Module._load=function(request,parent,isMain){if(request==='@/lib/server-auth')return {getUserFromToken:async()=>user,isAdminLike:role=>role==='ADMIN'};if(request==='next/headers')return {cookies:async()=>({get:()=>user?{value:'test-only'}:undefined})};if(request==='jsonwebtoken')return {verify:()=>user};if(request==='server-only')return {};return load.call(this,request,parent,isMain);};
 Module._extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
 const {prisma:db}=require('../lib/prisma.ts');
 const api=require('../app/api/admin/matriculas/cursos-livres/route.ts');
 const cursosApi=require('../app/api/admin/cursos/route.ts');
 const turmasApi=require('../app/api/turma/route.ts');
 const mensalidadesApi=require('../app/api/admin/financeiro/lancamentos/gerar-mensalidades/route.ts');
 const {situacaoPeriodosNaChamada}=require('../lib/matriculas/cursos-livres-chamada.ts');
 const unique=crypto.randomUUID();let inst,other,aluno,aluno2,curso,turma,polo,matriculaId;
 const req=body=>new Request('http://localhost/api/admin/matriculas/cursos-livres',{method:'POST',headers:{'content-type':'application/json','user-agent':'curso-livre-test'},body:JSON.stringify(body)});
 const body=(inicio='2027-03-01',fim='2027-03-07',more={})=>({alunoId:aluno.id,cursoId:curso.id,turmaId:turma.id,periodicidade:'SEMANAL',dataInicio:inicio,dataFim:fim,confirmacaoMenorAceita:true,chave:crypto.randomUUID(),...more});
 async function post(b,expected=201){const res=await api.POST(req(b));const json=await res.json();assert.equal(res.status,expected,JSON.stringify(json));return json;}
 test('contratação e renovação por período em PostgreSQL',async t=>{
  try {
   await t.test('autenticação e autorização precedem consultas',async()=>{assert.equal((await api.GET(new Request('http://localhost'))).status,403);user={id:1,role:'PROFESSOR',instituicaoId:1};assert.equal((await api.POST(req({}))).status,403);});
   inst=await db.instituicao.create({data:{nome:'TESTE CURSOS LIVRES',slug:'test-livre-'+unique,updatedAt:new Date(),isentaPagamento:true}});
   other=await db.instituicao.create({data:{nome:'TESTE OUTRO ID',slug:'test-livre-outro-'+unique,updatedAt:new Date(),isentaPagamento:true}});
   const admin=await db.user.create({data:{nome:'Admin teste',email:'admin-livre-'+unique+'@example.invalid',senha:'sem-login',role:'ADMIN',instituicaoId:inst.id}});
   user={id:admin.id,role:'ADMIN',instituicaoId:inst.id,nome:admin.nome};
   polo=await db.polo.create({data:{nome:'Polo teste',instituicaoId:inst.id}});
   for(const i of [1,2]){const u=await db.user.create({data:{nome:'Aluno teste '+i,email:`aluno-livre-${i}-${unique}@example.invalid`,senha:'sem-login',role:'ALUNO',instituicaoId:inst.id}});const a=await db.aluno.create({data:{nome:u.nome,userId:u.id,instituicaoId:inst.id,poloId:polo.id,dataNascimento:new Date('2016-01-01'),nomeResponsavel:'Responsável teste',cpfResponsavel:'00000000000',telefoneResponsavel:'48999999999',emailResponsavel:'teste@example.invalid',parentescoResponsavel:'Responsável'}});if(i===1)aluno=a;else aluno2=a;}
   curso=await db.curso.create({data:{nome:'Reforço teste',instituicaoId:inst.id,organizacaoCurricular:'LIVRE',valorMatricula:0,valorSemanal:150,valorMensalidade:480}});
   const disciplina=await db.disciplina.create({data:{nome:'Reforço',instituicaoId:inst.id,cursoId:curso.id}});
   turma=await db.turma.create({data:{nome:'Turma livre teste',instituicaoId:inst.id,cursoId:curso.id,poloId:polo.id,organizacaoCurricular:'LIVRE',semestre:'',periodoLetivo:'2027',statusTurma:'ATIVA',capacidadeMaxima:1,disciplinas:{create:{instituicaoId:inst.id,disciplinaId:disciplina.id}}}});
   await t.test('cadastro de curso e turma livres não cria etapas nem parcelas fictícias',async()=>{
    const res=await cursosApi.POST(req({nome:'Livre API '+unique,codigo:'API-'+unique,organizacaoCurricular:'LIVRE',valorSemanal:150,valorMensalidade:480,valorMatricula:98.5,quantidadeParcelas:12,quantidadeSemestres:2,poloIds:[polo.id]}));const c=await res.json();assert.equal(res.status,201,JSON.stringify(c));assert.equal(c.organizacaoCurricular,'LIVRE');assert.equal(c.quantidadeParcelas,null);assert.equal(c.quantidadeSemestres,null);assert.equal(Number(c.valorMatricula),0);assert.equal(Number(c.valorSemanal),150);
    const d=await db.disciplina.create({data:{nome:'Livre API',instituicaoId:inst.id,cursoId:c.id}});
    const tr=await turmasApi.POST(req({nome:'Turma API '+unique,cursoId:c.id,poloId:polo.id,periodoLetivo:'2027',disciplinaIds:[d.id]}));const tj=await tr.json();assert.equal(tr.status,200,JSON.stringify(tj));assert.equal(tj.organizacaoCurricular,'LIVRE');assert.equal(tj.etapaNumero,null);assert.equal(await db.turmaSemestre.count({where:{turmaId:tj.id}}),0);
   });
   await t.test('menor exige confirmação sem criar matrícula ou cobrança',async()=>{const r=await post(body(undefined,undefined,{confirmacaoMenorAceita:false}),409);assert.equal(r.codigo,'CONFIRMACAO_MENOR_NECESSARIA');assert.equal(await db.matricula.count({where:{instituicaoId:inst.id}}),0);assert.equal(await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}}),0);});
   const primeiro=body();let resultado;
   await t.test('semana custa 150 e cria um vínculo sem taxa, etapas ou parcelas futuras',async()=>{resultado=await post(primeiro);matriculaId=resultado.matriculaId;const m=await db.matricula.findUnique({where:{id:matriculaId}});assert.equal(m.organizacaoCurricular,'LIVRE');assert.equal(Number(m.valorMatricula),0);assert.equal(m.semestre,null);assert.equal(m.cursoSemestreId,null);assert.equal(m.quantidadeMensalidades,null);assert.equal(m.valorMensalidade,null);const ls=await db.lancamentoFinanceiro.findMany({where:{matriculaId}});assert.equal(ls.length,1);assert.equal(ls[0].tipo,'OUTRO');assert.equal(ls[0].valorFinal,150);assert.equal(ls[0].status,'PENDENTE');});
   await t.test('repetir o mesmo pedido é idempotente; reutilizar chave para outro pedido é recusado',async()=>{assert.deepEqual(await post(primeiro),resultado);assert.equal((await post({...primeiro,dataFim:'2027-03-06'},409)).codigo,'DADOS_ALTERADOS');assert.equal(await db.periodoCursoLivre.count({where:{matriculaId}}),1);});
   await t.test('períodos sobrepostos e falta de vagas não criam lançamentos órfãos',async()=>{assert.equal((await post(body(),409)).codigo,'PERIODO_SOBREPOSTO');assert.equal((await post(body(undefined,undefined,{alunoId:aluno2.id}),409)).codigo,'SEM_VAGAS');assert.equal(await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}}),1);});
   await t.test('chamada consulta a data inclusiva e diferencia pendente, parcial e pago',async()=>{const vs=[{alunoId:aluno.id,matriculaId,organizacaoCurricular:'LIVRE'}];const status=async day=>(await situacaoPeriodosNaChamada(db,inst.id,new Date(day+'T00:00:00Z'),vs)).get(aluno.id);assert.equal(await status('2027-03-01'),'PENDENTE');await db.lancamentoFinanceiro.update({where:{id:resultado.lancamentoId},data:{status:'PARCIAL',valorPago:50}});assert.equal(await status('2027-03-01'),'PENDENTE');await db.lancamentoFinanceiro.update({where:{id:resultado.lancamentoId},data:{status:'PAGO',valorPago:150,pagoEm:new Date()}});assert.equal(await status('2027-03-01'),'PAGO');assert.equal(await status('2027-03-07'),'PAGO');assert.equal(await status('2027-03-08'),'SEM_PERIODO');});
   await t.test('renovação semanal e mensal preserva matrícula e histórico, com preços de 150 e 480',async()=>{const a=await post(body('2027-03-08','2027-03-14',{matriculaId}));const b=await post(body('2027-04-01','2027-04-30',{matriculaId,periodicidade:'MENSAL'}));assert.equal(a.matriculaId,matriculaId);assert.equal(b.matriculaId,matriculaId);assert.equal(await db.matricula.count({where:{instituicaoId:inst.id,alunoId:aluno.id,cursoId:curso.id}}),1);const p=await db.periodoCursoLivre.findMany({where:{matriculaId},orderBy:{dataInicio:'asc'}});assert.deepEqual(p.map(v=>Number(v.valor)),[150,150,480]);assert.equal(await db.lancamentoFinanceiro.count({where:{matriculaId}}),3);});
   await t.test('vagas são por período e não ficam presas a um vínculo antigo',async()=>{const b=await post(body('2027-05-01','2027-05-07',{alunoId:aluno2.id}));assert.notEqual(b.matriculaId,matriculaId);});
   await t.test('isolamento recusa matrícula e curso de outra instituição sem revelar registros',async()=>{const original=user;user={...user,instituicaoId:other.id};const list=await api.GET(new Request('http://localhost?matriculaId='+matriculaId));assert.deepEqual((await list.json()).matriculas,[]);assert.equal((await post(body('2027-06-01','2027-06-07',{matriculaId}),404)).codigo,'MATRICULA_INVALIDA');user=original;});
   await t.test('concorrência não duplica períodos ou lançamentos',async()=>{
    const a=body('2027-07-01','2027-07-07',{matriculaId});const b=body('2027-07-01','2027-07-07',{matriculaId});
    const rs=await Promise.all([api.POST(req(a)),api.POST(req(b))]);assert.deepEqual(rs.map(r=>r.status).sort(),[201,409]);
    assert.equal(await db.periodoCursoLivre.count({where:{matriculaId,dataInicio:new Date('2027-07-01')}}),1);
   });
   await t.test('pagamento cancelado e matrícula regular mantêm indicações corretas',async()=>{
    const vs=[{alunoId:aluno.id,matriculaId,organizacaoCurricular:'LIVRE'}];await db.lancamentoFinanceiro.update({where:{id:resultado.lancamentoId},data:{status:'CANCELADO'}});
    assert.equal((await situacaoPeriodosNaChamada(db,inst.id,new Date('2027-03-01'),vs)).get(aluno.id),'SEM_PERIODO');
    assert.equal((await situacaoPeriodosNaChamada(db,inst.id,new Date('2027-03-01'),[...vs,{alunoId:aluno.id,matriculaId:999,organizacaoCurricular:'ANUAL'}])).has(aluno.id),false);
   });
   await t.test('gerador mensal antigo ignora todos os vínculos livres',async()=>{
    const antes=await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}});const res=await mensalidadesApi.POST(req({ano:2027,mes:8,diaVencimento:10}));assert.equal(res.status,200,JSON.stringify(await res.clone().json()));assert.equal(await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id}}),antes);assert.equal(await db.lancamentoFinanceiro.count({where:{instituicaoId:inst.id,tipo:'MENSALIDADE'}}),0);
   });
   await t.test('cancelamento impede renovação e preserva períodos anteriores',async()=>{await db.matricula.update({where:{id:matriculaId},data:{status:'CANCELADA',canceladaEm:new Date()}});assert.equal((await post(body('2027-06-01','2027-06-07',{matriculaId}),409)).codigo,'MATRICULA_INATIVA');assert.equal(await db.periodoCursoLivre.count({where:{matriculaId}}),4);});
   await t.test('restrições do banco rejeitam parcelas futuras e datas inválidas',async()=>{await assert.rejects(db.curso.update({where:{id:curso.id},data:{quantidadeParcelas:12}}));const periodo=await db.periodoCursoLivre.findFirst({where:{matriculaId}});await assert.rejects(db.periodoCursoLivre.update({where:{id:periodo.id},data:{dataFim:new Date('2028-01-01')}}));});
  } finally { await db.$disconnect(); }
 });
}
