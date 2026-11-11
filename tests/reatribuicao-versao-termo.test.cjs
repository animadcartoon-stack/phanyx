'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const arquivos=[
 'lib/matriculas/reatribuicao-vinculo-termo.ts',
 'lib/matriculas/reatribuicao-termo.ts',
 'app/api/admin/matriculas/[id]/reatribuicao/termo/route.ts',
 'app/api/admin/matriculas/[id]/reatribuicao/documento/route.ts',
 'app/api/admin/matriculas/[id]/reatribuicao/confirmar/route.ts',
 'components/admin/ReatribuicaoAlunoAnalise.tsx',
];
let cont=0;
function ok(v,msg){assert.ok(v,msg);cont++}
for(const p of arquivos){const c=read(p);const n=ts.createSourceFile(p,c,ts.ScriptTarget.Latest,true,p.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);ok(n.parseDiagnostics.length===0,p+': TS sem erro sintático')}
const helper=read(arquivos[0]),gerador=read(arquivos[1]),termo=read(arquivos[2]);
const documento=read(arquivos[3]),confirmar=read(arquivos[4]),ui=read(arquivos[5]);
for(const x of ['PLANO_SHA256:', 'p.registradoEm', 'p.calculo', 'Object.keys(obj).sort()', 'PDF_SHA256:', 'conferirHashPdf'])ok(helper.includes(x),'Helper: '+x);
for(const x of ['referenciaPlano: referenciaPlanoReatribuicao(salvo)', 'gerarMinutaReatribuicao'])ok(termo.includes(x),'Minuta API: '+x);
for(const x of ['Identificador do plano assinado:', 'referenciaPlano: entrada.referenciaPlano'])ok(gerador.includes(x),'Gerador: '+x);
for(const x of ['numeroDocumento: referenciaPlano', 'referenciaPlanoInformada', 'referenciaPlanoReatribuicao(protocolosAtualizados?.snapshotPosterior)', 'descricao: descricaoPdf(hashPdf)', 'numeroDocumento: referenciaPlanoAtual', 'const referenciaPlanoAtual'])ok(documento.includes(x),'Documentos: '+x);
for(const x of ['GetObjectCommand', 'conferirHashPdf(documento.descricao, bytesPdf)', 'numeroDocumento: true, descricao: true', 'termoNaTransacao.numeroDocumento !== referenciaPlanoReatribuicao(transferencia.snapshotPosterior)'])ok(confirmar.includes(x),'Confirmação: '+x);
for(const x of ['formulario.set("referenciaPlano", minuta.referenciaPlano)', 'minuta?.referenciaPlano', 'propostaAcademica?.registradoEm'])ok(ui.includes(x),'UI: '+x);
// Testes dinâmicos puros, via transpile do helper, sem Next ou banco.
const convertido=ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
const fn=new Function('require','module','exports',convertido);
fn(require,mod,mod.exports);
const {referenciaPlanoReatribuicao, sha256Pdf, descricaoPdf, conferirHashPdf}=mod.exports;
const plano={finalidade:'PLANO_ACADEMICO_SEM_EXECUCAO',registradoEm:'2026-11-10T20:00:00.000Z',turmaIds:[1],versaoOfertas:'a'.repeat(64),calculo:{total:1000},optativaSessaoIds:[],alunoDestinoId:2};
const h=referenciaPlanoReatribuicao(plano);
ok(/^PLANO_SHA256:[0-9a-f]{64}$/.test(h),'Gera hash do plano');
ok(referenciaPlanoReatribuicao({...plano,calculo:{total:1200}})!==h,'Mudança em valores invalida termo');
ok(referenciaPlanoReatribuicao({...plano,turmaIds:[2]})!==h,'Mudança de turma invalida termo');
ok(referenciaPlanoReatribuicao({...plano,registradoEm:'2026-11-10T20:01:00.000Z'})!==h,'Novo salvamento invalida termo');
ok(referenciaPlanoReatribuicao({versaoOfertas:'a'.repeat(64)})===null,'Sem plano salvo não emite versão');
ok(referenciaPlanoReatribuicao({calculo:plano.calculo,...plano})===h,'Ordem das chaves não altera versão');
const bytes=Buffer.from('%PDF-1.7\nEXEMPLO');const pdfHash=sha256Pdf(bytes);const d=descricaoPdf(pdfHash);
ok(conferirHashPdf(d,bytes),'PDF íntegro');
ok(!conferirHashPdf(d,Buffer.from('%PDF-1.7\nALTERADO')),'PDF alterado é recusado');
console.log('[OK] Versão do termo: '+cont+' verificações estáticas e funcionais, sem rede ou banco.');
