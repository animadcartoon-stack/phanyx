const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const raiz = path.resolve(__dirname, '..');
const helper = fs.readFileSync(path.join(raiz,'lib/matriculas/exclusao-combos.ts'),'utf8');
const out = {};
vm.runInNewContext(ts.transpileModule(helper, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText, { exports: out, require });
const pode = out.comboPodeSerExcluido;

test('pacote sem qualquer matrícula ou contrato pode ser excluído', () => {
  assert.equal(pode(0,0), true);
});
test('uma matrícula ativa ou cancelada sempre bloqueia exclusão', () => {
  assert.equal(pode(1,0), false);
  assert.equal(pode(100,0), false);
});
test('contrato associado também impede exclusão', () => {
  assert.equal(pode(0,1), false);
  assert.equal(pode(2,3), false);
});
test('contagens inválidas jamais autorizam exclusão', () => {
  for (const n of [-1, NaN, Infinity, 0.5]) assert.throws(() => pode(n,0));
  assert.throws(() => pode(0,undefined));
});
test('API faz isolamento por instituição em todas as verificações e escritas', () => {
  const api = fs.readFileSync(path.join(raiz, 'app/api/admin/combos/route.ts'),'utf8');
  const fluxo = api.slice(api.indexOf('async function alterarEstadoCombo('));
  assert.match(fluxo, /administradorCombos\(\)/);
  assert.match(fluxo, /tx\.matricula\.count\(\{\s*where:\s*\{\s*instituicaoId: user\.instituicaoId, comboId: id/);
  assert.match(fluxo, /tx\.contrato\.count/);
  assert.match(fluxo, /matricula:\s*\{ is:\s*\{ instituicaoId: user\.instituicaoId, comboId: id/);
  assert.match(fluxo, /tx\.comboModalidades\.deleteMany/);
  assert.match(fluxo, /where: \{ id, instituicaoId: user\.instituicaoId, updatedAt: esperado \}/);
  assert.match(fluxo, /COMBO_EM_USO/);
  assert.match(fluxo, /P2003/);
  assert.match(fluxo, /isolationLevel: "Serializable"/);
});
test('desativação é opcional e não altera finanças nem contratos', () => {
  const api = fs.readFileSync(path.join(raiz,'app/api/admin/combos/route.ts'),'utf8');
  const trecho = api.slice(api.indexOf('async function alterarEstadoCombo('));
  assert.match(trecho, /if \(acao === "DESATIVAR"\)/);
  assert.match(trecho, /data: \{ ativo: false \}/);
  assert.doesNotMatch(trecho, /tx\.contrato\.delete|tx\.matricula\.delete|tx\.lancamentoFinanceiro\.(?:delete|update)/);
});
test('interface possui confirmação PHANYX e bloqueio visível quando vinculado', () => {
  const page = fs.readFileSync(path.join(raiz,'app/admin/combos/page.tsx'),'utf8');
  assert.match(page, /c\.totalMatriculasVinculadas > 0/);
  assert.match(page, /setConfirmacaoCombo\(\{ combo: c, acao: "EXCLUIR" \}\)/);
  assert.match(page, /setConfirmacaoCombo\(\{ combo: c, acao: "DESATIVAR" \}\)/);
  assert.match(page, /PhanyxConfirmModal/);
  assert.doesNotMatch(page, /window\.confirm\(|window\.alert\(|window\.prompt\(/);
});
