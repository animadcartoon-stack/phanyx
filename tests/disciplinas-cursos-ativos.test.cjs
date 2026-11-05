'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function source(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function load(file, extraMocks = {}) {
  const filename = path.resolve(root, file);
  const mod = new Module(filename, module);
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const standardMocks = {
    'next/server': { NextResponse: { json: (data, options = {}) => new Response(JSON.stringify(data), { status: options.status || 200, headers: { 'Content-Type': 'application/json' } }) } },
    '@/lib/server-auth': { getUserFromToken: async () => ({ id: 44, instituicaoId: 26, role: 'ADMIN' }), isAdminLike: () => true },
    '@/lib/publicacao-cursos-rede': { sincronizarPublicacoesAtivasDoCurso: async () => [] },
    '@/lib/academico/integridade-ofertas': { idsOferta: values => values ?? [], ErroIntegridadeAcademica: class extends Error {}, respostaErroAcademico: () => null, protegerHistoricoDasOfertas: async () => {}, sincronizarTurmasDaDisciplina: async () => {} },
  };
  mod.require = id => Object.hasOwn(extraMocks, id) ? extraMocks[id] : Object.hasOwn(standardMocks, id) ? standardMocks[id] : Module.prototype.require.call(mod, id);
  mod._compile(ts.transpileModule(source(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const req = (url, method, body) => new Request('https://phanyx.example'+url, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

test('as duas telas de disciplinas consultam somente cursos ativos', () => {
  for (const file of ['app/admin/disciplinas/page.tsx', 'app/admin/disciplinas/[disciplinaId]/page.tsx']) {
    assert.match(source(file), /fetch\("\/api\/curso\?somenteAtivos=1"/);
    assert.doesNotMatch(source(file), /fetch\("\/api\/curso"/);
  }
});

test('grupo por curso tem atalho para editar o nome sem renomear as disciplinas', () => {
  const s = source('app/admin/disciplinas/page.tsx');
  assert.match(s, /cursoIdDoGrupo\(semestres\)/);
  assert.match(s, /\?editar=1#dados-curso/);
  assert.match(s, /t\("common\.edit"\)/);
  assert.match(s, /t\("edit\.course"\)/);
});

test('edição mantém o curso histórico indisponível selecionado, mas não oferece novas associações', () => {
  const s = source('app/admin/disciplinas/[disciplinaId]/page.tsx');
  assert.match(s, /setCursoOriginal\(disciplina\.curso \?\? null\)/);
  assert.match(s, /cursoOriginal && !cursos\.some/);
  assert.match(s, /disabled/);
});

test('POST rejeita novo vínculo com curso inativo, excluído ou de outra instituição antes de gravar', async () => {
  const whereSeen = []; let writes = 0;
  const prisma = { curso: { findFirst: async ({ where }) => { whereSeen.push(where); return null; } }, $transaction: async () => { writes++; throw new Error('não pode gravar'); } };
  const api = load('app/api/disciplina/route.ts', { '@/lib/prisma': { prisma } });
  const res = await api.POST(req('/api/disciplina', 'POST', { nome: 'Nova', cursoId: 47 }));
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /inativo|exclu/i);
  assert.equal(writes, 0);
  assert.deepEqual(whereSeen[0], { id: 47, instituicaoId: 26, ativo: true, excluidoEm: null });
});

test('POST permite curso ativo da própria instituição', async () => {
  let writes = 0;
  const prisma = {
    curso: { findFirst: async ({ where }) => { assert.equal(where.instituicaoId, 26); assert.equal(where.ativo, true); assert.equal(where.excluidoEm, null); return { id: 47, organizacaoCurricular: 'LIVRE', publicacaoRedeDestino: null }; } },
    $transaction: async callback => callback({ disciplina: { create: async ({ data }) => { writes++; assert.equal(data.cursoId, 47); assert.equal(data.semestre, null); return { id: 98, ...data }; } } }),
  };
  const api = load('app/api/disciplina/route.ts', { '@/lib/prisma': { prisma } });
  const res = await api.POST(req('/api/disciplina', 'POST', { nome: 'Robótica', cursoId: 47 }));
  assert.equal(res.status, 201);
  assert.equal(writes, 1);
});

function existing() {
  return { id: 98, instituicaoId: 26, cursoId: 40, nome: 'IA', codigo: null, descricao: null, cargaHoraria: null, semestre: null, professorId: null, disciplinaOrigemRedeId: null, curso: { instituicaoId: 26, publicacaoRedeDestino: null, id: 40 }, turmaDisciplinas: [] };
}

test('PUT impede trocar a disciplina para outro curso inativo ou excluído', async () => {
  const db = { curso: { findFirst: async ({ where }) => { assert.deepEqual(where, { id: 41, instituicaoId: 26, ativo: true, excluidoEm: null }); return null; } }, disciplina: { findFirst: async () => existing() }, $transaction: async () => { throw new Error('não pode gravar'); } };
  const api = load('app/api/disciplina/[id]/route.ts', { '@/lib/prisma': { prisma: db } });
  const res = await api.PUT(req('/api/disciplina/98', 'PUT', { cursoId: 41 }), { params: { id: '98' } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /inativo|exclu/i);
});

test('PUT conserva vínculo com curso histórico inativo ao salvar outros dados', async () => {
  let changed = 0;
  const db = {
    curso: { findFirst: async ({ where }) => { assert.deepEqual(where, { id: 40, instituicaoId: 26 }); return { id: 40, ativo: false, excluidoEm: null, organizacaoCurricular: 'LIVRE' }; } },
    disciplina: { findFirst: async () => existing() },
    $transaction: async cb => cb({ disciplina: { update: async ({ data }) => { changed++; assert.equal(data.cursoId, 40); } } }),
  };
  const api = load('app/api/disciplina/[id]/route.ts', { '@/lib/prisma': { prisma: db } });
  const res = await api.PUT(req('/api/disciplina/98', 'PUT', { cursoId: 40 }), { params: { id: '98' } });
  assert.equal(res.status, 200);
  assert.equal(changed, 1);
});
