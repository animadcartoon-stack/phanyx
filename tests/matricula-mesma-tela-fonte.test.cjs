const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const src = fs.readFileSync("app/admin/matriculas/page.tsx", "utf8");
const panel = fs.readFileSync("components/admin/SeletorAdicionaisMatricula.tsx", "utf8");
const backend = fs.readFileSync("lib/matriculas/modalidades-servidor.ts", "utf8");
const endpoint = fs.readFileSync("app/api/admin/matriculas/modalidades/route.ts", "utf8");
test("curso principal preserva formulário tradicional", () => {
  assert.doesNotMatch(src, /MatriculaModalidadesForm/);
  assert.match(src, /Turma do aluno/);
  assert.match(src, /Valor da mensalidade/);
  assert.match(src, /SeletorAdicionaisMatricula/);
});
test("curso sozinho continua usando a API tradicional e adicionais usam a confirmação segura", () => {
  assert.match(src, /if \(cursosAdicionaisEscolhidos\.length > 0\)/);
  assert.match(src, /await criarMatriculaComAdicionais\(\)/);
  assert.match(src, /fetch\("\/api\/matricula"/);
  assert.match(src, /acao: "CONFIRMAR"/);
  assert.match(src, /versao: previaCombo\.versao/);
  assert.match(src, /CONFIRMACAO_MENOR_NECESSARIA/);
});
test("mostra turmas por curso e exige prévia validada pelo servidor", () => {
  assert.match(panel, /Vincular outro curso nesta matrícula/);
  assert.match(panel, /acao: "PREVIA"/);
  assert.match(panel, /Selecione a turma/);
  assert.match(panel, /horariosPendentes/);
  assert.match(panel, /onPreviaChange\(null\)/);
});
test("bolsa aplica-se após a regra de combo sem cobrar mensalidades isentas", () => {
  assert.match(backend, /const mensalidadeLiquida = Math\.round\(mensalidade/);
  assert.match(backend, /bolsaPercentual,/);
  assert.match(backend, /if \(mensalidadeLiquida > 0\)/);
  assert.match(backend, /valorFinal: mensalidadeLiquida \/ 100/);
  assert.match(endpoint, /bolsaPercentual: body\.bolsaPercentual/);
});
test("exige correspondência entre disciplinas selecionadas e oferta gravada", () => {
  assert.match(src, /marcadas\.length !== daTurma\.length/);
  assert.match(src, /Nenhuma matrícula foi gravada/);
});
