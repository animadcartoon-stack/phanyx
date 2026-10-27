const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(r, p, ...rest) { return resolve.call(this, r.startsWith('@/') ? path.resolve(__dirname, '..', r.slice(2)) : r, p, ...rest); };
Module._extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
const regras = { versao: 1, horariosPendentesPermitidos: true, disciplinaIdsObrigatorias: [1], grupos: [
  { id: 'terca', nome: 'Terça', minimo: 2, maximo: 2, disciplinaIds: [2,3,4,5] },
  { id: 'quinta', nome: 'Quinta', minimo: 2, maximo: 2, disciplinaIds: [6,7,8] },
] };
const core = require('../lib/matriculas/selecao-disciplinas.ts');
test('curso sem ativação mantém seleção anterior', () => {
  assert.equal(core.normalizarSelecaoDisciplinas(null), null);
  assert.equal(core.validarSelecaoDisciplinas(null, [999]), null);
});
test('duas escolhas de cada grupo e obrigatória, sem inventar preço', () => {
  const config = core.validarSelecaoDisciplinas(regras, [1,2,3,6,7], [1,2,3,4,5,6,7,8]);
  assert.equal(config.grupos.length, 2);
  assert.equal(config.horariosPendentesPermitidos, true);
  assert.equal('total' in config, false);
  assert.deepEqual(regras.disciplinaIdsObrigatorias, [1]);
});
test('não compensa falta na quinta com excesso na terça', () => {
  assert.throws(() => core.validarSelecaoDisciplinas(regras,[1,2,3,4,6]), e => e.codigo === 'LIMITE_GRUPO_SELECAO');
  assert.throws(() => core.validarSelecaoDisciplinas(regras,[1,2,6,7]), e => e.codigo === 'LIMITE_GRUPO_SELECAO');
});
test('não aceita obrigatório ausente, ID repetido ou disciplina externa', () => {
  assert.throws(() => core.validarSelecaoDisciplinas(regras,[2,3,6,7]), e => e.codigo === 'SELECAO_OBRIGATORIA_AUSENTE');
  assert.throws(() => core.validarSelecaoDisciplinas(regras,[1,2,2,6,7]));
  assert.throws(() => core.validarSelecaoDisciplinas(regras,[1,2,3,6,7,999]), e => e.codigo === 'DISCIPLINA_FORA_DA_SELECAO');
});
test('configuração valida limites, identidade de grupos e partição das disciplinas', () => {
  for (const alterar of [r=>r.grupos[0].maximo=1,r=>r.grupos[0].minimo=-1,r=>r.grupos[1].id='terca',r=>r.grupos[1].disciplinaIds.push(2),r=>r.grupos[0].disciplinaIds.push(1),r=>r.grupos[0].maximo=5]) {
    const r=structuredClone(regras); alterar(r); assert.throws(()=>core.normalizarSelecaoDisciplinas(r));
  }
});
test('benefício exige mensalidade fixa e mantém separado preço por disciplinas', () => {
  core.validarModoSelecao({ organizacaoCurricular:'ANUAL', regrasPrecoDisciplinas:null, participaCombo:false });
  for (const curso of [{organizacaoCurricular:'LIVRE'},{regrasPrecoDisciplinas:{versao:1}},{participaCombo:true}]) assert.throws(()=>core.validarModoSelecao(curso), e=>e.codigo==='SELECAO_EXIGE_PRECO_FIXO');
});
test('grade removida ou de outra instituição não valida configuração', () => {
  assert.throws(()=>core.validarSelecaoDisciplinas(regras,[1,2,3,6,7],[1,2,3,6,7]),e=>e.codigo==='GRADE_SELECAO_ALTERADA');
});
test('regras antigas permanecem independentes da nova configuração', () => {
  const snapshot=JSON.parse(JSON.stringify(core.normalizarSelecaoDisciplinas(regras)));
  const novas=structuredClone(regras); novas.grupos[0].minimo=3; novas.grupos[0].maximo=3;
  assert.throws(()=>core.validarSelecaoDisciplinas(novas,[1,2,3,6,7]));
  assert.ok(core.validarSelecaoDisciplinas(snapshot,[1,2,3,6,7]));
});
test('impede cobrar avulso já incluído, nas duas ordens, somente em períodos coincidentes', () => {
  const periodo = { disciplinaId:2, inicio:'2027-01-01',fim:'2027-12-31' };
  assert.equal(core.temDisciplinaIncluidaDuplicada([{...periodo,incluida:true}],[{...periodo,incluida:false}]),true);
  assert.equal(core.temDisciplinaIncluidaDuplicada([{...periodo,incluida:false}],[{...periodo,incluida:true}]),true);
  assert.equal(core.temDisciplinaIncluidaDuplicada([{...periodo,inicio:'2028-01-01',fim:'2028-12-31',incluida:false}],[{...periodo,incluida:true}]),false);
  assert.equal(core.temDisciplinaIncluidaDuplicada([{...periodo,incluida:false}],[{...periodo,incluida:false}]),false);
  assert.equal(core.temDisciplinaIncluidaDuplicada([{...periodo,disciplinaId:3,incluida:false}],[{...periodo,incluida:true}]),false);
});

const realLoad=Module._load;
let banco, usuario={id:99,instituicaoId:26,role:'ADMIN'};
Module._load=function(request,parent,...rest){
  if(request==='@/lib/prisma')return {prisma:new Proxy({}, {get:(_,key)=>banco[key]})};
  if(request==='@/lib/server-auth')return {getUserFromToken:async()=>usuario};
  if(request==='next-intl/server')return {getLocale:async()=>'pt-BR'};
  return realLoad.call(this,request,parent,...rest);
};
const handler=require('../app/api/admin/cursos/[id]/selecao-disciplinas/route.ts');
const servidor=require('../lib/matriculas/selecao-disciplinas-servidor.ts');
function mockDb(){
  const curso={id:18,instituicaoId:26,ativo:true,excluidoEm:null,organizacaoCurricular:'ANUAL',regrasPrecoDisciplinas:null,participaCombo:false,regrasSelecaoDisciplinas:null,publicacaoRedeDestino:null,updatedAt:new Date('2026-10-27T12:00:00Z'),semestres:[{disciplinas:[1,2,3,4,5,6,7,8].map(id=>({disciplina:{id,nome:'Disciplina '+id,ativo:true,instituicaoId:26}}))}]};
  let updates=0;
  const db={curso:{findFirst:async({where})=>where.instituicaoId===curso.instituicaoId&&where.id===curso.id?structuredClone(curso):null,update:async({where,data})=>{assert.equal(where.instituicaoId,26);updates++;curso.regrasSelecaoDisciplinas=data.regrasSelecaoDisciplinas;curso.updatedAt=new Date('2026-10-27T12:01:00Z');}},disciplina:{findMany:async({where})=>where.instituicaoId===26?where.id.in.map(id=>({id})):[]},$queryRaw:async()=>[],get updates(){return updates},cursoReal:curso};
  db.$transaction=async callback=>callback(db);return db;
}
const request=(r,updatedAt='2026-10-27T12:00:00.000Z')=>new Request('http://localhost/api/admin/cursos/18/selecao-disciplinas',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({regras:r,updatedAt,instituicaoId:999})});
test('configuração salva somente curso e instituição do administrador', async()=>{
  banco=mockDb();const res=await handler.PUT(request(regras),{params:{id:'18'}});assert.equal(res.status,200);assert.equal(banco.updates,1);assert.equal((await res.json()).regras.grupos.length,2);
});
test('outra instituição, versão desatualizada e disciplina externa não gravam',async()=>{
  banco=mockDb();usuario={...usuario,instituicaoId:999};assert.equal((await handler.PUT(request(regras),{params:{id:'18'}})).status,404);assert.equal(banco.updates,0);usuario={...usuario,instituicaoId:26};
  assert.equal((await handler.PUT(request(regras,'2000-01-01'),{params:{id:'18'}})).status,409);assert.equal(banco.updates,0);
  const r=structuredClone(regras);r.grupos[0].disciplinaIds=[2,3,999];assert.equal((await handler.PUT(request(r),{params:{id:'18'}})).status,409);assert.equal(banco.updates,0);
});
test('professor e curso recebido da rede não podem ativar regras',async()=>{
  banco=mockDb();usuario={...usuario,role:'PROFESSOR'};assert.equal((await handler.PUT(request(regras),{params:{id:'18'}})).status,403);assert.equal(banco.updates,0);usuario={...usuario,role:'ADMIN'};
  banco.cursoReal.publicacaoRedeDestino={id:4};assert.equal((await handler.PUT(request(regras),{params:{id:'18'}})).status,409);assert.equal(banco.updates,0);
});
test('servidor rejeita lista cursada diferente da contratada',async()=>{
  banco=mockDb();await assert.rejects(()=>servidor.conferirSelecaoContratada(banco,{instituicaoId:26,cursoId:18,regras,disciplinaIds:[1,2,3,6,7],itens:[1,2,3,6].map(disciplinaId=>({disciplinaId}))}),e=>e.codigo==='SELECAO_ITENS_DIVERGENTES');
  await servidor.conferirSelecaoContratada(banco,{instituicaoId:26,cursoId:18,regras,disciplinaIds:[1,2,3,6,7],itens:[1,2,3,6,7].map(disciplinaId=>({disciplinaId}))});
});

test('aplicador não executa outras migrações nem continua histórico incompleto',()=>{
  const {analisar,TARGET}=require('../scripts/aplicar-migracao-selecao-disciplinas.cjs');
  const directory=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'phanyx-migracao-selecao-test-'));
  fs.mkdirSync(path.join(directory,TARGET));fs.writeFileSync(path.join(directory,TARGET,'migration.sql'),'SELECT 1;\n');
  assert.deepEqual(analisar([],directory),[TARGET]);
  fs.mkdirSync(path.join(directory,'outra_migracao'));fs.writeFileSync(path.join(directory,'outra_migracao','migration.sql'),'SELECT 2;\n');
  assert.throws(()=>analisar([],directory),/outras migrações/);
  assert.throws(()=>analisar([{migration_name:TARGET,finished_at:null,rolled_back_at:null}],directory),/incompleta/);
});

test('verificador compatível é reutilizado sem sobrescrever o motor já carregado',()=>{
  const {carregarVerificador}=require('../scripts/aplicar-migracao-selecao-disciplinas.cjs');
  const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'phanyx-verificador-reuso-'));
  function gravar(nome,conteudo){const destino=path.join(root,nome);fs.mkdirSync(path.dirname(destino),{recursive:true});fs.writeFileSync(destino,conteudo);}
  try{
    for(const p of ['prisma','@prisma/client'])gravar('node_modules/'+p+'/package.json',JSON.stringify({version:'5.22.0'}));
    gravar('node_modules/.cache/phanyx-verificacao-banco/cliente/index.js',`module.exports={PrismaClient:class{},Prisma:{prismaVersion:{client:'5.22.0'},ModelName:{HistoricoMigracao:'HistoricoMigracao'}}};`);
    const cliente=carregarVerificador(root);assert.equal(typeof cliente.PrismaClient,'function');
    assert.equal(carregarVerificador(root),cliente);
    // Este diretório não possui gerador: chamar a geração faria o teste falhar.
    assert.equal(fs.existsSync(path.join(root,'scripts/cliente-verificacao-migracao.cjs')),false);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('aplicador reutiliza o verificador, verifica a migração e impede repetição ou histórico inseguro',()=>{
  const {spawnSync}=require('node:child_process'),crypto=require('node:crypto');
  const {TARGET}=require('../scripts/aplicar-migracao-selecao-disciplinas.cjs');
  const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'phanyx-aplicador-reuso-'));
  function gravar(nome,conteudo){const destino=path.join(root,nome);fs.mkdirSync(path.dirname(destino),{recursive:true});fs.writeFileSync(destino,conteudo);}
  const estado=path.join(root,'estado.json'),chamadas=path.join(root,'chamadas.json');
  const sql='ALTER TABLE "Curso" ADD COLUMN "regrasSelecaoDisciplinas" JSONB;\n';
  const checksum=crypto.createHash('sha256').update(sql).digest('hex');
  try{
    gravar('scripts/aplicar-migracao-selecao-disciplinas.cjs',fs.readFileSync(path.join(__dirname,'../scripts/aplicar-migracao-selecao-disciplinas.cjs'),'utf8'));
    gravar('scripts/cliente-verificacao-migracao.cjs',`throw Error('NAO_PODE_REGENERAR_MOTOR_EM_USO');`);
    gravar('scripts/verificar-migracao-organizacao.cjs',`module.exports={codigoSeguro:e=>e.code,diagnosticoSeguro:()=> 'FALHA_CONSULTA'};`);
    gravar('node_modules/@next/env/index.js',`exports.loadEnvConfig=()=>{};`);
    for(const p of ['prisma','@prisma/client'])gravar('node_modules/'+p+'/package.json',JSON.stringify({version:'5.22.0'}));
    gravar('node_modules/.cache/phanyx-verificacao-banco/cliente/index.js',`const fs=require('fs');module.exports={Prisma:{prismaVersion:{client:'5.22.0'},ModelName:{HistoricoMigracao:'HistoricoMigracao'}},PrismaClient:class{async $queryRaw(){return JSON.parse(fs.readFileSync(process.env.PHANYX_TESTE_ESTADO,'utf8'));}async $disconnect(){}}};`);
    gravar('node_modules/prisma/build/index.js',`const fs=require('fs');fs.writeFileSync(process.env.PHANYX_TESTE_CHAMADAS,JSON.stringify(process.argv.slice(2)));fs.writeFileSync(process.env.PHANYX_TESTE_ESTADO,JSON.stringify([{migration_name:${JSON.stringify(TARGET)},checksum:${JSON.stringify(checksum)},finished_at:'2026-10-27',rolled_back_at:null}]));`);
    gravar('prisma/migrations/'+TARGET+'/migration.sql',sql);gravar('prisma/schema.prisma','// teste sem acesso a banco\n');
    const env={...process.env,DIRECT_URL:'postgresql://teste:teste@localhost/teste',DATABASE_URL:'postgresql://teste:teste@localhost/teste',PHANYX_TESTE_ESTADO:estado,PHANYX_TESTE_CHAMADAS:chamadas};
    const executar=(args=[])=>spawnSync(process.execPath,[path.join(root,'scripts/aplicar-migracao-selecao-disciplinas.cjs'),...args],{cwd:root,env,encoding:'utf8'});
    gravar('estado.json','[]');
    let r=executar(['--verificar']);assert.equal(r.status,0,r.stderr);assert.equal(fs.existsSync(chamadas),false);
    r=executar();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/sem gerar novamente/);assert.match(r.stdout,/Migração verificada/);
    assert.deepEqual(JSON.parse(fs.readFileSync(chamadas,'utf8')),['migrate','deploy','--schema',path.join(root,'prisma/schema.prisma')]);
    fs.unlinkSync(chamadas);r=executar();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/já aplicada e verificada/);assert.equal(fs.existsSync(chamadas),false);
    gravar('estado.json',JSON.stringify([{migration_name:TARGET,checksum:'divergente',finished_at:'2026-10-27',rolled_back_at:null}]));
    r=executar();assert.equal(r.status,1);assert.match(r.stderr,/outro conteúdo/);assert.equal(fs.existsSync(chamadas),false);
    gravar('estado.json',JSON.stringify([{migration_name:TARGET,finished_at:null,rolled_back_at:null}]));
    r=executar();assert.equal(r.status,1);assert.match(r.stderr,/incompleta/);assert.equal(fs.existsSync(chamadas),false);
    gravar('estado.json','[]');gravar('prisma/migrations/outra/migration.sql','SELECT 1;\n');
    r=executar();assert.equal(r.status,1);assert.match(r.stderr,/outras migrações/);assert.equal(fs.existsSync(chamadas),false);
    gravar('node_modules/@prisma/client/package.json',JSON.stringify({version:'5.21.0'}));
    r=executar();assert.equal(r.status,1);assert.match(r.stderr,/VERSOES_PRISMA_DIFERENTES/);assert.equal(fs.existsSync(chamadas),false);
    for(const p of ['prisma','@prisma/client'])gravar('node_modules/'+p+'/package.json',JSON.stringify({version:'5.23.0'}));
    r=executar();assert.equal(r.status,1);assert.match(r.stderr,/VERIFICADOR_INCOMPATIVEL/);assert.equal(fs.existsSync(chamadas),false);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
