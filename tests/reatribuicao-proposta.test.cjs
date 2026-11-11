const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const fonte = fs.readFileSync(path.resolve(__dirname, '../lib/matriculas/reatribuicao-proposta.ts'), 'utf8');
const { outputText, diagnostics } = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, reportDiagnostics: true,
});
assert.equal(diagnostics?.length || 0, 0, 'TypeScript: problemas de sintaxe');
const modulo = { exports: {} };
new Function('module', 'exports', outputText)(modulo, modulo.exports);
const { validarEntradaProposta: validar, conferirOrigemProposta: conferir } = modulo.exports;
let testes = 0;
function ok(comando) { comando(); testes++; }
const base = { acao: 'PREVIA', transferenciaId: 7,
  turmaIds: [34, 11], optativaSessaoIds: [98, 92],
  cursoPrincipalId: null, dataInicioCurso: '2027-02-01' };
ok(() => assert.deepEqual(validar(base).turmaIds, [11, 34]));
ok(() => assert.deepEqual(validar(base).optativaSessaoIds, [92, 98]));
ok(() => assert.equal(validar({ ...base, optativaSessaoIds: undefined }).optativaSessaoIds.length, 0));
ok(() => assert.equal(validar({ ...base, acao: 'SALVAR', versao: 'a'.repeat(64) }).versao, 'a'.repeat(64)));
for(const rejeitada of [null, {}, [],
  {...base, acao: 'CONCLUIR'}, {...base, transferenciaId: 0}, {...base, transferenciaId: '7'},
  {...base, turmaIds: []}, {...base, turmaIds: [1,1]}, {...base, turmaIds: ['1']},
  {...base, turmaIds: Array(13).fill(1)}, {...base, optativaSessaoIds: [1,1]},
  {...base, optativaSessaoIds: ['6']}, {...base, optativaSessaoIds: Array(37).fill(1)},
  {...base, cursoPrincipalId: -3}, {...base, cursoPrincipalId: '5'},
  {...base, dataInicioCurso: '2027-02-30'}, {...base, dataInicioCurso: '01/02/2027'},
  {...base, acao: 'SALVAR'}, {...base, acao: 'SALVAR', versao: '123'},
]) ok(() => assert.throws(() => validar(rejeitada)));
const matricula = { alunoId: 8, status: 'ATIVA', canceladaEm: null, updatedAt: new Date('2026-11-09T15:30:00.000Z') };
const transferencia = { tipo: 'REATRIBUICAO_ALUNO', status: 'PENDENTE',
  alunoOrigemId: 8, alunoDestinoId: 12, dataTransferencia: new Date('2027-01-10T12:00:00.000Z'),
  snapshotAnterior: { finalidade: 'SOLICITACAO_SEM_EXECUCAO', alunoId: 8, atualizadoEm: matricula.updatedAt.toISOString() },
};
ok(() => assert.equal(conferir(transferencia, matricula, '2027-02-01'), 12));
for (const [t, m, data] of [
  [{...transferencia, tipo: 'POLO'}, matricula, '2027-02-01'],
  [{...transferencia, status: 'CONCLUIDA'}, matricula, '2027-02-01'],
  [{...transferencia, alunoOrigemId: 3}, matricula, '2027-02-01'],
  [{...transferencia, alunoDestinoId: 8}, matricula, '2027-02-01'],
  [transferencia, {...matricula, status: 'CANCELADA'}, '2027-02-01'],
  [transferencia, {...matricula, updatedAt: new Date('2026-11-10T00:00:00.000Z')}, '2027-02-01'],
  [transferencia, matricula, '2026-12-01'],
  [{...transferencia, snapshotAnterior: null}, matricula, '2027-02-01'],
  [{...transferencia, snapshotAnterior: { ...transferencia.snapshotAnterior, finalidade: 'OUTRO' }}, matricula, '2027-02-01'],
]) ok(() => assert.throws(() => conferir(t, m, data)));
const rota = fs.readFileSync(path.resolve(__dirname, '../app/api/admin/matriculas/[id]/reatribuicao/proposta/route.ts'), 'utf8');
ok(() => assert.ok(rota.includes('prepararContratacaoModalidades')));
ok(() => assert.ok(rota.includes('Prisma.TransactionIsolationLevel.Serializable')));
ok(() => assert.ok(rota.includes('PREVIA_DESATUALIZADA')));
ok(() => assert.ok(rota.includes('snapshotPosterior')));
ok(() => assert.ok(!/tx\.(matricula|aluno|contrato|cobrancaFinanceira|lancamentoFinanceiro)\.(update|delete|create)\s*\(/.test(rota)));
console.log(`[OK] Proposta acadêmica: ${testes} verificações, sem gravação de matrícula ou financeiro.`);
