const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { validarMensagemTraduzida } = require('./reatribuicao-traducoes-assert.cjs');
const raiz = path.resolve(__dirname, '..');
const file = fs.readFileSync(path.join(raiz, 'lib/matriculas/reatribuicao-parecer.ts'), 'utf8');
const { outputText, diagnostics } = ts.transpileModule(file, { compilerOptions: {
  target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
}, reportDiagnostics: true });
assert.equal(diagnostics?.length || 0, 0, 'Falha sintática no parecer');
const modulo = { exports: {} };
new Function('module', 'exports', outputText)(modulo, modulo.exports);
const { montarParecerReatribuicao: parecer } = modulo.exports;
let testes = 0;
function testar(cb) { cb(); testes++; }
const atualizado = new Date('2026-11-10T10:00:00.000Z');
const base = {
  matricula: { alunoId: 7, status: 'A_INICIAR', canceladaEm: null, updatedAt: atualizado },
  transferencia: { tipo: 'REATRIBUICAO_ALUNO', status: 'PENDENTE', alunoOrigemId: 7,
    alunoDestinoId: 14, snapshotAnterior: { finalidade: 'SOLICITACAO_SEM_EXECUCAO',
      alunoId: 7, atualizadoEm: atualizado.toISOString() } },
  destinoValido: true, planoSalvo: true, planoConsistente: true, ofertasRevalidadas: true,
  contagens: { presencas: 0, notas: 0, presencasOptativas: 0, resultados: 0,
    progresso: 0, sessoesVideo: 0, eventosAprendizagem: 0, entregas: 0,
    lancamentos: 0, cobrancas: 0, contratos: 0, documentosGerados: 0,
    documentosAluno: 0, trancamentos: 0, cancelamentos: 0,
    rematriculas: 0, periodosCursoLivre: 0 },
};
testar(() => assert.equal(parecer(base).quantidadeImpedimentos, 0));
testar(() => assert.equal(parecer(base).podeExecutarTransferencia, false));
testar(() => assert.equal(parecer(base).semImpedimentosIdentificados, true));
const casos = [
  [{ transferencia: { ...base.transferencia, tipo: 'POLO' } }, 'SOLICITACAO_INVALIDA'],
  [{ transferencia: { ...base.transferencia, status: 'CONCLUIDA' } }, 'SOLICITACAO_INVALIDA'],
  [{ transferencia: { ...base.transferencia, alunoOrigemId: 6 } }, 'SOLICITACAO_INVALIDA'],
  [{ transferencia: { ...base.transferencia, alunoDestinoId: 7 } }, 'SOLICITACAO_INVALIDA'],
  [{ matricula: { ...base.matricula, status: 'CANCELADA' } }, 'STATUS_MATRICULA_INVALIDO'],
  [{ matricula: { ...base.matricula, canceladaEm: new Date() } }, 'STATUS_MATRICULA_INVALIDO'],
  [{ matricula: { ...base.matricula, updatedAt: new Date('2026-11-11T10:00:00.000Z') } }, 'MATRICULA_ALTERADA'],
  [{ destinoValido: false }, 'ALUNO_DESTINO_INVALIDO'],
  [{ planoSalvo: false }, 'PLANO_NAO_SALVO'],
  [{ planoConsistente: false }, 'PLANO_DESATUALIZADO'],
  [{ ofertasRevalidadas: false }, 'OFERTAS_NAO_REVALIDADAS'],
];
for (const [alteracao, esperado] of casos) testar(() => {
  const r = parecer({ ...base, ...alteracao });
  assert.ok(r.impedimentos.some(i => i.codigo === esperado), esperado);
  assert.equal(r.podeExecutarTransferencia, false);
});
const categorias = [
  ['presencas', 'HISTORICO_ACADEMICO'], ['notas', 'HISTORICO_ACADEMICO'],
  ['presencasOptativas', 'HISTORICO_ACADEMICO'], ['resultados', 'HISTORICO_ACADEMICO'],
  ['progresso', 'HISTORICO_ACADEMICO'], ['sessoesVideo', 'HISTORICO_ACADEMICO'],
  ['eventosAprendizagem', 'HISTORICO_ACADEMICO'], ['entregas', 'HISTORICO_ACADEMICO'],
  ['lancamentos', 'FINANCEIRO_EXISTENTE'], ['cobrancas', 'COBRANCAS_EXISTENTES'],
  ['contratos', 'CONTRATOS_EXISTENTES'], ['documentosGerados', 'DOCUMENTOS_EXISTENTES'],
  ['documentosAluno', 'DOCUMENTOS_EXISTENTES'], ['trancamentos', 'EVENTOS_MATRICULA'],
  ['cancelamentos', 'EVENTOS_MATRICULA'], ['rematriculas', 'EVENTOS_MATRICULA'],
  ['periodosCursoLivre', 'EVENTOS_MATRICULA'],
];
for(const [campo, codigo] of categorias) testar(() => {
  const r = parecer({ ...base, contagens: { ...base.contagens, [campo]: 1 } });
  assert.ok(r.impedimentos.some(i => i.codigo === codigo), campo);
  assert.equal(r.podeExecutarTransferencia, false);
});
testar(() => assert.equal(parecer({ ...base, contagens: { ...base.contagens,
  notas: 2, presencas: 3 } }).contagens.historicoAcademico, 5));
testar(() => assert.equal(parecer({ ...base, contagens: { ...base.contagens,
  lancamentos: 1, cobrancas: 2, contratos: 1 } }).quantidadeImpedimentos, 3));
const rota = fs.readFileSync(path.join(raiz, 'app/api/admin/matriculas/[id]/reatribuicao/parecer/route.ts'), 'utf8');
testar(() => assert.ok(rota.includes('administradorCombos')));
testar(() => assert.ok(rota.includes('instituicaoId')));
testar(() => assert.ok(rota.includes('prepararContratacaoModalidades')));
testar(() => assert.ok(rota.includes('RepeatableRead')));
testar(() => assert.ok(!/export (async )?function (POST|PATCH|PUT|DELETE)/.test(rota)));
testar(() => assert.ok(!/\.(update|delete|create|upsert|createMany|updateMany|deleteMany)\s*\(/.test(rota)));
const tela = fs.readFileSync(path.join(raiz, 'components/admin/ReatribuicaoAlunoAnalise.tsx'), 'utf8');
testar(() => assert.ok(validarMensagemTraduzida(tela, 'checkObstacles', 'Conferir impedimentos')));
testar(() => assert.ok(tela.includes('podeExecutarTransferencia: false')));
console.log(`[OK] Parecer de integridade: ${testes} verificações e nenhuma rota de execução.`);
