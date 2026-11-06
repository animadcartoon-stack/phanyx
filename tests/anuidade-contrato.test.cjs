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
  assert.ok(nomes.every(nome => Object.hasOwn(valores, nome)));
  assert.match(valores.textoMatriculaAnuidade, /abatida da primeira parcela/);
  assert.doesNotMatch(replaceDocumentTags(template, valores), /{{/);
  assert.equal(valores.inicioAnuidade, "15/02/2027");
  assert.equal(valores.fimAnuidade, "o indicado no Anexo I");
  assert.equal(valores.ultimoVencimentoAnuidade, "05/11/2027");
  assert.equal(valores.vencimentoAntecipacaoAnuidade, "30/11/2026");
  assert.equal(valores.totalAnuidadeContratual, moeda(4320));
  assert.equal(valores.descontoPontualidadeAnuidade, moeda(422.15));
  assert.equal(valores.totalAnuidadePontual, moeda(3897.85));
});

test("pede atualização quando o modelo antigo descreve taxa separada como antecipação", () => {
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

const templateConfiguravel = "{{totalAnuidadeContratual}} / {{textoMatriculaAnuidade}} / {{textoPontualidadeAnuidade}}";

test("taxa separada é somada ao total e não recebe desconto de pontualidade", () => {
  const { valores, pendencia } = montarDadosAnuidadeContrato(templateConfiguravel, {
    ...matricula,
    valorMatricula: 98.5,
    lancamentosFinanceiros: [{ tipo: "MATRICULA", vencimento: new Date("2026-12-05T12:00:00Z") }],
  });
  assert.equal(pendencia, null);
  assert.equal(valores.totalAnuidadeContratual, moeda(4418.5));
  assert.equal(valores.antecipacaoAnuidade, moeda(0));
  assert.match(valores.textoMatriculaAnuidade, /cobrada separadamente/);
  assert.match(valores.textoMatriculaAnuidade, /05\/12\/2026/);
  assert.equal(valores.descontoPontualidadeAnuidade, moeda(432));
  assert.equal(valores.totalAnuidadePontual, moeda(3986.5));
  assert.ok(valores.textoPontualidadeAnuidade.includes(moeda(3986.5)));
  assert.doesNotMatch(replaceDocumentTags(templateConfiguravel, valores), /{{/);
});

test("sem taxa ou desconto, não inventa cobrança, antecipação ou benefício", () => {
  const { valores, pendencia } = montarDadosAnuidadeContrato(templateConfiguravel, {
    ...matricula,
    descontoPontualidade: null,
  });
  assert.equal(pendencia, null);
  assert.equal(valores.totalAnuidadeContratual, moeda(4320));
  assert.equal(valores.totalAnuidadePontual, moeda(4320));
  assert.match(valores.textoMatriculaAnuidade, /não prevê taxa/);
  assert.match(valores.textoPontualidadeAnuidade, /não prevê desconto/);
});

test("as duas faixas configuradas na matrícula aparecem com condições e totais próprios", () => {
  const { valores, pendencia } = montarDadosAnuidadeContrato(templateConfiguravel, {
    ...matricula,
    descontoPontualidade: {
      antecipado: { percentual: 10, diasAntecedencia: 3 },
      vencimento: { percentual: 5, diasAntecedencia: 0 },
    },
  });
  assert.equal(pendencia, null);
  assert.match(valores.textoPontualidadeAnuidade, /3 dias de antecedência recebe 10%/);
  assert.match(valores.textoPontualidadeAnuidade, /até o vencimento recebe 5%/);
  assert.ok(valores.textoPontualidadeAnuidade.includes(moeda(3888)));
  assert.ok(valores.textoPontualidadeAnuidade.includes(moeda(4104)));
});
