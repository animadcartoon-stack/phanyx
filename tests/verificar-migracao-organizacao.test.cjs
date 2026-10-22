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
