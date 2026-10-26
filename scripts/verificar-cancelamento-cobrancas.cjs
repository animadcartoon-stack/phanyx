/* Regressão isolada: nenhuma conexão com banco, e-mail ou Asaas. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const usuario = { id: 1, instituicaoId: 7, role: "ADMIN", plano: "PROFISSIONAL" };
function carregar(arquivo, prisma = {}, extras = {}) {
  const nome = path.join(root, arquivo);
  const js = ts.transpileModule(fs.readFileSync(nome, "utf8"), {
    fileName: nome, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(js.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const mod = { exports: {} };
  const mocks = {
    "@/lib/prisma": { prisma },
    "next/server": { NextResponse: { json: (body, init = {}) => ({ status: init.status || 200, body }) } },
    "@/lib/server-auth": { getUserFromToken: async () => usuario, temPermissao: () => true, temAlgumaPermissao: () => true },
    "@/lib/plano-acesso": { planoTemRecurso: () => true },
    "@prisma/client": { StatusMatricula: { CANCELADA: "CANCELADA", CONCLUIDA: "CONCLUIDA", TRANSFERIDA: "TRANSFERIDA" } },
    ...extras,
  };
  const req = (id) => {
    if (id in mocks) return mocks[id];
    if (id === "@/lib/financeiro/cancelar-cobranca") return { processarCancelamentosBancarios: async () => ({ confirmados: 0, pendentes: 0 }) };
    if (id === "@/lib/financeiro/cancelamento-bancario-estado") return carregar("lib/financeiro/cancelamento-bancario-estado.ts");
    if (id.startsWith("@/lib/financeiro/matricula-cancelada")) return carregar("lib/financeiro/matricula-cancelada.ts");
    if (id.startsWith("@/lib/cancelamento-historico")) return carregar("lib/cancelamento-historico.ts");
    if (id.startsWith("@/")) return {}; // Unused integrations must never be called in blocked requests.
    return require(id);
  };
  new Function("require", "module", "exports", js.outputText)(req, mod, mod.exports);
  return mod.exports;
}
const request = (body) => ({ json: async () => body, headers: { get: () => null } });
const cancelarRota = "app/api/admin/matriculas/[id]/cancelamento/route.ts";
let total = 0;
async function teste(nome, fn) { await fn(); total++; console.log(`OK ${nome}`); }
(async () => {
  await teste("datas do termo original: solicitação 06/10, efetiva 08/10; data de geração não substitui", () => {
    const { recuperarCancelamentoLegado, dataHistorica } = carregar("lib/cancelamento-historico.ts");
    const h = recuperarCancelamentoLegado({ canceladaEm: new Date("2026-10-09T12:00:00Z"), motivoCancelamento: null }, {
      id: 252, criadoEm: new Date("2026-10-21T12:00:00Z"), dadosPreenchimento: {
        dataSolicitacaoCancelamentoMatricula: "2026-10-06", dataEfetivaCancelamentoMatricula: "08/10/2026",
      },
    });
    assert.equal(h.dataSolicitacao, "2026-10-06"); assert.equal(h.dataEfetiva, "2026-10-08");
    assert.equal(dataHistorica("31/02/2026"), null); assert.equal(dataHistorica(""), null);
    const vazio = recuperarCancelamentoLegado({ canceladaEm: null, motivoCancelamento: null }, null);
    assert.equal(vazio.dataSolicitacao, null); assert.equal(vazio.dataEfetiva, null);
  });
  await teste("consulta legado é somente leitura e restringe instituição e documento", async () => {
    let filtro;
    const api = carregar(cancelarRota, {
      matricula: { findFirst: async q => { assert.equal(q.where.instituicaoId, 7); return { status: "CANCELADA", canceladaEm: null, motivoCancelamento: null }; } },
      cancelamentoMatricula: { findMany: async () => [] },
      documentoGerado: { findFirst: async q => {
        filtro = q.where;
        // Há uma versão de 06/10 e outra de 08/10: a consulta deve priorizar a revisão mais recente.
        assert.equal(q.orderBy[0].criadoEm, "desc");
        assert.equal(q.orderBy[1].id, "desc");
        return { id: 252, criadoEm: new Date("2026-10-08T20:03:52Z"),
          dadosPreenchimento: { dataSolicitacaoCancelamentoMatricula: "2026-10-06", dataEfetivaCancelamentoMatricula: "2026-10-08" } };
      } },
    });
    const r = await api.GET(request({}), { params: { id: "37" } });
    assert.equal(r.status, 200); assert.equal(r.body.legado.dataEfetiva, "2026-10-08");
    assert.equal(filtro.instituicaoId, 7); assert.equal(filtro.matriculaId, 37);
    assert.equal(filtro.contexto, "CANCELAMENTO_MATRICULA");
  });
  await teste("cancelamento estruturado mantém as datas gravadas", async () => {
    const final = { id: 1, status: "FINALIZADO", dataSolicitacao: "2026-10-06", dataEfetiva: "2026-10-08" };
    const api = carregar(cancelarRota, {
      matricula: { findFirst: async () => ({ status: "CANCELADA" }) },
      cancelamentoMatricula: { findMany: async () => [final] },
    });
    const r = await api.GET(request({}), { params: { id: "37" } });
    assert.equal(r.body.legado, null); assert.equal(r.body.cancelamentos[0], final);
  });
  for (const matricula of [{ status: "CANCELADA", canceladaEm: null }, { status: "ATIVA", canceladaEm: new Date() }]) {
    await teste(`bloqueia boleto antes de consultar provedor (${matricula.status})`, async () => {
      const api = carregar("app/api/admin/financeiro/cobrancas/gerar-boleto/route.ts", {
        lancamentoFinanceiro: { findFirst: async () => ({ tipo: "MENSALIDADE", status: "PENDENTE", matricula }) },
      });
      const r = await api.POST(request({ lancamentoFinanceiroId: 99 }));
      assert.equal(r.status, 409); assert.equal(r.body.codigo, "MATRICULA_CANCELADA");
    });
  }
  await teste("bloqueia envio de boleto emitido antes do cancelamento", async () => {
    const api = carregar("app/api/admin/financeiro/cobrancas/[id]/enviar/route.ts", {
      cobrancaFinanceira: { findFirst: async () => ({ lancamentoFinanceiro: { status: "PENDENTE", matricula: { status: "CANCELADA" } } }) },
    });
    const r = await api.POST(request({ canal: "EMAIL" }), { params: Promise.resolve({ id: "99" }) });
    assert.equal(r.status, 409); assert.equal(r.body.codigo, "MATRICULA_CANCELADA");
  });
  for (const ativa of [true, false]) {
    await teste(`geração mensal revalida matrícula sob lock: ${ativa ? "ativa gera" : "cancelada concorrente não gera"}`, async () => {
      let criadas = 0, locked = false;
      const tx = { $queryRaw: async () => { locked = true; }, matricula: { findFirst: async () => { assert(locked); return ativa ? { id: 37 } : null; } },
        lancamentoFinanceiro: { findFirst: async () => null, create: async () => { criadas++; } } };
      const api = carregar("app/api/admin/financeiro/lancamentos/gerar-mensalidades/route.ts", {
        matricula: { findMany: async q => { assert.equal(q.where.status, "ATIVA"); assert.equal(q.where.canceladaEm, null);
          return [{ id: 37, alunoId: 8, aluno: { nome: "Aluno" }, curso: { nome: "Curso" }, valorMensalidade: 50 }]; } },
        $transaction: async cb => cb(tx),
      });
      const r = await api.POST(request({ ano: 2026, mes: 11 }));
      assert.equal(r.status, 200); assert.equal(criadas, ativa ? 1 : 0);
    });
  }
  for (const [organizacaoCurricular, valor] of [["SEMESTRAL", 0], ["SEMESTRAL", 100], ["LIVRE", 0], ["LIVRE", 100]]) {
    await teste(`finalização ${organizacaoCurricular} com saldo ${valor}: cancela obrigações corretas e preserva pagos`, async () => {
      let filtro, alteracao;
      const tx = { $queryRaw: async () => [],
        matricula: { findFirst: async () => ({ id: 37, status: "ATIVA", canceladaEm: null, organizacaoCurricular }), updateMany: async () => ({ count: 1 }) },
        user: { findFirst: async () => ({ nome: "Admin" }) },
        cancelamentoMatricula: { findFirst: async () => ({ id: 4, status: "RASCUNHO", statusAnterior: "ATIVA" }), update: async q => q.data },
        lancamentoFinanceiro: { updateMany: async q => { filtro = q.where; alteracao = q.data; } },
        trancamentoMatricula: { updateMany: async () => ({ count: 0 }) },
      };
      const api = carregar(cancelarRota, { $transaction: async cb => cb(tx) });
      const r = await api.PATCH(request({ acao: "FINALIZAR", cancelamentoId: 4, motivo: "Cancelamento solicitado", dataSolicitacao: "2026-10-06",
        dataEfetiva: "2026-10-08", valorParcelasVencidas: valor, situacaoFinanceira: valor ? "PENDENTE" : "ISENTO" }), { params: { id: "37" } });
      assert.equal(r.status, 200); assert.equal(filtro.instituicaoId, 7); assert.equal(filtro.matriculaId, 37);
      assert(!filtro.status.in.includes("PAGO")); assert.equal(alteracao.status, "CANCELADO");
      if (organizacaoCurricular === "LIVRE") {
        assert.deepEqual(filtro.OR, [{ tipo: { in: ["MATRICULA", "MENSALIDADE"] } }, { periodoCursoLivre: { is: { instituicaoId: 7, matriculaId: 37 } } }]);
        assert.equal(filtro.tipo, undefined);
      } else { assert.deepEqual(filtro.tipo, { in: ["MATRICULA", "MENSALIDADE"] }); assert.equal(filtro.OR, undefined); }
      assert.equal("valorPago" in alteracao, false); assert.equal(Boolean(filtro.vencimento), valor > 0);
    });
  }
  await teste("reparo sem custo: consulta não altera; aplicação é idempotente; banco e recibos preservados", async () => {
    const { reparar } = require("./reparar-cobrancas-matricula-cancelada.cjs");
    const parcela = { id: 99, status: "PARCIAL", valorPago: 20, observacao: "Histórico original" };
    const banco = { id: 3, cobrancaExternaId: "pay_example", statusBancario: "PENDENTE" };
    let mutacoes = 0, bancoAtivo = true;
    const tx = { $queryRaw: async () => [], matricula: { findUnique: async () => ({ id: 37, instituicaoId: 7, status: "CANCELADA", aluno: { nome: "Claudio de Jesus" } }) },
      lancamentoFinanceiro: { findMany: async () => parcela.status === "CANCELADO" ? [] : [parcela], updateMany: async q => {
        assert(q.data.observacao.startsWith("Histórico original")); assert.equal("valorPago" in q.data, false);
        parcela.status = q.data.status; mutacoes++; } },
      cobrancaFinanceira: { findMany: async () => bancoAtivo ? [banco] : [] } };
    const prisma = { $transaction: async cb => cb(tx) }, opts = { matriculaId: 37, alunoNome: "Claudio de Jesus" };
    await reparar(prisma, opts); assert.equal(mutacoes, 0);
    await assert.rejects(reparar(prisma, { ...opts, aplicar: true }), /sem-custo/);
    await assert.rejects(reparar(prisma, { ...opts, alunoNome: "Outro aluno" }), /não conferem/);
    await assert.rejects(reparar(prisma, { ...opts, aplicar: true, semCusto: true }), /CANCELAMENTO_BANCARIO_NECESSARIO/);
    assert.equal(mutacoes, 0);
    bancoAtivo = false;
    const r = await reparar(prisma, { ...opts, aplicar: true, semCusto: true });
    assert.equal(mutacoes, 1); assert.equal(r.boletosParaConferenciaBancaria.length, 0); assert.equal(parcela.valorPago, 20);
    await reparar(prisma, { ...opts, aplicar: true, semCusto: true }); assert.equal(mutacoes, 1);
  });
  await teste("atualização financeira nunca reabre cancelados e impede atualização concorrente", async () => {
    const tentativas = [];
    const api = carregar("app/api/admin/financeiro/lancamentos/atualizar-status/route.ts", {
      configuracaoFinanceiraInstituicao: { upsert: async () => ({}) },
      lancamentoFinanceiro: {
        findMany: async () => [
          { id: 1, status: "CANCELADO" },
          { id: 2, status: "PENDENTE", matricula: { status: "CANCELADA" } },
          { id: 3, status: "PENDENTE", valorOriginal: 50, vencimento: new Date("2026-10-05"), pagamentos: [] },
        ],
        updateMany: async q => { tentativas.push(q); return { count: 0 }; },
      },
      aluno: { updateMany: async () => ({ count: 0 }) },
    });
    const r = await api.POST();
    assert.equal(r.status, 200); assert.equal(tentativas.length, 1);
    assert.equal(tentativas[0].where.id, 3); assert.equal(tentativas[0].where.status.not, "CANCELADO");
    assert.equal(tentativas[0].where.instituicaoId, 7);
    assert.equal(tentativas[0].where.OR[1].matricula.is.status.not, "CANCELADA");
  });
  for (const locale of ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"]) {
    const c = JSON.parse(fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8")).AdminCancelamentoMatricula;
    for (const [s, k] of [["process", "legacyDescription"], ["process", "notRecorded"], ["warnings", "legacy"], ["actions", "originalDocument"]]) assert(c[s][k]);
  }
  console.log(`${total} cenários de regressão aprovados; traduções conferidas nos 5 idiomas.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
