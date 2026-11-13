const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const arquivo = p => readFileSync(join(root, p), 'utf8');

test('cancelamento é lógico e transacional, preservando o compromisso', () => {
  const api = arquivo('app/api/reunioes/route.ts');
  assert.match(api, /prisma\.\$transaction\(async \(tx\)/);
  assert.match(api, /data: \{ status: "CANCELADA" \}/);
  assert.doesNotMatch(api, /prisma\.reuniao\.delete\(/);
  assert.match(api, /tx\.notificacao\.createMany/);
  assert.match(api, /tipo: "REUNIAO_CANCELADA"/);
});

test('reminders não aparecem se reunião cancelada, antiga ou de outro usuário', () => {
  const filtro = arquivo('lib/notificacoes/filtro-notificacoes-reunioes.ts');
  assert.match(filtro, /status: "AGENDADA"/);
  assert.match(filtro, /dataHora: \{ gt: agora/);
  assert.match(filtro, /participantes: \{ some: \{ userId: usuarioId \} \}/);
  assert.match(filtro, /\{ instituicaoId, usuarioId: null \}/);
  assert.match(filtro, /chaveAgrupada: \{ in: chaves \}/);
});

test('admin e portais não revelam avisos individuais de outras pessoas', () => {
  const admin = arquivo('app/api/admin/notificacoes/route.ts');
  const portal = arquivo('app/api/notificacoes/route.ts');
  assert.match(admin, /filtroNotificacoesDoUsuario\(/);
  assert.match(portal, /filtroNotificacoesDoUsuario\(/);
  assert.match(admin, /usuarioId: null, instituicaoId: user\.instituicaoId/);
  assert.match(portal, /usuarioId: null, instituicaoId: user\.instituicaoId/);
});

test('índice único e criação idempotente protegem contra lembretes repetidos', () => {
  const cron = arquivo('app/api/reunioes/lembretes/route.ts');
  const mig = arquivo('prisma/migrations/20261113130000_reunioes_notificacoes_idempotentes/migration.sql');
  assert.match(cron, /candidatasUnicas/);
  assert.match(cron, /skipDuplicates: true/);
  assert.match(mig, /CREATE UNIQUE INDEX/);
});

test('telas indicam cancelamento e exibem histórico', () => {
  const page = arquivo('app/admin/reunioes/page.tsx');
  assert.match(page, /"Cancelar reunião"/);
  assert.match(page, /status: "CANCELADA"/);
  assert.match(page, /cancelamento\.history/);
});
