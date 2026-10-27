'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),plain=v=>JSON.parse(JSON.stringify(v));
function carregar(arquivo,imports={},iso='2026-10-27T15:00:00Z'){
 const cache=new Map();
 class Agora extends Date{constructor(...args){super(args.length?args[0]:iso);}static now(){return new Date(iso).getTime();}}
 function load(file){
  if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,Date:Agora,Intl,URL,console:{log(){},error(){}},require:n=>{
   if(n in imports)return imports[n];
   if(n==='next/server')return{NextResponse:{json:(data,options)=>new Response(JSON.stringify(data),options)}};
   if(n==='@prisma/client')return require(n);
   if(n==='next-intl/server')return{getTranslations:async()=>key=>key};
   const resolved=n.startsWith('@/')?n.slice(2):n.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),n)):null;
   if(resolved&&['lib/cursos/estado-curso','lib/phanyx/feriados-brasil','lib/academico/integridade-ofertas','lib/academico/organizacao','lib/academico/grade-oferta','lib/master/resumo-dashboard'].includes(resolved))return load(resolved+'.ts');
   return {};
  }});return exports;
 }
 return load(arquivo);
}
function matches(row,where){return Object.entries(where||{}).every(([key,value])=>{
 if(key==='OR')return value.some(v=>matches(row,v));
 if(value===null)return row[key]==null;
 if(value instanceof Date)return row[key] instanceof Date&&row[key].getTime()===value.getTime();
 if(value&&typeof value==='object'&&!(value instanceof Date))return Object.entries(value).every(([op,v])=>op==='gt'?row[key]>v:op==='gte'?row[key]>=v:op==='lte'?row[key]<=v:op==='in'?v.includes(row[key]):false);
 return row[key]===value;
});}
test('matrícula lista apenas cursos ativos da instituição; consulta histórica continua disponível',async()=>{
 const dados=[{id:1,instituicaoId:26,ativo:true,excluidoEm:null},{id:2,instituicaoId:26,ativo:false,excluidoEm:null},{id:3,instituicaoId:26,ativo:true,excluidoEm:new Date()},{id:4,instituicaoId:99,ativo:true,excluidoEm:null}];
 let user={id:1,instituicaoId:26},consultas=0;
 const api=carregar('app/api/curso/route.ts',{'@/lib/server-auth':{getUserFromToken:async()=>user},'@/lib/prisma':{prisma:{curso:{findMany:async({where})=>{consultas++;return dados.filter(c=>matches(c,where));}}}}});
 let r=await api.GET(new Request('https://teste/api/curso?somenteAtivos=1'));assert.deepEqual((await r.json()).map(c=>c.id),[1]);
 r=await api.GET(new Request('https://teste/api/curso'));assert.deepEqual((await r.json()).map(c=>c.id),[1,2,3]);
 user=null;const antes=consultas;r=await api.GET(new Request('https://teste/api/curso?somenteAtivos=1'));assert.equal(r.status,401);assert.equal(consultas,antes);
});
test('recuperação vence em 72 horas, inclusive sem campo de prazo legado, sem remover históricos',()=>{
 const m=carregar('lib/cursos/estado-curso.ts');const now=new Date('2026-10-27T15:00:00Z');
 for(const c of [{ativo:false,excluidoEm:'2026-10-24T15:00:00Z'},{ativo:false,excluidoEm:'2026-10-21',expiraExclusaoEm:'2026-10-24'}])assert.equal(m.exclusaoCursoExpirada(c,now),true);
 assert.equal(m.exclusaoCursoExpirada({ativo:false,excluidoEm:'2026-10-24T15:00:00.001Z'},now),false);
 assert.equal(m.exclusaoCursoExpirada({ativo:false,excluidoEm:null},now),false);
 assert.equal(m.cursoDisponivelParaMatricula({ativo:true,excluidoEm:'2026-10-27'}),false);
 const filtro=m.filtroCursosRecuperaveis(now);
 assert.equal(matches({excluidoEm:new Date('2026-10-21'),expiraExclusaoEm:new Date('2026-10-24')},filtro),false);
 assert.equal(matches({excluidoEm:new Date('2026-10-27'),expiraExclusaoEm:new Date('2026-10-30')},filtro),true);
});
test('API do cadastro oculta prazo vencido e rejeita restauração sem gravar',async()=>{
 const dados=[{id:8,instituicaoId:26,ativo:false,excluidoEm:new Date('2026-10-21'),expiraExclusaoEm:new Date('2026-10-24'),publicacaoRedeDestino:null},{id:35,instituicaoId:26,ativo:false,excluidoEm:new Date('2026-10-27'),expiraExclusaoEm:new Date('2026-10-30'),publicacaoRedeDestino:null}];let writes=0;
 const db={curso:{findMany:async({where})=>dados.filter(d=>matches(d,where)),findFirst:async({where})=>dados.find(d=>matches(d,where)),update:async()=>{writes++;}}};
 const api=carregar('app/api/admin/cursos/route.ts',{'@/lib/server-auth':{getUserFromToken:async()=>({id:1,role:'ADMIN',instituicaoId:26})},'@/lib/prisma':{prisma:db}});
 let r=await api.GET();assert.deepEqual((await r.json()).map(c=>c.id),[35]);
 r=await api.PATCH(new Request('https://teste/api/admin/cursos',{method:'PATCH',body:JSON.stringify({id:8,ativo:true})}));assert.equal(r.status,410);assert.equal(writes,0);
 r=await api.DELETE(new Request('https://teste/api/admin/cursos',{method:'DELETE',body:JSON.stringify({id:8})}));assert.equal(r.status,200);assert.equal(writes,0);
});
test('servidor bloqueia nova matrícula de curso inativo, excluído ou de outra instituição',async()=>{
 const m=carregar('lib/academico/integridade-ofertas.ts');
 for(const curso of [null,{id:1,ativo:false,excluidoEm:null},{id:1,ativo:true,excluidoEm:new Date()}])await assert.rejects(m.validarCursoAtivoParaMatricula({curso:{findFirst:async({where})=>{assert.equal(where.instituicaoId,26);return curso;}}},26,1),e=>e.codigo==='CURSO_INDISPONIVEL');
 await m.validarCursoAtivoParaMatricula({curso:{findFirst:async()=>({id:1,ativo:true,excluidoEm:null})}},26,1);
});
test('Finados de segunda aparece desde quinta, permanece sexta e respeita virada do ano',()=>{
 const m=carregar('lib/phanyx/feriados-brasil.ts');
 assert.equal(m.buscarFeriadoNacionalBrasil('2026-10-28'),null);
 for(const [dia,dias] of [['2026-10-29',4],['2026-10-30',3],['2026-11-02',0]]){const f=m.buscarFeriadoNacionalBrasil(dia);assert.equal(f.dataFeriado,'2026-11-02');assert.equal(f.diasRestantes,dias);}
 assert.equal(m.buscarFeriadoNacionalBrasil('2026-11-03'),null);
 assert.equal(m.buscarFeriadoNacionalBrasil('2026-12-28').dataFeriado,'2027-01-01');
 assert.equal(m.buscarFeriadoNacionalBrasil('2026-02-31'),null);
 assert.equal(m.inicioAvisoFeriado('2026-11-02'),'2026-10-29');
});
function feriadoApi(iso,registros=[]){
 const db={configuracaoInstituicao:{findUnique:async()=>({paisCodigo:'BR',fusoHorario:'America/Sao_Paulo'})},feriadoGlobal:{findFirst:async({where})=>registros.find(r=>matches(r,where))||null}};
 return carregar('app/api/phanyx/feriado-atual/route.ts',{'@/lib/prisma':{prisma:db},'@/lib/server-auth':{getUserFromToken:async()=>({id:1,instituicaoId:26})}},iso);
}
const feriadoReq=()=>({nextUrl:new URL('https://teste/api/phanyx/feriado-atual?locale=pt-BR')});
test('aviso usa a data da instituição; meia-noite UTC não antecipa o calendário local',async()=>{
 let r=await feriadoApi('2026-10-29T02:59:59Z').GET(feriadoReq());assert.equal((await r.json()).feriado,null);
 r=await feriadoApi('2026-10-29T03:00:00Z').GET(feriadoReq());const d=await r.json();assert.equal(d.feriado.diasRestantes,4);assert.equal(d.feriado.inicioExibicao,'2026-10-29');
});
test('feriado nacional publicado inicia ao menos quatro dias antes; rascunho não é publicado pelo fallback',async()=>{
 const registro={id:1,paisCodigo:'BR',tipo:'NACIONAL',status:'PUBLICADO',dataFeriado:new Date('2026-11-02'),inicioExibicao:new Date('2026-10-31'),fimExibicao:new Date('2026-11-02'),prioridade:1,emoji:null,traducoes:[{locale:'pt-BR',nome:'Finados',titulo:'Finados',mensagem:'Aviso'}]};
 let r=await feriadoApi('2026-10-29T12:00:00Z',[registro]).GET(feriadoReq());let d=await r.json();assert.equal(d.feriado.id,1);assert.equal(d.feriado.inicioExibicao,'2026-10-29');
 r=await feriadoApi('2026-10-29T12:00:00Z',[{...registro,status:'RASCUNHO'}]).GET(feriadoReq());assert.equal((await r.json()).feriado,null);
});
test('resumo Master conta cadastros sem lista de nomes e mantém separadas adesões e mensalidades de alunos',()=>{
 const {resumirDashboardMaster}=carregar('lib/master/resumo-dashboard.ts');
 const instituicoes=[{id:1,ativo:true,isentaPagamento:true},{id:2,ativo:true,isentaPagamento:false},{id:3,ativo:false,isentaPagamento:false}];
 const op=(id,tipo,status,valor,instituicaoId=null,asaasId=null)=>({id,tipo,status,valor,instituicaoId,asaasId});
 const operacoes=[op('a','ADESAO_INSTITUICAO','PAGO',99,2,'pay_1'),op('a2','ADESAO_INSTITUICAO','PAGO',99,2,'pay_1'),op('i','ADESAO_INSTITUICAO','PAGO',99,1),op('b','ADESAO_INSTITUICAO','PENDENTE',49),op('trial','ADESAO_INSTITUICAO','TESTE_GRATIS',199),op('err','ADESAO_INSTITUICAO','ERRO',199),op('tuicao','MATRICULA_IBE','PAGO',780),op('checkout','CHECKOUT_PHANYX','PAID',33)];
 const r=resumirDashboardMaster(instituicoes,operacoes);assert.equal(r.totalInstituicoes,3);assert.equal(r.totalInstituicoesAtivas,2);assert.equal(r.totalAdesoes,6);assert.equal(r.totalPagas,3);assert.equal(r.totalPendentes,1);assert.equal(r.totalComInstituicaoCriada,3);assert.equal(r.faturamentoPago,99);assert.equal(r.faturamentoPrevisto,49);assert.equal(r.porOrigem[1].valorMarcadoPago,780);assert.equal(r.porOrigem[2].valorMarcadoPago,33);
});

test('API Master exige autorização, usa snapshot e não soma matrícula de aluno ao valor de adesão',async()=>{
 let master=true,user={id:1},snapshots=0,consultas=0;
 const db={user:{findUnique:async()=>({id:1,isMasterAdmin:master})},
  instituicao:{findMany:async()=>{consultas++;return[{id:7,nome:'Nova instituição',slug:'nova',ativo:true,isentaPagamento:false,plano:'ESSENCIAL'}];}},
  adesaoInstituicao:{findMany:async()=>[{id:'adesao',nomeResponsavel:'Admin',nomeInstituicao:'Nova instituição',email:'teste@example.invalid',plano:'ESSENCIAL',valor:'49.00',status:'PAGO',createdAt:new Date('2026-10-27'),instituicaoId:7,asaasId:'pay_1'}]},
  matriculaOnlineIbe:{findMany:async()=>[{id:1,nome:'Aluno',email:'aluno@example.invalid',valorTotal:780,status:'PAGO',asaasPaymentId:'pay_2',createdAt:new Date('2026-10-27')}]},
  checkoutPagamento:{findMany:async()=>[]},
  $transaction:async(queries,options)=>{assert.equal(options.isolationLevel,'RepeatableRead');snapshots++;return Promise.all(queries);}};
 const api=carregar('app/api/master/dashboard/route.ts',{'@/lib/prisma':{prisma:db},'@/lib/server-auth':{getUserFromToken:async()=>user}});
 let r=await api.GET(new Request('https://teste/api/master/dashboard'));const d=await r.json();assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal(snapshots,1);assert.equal(d.resumo.totalInstituicoes,1);assert.equal(d.resumo.totalAdesoes,1);assert.equal(d.resumo.faturamentoPago,49);assert.equal(d.resumo.porOrigem[1].valorMarcadoPago,780);assert.equal(d.diagnostico.conciliadoComProvedor,false);
 master=false;const antes=consultas;r=await api.GET(new Request('https://teste/api/master/dashboard'));assert.equal(r.status,403);assert.equal(consultas,antes);
 user=null;r=await api.GET(new Request('https://teste/api/master/dashboard'));assert.equal(r.status,401);assert.equal(consultas,antes);
});
test('painel da plataforma consulta contagens no mesmo snapshot e propaga falha em vez de retornar zero',async()=>{
 const {consultarMetricasPlataforma}=carregar('lib/master/metricas-plataforma.ts');const calls=[];
 const tx=Object.fromEntries(['instituicao','aluno','professor','curso','matricula','turma','user','prova','documentoGerado'].map((nome,i)=>[nome,{count:async args=>{calls.push({nome,args});return i+10;}}]));
 const db={$transaction:async(fn,op)=>{assert.equal(op.isolationLevel,'RepeatableRead');return fn(tx);}};
 const r=await consultarMetricasPlataforma(db);assert.equal(r.instituicoes,10);assert.equal(r.documentos,18);assert.equal(calls.length,12);assert.deepEqual(plain(calls.find(c=>c.nome==='curso').args.where),{ativo:true,excluidoEm:null});
 await assert.rejects(consultarMetricasPlataforma({$transaction:async()=>{throw Error('offline');}}),/offline/);
});
test('traduções dos indicadores e antecedência existem nos cinco idiomas',()=>{
 let modelo;for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']){const d=JSON.parse(fs.readFileSync(path.join(root,'messages',locale+'.json'),'utf8'));const keys=Object.keys(d.PlatformMetrics.metrics);if(modelo)assert.deepEqual(keys,modelo);else modelo=keys;assert.match(d.MasterHolidays?.form?.advanceDaysHint||Object.values(d).find(v=>v?.form?.advanceDaysHint)?.form.advanceDaysHint||'',/4/);}
});
