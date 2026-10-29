const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),sharp=require('sharp');
const file=path.join(__dirname,'../lib/pdf/preparar-imagem-pdf.ts');
const mod=new Module(file);mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {prepararImagemPdf,lerImagemPdfLimitada,LIMITE_BYTES_IMAGEM_PDF}=mod.exports;
test('PNG e JPEG pequenos preservam os bytes originais',async()=>{
 for(const formato of ['png','jpeg']){
  const imagem=await sharp({create:{width:120,height:60,channels:4,background:{r:20,g:80,b:180,alpha:1}}})[formato]().toBuffer();
  const result=await prepararImagemPdf(imagem);assert.equal(result.formato,formato);assert.deepEqual(result.bytes,imagem);
 }
});
test('logo grande é reduzida antes de chegar ao pdf-lib, com proporção e transparência',async()=>{
 const original=await sharp({create:{width:5000,height:3000,channels:4,background:{r:20,g:80,b:180,alpha:0.4}}}).png().toBuffer();
 const result=await prepararImagemPdf(original),info=await sharp(result.bytes).metadata();
 assert.equal(info.width,2048);assert.equal(info.height,1229);assert.equal(info.hasAlpha,true);assert.equal(result.formato,'png');
});
test('resposta sem Content-Length respeita limite durante o download',async()=>{
 let cancelou=false;
 const response=new Response(new ReadableStream({start(ctrl){ctrl.enqueue(new Uint8Array(LIMITE_BYTES_IMAGEM_PDF+1));},cancel(){cancelou=true;}}));
 await assert.rejects(lerImagemPdfLimitada(response),/limite/);assert.equal(cancelou,true);
});
test('imagem pequena pode ser lida sem tamanho declarado; arquivos inválidos não entram no PDF',async()=>{
 assert.deepEqual(await lerImagemPdfLimitada(new Response(Buffer.from([1,2,3]))),Buffer.from([1,2,3]));
 await assert.rejects(prepararImagemPdf(Buffer.from('não é imagem')));
 await assert.rejects(prepararImagemPdf(Buffer.alloc(0)));
});
