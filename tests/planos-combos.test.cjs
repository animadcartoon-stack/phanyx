const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const src = fs.readFileSync(path.resolve(__dirname, '../lib/matriculas/planos-pagamento.ts'), 'utf8');
const exportsMod = {};
vm.runInNewContext(ts.transpileModule(src, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText, { exports: exportsMod, require });
const { normalizarPlanosPagamento, cotarPlanoPagamento } = exportsMod;
const base = (id, quantidadeParcelas, valorParcela, valorAntecipacao = '0.00') => ({
  id, nome: `Pacote ${quantidadeParcelas}x`, quantidadeParcelas, valorParcela,
  ajustes: [], valorAntecipacao, ativo: true, precoIncluiPontualidade: false,
});
const n = (...planos) => normalizarPlanosPagamento({ versao: 1, planos });

test('sem planos adicionais, mantem combo tradicional', () => {
  assert.equal(normalizarPlanosPagamento(null), null);
  assert.equal(n(), null);
});
test('combo com duas formas opcionais preserva precos independentes', () => {
  const c = n(base('p_12', 12, '100.00', '98.50'), base('p_4', 4, '300.00'));
  assert.equal(c.planos.length, 2);
  assert.equal(cotarPlanoPagamento(c.planos[0]).totalCentavos, 120000);
  assert.equal(cotarPlanoPagamento(c.planos[1]).totalCentavos, 120000);
});
test('entrada de combo abate a primeira parcela e nao soma ao total', () => {
  const c = cotarPlanoPagamento(n(base('a', 12, '100.00', '98.50')).planos[0]);
  assert.equal(c.antecipacaoCentavos, 9850);
  assert.equal(c.restantePrimeiraParcelaCentavos, 150);
  assert.equal(c.totalCentavos, 120000);
});
test('identificadores duplicados de planos em combo sao bloqueados', () => {
  assert.throws(() => n(base('a', 4, '100.00'), base('a', 10, '50.00')));
});
test('mais que 40 planos por combo e bloqueado', () => {
  assert.throws(() => n(...Array.from({ length: 41 }, (_, i) => base(`p_${i}`, 2, '20.00'))));
});
test('somente cadastro: integracao financeira de modalidades continua protegida', () => {
  const raiz = path.resolve(__dirname, '..');
  const rota = fs.readFileSync(path.join(raiz, 'app/api/admin/matriculas/modalidades/route.ts'), 'utf8');
  assert.match(rota, /PLANO_PAGAMENTO_COMBO_NAO_HOMOLOGADO/);
  const schema = fs.readFileSync(path.join(raiz, 'prisma/schema.prisma'), 'utf8');
  assert.match(schema, /model ComboModalidades \{[\s\S]*?planosPagamento\s+Json\?/);
});
