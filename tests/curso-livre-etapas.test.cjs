'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, console: { error() {} }, require(name) {
    if (name in imports) return imports[name];
    throw new Error('Dependência inesperada: ' + name);
  } });
  return exports;
}
const grade = load('lib/academico/grade-oferta.ts');
const livre = load('lib/matriculas/cursos-livres.ts');
function api(options = {}) {
  const writes = [], reads = [];
  const curso = { id: 32, organizacaoCurricular: 'LIVRE', quantidadeSemestres: null,
    quantidadeEtapas: null, publicacaoRedeDestino: null, ...options.course };
  const tx = {
    curso: { findFirst: async args => {
      reads.push(['curso', args]);
      return options.missing ? null : curso;
    } },
    cursoSemestre: {
      findFirst: async args => { reads.push(['etapa', args]);return options.duplicate ? { id: 2 } : null; },
      create: async ({ data }) => { writes.push(data);return { id: 100, ...data }; },
    },
  };
  const prisma = { ...tx, $transaction: async (callback, config) => {
    assert.equal(config.isolationLevel, 'Serializable');
    return callback(tx);
  } };
  const route = load('app/api/admin/curso-semestres/route.ts', {
    'next/server': { NextResponse: { json: (body, config) => ({ status: config?.status ?? 200, body }) } },
    '@/lib/prisma': { prisma },
    '@/lib/server-auth': {
      getUserFromToken: async () => options.user === undefined ? { id: 1, instituicaoId: 7, role: 'ADMIN' } : options.user,
      isAdminLike: role => ['ADMIN', 'GERENCIA', 'SUPER_ADMIN'].includes(role),
    },
    '@/lib/publicacao-cursos-rede': { sincronizarPublicacoesAtivasDoCurso: async args => {
      assert.equal(args.cursoOrigemId, 32);assert.equal(args.instituicaoOrigemId, 7);return [];
    } },
  });
  return { writes, reads, create: body => route.POST({ json: async () => ({ cursoId: 32, numero: 1, titulo: 'Disciplinas de reforço', ...body }) }) };
}
test('curso livre cria etapa opcional tipada sem escrever valores financeiros', async () => {
  const app = api(); const res = await app.create();
  assert.equal(res.status, 201);assert.equal(res.body.organizacaoCurricular, 'LIVRE');
  assert.equal(app.writes.length, 1);assert.equal(app.writes[0].instituicaoId, 7);
  assert.equal(app.writes[0].cursoId, 32);assert.equal(app.writes[0].numero, 1);
  for (const key of ['valorMatricula', 'valorSemanal', 'valorMensalidade', 'quantidadeParcelas']) assert.ok(!(key in app.writes[0]));
  assert.equal(res.body.disciplinas.length, 0);
});
test('etapas opcionais livres não recebem limite semestral residual', async () => {
  const app = api({ course: { quantidadeSemestres: 1, quantidadeEtapas: 1 } });
  assert.equal((await app.create({ numero: 3 })).status, 201);
});
test('curso semestral e anual preservam limite curricular', async () => {
  for (const organizacaoCurricular of ['SEMESTRAL', 'ANUAL']) {
    const app = api({ course: { organizacaoCurricular, quantidadeSemestres: 2, quantidadeEtapas: 2 } });
    assert.equal((await app.create({ numero: 3 })).status, 400);assert.equal(app.writes.length, 0);
    assert.equal((await app.create({ numero: 2 })).status, 201);
  }
});
test('etapa livre continua exigindo número positivo e não duplicado', async () => {
  for (const numero of [0, -1, 1.5, 'inválido']) {
    const app = api();assert.equal((await app.create({ numero })).status, 400);assert.equal(app.writes.length, 0);
  }
  const app = api({ duplicate: true });assert.equal((await app.create()).status, 400);assert.equal(app.writes.length, 0);
});
test('curso de outra instituição e usuários sem permissão não criam etapas', async () => {
  for (const options of [{ missing: true }, { user: null }, { user: { role: 'ALUNO', instituicaoId: 7 } }]) {
    const app = api(options);assert.ok([403, 404].includes((await app.create()).status));assert.equal(app.writes.length, 0);
  }
  const app = api();await app.create();assert.ok(app.reads.filter(([model]) => model === 'curso').every(([,args]) => args.where.instituicaoId === 7));
});
test('curso recebido da rede mantém estrutura protegida', async () => {
  const app = api({ course: { publicacaoRedeDestino: { id: 8 } } });
  assert.equal((await app.create()).status, 403);assert.equal(app.writes.length, 0);
});
test('disciplina direta continua permitida sem etapas e após criar etapa vazia', () => {
  const d = { id: 3, cursoId: 32 };
  for (const semestres of [[], [{ numero: 1, disciplinas: [] }]]) {
    assert.equal(grade.disciplinaPermitidaNaOferta(d, { id: 32, organizacaoCurricular: 'LIVRE', semestres }, null), true);
  }
});
test('disciplina de qualquer etapa opcional pode ser ofertada sem semestre obrigatório', () => {
  const curso = { id: 32, organizacaoCurricular: 'LIVRE', semestres: [
    { numero: 1, disciplinas: [{ disciplinaId: 3 }] }, { numero: 2, disciplinas: [{ disciplinaId: 4 }] },
  ] };
  assert.equal(grade.disciplinaPermitidaNaOferta({ id: 3, cursoId: null }, curso, null), true);
  assert.equal(grade.disciplinaPermitidaNaOferta({ id: 4, cursoId: 9 }, curso, null), true);
  assert.equal(grade.disciplinaPermitidaNaOferta({ id: 5, cursoId: 9 }, curso, null), false);
});
test('etapas semestrais e anuais continuam sendo a grade obrigatória da oferta', () => {
  for (const organizacaoCurricular of ['SEMESTRAL', 'ANUAL']) {
    const curso = { id: 32, organizacaoCurricular, semestres: [{ numero: 1, disciplinas: [{ disciplinaId: 3 }] }] };
    assert.equal(grade.disciplinaPermitidaNaOferta({ id: 4, cursoId: 32 }, curso, 1), false);
    assert.equal(grade.disciplinaPermitidaNaOferta({ id: 3, cursoId: 9 }, curso, 1), true);
    assert.equal(grade.disciplinaPermitidaNaOferta({ id: 3, cursoId: 9 }, curso, 2), false);
  }
});
test('preços e prazos de semana e mês independem da organização das disciplinas', () => {
  assert.equal(livre.precoLivre('150.00'), 150);assert.equal(livre.precoLivre('480.00'), 480);
  assert.equal(livre.validarPeriodoLivre({ periodicidade: 'SEMANAL', dataInicio: '2027-03-01', dataFim: '2027-03-07' }).periodicidade, 'SEMANAL');
  assert.equal(livre.validarPeriodoLivre({ periodicidade: 'MENSAL', dataInicio: '2027-03-01', dataFim: '2027-03-31' }).periodicidade, 'MENSAL');
});
test('os cinco idiomas explicam a separação entre etapas e cobrança', () => {
  for (const locale of ['pt-BR', 'pt-PT', 'en-US', 'es-ES', 'fr-FR']) {
    const msg = JSON.parse(fs.readFileSync(path.join(root, 'messages', locale + '.json')));
    assert.ok(msg.CoursePeriods.optionalStagesHelp);assert.ok(msg.CoursePeriods.courseHelp);assert.ok(msg.AcademicStructure.freeSubjectHelp);
  }
});
