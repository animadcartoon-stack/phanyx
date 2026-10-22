const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/imagens/preparar-logo-upload.ts');
const m = new Module(filename, module);
m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { prepararLogoParaUpload: preparar, LIMITE_LOGO_ORIGINAL, LIMITE_LOGO_ENVIO } = m.exports;
const { File } = require('node:buffer');
global.File = File;
const file = (bytes, type='image/png') => new File([new Uint8Array(bytes)], 'logo.png', {type});

test('small logos are sent unchanged', async () => {
  const original = file(100);
  assert.equal(await preparar(original), original);
});
test('rejects invalid, empty and oversized originals', async () => {
  for(const [f,code] of [[file(10,'image/svg+xml'),'invalidFormat'], [file(0),'emptyFile'], [file(LIMITE_LOGO_ORIGINAL+1),'originalTooLarge']]) {
    await assert.rejects(preparar(f), e=>e.codigo===code);
  }
});
test('large logo is reduced before upload and temporary resources are released', async () => {
  let revoked=0, draws=0;
  const restore={Image:global.Image,document:global.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
  URL.createObjectURL=()=> 'blob:test-logo';URL.revokeObjectURL=()=>{revoked++;};
  global.Image=class { naturalWidth=4000; naturalHeight=2000; set src(_) { queueMicrotask(()=>this.onload()); } };
  const context={clearRect(){},drawImage(){draws++;}};
  const canvas={width:0,height:0,getContext(){return context;},toBlob(cb,type){
    assert.equal(type,'image/png','Keep an alpha-capable format');
    cb(new Blob([new Uint8Array(draws===1?LIMITE_LOGO_ENVIO+1:1024)],{type}));
  }};
  global.document={createElement:()=>canvas};
  try {
    const output=await preparar(file(LIMITE_LOGO_ORIGINAL));
    assert.ok(output.size<=LIMITE_LOGO_ENVIO);
    assert.equal(output.type,'image/png');
    assert.equal(draws,2);
    assert.ok(canvas.width<=2048 && canvas.height<=2048);
    assert.equal(revoked,1);
    global.Image=class { set src(_) {queueMicrotask(()=>this.onerror());} };
    await assert.rejects(preparar(file(LIMITE_LOGO_ENVIO+1)),e=>e.codigo==='prepareError');
    assert.equal(revoked,2);
    global.Image=restore.Image;
  } finally {
    global.Image=restore.Image;global.document=restore.document;
    URL.createObjectURL=restore.create;URL.revokeObjectURL=restore.revoke;
  }
});
test('all five locales have matching logo upload messages', () => {
  const locales=['pt-BR','pt-PT','en-US','es-ES','fr-FR'];
  let keys;
  for(const locale of locales){
    const logo=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../messages/${locale}.json`),'utf8')).AdminInstitutionSettings.logo;
    assert.ok(logo.uploadHelp);
    const actual=Object.keys(logo.messages).sort();
    if(keys) assert.deepEqual(actual,keys);else keys=actual;
    for(const code of ['invalidFormat','emptyFile','originalTooLarge','prepareError','payloadTooLarge'])assert.ok(logo.messages[code]);
  }
});
