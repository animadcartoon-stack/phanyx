const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");

const read = (file) => readFileSync(resolve(__dirname, "../..", file), "utf8");

for (const { rota, titulo, canal } of [
  { rota: "politica-de-privacidade", titulo: "Política de Privacidade", canal: "suporte" },
  { rota: "termos-de-uso", titulo: "Termos de Uso", canal: "comercial" },
]) {
  test(`o rodapé abre ${titulo} e oferece o contato adequado`, () => {
    assert.ok(read("components/layout/Footer.tsx").includes(`href="/${rota}"`));
    const pagina = read(`app/${rota}/page.tsx`);

    assert.ok(pagina.includes(titulo));
    assert.ok(pagina.includes(`canal="${canal}"`));
    assert.match(pagina, /robots: \{ index: false, follow: true \}/);
    assert.match(pagina, /<PaginaInstitucionalPhanyx/);
    assert.match(read("components/marketing/PaginaInstitucionalPhanyx.tsx"), /<OpcoesEmailPhanyx canal=\{canal\} assunto=\{titulo\}/);
  });
}
