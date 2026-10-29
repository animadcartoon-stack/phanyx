"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const validationSource = read("lib/academico/validar-turma-avulsa.ts");
const readinessSource = read("lib/academico/validar-prontidao-ativacao-turma-avulsa.ts");
const tsToJs = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const validacao = { exports: {} };
vm.runInNewContext(tsToJs(validationSource), { module: validacao, exports: validacao.exports, require, Error, Number, Array, Set, RegExp, String });
const prontidao = { exports: {} };
vm.runInNewContext(tsToJs(readinessSource), { module: prontidao, exports: prontidao.exports, require: name => {
  if (name === "@/lib/academico/validar-turma-avulsa") return validacao.exports;
  throw Error("Import imprevisto: " + name);
}, Error, Number, Array, Set, RegExp, String });
const validar = prontidao.exports.validarProntidaoAtivacaoTurmaAvulsa;
const pronto = () => ({ curso: {
  organizacaoCurricular: "ANUAL", regrasPrecoDisciplinas: null, regrasSelecaoDisciplinas: null,
  valorMensalidade: "139.00", valorMatricula: "0", quantidadeParcelas: 12,
}, professorId: 7, capacidadeMaxima: 12, periodoLetivo: "2027", turno: "MATUTINO",
  horarios: [{ diaSemana: 2, horaInicio: "08:00", horaFim: "10:00" }] });
test("prontidao exige professor, vagas, ano e horarios validos", () => {
  assert.equal(validar(pronto()).length, 1);
  for (const [campo, valor] of [["professorId", null], ["capacidadeMaxima", 0], ["periodoLetivo", "202X"], ["turno", ""], ["horarios", []]]) {
    const dados = pronto(); dados[campo] = valor;
    assert.throws(() => validar(dados), campo);
  }
});
test("curso com disciplinas, preco ausente ou parcelas invalidas nao e ativado", () => {
  for (const [campo, valor] of [["organizacaoCurricular", "LIVRE"], ["regrasPrecoDisciplinas", {}], ["regrasSelecaoDisciplinas", {}], ["valorMensalidade", null], ["valorMensalidade", -1], ["quantidadeParcelas", 0]]) {
    const dados = pronto(); dados.curso[campo] = valor;
    assert.throws(() => validar(dados), campo);
  }
});
test("horarios sobrepostos e capacidade acima do limite nao passam", () => {
  const dados = pronto(); dados.horarios.push({diaSemana:2,horaInicio:"09:00",horaFim:"11:00"});
  assert.throws(() => validar(dados));
  const lotada = pronto(); lotada.capacidadeMaxima=5001;
  assert.throws(() => validar(lotada));
});
test("ativacao verifica permissao, tenant, flag e trava transacional antes de gravar", () => {
  const api = read("app/api/admin/turmas/avulsas/route.ts");
  assert.match(api, /getUserFromToken/);
  assert.match(api, /isAdminLike/);
  assert.match(api, /ativacaoTurmasAvulsasHabilitada/);
  const bloco = api.split("async function ativarTurmaAvulsa")[1].split("export async function PATCH")[0];
  assert.match(bloco, /FOR UPDATE/); assert.match(bloco, /FOR SHARE/);
  assert.match(bloco, /instituicaoId/);
  assert.match(bloco, /matriculaDiretaTurma: true/);
  assert.match(bloco, /tx\.cursoSemestre\.count/);
  assert.match(bloco, /tx\.turmaDisciplina\.count/);
  assert.match(bloco, /tx\.itemMatricula\.count/);
  assert.match(bloco, /tx\.matriculaTurmaAvulsa\.count/);
  assert.match(bloco, /await referenciasValidas/);
  assert.match(bloco, /tx\.turma\.updateMany/);
  assert.match(api, /if \(!ativacaoHabilitada\(user\.instituicaoId\)\)/);
});
test("UI so libera ativacao com flag e usa dialogo PHANYX", () => {
  const ui = read("components/admin/TurmasAvulsasSemGrade.tsx");
  assert.match(ui, /ativacaoHabilitada: boolean/);
  assert.match(ui, /disabled=\{!dados\?\.ativacaoHabilitada/);
  assert.match(ui, /PhanyxConfirmModal/);
  assert.match(ui, /acao: "ATIVAR_TURMA"/);
  assert.doesNotMatch(ui, /window\.(alert|confirm|prompt)\s*\(/);
});
