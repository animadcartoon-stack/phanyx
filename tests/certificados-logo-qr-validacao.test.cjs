'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p), 'utf8');
const editor = read('app/admin/configuracoes/certificado/page.tsx');
const render = read('components/certificados/CertificadoRender.tsx');
const page = read('app/certificados/render/[certificadoId]/page.tsx');
const api = read('app/api/admin/configuracoes/instituicao/route.ts');
const legacy = read('lib/certificados/gerarCertificado.ts');

test('o editor carrega a logomarca do cadastro institucional', () => {
  assert.match(api, /logoUrl:\s*config\?\.logoUrl\s*\|\|\s*instituicao\?\.logoUrl\s*\|\|\s*null/);
  assert.match(editor, /setCertificadoLogoUrl\(String\(dataInstituicao\?\.logoUrl\s*\|\|\s*""\)\)/);
  assert.match(editor, /logoUrl:\s*certificadoLogoUrl\s*\|\|\s*null/);
});
test('editor usa imagem verdadeira para campo de logo no canvas', () => {
  assert.match(editor, /c\.tipo === "LOGO_INSTITUICAO"\s*\?\s*\(/);
  assert.match(editor, /src=\{dadosPreviewCertificado\.logoUrl\}/);
  assert.match(editor, /alt=\{tr\("fieldTypes\.LOGO_INSTITUICAO"\)\}/);
});
test('editor gera QR Code de exemplo, e a prévia o recebe', () => {
  assert.match(editor, /QRCode\.toDataURL\(linkExemplo\.toString\(\),\s*\{\s*width:\s*300,\s*margin:\s*1\s*\}\)/);
  assert.match(editor, /qrCodeUrl:\s*qrCodePreviewUrl\s*\|\|\s*null/);
  assert.match(editor, /c\.tipo === "QR_CODE"\s*\?\s*\(/);
  assert.match(editor, /src=\{dadosPreviewCertificado\.qrCodeUrl\}/);
});
test('código fictício é restrito ao editor de amostra', () => {
  assert.match(editor, /codigoValidacao:\s*"ABC123XYZ"/);
  assert.doesNotMatch(page, /ABC123XYZ/);
});
test('emissão real gera QR Code codificando o código salvo no certificado', () => {
  assert.match(page, /const codigoParaValidacao = certificado\?\.codigo \|\| String\(certificado\.id\)/);
  assert.match(page, /linkValidacao\.searchParams\.set\("codigo", codigoParaValidacao\)/);
  assert.match(page, /QRCode\.toDataURL\(linkValidacao\.toString\(\),\s*\{/);
  assert.match(page, /codigoValidacao:\s*codigoParaValidacao/);
  assert.match(page, /qrCodeUrl,\s*\n\s*\}/);
});
test('renderizador compartilhado renderiza QR como imagem e não texto quando QR está disponível', () => {
  assert.match(render, /dados\.qrCodeUrl\s*\?\s*\(/);
  assert.match(render, /src=\{dados\.qrCodeUrl\}/);
});
test('logo da instituição tem prioridade sobre imagem fixa antiga do campo', () => {
  assert.match(render, /campo\.tipo === "LOGO_INSTITUICAO"\s*\?\s*dados\.logoUrl\s*\|\|\s*urlDoCampo/);
  assert.match(page, /logoUrl:\s*configuracaoInstituicao\?\.logoUrl\s*\|\|/);
});
test('PDF legado mantém geração do QR Code verdadeiro', () => {
  assert.match(legacy, /QRCode\.toDataURL\(urlValidacao/);
  assert.match(legacy, /encodeURIComponent\(\s*dados\.codigoValidacao/);
});
test('biblioteca QR instalada gera uma imagem PNG real para um link de validação', async () => {
  const QRCode = require('qrcode');
  const url = 'https://www.phanyx.com.br/validar-certificado?codigo=PHANYX-TESTE-123';
  const png = await QRCode.toDataURL(url, { width: 300, margin: 1 });
  assert.match(png, /^data:image\/png;base64,/);
  assert.equal(Buffer.from(png.split(',')[1], 'base64').subarray(0,8).toString('hex'), '89504e470d0a1a0a');
});
test('emissão real mantém dados do aluno obtidos do cadastro', () => {
  assert.match(page, /nomeAluno:\s*aluno\?\.nome \|\| ""/);
  assert.match(page, /numeroMatricula:\s*matriculaRelacionada\?\.numeroMatricula/);
  assert.match(page, /nomeCurso:\s*curso\?\.nome/);
});
test('edição não modifica dimensões e coordenadas dos elementos', () => {
  assert.match(render, /left:\s*Number\(campo\.x \|\| 0\)/);
  assert.match(render, /top:\s*Number\(campo\.y \|\| 0\)/);
  assert.match(render, /width:\s*largura/);
  assert.match(render, /height:\s*altura/);
});
