const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const read = (file) => readFileSync(resolve(__dirname, "../..", file), "utf8");

test("contatos públicos do PHANYX não divulgam os canais antigos", () => {
  const arquivos = [
    "app/page.tsx",
    "app/planos/page.tsx",
    "app/contato/page.tsx",
    "app/suporte/page.tsx",
    "components/layout/Header.tsx",
    "components/layout/Footer.tsx",
    "components/marketing/LocalizedHeader.tsx",
    "components/marketing/LocalizedMarketingPage.tsx",
    "components/marketing/LocalizedPlansPage.tsx",
    "components/marketing/SearchIntentPage.tsx",
    "components/marketing/EnrollmentPage.tsx",
    "components/marketing/RegistrarPage.tsx",
    "components/marketing/SuporteEmailButton.tsx",
  ];

  for (const arquivo of arquivos) {
    assert.doesNotMatch(
      read(arquivo),
      /5548988101240|atendimento@institutobatista\.com|98810-1240|3208-1353|554832081353/i,
      arquivo,
    );
  }
});

test("o site do PHANYX não encaminha visitantes à matrícula do IBE", () => {
  const arquivos = [
    "app/page.tsx",
    "app/planos/page.tsx",
    "components/layout/Footer.tsx",
    "components/marketing/LocalizedMarketingPage.tsx",
  ];
  for (const arquivo of arquivos) {
    assert.ok(!read(arquivo).includes("/ibe/matricula"), arquivo);
  }
});

test("links de e-mail separam atendimento técnico de contato comercial", () => {
  const exports = {};
  const { outputText } = ts.transpileModule(read("lib/contatos-phanyx.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  vm.runInNewContext(outputText, { exports });

  const assunto = "Proposta de demonstração — PHANYX & instituição";
  const comercial = new URL(exports.linkContatoPhanyx(assunto));
  assert.equal(comercial.protocol, "mailto:");
  assert.equal(comercial.pathname, "contato@phanyx.com.br");
  assert.equal(comercial.searchParams.get("subject"), assunto);

  const suporte = new URL(exports.linkSuportePhanyx);
  assert.equal(suporte.protocol, "mailto:");
  assert.equal(suporte.pathname, "suporte@phanyx.com.br");
});
