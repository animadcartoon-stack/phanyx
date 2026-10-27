'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
const plain = v => JSON.parse(JSON.stringify(v));
function load(file, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Date, require: n => { if (n in imports) return imports[n];throw Error(n); } });return exports;
}
const combos = load('lib/matriculas/combos.ts');
const rules = load('lib/matriculas/requisitos-cursos.ts', { './combos': combos });
const ui = load('lib/matriculas/requisitos-cursos-interface.ts');
const date = s => new Date(s + 'T00:00:00.000Z');
function match(row, where = {}) {
  return Object.entries(where).every(([k, v]) => {
    if (v === undefined) return true;
    if (k === 'OR') return v.some(w => match(row, w));
    if (v === null) return row[k] == null;
    if (typeof v === 'object') {
      if ('in' in v) return v.in.includes(row[k]);
      if ('not' in v) return row[k] !== v.not;
      if ('some' in v) return (row[k] ?? []).some(r => match(r, v.some));
      if ('gte' in v || 'lte' in v) return (!('gte' in v) || row[k] >= v.gte) && (!('lte' in v) || row[k] <= v.lte);
      return row[k] != null && match(row[k], v);
    }
    return row[k] === v;
  });
}
function select(row, fields) {
  if (!fields) return structuredClone(row);
  return Object.fromEntries(Object.entries(fields).filter(([,v]) => v).map(([key, spec]) => {
    let value = row[key];
    if (typeof spec === 'object') {
      if (Array.isArray(value)) value = value.filter(r => match(r, spec.where)).map(r => select(r, spec.select));
      else if (value != null) value = select(value, spec.select);
    }
    return [key, value];
  }));
}
function fixture() {
  const state = {
    curso: [1,2,3].map(id => ({ id, instituicaoId: 7, nome: 'Curso '+id, ativo: true, excluidoEm: null })),
    cursoRequisitoConjunto: [{ instituicaoId: 7, cursoId: 2, cursoObrigatorioId: 1 }],
    cursoPublicacaoRede: [], matricula: [],
  };
  const calls = [], db = {};
  const rows = model => model === 'cursoRequisitoConjunto' ? state[model].map(r => ({ ...r,
    curso: state.curso.find(c => c.id === r.cursoId && c.instituicaoId === r.instituicaoId),
    cursoObrigatorio: state.curso.find(c => c.id === r.cursoObrigatorioId && c.instituicaoId === r.instituicaoId),
  })) : state[model];
  for (const model of Object.keys(state)) db[model] = {
    findMany: async args => { calls.push({ model, args });return rows(model).filter(r => match(r, args?.where)).map(r => select(r, args?.select)); },
    findFirst: async args => rows(model).find(r => match(r, args.where)) ?? null,
    count: async args => rows(model).filter(r => match(r, args.where)).length,
    deleteMany: async args => { calls.push({ model, write: 'delete' });state[model] = state[model].filter(r => !match(r, args.where)); },
    createMany: async args => { calls.push({ model, write: 'create' });state[model].push(...plain(args.data)); },
  };
  return { state, db, calls };
}
const request = extra => ({ alunoId: 5, cursoIds: [2], periodoLetivo: '2027', inicio: date('2027-03-01'), ...extra });
const active = extra => ({ id: 10, instituicaoId: 7, alunoId: 5, cursoId: 1, status: 'ATIVA', excluidaEm: null, canceladaEm: null,
  periodoLetivo: '2027', dataInicioCurso: date('2027-01-01'), organizacaoCurricular: 'ANUAL', turmaPrincipal: null, itens: [], periodosCursoLivre: [], ...extra });
const pending = p => assert.rejects(p, e => e.codigo === 'CURSO_CONJUNTO_PENDENTE' && e.status === 409 && e.detalhes.faltantes[0].obrigatorioNome === 'Curso 1');
test('configuração opcional normaliza IDs e rejeita repetições, booleanos e IDs inseguros', () => {
  assert.equal(rules.normalizarIdsRequisitos(undefined), undefined);assert.deepEqual(plain(rules.normalizarIdsRequisitos(['3',1])), [1,3]);
  for (const value of [null, true, [1,1], [false], [0], [-1], ['1x'], [1.2], [Number.MAX_SAFE_INTEGER+1]]) assert.throws(() => rules.normalizarIdsRequisitos(value));
});
test('impede exigência de si próprio e ciclos diretos ou transitivos', () => {
  assert.throws(() => rules.validarGrafoRequisitos([{ cursoId:1,cursoObrigatorioId:1 }]), e=>e.codigo==='REQUISITO_PROPRIO_CURSO');
  assert.throws(() => rules.validarGrafoRequisitos([{cursoId:1,cursoObrigatorioId:2},{cursoId:2,cursoObrigatorioId:3},{cursoId:3,cursoObrigatorioId:1}]), e=>e.codigo==='REQUISITOS_CURSOS_CICLICOS');
});
test('salva e remove regras apenas do curso e da instituição selecionados', async () => {
  const f=fixture();f.state.cursoRequisitoConjunto.push({instituicaoId:9,cursoId:8,cursoObrigatorioId:7});
  await rules.salvarRequisitosCursos(f.db,7,2,[1,3]);assert.equal(f.state.cursoRequisitoConjunto.length,3);
  await rules.salvarRequisitosCursos(f.db,7,2,[]);assert.deepEqual(f.state.cursoRequisitoConjunto,[{instituicaoId:9,cursoId:8,cursoObrigatorioId:7}]);
});
test('omitir configuração preserva as regras existentes', async () => {
  const f=fixture();await rules.salvarRequisitosCursos(f.db,7,2,undefined);assert.equal(f.calls.length,0);
});
test('configuração rejeita curso externo, excluído, inativo e ciclos sem gravar', async () => {
  for(const change of ['externo','excluido','inativo','ciclo']){
    const f=fixture();if(change==='externo')f.state.curso[0].instituicaoId=9;
    if(change==='excluido')f.state.curso[0].excluidoEm=new Date();if(change==='inativo')f.state.curso[0].ativo=false;
    if(change==='ciclo')f.state.cursoRequisitoConjunto.push({instituicaoId:7,cursoId:1,cursoObrigatorioId:2});
    await assert.rejects(rules.salvarRequisitosCursos(f.db,7,2,[1]));assert.ok(!f.calls.some(c=>c.write));
  }
});
test('não transporta requisitos para uma instituição independente da rede', async () => {
  const f=fixture();f.state.cursoPublicacaoRede.push({cursoOrigemId:2,instituicaoOrigemId:7});
  await assert.rejects(rules.salvarRequisitosCursos(f.db,7,2,[1]),e=>e.codigo==='REQUISITOS_CURSOS_REDE');
});
test('curso sem requisito mantém o comportamento anterior e não consulta matrículas', async () => {
  const f=fixture();assert.deepEqual(plain(await rules.validarRequisitosCursos(f.db,7,request({cursoIds:[3]}))),[]);
  assert.ok(!f.calls.some(c=>c.model==='matricula'));
});
test('curso dependente sozinho é impedido com nomes dos cursos faltantes', async () => {
  const f=fixture();await pending(rules.validarRequisitosCursos(f.db,7,request()));assert.ok(!f.calls.some(c=>c.write));
});
test('curso obrigatório na mesma contratação libera em qualquer ordem de seleção', async () => {
  for(const ids of [[2,1],[1,2]]){const f=fixture();const res=await rules.validarRequisitosCursos(f.db,7,request({cursoIds:ids}));assert.equal(res[0].matriculaId,null);}
});
test('matrícula já ativa no mesmo período libera sem cobrar o curso novamente', async () => {
  const f=fixture();f.state.matricula.push(active());const res=await rules.validarRequisitosCursos(f.db,7,request());assert.equal(res[0].matriculaId,10);assert.ok(!f.calls.some(c=>c.write));
});
test('concluído, cancelado, trancado, suspenso, excluído e outro aluno não atendem à regra', async () => {
  for(const extra of [{status:'CONCLUIDA'},{status:'CANCELADA'},{status:'TRANCADA'},{status:'SUSPENSA'},{status:'A_INICIAR'},{excluidaEm:new Date()},{canceladaEm:new Date()},{alunoId:6},{instituicaoId:9}]){
    const f=fixture();f.state.matricula.push(active(extra));await pending(rules.validarRequisitosCursos(f.db,7,request()));
  }
});
test('período diferente, ausente ou datas incompatíveis não satisfazem vínculo existente', async () => {
  for(const extra of [{periodoLetivo:'2026'},{periodoLetivo:null},{dataInicioCurso:date('2027-04-01')},{turmaPrincipal:{cursoId:1,periodoLetivo:'2027',dataFim:date('2027-02-28')}}]){
    const f=fixture();f.state.matricula.push(active(extra));await pending(rules.validarRequisitosCursos(f.db,7,request()));
  }
});
test('curso obrigatório ativo em matrícula de modalidades é reconhecido pelos itens ativos', async () => {
  const f=fixture();f.state.matricula.push(active({cursoId:null,itens:[{instituicaoId:7,status:'EM_CURSO',turma:{instituicaoId:7,cursoId:1,periodoLetivo:'2027',dataInicio:null,dataFim:null}}]}));
  assert.equal((await rules.validarRequisitosCursos(f.db,7,request()))[0].matriculaId,10);
});
test('item cancelado não libera e a própria matrícula em edição não vale como requisito', async () => {
  const f=fixture();f.state.matricula.push(active({cursoId:null,itens:[{instituicaoId:7,status:'CANCELADO',turma:{instituicaoId:7,cursoId:1}}]}));await pending(rules.validarRequisitosCursos(f.db,7,request()));
  f.state.matricula=[active()];await pending(rules.validarRequisitosCursos(f.db,7,request({matriculaId:10})));
});
test('todos os requisitos configurados são exigidos, incluindo encadeamento de novos cursos', async () => {
  const f=fixture();f.state.cursoRequisitoConjunto.push({instituicaoId:7,cursoId:1,cursoObrigatorioId:3});
  await assert.rejects(rules.validarRequisitosCursos(f.db,7,request({cursoIds:[2,1]})),e=>e.detalhes.faltantes[0].obrigatorioId===3);
  assert.equal((await rules.validarRequisitosCursos(f.db,7,request({cursoIds:[2,1,3]}))).length,2);
});
test('curso obrigatório desativado não é aceito, mesmo se for enviado junto', async () => {
  const f=fixture();f.state.curso[0].ativo=false;await pending(rules.validarRequisitosCursos(f.db,7,request({cursoIds:[2,1]})));
});
test('curso livre exige cobertura contínua das datas, sem aceitar período expirado ou cancelado', async () => {
  const f=fixture();f.state.matricula.push(active({organizacaoCurricular:'LIVRE',periodosCursoLivre:[
    {instituicaoId:7,dataInicio:date('2027-03-01'),dataFim:date('2027-03-07'),lancamento:{status:'PENDENTE'}},
    {instituicaoId:7,dataInicio:date('2027-03-08'),dataFim:date('2027-03-14'),lancamento:{status:'PAGO'}},
  ]}));
  assert.equal((await rules.validarRequisitosCursos(f.db,7,request({fim:date('2027-03-14')}))).length,1);
  f.state.matricula[0].periodosCursoLivre[1].lancamento.status='CANCELADO';await pending(rules.validarRequisitosCursos(f.db,7,request({fim:date('2027-03-14')})));
  await pending(rules.validarRequisitosCursos(f.db,7,request({inicio:date('2027-04-01')})));
});
test('cobertura de período não ignora lacunas nem depende da ordem dos intervalos', () => {
  assert.equal(rules.cobrirIntervaloLivre([{dataInicio:date('2027-03-08'),dataFim:date('2027-03-14')},{dataInicio:date('2027-03-01'),dataFim:date('2027-03-07')}],date('2027-03-01'),date('2027-03-14')),true);
  assert.equal(rules.cobrirIntervaloLivre([{dataInicio:date('2027-03-01'),dataFim:date('2027-03-06')},{dataInicio:date('2027-03-08'),dataFim:date('2027-03-14')}],date('2027-03-01'),date('2027-03-14')),false);
});
test('validação de requisitos não altera os cálculos financeiros existentes', async () => {
  const f=fixture();const cursos=[1,2].map(id=>({id,nome:'Curso '+id,participaCombo:true,valorMatricula:98.5,valorMensalidade:139,valorMensalidadeCombo:120,quantidadeParcelas:12}));
  const antes=plain(combos.calcularContratacaoModalidades(cursos,[]));await rules.validarRequisitosCursos(f.db,7,request({cursoIds:[1,2]}));assert.deepEqual(plain(combos.calcularContratacaoModalidades(cursos,[])),antes);
});
test('mensagem da interface informa a dependência sem expor informações do aluno', () => {
  const t=(k,v={})=>k+':'+Object.values(v).join('|');const msg=ui.mensagemRequisitoCurso(t,{codigo:'CURSO_CONJUNTO_PENDENTE',detalhes:{faltantes:[{cursoNome:'Balé',obrigatorioNome:'PEVI'}]}});assert.match(msg,/Balé/);assert.match(msg,/PEVI/);
});
test('traduções completas e simétricas nos cinco idiomas', () => {
  let keys;for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']){const d=JSON.parse(fs.readFileSync(path.join(root,'messages',locale+'.json')));const actual=Object.keys(d.CourseRequirements).sort();if(keys)assert.deepEqual(actual,keys);else keys=actual;assert.ok(d.EnrollmentCombos.errors.CURSO_CONJUNTO_PENDENTE);assert.ok(d.CoursePeriods.errors.CURSO_CONJUNTO_PENDENTE);}
});
test('aplicador identifica apenas a migração específica e reconhece banco atualizado', () => {
  const helper=require('../scripts/aplicar-migracao-requisitos-cursos.cjs');
  assert.deepEqual(helper.pendentesDaSaida('Following migration have not yet been applied:\n'+helper.TARGET+'\n\nTo apply migrations'),[helper.TARGET]);
  assert.deepEqual(helper.pendentesDaSaida('Database schema is up to date!'),[]);
  assert.throws(()=>helper.pendentesDaSaida('Connection error'));
});

test('número de etapa isolado não é aceito como identificação de período letivo', async () => {
 const f=fixture();f.state.matricula.push(active({periodoLetivo:'1'}));await pending(rules.validarRequisitosCursos(f.db,7,request({periodoLetivo:'1'})));
});
