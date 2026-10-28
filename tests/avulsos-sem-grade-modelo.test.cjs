'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname,'..');
const schema = fs.readFileSync(path.join(base,'prisma/schema.prisma'),'utf8');
const sql = fs.readFileSync(path.join(base,'prisma/migrations/20261028160000_avulsos_sem_grade/migration.sql'),'utf8');
test('curso sem grade e opt-in, desativado por padrao',()=>{
 assert.match(schema,/matriculaDiretaTurma Boolean @default\(false\)/);
 assert.match(sql,/ADD COLUMN "matriculaDiretaTurma" BOOLEAN NOT NULL DEFAULT false/);
});
test('horarios avulsos independem de TurmaDisciplina e de CursoSemestre',()=>{
 const model=schema.match(/model TurmaHorarioAvulso \{[\s\S]*?\n\}/)?.[0]||'';
 assert.match(model,/turmaId/); assert.match(model,/diaSemana/);
 assert.match(model,/horaInicio/);assert.match(model,/horaFim/);
 assert.doesNotMatch(model,/disciplinaId|cursoSemestreId/);
});
test('vinculo direto tem turma e curso, sem disciplinaId',()=>{
 const model=schema.match(/model MatriculaTurmaAvulsa \{[\s\S]*?\n\}/)?.[0]||'';
 assert.match(model,/matriculaId/); assert.match(model,/turmaId/); assert.match(model,/cursoId/);
 assert.doesNotMatch(model,/disciplinaId/);
 assert.match(model,/@@unique\(\[matriculaId, cursoId\]\)/);
});
test('migração adiciona tabelas e preserva as legadas',()=>{
 assert.match(sql,/CREATE TABLE "TurmaHorarioAvulso"/);
 assert.match(sql,/CREATE TABLE "MatriculaTurmaAvulsa"/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|UPDATE "Curso"|TRUNCATE/);
});
