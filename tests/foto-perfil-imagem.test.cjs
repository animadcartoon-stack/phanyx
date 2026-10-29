const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sharp = require('sharp');

function carregar(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const mod = new Module(filename, module);
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = id => Object.hasOwn(mocks, id) ? mocks[id] : Module.prototype.require.call(mod, id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}
const imagens = carregar('lib/server/miniatura-foto-perfil.ts', { 'server-only': {} });

test('exibição preserva proporção, transparência e orientação, sem ampliar fotos pequenas', async () => {
  const png = await sharp({ create: { width: 40, height: 20, channels: 4, background: '#00000000' } }).png().toBuffer();
  const pequeno = await sharp(await imagens.gerarMiniaturaPerfil(png)).metadata();
  assert.deepEqual([pequeno.width, pequeno.height, pequeno.hasAlpha], [40, 20, true]);
  const jpeg = await sharp({ create: { width: 1600, height: 800, channels: 3, background: '#cc6600' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const original = Buffer.from(jpeg);
  const bytes = await imagens.gerarMiniaturaPerfil(jpeg);
  assert.ok(bytes.length <= imagens.MAX_BYTES_FOTO_PERFIL_EXIBICAO);
  const preparado = await sharp(bytes).metadata();
  assert.deepEqual([preparado.width, preparado.height, preparado.format], [256, 512, 'webp']);
  assert.deepEqual(jpeg, original, 'O original recebido não é alterado');
});

test('rejeita conteúdo vazio, SVG e JPEG corrompido', async () => {
  for (const bytes of [Buffer.alloc(0), Buffer.from('<svg/>'), Buffer.from([255,216,255,0])]) {
    await assert.rejects(imagens.gerarMiniaturaPerfil(bytes));
  }
});

test('preserva os quadros e os tempos das fotos WebP animadas', async () => {
  const pixels = Buffer.alloc(40 * 40 * 3);
  pixels.fill(255, 0, 40 * 20 * 3);
  const original = await sharp(pixels, { raw: { width: 40, height: 40, channels: 3, pageHeight: 20 } })
    .webp({ loop: 2, delay: [100,200] }).toBuffer();
  const meta = await sharp(await imagens.gerarMiniaturaPerfil(original), { animated: true }).metadata();
  assert.equal(meta.pages, 2);
  assert.equal(meta.loop, 2);
  assert.deepEqual(meta.delay, [100,200]);
});

test('a origem é limitada ao storage configurado e ao provedor legado', () => {
  const base = 'https://storage.example/uploads';
  assert.equal(imagens.origemFotoPerfilPermitida('https://storage.example/uploads/a.jpg', base), true);
  assert.equal(imagens.origemFotoPerfilPermitida('https://abc.public.blob.vercel-storage.com/a.jpg', base), true);
  for (const url of ['http://storage.example/uploads/a.jpg','https://storage.example.evil/uploads/a.jpg','https://storage.example/uploadsevil/a.jpg','https://user:pass@storage.example/uploads/a.jpg','https://storage.example:444/uploads/a.jpg','https://127.0.0.1/a.jpg']) {
    assert.equal(imagens.origemFotoPerfilPermitida(url, base), false, url);
  }
});

test('download não segue redirecionamentos e limita tamanho antes de ler o corpo', async () => {
  const originalFetch = global.fetch;
  const originalBase = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = 'https://storage.example';
  let cancelado = false;
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://storage.example/a.jpg');
      assert.equal(options.redirect, 'error');
      return { ok: true, headers: new Headers({ 'content-length': String(51*1024*1024) }), body: { cancel: async () => { cancelado = true; } } };
    };
    await assert.rejects(imagens.baixarFotoPerfil('https://storage.example/a.jpg'), /limite/);
    assert.equal(cancelado, true);
    let chamado = false;
    global.fetch = async () => { chamado = true; };
    await assert.rejects(imagens.baixarFotoPerfil('https://outro.example/a.jpg'), /Origem/);
    assert.equal(chamado, false);
  } finally {
    global.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.R2_PUBLIC_URL; else process.env.R2_PUBLIC_URL = originalBase;
  }
});

test('cache separa instituição, funcionário e versão do arquivo', () => {
  const keys = new Set([
    imagens.chaveMiniaturaPerfil(1,7,'a'), imagens.chaveMiniaturaPerfil(2,7,'a'),
    imagens.chaveMiniaturaPerfil(1,8,'a'), imagens.chaveMiniaturaPerfil(1,7,'b'),
  ]);
  assert.equal(keys.size, 4);
  assert.equal(imagens.chaveMiniaturaPerfil(1,7,'a'), imagens.chaveMiniaturaPerfil(1,7,'a'));
});

function rota({ user = { id: 9, instituicaoId: 26 }, perfil = { id: 7, fotoPerfil: 'https://storage.example/a.jpg' }, cache = true, falhaGravacao = false } = {}) {
  const calls = { banco: [], storage: [], download: [], converter: 0 };
  class GetObjectCommand { constructor(input) { this.input = input; } }
  class PutObjectCommand { constructor(input) { this.input = input; } }
  const modulo = carregar('app/api/funcionario/foto-perfil/imagem/route.ts', {
    '@aws-sdk/client-s3': { GetObjectCommand, PutObjectCommand },
    '@/lib/prisma': { prisma: { funcionario: { findFirst: async args => { calls.banco.push(args); return perfil; } } } },
    '@/lib/server-auth': { getUserFromToken: async () => user },
    '@/lib/storage/r2': { getR2Client: () => ({ send: async command => {
      calls.storage.push(command);
      if (command instanceof GetObjectCommand) {
        if (!cache) throw Object.assign(new Error('ausente'), { name: 'NoSuchKey' });
        return { ContentLength: 3, Body: { transformToByteArray: async () => new Uint8Array([1,2,3]) } };
      }
      if (falhaGravacao) throw new Error('storage indisponível');
      return {};
    } }) },
    '@/lib/server/miniatura-foto-perfil': {
      chaveMiniaturaPerfil: imagens.chaveMiniaturaPerfil,
      MAX_BYTES_FOTO_PERFIL_EXIBICAO: imagens.MAX_BYTES_FOTO_PERFIL_EXIBICAO,
      baixarFotoPerfil: async url => { calls.download.push(url); return Buffer.from('original'); },
      gerarMiniaturaPerfil: async () => { calls.converter++; return Buffer.from([1,2,3]); },
    },
  });
  return { ...modulo, calls };
}
const request = (query = '', headers = {}) => new Request('https://phanyx.example/api/funcionario/foto-perfil/imagem'+query, { headers });

test('rota exige autenticação, instituição e perfil antes de acessar arquivos', async () => {
  for (const [options,status] of [[{ user:null },401],[{ user:{id:9} },403],[{ perfil:null },404]]) {
    const r = rota(options);
    assert.equal((await r.GET(request())).status, status);
    assert.equal(r.calls.storage.length, 0);
    assert.equal(r.calls.download.length, 0);
  }
});

test('rota usa exclusivamente o funcionário autenticado e nunca baixa a URL da query', async () => {
  const r = rota();
  assert.equal((await r.GET(request('?v=https://outro.example/foto.jpg'))).status, 404);
  assert.deepEqual(r.calls.banco[0].where, { userId:9, instituicaoId:26 });
  assert.equal(r.calls.download.length, 0);
  assert.equal(r.calls.storage.length, 0);
});

test('cache evita processamento e ETag respeita autenticação e versão atual', async () => {
  const old = process.env.R2_BUCKET_NAME;
  process.env.R2_BUCKET_NAME = 'teste';
  try {
    const r = rota();
    const response = await r.GET(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.equal(response.headers.get('vary'), 'Cookie');
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1,2,3]);
    assert.equal(r.calls.converter, 0);
    const revalidado = await r.GET(request('', { 'if-none-match': response.headers.get('etag') }));
    assert.equal(revalidado.status, 304);
    assert.equal(r.calls.banco.length, 2);
    assert.equal(r.calls.storage.length, 1);
  } finally { if (old===undefined) delete process.env.R2_BUCKET_NAME; else process.env.R2_BUCKET_NAME=old; }
});

test('primeiro acesso cria somente um arquivo derivado e mantém o original e o banco intactos', async () => {
  const old = process.env.R2_BUCKET_NAME;
  process.env.R2_BUCKET_NAME = 'teste';
  try {
    const r = rota({ cache:false });
    assert.equal((await r.GET(request())).status, 200);
    assert.deepEqual(r.calls.download, ['https://storage.example/a.jpg']);
    assert.equal(r.calls.converter, 1);
    assert.equal(r.calls.storage.length, 2);
    const destino = r.calls.storage[1].input;
    assert.match(destino.Key, /^miniaturas-perfil\/v1\/26\/7\//);
    assert.equal(destino.ContentType, 'image/webp');
    assert.deepEqual([...destino.Body], [1,2,3]);
  } finally { if (old===undefined) delete process.env.R2_BUCKET_NAME; else process.env.R2_BUCKET_NAME=old; }
});
