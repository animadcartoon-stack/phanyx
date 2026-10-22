// Read-only preflight: never deploy unrelated pending migrations with this package.
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const TARGET = '20261022190000_organizacao_curricular_anual';
async function main() {
  const db = new PrismaClient();
  try {
    const rows = await db.$queryRawUnsafe('SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"');
    if (rows.some(r => !r.finished_at && !r.rolled_back_at)) throw new Error('Há uma migração interrompida. Envie o resultado de prisma migrate status antes de continuar.');
    const done = new Set(rows.filter(r => r.finished_at && !r.rolled_back_at).map(r => r.migration_name));
    const directory = path.resolve(__dirname, '../prisma/migrations');
    const pending = fs.readdirSync(directory).filter(name => fs.existsSync(path.join(directory,name,'migration.sql')) && !done.has(name));
    const other = pending.filter(name => name !== TARGET);
    if (other.length) throw new Error('Existem outras migrações pendentes. Nenhuma foi aplicada por este verificador. Migrações: ' + other.join(', '));
    console.log(done.has(TARGET) ? 'A migração de organização curricular já consta como aplicada.' : 'Verificação concluída: somente a migração de organização curricular está pendente.');
  } finally { await db.$disconnect(); }
}
main().catch(error => {
  // Do not echo connection strings or underlying driver diagnostics.
  console.error(error.message?.startsWith('Existem outras') || error.message?.startsWith('Há uma')
    ? error.message : 'Não foi possível verificar o banco. Confira a configuração local e a conexão; nenhuma migração foi executada.');
  process.exitCode = 1;
});
