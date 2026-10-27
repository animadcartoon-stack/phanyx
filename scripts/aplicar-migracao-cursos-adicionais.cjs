'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const TARGET = '20261027170000_cursos_adicionais_matricula';
function analisar(rows, directory) {
  if (rows.some(r => !r.finished_at && !r.rolled_back_at)) throw Error('Existe migração incompleta. Nenhuma nova migração foi executada.');
  const applied = new Map(rows.filter(r => r.finished_at && !r.rolled_back_at).map(r => [r.migration_name, r]));
  const local = fs.readdirSync(directory, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(directory, d.name, 'migration.sql'))).map(d => d.name).sort();
  if (!local.includes(TARGET)) throw Error('Migração dos cursos adicionais ausente.');
  const pending = local.filter(n => !applied.has(n));
  if (pending.some(n => n !== TARGET)) throw Error('Há outras migrações pendentes. Este aplicador permite somente ' + TARGET + '. Nenhuma migração foi aplicada.');
  if (applied.has(TARGET)) {
    const source = fs.readFileSync(path.join(directory, TARGET, 'migration.sql'), 'utf8').replace(/\r\n/g, '\n');
    const hashes = [source, source.replace(/\n/g, '\r\n')].map(s => crypto.createHash('sha256').update(s).digest('hex'));
    if (!hashes.includes(applied.get(TARGET).checksum)) throw Error('A migração aplicada tem outro conteúdo. Preserve o histórico e envie a saída.');
  }
  return pending;
}
function validarColunas(rows) {
  for (const campo of ['permiteCursosAdicionais', 'disponivelComoAdicional']) {
    const c = rows.find(r => r.column_name === campo);
    if (!c || c.data_type !== 'boolean' || c.is_nullable !== 'NO' || c.column_default !== 'false') throw Error('A coluna ' + campo + ' não corresponde à migração. Não publique antes de conferir.');
  }
}
async function main() {
  const root = path.resolve(__dirname, '..');
  const argumento = process.argv.indexOf('--env-root');
  const envRoot = argumento < 0 ? root : process.argv[argumento + 1];
  if (!envRoot || !fs.existsSync(path.join(envRoot, 'package.json'))) throw Error('Pasta da configuração local não encontrada.');
  require('@next/env').loadEnvConfig(envRoot, false, { info() {}, error() {} });
  const { urlDireta, diagnosticoSeguro, codigoSeguro } = require('./verificar-migracao-organizacao.cjs');
  let uri;
  try { uri = urlDireta(); } catch (e) { throw Error(diagnosticoSeguro(e)); }
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url: uri } } });
  const directory = path.join(root, 'prisma/migrations');
  const historico = () => db.$queryRaw`SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`;
  try {
    const pending = analisar(await historico(), directory);
    if (pending.length && process.argv.includes('--verificar')) { console.log('Pendente apenas: ' + TARGET); return; }
    if (pending.length) {
      console.log('Aplicando ' + TARGET + ': duas opções booleanas, desativadas por padrão.');
      const result = require('node:child_process').spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', path.join(root, 'prisma/schema.prisma')], { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, DATABASE_URL: uri, DIRECT_URL: uri } });
      if (result.error || result.status !== 0) throw Error('Migração não concluída. Não publique antes de conferir a saída.');
    }
    if (analisar(await historico(), directory).length) throw Error('A migração continua pendente.');
    validarColunas(await db.$queryRaw`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Curso' AND column_name IN ('permiteCursosAdicionais', 'disponivelComoAdicional')`);
    console.log('Migração aplicada e colunas verificadas. Configure os cursos após publicar.');
  } catch (e) {
    if (e?.name?.startsWith('Prisma')) throw Error('[' + codigoSeguro(e) + '] Falha ao consultar ou verificar o banco. Confira o histórico da migração antes de publicar.');
    throw e;
  } finally { await db.$disconnect(); }
}
module.exports = { TARGET, analisar, validarColunas };
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
