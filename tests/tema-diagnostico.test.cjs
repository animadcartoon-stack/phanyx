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
  vm.runInNewContext(js, { exports, URL, URLSearchParams, Event, ...globais });
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
    static supportedEntryTypes = ['longtask', 'event', 'resource', 'navigation', 'long-animation-frame'];
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
      : nome === 'next-intl' ? { useTranslations: () => chave => chave }
      : nome === '@/lib/diagnostico-desempenho' ? carregar('../lib/diagnostico-desempenho.ts')
        : require(nome),
    window: {
      PerformanceObserver: Observer, location: { origin: 'https://www.phanyx.com.br' },
      setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
    },
    performance: { now: () => 1200 },
    document: {
      documentElement: { lang: 'pt-BR', dataset: { theme: 'dark' } },
      getElementsByTagName: () => ({ length: 350 }),
      createElement: () => ({ click() { download = this.download; } }),
    },
  });
  const arvore = exports.default();
  const limpar = efeitos.map(fn => fn()).filter(Boolean);
  assert.equal(timers[0].ms, 180000);
  const recurso = observadores.find(o => o.options.type === 'resource');
  recurso.emitir({ name: 'https://www.phanyx.com.br/api/admin/alunos/42?email=privado', initiatorType: 'fetch', startTime: 30, duration: 200, requestStart: 50, responseStart: 210, responseEnd: 230, transferSize: 800 });
  recurso.emitir({ name: 'https://externo.example/privado', duration: 90 });
  observadores.find(o => o.options.type === 'longtask').emitir({ startTime: 100, duration: 900 });
  observadores.find(o => o.options.type === 'long-animation-frame').emitir({ startTime: 100, duration: 900, renderStart: 750, styleAndLayoutStart: 800, scripts: [] });
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
  assert.equal(dados.versao, 2);
  assert.equal(dados.amostras.quadrosLongos[0].estiloLayoutMs, 200);
  assert.equal(dados.contexto.elementos, 350);
  assert.ok(observadores.every(o => o.desligado));
  assert.ok(encerrados.includes(true));
  limpar.forEach(fn => fn());
});

test('quadros longos distinguem script e renderização sem exportar dados de URLs ou seletores', () => {
  const { amostraQuadroLongo } = carregar('../lib/diagnostico-desempenho.ts');
  const amostra = amostraQuadroLongo({ startTime: 10, duration: 500, blockingDuration: 450, renderStart: 400, styleAndLayoutStart: 420, scripts: [
    { startTime: 15, duration: 350, sourceURL: 'https://www.phanyx.com.br/_next/static/chunks/app/admin/page-abc.js?token=privado#email', sourceCharPosition: 123, invokerType: 'event-listener', forcedStyleAndLayoutDuration: 20 },
    { startTime: 15, duration: 20, sourceURL: 'https://terceiro.example/alunos/123?email=privado', invokerType: 'IMG#privado.onload' },
    { startTime: 20, duration: 15, sourceURL: 'https://www.phanyx.com.br/admin/alunos/123?email=privado' },
  ] }, 'https://www.phanyx.com.br');
  assert.equal(amostra.renderizacaoMs, 110);
  assert.equal(amostra.estiloLayoutMs, 90);
  assert.equal(amostra.scripts[0].origem, '/_next/static/chunks/app/admin/page-abc.js');
  assert.equal(amostra.scripts[0].posicao, 123);
  assert.equal(amostra.scripts[1].origem, 'externo:terceiro.example');
  assert.equal(amostra.scripts[2].origem, 'script-local');
  assert.equal(JSON.stringify(amostra).includes('privado'), false);
  const semSuporte = amostraQuadroLongo({ startTime: 1, duration: 100 }, 'https://www.phanyx.com.br');
  assert.equal(semSuporte.estiloLayoutMs, 0);
  assert.equal(semSuporte.scripts.length, 0);
});

test('medição de storage preserva resultado, exceção e restaura os métodos sem registrar chave ou valor', () => {
  const { observarStorageLento } = carregar('../lib/diagnostico-desempenho.ts');
  const dados = new Map(); let tempo = 0; const amostras = [];
  const erro = new Error('QuotaExceededError');
  const proto = {
    getItem(chave) { tempo += 30; return dados.get(chave) ?? null; },
    setItem(chave, valor) { tempo += 50; if (valor === 'falhar') throw erro; dados.set(chave, valor); },
    removeItem(chave) { tempo += 1; dados.delete(chave); },
    clear() { tempo += 1; dados.clear(); },
  };
  const original = proto.setItem;
  const parar = observarStorageLento(proto, amostra => amostras.push(amostra), () => tempo);
  assert.equal(proto.setItem('token-privado', 'valor-privado'), undefined);
  assert.equal(proto.getItem('token-privado'), 'valor-privado');
  assert.throws(() => proto.setItem('token-privado', 'falhar'), e => e === erro);
  proto.removeItem('token-privado');
  assert.equal(amostras.length, 3);
  assert.equal(amostras[2].duracaoMs, 50);
  assert.equal(JSON.stringify(amostras).includes('privado'), false);
  parar(); parar();
  assert.equal(proto.setItem, original);
  proto.setItem('outra', 'valor');
  assert.equal(amostras.length, 3);
  const parar2 = observarStorageLento(proto, () => { throw new Error('falha na medição'); }, () => tempo);
  assert.equal(proto.getItem('outra'), 'valor');
  parar2();
});

test('diagnóstico continua após recarga sem query, expira e respeita armazenamento bloqueado', () => {
  const { diagnosticoSolicitado } = carregar('../lib/diagnostico-desempenho.ts');
  const valores = new Map();
  const sessao = { getItem: k => valores.get(k), setItem: (k, v) => valores.set(k, v), removeItem: k => valores.delete(k) };
  assert.equal(diagnosticoSolicitado('', sessao, 100), false);
  assert.equal(diagnosticoSolicitado('?diagnostico=desempenho', sessao, 100), true);
  assert.equal(diagnosticoSolicitado('', sessao, 1000), true);
  assert.equal(diagnosticoSolicitado('', sessao, 900101), false);
  diagnosticoSolicitado('?diagnostico=desempenho', sessao, 100);
  assert.equal(diagnosticoSolicitado('?diagnostico=off', sessao, 101), false);
  assert.equal(diagnosticoSolicitado('', sessao, 102), false);
  const bloqueado = { getItem() { throw Error('bloqueado'); }, setItem() { throw Error('bloqueado'); } };
  assert.equal(diagnosticoSolicitado('?diagnostico=desempenho', bloqueado), true);
  assert.equal(diagnosticoSolicitado('', bloqueado), false);
});
