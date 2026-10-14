/* Exercita a busca real sem consultar o banco nem abrir arquivos da instituição. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const arquivo = path.resolve(__dirname, '../lib/biblioteca-busca-pdf.ts');
const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const modulo = { exports: {} };
vm.runInNewContext('(function(exports,module){' + codigo + '\n})')(modulo.exports, modulo);
const { localizarTermoPdf } = modulo.exports;
let testes = 0;
function teste(nome, verificar) { verificar(); testes++; }
function trechos(texto, termo, limite) { return Array.from(localizarTermoPdf(texto, termo, limite), m => texto.slice(m.inicio, m.fim)); }
teste('maiúsculas e repetições', () => assert.deepEqual(trechos('memória MEMÓRIA Memória', 'memória'), ['memória', 'MEMÓRIA', 'Memória']));
teste('consulta sem acento', () => assert.deepEqual(trechos('A memória permanece', 'memoria'), ['memória']));
teste('texto sem acento', () => assert.deepEqual(trechos('memoria', 'memória'), ['memoria']));
teste('acento decomposto', () => assert.deepEqual(trechos('memo\u0301ria', 'memória'), ['memo\u0301ria']));
teste('frase com espaços e quebra', () => assert.deepEqual(trechos('memória\n  e\tvida', 'memória e vida'), ['memória\n  e\tvida']));
teste('consulta vazia', () => assert.equal(trechos('texto', '   ').length, 0));
teste('consulta inexistente', () => assert.equal(trechos('texto', 'ausente').length, 0));
teste('limite de ocorrências', () => assert.equal(trechos('a a a', 'a', 2).length, 2));
teste('limite zero', () => assert.equal(trechos('a a a', 'a', 0).length, 0));
teste('pontuação literal', () => assert.deepEqual(trechos('a+b e a.b', 'a+b'), ['a+b']));
teste('offset depois de emoji', () => assert.deepEqual(trechos('📖 memória', 'memoria'), ['memória']));
teste('acentos em vários caracteres', () => assert.deepEqual(trechos('AÇÃO, ação e educação', 'acao'), ['AÇÃO', 'ação', 'ação']));
console.log('OK: ' + testes + ' cenários de busca, acentos, offsets, frases e limites.');
