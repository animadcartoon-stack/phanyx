'use strict';
// Verifica a ligação entre rótulos da interface e os cinco catálogos.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '..');
const idiomas = ['pt-BR', 'pt-PT', 'en-US', 'es-ES', 'fr-FR'];

function validarMensagemTraduzida(componente, chave, trechoPtBR) {
  assert.ok(componente.includes('useTranslations("AdminReatribuicaoAluno")'),
    'Componente sem namespace i18n de reatribuição');
  assert.ok(componente.includes('t("' + chave + '")'),
    'Interface não utiliza a chave ' + chave);
  for (const idioma of idiomas) {
    const catalogo = JSON.parse(fs.readFileSync(
      path.join(raiz, 'messages', idioma + '.json'), 'utf8'));
    const texto = catalogo?.AdminReatribuicaoAluno?.[chave];
    assert.ok(typeof texto === 'string' && texto.trim().length > 0,
      'Tradução ausente ou vazia: ' + idioma + ' / ' + chave);
    if (idioma === 'pt-BR') {
      assert.ok(texto.includes(trechoPtBR),
        'Texto pt-BR inesperado em ' + chave + ': ' + texto);
    }
  }
  return true;
}
module.exports = { validarMensagemTraduzida };
