const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const original = fs.readFileSync(path.resolve(__dirname, '../lib/matriculas/reatribuicao-solicitacao.ts'), 'utf8');
const { outputText, diagnostics } = ts.transpileModule(original, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  reportDiagnostics: true,
});
assert.equal(diagnostics?.length || 0, 0);
const modulo = { exports: {} };
new Function('module', 'exports', outputText)(modulo, modulo.exports);
const { validarPropostaReatribuicao, STATUS_PENDENTES_REATRIBUICAO } = modulo.exports;
const proposta = { alunoDestinoId: 202, motivo: 'Transferência autorizada pela secretaria',
  dataTransferencia: '2026-11-10', observacoes: 'Conferir contratos' };
const valido = validarPropostaReatribuicao(proposta);
assert.equal(valido.alunoDestinoId, 202);
assert.equal(valido.motivo, proposta.motivo);
assert.equal(valido.observacoes, 'Conferir contratos');
assert.equal(valido.dataTransferencia.toISOString(), '2026-11-10T12:00:00.000Z');
assert.equal(validarPropostaReatribuicao({ ...proposta, observacoes: null }).observacoes, null);
assert.equal(validarPropostaReatribuicao({ ...proposta, observacoes: '  ' }).observacoes, null);
for(const entrada of [null, [], {}, { ...proposta, alunoDestinoId: 0 }, { ...proposta, alunoDestinoId: 1.3 },
  { ...proposta, alunoDestinoId: '202' }, { ...proposta, motivo: 'pouco' },
  { ...proposta, motivo: 'x'.repeat(1001) }, { ...proposta, dataTransferencia: '2026-02-30' },
  { ...proposta, dataTransferencia: '10/11/2026' },
  { ...proposta, observacoes: 'x'.repeat(2001) },
  { ...proposta, observacoes: 4 },
]) assert.throws(() => validarPropostaReatribuicao(entrada));
assert.ok(STATUS_PENDENTES_REATRIBUICAO.includes('PENDENTE'));
assert.ok(!STATUS_PENDENTES_REATRIBUICAO.includes('CONCLUIDA'));
console.log('[OK] Solicitação de reatribuição: validações de entrada e datas aprovadas.');
