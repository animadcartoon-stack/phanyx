const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(process.cwd(), 'lib/documentos-docentes/campos-impressao.ts');
const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const api = {};
vm.runInNewContext(js, { exports: api, module: { exports: api } }, { filename: file });
const { camposModeloDocente, marcadorCampoDocente, atualizarLinhasCampoDocente, renderizarCamposDocentes } = api;

test('mantém marcadores existentes e extrai nomes únicos', () => {
  const html = '<p>{{campo:Objetivos}}</p><p>{{campo:Objetivos|linhas:5}}</p><p>{{campo:Turma}}</p>';
  assert.deepEqual(Array.from(camposModeloDocente(html)), ['Objetivos', 'Turma']);
});

test('uma linha é padrão para variáveis antigas', () => {
  const html = renderizarCamposDocentes('<p>{{campo:Objetivos}}</p>', {}, true);
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 1);
});

test('PDF vazio apresenta quantidade configurável, independente da entrada digital', () => {
  const html = '<p>Objetivos: {{campo:Objetivos|linhas:5}}</p><p>Conteúdo:</p>';
  const impresso = renderizarCamposDocentes(html, { Objetivos: 'Texto digitado pelo professor' }, true);
  assert.equal((impresso.match(/aria-hidden="true"/g) || []).length, 5);
  assert.ok(!impresso.includes('Texto digitado'));
  assert.ok(impresso.includes('<p>Conteúdo:</p>'));
});

test('texto preenchido não fica limitado por altura nem por quantidade de linhas', () => {
  const corpo = 'Primeira linha\nSegunda linha <b>não executar</b>\nTerceira linha';
  const html = renderizarCamposDocentes('<p>{{campo:Objetivos|linhas:2}}</p><h2>Conteúdo</h2>', {Objetivos:corpo});
  assert.ok(html.includes('Primeira linha<br />Segunda linha &lt;b&gt;não executar&lt;/b&gt;<br />Terceira linha'));
  assert.ok(html.includes('<h2>Conteúdo</h2>'));
  assert.ok(!html.includes('height:24px'));
});

test('alterar linhas preserva os demais campos e versões não modificadas', () => {
  const original = '<p>{{campo:Objetivos}}</p><p>{{campo:Turma}}</p><p>{{campo:Objetivos|linhas:3}}</p>';
  const atualizado = atualizarLinhasCampoDocente(original, 'Objetivos', 10);
  assert.equal(atualizado.quantidade, 2);
  assert.equal((atualizado.html.match(/linhas:10/g) || []).length, 2);
  assert.ok(atualizado.html.includes('{{campo:Turma}}'));
  assert.equal(original.includes('linhas:10'), false);
});

test('marcador aceita zero, quantidades maiores e rejeita mais de 999 linhas', () => {
  assert.equal(marcadorCampoDocente('Objetivos', 0), '{{campo:Objetivos|linhas:0}}');
  assert.equal(marcadorCampoDocente('Objetivos', 1), '{{campo:Objetivos}}');
  assert.equal(marcadorCampoDocente('Objetivos', 5), '{{campo:Objetivos|linhas:5}}');
  assert.equal(marcadorCampoDocente('Objetivos', 150), '{{campo:Objetivos|linhas:150}}');
  assert.equal(marcadorCampoDocente('Objetivos', 999), '{{campo:Objetivos|linhas:999}}');
  assert.throws(()=>marcadorCampoDocente('Objetivos', 1000));
  assert.throws(()=>marcadorCampoDocente('x|campo', 2));
});


test('zero linhas não desenha traços no PDF branco e permite o texto digital', () => {
  const modelo = '<p>Objetivos: {{campo:Objetivos|linhas:0}}</p>';
  const branco = renderizarCamposDocentes(modelo, {}, true);
  assert.ok(branco.includes('Objetivos: '));
  assert.ok(!branco.includes('aria-hidden="true"'));
  const digital = renderizarCamposDocentes(modelo, { Objetivos: 'Texto sem limite de altura\nSegunda linha' });
  assert.ok(digital.includes('Texto sem limite de altura<br />Segunda linha'));
  assert.ok(!digital.includes('height:24px'));
});

test('150 linhas cabem na configuração e permitem quebra entre páginas', () => {
  const marcador = marcadorCampoDocente('Objetivos', 150);
  const html = renderizarCamposDocentes(marcador, {}, true);
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 150);
  assert.ok(html.includes('break-inside:auto'));
  assert.deepEqual(Array.from(camposModeloDocente(marcador)), ['Objetivos']);
});

test('campos do editor têm cor e text-fill explícitos', () => {
  const componente = fs.readFileSync(path.join(process.cwd(), 'components/documentos-docentes/ConfiguradorLinhasDocente.tsx'), 'utf8');
  assert.ok(componente.includes('input.phanyx-docentes-campo-control'));
  assert.ok(componente.includes('-webkit-text-fill-color: #0f172a !important'));
  assert.ok(componente.includes('inputMode="numeric"'));
});
