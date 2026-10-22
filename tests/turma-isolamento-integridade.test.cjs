const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
let usuario=null, bloqueiaExclusao=true, consultas=[], transacoes=0;
const registros=[{id:1,nome:'Turma A',instituicaoId:10,disciplinas:[]},{id:2,nome:'Turma B',instituicaoId:20,disciplinas:[]}];
let vinculos=2, turmaExiste=true;
const prisma={
 turma:{findFirst:async ({where})=>{consultas.push(where);return registros.find(t=>t.id===where.id && t.instituicaoId===where.instituicaoId)||null;}},
 turmaDisciplina:{deleteMany:async()=>{throw new Error('Exclusão de vínculos fora da transação');}},
 $transaction:async fn=>{
  transacoes++;
  const anterior={vinculos,turmaExiste};
  try{return await fn({
   turmaDisciplina:{deleteMany:async()=>{vinculos=0;return {count:2};}},
   turma:{delete:async ({where})=>{
    assert.equal(where.instituicaoId,10);
    if(bloqueiaExclusao){const e=new Error('Referência acadêmica');e.code='P2003';throw e;}
    turmaExiste=false;return registros[0];
   }},
  });}catch(e){({vinculos,turmaExiste}=anterior);throw e;}
 },
};
const loader=Module._load;
Module._load=function(req,parent,isMain){
 if(req==='@/lib/prisma')return {prisma};
 if(req==='@/lib/server-auth')return {getUserFromToken:async()=>usuario,isAdminLike:role=>role==='ADMIN'};
 if(req==='next/headers')return {cookies:async()=>({get:()=>usuario?{value:'token-ficticio'}:undefined})};
 if(req==='jsonwebtoken')return {verify:()=>usuario};
 return loader.call(this,req,parent,isMain);
};
const filename=path.resolve(__dirname,'../app/api/turma/[id]/route.ts');
const m=new Module(filename,module);m.paths=module.paths;
m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const api=m.exports;
const req=new Request('http://localhost/api/turma/1');
const ctx=id=>({params:{id:String(id)}});
const admin=()=>{usuario={id:1,instituicaoId:10,role:'ADMIN'};consultas=[];};
test('detalhe exige autenticação antes de consultar o banco',async()=>{
 usuario=null;consultas=[];
 assert.equal((await api.GET(req,ctx(1))).status,401);
 assert.equal(consultas.length,0);
});
test('detalhe não revela turma de outra instituição',async()=>{
 admin();assert.equal((await api.GET(req,ctx(2))).status,404);
 assert.deepEqual(consultas,[{id:2,instituicaoId:10}]);
});
test('detalhe preserva acesso à turma da própria instituição',async()=>{
 admin();const res=await api.GET(req,ctx(1));assert.equal(res.status,200);
 assert.equal((await res.json()).nome,'Turma A');
});
test('detalhe rejeita identificadores inválidos sem consulta',async()=>{
 admin();for(const id of ['abc','0','-1','1.5'])assert.equal((await api.GET(req,ctx(id))).status,400);
 assert.equal(consultas.length,0);
});
test('exclusão bloqueada preserva vínculos e turma integralmente',async()=>{
 admin();bloqueiaExclusao=true;vinculos=2;turmaExiste=true;transacoes=0;
 const log=console.error;console.error=()=>{};
 try{assert.equal((await api.DELETE(req,ctx(1))).status,400);}finally{console.error=log;}
 assert.equal(transacoes,1);assert.equal(vinculos,2);assert.equal(turmaExiste,true);
});
test('exclusão permitida conclui os dois passos na mesma transação',async()=>{
 admin();bloqueiaExclusao=false;vinculos=2;turmaExiste=true;transacoes=0;
 assert.equal((await api.DELETE(req,ctx(1))).status,200);
 assert.equal(transacoes,1);assert.equal(vinculos,0);assert.equal(turmaExiste,false);
});
test('exclusão de outra instituição não inicia transação',async()=>{
 admin();transacoes=0;assert.equal((await api.DELETE(req,ctx(2))).status,404);assert.equal(transacoes,0);
});
