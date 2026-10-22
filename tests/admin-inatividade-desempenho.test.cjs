const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../app/admin/AdminShell.tsx'),'utf8');
const ast = ts.createSourceFile('AdminShell.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let effect;
function visit(node) {
  if(ts.isCallExpression(node) && node.expression.getText(ast)==='useEffect' && node.arguments[0]?.getText(ast).includes('const tempoInatividade =')) effect=node.arguments[0].getText(ast);
  ts.forEachChild(node,visit);
}
visit(ast);
assert.ok(effect,'o controle de inatividade do Admin precisa ser exercitado');
const compiled = ts.transpileModule('const executar = '+effect+'; executar();',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const duration=5*60*1000;
function start({editor=false,storedAge,fetchStatus=200,referencia='sessao-teste',development=false}={}) {
  let now=1_800_000_000_000, next=0, reads=0, writes=0, allocations=0;
  const timers=new Map(), events=new Map(), values=new Map(), requests=[], expired=[], redirects=[];
  const key='phanyx:atividade-admin:'+referencia;
  if(storedAge!==undefined) values.set(key,String(now-storedAge));
  const sandbox={
    process:{env:{NODE_ENV:development?'development':'production'}},
    referenciaSessaoInicial:referencia,editorCertificadoAberto:editor,
    AbortController,
    Date:class extends Date { static now(){return now;} },
    localStorage:{getItem:k=>{reads++;return values.get(k)||null;},setItem:(k,v)=>{writes++;values.set(k,v);}},
    window:{
      addEventListener:(name,fn)=>events.set(name,fn),
      removeEventListener:(name,fn)=>{if(events.get(name)===fn)events.delete(name);},
      location:{set href(value){redirects.push(value);}},
    },
    setTimeout:(fn,delay)=>{const id=++next;allocations++;timers.set(id,{fn,at:now+Math.max(0,delay)});return id;},
    clearTimeout:id=>timers.delete(id),
    fetch:async(url,options)=>{requests.push({url,options});return {ok:fetchStatus>=200&&fetchStatus<300,status:fetchStatus};},
    setSessaoExpirada:value=>expired.push(value),
  };
  const cleanup=vm.runInNewContext(compiled,sandbox);
  return {
    key,requests,expired,redirects,events,values,cleanup,
    get reads(){return reads;}, get writes(){return writes;}, get allocations(){return allocations;},get pending(){return timers.size;},get now(){return now;},
    event:(name,data={})=>events.get(name)?.(data),
    tick:async ms=>{
      const until=now+ms;
      for(;;){
        const entries=[...timers.entries()].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at);
        if(!entries.length)break;
        const [id,t]=entries[0];timers.delete(id);now=t.at;await t.fn();
      }
      now=until;
    },
  };
}
test('dez mil movimentos não consultam armazenamento nem recriam o temporizador',()=>{
  const env=start(); const initialReads=env.reads,initialWrites=env.writes;
  for(let i=0;i<10000;i++)env.event('mousemove');
  assert.equal(env.reads,initialReads); assert.equal(env.writes,initialWrites);
  assert.equal(env.allocations,1);assert.equal(env.pending,1);assert.equal(env.requests.length,0);env.cleanup();
});
test('rolagem e teclado preservam atividade com escrita limitada a uma por segundo',async()=>{
  const env=start();const initial=env.writes;
  for(let i=0;i<100;i++){await env.tick(10);env.event('scroll');env.event('keydown');}
  assert.equal(env.writes-initial,1);assert.equal(env.allocations,1);env.cleanup();
});
test('sessão sem atividade encerra exatamente após cinco minutos e mantém a referência no logout',async()=>{
  const env=start();await env.tick(duration-1);assert.equal(env.requests.length,0);
  await env.tick(1);assert.equal(env.requests.length,1);assert.equal(env.requests[0].url,'/api/auth/logout');
  assert.equal(env.requests[0].options.headers['x-phanyx-sessao-admin'],'sessao-teste');
  assert.equal(env.requests[0].options.headers['x-phanyx-logout-motivo'],'inatividade');
  assert.deepEqual(env.expired,[true]);await env.tick(2500);assert.deepEqual(env.redirects,['/login?portal=admin']);env.cleanup();
});
test('atividade perto do prazo adia o encerramento até cinco minutos após o último evento',async()=>{
  const env=start();await env.tick(duration-1);env.event('mousemove');
  await env.tick(1);assert.equal(env.requests.length,0);
  await env.tick(duration-2);assert.equal(env.requests.length,0);
  await env.tick(1);assert.equal(env.requests.length,1);env.cleanup();
});
test('atividade contínua não encerra a sessão nem cria temporizadores por evento',async()=>{
  const env=start();for(let i=0;i<600;i++){await env.tick(1000);env.event('mousemove');env.event('click');}
  assert.equal(env.requests.length,0);assert.ok(env.allocations<=4);assert.equal(env.pending,1);env.cleanup();
});
test('outra aba prolonga o prazo pela atividade recebida, sem leitura ou escrita adicional',async()=>{
  const env=start();await env.tick(duration-10);const reads=env.reads,writes=env.writes;
  env.event('storage',{key:env.key,newValue:String(env.now)});
  assert.equal(env.reads,reads);assert.equal(env.writes,writes);
  await env.tick(duration-1);assert.equal(env.requests.length,0);await env.tick(1);assert.equal(env.requests.length,1);env.cleanup();
});
test('aba do editor não registra mouse, clique, teclado ou rolagem para renovar o Admin',async()=>{
  const env=start({editor:true,storedAge:duration-5000});
  for(const name of ['mousemove','keydown','click','scroll']){assert.equal(env.events.has(name),false);env.event(name);}
  await env.tick(4999);assert.equal(env.requests.length,0);await env.tick(1);assert.equal(env.requests.length,1);
  assert.deepEqual(env.expired,[]);assert.equal(env.redirects.length,0);env.cleanup();
});
test('editor respeita atividade administrativa de outra aba sem expirar sua sessão separada',async()=>{
  const env=start({editor:true,storedAge:duration-5000});await env.tick(4000);
  env.event('storage',{key:env.key,newValue:String(env.now)});await env.tick(duration-1);assert.equal(env.requests.length,0);
  await env.tick(1);assert.equal(env.requests.length,1);assert.deepEqual(env.expired,[]);assert.equal(env.redirects.length,0);env.cleanup();
});
test('eventos de outra sessão ou timestamps inválidos não prolongam a sessão',async()=>{
  for(const event of [{key:'outra-sessao',newValue:'1800000299000'}, {newValue:'NaN'}, {newValue:'Infinity'}, {newValue:'-1'}, {newValue:null}, {newValue:'9999999999999999'}]){
    const env=start();await env.tick(duration-1);env.event('storage',{key:env.key,...event});await env.tick(1);assert.equal(env.requests.length,1);env.cleanup();
  }
});
test('timestamp antigo recebido não antecipa a expiração de atividade mais recente',async()=>{
  const env=start();await env.tick(1000);env.event('click');env.event('storage',{key:env.key,newValue:String(env.now-1000)});
  await env.tick(duration-1);assert.equal(env.requests.length,0);await env.tick(1);assert.equal(env.requests.length,1);env.cleanup();
});
test('resposta 409 não encerra sessão substituída; falha temporária mantém tentativa limitada',async()=>{
  const replaced=start({fetchStatus:409});await replaced.tick(duration+60000);assert.equal(replaced.requests.length,1);assert.deepEqual(replaced.expired,[]);replaced.cleanup();
  const unavailable=start({fetchStatus:503});await unavailable.tick(duration);assert.equal(unavailable.requests.length,1);assert.deepEqual(unavailable.expired,[]);
  await unavailable.tick(29999);assert.equal(unavailable.requests.length,1);await unavailable.tick(1);assert.equal(unavailable.requests.length,2);unavailable.cleanup();
});
test('sair da página remove todos os eventos e cancela o pedido e os temporizadores',async()=>{
  const env=start();await env.tick(duration);const signal=env.requests[0].options.signal;env.cleanup();
  assert.equal(signal.aborted,true);assert.equal(env.events.size,0);assert.equal(env.pending,0);await env.tick(10000);assert.equal(env.redirects.length,0);
});
test('desenvolvimento ou ausência da referência de sessão não ativa encerramento automático',()=>{
  for(const args of [{development:true},{referencia:null}]){const env=start(args);assert.equal(env.allocations,0);assert.equal(env.events.size,0);assert.equal(env.requests.length,0);}
});
