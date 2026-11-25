const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const vm = require('node:vm');
function load(file, imports = {}) {
  const exports = {};
  const src = fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,module:{exports},require: id=>{ if(id in imports) return imports[id]; throw Error('Unknown import: '+id); }});
  return exports;
}
const models=load('lib/documentos/modelos-papel-timbrado.ts');
const renderer = load('lib/documentos/renderizador-template-documento.ts', {
  '@/lib/documentos/modelos-papel-timbrado': models,
  '@/lib/documentos/estilos-listas-editor': { CSS_LISTAS_PHANYX: '' },
  '@/lib/documentos/tipografia-template': load('lib/documentos/tipografia-template.ts'),
});
const styles=['PHANYX_CLASSICO','PHANYX_MODERNO','PHANYX_ACADEMICO','PERSONALIZADO_CLASSICO','PERSONALIZADO_MODERNO','PERSONALIZADO_MARCA'];
const logo='data:image/png;base64,AA==';
const render=(estilo,extra={})=>renderer.montarRenderizacaoDocumento({conteudo:'<p>Teste</p>',formatoImpressao:'A4_INTEIRA',instituicao:{nome:'Instituicao Teste',cnpj:'123',logoDataUri:logo,logoUrl:logo,estiloPapelTimbrado:estilo,...extra},mostrarValidacao:false});
test('all six persisted choices select the same header and footer style',()=>{for(const s of styles){const r=render(s);assert.ok(r.pdfOptions.headerTemplate.includes('data-phanyx-letterhead="'+s+'"'));assert.ok(r.pdfOptions.footerTemplate.includes('data-phanyx-letterhead="'+s+'"'));assert.ok(r.pdfOptions.footerTemplate.includes('class="pageNumber"'));assert.ok(r.pdfOptions.headerTemplate.includes(logo));}});
test('dark built-in models use different contract colors in both bands',()=>{for(const [s,color] of [['PHANYX_CLASSICO','#141414'],['PHANYX_MODERNO','#244073']]){const r=render(s);assert.ok(r.headerTemplate.includes(color));assert.ok(r.footerTemplate.includes(color));}});
test('institution settings aliases are recognized',()=>{assert.equal(models.normalizarModeloPapelTimbrado('INSTITUCIONAL'),'PHANYX_CLASSICO');assert.equal(models.normalizarModeloPapelTimbrado('MINIMALISTA'),'PHANYX_ACADEMICO');assert.equal(models.normalizarModeloPapelTimbrado('MARCA_DAGUA'),'PERSONALIZADO_MARCA');});
test('legacy own letterhead keeps external headers off',()=>{const r=render('PAPEL_PROPRIO',{usarPapelTimbrado:true,papelTimbradoUrl:logo});assert.equal(r.pdfOptions.displayHeaderFooter,false);assert.ok(r.html.includes('phanyx-papel-a4'));});
test('custom watermark uses the chosen image and academic uses the logo',()=>{assert.ok(render('PERSONALIZADO_MARCA',{usarPapelTimbrado:true,papelTimbradoUrl:logo}).html.includes('opacity:0.15'));assert.ok(render('PHANYX_ACADEMICO').html.includes('opacity:0.05'));});
