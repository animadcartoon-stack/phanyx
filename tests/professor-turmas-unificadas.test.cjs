"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const helper = "lib/professor/turmas-unificadas.ts";
const page = "app/professor/turmas/page.tsx";
const api = "app/api/professor/turmas/avulsas/route.ts";
function combine() {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(read(helper), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText, { exports, Set });
  return exports.combinarTurmasProfessor;
}
function avulsa(id, options={}) {
  return { id, nome: `Turma ${id}`, turno: "Vespertino", periodoLetivo:"2027",
    statusTurma:"A_INICIAR", curso:{id:88,nome:"PEVI"}, alunos:0,
    semDisciplinas:true, horarios:[{diaSemana:2,horaInicio:"14:00",horaFim:"17:40"}], ...options };
}
test("turma PEVI 2027 sem grade aparece uma única vez, com data e chamada próprias", () => {
  const result = combine()([], [avulsa(41), avulsa(41)]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 41);
  assert.equal(result[0].semDisciplinas, true);
  assert.equal(result[0].statusTurma, "A_INICIAR");
  assert.equal(result[0].horarios.length, 1);
});
test("não duplica turma tradicional e não classifica como sem disciplina um curso com grade", () => {
  const grade = [{id:41,nome:"Grade",semestre:"1",alunos:3,disciplina:{id:7,nome:"Matemática"}}];
  const out = combine()(grade, [avulsa(41),avulsa(42,{semDisciplinas:false})]);
  assert.equal(out.length,1);
  assert.equal(out[0].disciplina.id,7);
});
test("o mapeamento não edita os objetos de origem", () => {
  const source=avulsa(36); const out=combine()([], [source]);
  assert.equal(source.horarios[0].ativo, undefined);
  assert.equal(out[0].horarios[0].ativo,true);
});
test("interface usa as duas APIs, encaminha à chamada avulsa e não conta turma avulsa como disciplina", () => {
  const source=read(page);
  assert.match(source,/combinarTurmasProfessor/);
  assert.match(source,/api\/professor\/turmas\/avulsas/);
  assert.match(source,/disciplina\.semDisciplinas/);
  assert.match(source,/professor\/turmas\/\$\{disciplina\.id\}\/chamadas-avulsas/);
  assert.match(source,/filter\(item => !item\.semDisciplinas\)/);
  assert.match(read(api),/semDisciplinas:/);
});
test("arquivos TS/TSX transpilem sem diagnóstico de sintaxe", () => {
  for (const file of [helper,page,api]) {
    const result=ts.transpileModule(read(file), {fileName:file,reportDiagnostics:true,
      compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});
    assert.equal((result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,file);
  }
});
