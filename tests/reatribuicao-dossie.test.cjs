const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { validarMensagemTraduzida } = require('./reatribuicao-traducoes-assert.cjs');
const raiz = path.resolve(__dirname, '..');
const arquivo = fs.readFileSync(path.join(raiz, 'lib/matriculas/reatribuicao-dossie.ts'), 'utf8');
const { outputText, diagnostics } = ts.transpileModule(arquivo, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal(diagnostics?.length || 0, 0);
const mod = { exports: {} };
new Function('module', 'exports', outputText)(mod, mod.exports);
const { classificarLancamentosReatribuicao: classificar, estrategiaIntegridadeReatribuicao: estrategia } = mod.exports;
let total = 0;
function testar(fn) { fn(); total++; }
const base = {
  id: 9, alunoId: 7, tipo: 'MENSALIDADE', status: 'PENDENTE',
  valorOriginal: 250, valorPago: 0, valorFinal: 250,
  vencimento: new Date('2026-12-10'), pagoEm: null,
  pagamentosRegistrados: 0, movimentosCaixaRegistrados: 0,
};
const titulo = {
  id: 19, alunoId: 7, matriculaId: 3, lancamentoFinanceiroId: 9,
  statusBancario: 'PENDENTE', statusOperacional: 'AGUARDANDO_PAGAMENTO',
  cobrancaExternaId: null, clienteExternoId: null,
  pagoEm: null, compensadoEm: null, baixadoEm: null,
};
function tipoLancamento(modifica = {}, titulos = []) {
  return classificar(7, [{ ...base, ...modifica }], titulos).linhas[0];
}
testar(() => assert.equal(tipoLancamento().grupo, 'SEM_MOVIMENTACAO_IDENTIFICADA'));
testar(() => assert.equal(tipoLancamento({ status: 'PAGO' }).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento({ status: 'PARCIAL' }).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento({ valorPago: 5 }).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento({ pagamentosRegistrados: 1 }).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento({ movimentosCaixaRegistrados: 1 }).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento({ pagoEm: new Date() }).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento({}, [titulo]).grupo, 'TITULO_EXISTENTE'));
testar(() => assert.equal(tipoLancamento({ status: 'CANCELADO' }).grupo, 'CANCELADO'));
testar(() => assert.equal(tipoLancamento({ status: 'CANCELADO' }, [titulo]).grupo, 'TITULO_EXISTENTE'));
testar(() => assert.equal(tipoLancamento({ valorPago: 10 }, [titulo]).grupo, 'MOVIMENTADO_OU_PAGO'));
testar(() => assert.equal(tipoLancamento().valorOriginalCentavos, 25000));
testar(() => assert.equal(tipoLancamento({ valorPago: 98.5 }).valorPagoCentavos, 9850));
testar(() => assert.equal(tipoLancamento().alteracaoAutomaticaPermitida, false));
testar(() => assert.equal(tipoLancamento({ alunoId: 8 }).alunoConfere, false));
testar(() => assert.deepEqual(tipoLancamento({}, [titulo]).cobrancasIds, [19]));
const resumo = classificar(7, [base], [{ ...titulo, cobrancaExternaId: 'asaas_123' }]);
testar(() => assert.equal(resumo.totalTitulosExternos, 1));
testar(() => assert.equal(resumo.totalTitulos, 1));
testar(() => assert.equal(resumo.cobrancas[0].integradoProvedor, true));
testar(() => assert.equal(resumo.cobrancas[0].alteracaoAutomaticaPermitida, false));
testar(() => assert.equal(resumo.podeMigrarFinanceiroAutomaticamente, false));
testar(() => assert.equal(classificar(7, [base], [{ ...titulo, alunoId: 42 }]).divergenciaAluno, true));
testar(() => assert.equal(classificar(7, [{ ...base, alunoId: 42 }], []).divergenciaAluno, true));
testar(() => assert.equal(classificar(7, [], []).divergenciaAluno, false));
testar(() => assert.equal(classificar(7, [], []).totalLancamentos, 0));
testar(() => assert.equal(classificar(7, [], []).totalTitulos, 0));
const atualizado = new Date('2026-11-10T10:00:00Z');
const origem = { numeroMatricula: 'PHX-2-2026-000001', origemAtualizadaEm: atualizado,
  snapshotAnterior: { finalidade: 'SOLICITACAO_SEM_EXECUCAO', matriculaId: 3,
    alunoId: 7, atualizadoEm: atualizado.toISOString() },
  alunoOrigemId: 7, matriculaId: 3, quantidadeItens: 1, quantidadeTurmasAvulsas: 0,
  quantidadeContratos: 1, quantidadeDocumentos: 1, quantidadeLancamentos: 1 };
testar(() => assert.equal(estrategia(origem).origemInalterada, true));
testar(() => assert.equal(estrategia(origem).possuiVinculos, true));
testar(() => assert.equal(estrategia(origem).transferenciaHabilitada, false));
testar(() => assert.equal(estrategia(origem).numeroPublicoPreservavelEmSucessora, true));
testar(() => assert.equal(estrategia({ ...origem, origemAtualizadaEm: new Date() }).origemInalterada, false));
testar(() => assert.equal(estrategia({ ...origem, numeroMatricula: null }).numeroPublicoPreservavelEmSucessora, false));
testar(() => assert.equal(estrategia({ ...origem, quantidadeItens: 0, quantidadeContratos: 0,
  quantidadeDocumentos: 0, quantidadeLancamentos: 0 }).possuiVinculos, false));
const rota = fs.readFileSync(path.join(raiz, 'app/api/admin/matriculas/[id]/reatribuicao/dossie/route.ts'), 'utf8');
testar(() => assert.ok(rota.includes('administradorCombos')));
testar(() => assert.ok(rota.includes('instituicaoId')));
testar(() => assert.ok(rota.includes('RepeatableRead')));
testar(() => assert.ok(!/export (async )?function (POST|PATCH|PUT|DELETE)/.test(rota)));
testar(() => assert.ok(!/\.(update|delete|create|upsert|createMany|updateMany|deleteMany)\s*\(/.test(rota)));
testar(() => assert.ok(rota.includes('Cache-Control')));
const tela = fs.readFileSync(path.join(raiz, 'components/admin/ReatribuicaoAlunoAnalise.tsx'), 'utf8');
testar(() => assert.ok(validarMensagemTraduzida(tela, 'prepareDossier', 'Preparar dossiê de sucessão')));
testar(() => assert.ok(tela.includes('podeExecutarTransferencia: false')));
console.log(`[OK] Dossiê de sucessão: ${total} verificações, consulta somente leitura e integridade do financeiro.`);
