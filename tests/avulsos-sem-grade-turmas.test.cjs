'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const validacao=read('lib/academico/validar-turma-avulsa.ts');
const code=ts.transpileModule(validacao,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const modExports={};vm.runInNewContext(code,{exports:modExports,Error,Number,Array,RegExp,String,Set});
const {validarHorariosTurmaAvulsa: validar, validarCapacidadeTurmaAvulsa: capacidade}=modExports;
test('horarios diretos sao aceitos sem disciplinaId',()=>{
 const h=validar([{diaSemana:2,horaInicio:'09:00',horaFim:'10:00'},{diaSemana:1,horaInicio:'15:00',horaFim:'17:00'}]);
 assert.deepEqual(JSON.parse(JSON.stringify(h)),[{diaSemana:1,horaInicio:'15:00',horaFim:'17:00'},{diaSemana:2,horaInicio:'09:00',horaFim:'10:00'}]);
 assert.equal(capacidade(12),12);
});
test('horarios invalidos e sobrepostos sao recusados',()=>{
 for(const valor of [[],[{diaSemana:1,horaInicio:'10:00',horaFim:'10:00'}],
  [{diaSemana:8,horaInicio:'09:00',horaFim:'10:00'}],
  [{diaSemana:1,horaInicio:'09:00',horaFim:'10:00'},{diaSemana:1,horaInicio:'09:30',horaFim:'11:00'}]])
   assert.throws(()=>validar(valor));
 for(const c of [0,-1,'',null,1.5,6000])assert.throws(()=>capacidade(c));
});
test('API permite apenas admin da mesma instituicao, cria inativa e sem disciplinas',()=>{
 const s=read('app/api/admin/turmas/avulsas/route.ts');
 assert.match(s,/getUserFromToken/);assert.match(s,/isAdminLike/);
 assert.match(s,/matriculaDiretaTurma: true/);assert.match(s,/instituicaoId: user.instituicaoId/);
 assert.match(s,/ativa: false, statusTurma: "A_INICIAR"/);
 assert.match(s,/horariosAvulsos: \{ create:/);
 assert.doesNotMatch(s,/turmaDisciplina\.create|itemMatricula\.create|matricula\.create|lancamentoFinanceiro\.create/);
});
test('edicao nao altera turma ativa nem com matriculas existentes',()=>{
 const s=read('app/api/admin/turmas/avulsas/route.ts');
 assert.match(s,/if \(atual\.ativa\)/);assert.match(s,/tx\.itemMatricula\.count/);
 assert.match(s,/tx\.matriculaTurmaAvulsa\.count/);
 assert.match(s,/tx\.turmaHorarioAvulso\.deleteMany/);
});
test('cadastro avulso e independente da grade tradicional',()=>{
 const p=read('app/admin/turmas/page.tsx');
 const panel=read('lib/academico/painel-turmas.ts');
 assert.match(p,/<TurmasAvulsasSemGrade\s*\/>/);
 assert.match(p,/cursos\.filter\(curso => !curso\.matriculaDiretaTurma\)/);
 assert.match(panel,/matriculaDiretaTurma: true/);
 const c=read('components/admin/TurmasAvulsasSemGrade.tsx');
 assert.match(c,/"\/api\/admin\/turmas\/avulsas"/);
 assert.match(c,/Criar turma inativa/);
 assert.doesNotMatch(c,/\b(alert|confirm|prompt)\s*\(/);
});
test('etapa anterior de Prisma continua exclusivamente aditiva',()=>{
 const schema=read('prisma/schema.prisma');
 const migration=read('prisma/migrations/20261028160000_avulsos_sem_grade/migration.sql');
 assert.match(schema,/model TurmaHorarioAvulso/);
 assert.match(schema,/model MatriculaTurmaAvulsa/);
 assert.doesNotMatch(migration,/DROP TABLE|DELETE FROM|TRUNCATE/);
});
