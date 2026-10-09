"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const JSZip = require("jszip");
const XLSX = require("xlsx");
const root = path.resolve(__dirname, "..");
const uploads = [];
const cache = new Map();
let prismaTeste;
class ErroBibliotecaTeste extends Error { constructor(status,message,codigo) { super(message);this.status=status;this.codigo=codigo; } }
function carregar(arquivo) {
  const absoluto = path.resolve(root, arquivo);
  if (cache.has(absoluto)) return cache.get(absoluto).exports;
  const mod = { exports: {} }; cache.set(absoluto, mod);
  const code = ts.transpileModule(fs.readFileSync(absoluto, "utf8"), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  }, fileName: absoluto }).outputText;
  const requerer = nome => {
    if (nome === "@/lib/prisma") return { prisma: prismaTeste };
    if (nome === "@/lib/server-auth") return { getUserFromToken: async () => ({ id: 1, impersonacao: false }) };
    if (nome === "@/lib/biblioteca-acesso") return {
      ErroBiblioteca: ErroBibliotecaTeste, exigirPermissaoBiblioteca: () => {},
      obterContextoBiblioteca: async () => ({ instituicaoId: 1, configuracao: {} }),
      respostaErroBiblioteca: erro => ({ corpo: { error: erro.message, codigo: erro.codigo }, status: erro.status || 500 }),
    };
    if (nome === "@/lib/storage/uploadArquivo") return { uploadArquivo: async ({ file }) => {
      const bytes = Buffer.from(await file.arrayBuffer()); uploads.push(bytes);
      return { url: `https://storage.example/imagem-${uploads.length}.png` };
    } };
    if (nome.startsWith("@/")) return carregar(nome.slice(2)+".ts");
    if (nome.startsWith(".")) return carregar(path.relative(root, path.resolve(path.dirname(absoluto), nome + ".ts")));
    return require(nome);
  };
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: requerer,
    Buffer, Error, File: global.File || require("node:buffer").File, Uint8Array, TextDecoder, URL, AbortController,
    setTimeout, clearTimeout, console, fetch: async () => { throw new Error("Rede indisponível no teste"); },
  }, { filename: absoluto });
  return mod.exports;
}
const imp = carregar("lib/biblioteca-importacao.ts");
const pacotes = carregar("lib/biblioteca-importacao-pacote.ts");
const capas = carregar("lib/biblioteca-importacao-capas.ts");
const preservacao = carregar("lib/biblioteca-importacao-preservacao.ts");
const esc = v => v.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const campo = (tag, subs) => `<datafield tag="${tag}" ind1=" " ind2=" ">${subs.map(([k,v]) => `<subfield code="${k}">${esc(v)}</subfield>`).join("")}</datafield>`;
const controle = (tag,v) => `<controlfield tag="${tag}">${v}</controlfield>`;
const registro = partes => `<record><leader>00000nam a2200000   4500</leader>${partes.join("")}</record>`;
function ler(buffer,nome="acervo.xml") {
  const analise=imp.analisarArquivoImportacao(buffer,nome);
  const mapa=Object.fromEntries(analise.colunas.map(c=>[c.indice,c.destinoSugerido]));
  return imp.extrairRegistrosMapeadosImportacao(buffer,nome,mapa);
}
function iso(campos,utf8=true) {
  let offset=0; const partes=[]; const dir=[];
  for(const [tag,valor] of campos){const p=Buffer.concat([Buffer.from(valor,utf8?"utf8":"latin1"),Buffer.from([0x1e])]);
    dir.push(tag+String(p.length).padStart(4,"0")+String(offset).padStart(5,"0"));partes.push(p);offset+=p.length;}
  const base=24+dir.join("").length+1; const size=base+offset+1;
  const leader=(String(size).padStart(5,"0")+"nam "+(utf8?"a":" ")+"22"+String(base).padStart(5,"0")+"   4500");
  assert.equal(leader.length,24);
  return Buffer.concat([Buffer.from(leader+dir.join(""),"ascii"),Buffer.from([0x1e]),...partes,Buffer.from([0x1d])]);
}
async function main() {
  let checks=0; const ok=(fn)=>{fn();checks++;};
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=","base64");
  const data="data:image/png;base64,"+png.toString("base64");
  const xml=Buffer.from(`<collection>${registro([
    controle("001","000007"), controle("008","261008s2020    bl                  por  "),
    campo("245",[["a","Ação e educação /"],["b","Um subtítulo :"],["c","Maria da Silva ; tradução de Ana"]]),
    campo("246",[["a","Título alternativo"]]),campo("240",[["a","Título uniforme"]]),
    campo("100",[["a","Silva, Maria"],["d","1970-"]]),campo("700",[["a","Ana"],["e","tradutora"]]),
    campo("700",[["a","Editor João"],["4","edt"]]),campo("040",[["a","BIBLIVRE"],["b","por"],["e","rda"]]),
    campo("264",[["a","São Paulo :"],["b","Editora A"],["c","2020"]]),
    campo("300",[["a","120 p."],["b","ilustrações"],["c","21 cm"],["e","1 CD"]]),
    campo("490",[["a","Série exemplo"],["v","3"]]),campo("520",[["a","Resumo completo com acentuação."]]),
    campo("500",[["a","Nota um"]]),campo("500",[["a","Nota dois"]]),campo("504",[["a","Bibliografia p. 115-120"]]),
    campo("505",[["a","Sumário completo"]]),campo("336",[["a","texto"]]),campo("337",[["a","sem mediação"]]),campo("338",[["a","volume"]]),
    campo("650",[["a","Educação"],["x","História"],["z","Brasil"]]),campo("949",[["a","T-001"]]),campo("949",[["a","T-002"]]),
    campo("856",[["u","imagens/ilustracao.png"],["q","image/png"]]),campo("856",[["u",data],["y","Capa"]]),
    campo("856",[["u","https://example.org/livro.pdf"],["q","application/pdf"]]),
    campo("990",[["a","Campo local"],["x",""],["a","Repetição"]]),
  ])}</collection>`);
  const extraido=ler(xml), d=extraido.registros[0].dados;
  ok(()=>assert.equal(extraido.registros.length,2));
  ok(()=>assert.equal(d.numeroTombo,"T-001"));
  ok(()=>assert.equal(extraido.registros[1].dados.numeroTombo,"T-002"));
  ok(()=>assert.equal(d.sinopse,"Resumo completo com acentuação."));
  ok(()=>assert.equal(d.mencaoResponsabilidade,"Maria da Silva ; tradução de Ana"));
  ok(()=>assert.equal(d.serie,"Série exemplo"));
  ok(()=>assert.equal(d.dimensoes,"21 cm"));
  ok(()=>assert.equal(d.notaGeral,"Nota um\nNota dois"));
  ok(()=>assert.equal(d.autor,"Silva, Maria 1970-"));
  ok(()=>assert.equal(d.tradutor,"Ana"));
  ok(()=>assert.equal(d.editor,"Editor João"));
  ok(()=>assert.equal(d.coautor,undefined));
  ok(()=>assert.match(d.palavrasChave,/Educação História Brasil/));
  ok(()=>assert.equal(extraido.registros[0].imagens.length,2));
  ok(()=>assert.equal(d.capaUrl,data));
  ok(()=>assert.equal(extraido.registros[0].original.marc.campos.find(c=>c.tag==="990").subcampos.length,3));
  ok(()=>assert.match(Buffer.from(extraido.registros[0].original.conteudoBase64,"base64").toString(),/tag="990"/));
  const nomesMarc = [
    ["Keen", "C. M. Keen", "C. M. Keen"],
    ["Brelaz", "Pastor Gabino Brelaz", "Pastor Gabino Brelaz"],
    ["Falcão", "João Falcão Sobrinho", "João Falcão Sobrinho"],
    ["Treze", "Parecer da Comissão dos Treze", "Parecer da Comissão dos Treze"],
    ["Le Conte", "John Le Conte", "John Le Conte"],
    ["Fowler, T. M.", "(Thaddeus Mortimer)", "Fowler, T. M. (Thaddeus Mortimer)"],
    ["H. D.", "(Hilda Doolittle)", "H. D. (Hilda Doolittle)"],
    ["Orr", "Guilherme W. Orrison", "Orr Guilherme W. Orrison"],
    ["Keen", "(C. M. Keen)", "C. M. Keen"],
  ];
  for (const [a,q,esperado] of nomesMarc) {
    const r=ler(iso([["245","  \x1faTeste de autoria"],["100",`1 \x1fa${a}\x1fq${q}\x1fd1970-`]]),"autores.mrc").registros[0];
    ok(()=>assert.equal(r.dados.autor,`${esperado} 1970-`));
    ok(()=>assert.equal(r.original.marc.campos.find(c=>c.tag==="100").subcampos.find(s=>s.codigo==="a").valor,a));
  }
  const coautoria=ler(Buffer.from(registro([campo("245",[["a","Coautoria"]]),campo("700",[["a","Keen"],["q","C. M. Keen"],["e","tradutor"]]),campo("110",[["a","Instituto"],["q","Instituto de Estudos"]])]))).registros[0].dados;
  ok(()=>assert.equal(coautoria.tradutor,"C. M. Keen"));
  ok(()=>assert.equal(coautoria.autor,"Instituto Instituto de Estudos"));
  const separado=Buffer.from(`<collection>${registro([controle("001","000123"),campo("245",[["a","Livro com exemplar separado"]])])}${registro([controle("001","999"),controle("004","123"),campo("949",[["a","BIB.2026.1"]])])}</collection>`);
  const separadoLido=ler(separado);
  ok(()=>assert.equal(separadoLido.registros.length,1));
  ok(()=>assert.equal(separadoLido.registros[0].dados.numeroTombo,"BIB.2026.1"));
  ok(()=>assert.equal(separadoLido.registros[0].original.marc.exemplaresVinculados.length,1));
  ok(()=>assert.throws(()=>ler(Buffer.from(registro([controle("004","123"),campo("949",[["a","SEM-OBRA"]])]))),/obra correspondente/));
  const koha=ler(Buffer.from(registro([campo("245",[["a","Exemplar Koha"]]),campo("952",[["p","000099"],["i","T99"],["d","2026-10-08"],["g","12.50"],["7","1"]])]))).registros[0].dados;
  ok(()=>assert.equal(koha.codigoBarras,"000099"));
  ok(()=>assert.equal(koha.permiteEmprestimo,"false"));
  ok(()=>assert.equal(koha.statusExemplar,"INDISPONIVEL"));
  const bruto=iso([["001","BIB7"],["008","261008s2020    bl                  por  "],["245","  \x1faAção e educação"],["990","  \x1faqualquer campo\x1fx"]]);
  const isoLido=ler(bruto,"biblivre.mrc").registros[0];
  ok(()=>assert.equal(isoLido.dados.titulo,"Ação e educação"));
  ok(()=>assert.equal(Buffer.compare(Buffer.from(isoLido.original.conteudoBase64,"base64"),bruto),0));
  ok(()=>assert.equal(isoLido.original.marc.campos.find(c=>c.tag==="990").subcampos.length,2));
  const leaderAntigo=Buffer.from(bruto);leaderAntigo[9]=32;
  ok(()=>assert.equal(ler(leaderAntigo,"antigo.mrc").registros[0].dados.titulo,"Ação e educação"));
  const latin=iso([["001","L1"],["245","  \x1faEducação"]],false);
  ok(()=>assert.equal(ler(latin,"latin.mrc").registros[0].dados.titulo,"Educação"));
  const invalido=Buffer.from(bruto);invalido.write("9999",27,"ascii");
  ok(()=>assert.throws(()=>ler(invalido,"truncado.mrc"),/truncado/));
  const csv=ler(Buffer.from("Titulo,Titulo uniforme,Campo personalizado\nLivro,Obra uniforme,Preservar este valor\n"),"acervo.csv").registros[0];
  ok(()=>assert.equal(csv.dados.tituloUniforme,"Obra uniforme"));
  ok(()=>assert.equal(csv.original.valores[2],"Preservar este valor"));
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([["Titulo","Dimensoes","Campo extra"],["Excel","22 cm","Completo"]]),"Acervo");
  const excel=ler(XLSX.write(workbook,{type:"buffer",bookType:"xlsx"}),"acervo.xlsx").registros[0];
  ok(()=>assert.equal(excel.dados.dimensoes,"22 cm"));
  ok(()=>assert.equal(excel.original.valores[2],"Completo"));
  const latinXml=Buffer.from(`<?xml version="1.0" encoding="ISO-8859-1"?>${registro([campo("245",[["a","Educação em português"]])])}`,"latin1");
  ok(()=>assert.equal(ler(latinXml).registros[0].dados.titulo,"Educação em português"));
  const zip=new JSZip();zip.file("obras.mrc",iso([["001","123"],["245","  \x1faLivro do ZIP"]]));zip.file("exemplares.mrc",iso([["001","99"],["004","123"],["949","  \x1faT-ZIP"]]));zip.file("imagens/capa.png",png);zip.file("extra.txt","arquivo preservado no original do lote");
  const pacote=await pacotes.abrirArquivoImportacao(await zip.generateAsync({type:"nodebuffer"}),"biblioteca.zip");
  ok(()=>assert.equal(ler(pacote.buffer,pacote.nomeArquivo).registros[0].dados.numeroTombo,"T-ZIP"));
  const indice=await capas.criarIndiceCapasZip(pacote.pacoteCapas);
  const imagem=await capas.importarImagemReferencia("imagens/capa.png",1,1,indice);
  ok(()=>assert.match(imagem.url,/storage.example/));
  const incorporada=await capas.importarImagemReferencia(data,1,1,null);
  ok(()=>assert.equal(Buffer.compare(uploads.at(-1),png),0));
  const capa=await capas.importarCapa({itemId:1,linha:1,titulo:"Livro",capaUrl:data},1,null,{buscarPorIsbn:false});
  ok(()=>assert.match(capa.url,/storage.example/));
  const homonimas=new JSZip();homonimas.file("livro-a/capa.png",png);homonimas.file("livro-b/capa.png",png);
  const indiceHomonimas=await capas.criarIndiceCapasZip(new (global.File||require("node:buffer").File)([await homonimas.generateAsync({type:"nodebuffer"})],"imagens.zip"));
  ok(()=>assert.equal(indiceHomonimas.quantidade,2));
  const imagemExata=await capas.importarImagemReferencia("livro-b/capa.png",1,1,indiceHomonimas);
  ok(()=>assert.match(imagemExata.url,/storage.example/));
  await assert.rejects(()=>capas.importarImagemReferencia("capa.png",1,1,indiceHomonimas),/não foi encontrada/);checks++;
  await assert.rejects(()=>capas.importarImagemReferencia("faltando.png",1,1,indice),/não foi encontrada/);checks++;
  const db={registrosImportados:null,imagensImportadas:null};
  const tx={bibliotecaItem:{findFirst:async()=>db,update:async({data})=>Object.assign(db,data)}};
  await preservacao.preservarOriginalImportacao(tx,1,1,extraido.registros[0].original,"lote-a");
  await preservacao.preservarOriginalImportacao(tx,1,1,extraido.registros[0].original,"lote-b");
  ok(()=>assert.equal(db.registrosImportados.length,1));
  await preservacao.preservarOriginalImportacao(tx,1,1,csv.original,"lote-c");
  ok(()=>assert.equal(db.registrosImportados.length,2));
  const nativo=preservacao.camposCatalograficosImportados(d);
  ok(()=>assert.equal(nativo.notaConteudo,"Sumário completo"));
  ok(()=>assert.equal(nativo.tiposConteudoRda[0],"texto"));
  // Exercise the real POST handler against an in-memory Prisma boundary.
  // No database, account or production catalog is used by this verification.
  const tabelas = {};
  const compara = (row, where={}) => Object.entries(where).every(([k,v]) => {
    if(k==="OR") return v.some(f=>compara(row,f));
    if(v && typeof v==="object" && "notIn" in v) return !v.notIn.includes(row[k]);
    if(v && typeof v==="object" && "equals" in v) return String(row[k]??"").toLowerCase()===String(v.equals).toLowerCase();
    return row[k]===v;
  });
  prismaTeste={};
  for (const nome of ["bibliotecaItem","bibliotecaExemplar","bibliotecaAutor","bibliotecaItemAutor","bibliotecaEditora","bibliotecaAuditoria"]) {
    tabelas[nome]=[];
    prismaTeste[nome]={
      findFirst:async({where})=>tabelas[nome].find(r=>compara(r,where))||null,
      findMany:async({where})=>tabelas[nome].filter(r=>compara(r,where)),
      create:async({data})=>{const row={id:tabelas[nome].length+1,autores:[],...data};tabelas[nome].push(row);return row;},
      update:async({where,data})=>{const row=tabelas[nome].find(r=>compara(r,where));assert(row);Object.assign(row,data);return row;},
    };
  }
  prismaTeste.$transaction=async fn=>fn(prismaTeste);
  const api=carregar("app/api/admin/biblioteca/importacao/executar/route.ts");
  const mapeamento=Object.fromEntries(imp.analisarArquivoImportacao(xml,"teste.xml").colunas.map(c=>[c.indice,c.destinoSugerido]));
  const arquivo=new (global.File||require("node:buffer").File)([xml],"teste.xml",{type:"application/xml"});
  const formulario=new Map([["arquivo",arquivo],["mapeamento",JSON.stringify(mapeamento)],["confirmacao","IMPORTAR"],["buscarCapasIsbn","false"]]);
  const resposta=await api.POST({formData:async()=>({get:k=>formulario.get(k)||null}),headers:{get:()=>null}});
  const corpo=await resposta.json();
  ok(()=>assert.equal(resposta.status,201,JSON.stringify(corpo)));
  ok(()=>assert.equal(corpo.resultado.obrasCriadas,1));
  ok(()=>assert.equal(corpo.resultado.exemplaresCriados,2));
  ok(()=>assert.equal(corpo.resultado.originaisPreservados,1));
  ok(()=>assert.equal(tabelas.bibliotecaItem[0].sinopse,d.sinopse));
  ok(()=>assert.equal(tabelas.bibliotecaItem[0].registrosImportados.length,1));
  ok(()=>assert.equal(tabelas.bibliotecaItem[0].imagensImportadas.length,2));
  ok(()=>assert.equal(corpo.resultado.falhasImagens,1));
  ok(()=>assert.equal(tabelas.bibliotecaItemAutor.filter(a=>a.funcao==="EDITOR").length,1));
  ok(()=>assert.equal(Buffer.compare(Buffer.from(tabelas.bibliotecaAuditoria.find(a=>a.metadados?.conteudoOriginalBase64).metadados.conteudoOriginalBase64,"base64"),xml),0));
  const arquivoApi=carregar("app/api/admin/biblioteca/importacao/lotes/[loteId]/arquivo/route.ts");
  const originalResposta=await arquivoApi.GET({}, {params:{loteId:corpo.resultado.loteId}});
  ok(()=>assert.equal(originalResposta.status,200));
  const originalBytes=Buffer.from(await originalResposta.arrayBuffer());
  ok(()=>assert.equal(Buffer.compare(originalBytes,xml),0));
  const consulta=carregar("app/api/admin/biblioteca/acervo/[itemId]/dados-importados/route.ts");
  const dadosResposta=await consulta.GET({}, {params:{itemId:"1"}});
  ok(()=>assert.equal(dadosResposta.status,200));
  // Rows belonging to another institution must not be visible.
  tabelas.bibliotecaItem[0].instituicaoId=2;
  const outraInstituicao=await consulta.GET({}, {params:{itemId:"1"}});
  ok(()=>assert.equal(outraInstituicao.status,404));
  for(const rows of Object.values(tabelas))rows.length=0;
  const homonimos=Buffer.concat(["Pedro Moura","Herschel H. Hobbs","F. Dattler"].map((autor,i)=>
    Buffer.concat([iso([["001",`H${i+1}`],["245","  \x1faA Carta aos Hebreus"],["100",`1 \x1fa${autor}`]]),Buffer.from("\r\n")])));
  const mapaHomonimos=Object.fromEntries(imp.analisarArquivoImportacao(homonimos,"homonimos.mrc").colunas.map(c=>[c.indice,c.destinoSugerido]));
  const formHomonimos=new Map([["arquivo",new (global.File||require("node:buffer").File)([homonimos],"homonimos.mrc")],
    ["mapeamento",JSON.stringify(mapaHomonimos)],["confirmacao","IMPORTAR"],["buscarCapasIsbn","false"]]);
  const reqHomonimos=()=>({formData:async()=>({get:k=>formHomonimos.get(k)||null}),headers:{get:()=>null}});
  const respHomonimos=await api.POST(reqHomonimos()),bodyHomonimos=await respHomonimos.json();
  ok(()=>assert.equal(respHomonimos.status,201,JSON.stringify(bodyHomonimos)));
  ok(()=>assert.equal(bodyHomonimos.resultado.obrasCriadas,3));
  ok(()=>assert.equal(bodyHomonimos.resultado.exemplaresCriados,0));
  ok(()=>assert.equal(tabelas.bibliotecaItem.length,3));
  ok(()=>assert.equal(tabelas.bibliotecaAutor.length,3));
  const novamenteHomonimos=await api.POST(reqHomonimos()),bodyNovamenteHomonimos=await novamenteHomonimos.json();
  ok(()=>assert.equal(novamenteHomonimos.status,409));
  ok(()=>assert.equal(bodyNovamenteHomonimos.codigo,"IMPORTACAO_POSSIVEL_DUPLICIDADE"));
  ok(()=>assert.equal(tabelas.bibliotecaItem.length,3));
  const caminhoReal=process.argv[2];
  if(caminhoReal){
    const bytes=fs.readFileSync(path.resolve(caminhoReal)),nome=path.basename(caminhoReal);
    const real=ler(bytes,nome);
    assert(real.registros.length>0,"O arquivo não contém registros bibliográficos.");
    // Walk the original ISO2709 bytes independently of the importer.
    const originais=[];let pos=0;
    while(pos<bytes.length){
      while(pos<bytes.length&&[9,10,13,32].includes(bytes[pos]))pos++;
      if(pos===bytes.length)break;
      const tamanho=Number(bytes.subarray(pos,pos+5).toString("ascii"));
      assert(Number.isInteger(tamanho)&&tamanho>=25&&pos+tamanho<=bytes.length);
      assert.equal(bytes[pos+tamanho-1],0x1d);
      originais.push(bytes.subarray(pos,pos+tamanho));pos+=tamanho;
    }
    ok(()=>assert.equal(real.registros.length,originais.length));
    for(const [i,r] of real.registros.entries()){
      ok(()=>assert.equal(Buffer.compare(Buffer.from(r.original.conteudoBase64,"base64"),originais[i]),0));
    }
    for(const rows of Object.values(tabelas))rows.length=0;
    const mapaReal=Object.fromEntries(imp.analisarArquivoImportacao(bytes,nome).colunas.map(c=>[c.indice,c.destinoSugerido]));
    const formReal=new Map([["arquivo",new (global.File||require("node:buffer").File)([bytes],nome)],
      ["mapeamento",JSON.stringify(mapaReal)],["confirmacao","IMPORTAR"],["buscarCapasIsbn","false"]]);
    const requisicao=()=>({formData:async()=>({get:k=>formReal.get(k)||null}),headers:{get:()=>null}});
    const respReal=await api.POST(requisicao()),bodyReal=await respReal.json();
    ok(()=>assert.equal(respReal.status,201,JSON.stringify(bodyReal)));
    ok(()=>assert.equal(bodyReal.resultado.originaisPreservados,real.registros.length));
    ok(()=>assert.equal(bodyReal.resultado.obrasCriadas,real.registros.length));
    ok(()=>assert(tabelas.bibliotecaItem.every(r=>r.registrosImportados.length===1)));
    ok(()=>assert(tabelas.bibliotecaItem.every(r=>r.status==="RASCUNHO")));
    const loteOriginal=tabelas.bibliotecaAuditoria.find(r=>r.metadados?.conteudoOriginalBase64);
    ok(()=>assert.equal(Buffer.compare(Buffer.from(loteOriginal.metadados.conteudoOriginalBase64,"base64"),bytes),0));
    const repetida=await api.POST(requisicao()),bodyRepetida=await repetida.json();
    ok(()=>assert.equal(repetida.status,409,JSON.stringify(bodyRepetida)));
    ok(()=>assert.equal(bodyRepetida.codigo,"IMPORTACAO_POSSIVEL_DUPLICIDADE"));
    ok(()=>assert.equal(tabelas.bibliotecaItem.length,real.registros.length));
    ok(()=>assert(tabelas.bibliotecaItem.every(r=>r.registrosImportados.length===1)));
    ok(()=>assert.equal(bodyReal.resultado.exemplaresCriados,0));
    ok(()=>assert(real.registros.every(r=>!r.imagens.length)));
    console.log(`SIMULAÇÃO: ${real.registros.length} registros; ${bodyReal.resultado.obrasCriadas} obras; ${bodyReal.resultado.exemplaresCriados} exemplares; originais preservados; reimportação bloqueada para revisão.`);
  }
  console.log(`OK: ${checks} verificações de importação, originais, exemplares e imagens.`);
}
main().catch(erro=>{console.error(erro);process.exitCode=1;});
