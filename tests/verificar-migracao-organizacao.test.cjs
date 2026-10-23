const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const helper = require('../scripts/verificar-migracao-organizacao.cjs');
const fixture = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-preflight-'));
  for (const name of ['20261021000000_base', helper.TARGET]) {
    fs.mkdirSync(path.join(directory, name)); fs.writeFileSync(path.join(directory, name, 'migration.sql'), '-- fixture');
  }
  return directory;
};
const applied = name => ({ migration_name: name, finished_at: new Date(), rolled_back_at: null });
test('node isolado carrega DIRECT_URL do arquivo .env sem depender da CLI', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-env-'));
  fs.writeFileSync(path.join(directory, '.env'), 'DIRECT_URL="postgresql://fixture:fixture@direct.invalid/fixture"\n');
  const env = { ...process.env }; delete env.DIRECT_URL;
  try {
    const result = execFileSync(process.execPath, ['-e', `const h=require(${JSON.stringify(require.resolve('../scripts/verificar-migracao-organizacao.cjs'))});h.carregarConfiguracao(${JSON.stringify(directory)});process.stdout.write(String(new URL(h.urlDireta()).hostname==='direct.invalid'));`], { env, encoding: 'utf8' });
    assert.equal(result, 'true');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('checagem usa DIRECT_URL e preserva SSL e timeout configurados', () => {
  const url = new URL(helper.urlDireta({ DATABASE_URL:'postgresql://x:y@pool.invalid/db', DIRECT_URL:'postgresql://x:y@direct.invalid/db?sslmode=require&connect_timeout=35' }));
  assert.equal(url.hostname,'direct.invalid');assert.equal(url.searchParams.get('sslmode'),'require');assert.equal(url.searchParams.get('connect_timeout'),'35');
});
test('configuração ausente ou inválida é recusada sem vazar valores', () => {
  for (const env of [{}, { DIRECT_URL:'invalid-secret' }, { DIRECT_URL:'https://secret.invalid/password' }]) {
    assert.throws(() => helper.urlDireta(env), error => !helper.diagnosticoSeguro(error).includes('invalid-secret') && !helper.diagnosticoSeguro(error).includes('secret.invalid'));
  }
});
test('só a migração esperada pendente permite continuar; outras bloqueiam', () => {
  const directory=fixture();try {
    assert.equal(helper.analisarMigracoes([applied('20261021000000_base')],directory).aplicada,false);
    assert.throws(()=>helper.analisarMigracoes([],directory),e=>e.code==='OUTRAS_MIGRACOES_PENDENTES');
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('migração interrompida e pós-checagem sem conclusão bloqueiam envio', () => {
  const directory=fixture();try {
    assert.throws(()=>helper.analisarMigracoes([{migration_name:helper.TARGET,finished_at:null,rolled_back_at:null}],directory),e=>e.code==='MIGRACAO_INTERROMPIDA');
    assert.throws(()=>helper.analisarMigracoes([applied('20261021000000_base')],directory,true),e=>e.code==='MIGRACAO_NAO_APLICADA');
    assert.equal(helper.analisarMigracoes([applied('20261021000000_base'),applied(helper.TARGET)],directory,true).aplicada,true);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('falha transitória tenta novamente com limite e desconecta todos os clientes', async () => {
  let attempts=0,disconnects=0,waits=0;
  const result=await helper.consultarHistorico(()=>({$queryRawUnsafe:async()=>{attempts++;if(attempts<3)throw {code:'P1001'};return ['ok'];},$disconnect:async()=>{disconnects++;}}),{esperar:async()=>waits++,avisar:()=>{}});
  assert.deepEqual(result,['ok']);assert.equal(attempts,3);assert.equal(disconnects,3);assert.equal(waits,2);
  attempts=0;
  await assert.rejects(helper.consultarHistorico(()=>({$queryRawUnsafe:async()=>{attempts++;throw {code:'P1001'};},$disconnect:async()=>{}}),{esperar:async()=>{},avisar:()=>{}}));
  assert.equal(attempts,3);
});
test('falha de autenticação não repete nem expõe mensagem ou URL do driver',async()=>{
  let attempts=0;
  await assert.rejects(helper.consultarHistorico(()=>({$queryRawUnsafe:async()=>{attempts++;throw {code:'P1000',message:'postgresql://user:password@secret.invalid/db'};},$disconnect:async()=>{}})),e=>{
    const result=helper.diagnosticoSeguro(e);assert.ok(result.includes('P1000'));assert.ok(!result.includes('password'));assert.ok(!result.includes('secret.invalid'));return true;
  });assert.equal(attempts,1);
});
test('preflight de combos bloqueia qualquer migração adicional e exige conclusão antes do envio',()=>{
  const alvo=require('../scripts/verificar-migracao-combos-quantidade.cjs').TARGET;
  const directory=fixture(); fs.mkdirSync(path.join(directory,alvo));fs.writeFileSync(path.join(directory,alvo,'migration.sql'),'-- fixture');
  try {
    const rows=[applied('20261021000000_base'),applied(helper.TARGET)];
    assert.deepEqual(helper.analisarMigracoes(rows,directory,false,alvo),{aplicada:false,pendentes:[alvo]});
    assert.throws(()=>helper.analisarMigracoes(rows,directory,true,alvo),e=>e.code==='MIGRACAO_NAO_APLICADA');
    assert.throws(()=>helper.analisarMigracoes([applied('20261021000000_base')],directory,false,alvo),e=>e.code==='OUTRAS_MIGRACOES_PENDENTES');
    assert.equal(helper.analisarMigracoes([...rows,applied(alvo)],directory,true,alvo).aplicada,true);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('diagnóstico reconhece cliente não gerado, motor ausente e inicialização sem expor credenciais',()=>{
  const casos=[
    [new Error('@prisma/client did not initialize yet. postgresql://user:password@secret.invalid/db'),'CLIENTE_PRISMA_NAO_GERADO'],
    [new Error('Prisma Client could not locate the Query Engine. postgresql://user:password@secret.invalid/db'),'MOTOR_PRISMA_AUSENTE'],
    [{name:'PrismaClientInitializationError',message:'postgresql://user:password@secret.invalid/db'},'INICIALIZACAO_PRISMA_FALHOU'],
    [{name:'PrismaClientValidationError',message:'postgresql://user:password@secret.invalid/db'},'VALIDACAO_PRISMA_FALHOU'],
    [{cause:{code:'P1001'},message:'postgresql://user:password@secret.invalid/db'},'P1001'],
  ];
  for(const [erro,codigo] of casos){
    assert.equal(helper.codigoSeguro(erro),codigo);
    const texto=helper.diagnosticoSeguro(erro);
    assert.ok(texto.includes(codigo)); assert.doesNotMatch(texto,/user:password|secret\.invalid/);
  }
});
test('leitor isolado funciona sem cliente da aplicação gerado e sem tocar no cliente original',async()=>{
  const Module=require('node:module'),crypto=require('node:crypto');
  const original=Module._load;
  const clientePath=require.resolve('.prisma/client/index.js');
  const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(clientePath)).digest('hex');
  const antes=hash();let usosClienteAplicacao=0;
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'phanyx-check espaço-'));
  Module._load=function(req,parent,isMain){
    if(req==='@prisma/client') {usosClienteAplicacao++;throw new Error('@prisma/client did not initialize yet.');}
    return original.call(this,req,parent,isMain);
  };
  try {
    const {prepararClienteVerificacao}=require('../scripts/cliente-verificacao-migracao.cjs');
    const {PrismaClient,Prisma}=prepararClienteVerificacao(root);
    assert.deepEqual(Prisma.dmmf.datamodel.models.map(m=>m.name),['HistoricoMigracao']);
    const urlAnterior=process.env.DIRECT_URL;
    process.env.DIRECT_URL='';
    const db=new PrismaClient();
    try {
      // Empty URL validates/loads the real engine without connecting anywhere.
      await assert.rejects(db.$connect(),e=>e.errorCode==='P1012');
    } finally {
      await db.$disconnect();
      if(urlAnterior===undefined)delete process.env.DIRECT_URL;else process.env.DIRECT_URL=urlAnterior;
    }
    assert.equal(usosClienteAplicacao,0);assert.equal(hash(),antes);
    const schema=fs.readFileSync(path.join(root,'node_modules/.cache/phanyx-verificacao-banco/schema.prisma'),'utf8');
    assert.ok(schema.includes('@@map("_prisma_migrations")'));assert.doesNotMatch(schema,/postgresql:\/\//);
  } finally {Module._load=original; fs.rmSync(root,{recursive:true,force:true});}
});
