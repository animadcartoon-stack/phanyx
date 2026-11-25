const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const js=ts.transpileModule(fs.readFileSync('lib/documentos/abrir-visualizacao-navegador.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup(sandbox='allow-scripts allow-modals',ok=true){
 const frame={style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
 const body={style:{},replaceChildren(v){this.child=v;}};
 const document={body,documentElement:{style:{}},createElement(t){assert.equal(t,'iframe');return frame;}};
 const aba={document,closed:false};const exports={};let cleared=false;
 class DOMParser{parseFromString(){return {title:'Preview',querySelector(){return {getAttribute(k){return {sandbox,srcdoc:'<p style="font-family:Segoe Script">Demo</p>',title:'Preview'}[k];}};}};}}
 vm.runInNewContext(js,{exports,window:{open:()=>aba,setTimeout:()=>123,clearTimeout:()=>{cleared=true;}},DOMParser,AbortController,Error,fetch:async()=>({ok,status:429,json:async()=>({html:'wrapper'})})});
 return {run:()=>exports.abrirVisualizacaoNavegador('/preview'),body,frame,aba,cleared:()=>cleared};
}
test('preview inserts sandboxed iframe without navigating popup',async()=>{const x=setup();await x.run();assert.equal(x.body.child,x.frame);assert.equal(x.frame.attrs.sandbox,'allow-scripts allow-modals');assert.match(x.frame.srcdoc,/Segoe Script/);assert.equal(x.aba.opener,null);assert.ok(x.cleared());});
test('rejects unsafe sandbox and shows errors',async()=>{const x=setup('allow-same-origin');await assert.rejects(x.run(),/Invalid preview/);assert.match(x.body.textContent,/Invalid preview/);assert.ok(x.cleared());});
test('HTTP failure stays visible in popup',async()=>{const x=setup(undefined,false);await assert.rejects(x.run(),/HTTP 429/);assert.match(x.body.textContent,/HTTP 429/);assert.ok(x.cleared());});
