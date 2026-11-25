const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const page = read('app/admin/documentos/templates/page.tsx');
const editor = read('components/documentos/EditorTemplatePHANYX.tsx');
function markers(source, list) { for (const item of list) assert.ok(source.includes(item), 'Contrato ausente: '+item); }
// Smoke checks only: these detect missing wiring, not browser behavior.
test('mantém conexões da prévia flutuante e automática', () => markers(page,['pdfFlutuante &&','createPortal(','void visualizarPdfTemplate()','fixed bottom-[104px]','previaAutomatica','/api/admin/documentos/templates/preview-pdf-fiel','src={urlPreviaPdf}']));
test('mantém recuperação e finalização de rascunho', () => markers(page,['rascunho.recuperar()','rascunho.finalizar(payload)','rascunho.descartar()','rascunho.tentarNovamente()']));
test('mantém comandos de formatação do editor', () => markers(editor,['setFontFamily(','FontSize','setColor(','toggleBold()','toggleItalic()','toggleUnderline()','TextAlign.configure(','Segoe Script']));

test('retoma a prévia automática pendente ao voltar à aba e recuperar a conexão', () => {
  const inicio = page.indexOf('  const chavePreviaAutomatica = ');
  const fim = page.indexOf('  function aplicarModeloInicial()', inicio);
  const listeners = new Map();
  const timers = new Map();
  let contador = 0;
  let requisicoes = 0;
  const eventos = {
    addEventListener: (tipo, handler) => listeners.set(tipo, handler),
    removeEventListener: (tipo) => listeners.delete(tipo),
  };
  const document = { ...eventos, visibilityState: 'visible' };
  const navigator = { onLine: true };
  let limpar;
  vm.runInNewContext(ts.transpileModule(page.slice(inicio, fim), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    editingId: null, locale: 'pt-BR', tipo: 'OUTRO', conteudo: 'Plano de aula',
    formatoImpressao: 'A4_INTEIRA', camposVisuais: [],
    previaAutomatica: true, visualizandoPdf: false, erroPreviaPdf: '', saving: false,
    ultimaPrevia: { current: '' }, ultimaRequisicaoPrevia: { current: 0 },
    previaEmCurso: { current: false },
    visualizarPdfTemplate: () => { requisicoes += 1; },
    useRef: current => ({ current }),
    useEffect: fn => { limpar = fn(); },
    document, navigator,
    window: {
      ...eventos,
      setTimeout: fn => { timers.set(++contador, fn); return contador; },
      clearTimeout: id => timers.delete(id),
    },
  });
  function avancarTempo() {
    for (const [id, executar] of timers) {
      timers.delete(id);
      executar();
    }
  }
  document.visibilityState = 'hidden';
  avancarTempo();
  assert.equal(requisicoes, 0);
  navigator.onLine = false;
  document.visibilityState = 'visible';
  listeners.get('visibilitychange')?.();
  avancarTempo();
  assert.equal(requisicoes, 0);
  navigator.onLine = true;
  listeners.get('online')?.();
  avancarTempo();
  assert.equal(requisicoes, 1);
  limpar();
  assert.equal(listeners.size, 0);
});
