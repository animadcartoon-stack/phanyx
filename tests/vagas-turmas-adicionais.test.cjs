'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../components/admin/SeletorAdicionaisMatricula.tsx'), 'utf8');
test('mostra numero de vagas e sinaliza capacidade ainda nao configurada', () => {
  assert.match(source, /descricaoVagasTurmaAdicional\(vagas: number \| null\)/);
  assert.match(source, /"1 vaga disponível"/);
  assert.match(source, /" vagas disponíveis"/);
  assert.match(source, /"limite de vagas não informado"/);
});
test('nao permite selecionar turma sem vaga ou com horarios incompletos', () => {
  assert.match(source, /disabled=\{o\.horariosPendentes \|\| o\.vagas === 0 \|\| o\.capacidadePendente\}/);
  assert.match(source, /Escolha uma turma com vaga e horário compatível/);
  assert.match(source, /revisar a capacidade antes de ativar ofertas compartilhadas/);
});
