const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const page = read('app/admin/documentos/templates/page.tsx');
const editor = read('components/documentos/EditorTemplatePHANYX.tsx');
const variaveis = read('components/documentos/PreviewVariaveisPHANYX.ts');
function markers(source, list) { for (const item of list) assert.ok(source.includes(item), 'Contrato ausente: '+item); }
// Smoke checks only: these detect missing wiring, not browser behavior.
test('mantém conexões da prévia flutuante e automática', () => markers(page,['pdfFlutuante &&','createPortal(','void visualizarPdfTemplate()','fixed bottom-[104px]','previaAutomatica','/api/admin/documentos/templates/preview-pdf-fiel','src={urlPreviaPdf}']));
test('mantém recuperação e finalização de rascunho', () => markers(page,['rascunho.recuperar()','rascunho.finalizar(payload)','rascunho.descartar()','rascunho.tentarNovamente()']));
test('mantém comandos de formatação do editor', () => markers(editor,['setFontFamily(','FontSize','setColor(','toggleBold()','toggleItalic()','toggleUnderline()','TextAlign.configure(','Segoe Script']));

test('carrega os dados da instituição sem recriar o editor e atualiza a assinatura renderizada', () => {
  const inicializacao = editor.slice(editor.indexOf('const editor = useEditor('), editor.indexOf('const extensaoPageBreak ='));
  assert.ok(/onChange\(html\);\s*},\s*}\);/.test(inicializacao));

  const dadosAssinatura = editor.slice(editor.indexOf('const chaveAssinaturaPreview ='), editor.indexOf('const localeFerramentas ='));
  markers(dadosAssinatura, ['assinaturaDiretorUrl', 'responsavelNome', 'responsavelCargo', 'nomeInstituicao', 'cnpjInstituicao', 'chaveCampoVisualAssinatura']);
  markers(editor, ['editor.storage[AssinaturaPreviewPHANYX.name]', 'chaveVisual: chaveAssinaturaPreview', '${padrao.tipo}-${inicio}-${dados.chaveVisual', 'phanyxAtualizarAssinaturaPreview']);
  markers(editor, ['editor.storage[PreviewVariaveisPHANYX.name]', 'dados.valores = valoresPreviewVariaveis']);
  markers(variaveis, ['addStorage()', 'const dados = this.storage']);

  const chaveComponente = page.match(/<EditorTemplatePHANYX[\s\S]*?key=\{\[([\s\S]*?)\]\.join/);
  assert.ok(chaveComponente);
  markers(chaveComponente[1], ['editingId', 'formatoImpressao']);
  assert.doesNotMatch(chaveComponente[1], /certificadoAssinaturaUrl/);
});
