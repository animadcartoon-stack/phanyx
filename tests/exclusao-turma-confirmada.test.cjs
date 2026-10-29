const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript'),vm=require('vm');
const modulo={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/academico/exclusao-turma-interface.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:modulo});
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
test('sucesso exige confirmação do ID e ausência na leitura seguinte',async()=>{
 const calls=[];await modulo.excluirTurmaConferida(23,async(url,init)=>{calls.push([url,init]);return calls.length===1?response(200,{ok:true,id:23}):response(404,{error:'Turma não encontrada'});});
 assert.deepEqual(calls.map(c=>[c[0],c[1].method||'GET',c[1].cache]),[['/api/turma/23','DELETE','no-store'],['/api/turma/23','GET','no-store']]);
});
test('não anuncia sucesso para HTML/JSON inesperado, outro ID ou cadastro que permaneça',async()=>{
 for(const caso of [{body:{message:'ok'}},{body:{ok:true,id:24}},{body:{ok:true,id:23},getStatus:200},{body:{ok:true,id:23},getStatus:401},{body:{ok:true,id:23},getStatus:500}]){
  let n=0;await assert.rejects(modulo.excluirTurmaConferida(23,async()=>++n===1?response(200,caso.body):response(caso.getStatus,{id:23})),e=>e.codigo==='NAO_CONFIRMADA');
 }
 await assert.rejects(modulo.excluirTurmaConferida(23,async()=>new Response('<html>login</html>')),e=>e.codigo==='NAO_CONFIRMADA');
});
test('recusa do servidor preserva motivo e não tenta conferir uma exclusão inexistente',async()=>{
 let n=0;await assert.rejects(modulo.excluirTurmaConferida(23,async()=>{n++;return response(409,{error:'Turma com matrícula'});}),e=>e.codigo==='RECUSADA'&&e.message==='Turma com matrícula');assert.equal(n,1);
});
test('IDs inválidos não chegam à API e mensagem identifica o alvo nos cinco idiomas',async()=>{
 for(const id of [0,-1,1.5,NaN])await assert.rejects(modulo.excluirTurmaConferida(id,()=>{throw Error('API não deveria ser chamada');}),e=>e.codigo==='NAO_CONFIRMADA');
 for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR'])assert.ok(modulo.mensagemExclusaoNaoConfirmada(locale,'I3V').includes('I3V'));
});
