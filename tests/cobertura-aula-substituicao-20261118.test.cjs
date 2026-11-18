const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = p => fs.readFileSync(path.join(root,p),'utf8');
const schema = src('prisma/schema.prisma');
const migration = src('prisma/migrations/20261118150000_plano_cobertura_docente/migration.sql');
const teacherApi = src('app/api/professor/planos-cobertura/route.ts');
const adminApi = src('app/api/admin/planos-cobertura/route.ts');
const substituteApi = src('app/api/professor/substituicoes/route.ts');
const teacherPage = src('app/professor/substituicoes/page.tsx');
const adminPage = src('app/admin/substituicoes-docentes/page.tsx');
const teacherUi = src('components/substituicoes/PrepararCoberturaDocente.tsx');
const adminUi = src('components/substituicoes/PlanosCoberturaDocenteAdmin.tsx');

test('registro de cobertura separado da avaliação individual dos alunos', () => {
  assert.match(schema,/model PlanoCoberturaDocente \{/);
  assert.match(migration,/CREATE TABLE "PlanoCoberturaDocente"/);
  assert.match(schema,/substituicaoDocenteId\s+Int\?\s+@unique/);
});
test('turma, disciplina, data e professor titular estão vinculados ao plano', () => {
  for(const s of ['professorTitularId','turmaId','disciplinaId','dataAula','status','orientacoes','materiais']) {
    assert.ok(schema.includes(s),s);
  }
});
test('professor só pode criar plano para o próprio vínculo e instituição', () => {
  assert.match(teacherApi,/user\.role !== "PROFESSOR"/);
  assert.match(teacherApi,/user\.impersonacao/);
  assert.match(teacherApi,/professorTitularId: ctx\.professorId/);
  assert.match(teacherApi,/turmaDisciplina\.findFirst/);
});
test('professor pode corrigir plano devolvido sem alterar aprovação', () => {
  assert.match(teacherApi,/export async function PATCH/);
  assert.match(teacherApi,/status: "DEVOLVIDO", substituicaoDocenteId: null/);
  assert.match(teacherApi,/status: "ENVIADO"/);
});
test('a coordenação aprova e designa substituto em transação', () => {
  assert.match(adminApi,/operadorAutorizado/);
  assert.match(adminApi,/!user\.impersonacao/);
  assert.match(adminApi,/\$transaction/);
  assert.match(adminApi,/substituicaoDocente\.create/);
  assert.match(adminApi,/TransactionIsolationLevel\.Serializable/);
});
test('não permite professor substituir a si mesmo nem criar sobreposição', () => {
  assert.match(adminApi,/plano\.professorTitularId === substitutoId/);
  assert.match(adminApi,/substituicaoDocente\.findFirst/);
  assert.match(adminApi,/status: \{ in: \["AGENDADA", "ATIVA", "SUSPENSA"\] \}/);
});
test('cobertura no dia corrente inicia ativa e permite vincular a aula ao substituto', () => {
  assert.match(adminApi,/const statusInicial = diaCobertura <= hoje \? "ATIVA" : "AGENDADA"/);
  assert.match(adminApi,/status: statusInicial, criadoPorId: user.id/);
});
test('substituto recebe apenas plano aprovado associado à substituição', () => {
  assert.match(substituteApi,/planosCoberturaDocente: \{/);
  assert.match(substituteApi,/where: \{ status: "APROVADO" \}/);
  assert.match(substituteApi,/planosCobertura: item\.planosCoberturaDocente/);
});
test('as duas interfaces existentes continuam acessíveis', () => {
  assert.match(teacherPage,/PrepararCoberturaDocente/);
  assert.match(adminPage,/PlanosCoberturaDocenteAdmin/);
});
test('sem popups do navegador e com os cinco idiomas', () => {
  assert.doesNotMatch(teacherUi+adminUi,/window\.(alert|prompt|confirm)\(/);
  for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']) {
    assert.ok(teacherUi.includes(`"${locale}"`));
    assert.ok(adminUi.includes(`"${locale}"`));
  }
});
test('materiais restringidos a URLs de HTTP ou HTTPS', () => {
  assert.match(teacherApi,/\["https:", "http:"\]/);
  assert.match(teacherUi+adminUi,/noopener noreferrer/);
});
