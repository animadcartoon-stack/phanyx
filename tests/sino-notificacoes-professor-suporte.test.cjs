const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ler = (p) => fs.readFileSync(p, 'utf8');

test('sino do professor renderiza no layout fora da sidebar (incluindo mobile)', () => {
  const layout = ler('app/professor/layout.tsx');
  const sidebar = ler('components/layout/ProfessorSidebar.tsx');
  assert.match(layout, /<PhanyxNotificationBell\s+mostrarLinkTodas=\{false\}\s+modoSuporte=/);
  assert.doesNotMatch(sidebar, /<PhanyxNotificationBell/);
});

test('modo suporte reposiciona o sino abaixo do banner sem alterar o modo normal', () => {
  const layout = ler('app/professor/layout.tsx');
  const sino = ler('components/notificacoes/PhanyxNotificationBell.tsx');
  assert.match(layout, /decoded as typeof decoded & \{ impersonacao\?: boolean \}/);
  assert.match(sino, /modoSuporte \? \"top-48 md:top-32\" : \"top-6\"/);
});
