const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const fonte = fs.readFileSync(path.join(__dirname, '../lib/academico/liberacao-avulsos.ts'), 'utf8');
const js = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function carregar(lista, ativacao = 'true', matricula = 'true') {
  const exports = {};
  vm.runInNewContext(js, { exports, process: { env: {
    PHANYX_AVULSOS_INSTITUICOES_HABILITADAS: lista,
    PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA: ativacao,
    PHANYX_MATRICULA_SEM_GRADE_HABILITADA: matricula,
  } } });
  return exports;
}
test('flags sem lista explícita nunca liberam uma instituição', () => {
  for (const lista of [undefined, '', ' ', '*', '26,', '26,abc', '0,26', '26,1e2', '26,9007199254740992']) {
    assert.equal(carregar(lista).ativacaoTurmasAvulsasHabilitada(26), false);
    assert.equal(carregar(lista).matriculaSemGradeHabilitada(26), false);
  }
});
test('piloto não libera outra instituição nem ids inválidos', () => {
  const lib = carregar(' 26, 35 ');
  for (const id of [26, 35]) {
    assert.equal(lib.ativacaoTurmasAvulsasHabilitada(id), true);
    assert.equal(lib.matriculaSemGradeHabilitada(id), true);
  }
  for (const id of [1, 2, 260, 0, -1, 26.1, '26', null]) {
    assert.equal(lib.ativacaoTurmasAvulsasHabilitada(id), false);
    assert.equal(lib.matriculaSemGradeHabilitada(id), false);
  }
});
test('preparação/ativação e confirmação têm liberações independentes', () => {
  assert.equal(carregar('26', 'true', 'false').ativacaoTurmasAvulsasHabilitada(26), true);
  assert.equal(carregar('26', 'true', 'false').matriculaSemGradeHabilitada(26), false);
  for (const flag of ['false', 'TRUE', '1', '']) {
    assert.equal(carregar('26', flag).ativacaoTurmasAvulsasHabilitada(26), false);
    assert.equal(carregar('26', 'true', flag).matriculaSemGradeHabilitada(26), false);
  }
});
