const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const arquivo = path.resolve(__dirname, '../lib/matriculas/reatribuicao-previa-financeira.ts');
const original = fs.readFileSync(arquivo, 'utf8');
const { outputText, diagnostics } = ts.transpileModule(original, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  reportDiagnostics: true,
});
assert.equal(diagnostics?.length || 0, 0, 'O módulo financeiro deve transpilar sem diagnósticos.');
const modulo = { exports: {} };
new Function('module', 'exports', outputText)(modulo, modulo.exports);
const { montarPreviaFinanceira } = modulo.exports;

const origem = 101;
function lancamento(id, outros = {}) {
  return { id, alunoId: origem, status: 'PENDENTE', valorPago: 0,
    pagoEm: null, pagamentosRegistrados: 0, movimentosCaixaRegistrados: 0,
    ...outros };
}

const lista = [
  lancamento(1),
  lancamento(2, { status: 'PAGO' }),
  lancamento(3, { valorPago: 15 }),
  lancamento(4, { pagamentosRegistrados: 1 }),
  lancamento(5, { movimentosCaixaRegistrados: 1 }),
  lancamento(6, { status: 'PARCIAL' }),
  lancamento(7, { status: 'CANCELADO' }),
  lancamento(8, { alunoId: 202 }),
  lancamento(9, { status: 'ATRASADO' }),
  lancamento(10, { pagoEm: new Date('2026-11-02T12:00:00Z') }),
];
const cobrancas = [
  { id: 81, alunoId: origem, lancamentoFinanceiroId: 1 },
  { id: 82, alunoId: origem, lancamentoFinanceiroId: 1 },
  { id: 83, alunoId: origem, lancamentoFinanceiroId: 9 },
];
const resultado = montarPreviaFinanceira(origem, lista, cobrancas);
const grupo = id => resultado.lancamentos.find(item => item.id === id)?.grupo;

assert.equal(grupo(1), 'PRESERVAR_COBRANCA');
for(const id of [2, 3, 4, 5, 6, 10]) assert.equal(grupo(id), 'PRESERVAR_PAGAMENTO');
assert.equal(grupo(7), 'PRESERVAR_HISTORICO');
assert.equal(grupo(8), 'CONFERIR_VINCULO_ALUNO');
assert.equal(grupo(9), 'PRESERVAR_COBRANCA');
assert.equal(resultado.titulosPreservados, 3);
assert.equal(resultado.totalRevisar, 0);
assert.equal(resultado.totalPreservar, 10);
assert.ok(resultado.lancamentos.every(item => item.alteracaoAutomaticaPermitida === false));

const semMovimento = montarPreviaFinanceira(origem, [lancamento(11)], []);
assert.equal(semMovimento.totalRevisar, 1);
assert.equal(semMovimento.lancamentos[0].grupo, 'REVISAR_SEM_MOVIMENTACAO');
assert.equal(semMovimento.lancamentos[0].alteracaoAutomaticaPermitida, false);

console.log('[OK] Prévia financeira: 12 verificações e proteção contra reatribuição automática.');
