'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
function match(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (key === 'OR') return value.some(v => match(row, v));
    if (value && typeof value === 'object') {
      if ('in' in value) return value.in.includes(row[key]);
      if ('gt' in value) return row[key] > value.gt;
      if ('startsWith' in value) return String(row[key] || '').startsWith(value.startsWith);
      if ('not' in value) return row[key] !== value.not;
      return row[key] != null && match(row[key], value);
    }
    return row[key] === value;
  });
}
function fixture(options = {}) {
  let state = {
    curso: [{ id: 28, instituicaoId: 7, nome: 'Avulso Balé', codigo: 'AVB-2027', descricao: 'Balé', modalidadeCertificado: 'EDUCACAO_INFANTIL',
      organizacaoCurricular: 'SEMESTRAL', quantidadeEtapas: 2, quantidadeSemestres: 2,
      valorMatricula: 98.5, valorMensalidade: 139, quantidadeParcelas: 12, ativo: true,
      valorSemanal: null, descontoMensalidadePercentual: null, regrasPrecoDisciplinas: null,
      participaCombo: true, valorMensalidadeCombo: '125.00', precosComboPorQuantidade: [{ quantidadeAtividades: 2, valorMensalidade: '109.00' }],
      publicacaoRedeDestino: null, ...options.course }],
    cursoSemestre: [1, 2].map((numero, i) => ({ id: 100 + i, cursoId: 28, instituicaoId: 7, numero,
      organizacaoCurricular: options.course?.organizacaoCurricular ?? 'SEMESTRAL', titulo: 'Etapa de balé ' + numero,
      descricao: 'Descrição ' + numero, cargaMinima: 10, cargaMaxima: 100, _count: { semestresPublicadosRede: 0 } })),
    cursoSemestreDisciplina: [{ id: 1, instituicaoId: 7, cursoSemestreId: 100, disciplinaId: 10 }, { id: 2, instituicaoId: 7, cursoSemestreId: 101, disciplinaId: 11 }],
    disciplina: [{ id: 10, instituicaoId: 7, cursoId: 28, semestre: 1, nome: 'Dança' }],
    turma: [], matricula: [], periodoMatricula: [], rematriculaSemestral: [], matriculaDisciplinaContratada: [], cursoPublicacaoRede: [],
    financeiro: [{ id: 9, valor: 139 }],
  };
  const writes = [];
  const db = {};
  for (const model of Object.keys(state)) db[model] = {
    findFirst: async ({ where } = {}) => state[model].find(row => match(row, plain(where))) ?? null,
    findUnique: async ({ where }) => state[model].find(row => match(row, plain(where))) ?? null,
    findMany: async ({ where } = {}) => state[model].filter(row => match(row, plain(where ?? {}))),
    count: async ({ where } = {}) => state[model].filter(row => match(row, plain(where ?? {}))).length,
    updateMany: async ({ where, data }) => {
      writes.push({ model, where: plain(where), data: plain(data) });
      const rows = state[model].filter(row => match(row, plain(where)));
      rows.forEach(row => Object.assign(row, plain(data)));return { count: rows.length };
    },
    update: async ({ where, data }) => {
      writes.push({ model, where: plain(where), data: plain(data) });
      const row = state[model].find(row => match(row, plain(where)));
      Object.assign(row, plain(data));return row;
    },
  };
  db.$queryRaw = async () => [{ total: state.snapshots || 0 }];
  db.$transaction = async (fn, config) => {
    assert.equal(config.isolationLevel, 'Serializable');
    const snapshot = structuredClone(state);
    try { return await fn(db); } catch (e) { state = snapshot; throw e; }
  };
  const json = (body, config) => ({ status: config?.status ?? 200, body });
  const cache = new Map();
  function load(file) {
    const full = path.join(root, file);
    if (cache.has(full)) return cache.get(full);
    const exports = {};cache.set(full, exports);
    const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { exports, URL, console: { error() {} }, require(name) {
      if (name === 'next/server') return { NextResponse: { json } };
      if (name === '@/lib/prisma') return { prisma: db };
      if (name === '@/lib/server-auth') return { getUserFromToken: async () => options.user === undefined
        ? { id: 1, instituicaoId: 7, role: 'ADMIN' } : options.user };
      if (name === '@prisma/client') return { Prisma: { DbNull: null }, ModalidadeCertificado: { GERAL: 'GERAL', EDUCACAO_INFANTIL: 'EDUCACAO_INFANTIL' }, StatusComercialPolo: {}, StatusPublicacaoCursoRede: {} };
      if (name === '@/lib/publicacao-cursos-rede') return { sincronizarPublicacoesAtivasDoCurso: async () => [] };
      if (name === '@/lib/polos-rede') return {};
      if (name === '@/lib/matriculas/combos-api') return { erroCombos: () => null };
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(full), name)) + '.ts');
      throw new Error('Importação inesperada: ' + name);
    } });return exports;
  }
  const rules = load('lib/academico/integridade-ofertas.ts');
  const api = load('app/api/admin/cursos/route.ts');
  return { db, writes, rules, state: () => state,
    calcularCombo: load('lib/matriculas/combos.ts').calcularContratacaoModalidades,
    calcularDisciplinas: load('lib/matriculas/preco-disciplinas.ts').calcularPrecoDisciplinas,
    async convert(origem = 'SEMESTRAL', destino = 'ANUAL') {
      return db.$transaction(tx => rules.converterOrganizacaoDaGradeDoCurso(tx, 7, 28, origem, destino), { isolationLevel: 'Serializable' });
    },
    async save(overrides = {}) {
      const curso = state.curso[0];
      return api.PUT({ json: async () => ({ ...curso, organizacaoCurricular: 'ANUAL', quantidadeEtapas: 2,
        ...overrides }) });
    },
  };
}
test('troca de organização conserva IDs, títulos, números, cargas e todos os vínculos de disciplinas', async () => {
  for (const [origem, destino] of [['SEMESTRAL', 'ANUAL'], ['ANUAL', 'SEMESTRAL']]) {
    const f = fixture({ course: { organizacaoCurricular: origem } });const before = structuredClone(f.state());
    await f.convert(origem, destino);
    assert.deepEqual(f.state().cursoSemestre, before.cursoSemestre.map(e => ({ ...e, organizacaoCurricular: destino })));
    assert.deepEqual(f.state().cursoSemestreDisciplina, before.cursoSemestreDisciplina);
    assert.deepEqual(f.state().disciplina, before.disciplina);assert.deepEqual(f.state().financeiro, before.financeiro);
    assert.ok(f.writes.every(w => w.model === 'cursoSemestre' && Object.keys(w.data).join() === 'organizacaoCurricular'));
  }
});
test('PUT salva curso anual junto com sua grade sem alterar preços, parcelas ou descontos de combo', async () => {
  const f = fixture();const before = structuredClone(f.state());
  const outro = { ...before.curso[0], id: 99, nome: 'Outro curso', valorMensalidade: 200 };
  const calculoAntes = plain(f.calcularCombo([before.curso[0], outro], []));
  const res = await f.save();
  assert.equal(res.status, 200);assert.equal(f.state().curso[0].organizacaoCurricular, 'ANUAL');
  assert.ok(f.state().cursoSemestre.every(e => e.organizacaoCurricular === 'ANUAL'));
  assert.equal(f.state().curso[0].quantidadeSemestres, null);assert.equal(f.state().curso[0].quantidadeEtapas, 2);
  for (const key of ['valorMatricula', 'valorMensalidade', 'quantidadeParcelas', 'participaCombo', 'precosComboPorQuantidade']) {
    assert.deepEqual(f.state().curso[0][key], before.curso[0][key], key);
  }
  assert.equal(Number(f.state().curso[0].valorMensalidadeCombo), Number(before.curso[0].valorMensalidadeCombo));
  assert.deepEqual(plain(f.calcularCombo([f.state().curso[0], outro], [])), calculoAntes);
  assert.deepEqual(f.state().cursoSemestreDisciplina, before.cursoSemestreDisciplina);
  assert.deepEqual(f.state().financeiro, before.financeiro);
});
test('PUT também preserva as faixas de preço por quantidade de disciplinas', async () => {
  const regras = { versao: 1, faixas: [{ quantidade: 1, descontoPercentual: 0 }, { quantidade: 2, descontoPercentual: 10 }] };
  const f = fixture({ course: { participaCombo: false, regrasPrecoDisciplinas: regras } });
  const antes = plain(f.calcularDisciplinas(139, regras, [10, 11]));
  assert.equal((await f.save()).status, 200);
  assert.deepEqual(plain(f.calcularDisciplinas(139, f.state().curso[0].regrasPrecoDisciplinas, [10, 11])), antes);
  assert.equal(antes.total, 250.2);
  assert.deepEqual(f.state().curso[0].regrasPrecoDisciplinas, regras);assert.equal(f.state().curso[0].valorMensalidade, 139);
});
test('PUT volta de anual para semestral mantendo a quantidade prevista e a grade', async () => {
  const f = fixture({ course: { organizacaoCurricular: 'ANUAL', quantidadeSemestres: null } });
  assert.equal((await f.save({ organizacaoCurricular: 'SEMESTRAL', quantidadeSemestres: 2 })).status, 200);
  assert.equal(f.state().curso[0].quantidadeSemestres, 2);assert.ok(f.state().cursoSemestre.every(e => e.organizacaoCurricular === 'SEMESTRAL'));
});
test('limite de etapas inválido reverte toda a alteração na mesma transação', async () => {
  const f = fixture();const before = structuredClone(f.state());const res = await f.save({ quantidadeEtapas: 1 });
  assert.equal(res.status, 400);assert.deepEqual(f.state(), before);
});
test('turmas e histórico acadêmico impedem conversão sem alterar registros', async () => {
  const cases = [
    ['turma', { instituicaoId: 7, cursoId: 28 }], ['matricula', { instituicaoId: 7, cursoId: 28, status: 'CANCELADA' }],
    ['matricula', { instituicaoId: 7, cursoId: null, cursoSemestreId: 100 }],
    ['periodoMatricula', { instituicaoId: 7, cursoId: null, cursoSemestreId: 100 }],
    ['rematriculaSemestral', { instituicaoId: 7, cursoSemestreDestino: { cursoId: 28, instituicaoId: 7 } }],
    ['matriculaDisciplinaContratada', { instituicaoId: 7, cursoSemestreIdSnapshot: 100 }],
    ['cursoPublicacaoRede', { instituicaoOrigemId: 7, cursoOrigemId: 28 }],
    ['cursoPublicacaoRede', { instituicaoDestinoId: 7, cursoDestinoId: 28 }],
  ];
  for (const [model, record] of cases) {
    const f = fixture();f.state()[model].push(record);const before = structuredClone(f.state());
    const res = await f.save();assert.equal(res.status, 409, model);assert.equal(res.body.codigo, 'ORGANIZACAO_COM_VINCULOS');
    assert.deepEqual(f.state(), before);assert.equal(f.writes.length, 0);
  }
});
test('a proteção considera apenas vínculos da instituição e do curso editado', async () => {
  const f = fixture();f.state().matricula.push({ instituicaoId: 9, cursoId: 200, cursoSemestreId: 500 });
  assert.equal((await f.save()).status, 200);
});
test('conversão não altera etapas e vínculos de outro curso ou instituição', async () => {
  const f = fixture();const externo = { ...f.state().cursoSemestre[0], id: 800, cursoId: 90, instituicaoId: 9 };
  f.state().cursoSemestre.push(externo);await f.convert();
  assert.equal(f.state().cursoSemestre.find(e => e.id === 800).organizacaoCurricular, 'SEMESTRAL');
});
test('sessão ausente e usuário sem papel administrativo não gravam alterações', async () => {
  for (const user of [null, { id: 4, role: 'PROFESSOR', instituicaoId: 7 }]) {
    const f = fixture({ user });assert.equal((await f.save()).status, 403);assert.equal(f.writes.length, 0);
  }
});
test('curso fora da instituição não é alterado', async () => {
  const f = fixture({ user: { id: 3, role: 'ADMIN', instituicaoId: 9 } });
  assert.equal((await f.save()).status, 404);assert.equal(f.writes.length, 0);
});
test('origem alterada ou grade divergente exige atualização antes de salvar', async () => {
  for (const change of ['course', 'grade']) {
    const f = fixture();if (change === 'course') f.state().curso[0].organizacaoCurricular = 'ANUAL';
    else f.state().cursoSemestre[0].organizacaoCurricular = 'ANUAL';
    await assert.rejects(f.convert(), e => e.codigo === 'DADOS_ALTERADOS');assert.equal(f.writes.length, 0);
  }
});
test('troca com LIVRE conserva o bloqueio anterior e não retipa grade', async () => {
  const f = fixture();await assert.rejects(f.convert('SEMESTRAL', 'LIVRE'), e => e.codigo === 'ORGANIZACAO_EM_USO');assert.equal(f.writes.length, 0);
});
test('disciplinas sem grade explícita não são redistribuídas por suposição', async () => {
  const f = fixture();f.state().cursoSemestre = [];
  await assert.rejects(f.convert(), e => e.codigo === 'ORGANIZACAO_GRADE_NECESSARIA');assert.equal(f.writes.length, 0);
});
test('etapas publicadas sem vínculo de publicação também ficam protegidas', async () => {
  const f = fixture();f.state().cursoSemestre[0]._count.semestresPublicadosRede = 1;
  await assert.rejects(f.convert(), e => e.codigo === 'ORGANIZACAO_COM_VINCULOS');assert.equal(f.writes.length, 0);
});
test('cinco idiomas incluem orientação e mensagens de impedimento', () => {
  for (const locale of ['pt-BR', 'pt-PT', 'en-US', 'es-ES', 'fr-FR']) {
    const msg = JSON.parse(fs.readFileSync(path.join(root, 'messages', locale + '.json')));
    assert.ok(msg.CourseOrganizationChange.keepCurriculum);assert.ok(msg.CourseOrganizationChange.updated);
    for (const key of ['ORGANIZACAO_COM_VINCULOS', 'ORGANIZACAO_GRADE_NECESSARIA']) assert.ok(msg.AcademicIntegrity[key]);
  }
});

function semGrade(origem='SEMESTRAL') {
 const f=fixture({course:{matriculaDiretaTurma:true,organizacaoCurricular:origem,participaCombo:false,regrasSelecaoDisciplinas:null}});f.state().cursoSemestre=[];f.state().cursoSemestreDisciplina=[];f.state().disciplina=[];
 f.state().turma=[27,28,29].map((id,i)=>({id,instituicaoId:7,cursoId:28,nome:'TESTE Turma '+id,organizacaoCurricular:origem,etapaNumero:1,semestre:origem==='SEMESTRAL'?'1':'',periodoLetivo:'2027',professorId:i===1?8:7,ativa:true,capacidadeMaxima:15,_count:{}}));
 f.state().horarios=[{id:1,turmaId:27,diaSemana:2,horaInicio:'16:00',horaFim:'17:40'},{id:2,turmaId:28,diaSemana:4,horaInicio:'16:00',horaFim:'17:40'},{id:3,turmaId:29,diaSemana:2,horaInicio:'10:00',horaFim:'11:40'}];return f;
}
test('curso sem grade com três turmas salva anual e modalidade pelo mesmo PUT preservando horários e preços',async()=>{
 const f=semGrade(),before=structuredClone(f.state());const res=await f.save({modalidadeCertificado:'GERAL'});assert.equal(res.status,200,JSON.stringify(res));assert.equal(f.state().curso[0].organizacaoCurricular,'ANUAL');assert.equal(f.state().curso[0].modalidadeCertificado,'GERAL');assert.equal(f.state().curso[0].quantidadeSemestres,null);
 assert.deepEqual(f.state().turma,before.turma.map(t=>({...t,organizacaoCurricular:'ANUAL',semestre:''})));assert.deepEqual(f.state().horarios,before.horarios);for(const k of ['valorMatricula','valorMensalidade','quantidadeParcelas','matriculaDiretaTurma'])assert.deepEqual(f.state().curso[0][k],before.curso[0][k]);
});
test('curso sem grade volta para semestral preservando números, docentes, vagas e estado ativo',async()=>{const f=semGrade('ANUAL'),before=structuredClone(f.state().turma);assert.equal((await f.save({organizacaoCurricular:'SEMESTRAL'})).status,200);assert.deepEqual(f.state().turma,before.map(t=>({...t,organizacaoCurricular:'SEMESTRAL',semestre:'1'})))});
for(const campo of ['disciplinas','semestres','atividades','aulas','itensMatricula','matriculasComoPrincipal','modulos','notas','provas','sessoesVideoAluno','eventosAprendizagemAluno','resultadosFinais','periodosMatriculaParticipantes','reunioes','substituicoesDocentes','destinosRecomendacoesBiblioteca','atividadesExternas','matriculasAvulsas'])test('mudança anual de curso sem grade preserva vínculo real: '+campo,async()=>{const f=semGrade();f.state().turma[1]._count[campo]=1;const before=structuredClone(f.state());const res=await f.save();assert.equal(res.status,409);assert.deepEqual(f.state(),before);assert.equal(f.writes.length,0)});
test('snapshot contratual ou oferta compartilhada impede retipar turma sem alterar a organização',async()=>{let f=semGrade();f.state().snapshots=1;assert.equal((await f.save()).status,409);assert.equal(f.writes.length,0);f=semGrade();f.state().turma.push({id:99,instituicaoId:7,cursoId:200,codigo:'OFERTA-27-200'});assert.equal((await f.save()).status,409);assert.equal(f.writes.length,0)});
test('turmas de outros cursos e instituições não são retipadas',async()=>{const f=semGrade(),other={...f.state().turma[0],id:99,cursoId:100,instituicaoId:9};f.state().turma.push(other);assert.equal((await f.save()).status,200);assert.deepEqual(f.state().turma.find(t=>t.id===99),other)});
test('turma com organização divergente ou sem número válido exige correção sem gravação parcial',async()=>{for(const delta of [{organizacaoCurricular:'ANUAL'},{etapaNumero:null,semestre:'indefinido'}]){const f=semGrade();Object.assign(f.state().turma[1],delta);const before=structuredClone(f.state());assert.ok([400,409].includes((await f.save()).status));assert.deepEqual(f.state(),before)}});
test('edição somente da modalidade não é bloqueada por uma matrícula cancelada',async()=>{const f=semGrade();f.state().matricula.push({id:8,instituicaoId:7,cursoId:28,status:'CANCELADA'});const old=structuredClone(f.state().matricula);const res=await f.save({organizacaoCurricular:'SEMESTRAL',modalidadeCertificado:'GERAL'});assert.equal(res.status,200);assert.deepEqual(f.state().matricula,old);assert.equal(f.state().curso[0].modalidadeCertificado,'GERAL')});
