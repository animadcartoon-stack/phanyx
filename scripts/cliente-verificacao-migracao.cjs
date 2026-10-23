// A small, isolated client avoids relying on the application's generated client.
// Generation does not connect to the database or modify the original project.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function falha(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
function prepararClienteVerificacao(root = path.resolve(__dirname, '..')) {
  let cli, gerador, versaoCli, versaoCliente;
  try {
    cli = require.resolve('prisma/build/index.js');
    const pacoteCliente = require.resolve('@prisma/client/package.json');
    gerador = path.join(path.dirname(pacoteCliente), 'generator-build', 'index.js');
    versaoCli = require('prisma/package.json').version;
    versaoCliente = require(pacoteCliente).version;
    if (!fs.existsSync(gerador)) throw falha('DEPENDENCIAS_PRISMA_AUSENTES');
  } catch {
    throw falha('DEPENDENCIAS_PRISMA_AUSENTES');
  }
  if (versaoCli !== versaoCliente) throw falha('VERSOES_PRISMA_DIFERENTES');
  const pasta = path.join(root, 'node_modules', '.cache', 'phanyx-verificacao-banco');
  fs.mkdirSync(pasta, { recursive: true });
  const schema = path.join(pasta, 'schema.prisma');
  // An explicit generator executable avoids auto-install and package resolution
  // against the temporary worktree, including when its node_modules is empty.
  const comandoGerador = `"${process.execPath}" "${gerador}"`;
  fs.writeFileSync(schema, `generator client {
  provider = ${JSON.stringify(comandoGerador)}
  output = "./cliente"
}
datasource db {
  provider = "postgresql"
  url = env("DIRECT_URL")
}
model HistoricoMigracao {
  id String @id @db.VarChar(36)
  migration_name String @db.VarChar(255)
  finished_at DateTime? @db.Timestamptz(6)
  rolled_back_at DateTime? @db.Timestamptz(6)
  @@map("_prisma_migrations")
}
`);
  const resultado = spawnSync(process.execPath, [cli, 'generate', '--schema', schema], {
    cwd: root, env: { ...process.env, PRISMA_GENERATE_SKIP_AUTOINSTALL: '1' },
    encoding: 'utf8', windowsHide: true, timeout: 120000,
  });
  if (resultado.error || resultado.status !== 0) throw falha('GERACAO_VERIFICADOR_FALHOU');
  try {
    return require(path.join(pasta, 'cliente'));
  } catch {
    throw falha('CARREGAMENTO_VERIFICADOR_FALHOU');
  }
}
module.exports = { prepararClienteVerificacao };
