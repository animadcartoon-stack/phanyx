const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);

const { idsOptativas, selecionarOptativas, distribuirRegencia } = require("../lib/matriculas/optativas-avulsas.ts");
const horario = (horaInicio, horaFim, diaSemana = 2) => ({ diaSemana, horaInicio, horaFim });
const turno = horario("13:30", "17:30");
const turma = { id: 100, horarios: [turno] };
const jiuJitsu = { id: 1, cursoId: 8, disciplinaId: 10, nome: "Jiu-Jitsu", vagas: 1, turmaIds: [100, 101], ...horario("14:00", "15:00") };
const tenis = { id: 2, cursoId: 8, disciplinaId: 11, nome: "Tênis de Mesa", vagas: 1, turmaIds: [100], ...horario("15:00", "16:00") };
const motivo = codigo => erro => erro.codigo === codigo;

test("matrícula sem optativas e com atividades dentro do próprio turno", () => {
  assert.deepEqual(idsOptativas(undefined), []);
  assert.deepEqual(selecionarOptativas([], [], []), []);
  assert.deepEqual(selecionarOptativas([1, 2], [jiuJitsu, tenis], [turma]).map(s => s.turmaId), [100, 100]);
  assert.deepEqual(idsOptativas([2, 1]), [1, 2]);
  assert.throws(() => idsOptativas([1, 1]), motivo("SELECAO_DUPLICADA"));
});

test("recusa sessão esgotada, de outra turma ou fora dos horários da turma", () => {
  assert.throws(() => selecionarOptativas([1], [{ ...jiuJitsu, vagas: 0 }], [turma]), motivo("OPTATIVA_SEM_VAGAS"));
  assert.throws(() => selecionarOptativas([1], [{ ...jiuJitsu, turmaIds: [101] }], [turma]), motivo("OPTATIVA_INDISPONIVEL"));
  assert.throws(() => selecionarOptativas([1], [{ ...jiuJitsu, horaFim: "18:00" }], [turma]), motivo("OPTATIVA_INDISPONIVEL"));
});

test("recusa duas optativas simultâneas ou duas sessões da mesma disciplina no mesmo dia", () => {
  assert.throws(() => selecionarOptativas([1, 2], [jiuJitsu, { ...tenis, horaInicio: "14:30" }], [turma]), motivo("OPTATIVAS_EM_CONFLITO"));
  assert.throws(() => selecionarOptativas([1, 2], [jiuJitsu, { ...tenis, disciplinaId: 10 }], [turma]), motivo("OPTATIVAS_EM_CONFLITO"));
});

test("regente fica com cada criança nas faixas em que ela não tem optativa", () => {
  const alunos = [{ id: 1, optativas: [jiuJitsu] }, { id: 2, optativas: [tenis] }, { id: 3, optativas: [] }];
  const faixas = distribuirRegencia(turno, alunos).map(f => [f.inicio, f.fim, f.alunos.map(a => a.id)]);
  assert.deepEqual(faixas, [
    ["13:30", "14:00", [1, 2, 3]], ["14:00", "15:00", [2, 3]],
    ["15:00", "16:00", [1, 3]], ["16:00", "17:30", [1, 2, 3]],
  ]);
});
