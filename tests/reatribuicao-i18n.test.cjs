const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const component = fs.readFileSync(path.join(root, 'components/admin/ReatribuicaoAlunoAnalise.tsx'), 'utf8');
const locales = ['pt-BR', 'pt-PT', 'en-US', 'es-ES', 'fr-FR'];
const translations = Object.fromEntries(locales.map(locale => [
  locale,
  JSON.parse(fs.readFileSync(path.join(root, 'messages', `${locale}.json`), 'utf8')).AdminReatribuicaoAluno,
]));

const getPlaceholders = text => [...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]).sort();

test('PHANYX | reatribuição traduzida em cinco idiomas', () => {
  for (const locale of locales) {
    assert.ok(translations[locale], `Namespace ausente em ${locale}`);
    assert.deepEqual(Object.keys(translations[locale]).sort(), Object.keys(translations['pt-BR']).sort(), `Chaves divergem em ${locale}`);
    for (const [key, value] of Object.entries(translations[locale])) {
      assert.equal(typeof value, 'string', `Valor não é string: ${locale}.${key}`);
      assert.ok(value.trim(), `Tradução vazia: ${locale}.${key}`);
      assert.deepEqual(getPlaceholders(value), getPlaceholders(translations['pt-BR'][key]), `Interpolação divergente: ${locale}.${key}`);
    }
  }
  const staticKeys = [...component.matchAll(/\bt\("([A-Za-z][A-Za-z0-9_]*)"/g)].map(match => match[1]);
  assert.ok(staticKeys.length > 100, `Poucas referências de tradução: ${staticKeys.length}`);
  for (const key of staticKeys) {
    assert.ok(Object.hasOwn(translations['pt-BR'], key), `Chave não localizada no componente: ${key}`);
  }
  assert.ok(component.includes('useTranslations("AdminReatribuicaoAluno")'));
  assert.ok(component.includes('useLocale()'));
  assert.ok(component.includes('new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" })'));
  assert.ok(!component.includes('.toLocaleLowerCase("pt-BR")'));
  assert.ok(component.includes('documentoTermoAssinadoId: documentoTermo.id'));
  assert.ok(component.includes('formulario.set("referenciaPlano", minuta.referenciaPlano)'));
  assert.ok(component.includes('confirmacaoDigitada: fraseConfirmacao'));
  assert.ok(component.includes('fraseConfirmacao !== "REATRIBUIR"'));
  assert.ok(component.includes('ultimaRestauracaoRef'));
  console.log(`[OK] i18n reatribuição: ${Object.keys(translations['pt-BR']).length} mensagens por idioma, 5 idiomas; estrutura documental mantida.`);
});
