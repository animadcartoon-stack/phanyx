const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function carregar(file, mocks = {}) {
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  assert.equal(code.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  new Function("require", "module", "exports", code.outputText)((id) => {
    if (id in mocks) return mocks[id];
    if (id === "server-only") return {};
    if (id === "@/lib/crypto-credenciais") return {};
    if (id.startsWith("@/lib/financeiro/") && id !== "@/lib/financeiro/provedores") return carregar(id.replace("@/", "") + ".ts", mocks);
    return require(id);
  }, m, m.exports);
  return m.exports;
}
const originalFetch = global.fetch;
const oldKey = process.env.ASAAS_API_KEY, oldIbe = process.env.IBE_INSTITUICAO_ID;
process.env.ASAAS_API_KEY = "token-ficticio-apenas-testes"; process.env.IBE_INSTITUICAO_ID = "7";
let total = 0;
async function teste(nome, fn) { await fn(); total++; console.log("OK " + nome); }
const input = { cobrancaExternaId: "pay_teste", clienteExternoId: "cus_teste", referenciaExterna: "PHANYX_COBRANCA:7:439", valorCobrado: 50 };
const pagamento = { id: input.cobrancaExternaId, customer: input.clienteExternoId, externalReference: input.referenciaExterna, value: 50, status: "PENDING" };
function provedor(respostas) {
  const calls = [];
  global.fetch = async (url, init) => {
    assert(url.startsWith("https://api-sandbox.asaas.com/v3/payments/"));
    calls.push(init.method);
    const resposta = respostas.shift();
    if (!resposta) throw Error("Requisição inesperada");
    return { ok: true, json: async () => resposta };
  };
  const api = carregar("lib/financeiro/provedores/asaas.ts").criarProvedorAsaas({ instituicaoId: 7, ambienteIntegracao: "SANDBOX" });
  return { api, calls };
}
function ambiente(provedorApi) {
  const row = { id: 1, instituicaoId: 7, lancamentoFinanceiroId: 439, cobrancaExternaId: "pay_teste", clienteExternoId: "cus_teste",
    referenciaExterna: "PHANYX_COBRANCA:7:439", valorCobrado: 50, valorCompensado: null, baixadoEm: null, movimentoCaixaId: null,
    statusBancario: "PENDENTE", statusOperacional: "AGUARDANDO_PAGAMENTO", metadata: { preservar: "sim" },
    contaFinanceira: { id: 1, instituicaoId: 7 }, lancamentoFinanceiro: { status: "PENDENTE", valorPago: 0, pagamentos: [] } };
  let canceladas = 0;
  const tx = { $queryRaw: async () => [], cobrancaFinanceira: {
    findFirst: async q => q.where.instituicaoId === row.instituicaoId ? row : null,
    update: async q => { Object.assign(row, q.data); return row; },
  }, lancamentoFinanceiro: { updateMany: async () => { canceladas++; row.lancamentoFinanceiro.status = "CANCELADO"; return { count: 1 }; } } };
  const prisma = { $transaction: async cb => cb(tx) };
  const api = carregar("lib/financeiro/cancelar-cobranca.ts", {
    "@/lib/prisma": { prisma }, "@/lib/financeiro/provedores": { obterProvedorFinanceiro: () => provedorApi },
  });
  return { api, row, prisma, tx, canceladas: () => canceladas };
}
const params = { id: 1, instituicaoId: 7, motivo: "Cancelamento solicitado pelo administrador", operador: { id: 1, nome: "Admin" } };
(async () => {
  await teste("consulta ao Asaas não envia DELETE", async () => {
    const p = provedor([{ ...pagamento }]); const r = await p.api.consultarBoletoParaCancelamento(input);
    assert.equal(r.cancelavel, true); assert.deepEqual(p.calls, ["GET"]);
  });
  await teste("cancelamento confirma identidade e exige confirmação explícita do DELETE", async () => {
    const p = provedor([{ ...pagamento }, { id: input.cobrancaExternaId, deleted: true }]);
    assert.equal((await p.api.cancelarBoleto(input)).cancelado, true); assert.deepEqual(p.calls, ["GET", "DELETE"]);
  });
  for (const alteracao of [{ status: "RECEIVED" }, { status: "CONFIRMED" }, { subscription: "sub_teste" }, { installment: "ins_teste" },
    { customer: "outro" }, { externalReference: "outra" }, { value: 100 }, { id: "outro" }]) {
    await teste("não exclui cobrança incompatível: " + JSON.stringify(alteracao), async () => {
      const p = provedor([{ ...pagamento, ...alteracao }]); await assert.rejects(p.api.cancelarBoleto(input));
      assert.deepEqual(p.calls, ["GET"]);
    });
  }
  await teste("já removido no Asaas é idempotente", async () => {
    const p = provedor([{ ...pagamento, deleted: true }]); assert.equal((await p.api.cancelarBoleto(input)).cancelado, true);
    assert.deepEqual(p.calls, ["GET"]);
  });
  await teste("DELETE sem deleted=true não é sucesso", async () => {
    const p = provedor([{ ...pagamento }, { id: input.cobrancaExternaId, deleted: false }]);
    await assert.rejects(p.api.cancelarBoleto(input), /NAO_CONFIRMADO/);
  });
  await teste("falha no banco mantém boleto e parcela ativos, com intenção persistida", async () => {
    const a = ambiente({ cancelarBoleto: async () => { throw Error("Falha de comunicação"); } });
    const r = await a.api.cancelarCobrancaFinanceira(params);
    assert.equal(r.pendente, true); assert.equal(r.cancelado, false); assert.equal(a.row.statusBancario, "PENDENTE");
    assert.equal(a.row.lancamentoFinanceiro.status, "PENDENTE"); assert.equal(a.canceladas(), 0);
    assert.equal(a.row.metadata.cancelamentoBancario.estado, "PENDENTE"); assert.equal(a.row.metadata.preservar, "sim");
  });
  await teste("tentativa posterior confirma no banco antes de concluir ambos os registros", async () => {
    let ok = false;
    const a = ambiente({ cancelarBoleto: async () => { assert.equal(a.canceladas(), 0); if (!ok) throw Error("timeout"); return { cancelado: true, id: "pay_teste" }; } });
    await a.api.cancelarCobrancaFinanceira(params); ok = true;
    const r = await a.api.cancelarCobrancaFinanceira(params);
    assert.equal(r.cancelado, true); assert.equal(a.row.statusBancario, "CANCELADO"); assert.equal(a.row.statusOperacional, "CANCELADO");
    assert.equal(a.row.metadata.cancelamentoBancario.estado, "CONFIRMADO"); assert.equal(a.row.lancamentoFinanceiro.valorPago, 0);
    const vezes = a.canceladas(); await a.api.cancelarCobrancaFinanceira(params); assert.equal(a.canceladas(), vezes);
  });
  await teste("outra instituição não alcança o boleto", async () => {
    const a = ambiente({ cancelarBoleto: async () => { throw Error("Não deve chamar banco"); } });
    await assert.rejects(a.api.cancelarCobrancaFinanceira({ ...params, instituicaoId: 8 }), /NAO_ENCONTRADA/);
  });
  await teste("pagamento registrado impede cancelamento e preserva o recebimento", async () => {
    const a = ambiente({ cancelarBoleto: async () => { throw Error("Não deve chamar banco"); } });
    a.row.lancamentoFinanceiro.pagamentos = [{ valorPago: 50 }];
    await assert.rejects(a.api.cancelarCobrancaFinanceira(params), /NAO_CANCELAVEL/); assert.equal(a.canceladas(), 0);
  });
  await teste("webhook de compensação durante a API exige revisão e não cancela parcela", async () => {
    const a = ambiente({ cancelarBoleto: async () => { a.row.statusBancario = "COMPENSADO"; a.row.valorCompensado = 50; return { cancelado: true }; } });
    const r = await a.api.cancelarCobrancaFinanceira(params);
    assert.equal(r.pendente, true); assert.equal(a.row.statusBancario, "COMPENSADO"); assert.equal(a.canceladas(), 0);
    assert.equal(a.row.metadata.cancelamentoBancario.estado, "REVISAO");
  });
  await teste("emissão em andamento não é declarada cancelada", async () => {
    const a = ambiente({ cancelarBoleto: async () => { throw Error("Não deve chamar banco"); } }); a.row.statusBancario = "EM_PROCESSAMENTO";
    const r = await a.api.cancelarCobrancaFinanceira(params); assert.equal(r.pendente, true); assert.equal(a.canceladas(), 0);
  });
  await teste("solicitação concorrente usa a reserva e não duplica chamada externa", async () => {
    const a = ambiente({ cancelarBoleto: async () => { throw Error("Não deve chamar banco"); } });
    a.row.metadata.cancelamentoBancario = { estado: "PROCESSANDO", tentativaEm: new Date().toISOString() };
    assert.equal((await a.api.cancelarCobrancaFinanceira(params)).pendente, true);
  });
  await teste("webhook confirmou cancelamento após queda do processo: retoma sem novo DELETE", async () => {
    const a = ambiente({ cancelarBoleto: async () => { throw Error("Não deve repetir DELETE"); } });
    a.row.statusBancario = "CANCELADO"; a.row.statusOperacional = "CANCELADO";
    a.row.metadata.cancelamentoBancario = { estado: "PROCESSANDO", tentativaEm: "2020-01-01T00:00:00Z" };
    a.prisma.cobrancaFinanceira = {
      findMany: async () => [{ id: 1, instituicaoId: 7 }], count: async () => 0,
    };
    const r = await a.api.processarCancelamentosBancarios(7);
    assert.equal(r.confirmados, 1); assert.equal(a.row.lancamentoFinanceiro.status, "CANCELADO");
  });
  await teste("endpoint recusa impersonação e perfil sem permissão", async () => {
    for (const user of [{ instituicaoId: 7, role: "ALUNO" }, { instituicaoId: 7, role: "ADMIN", impersonacao: true }]) {
      const api = carregar("app/api/admin/financeiro/cobrancas/[id]/cancelar/route.ts", {
        "next/server": { NextResponse: { json: (body, opts) => ({ body, status: opts?.status || 200 }) } },
        "@/lib/server-auth": { getUserFromToken: async () => user },
        "@/lib/plano-acesso": { planoTemRecurso: () => true },
        "@/lib/financeiro/cancelar-cobranca": { cancelarCobrancaFinanceira: () => { throw Error("Não deve executar"); } },
      });
      assert.equal((await api.POST({}, { params: { id: "1" } })).status, 403);
    }
  });
  await teste("endpoint usa a instituição da sessão e devolve 202 quando o banco está pendente", async () => {
    let chamada;
    const api = carregar("app/api/admin/financeiro/cobrancas/[id]/cancelar/route.ts", {
      "next/server": { NextResponse: { json: (body, opts) => ({ body, status: opts?.status || 200 }) } },
      "@/lib/server-auth": { getUserFromToken: async () => ({ id: 1, instituicaoId: 7, role: "ADMIN" }) },
      "@/lib/plano-acesso": { planoTemRecurso: () => true },
      "@/lib/financeiro/cancelar-cobranca": { cancelarCobrancaFinanceira: async p => { chamada = p; return { cancelado: false, pendente: true }; } },
    });
    const r = await api.POST({ json: async () => ({ motivo: "Cancelamento solicitado", instituicaoId: 8 }), headers: { get: () => null } }, { params: { id: "1" } });
    assert.equal(chamada.instituicaoId, 7); assert.equal(r.status, 202); assert.equal(r.body.cancelado, false);
  });
  for (const locale of ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"]) {
    const d = JSON.parse(fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8"));
    assert(d.AdminFinanceBoletos.cancellation.message.includes("{name}")); assert(d.AdminCancelamentoMatricula.messages.bankCancellationPending);
  }
  console.log(total + " cenários de cancelamento bancário aprovados; nenhuma conexão real foi utilizada.");
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => {
  global.fetch = originalFetch;
  if (oldKey === undefined) delete process.env.ASAAS_API_KEY; else process.env.ASAAS_API_KEY = oldKey;
  if (oldIbe === undefined) delete process.env.IBE_INSTITUICAO_ID; else process.env.IBE_INSTITUICAO_ID = oldIbe;
});
