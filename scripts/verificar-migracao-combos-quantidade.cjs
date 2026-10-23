// Preflight is read-only. --aplicar deploys only when this is the sole pending migration.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const base = require('./verificar-migracao-organizacao.cjs');
const { prepararClienteVerificacao } = require('./cliente-verificacao-migracao.cjs');
const TARGET = '20261023101500_combo_precos_quantidade';
let aplicacaoIniciada = false;
async function main() {
  base.carregarConfiguracao();
  const url = base.urlDireta();
  console.log('Preparando leitor isolado do histórico de migrações, sem reinstalar dependências...');
  const { PrismaClient } = prepararClienteVerificacao();
  console.log('Leitor isolado pronto. Consultando o histórico pela conexão direta...');
  const consultar = () => base.consultarHistorico(() => new PrismaClient({ datasources: { db: { url } } }));
  let rows = await consultar();
  const result = base.analisarMigracoes(rows, path.resolve(__dirname, '../prisma/migrations'), process.argv.includes('--exigir-aplicada'), TARGET);
  if (process.argv.includes('--aplicar') && !result.aplicada) {
    aplicacaoIniciada = true;
    console.log('Aplicando a migração aditiva de preços por quantidade...');
    const execucao = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'),
      'migrate', 'deploy', '--schema', path.resolve(__dirname, '../prisma/schema.prisma')],
      { cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit' });
    if (execucao.error || execucao.status !== 0) {
      console.error('A migração não foi concluída. Não integre nem publique esta branch. Consulte o histórico antes de tentar novamente.');
      process.exitCode = 1;
      return;
    }
    rows = await consultar();
    base.analisarMigracoes(rows, path.resolve(__dirname, '../prisma/migrations'), true, TARGET);
    console.log('Migração de preços por quantidade concluída e conferida.');
    return;
  }
  console.log(result.aplicada ? 'A migração de preços por quantidade já consta como aplicada.' :
    'Verificação concluída: somente a migração de preços por quantidade está pendente.');
}
if (require.main === module) main().catch(error => {
  console.error(base.diagnosticoSeguro(error).replace(' Nenhuma migração foi executada pelo verificador.', ''));
  console.error(aplicacaoIniciada
    ? 'A aplicação foi iniciada; confira o histórico para saber o resultado. A branch não deve ser enviada.'
    : 'Nenhuma migração foi iniciada por este pacote.');
  process.exitCode = 1;
});
module.exports = { TARGET };
