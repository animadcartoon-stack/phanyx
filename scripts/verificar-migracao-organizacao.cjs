// Read-only: use the same direct connection as Prisma Migrate, without logging credentials.
const fs = require('node:fs');
const path = require('node:path');
const TARGET = '20261022190000_organizacao_curricular_anual';
class ErroVerificacao extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
function carregarConfiguracao(root = path.resolve(__dirname, '..')) {
  // Standalone node does not get the environment loading of the Prisma CLI.
  require('@next/env').loadEnvConfig(root, false, { info() {}, error() {} });
}
function urlDireta(env = process.env) {
  if (!env.DIRECT_URL?.trim()) throw new ErroVerificacao('CONFIG_DIRETA_AUSENTE',
    'DIRECT_URL não foi carregada. Confira a configuração local do projeto; não envie senhas ou URLs na conversa.');
  let url;
  try { url = new URL(env.DIRECT_URL.trim()); } catch {
    throw new ErroVerificacao('CONFIG_URL_INVALIDA', 'A configuração DIRECT_URL não é uma URL PostgreSQL válida.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new ErroVerificacao('CONFIG_URL_INVALIDA',
    'A configuração DIRECT_URL não é uma URL PostgreSQL válida.');
  if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '20');
  if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '20');
  return url.toString();
}
function analisarMigracoes(rows, directory, exigirAplicada = false, alvo = TARGET) {
  if (rows.some(r => !r.finished_at && !r.rolled_back_at)) throw new ErroVerificacao('MIGRACAO_INTERROMPIDA',
    'Há uma migração interrompida. Envie o resultado de prisma migrate status antes de continuar.');
  const done = new Set(rows.filter(r => r.finished_at && !r.rolled_back_at).map(r => r.migration_name));
  const pending = fs.readdirSync(directory).filter(name => fs.existsSync(path.join(directory, name, 'migration.sql')) && !done.has(name));
  const other = pending.filter(name => name !== alvo);
  if (other.length) throw new ErroVerificacao('OUTRAS_MIGRACOES_PENDENTES',
    'Existem outras migrações pendentes. Nenhuma foi aplicada por este verificador. Migrações: ' + other.filter(n => /^[\w-]+$/.test(n)).join(', '));
  if (exigirAplicada && !done.has(alvo)) throw new ErroVerificacao('MIGRACAO_NAO_APLICADA',
    'A migração esperada ainda não consta como aplicada. A branch não deve ser integrada.');
  return { aplicada: done.has(alvo), pendentes: pending };
}
function codigoSeguro(error) {
  for (const code of [error?.code, error?.errorCode, error?.cause?.code, error?.cause?.errorCode]) {
    if (typeof code === 'string' && /^[A-Z][A-Z0-9_]{3,48}$/.test(code)) return code;
  }
  const message = typeof error?.message === 'string' ? error.message : '';
  if (/did not initialize yet/i.test(message)) return 'CLIENTE_PRISMA_NAO_GERADO';
  if (/could not locate the Query Engine|unable to require.*query_engine|Query Engine.*not found/i.test(message)) return 'MOTOR_PRISMA_AUSENTE';
  if (error?.name === 'PrismaClientInitializationError') return 'INICIALIZACAO_PRISMA_FALHOU';
  if (error?.name === 'PrismaClientValidationError') return 'VALIDACAO_PRISMA_FALHOU';
  return 'SEM_CODIGO';
}
function diagnosticoSeguro(error) {
  if (error instanceof ErroVerificacao) return `[${error.code}] ${error.message}`;
  const code = codigoSeguro(error);
  const messages = {
    DEPENDENCIAS_PRISMA_AUSENTES: 'Os arquivos do Prisma estão incompletos nas dependências locais.',
    VERSOES_PRISMA_DIFERENTES: 'Os pacotes prisma e @prisma/client instalados têm versões diferentes.',
    GERACAO_VERIFICADOR_FALHOU: 'Não foi possível gerar o leitor isolado de migrações. Confira as dependências do Prisma e a conexão para baixar seu motor.',
    CARREGAMENTO_VERIFICADOR_FALHOU: 'O leitor de migrações foi gerado, mas não pôde ser carregado neste computador.',
    CLIENTE_PRISMA_NAO_GERADO: 'O cliente Prisma utilizado ainda não foi gerado.',
    MOTOR_PRISMA_AUSENTE: 'O motor do Prisma não está disponível para este computador.',
    INICIALIZACAO_PRISMA_FALHOU: 'O motor do Prisma falhou ao iniciar. Confira a geração do cliente e a configuração local.',
    VALIDACAO_PRISMA_FALHOU: 'O Prisma recusou a configuração ou a consulta antes de executar a verificação.',
    P1000: 'A autenticação no banco foi recusada. Confira as credenciais locais.',
    P1001: 'Não foi possível alcançar o banco pela conexão direta. Confira a conexão de rede e tente novamente.',
    P1002: 'O banco não respondeu dentro do tempo de conexão.',
    P1003: 'O banco configurado não foi encontrado.',
    P1010: 'O usuário do banco não tem acesso à consulta de migrações.',
    P1011: 'A conexão TLS com o banco falhou.',
    P1012: 'A configuração de conexão não foi carregada ou é inválida.',
    P1017: 'O servidor encerrou a conexão.',
    P2024: 'A conexão com o banco excedeu o tempo de espera.',
    P2010: 'O banco recusou a consulta de verificação do histórico de migrações.',
  };
  return `[${code}] ${messages[code] || 'A checagem do banco falhou. Envie este código para verificarmos.'} Nenhuma migração foi executada pelo verificador.`;
}
function transitorio(error) {
  return ['P1001', 'P1002', 'P1017', 'P2024'].includes(codigoSeguro(error)) ||
    (codigoSeguro(error) === 'P2010' && ['08000', '08003', '08006', '57P03'].includes(error?.meta?.code));
}
async function consultarHistorico(criarCliente, { esperar = ms => new Promise(resolve => setTimeout(resolve, ms)), avisar = console.log } = {}) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    let db;
    try {
      db = criarCliente();
      return await db.$queryRawUnsafe('SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"');
    } catch (error) {
      if (tentativa === 3 || !transitorio(error)) throw error;
      avisar(`Conexão indisponível [${codigoSeguro(error)}]. Nova tentativa ${tentativa + 1}/3...`);
      await esperar(2000);
    } finally { if (db) await db.$disconnect().catch(() => {}); }
  }
}
async function main() {
  carregarConfiguracao();
  const url = urlDireta();
  const { PrismaClient } = require('@prisma/client');
  const rows = await consultarHistorico(() => new PrismaClient({ datasources: { db: { url } } }));
  const result = analisarMigracoes(rows, path.resolve(__dirname, '../prisma/migrations'), process.argv.includes('--exigir-aplicada'));
  console.log(result.aplicada ? 'A migração de organização curricular já consta como aplicada.' :
    'Verificação concluída pela conexão direta: somente a migração de organização curricular está pendente.');
}
if (require.main === module) main().catch(error => { console.error(diagnosticoSeguro(error)); process.exitCode = 1; });
module.exports = { TARGET, carregarConfiguracao, urlDireta, analisarMigracoes, codigoSeguro, diagnosticoSeguro, consultarHistorico };
