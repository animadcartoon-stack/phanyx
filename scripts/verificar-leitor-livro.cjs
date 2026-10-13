// Testes locais; não acessam contas nem o banco da instituição.
const fs=require("node:fs"); const path=require("node:path"); const vm=require("node:vm");
const assert=require("node:assert/strict"); const {pathToFileURL}=require("node:url");
const {execFileSync}=require("node:child_process"); const ts=require("typescript");
const root=path.resolve(__dirname,".."); let testes=0;
function testar(nome,fn){fn();testes++;}
const modulo={exports:{}};
const fonte=ts.transpileModule(fs.readFileSync(path.join(root,"lib/biblioteca-gestos-leitor.ts"),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInThisContext(`(function(exports,module){${fonte}\n})`)(modulo.exports,modulo);
const {limitarZoomLeitor,zoomPorPincaLeitor,viradaPorGestoLeitor}=modulo.exports;
(async()=>{
  testar("pinça amplia proporcionalmente",()=>assert.equal(zoomPorPincaLeitor(1,50,100),2));
  testar("pinça reduz proporcionalmente",()=>assert.equal(zoomPorPincaLeitor(2,100,50),1));
  testar("ampliação tem limite",()=>assert.equal(zoomPorPincaLeitor(2,10,500),4));
  testar("redução tem limite",()=>assert.equal(zoomPorPincaLeitor(1,100,1),.5));
  testar("toques coincidentes não causam divisão por zero",()=>assert.equal(zoomPorPincaLeitor(1,0,100),1));
  testar("valor inválido não chega ao canvas",()=>assert.equal(limitarZoomLeitor(NaN),1));
  testar("deslizar à esquerda avança",()=>assert.equal(viradaPorGestoLeitor(-80,10,1,300),1));
  testar("deslizar à direita retorna",()=>assert.equal(viradaPorGestoLeitor(80,10,1,300),-1));
  testar("arrastar verticalmente não vira página",()=>assert.equal(viradaPorGestoLeitor(80,100,1,300),0));
  testar("arrastar documento ampliado não vira página",()=>assert.equal(viradaPorGestoLeitor(-100,10,2,300),0));
  testar("toque curto não vira página",()=>assert.equal(viradaPorGestoLeitor(-20,5,1,300),0));
  testar("seleção prolongada não vira página",()=>assert.equal(viradaPorGestoLeitor(-80,5,1,1800),0));
  const config=(await import(pathToFileURL(path.join(root,"next.config.mjs")).href)).default;
  const regras=await config.headers(); const {getPathMatch}=require("next/dist/shared/lib/router/utils/path-match");
  const regra=regras.find(r=>getPathMatch(r.source)("/biblioteca/pdfjs/5.4.624/pdf.min.mjs"));
  testar("cache imutável para o motor versionado",()=>assert.ok(regra.headers.some(h=>h.key==="Cache-Control"&&h.value.includes("immutable"))));
  testar("cache público não abrange PDFs privados",()=>assert.equal(getPathMatch(regra.source)("/api/biblioteca/arquivos/9/conteudo"),false));
  testar("URL sem versão não recebe cache imutável",()=>assert.equal(getPathMatch(regra.source)("/biblioteca/pdfjs/pdf.min.mjs"),false));
  const pacote=path.dirname(require.resolve("pdfjs-dist/package.json")); const versao=require(path.join(pacote,"package.json")).version;
  for(const nome of ["pdf.min.mjs","pdf.worker.min.mjs"]){
    testar("recurso versionado corresponde ao pacote: "+nome,()=>assert.ok(fs.readFileSync(path.join(root,"public/biblioteca/pdfjs",versao,nome)).equals(fs.readFileSync(path.join(pacote,"build",nome)))));
    testar("URL anterior permanece disponível: "+nome,()=>assert.ok(fs.existsSync(path.join(root,"public/biblioteca/pdfjs",nome))));
  }
  execFileSync(process.execPath,[path.join(__dirname,"verificar-leitor-biblioteca.cjs")],{stdio:"inherit"});
  console.log(`OK: ${testes} verificações de gestos, limites de zoom, cache e arquivos do leitor.`);
})().catch(erro=>{console.error(erro);process.exitCode=1;});
