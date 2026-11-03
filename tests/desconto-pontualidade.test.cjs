const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function carregar(arquivo, mocks = {}, globals = {}) {
  const raiz = path.resolve(__dirname, "..");
  const arquivoCompleto = path.resolve(raiz, arquivo);
  const { outputText } = ts.transpileModule(fs.readFileSync(arquivoCompleto, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, process, console, Date, Intl, AbortSignal, ...globals,
    require(nome) {
      if (nome in mocks) return mocks[nome];
      if (nome.startsWith("@/")) return carregar(nome.slice(2) + ".ts", mocks, globals);
      if (nome.startsWith(".")) {
        return carregar(path.resolve(path.dirname(arquivoCompleto), nome + ".ts"), mocks, globals);
      }
      return require(nome);
    },
  }, { filename: arquivoCompleto });
  return exports;
}

const { cotarDescontoPontualidade, diaFinanceiro, lerDescontoPontualidade } =
  carregar("lib/financeiro/desconto-pontualidade.ts");
const { analisarDivergencia } = carregar("lib/financeiro/divergencias.ts");
const regra = { percentual: 5, diasAntecedencia: 3 };
const parcela = {
  id: 42, tipo: "MENSALIDADE", status: "PENDENTE",
  instituicaoId: 7, alunoId: 8, matriculaId: 9,
  valorOriginal: 360, valorFinal: 300, valorPago: 0, pagamentos: [],
  vencimento: new Date("2027-03-10T00:00:00.000Z"),
  matricula: { descontoPontualidade: regra },
};

test("antecedência usa a data civil do vencimento e aceita o dia-limite", () => {
  assert.equal(diaFinanceiro(new Date("2027-03-08T01:00:00Z")), "2027-03-07");
  assert.equal(cotarDescontoPontualidade(parcela, 300, "2027-03-07").valorComDesconto, 285);
  assert.equal(cotarDescontoPontualidade(parcela, 300, "2027-03-08"), null);
  const ateVencimento = { ...parcela, matricula: { descontoPontualidade: { ...regra, diasAntecedencia: 0 } } };
  assert.equal(cotarDescontoPontualidade(ateVencimento, 300, "2027-03-10").valorComDesconto, 285);
  assert.equal(cotarDescontoPontualidade(ateVencimento, 300, "2027-03-11"), null);
});

test("taxas, cobranças sem regra, canceladas, quitadas ou parciais não recebem o benefício", () => {
  const mudancas = [{ tipo: "MATRICULA" }, { matricula: null }, { status: "CANCELADO" },
    { status: "PAGO" }, { status: "PARCIAL" }, { valorPago: 1 }, { pagamentos: [{ valorPago: 1 }] }];
  for (const dados of mudancas) {
    assert.equal(cotarDescontoPontualidade({ ...parcela, ...dados }, 300, "2027-03-07"), null);
  }
  for (const dados of [{ percentual: 100 }, { percentual: "5" }, { percentual: 0 }, { diasAntecedencia: 1.5 }]) {
    assert.equal(lerDescontoPontualidade({ ...regra, ...dados }), null);
  }
});

test("baixa reconhece o boleto pontual como integral e conserva divergências fora da regra", () => {
  const cotacao = cotarDescontoPontualidade(parcela, 300, "2027-03-07");
  const metadata = {
    pontualidade: { ...cotacao, lancamentoId: parcela.id },
    provedor: { descontoAsaas: { type: "PERCENTAGE", value: 5, dueDateLimitDays: 3 } },
    diaPagamentoPontualidade: "2027-03-07",
  };
  const cobranca = {
    instituicaoId: 7, alunoId: 8, matriculaId: 9, lancamentoFinanceiroId: 42,
    statusBancario: "COMPENSADO", statusOperacional: "AGUARDANDO_BAIXA",
    valorCobrado: 300, valorCompensado: 285, metadata,
  };
  const baixa = analisarDivergencia(cobranca, parcela, false);
  assert.equal(baixa.parcial, false);
  assert.equal(baixa.motivos.length, 0);
  assert.equal(baixa.valorFinal, 285);
  assert.equal(baixa.descontoPontualidade, 15);
  for (const alterada of [
    { ...cobranca, valorCompensado: 284.99 },
    { ...cobranca, metadata: { ...metadata, diaPagamentoPontualidade: "2027-03-08" } },
    { ...cobranca, metadata: { ...metadata, provedor: {} } },
  ]) {
    assert.equal(analisarDivergencia(alterada, parcela).descontoPontualidade, 0);
    assert.ok(analisarDivergencia(alterada, parcela).motivos.length > 0);
  }
  assert.equal(analisarDivergencia(cobranca, { ...parcela, id: 43 }).descontoPontualidade, 0);
  assert.equal(analisarDivergencia(cobranca, { ...parcela, vencimento: new Date("2027-03-11") }).descontoPontualidade, 0);
});

test("envia ao Asaas valor nominal e desconto condicionado, inclusive no vencimento", async () => {
  const requisicoes = [];
  const { criarProvedorAsaas } = carregar("lib/financeiro/provedores/asaas.ts", {
    "server-only": {},
    "@/lib/crypto-credenciais": { descriptografarCredencial: () => "credencial-ficticia" },
  }, {
    fetch: async (url, init) => {
      requisicoes.push({ url, body: init.body ? JSON.parse(init.body) : null });
      return { ok: true, json: async () => ({ id: "pay_fixture", status: "PENDING" }) };
    },
  });
  const provedor = criarProvedorAsaas({
    instituicaoId: -1, ambienteIntegracao: "SANDBOX", credenciaisCriptografadas: "fixture",
  });
  const base = { clienteExternoId: "cus_fixture", valor: 300, vencimento: "2099-03-10",
    descricao: "Mensalidade fictícia", referenciaExterna: "fixture" };
  for (const diasAntecedencia of [3, 0]) {
    const resultado = await provedor.criarBoleto({
      ...base, descontoPontualidade: { percentual: 5, diasAntecedencia },
    });
    const { body } = requisicoes.at(-2);
    assert.equal(body.value, 300);
    assert.deepEqual(body.discount, { type: "PERCENTAGE", value: 5, dueDateLimitDays: diasAntecedencia });
    assert.equal(resultado.metadata.descontoAsaas.value, 5);
  }
  await provedor.criarBoleto(base);
  assert.equal(requisicoes.at(-2).body.value, 300);
  assert.equal(Object.hasOwn(requisicoes.at(-2).body, "discount"), false);
  await provedor.criarBoleto({ ...base, vencimento: "2000-03-10", descontoPontualidade: regra });
  assert.equal(requisicoes.at(-2).body.discount, undefined);
});

test("variáveis do contrato usam a regra da matrícula e a mensalidade após a bolsa", () => {
  const { montarDadosBolsaDocumento } = carregar("lib/documentos/bolsa-documento.ts");
  const dados = montarDadosBolsaDocumento({
    valorMensalidade: 360, bolsaPercentual: 25, descontoPontualidade: regra,
  }, "pt-BR");
  assert.equal(dados.percentualDescontoPontualidade, "5");
  assert.equal(dados.diasAntecedenciaDescontoPontualidade, "3");
  assert.match(dados.valorMensalidadeComDescontoPontualidade, /256,50/);
  assert.match(dados.textoDescontoPontualidadeContrato, /3 dia.*5%/);
  assert.equal(montarDadosBolsaDocumento({ valorMensalidade: 360 }).textoDescontoPontualidadeContrato, "");
});

test("baixa manual grava valor recebido, desconto e status de quitação no caixa", async () => {
  const dados = {
    ...parcela, aluno: { id: 8, nome: "Aluno fictício" },
    vencimento: new Date("2099-03-10"), updatedAt: new Date(),
  };
  const movimentos = [];
  const historico = [];
  let baixasTradicionais = 0;
  let baixasComPontualidade = 0;
  const salvar = async ({ data }) => movimentos.push(data);
  const db = {
    configuracaoFinanceiraInstituicao: { findUnique: async () => ({ permitirPagamentoParcial: false }) },
    configuracaoInstituicao: { findUnique: async () => null },
    lancamentoFinanceiro: {
      findFirst: async ({ where }) => where.instituicaoId === 7 ? dados : null,
      update: async ({ data, where }) => {
        assert.equal(where.id, 42);
        baixasTradicionais++;
        Object.assign(dados, data);
      },
      updateMany: async ({ data, where }) => {
        assert.equal(where.instituicaoId, 7);
        baixasComPontualidade++;
        Object.assign(dados, data);
        return { count: 1 };
      },
      findUnique: async () => dados,
    },
    caixa: { findFirst: async () => ({ id: 1 }), update: async () => {} },
    pagamento: { create: async () => ({ id: 1, pagoEm: new Date() }) },
    historicoCobranca: { create: async ({ data }) => historico.push(data) },
    documentoGerado: { create: async () => {} },
    movimentoCaixa: { create: salvar },
    $transaction: async (fn) => fn(db),
  };
  const { PATCH } = carregar("app/api/admin/financeiro/recebimentos/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/prisma": { prisma: db },
    "@/lib/server-auth": { getUserFromToken: async () => ({ id: 1, role: "FINANCEIRO", instituicaoId: 7 }) },
    "@/lib/permissoesPlano": { podeUsarFinanceiroCompleto: () => true },
    "@/lib/comercial/processar-comissao": { processarComissaoAutomatica: async () => {} },
  });
  const req = { json: async () => ({ lancamentoId: 42, valorPago: 285, formaPagamento: "PIX", aplicarPontualidade: true }) };
  assert.equal((await PATCH(req)).status, 200);
  assert.equal(dados.status, "PAGO");
  assert.equal(dados.valorFinal, 285);
  assert.equal(dados.descontoValor, 75);
  assert.equal(movimentos[0].valor, 285);
  assert.equal(historico[0].metadata.pontualidade.desconto, 15);
  assert.equal((await PATCH(req)).status, 409);
  assert.equal(movimentos.length, 1);
  assert.equal(baixasComPontualidade, 1);
  assert.equal(baixasTradicionais, 0);

  Object.assign(dados, {
    status: "PENDENTE", valorOriginal: 360, valorFinal: 360, valorPago: 0,
    descontoValor: 0, matricula: { descontoPontualidade: null },
  });
  const tradicional = { json: async () => ({ lancamentoId: 42, valorPago: 360, formaPagamento: "PIX" }) };
  assert.equal((await PATCH(tradicional)).status, 200);
  assert.equal(dados.status, "PAGO");
  assert.equal(dados.valorFinal, 360);
  assert.equal(dados.descontoValor, 0);
  assert.equal(movimentos[1].valor, 360);
  assert.equal(Object.hasOwn(historico[1].metadata, "pontualidade"), false);
  assert.equal(baixasComPontualidade, 1);
  assert.equal(baixasTradicionais, 1);
});


test("instituição sem configuração não contrata desconto e outra pode escolher 10%", async () => {
  const { condicoesPontualidadeMatricula } = carregar("lib/financeiro/desconto-pontualidade-servidor.ts");
  const db = {
    configuracaoFinanceiraInstituicao: {
      findUnique: async ({ where }) => where.instituicaoId === 8
        ? { descontoPontualidade: { percentual: 10, diasAntecedencia: 0 } }
        : null,
    },
  };
  assert.equal(Object.hasOwn(await condicoesPontualidadeMatricula(db, 7), "descontoPontualidade"), false);
  const contratada = await condicoesPontualidadeMatricula(db, 8);
  assert.equal(contratada.descontoPontualidade.percentual, 10);
  assert.equal(contratada.descontoPontualidade.diasAntecedencia, 0);
});


test("duas faixas opcionais escolhem exatamente uma por data", () => {
  const { cotarDescontoPontualidade, lerDescontoPontualidade, faixasDescontoPontualidade } = carregar("lib/financeiro/desconto-pontualidade.ts");
  const dupla = { antecipado: { percentual: 10, diasAntecedencia: 3 }, vencimento: { percentual: 5, diasAntecedencia: 0 } };
  const p = { ...parcela, matricula: { descontoPontualidade: dupla } };
  assert.equal(cotarDescontoPontualidade(p, 300, "2027-03-07").valorComDesconto, 270);
  assert.equal(cotarDescontoPontualidade(p, 300, "2027-03-08").valorComDesconto, 285);
  assert.equal(cotarDescontoPontualidade(p, 300, "2027-03-10").valorComDesconto, 285);
  assert.equal(cotarDescontoPontualidade(p, 300, "2027-03-11"), null);
  assert.equal(cotarDescontoPontualidade({ ...p, tipo: "MATRICULA" }, 300, "2027-03-07"), null);
  assert.equal(cotarDescontoPontualidade({ ...p, status: "PARCIAL" }, 300, "2027-03-07"), null);
  assert.equal(lerDescontoPontualidade({ antecipado: { percentual: 0, diasAntecedencia: 3 }, vencimento: dupla.vencimento }), null);
  assert.equal(lerDescontoPontualidade({ vencimento: { percentual: 5, diasAntecedencia: 1 } }), null);
  assert.equal(faixasDescontoPontualidade({ antecipado: dupla.antecipado }).vencimento, null);
  assert.equal(faixasDescontoPontualidade({ vencimento: dupla.vencimento }).antecipado, null);
  assert.equal(faixasDescontoPontualidade({ percentual: 5, diasAntecedencia: 3 }).antecipado.percentual, 5);
});

test("contrato apresenta as duas faixas e as novas variaveis", () => {
  const { montarDadosBolsaDocumento } = carregar("lib/documentos/bolsa-documento.ts");
  const dados = montarDadosBolsaDocumento({ valorMensalidade: 360, bolsaPercentual: 25,
    descontoPontualidade: { antecipado: { percentual: 10, diasAntecedencia: 3 }, vencimento: { percentual: 5, diasAntecedencia: 0 } },
  }, "pt-BR");
  assert.match(dados.textoDescontoPontualidadeContrato, /3 dia\(s\).*10%/);
  assert.match(dados.textoDescontoPontualidadeContrato, /vencimento.*5%/);
  assert.match(dados.textoDescontoPontualidadeContrato, /não são cumulativos/);
  assert.equal(dados.percentualDescontoAntecipado, "10");
  assert.equal(dados.percentualDescontoAteVencimento, "5");
  assert.match(dados.valorMensalidadeComDescontoAntecipado, /243,00/);
  assert.match(dados.valorMensalidadeComDescontoAteVencimento, /256,50/);
});
