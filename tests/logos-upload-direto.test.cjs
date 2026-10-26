const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const crypto = require('node:crypto');
const ts = require('typescript');
const { File } = require('node:buffer');
const blobSDK = require('@vercel/blob/client');
const { MockAgent, getGlobalDispatcher, setGlobalDispatcher } = require('undici');

function carregar(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const mod = new Module(filename, module);
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod.require = id => Object.hasOwn(mocks,id) ? mocks[id] : Module.prototype.require.call(mod,id);
  mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {
    compilerOptions: { module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020, esModuleInterop:true },
  }).outputText,filename);
  return mod.exports;
}
const regras = carregar('lib/logos-upload.ts');
const usuario = { id: 7, role:'ADMIN', instituicaoId:26 };
const pathname = 'instituicoes/26/logos/12345678-1234-1234-1234-123456789abc-logo.png';
const endpoint = 'https://phanyx.example/api/admin/configuracoes/logos/upload-direto';
const tokenTeste = 'vercel_blob_rw_teststore_FakeSecretOnlyForLocalTests';
function rota(user = usuario) {
  return carregar('app/api/admin/configuracoes/logos/upload-direto/route.ts', {
    '@/lib/server-auth': { getUserFromToken:async()=>user },
    '@/lib/logos-upload':regras,
  });
}
function request(body,headers={}) {
  return new Request(endpoint,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
}
function gerar(pathnameInformado=pathname,tamanho=regras.LIMITE_LOGO_INSTITUCIONAL,mimeType='image/png') {
  return {type:'blob.generate-client-token',payload:{pathname:pathnameInformado,clientPayload:JSON.stringify({tamanho,mimeType}),multipart:false}};
}
function comAmbiente(fn) {
  return async()=>{
    const old={token:process.env.BLOB_READ_WRITE_TOKEN,vercel:process.env.VERCEL,url:process.env.VERCEL_PROJECT_PRODUCTION_URL};
    process.env.BLOB_READ_WRITE_TOKEN=tokenTeste;process.env.VERCEL='1';process.env.VERCEL_PROJECT_PRODUCTION_URL='phanyx.example';
    try { await fn(); } finally {
      for(const [key,value] of [['BLOB_READ_WRITE_TOKEN',old.token],['VERCEL',old.vercel],['VERCEL_PROJECT_PRODUCTION_URL',old.url]]) {
        if(value===undefined)delete process.env[key];else process.env[key]=value;
      }
    }
  };
}

test('aceita os tamanhos mostrados nos prints e exatamente 5 MB; rejeita um byte a mais',()=>{
  for(const size of [Math.round(4.37*1024*1024),Math.round(4.48*1024*1024),5*1024*1024]) {
    assert.doesNotThrow(()=>regras.validarArquivoLogo({type:'image/png',size}));
  }
  assert.throws(()=>regras.validarArquivoLogo({type:'image/png',size:5*1024*1024+1}),e=>e.codigo==='originalTooLarge');
  for(const size of [0,-1,NaN,Infinity,1.5])assert.throws(()=>regras.validarArquivoLogo({type:'image/png',size}));
  assert.throws(()=>regras.validarArquivoLogo({type:'image/svg+xml',size:100}),e=>e.codigo==='invalidFormat');
});

test('preparação autenticada mantém o arquivo na pasta da própria instituição',async()=>{
  const res=await rota().POST(request({type:'logo.prepare-upload',nome:'Logo Creia kids.PDF).png',mimeType:'image/png',tamanho:5*1024*1024}));
  assert.equal(res.status,200);
  const {pathname:p}=await res.json();assert.ok(regras.caminhoLogoDaInstituicao(p,26));
  assert.equal(regras.caminhoLogoDaInstituicao(p,27),false);
  assert.match(p,/-logo-creia-kids.pdf-.png$/);
  assert.equal(res.headers.get('cache-control'),'private, no-store');
});

test('preparação e geração da autorização exigem administrador com instituição',comAmbiente(async()=>{
  for(const user of [null,{...usuario,role:'ALUNO'},{...usuario,instituicaoId:null},{...usuario,instituicaoId:0}]) {
    const api=rota(user);
    assert.equal((await api.POST(request({type:'logo.prepare-upload',nome:'logo.png',mimeType:'image/png',tamanho:100}))).status,403);
    assert.equal((await api.POST(request(gerar()))).status,403);
  }
}));

test('autorização real do SDK limita tamanho, formato, caminho, sobrescrita e validade',comAmbiente(async()=>{
  const inicio=Date.now();const res=await rota().POST(request(gerar()));assert.equal(res.status,200);
  const {clientToken}=await res.json();const scope=blobSDK.getPayloadFromClientToken(clientToken);
  assert.equal(scope.maximumSizeInBytes,5*1024*1024);assert.deepEqual(scope.allowedContentTypes,['image/png']);
  assert.equal(scope.pathname,pathname);assert.equal(scope.addRandomSuffix,true);assert.equal(scope.allowOverwrite,false);
  assert.ok(scope.validUntil>=inicio && scope.validUntil<=Date.now()+5*60*1000);
  assert.equal(res.headers.get('cache-control'),'private, no-store');
}));

test('não autoriza pasta de outro ID, travessia, SVG nem arquivos maiores que 5 MB',comAmbiente(async()=>{
  for(const p of [pathname.replace('/26/','/27/'),pathname.replace('/logos/','/../logos/'),pathname+'/outro.png','logo.png']) {
    assert.equal((await rota().POST(request(gerar(p)))).status,403,p);
  }
  assert.equal((await rota().POST(request(gerar(pathname,5*1024*1024+1)))).status,400);
  assert.equal((await rota().POST(request(gerar(pathname,100,'image/svg+xml')))).status,400);
}));

test('retorno do armazenamento é verificado por assinatura, sem depender de cookie',comAmbiente(async()=>{
  const body={type:'blob.upload-completed',payload:{blob:{url:'https://test.public.blob.vercel-storage.com/a.png',pathname},tokenPayload:'{}'}};
  const api=rota(null);
  assert.equal((await api.POST(request(body))).status,400);
  assert.equal((await api.POST(request(body,{'x-vercel-signature':'00'}))).status,400);
  const signature=crypto.createHmac('sha256',tokenTeste).update(JSON.stringify(body)).digest('hex');
  const res=await api.POST(request(body,{'x-vercel-signature':signature}));assert.equal(res.status,200);
  assert.equal((await res.json()).response,'ok');
}));

test('arquivo de 5 MB vai inteiro ao armazenamento; as chamadas da aplicação só levam JSON pequeno',comAmbiente(async()=>{
  const originalFetch=global.fetch;const originalLocation=global.location;const api=rota();const tamanhosJSON=[];let enviado,escopo;
  global.location=new URL(endpoint);
  const dispatcher=getGlobalDispatcher();const mock=new MockAgent();mock.disableNetConnect();setGlobalDispatcher(mock);
  const ler=async body=>{
    if(typeof body==='string' || body instanceof Uint8Array)return Buffer.from(body);
    if(body instanceof ArrayBuffer)return Buffer.from(body);
    if(typeof body?.arrayBuffer==='function')return Buffer.from(await body.arrayBuffer());
    const partes=[];for await(const parte of body)partes.push(Buffer.from(parte));return Buffer.concat(partes);
  };
  mock.get('https://phanyx.example').intercept({path:new URL(endpoint).pathname,method:'POST'}).reply(200,async options=>{
    const bytes=await ler(options.body);tamanhosJSON.push(bytes.length);
    const response=await api.POST(new Request(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:bytes}));
    assert.equal(response.status,200);return response.text();
  },{headers:{'content-type':'application/json'}});
  mock.get('https://vercel.com').intercept({path:/^\/api\/blob.*/,method:'PUT'}).reply(200,async options=>{
    const authorization=new Headers(options.headers).get('authorization');
    assert.ok(authorization?.startsWith('Bearer vercel_blob_client_'));
    escopo=blobSDK.getPayloadFromClientToken(authorization.slice(7));
    enviado=await ler(options.body);assert.ok(enviado.length<=escopo.maximumSizeInBytes);
    return JSON.stringify({url:'https://test.public.blob.vercel-storage.com/'+escopo.pathname,pathname:escopo.pathname,contentType:'image/png',contentDisposition:'inline',downloadUrl:'https://test.public.blob.vercel-storage.com/download'});
  },{headers:{'content-type':'application/json'}});
  const original=new File([Buffer.alloc(5*1024*1024,125)],'logo-transparente.png',{type:'image/png'});
  const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
  global.fetch=async(url,options)=>{
    const req=url instanceof Request ? url : new Request(new URL(String(url),endpoint),options);
    const destino=req.url;
    if(destino===endpoint) {
      const json=await req.clone().text();tamanhosJSON.push(Buffer.byteLength(json));
      assert.ok(req.headers.get('content-type')?.includes('application/json'));
      return api.POST(req);
    }
    throw Error('Requisição inesperada: '+destino);
  };
  try {
    const client=carregar('lib/client/enviar-logo-institucional.ts',{'@/lib/logos-upload':regras});
    const resultado=await client.enviarLogoInstitucional(original);
    assert.equal(enviado.length,original.size);assert.equal(hash(enviado),hash(Buffer.from(await original.arrayBuffer())));
    assert.equal(tamanhosJSON.length,2);assert.ok(Math.max(...tamanhosJSON)<2000);
    assert.ok(regras.caminhoLogoDaInstituicao(resultado.arquivoPath,26));assert.equal(resultado.mimeType,'image/png');
    mock.assertNoPendingInterceptors();
  } finally {global.fetch=originalFetch;if(originalLocation===undefined)delete global.location;else global.location=originalLocation;setGlobalDispatcher(dispatcher);await mock.close();}
}));

test('arquivo acima de 5 MB é recusado antes de qualquer chamada de rede',async()=>{
  const old=global.fetch;let chamadas=0;global.fetch=async()=>{chamadas++;throw Error('Não deveria chegar à rede');};
  try {
    const client=carregar('lib/client/enviar-logo-institucional.ts',{'@/lib/logos-upload':regras});
    await assert.rejects(client.enviarLogoInstitucional(new File([Buffer.alloc(5*1024*1024+1)],'logo.png',{type:'image/png'})),e=>e.codigo==='originalTooLarge');
    assert.equal(chamadas,0);
  } finally {global.fetch=old;}
});

test('mensagens de validação existem nos cinco idiomas',()=>{
  for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']) {
    const messages=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../messages/'+locale+'.json')));
    for(const key of ['invalidFormat','emptyFile','originalTooLarge'])assert.ok(messages.AdminInstitutionSettings.logo.messages[key],locale+':'+key);
  }
});
