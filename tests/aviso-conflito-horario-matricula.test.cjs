'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const painel = fs.readFileSync(path.join(root, 'components/admin/SeletorAdicionaisMatricula.tsx'), 'utf8');
const api = fs.readFileSync(path.join(root, 'lib/matriculas/modalidades-servidor.ts'), 'utf8');
const codigo = ts.transpileModule(fs.readFileSync(path.join(root,'lib/matriculas/resumo-conflito-horario.ts'),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const modulo = {};
vm.runInNewContext(codigo, { exports: modulo });
test('conflito informa o dia, as duas turmas e respectivos horarios', () => {
  const mensagem = modulo.mensagemConflitoHorario({ conflitos: [{ primeiro: { turmaNome: 'Balé A', disciplinaNome: 'Dança', diaSemana: 1, horaInicio: '09:00', horaFim: '10:00' }, segundo: { turmaNome: 'Robótica B', disciplinaNome: 'Robótica', diaSemana: 1, horaInicio: '09:30', horaFim: '10:30' } }] });
  for(const termo of ['segunda-feira','Balé A','Robótica B','09:00','09:30','bloqueada']) assert.ok(mensagem.includes(termo), termo);
});
test('detalhes ausentes nao quebram mensagem', () => {
  assert.match(modulo.mensagemConflitoHorario(null),/Escolha outra turma/);
  assert.match(modulo.mensagemConflitoHorario({conflitos: [{}]}),/Escolha outra turma/);
});
test('a prévia do servidor bloqueia conflitos e informa os dados', () => {
  assert.match(api,/encontrarConflitos\(horarios, existentes\.horarios\)/);
  assert.match(api,/ErroModalidades\("CONFLITO_HORARIO", 409/);
});
test('o seletor usa o mesmo aviso de conflito das matrículas individuais', () => {
  assert.match(painel, /avisarSeConflito\(falha\)/);
  assert.match(painel, /<AvisoConflitoHorarioMatricula/);
  assert.match(painel, /prepararSomConflito\(\)/);
  assert.match(painel, /A matrícula conjunta não será gravada/);
});
test('exige turma por curso adicional e sinaliza oferta principal inativa', () => {
  assert.match(painel,/ofertasDoCurso\(c\.id\)/);
  assert.match(painel,/Turma de \{c\.nome\}/);
  assert.match(painel,/turma escolhida para o curso principal está inativa/);
});

test('mensagem de conflito traduz dia e instruções nos cinco idiomas', () => {
  const detalhes = { conflitos: [{ primeiro: { turmaNome: 'PEVI A', disciplinaNome: 'Jiu-jitsu', diaSemana: 2, horaInicio: '10:00', horaFim: '11:40' }, segundo: { turmaNome: 'Avulso B', disciplinaNome: 'Robótica', diaSemana: 2, horaInicio: '10:30', horaFim: '12:00' } }] };
  for (const [locale, dia, instrucao] of [['pt-BR','terça-feira','Escolha'], ['pt-PT','terça-feira','Escolha'], ['en-US','Tuesday','Choose'], ['es-ES','martes','Elija'], ['fr-FR','mardi','Choisissez']]) {
    const mensagem = modulo.mensagemConflitoHorario(detalhes, locale);
    for (const termo of [dia,instrucao === 'Escolha' ? 'bloqueada' : locale === 'en-US' ? 'blocked' : locale === 'es-ES' ? 'bloqueada' : 'bloquée','PEVI A','Avulso B','10:00','10:30']) assert.ok(mensagem.includes(termo), locale + ': ' + termo);
    assert.ok(modulo.mensagemConflitoHorario({}, locale).includes(instrucao));
  }
});
