const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync('app/api/turma/[id]/vincular-curso/route.ts', 'utf8');
const ui = fs.readFileSync('app/admin/turmas/page.tsx', 'utf8');
test('somente administrador e mesma instituicao podem criar a oferta', () => {
  assert.match(src, /isAdminLike\(usuario\.role\)/);
  assert.match(src, /where: \{ id: origemId, instituicaoId \}/);
  assert.match(src, /id: destinoId, instituicaoId, ativo: true, excluidoEm: null/);
});
test('oferta vinculada cria nova turma e preserva a turma original', () => {
  assert.match(src, /tx\.turma\.create\(/);
  assert.doesNotMatch(src, /tx\.turma\.update\(/);
  assert.match(ui, /Disponibilizar esta turma em outro curso/);
});
test('valida grade, professores, horarios e etapa', () => {
  assert.match(src, /validarEtapaDoCurso/);
  assert.match(src, /validarDisciplinasDaOferta/);
  assert.match(src, /validarResponsaveisDaOferta/);
  assert.match(src, /horarios: \{/);
});
