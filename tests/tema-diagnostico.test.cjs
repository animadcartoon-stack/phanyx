const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function carregar(arquivo, globais = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(require.resolve(arquivo), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(js, { exports, URL, Event, ...globais });
  return exports;
}

test('tema cinza mantém contraste escuro em todas as rotas privadas e não altera rotas públicas', () => {
  const dataset = {}, classes = new Set(), eventos = [];
  let mutacoes = 0;
  const root = {
    dataset,
    getAttribute: nome => nome === 'data-theme' ? dataset.theme ?? null : null,
    removeAttribute: () => { delete dataset.theme; mutacoes++; },
    classList: { contains: c => classes.has(c), toggle: (c, valor) => {
      mutacoes++; valor ? classes.add(c) : classes.delete(c);
    } },
  };
  const { aplicarTemaPhanyx, normalizarTemaPhanyx, lerTemaPhanyx } = carregar('../lib/tema-phanyx.ts', {
    document: { documentElement: root },
    window: { dispatchEvent: e => eventos.push(e.type) },
    localStorage: { getItem: () => { throw new Error('storage indisponível'); } },
  });
  assert.equal(lerTemaPhanyx(), 'light');
  assert.equal(normalizarTemaPhanyx('inesperado'), 'light');
  for (const rota of ['/admin/turmas', '/professor', '/aluno/notas', '/master']) {
    aplicarTemaPhanyx('system', rota);
    assert.equal(dataset.theme, 'system');
    assert.equal(dataset.themeChoice, 'system');
    assert.equal(classes.has('dark'), true);
  }
  const anteriores = mutacoes;
  aplicarTemaPhanyx('system', '/admin/cursos');
  assert.equal(mutacoes, anteriores, 'navegação não reaplica atributos idênticos');
  assert.equal(eventos.length, 1);
  aplicarTemaPhanyx('dark', '/admin');
  assert.equal(dataset.theme, 'dark');
  aplicarTemaPhanyx('light', '/admin');
  assert.equal(classes.has('dark'), false);
  aplicarTemaPhanyx('system', '/administracao-publica');
  assert.equal(dataset.theme, undefined);
  assert.equal(dataset.themeChoice, 'public');
  assert.equal(classes.has('dark'), false);
});

test('diagnóstico exclui consultas, fragmentos, IDs e origens externas', () => {
  const { caminhoDiagnostico } = carregar('../lib/diagnostico-desempenho.ts');
  const origem = 'https://www.phanyx.com.br';
  assert.equal(caminhoDiagnostico('/api/admin/alunos/123?token=segredo&email=privado#foto', origem), '/api/admin/alunos/:id');
  assert.equal(caminhoDiagnostico('/admin/cursos/20', origem), '/admin/cursos/:id');
  assert.equal(caminhoDiagnostico('https://outro.example/api/admin', origem), null);
  assert.equal(caminhoDiagnostico('/login?email=privado', origem), null);
  assert.equal(caminhoDiagnostico('/admin-publico', origem), null);
});

test('diagnóstico limita a memória e registra quantas amostras foram descartadas', () => {
  const { criarRegistroDesempenho } = carregar('../lib/diagnostico-desempenho.ts');
  const registro = criarRegistroDesempenho();
  for (let i = 0; i < 1000; i++) registro.adicionar('interacoes', { inicioMs: i, duracaoMs: 80 });
  const dados = registro.exportar();
  assert.equal(dados.amostras.interacoes.length, 150);
  assert.equal(dados.amostras.interacoes[0].inicioMs, 850);
  assert.equal(dados.descartadas.interacoes, 850);
  assert.equal(criarRegistroDesempenho().exportar().amostras.interacoes.length, 0);
});

test('medição opcional gera relatório local e desliga os observadores ao terminar', async () => {
  const efeitos = [], observadores = [], timers = [], encerrados = [];
  let blob, download;
  class Observer {
    static supportedEntryTypes = ['longtask', 'event', 'resource', 'navigation'];
    constructor(callback) { this.callback = callback; observadores.push(this); }
    observe(options) { this.options = options; }
    disconnect() { this.desligado = true; }
    emitir(entry) { this.callback({ getEntries: () => [entry] }); }
  }
  class URLLocal extends URL {
    static createObjectURL(valor) { blob = valor; return 'blob:relatorio'; }
    static revokeObjectURL() {}
  }
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(require.resolve('../components/admin/DiagnosticoDesempenho.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(js, {
    exports, URL: URLLocal, Blob, PerformanceObserver: Observer,
    require: nome => nome === 'react' ? {
      useEffect: fn => efeitos.push(fn), useRef: valor => ({ current: valor }),
      useState: () => [false, valor => encerrados.push(valor)],
    } : nome === 'next/navigation' ? { usePathname: () => '/admin/turmas' }
      : nome === '@/lib/diagnostico-desempenho' ? carregar('../lib/diagnostico-desempenho.ts')
        : require(nome),
    window: {
      PerformanceObserver: Observer, location: { origin: 'https://www.phanyx.com.br' },
      setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    },
    performance: { now: () => 1200 },
    document: { createElement: () => ({ click() { download = this.download; } }) },
  });
  const arvore = exports.default();
  const limpar = efeitos.map(fn => fn()).filter(Boolean);
  assert.equal(timers[0].ms, 180000);
  const recurso = observadores.find(o => o.options.type === 'resource');
  recurso.emitir({ name: 'https://www.phanyx.com.br/api/admin/alunos/42?email=privado', initiatorType: 'fetch', startTime: 30, duration: 200, requestStart: 50, responseStart: 210, responseEnd: 230, transferSize: 800 });
  recurso.emitir({ name: 'https://externo.example/privado', duration: 90 });
  observadores.find(o => o.options.type === 'longtask').emitir({ startTime: 100, duration: 900 });
  const botao = arvore.props.children.find(e => e.type === 'button');
  botao.props.onClick();
  const texto = await blob.text();
  assert.equal(download, 'PHANYX-desempenho.json');
  assert.equal(texto.includes('privado'), false);
  const dados = JSON.parse(texto);
  assert.equal(dados.amostras.recursos.length, 1);
  assert.equal(dados.amostras.recursos[0].caminho, '/api/admin/alunos/:id');
  assert.equal(dados.amostras.recursos[0].esperaRespostaMs, 160);
  assert.equal(dados.amostras.tarefasLongas[0].duracaoMs, 900);
  assert.ok(observadores.every(o => o.desligado));
  assert.ok(encerrados.includes(true));
  limpar.forEach(fn => fn());
});
