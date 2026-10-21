/* Usa as credenciais locais já configuradas, sem consultar DATABASE_URL ou imprimir segredos.
 * Exige confirmação de instituição, ambiente, ID, cliente, referência e valor.
 * Por padrão apenas consulta. --aplicar solicita a exclusão ao Asaas.
 */
const fs = require("node:fs");
const path = require("node:path");
require("@next/env").loadEnvConfig(process.cwd());
const ts = require("typescript");
function carregarTs(file) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", code)((id) => {
    if (id === "server-only") return {};
    if (id === "@/lib/crypto-credenciais") return carregarTs(path.resolve(__dirname, "../lib/crypto-credenciais.ts"));
    return require(id);
  }, mod, mod.exports);
  return mod.exports;
}
(async () => {
  const args = process.argv.slice(2);
  const ler = key => args.includes(key) ? args[args.indexOf(key) + 1] : "";
  const instituicaoId = Number(ler("--instituicao"));
  const ambiente = ler("--ambiente");
  const input = { cobrancaExternaId: ler("--id"), clienteExternoId: ler("--cliente"),
    referenciaExterna: ler("--referencia"), valorCobrado: Number(ler("--valor")) };
  if (!instituicaoId || instituicaoId !== Number(process.env.IBE_INSTITUICAO_ID) ||
      !["PRODUCAO", "SANDBOX"].includes(ambiente) || !input.cobrancaExternaId || !input.clienteExternoId ||
      !input.referenciaExterna.startsWith(`PHANYX_COBRANCA:${instituicaoId}:`) || !(input.valorCobrado > 0)) {
    throw new Error("Confira instituição, IBE_INSTITUICAO_ID, ambiente, ID, cliente, referência e valor. Nenhuma alteração realizada.");
  }
  const { criarProvedorAsaas } = carregarTs(path.resolve(__dirname, "../lib/financeiro/provedores/asaas.ts"));
  const provedor = criarProvedorAsaas({ id: 0, instituicaoId, provedor: "ASAAS", ambienteIntegracao: ambiente, credenciaisCriptografadas: null });
  const consulta = await provedor.consultarBoletoParaCancelamento(input);
  console.log(JSON.stringify({ modo: "CONSULTA_ASAAS", ...consulta }, null, 2));
  if (args.includes("--aplicar")) {
    const resultado = await provedor.cancelarBoleto(input);
    console.log(JSON.stringify({ modo: "CONFIRMADO_PELO_ASAAS", ...resultado }, null, 2));
    console.log("O webhook poderá atualizar o PHANYX. Este script não altera lançamentos locais nem apaga pagamentos.");
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
