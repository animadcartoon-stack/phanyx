'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),plain=v=>JSON.parse(JSON.stringify(v));
function carregar(arquivo,imports={},extra={}){
 const cache=new Map();
 function load(file){
  if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,URL,URLSearchParams,AbortController,Date,Intl,setTimeout,clearTimeout,...extra,require:n=>{
   if(n in imports)return imports[n];
   if(n==='server-only')return {};
   if(n==='next/server')return{NextResponse:{json:(data,options)=>new Response(JSON.stringify(data),options)}};
   const resolved=n.startsWith('@/')?n.slice(2):n.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),n)):null;
   if(resolved&&['lib/master/asaas-extrato-model','lib/master/asaas-extrato'].includes(resolved))return load(resolved+'.ts');
   throw Error('Importação não simulada: '+n);
  }});return exports;
 }
 return load(arquivo);
}
const periodo={inicio:'2026-10-01',fim:'2026-10-27'};
const item=(id,value,type='PAYMENT_RECEIVED',extra={})=>({id,value,balance:90,date:'2026-10-20',description:'Movimento '+id,type,...extra});
function servico(paginas,opcoes={}){
 const chamadas=[];
 const config={apiKey:'chave-secreta-teste',baseUrl:opcoes.baseUrl||'https://api.asaas.com/v3'};
 const api=carregar('lib/master/asaas-extrato.ts',{'@/lib/asaas':{getAsaasConfig:()=>{if(opcoes.semConfig)throw Error('chave ausente');return config;}}},{fetch:async(url,init)=>{
  chamadas.push({url,init});
  if(opcoes.falha)throw Error('Resposta indevida com chave-secreta-teste');
  if(url.includes('/myAccount/accountNumber'))return new Response(JSON.stringify({agency:'0001',account:'12345',accountDigit:'6'}),{status:opcoes.falhaConta?403:200});
  if(url.endsWith('/finance/balance'))return new Response(JSON.stringify({balance:opcoes.saldo===undefined?125.40:opcoes.saldo}),{status:opcoes.statusSaldo||200});
  const indice=chamadas.filter(c=>c.url.includes('/financialTransactions?')).length-1;
  const data=typeof paginas==='function'?paginas(indice):paginas[indice];
  return new Response(JSON.stringify(data),{status:opcoes.statusExtrato||200});
 }});
 return{...api,chamadas};
}
test('período padrão usa Brasília e valida datas, ordem, limite anual e futuro',()=>{
 const m=carregar('lib/master/asaas-extrato-model.ts');
 assert.deepEqual(plain(m.periodoExtrato(null,null,new Date('2026-11-01T02:59:59Z'))),{inicio:'2026-10-01',fim:'2026-10-31'});
 for(const [a,b] of [['2026-02-31','2026-03-01'],['2026-10-20','2026-10-01'],['2025-01-01','2026-10-01'],['2026-10-01','2026-11-01'],['2026-10-01',null],['2026-10-01&url=https://malicioso','2026-10-27']])assert.throws(()=>m.periodoExtrato(a,b,new Date('2026-10-27T12:00:00Z')));
 assert.deepEqual(plain(m.periodoExtrato('2024-01-01','2024-12-31')), {inicio:'2024-01-01',fim:'2024-12-31'});
});
test('soma todas as páginas, tarifas e estornos pelos sinais em centavos; não usa status cadastral',async()=>{
 const s=servico([{data:[item('recebimento',100),item('tarifa',-2.99,'PAYMENT_FEE')],hasMore:true,totalCount:5,offset:0},
  {data:[item('transferencia',-50,'TRANSFER',{transferId:'tr_1'}),item('estorno',10,'TRANSFER_REVERSAL'),item('tipo-novo',-.01,'TIPO_FUTURO')],hasMore:false,totalCount:5,offset:2}]);
 const r=await s.consultarExtratoAsaas(periodo);
 assert.deepEqual(plain(r.resumo),{entradasCentavos:11000,saidasCentavos:5300,resultadoCentavos:5700});assert.equal(r.saldoAtualCentavos,12540);assert.equal(r.completo,true);assert.equal(r.ambiente,'PRODUCAO');assert.equal(r.conta.numero,'12345');
 const urls=s.chamadas.filter(c=>c.url.includes('financialTransactions')).map(c=>new URL(c.url));
 assert.deepEqual(urls.map(u=>u.searchParams.get('offset')),['0','2']);
 for(const u of urls){assert.equal(u.searchParams.get('startDate'),'2026-10-01');assert.equal(u.searchParams.get('finishDate'),'2026-10-27');assert.equal(u.searchParams.get('limit'),'100');}
 for(const c of s.chamadas){assert.equal(c.init.method,'GET');assert.equal(c.init.cache,'no-store');assert.equal(c.init.redirect,'error');assert.equal(c.init.headers.access_token,'chave-secreta-teste');assert.equal(c.init.body,undefined);}
 assert.equal(JSON.stringify(r).includes('chave-secreta-teste'),false);
});
test('duplicata idêntica não soma duas vezes; duplicata divergente e contagem inconsistente não viram totais',async()=>{
 const a=item('a',10),b=item('b',20);
 const s=servico([{data:[a],hasMore:true,totalCount:2},{data:[a,b],hasMore:false,totalCount:2}]);assert.equal((await s.consultarExtratoAsaas(periodo)).resumo.entradasCentavos,3000);
 for(const paginas of [[{data:[a],hasMore:true,totalCount:2},{data:[item('a',15),b],hasMore:false,totalCount:2}],
  [{data:[a],hasMore:false,totalCount:2}], [{data:[],hasMore:true,totalCount:2}]])await assert.rejects(servico(paginas).consultarExtratoAsaas(periodo),e=>e.codigo==='RESPOSTA_INVALIDA');
});
test('respostas ausentes, valor nulo e movimento fora do período não produzem saldo ou somas falsos',async()=>{
 for(const payload of [{data:[item('a',null)],hasMore:false},{data:[item('a',1,'CREDIT',{date:'2026-09-01'})],hasMore:false},{data:null,hasMore:false},{data:[],hasMore:'false'}])await assert.rejects(servico([payload]).consultarExtratoAsaas(periodo));
 await assert.rejects(servico([{data:[],hasMore:false}],{saldo:null}).consultarExtratoAsaas(periodo));
 const r=await servico([{data:[],hasMore:false,totalCount:0}],{saldo:0}).consultarExtratoAsaas(periodo);assert.equal(r.saldoAtualCentavos,0);assert.equal(r.resumo.entradasCentavos,0);assert.equal(r.movimentos.length,0);
});
test('5000 lançamentos com mais páginas deixam lista parcial e totais indisponíveis',async()=>{
 const s=servico(indice=>({data:Array.from({length:100},(_,i)=>item('tx-'+(indice*100+i),1)),hasMore:true,totalCount:6000,offset:indice*100}));
 const r=await s.consultarExtratoAsaas(periodo);assert.equal(r.movimentos.length,5000);assert.equal(r.completo,false);assert.equal(r.resumo,null);
});
test('sandbox é identificado; falta de identificação bancária não impede consultar o dinheiro',async()=>{
 const s=servico([{data:[],hasMore:false}],{baseUrl:'https://api-sandbox.asaas.com/v3',falhaConta:true});const r=await s.consultarExtratoAsaas(periodo);assert.equal(r.ambiente,'SANDBOX');assert.equal(r.conta,null);
});
test('credencial não configurada ou URL externa não inicia chamadas; erros do provedor não expõem segredo',async()=>{
 for(const opcoes of [{semConfig:true},{baseUrl:'https://externo.example/v3'},{baseUrl:'https://api.asaas.com/v3?redirect=externo'}]){const s=servico([] ,opcoes);await assert.rejects(s.consultarExtratoAsaas(periodo));assert.equal(s.chamadas.length,0);}
 for(const opcoes of [{falha:true},{statusExtrato:403},{statusExtrato:429},{statusSaldo:500}])await assert.rejects(servico([{data:[],hasMore:false}],opcoes).consultarExtratoAsaas(periodo),e=>!e.message.includes('chave-secreta-teste'));
});
test('API recusa anônimo, usuário sem Master e Master desativado antes de consultar o Asaas',async()=>{
 let sessao=null,usuario=null,chamadas=0,consultasUsuario=0;
 const api=carregar('app/api/master/asaas/extrato/route.ts',{'@/lib/server-auth':{getUserFromToken:async()=>sessao},'@/lib/prisma':{prisma:{user:{findUnique:async()=>{consultasUsuario++;return usuario;}}}},'@/lib/master/asaas-extrato':{consultarExtratoAsaas:async()=>{chamadas++;return {fonte:'ASAAS'};},ErroExtratoAsaas:class extends Error{}}});
 const req=()=>new Request('https://teste/api/master/asaas/extrato?inicio=2026-10-01&fim=2026-10-20');
 assert.equal((await api.GET(req())).status,401);assert.equal(consultasUsuario,0);
 sessao={id:1,isMasterAdmin:true};for(const u of [{ativo:true,isMasterAdmin:false},{ativo:false,isMasterAdmin:true},null]){usuario=u;assert.equal((await api.GET(req())).status,403);}assert.equal(chamadas,0);
 usuario={ativo:true,isMasterAdmin:true};let r=await api.GET(req());assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/private.*no-store/);assert.equal(r.headers.get('Vary'),'Cookie');assert.equal(chamadas,1);
 r=await api.GET(new Request('https://teste/api/master/asaas/extrato?inicio=2026-02-31&fim=2026-03-01'));assert.equal(r.status,400);assert.equal(chamadas,1);
});
test('CSV preserva sinal, identificador e referências e impede fórmulas em texto do provedor',()=>{
 const m=carregar('lib/master/asaas-extrato-model.ts');const csv=m.csvExtrato({movimentos:[{id:'ftx_1',data:'2026-10-20',descricao:'=HYPERLINK("url")',tipo:'PAYMENT_FEE',valorCentavos:-299,saldoAposCentavos:9701,referencias:[{tipo:'Cobrança',id:'pay_1'}]}]});
 assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/'=HYPERLINK/);assert.ok(csv.includes(';"-2,99";'));assert.match(csv,/ftx_1/);assert.match(csv,/pay_1/);
});
