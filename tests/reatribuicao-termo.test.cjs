const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { validarMensagemTraduzida } = require('./reatribuicao-traducoes-assert.cjs');
const raiz = path.resolve(__dirname, '..');
const codigo = fs.readFileSync(path.join(raiz, 'lib/matriculas/reatribuicao-termo.ts'), 'utf8');
const saida = ts.transpileModule(codigo, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal(saida.diagnostics?.length || 0, 0);
const modulo = { exports: {} };
new Function('module', 'exports', saida.outputText)(modulo, modulo.exports);
const { gerarMinutaReatribuicao: gerar } = modulo.exports;
let total = 0;
function t(fn) { fn(); total++; }
const entrada = {
  instituicao: 'Instituto Exemplo', numeroMatricula: 'PHX-12-2026-000021', matriculaId: 21,
  transferenciaId: 7,
  origem: { nome: 'Aluno Original', cpf: '000.000.000-00', responsavelNome: 'Responsavel Original', responsavelCpf: '111.111.111-11' },
  destino: { nome: 'Aluno Novo', cpf: '222.222.222-22', responsavelNome: 'Responsavel Novo', responsavelCpf: '333.333.333-33' },
  dataTransferencia: new Date('2027-01-15T12:00:00Z'), dataInicio: '2027-02-01',
  motivo: 'Solicitação de substituição conforme autorização', observacoes: null,
  ofertas: [{ cursoNome: 'Robótica', turmaNome: '1M' }, { cursoNome: 'IA', turmaNome: '2M' }],
  financeiro: { lancamentos: 3, pagosOuParciais: 1, titulos: 2, titulosExternos: 1 },
  contratos: 1, documentos: 2,
};
const resultado = gerar(entrada);
t(() => assert.equal(resultado.tipo, 'MINUTA_NAO_ASSINADA'));
t(() => assert.equal(resultado.versao, 1));
t(() => assert.equal(resultado.matriculaOrigemId, 21));
t(() => assert.equal(resultado.transferenciaId, 7));
t(() => assert.equal(resultado.podeExecutarTransferencia, false));
t(() => assert.equal(resultado.financeiroExigeRevisao, true));
t(() => assert.equal(resultado.assinaturasPendentes.length, 3));
for(const palavra of [
  'MINUTA', 'NÃO ASSINADA', 'PHX-12-2026-000021', 'Instituto Exemplo',
  'Aluno Original', 'Aluno Novo', 'Responsavel Original', 'Responsavel Novo',
  '000.000.000-00', '222.222.222-22', '15/01/2027', '01/02/2027',
  'Robótica', '1M', 'IA', '2M', 'Solicitação de substituição',
  '3 lançamento(s)', '1 pago(s)/parcial(is)', '2 título(s)', '1 integrado(s)',
  '1 contrato(s)', '2 documento(s)', 'não efetiva', 'não altera',
  'Sem efeito de transferência'.toUpperCase(),
]) t(() => assert.ok(resultado.texto.toUpperCase().includes(palavra.toUpperCase()), palavra));
t(() => assert.equal(gerar({ ...entrada, financeiro: {
  lancamentos: 0, pagosOuParciais: 0, titulos: 0, titulosExternos: 0,
}}).financeiroExigeRevisao, false));
t(() => assert.ok(gerar({ ...entrada, numeroMatricula: null, observacoes: null }).texto.includes('não informado')));
t(() => assert.ok(gerar({ ...entrada, observacoes: 'Não usar dados adicionais' }).texto.includes('Não usar dados adicionais')));
t(() => assert.ok(!gerar({ ...entrada, motivo: 'Teste\r\ninjeção' }).texto.includes('Teste\r\n')));
t(() => assert.ok(!gerar({ ...entrada, ofertas: [{ cursoNome: 'A\nB', turmaNome: 'X\r\nY' }] }).texto.includes('A\nB')));
for(const altera of [
  { matriculaId: 0 }, { matriculaId: 1.5 }, { transferenciaId: -1 },
  { dataTransferencia: new Date('invalid') }, { dataTransferencia: '2027-01-15' },
  { dataInicio: '2027-02-30' }, { dataInicio: '01/02/2027' },
  { ofertas: [] }, { ofertas: new Array(25).fill({ cursoNome: 'X', turmaNome: 'Y' }) },
  { financeiro: { ...entrada.financeiro, pagosOuParciais: 99 } },
  { financeiro: { ...entrada.financeiro, titulosExternos: 99 } },
  { financeiro: { ...entrada.financeiro, lancamentos: -1 } },
  { financeiro: { ...entrada.financeiro, titulos: 2.2 } },
  { contratos: -1 }, { documentos: -1 },
]) t(() => assert.throws(() => gerar({ ...entrada, ...altera })));
const rota = fs.readFileSync(path.join(raiz, 'app/api/admin/matriculas/[id]/reatribuicao/termo/route.ts'), 'utf8');
t(() => assert.ok(rota.includes('administradorCombos')));
t(() => assert.ok(rota.includes('instituicaoId')));
t(() => assert.ok(rota.includes('snapshotAnterior')));
t(() => assert.ok(rota.includes('PLANO_ACADEMICO_SEM_EXECUCAO')));
t(() => assert.ok(rota.includes('RepeatableRead')));
t(() => assert.ok(rota.includes('Cache-Control')));
t(() => assert.ok(!/export (async )?function (POST|PATCH|PUT|DELETE)/.test(rota)));
t(() => assert.ok(!/tx\.[a-zA-Z]+\.(update|delete|create|upsert|updateMany|createMany|deleteMany)\s*\(/.test(rota)));
const ui = fs.readFileSync(path.join(raiz, 'components/admin/ReatribuicaoAlunoAnalise.tsx'), 'utf8');
t(() => assert.ok(validarMensagemTraduzida(ui, 'generateDraft', 'Gerar minuta para conferência')));
t(() => assert.ok(validarMensagemTraduzida(ui, 'copyDraft', 'Copiar minuta')));
t(() => assert.ok(ui.includes('navigator.clipboard.writeText')));
t(() => assert.ok(!/\b(?:alert|prompt|confirm)\s*\(/.test(ui)));
t(() => assert.ok(ui.includes('readOnly rows={22}')));
console.log(`[OK] Minuta documental: ${total} verificações e rota de leitura protegida.`);
