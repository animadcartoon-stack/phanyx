const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function carregar(env){const exports={},calls=[];vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/storage/r2.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,process:{env},require:()=>({S3Client:class {constructor(config){calls.push(config);}}})});return{...exports,calls};}
test('importar módulo sem credenciais não bloqueia build ou autenticação das rotas',()=>{
 const lib=carregar({});assert.equal(lib.calls.length,0);assert.throws(()=>lib.getR2Client(),/R2_ACCOUNT_ID/);
});
test('operação R2 continua exigindo todas as credenciais',()=>{
 assert.throws(()=>carregar({R2_ACCOUNT_ID:'fake'}).getR2Client(),/R2_ACCESS_KEY_ID/);
 assert.throws(()=>carregar({R2_ACCOUNT_ID:'fake',R2_ACCESS_KEY_ID:'fake'}).getR2Client(),/R2_SECRET_ACCESS_KEY/);
});
test('cliente é criado sob demanda uma única vez, preservando configuração existente',()=>{
 const lib=carregar({R2_ACCOUNT_ID:'fake',R2_ACCESS_KEY_ID:'fake-key',R2_SECRET_ACCESS_KEY:'fake-secret'});
 const a=lib.getR2Client(),b=lib.getR2Client();assert.equal(a,b);assert.equal(lib.calls.length,1);
 assert.equal(lib.calls[0].forcePathStyle,true);assert.equal(lib.calls[0].region,'auto');assert.equal(lib.calls[0].credentials.accessKeyId,'fake-key');
});
