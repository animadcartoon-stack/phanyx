'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const ts=require('typescript');const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const transpiled=ts.transpileModule(read('lib/matriculas/previa-turmas-avulsas.ts'),
 {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const modExports={};vm.runInNewContext(transpiled,{exports:modExports,Date,Number,Set,Math});
const {horariosTurmaDiretaSemGrade:horarios,vagasTurmaDiretaSemGrade:vagas}=modExports;
test('horario de turma avulsa usa turma, nao disciplina real',()=>{
 const d=horarios({id:8,nome:'Robótica',dataInicio:null,dataFim:null,horariosAvulsos:[{diaSemana:2,horaInicio:'10:00',horaFim:'11:00'}]});
 assert.equal(d.length,1);assert.equal(d[0].turmaId,8);assert.equal(d[0].disciplinaId,0);
 assert.equal(d[0].horaInicio,'10:00');
});
test('vagas contam alunos distintos nas duas formas de ocupacao',()=>{
 assert.equal(vagas(4,[1,1,2,3]),1);assert.equal(vagas(4,[1,2,3,4]),0);
 assert.equal(vagas(null,[]),null);assert.equal(vagas(0,[]),null);
});
test('ofertas usam somente horario direto quando opt-in ativado',()=>{
 const s=read('lib/matriculas/modalidades-servidor.ts');
 assert.match(s,/horariosTurmaDiretaSemGrade\(turma\)/);
 assert.match(s,/matriculaDiretaTurma/);
 assert.match(s,/horariosAvulsos:/);
 assert.match(s,/vagasTurmaDiretaSemGrade/);
 assert.match(s,/turmaDiretaPendente/);
 assert.ok(s.includes('if (escolhidas.some(o => o.capacidadePendente))'));
});
test('historico de horarios diretos participa da prevencao de conflitos',()=>{
 const s=read('lib/matriculas/modalidades-servidor.ts');
 assert.ok(s.includes("matriculasDiretas = db.matriculaTurmaAvulsa ? await db.matriculaTurmaAvulsa.findMany"));
 assert.match(s,/horarios: \[\.\.\.horarios, \.\.\.horariosDiretos\]/);
 assert.match(s,/existentes\.turmasAvulsas\.some/);
});
test('confirmacao de curso sem grade permanece bloqueada ate gravacao transacional segura',()=>{
 const s=read('lib/matriculas/modalidades-servidor.ts');
 const a=s.indexOf('export async function confirmarContratacaoModalidades');
 const b=s.indexOf('const instituicao = await db.instituicao.update',a);
 const k=s.indexOf('!matriculaSemGradeHabilitada(user.instituicaoId)',a);
 assert.ok(a>=0&&k>a&&b>k);
 assert.ok(s.includes('validarOfertasDiretasParaGravacao(escolhidas)'));
});
test('continua usando os combos oficiais e nao escreve no banco nesta etapa',()=>{
 const s=read('lib/matriculas/modalidades-servidor.ts');
 assert.match(s,/calcularContratacaoModalidades\(/);
 const h=read('lib/matriculas/previa-turmas-avulsas.ts');
 assert.doesNotMatch(h,/prisma|\.create\(|\.update\(|\.delete\(/);
});
