'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const route = ts.transpileModule(fs.readFileSync(path.join(root, 'app/api/admin/curso-semestres/route.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function endpoint(options = {}) {
  const calls = [];
  const etapa = {
    numero: 2, organizacaoCurricular: 'SEMESTRAL',
    curso: { publicacaoRedeDestino: null },
    _count: { matriculas: 0, rematriculasDestino: 0, periodosMatricula: 0,
      disciplinasExtrasPermitidas: 0, semestresPublicadosRede: 0, ...options.counts },
    ...options.stage,
  };
  const tx = {};
  for (const model of ['cursoSemestre', 'matricula', 'turma', 'periodoMatricula', 'matriculaDisciplinaContratada']) {
    tx[model] = {
      findFirst: async (args) => {
        calls.push({ model, method: 'findFirst', args });
        return model === 'cursoSemestre' ? (options.missing ? null : etapa)
          : options.linked === model ? { id: 90, nome: 'PEVI A' } : null;
      },
      deleteMany: async (args) => {
        calls.push({ model, method: 'deleteMany', args });
        if (options.deleteError) throw { code: options.deleteError };
        return { count: 1 };
      },
    };
  }
  const auth = {
    getUserFromToken: async () => options.user === undefined
      ? { id: 3, instituicaoId: 7, role: 'ADMIN' } : options.user,
    isAdminLike: role => ['ADMIN', 'GERENCIA', 'SUPER_ADMIN'].includes(role),
  };
  const exports = {};
  vm.runInNewContext(route, {
    exports, URL, console: { error() {} },
    require: name => {
      if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ status: init?.status ?? 200, body }) } };
      if (name === '@/lib/server-auth') return auth;
      if (name === '@/lib/prisma') return { prisma: { $transaction: async (cb, config) => {
        assert.equal(config.isolationLevel, 'Serializable');
        if (options.transactionError) throw { code: options.transactionError };
        return cb(tx);
      } } };
      if (name === '@/lib/publicacao-cursos-rede') return {};
      throw new Error('Unexpected module: ' + name);
    },
  });
  return {
    calls,
    remove: (body = { id: 12, cursoId: 18 }) => exports.DELETE({ json: async () => body }),
    malformed: () => exports.DELETE({ json: async () => { throw new SyntaxError(); } }),
  };
}
function assertNoDelete(app) { assert.ok(!app.calls.some(c => c.method === 'deleteMany')); }

test('exige sessão e papel administrativo antes de acessar dados', async () => {
  for (const [user, status] of [[null, 401], [{ instituicaoId: 7, role: 'PROFESSOR' }, 403]]) {
    const app = endpoint({ user });
    assert.equal((await app.remove()).status, status);
    assert.equal(app.calls.length, 0);
  }
});
test('rejeita IDs inválidos e JSON malformado sem consultar dados', async () => {
  const app = endpoint();
  for (const body of [null, {}, { id: -1, cursoId: 18 }, { id: 1.5, cursoId: 18 }, { id: 12, cursoId: 'x' }]) {
    assert.equal((await app.remove(body)).status, 400);
  }
  assert.equal((await app.malformed()).status, 400);
  assert.equal(app.calls.length, 0);
});
test('etapa ausente ou de outra instituição/curso não é excluída', async () => {
  const app = endpoint({ missing: true });
  assert.equal((await app.remove()).status, 404);
  assert.deepEqual(JSON.parse(JSON.stringify(app.calls[0].args.where)), {
    id: 12, cursoId: 18, instituicaoId: 7, curso: { instituicaoId: 7 },
  });
  assertNoDelete(app);
});
test('preserva etapas recebidas e publicadas na rede', async () => {
  for (const options of [
    { stage: { curso: { publicacaoRedeDestino: { id: 1 } } } },
    { counts: { semestresPublicadosRede: 1 } },
  ]) {
    const app = endpoint(options);
    assert.ok([403, 409].includes((await app.remove()).status));
    assertNoDelete(app);
  }
});
test('preserva relações diretas, inclusive períodos com SetNull e regras com Cascade', async () => {
  for (const key of ['matriculas', 'rematriculasDestino', 'periodosMatricula', 'disciplinasExtrasPermitidas']) {
    const app = endpoint({ counts: { [key]: 1 } });
    const res = await app.remove();
    assert.equal(res.status, 409, key);
    assert.equal(res.body.codigo, 'STAGE_IN_USE');
    assertNoDelete(app);
  }
});
test('preserva vínculos legados por número e snapshots de contratação', async () => {
  for (const linked of ['matricula', 'turma', 'periodoMatricula', 'matriculaDisciplinaContratada']) {
    const app = endpoint({ linked });
    assert.equal((await app.remove()).status, 409, linked);
    assertNoDelete(app);
  }
});
test('consultas legadas incluem organização, número e turma com etapas', async () => {
  const app = endpoint();
  await app.remove();
  const query = model => JSON.parse(JSON.stringify(app.calls.find(c => c.model === model).args.where));
  assert.deepEqual(query('matricula').OR, [{ cursoSemestreId: 12 }, { etapaNumero: 2 }, { semestre: 2 }]);
  assert.equal(query('matricula').organizacaoCurricular, 'SEMESTRAL');
  assert.ok(query('turma').OR.some(v => v.semestres?.some.numero === 2));
  assert.equal(query('periodoMatricula').semestreNumero, 2);
  assert.equal(query('matriculaDisciplinaContratada').OR[0].cursoSemestreIdSnapshot, 12);
});
test('ano curricular não é confundido com semestre legado do mesmo número', async () => {
  const app = endpoint({ stage: { organizacaoCurricular: 'ANUAL' } });
  assert.equal((await app.remove()).status, 200);
  const m = app.calls.find(c => c.model === 'matricula').args.where;
  assert.equal(m.organizacaoCurricular, 'ANUAL');
  assert.ok(!m.OR.some(v => 'semestre' in v));
});
test('exclui somente a etapa autorizada e não modifica curso, catálogo ou outras etapas', async () => {
  const app = endpoint();
  const res = await app.remove();
  assert.equal(res.status, 200);
  assert.equal(res.body.id, 12);
  const mutations = app.calls.filter(c => c.method === 'deleteMany');
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].model, 'cursoSemestre');
  assert.deepEqual(JSON.parse(JSON.stringify(mutations[0].args.where)), { id: 12, cursoId: 18, instituicaoId: 7 });
});
test('trata conflitos de FK e concorrência sem erro genérico', async () => {
  for (const code of ['P2003', 'P2014', 'P2025']) {
    const app = endpoint({ deleteError: code });
    assert.equal((await app.remove()).status, 409);
  }
  const app = endpoint({ transactionError: 'P2034' });
  assert.equal((await app.remove()).body.codigo, 'CONCURRENT_CHANGE');
  assertNoDelete(app);
});
test('rota neutra também expõe DELETE', () => {
  const alias = fs.readFileSync(path.join(root, 'app/api/admin/curso-etapas/route.ts'), 'utf8');
  assert.match(alias, /export \{[^}]*DELETE[^}]*\} from "\.\.\/curso-semestres\/route"/);
});

test('bloqueio sem matrícula identifica a turma vinculada para revisão', async () => {
  const app = endpoint({ linked: 'turma' });
  const resposta = await app.remove();
  assert.equal(resposta.status, 409);
  assert.equal(resposta.body.detalhes.turma.nome, 'PEVI A');
  assertNoDelete(app);
});
