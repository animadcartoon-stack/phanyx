const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { validarMensagemTraduzida } = require('./reatribuicao-traducoes-assert.cjs');
const raiz = path.resolve(__dirname, '..');
const fonte = fs.readFileSync(path.join(raiz, 'lib/matriculas/reatribuicao-execucao.ts'), 'utf8');
const tsc = ts.transpileModule(fonte, { compilerOptions: { target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS }, reportDiagnostics: true });
assert.equal(tsc.diagnostics?.length || 0, 0, 'Sintaxe TypeScript inválida');
const modulo = { exports: {} };
new Function('module', 'exports', tsc.outputText)(modulo, modulo.exports);
const { execucaoHabilitada, validarConfirmacaoReatribuicao: validar,
  conferirRestricoesOrigem: restricoes, conferirPlanoExecutavel: plano,
  conferirDatasExecucao: datas, numeroHistorico } = modulo.exports;
let total = 0;
function testar(fn) { fn(); total++; }
const pedido = { transferenciaId: 13, primeiroVencimento: '2027-02-10',
  referenciaTermoAssinado: 'Documento assinado 247',
  reconheceAutorizacao: true, confirmacaoDigitada: 'REATRIBUIR' };
const ambiente = { flag: 'true', seloHomologacao: 'HOMOLOGACAO', vercelEnv: 'preview', nodeEnv: 'production',
  databaseUrl: 'postgresql://teste:senha-ficticia@ep-test-branch.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  hostAutorizado: 'ep-test-branch.sa-east-1.aws.neon.tech' };
testar(() => assert.equal(execucaoHabilitada(ambiente), true));
for(const x of [
  { flag: 'false' }, { seloHomologacao: undefined }, { seloHomologacao: 'PRODUCAO' }, { flag: undefined }, { vercelEnv: 'production' },
  { nodeEnv: 'production', vercelEnv: undefined }, { vercelEnv: 'test', nodeEnv: 'production' },
  { databaseUrl: undefined }, { hostAutorizado: undefined },
  { hostAutorizado: 'ep-outra-branch.sa-east-1.aws.neon.tech' },
]) testar(() => assert.equal(execucaoHabilitada({ ...ambiente, ...x }), false));
testar(() => assert.equal(execucaoHabilitada({ ...ambiente, vercelEnv: undefined, nodeEnv: 'development' }), true));
testar(() => assert.equal(validar(pedido).transferenciaId, 13));
for (const a of [
  null, [], 'x', {}, { ...pedido, transferenciaId: 0 }, { ...pedido, transferenciaId: '13' },
  { ...pedido, primeiroVencimento: '2027-02-30' }, { ...pedido, primeiroVencimento: '10/02/2027' },
  { ...pedido, referenciaTermoAssinado: 'a' }, { ...pedido, referenciaTermoAssinado: '\r\nx' },
  { ...pedido, referenciaTermoAssinado: 'x'.repeat(181) },
  { ...pedido, reconheceAutorizacao: false }, { ...pedido, reconheceAutorizacao: 'true' },
  { ...pedido, confirmacaoDigitada: 'CONFIRMAR' }, { ...pedido, confirmacaoDigitada: 'reatribuir' },
]) testar(() => assert.throws(() => validar(a)));
const contagem = { lancamentos: 0, cobrancas: 0, contratosAssinados: 0,
  documentosAssinados: 0, documentosAssinaveis: 0, trancamentos: 0, cancelamentos: 0,
  rematriculas: 0, periodosCursoLivre: 0 };
testar(() => assert.equal(restricoes(contagem), true));
for(const key of Object.keys(contagem)) testar(() => assert.throws(() =>
  restricoes({ ...contagem, [key]: 1 }), undefined, key));
testar(() => assert.throws(() => restricoes({ ...contagem, cobrancas: -1 })));
testar(() => assert.throws(() => restricoes({ ...contagem, contratosAssinados: 1.5 })));
const snapshot = { finalidade: 'PLANO_ACADEMICO_SEM_EXECUCAO', matriculaOrigemId: 7,
  alunoOrigemId: 11, alunoDestinoId: 12, turmaIds: [3],
  dataInicioCurso: '2027-02-01', versaoOfertas: 'a'.repeat(64) };
const base = { snapshot, matriculaId: 7, alunoOrigemId: 11, alunoDestinoId: 12 };
testar(() => assert.equal(plano(base).dataInicioCurso, '2027-02-01'));
for (const alteracao of [
  { snapshot: null }, { matriculaId: 13 }, { alunoOrigemId: 12 },
  { alunoDestinoId: 11 }, { snapshot: { ...snapshot, turmaIds: [] } },
  { snapshot: { ...snapshot, versaoOfertas: 'a' } },
  { snapshot: { ...snapshot, dataInicioCurso: '2027-02-30' } },
  { snapshot: { ...snapshot, finalidade: 'SUCESSAO_CONCLUIDA' } },
]) testar(() => assert.throws(() => plano({ ...base, ...alteracao })));
const dias = { hoje: '2026-11-10', dataTransferencia: '2026-11-10',
  dataInicioCurso: '2027-02-01', primeiroVencimento: '2027-02-10' };
testar(() => assert.equal(datas(dias), true));
for(const altera of [
  { dataTransferencia: '2026-11-11' }, { dataInicioCurso: '2026-11-09' },
  { primeiroVencimento: '2026-11-09' }, { hoje: '2026-11-31' },
]) testar(() => assert.throws(() => datas({ ...dias, ...altera })));
testar(() => assert.equal(numeroHistorico('PHX-1-2026-000001', 6, 8), 'PHX-1-2026-000001-HIST-6-8'));
for(const x of ['', null, 'x'.repeat(181)]) testar(() => assert.throws(() => numeroHistorico(x, 6, 8)));
testar(() => assert.throws(() => numeroHistorico('X', 0, 8)));
const rota = fs.readFileSync(path.join(raiz, 'app/api/admin/matriculas/[id]/reatribuicao/confirmar/route.ts'), 'utf8');
for(const expect of [
  'administradorCombos', 'PHANYX_REATRIBUICAO_EXECUCAO_HABILITADA',
  'PHANYX_REATRIBUICAO_AMBIENTE_CONFIRMADO',
  'execucaoHabilitada', 'TransactionIsolationLevel.Serializable',
  'FOR UPDATE', 'prepararContratacaoModalidades', 'confirmarContratacaoModalidades',
  'conferirRestricoesOrigem', 'conferirOrigemProposta', 'bloquearSessoesOptativas',
  'origemOfertaVinculada', 'snapshotAnterior', 'snapshotPosterior', 'matriculaDestinoId',
  'TRANSFERIDA', 'CONCLUIDA', 'PENDENTE', 'contratosAssinados', 'documentosAssinados',
  'referenciaTermoAssinado', 'numeroHistorico', 'Cache-Control', 'erroCombos',
  'contrato.updateMany', 'contratosAnterioresPendentesCancelados', 'documentosAssinaveis',
]) testar(() => assert.ok(rota.includes(expect), expect));
testar(() => assert.ok(!rota.includes('fetch('), 'Não integrar HTTP nem Asaas na transação'));
testar(() => assert.ok(!rota.includes('deleteMany'), 'Não apagar histórico'));
testar(() => assert.ok(!rota.includes('alunoId: transferencia.alunoDestinoId } });'), 'Não alterar o aluno da matrícula original'));
const ui = fs.readFileSync(path.join(raiz, 'components/admin/ReatribuicaoAlunoAnalise.tsx'), 'utf8');
for (const expect of ['reconheceAutorizacao', 'referenciaTermoAssinado', 'execucaoDisponivel'])
  testar(() => assert.ok(ui.includes(expect), expect));
for (const [chave, texto] of [
  ['controlledTitle', 'Confirmação controlada'],
  ['typeConfirm', 'Digite REATRIBUIR'],
  ['confirmTest', 'Confirmar sucessão em homologação'],
  ['openSuccessor', 'Abrir matrícula sucessora'],
  ['execDisabled', 'Em produção nenhuma transferência'],
]) testar(() => assert.ok(validarMensagemTraduzida(ui, chave, texto), chave));
testar(() => assert.ok(!/\b(?:alert|prompt|confirm)\s*\(/.test(ui), 'Sem popup nativo'));
console.log(`[OK] Execução controlada: ${total} verificações de autorização, bloqueios e integridade.`);
