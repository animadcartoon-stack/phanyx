'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { validarMensagemTraduzida } = require('./reatribuicao-traducoes-assert.cjs');
const base = path.resolve(__dirname, '..');
const get = rel => fs.readFileSync(path.join(base,rel),'utf8');
const ui = get('components/admin/ReatribuicaoAlunoAnalise.tsx');
const conf = get('app/api/admin/matriculas/[id]/reatribuicao/confirmar/route.ts');
const doc = get('app/api/admin/matriculas/[id]/reatribuicao/documento/route.ts');
let checks = 0;
function ok(condition, description) {assert.ok(condition,description); checks++;}
for (const [name,src,kind] of [
  ['ui',ui,ts.ScriptKind.TSX], ['confirm',conf,ts.ScriptKind.TS], ['documento',doc,ts.ScriptKind.TS],
]) {
  const node = ts.createSourceFile(name,src,ts.ScriptTarget.Latest,true,kind);
  ok(node.parseDiagnostics.length === 0, name+' sintaxe TypeScript');
}
for (const x of ['administradorCombos()', 'execucaoHabilitada(', 'PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST',
  'ep-ancient-mud-b6ptxf53.c-2.sa-east-1.aws.neon.tech', 'tipo: "TERMO_ASSINADO"', 'status: "VINCULADO"',
  'removidoEm: null', 'expiraEm: { gt: new Date() }', 'enviadoPorId: usuario.id',
  'getR2Client()', 'PHANYX_REATRIBUICAO_R2_BUCKET_PRIVADO', 'R2_BUCKET_NAME',
  'Content-Disposition', 'attachment', '"Content-Type": "application/pdf"',
  'ContentType: "application/pdf"', '"Cache-Control": "private, no-store"',
  '"Content-Type": "application/pdf"']) ok(doc.includes(x),'Documentos: '+x);
ok(!doc.includes('R2_PUBLIC_URL'),'Não criar URL pública');
ok(!doc.includes('execFile') && !doc.includes('eval('),'Não executar comandos');
for(const x of [ 'documentoTermoAssinadoId', 'transferenciaId: entrada.transferenciaId',
  'termoNaTransacao', 'HeadObjectCommand', 'documentoTermoAssinadoConferidoPorId',
  'tipo: "TERMO_ASSINADO"', 'status: "VINCULADO"', 'removidoEm: null',
  'PHANYX_REATRIBUICAO_R2_BUCKET_PRIVADO', 'if (!habilitada())' ]) ok(conf.includes(x),'Confirmação: '+x);
for(const x of ['enviarDocumentoTermoAssinado', 'type="file"', 'documentoTermoAssinadoId',
  '!documentoTermo?.id', 'reconheceAutorizacao', 'fraseConfirmacao', 'Baixar documento para conferência']) {
  ok(x === 'Baixar documento para conferência'
    ? validarMensagemTraduzida(ui, 'downloadToReview', x) : ui.includes(x), 'Tela: '+x);
}
console.log(`[OK] Termo assinado vinculado: ${checks} verificações estáticas, sem chamadas de rede nem escrita no banco.`);
