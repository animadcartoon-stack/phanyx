const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
let usuario=null,bloqueiaExclusao=true,consultas=[],transacoes=0,historico={},rematricula=0,snapshot=0,derivadas=[],codigoFalha=null,mutacoes=0;
const registros=[{id:1,nome:'Turma A',instituicaoId:10,disciplinas:[]},{id:2,nome:'Turma B',instituicaoId:20,disciplinas:[]}];
let vinculos=2,turmaExiste=true;
const localizar=({where})=>{consultas.push(where);return registros.find(t=>t.id===where.id&&t.instituicaoId===where.instituicaoId)||null;};
const prisma={turma:{findFirst:async args=>localizar(args)},$transaction:async(fn,config)=>{
 transacoes++;assert.equal(config.isolationLevel,'Serializable');const anterior={vinculos,turmaExiste};
 try{return await fn({
  $queryRaw:async(strings)=>String(strings[0]).includes('count(*)')?[{total:snapshot}]:[],
  turmaDisciplina:{deleteMany:async()=>{mutacoes++;vinculos=0;return {count:2};}},
  turma:{findFirst:async args=>{const t=localizar(args);return t?{...t,_count:historico,disciplinas:[{_count:{itensRematriculaSemestral:rematricula}}]}:null;},findMany:async({where})=>{assert.equal(where.instituicaoId,10);assert.equal(where.codigo.startsWith,'OFERTA-1-');return derivadas;},
   delete:async({where})=>{mutacoes++;assert.equal(where.instituicaoId,10);if(bloqueiaExclusao||codigoFalha){const e=new Error('Referência acadêmica');e.code=codigoFalha||'P2003';throw e;}turmaExiste=false;return registros[0];}},
 });}catch(e){({vinculos,turmaExiste}=anterior);throw e;}
}};
const loader=Module._load;Module._load=function(req,parent,isMain){
 if(req.startsWith('@/lib/academico/'))return {};
 if(req==='@/lib/prisma')return {prisma};
 if(req==='@/lib/server-auth')return {getUserFromToken:async()=>usuario,isAdminLike:role=>role==='ADMIN'};
 if(req==='next/headers')return {cookies:async()=>({get:()=>usuario?{value:'token-ficticio'}:undefined})};
 if(req==='jsonwebtoken')return {verify:()=>usuario};return loader.call(this,req,parent,isMain);
};
const filename=path.resolve(__dirname,'../app/api/turma/[id]/route.ts');const m=new Module(filename,module);m.paths=module.paths;m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);Module._load=loader;const api=m.exports;
const req=new Request('http://localhost/api/turma/1'),ctx=id=>({params:{id:String(id)}});
function admin(){usuario={id:1,instituicaoId:10,role:'ADMIN'};consultas=[];transacoes=0;historico={};rematricula=0;snapshot=0;derivadas=[];codigoFalha=null;mutacoes=0;}
async function remover(id=1){const log=console.error;console.error=()=>{};try{return await api.DELETE(req,ctx(id));}finally{console.error=log;}}
test('detalhe e exclusão exigem autenticação e exclusão exige papel administrativo',async()=>{
 usuario=null;consultas=[];assert.equal((await api.GET(req,ctx(1))).status,401);assert.equal((await remover()).status,401);assert.equal(consultas.length,0);
 admin();usuario.role='PROFESSOR';assert.equal((await remover()).status,403);assert.equal(consultas.length,0);
});
test('detalhe não revela turma de outra instituição',async()=>{admin();assert.equal((await api.GET(req,ctx(2))).status,404);assert.deepEqual(consultas,[{id:2,instituicaoId:10}]);});
test('detalhe preserva acesso à turma da própria instituição',async()=>{admin();const res=await api.GET(req,ctx(1));assert.equal(res.status,200);assert.equal((await res.json()).nome,'Turma A');});
test('identificadores inválidos não consultam nem alteram cadastros',async()=>{admin();for(const id of ['abc','0','-1','1.5']){assert.equal((await api.GET(req,ctx(id))).status,400);assert.equal((await remover(id)).status,400);}assert.equal(consultas.length,0);assert.equal(transacoes,0);});
test('FK inesperada bloqueia exclusão e reverte vínculos e turma na mesma transação',async()=>{admin();bloqueiaExclusao=true;vinculos=2;turmaExiste=true;assert.equal((await remover()).status,409);assert.equal(transacoes,1);assert.equal(vinculos,2);assert.equal(turmaExiste,true);});
test('turma vazia pode ser excluída com confirmação do ID e sem alterar outras turmas',async()=>{admin();bloqueiaExclusao=false;vinculos=2;turmaExiste=true;const resposta=await remover();assert.equal(resposta.status,200);assert.deepEqual(await resposta.json(),{ok:true,id:1,message:'Turma excluída com sucesso'});assert.equal(transacoes,1);assert.equal(vinculos,0);assert.equal(turmaExiste,false);assert.equal(registros[1].nome,'Turma B');});
test('exclusão de outra instituição retorna 404 sem qualquer remoção',async()=>{admin();assert.equal((await remover(2)).status,404);assert.equal(mutacoes,0);});
for(const vinculo of ['atividades','aulas','itensMatricula','matriculasComoPrincipal','modulos','notas','provas','sessoesVideoAluno','eventosAprendizagemAluno','resultadosFinais','periodosMatriculaParticipantes','reunioes','substituicoesDocentes','destinosRecomendacoesBiblioteca','atividadesExternas','matriculasAvulsas'])test('exclusão preserva turma com '+vinculo+' antes de cascades/SetNull',async()=>{admin();bloqueiaExclusao=false;historico={[vinculo]:1};vinculos=2;turmaExiste=true;const res=await remover();assert.equal(res.status,409);assert.equal((await res.json()).codigo,'TURMA_COM_HISTORICO');assert.equal(mutacoes,0);assert.equal(vinculos,2);assert.equal(turmaExiste,true);});
test('rematrícula da oferta e snapshot de contrato também impedem exclusão sem FK restritiva',async()=>{for(const tipo of ['rematricula','snapshot']){admin();if(tipo==='rematricula')rematricula=1;else snapshot=1;assert.equal((await remover()).status,409);assert.equal(mutacoes,0);}});
test('oferta derivada válida impede remover origem; prefixo de código inválido não bloqueia turma vazia',async()=>{admin();derivadas=[{cursoId:4,codigo:'OFERTA-1-4'}];assert.equal((await remover()).status,409);assert.equal(mutacoes,0);admin();bloqueiaExclusao=false;derivadas=[{cursoId:4,codigo:'OFERTA-1-44'}];assert.equal((await remover()).status,200);});
test('concorrência e novas referências retornam conflito e revertem todas as remoções',async()=>{for(const code of ['P2014','P2034','P2025']){admin();bloqueiaExclusao=false;codigoFalha=code;vinculos=2;turmaExiste=true;assert.equal((await remover()).status,409);assert.equal(vinculos,2);assert.equal(turmaExiste,true);}});
