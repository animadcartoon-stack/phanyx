const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const resolver = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith("@/")) request = path.resolve(__dirname, "..", request.slice(2));
  return resolver.call(this, request, parent, ...rest);
};
Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);

const { montarDadosAnuidadeContrato } = require("../lib/contratos/anuidade-contrato.ts");
const { replaceDocumentTags } = require("../lib/documentos/tags-documentos.ts");

const nomes = [
  "inicioAnuidade", "fimAnuidade", "baseAnuidade", "percentualDescontoConjunto", "descontoComercialAnuidade",
  "bolsaAnuidade", "totalAnuidadeContratual", "quantidadeParcelasAnuidade", "primeiroVencimentoAnuidade",
  "ultimoVencimentoAnuidade", "antecipacaoAnuidade", "vencimentoAntecipacaoAnuidade", "percentualPontualidade",
  "descontoPontualidadeAnuidade", "totalAnuidadePontual",
];
const template = nomes.map(nome => "{{" + nome + "}}").join(" / ");
const moeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
const matricula = {
  dataInicioCurso: new Date("2027-02-15T00:00:00Z"),
  primeiroVencimento: new Date("2026-12-05T12:00:00Z"),
  valorMensalidade: 360,
  quantidadeMensalidades: 12,
  descontoPontualidade: { percentual: 10, diasAntecedencia: 0 },
};

test("modelos sem variáveis de anuidade continuam independentes do cronograma", () => {
  assert.deepEqual(montarDadosAnuidadeContrato("{{nomeAluno}}", {}), { valores: {}, pendencia: null });
});

test("preenche as 15 variáveis com o crédito congelado no plano e calendário no anexo", () => {
  const { valores, pendencia } = montarDadosAnuidadeContrato(template, {
    ...matricula,
    valorMatricula: 98.5,
    planoPagamentoContratado: {
      versao: 1, primeiroVencimento: "2026-12-05", quantidadeParcelas: 12,
      antecipacaoCentavos: 9850, totalCentavos: 432000,
      parcelasCentavos: Array(12).fill(36000),
      parcelasExigiveisCentavos: [26150, ...Array(11).fill(36000)],
    },
    lancamentosFinanceiros: [{ tipo: "MATRICULA", vencimento: new Date("2026-11-30T12:00:00Z") }],
  });
  assert.equal(pendencia, null);
  assert.deepEqual(Object.keys(valores).sort(), nomes.sort());
  assert.doesNotMatch(replaceDocumentTags(template, valores), /{{/);
  assert.equal(valores.inicioAnuidade, "15/02/2027");
  assert.equal(valores.fimAnuidade, "o indicado no Anexo I");
  assert.equal(valores.ultimoVencimentoAnuidade, "05/11/2027");
  assert.equal(valores.vencimentoAntecipacaoAnuidade, "30/11/2026");
  assert.equal(valores.totalAnuidadeContratual, moeda(4320));
  assert.equal(valores.descontoPontualidadeAnuidade, moeda(422.15));
  assert.equal(valores.totalAnuidadePontual, moeda(3897.85));
});

test("identifica taxa separada e não a apresenta como antecipação abatida", () => {
  const { valores, pendencia } = montarDadosAnuidadeContrato(template, { ...matricula, valorMatricula: 98.5 });
  assert.deepEqual(valores, {});
  assert.match(pendencia, /taxa separada/);
});

test("sem antecipação, usa bolsa e fim da turma se informado", () => {
  const { valores, pendencia } = montarDadosAnuidadeContrato(template, {
    ...matricula, bolsaPercentual: 25, turmaPrincipal: { dataFim: new Date("2027-12-09T00:00:00Z") },
  });
  assert.equal(pendencia, null);
  assert.equal(valores.fimAnuidade, "09/12/2027");
  assert.equal(valores.bolsaAnuidade, moeda(1080));
  assert.equal(valores.totalAnuidadeContratual, moeda(3240));
  assert.equal(valores.vencimentoAntecipacaoAnuidade, "não se aplica");
});
