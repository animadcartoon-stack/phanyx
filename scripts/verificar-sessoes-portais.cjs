/* Executa as rotas reais com JWT assinado e auditoria simulada. Não acessa o banco. */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const assert = require("node:assert/strict"), ts = require("typescript");
const jwt = require("jsonwebtoken"), { NextRequest } = require("next/server");
const root = path.resolve(__dirname, "..");
const segredoAnterior = process.env.JWT_SECRET;
process.env.JWT_SECRET = "teste-local-sessao-sem-acesso-ao-banco";
let auditorias = 0, testes = 0;
const cache = new Map();
function carregar(arquivo) {
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const modulo = { exports: {} }; cache.set(arquivo, modulo);
  const codigo = ts.transpileModule(fs.readFileSync(path.join(root, arquivo), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const requisitar = (id) => {
    if (id === "@/lib/prisma") return { prisma: { impersonacaoSuporte: { updateMany: async () => { auditorias++; return { count: 1 }; } } } };
    if (id.startsWith("@/")) return carregar(`${id.slice(2)}.ts`);
    return require(id);
  };
  vm.runInThisContext(`(function(exports,require,module){${codigo}\n})`, { filename: arquivo })(modulo.exports, requisitar, modulo);
  return modulo.exports;
}
const { referenciaTokenSessao } = carregar("lib/sessao-inatividade-admin.ts");
const { POST } = carregar("app/api/auth/logout/route.ts");
function token(role, portal, extra = {}, segredo = process.env.JWT_SECRET) {
  return jwt.sign({ id: 10, role, portal, ...extra }, segredo, { noTimestamp: true });
}
const admin = token("ADMIN", "admin", { jti: "sessao-original" });
const referencia = referenciaTokenSessao(admin);
function request(cookie, headers = {}) {
  return new NextRequest("http://localhost/api/auth/logout", { method: "POST", headers: {
    origin: "http://localhost", ...(cookie ? { cookie: `token=${cookie}; phanyx_master_token=preservar` } : {}), ...headers,
  } });
}
const automatico = { "x-phanyx-logout-motivo": "inatividade", "x-phanyx-sessao-admin": referencia };
async function teste(nome, executar) { auditorias = 0; await executar(); testes++; }
async function preservada(cookie, headers, status = 409) {
  const resposta = await POST(request(cookie, headers));
  assert.equal(resposta.status, status); assert.equal(resposta.headers.has("set-cookie"), false);
  assert.equal(auditorias, 0); assert.deepEqual(await resposta.json(), { encerrada: false });
}
async function encerrada(cookie, headers, status = 200) {
  const resposta = await POST(request(cookie, headers));
  assert.equal(resposta.status, status);
  for (const nome of ["token", "phanyx_master_token"]) {
    const cookieApagado = resposta.cookies.get(nome);
    assert.ok(cookieApagado); assert.equal(cookieApagado.value, ""); assert.equal(cookieApagado.maxAge, 0);
  }
}
// Exercita o efeito real do AdminShell com relógio simulado, sem esperar cinco minutos.
const shell = ts.createSourceFile("AdminShell.tsx", fs.readFileSync(path.join(root, "app/admin/AdminShell.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let efeito;
function procurar(no) {
  if (ts.isCallExpression(no) && no.expression.getText(shell) === "useEffect" && no.arguments[0]?.getText(shell).includes('"x-phanyx-logout-motivo"')) efeito = no.arguments[0].getText(shell);
  ts.forEachChild(no, procurar);
}
procurar(shell); assert.ok(efeito, "Efeito de inatividade não encontrado");
function montarEfeito(fetchSimulado, ref = referencia, ambiente = "production") {
  const timers = new Map(), eventos = new Map(); let proximo = 0, expirada = false;
  const janela = { location: { href: "" }, addEventListener: (k, fn) => eventos.set(k, fn), removeEventListener: (k) => eventos.delete(k) };
  const codigo = ts.transpileModule(`const executar = ${efeito}; executar;`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const limpar = vm.runInNewContext(codigo, {
    process: { env: { NODE_ENV: ambiente } }, referenciaSessaoInicial: ref, fetch: fetchSimulado,
    window: janela, setSessaoExpirada: (v) => { expirada = v; },
    setTimeout: (fn, ms) => { const id = ++proximo; timers.set(id, { fn, ms }); return id; }, clearTimeout: (id) => timers.delete(id),
  })();
  return { timers, eventos, janela, limpar, expirada: () => expirada, disparar: async (ms) => {
    const encontrado = [...timers.entries()].find(([, t]) => t.ms === ms); assert.ok(encontrado, `Temporizador ${ms}`);
    timers.delete(encontrado[0]); await encontrado[1].fn();
  } };
}
(async () => {
  for (const [role, portal] of [["ALUNO", "aluno"], ["PROFESSOR", "professor"], ["RH", "rh"], ["ADMIN", "professor"]]) {
    const atual = token(role, portal, { impersonacao: true, impersonacaoId: 3, masterOriginalId: 1 });
    await teste(`temporizador novo preserva ${portal}/${role}`, () => preservada(atual, automatico));
    await teste(`aba antiga sem cabeçalhos preserva ${portal}/${role}`, () => preservada(atual, {}));
  }
  await teste("nova sessão administrativa preservada", () => preservada(token("ADMIN", "admin", { jti: "nova-sessao" }), automatico));
  await teste("inatividade sem referência preservada", () => preservada(admin, { "x-phanyx-logout-motivo": "inatividade" }));
  await teste("inatividade sem cookie preservada", () => preservada(null, automatico));
  await teste("JWT inválido preservado", () => preservada("invalido", automatico));
  await teste("JWT com assinatura diferente preservado", () => preservada(token("ADMIN", "admin", {}, "outro-segredo"), automatico));
  await teste("origem externa não encerra", () => preservada(admin, { ...automatico, origin: "https://outro.example" }, 403));
  await teste("requisição cross-site não encerra", () => preservada(admin, { ...automatico, "sec-fetch-site": "cross-site" }, 403));
  for (const role of ["ADMIN", "SUPER_ADMIN", "FUNCIONARIO", "SECRETARIA", "FINANCEIRO", "COORDENADOR", "SUPORTE", "GERENCIA"]) {
    await teste(`inatividade encerra a própria sessão ${role}`, async () => {
      const atual = token(role, "admin"); await encerrada(atual, { ...automatico, "x-phanyx-sessao-admin": referenciaTokenSessao(atual) });
    });
  }
  await teste("logout manual Admin continua disponível", () => encerrada(admin, { "x-phanyx-sessao-admin": referencia }, 303));
  await teste("Admin legado sem portal pode sair", () => encerrada(token("ADMIN", undefined), {}, 303));
  await teste("somente a auditoria da sessão encerrada é finalizada", async () => {
    const atual = token("ADMIN", "admin", { impersonacao: true, impersonacaoId: 3, masterOriginalId: 1 });
    await encerrada(atual, { ...automatico, "x-phanyx-sessao-admin": referenciaTokenSessao(atual) }); assert.equal(auditorias, 1);
  });
  for (const [role, portal, arquivo] of [["ALUNO", "aluno", "logout-aluno"], ["PROFESSOR", "professor", "logout-professor"]]) {
    await teste(`logout manual do ${portal} preservado`, async () => {
      const rota = carregar(`app/api/auth/${arquivo}/route.ts`);
      const resposta = await rota.POST(request(token(role, portal)));
      assert.equal(resposta.status, 303); assert.equal(resposta.cookies.get("token").value, "");
    });
  }
  await teste("aba antiga ignora sessão trocada sem aviso ou redirecionamento", async () => {
    const e = montarEfeito(async (_, opcoes) => POST(request(token("PROFESSOR", "professor"), opcoes.headers)));
    await e.disparar(300000); assert.equal(e.expirada(), false); assert.equal(e.janela.location.href, ""); e.limpar();
  });
  await teste("própria sessão Admin expira em cinco minutos", async () => {
    const e = montarEfeito(async (_, opcoes) => POST(request(admin, opcoes.headers)));
    await e.disparar(300000); assert.equal(e.expirada(), true);
    await e.disparar(2500); assert.equal(e.janela.location.href, "/login?portal=admin"); e.limpar();
  });
  await teste("atividade renova o tempo e desmontagem limpa eventos", async () => {
    const e = montarEfeito(async () => { throw new Error("Não deve chamar"); });
    const anterior = [...e.timers.keys()][0]; e.eventos.get("mousemove")();
    assert.equal(e.timers.has(anterior), false); assert.equal(e.timers.size, 1);
    e.limpar(); assert.equal(e.timers.size, 0); assert.equal(e.eventos.size, 0);
  });
  await teste("falha de rede não exibe expiração e permite tentar depois", async () => {
    const e = montarEfeito(async () => { throw new Error("offline"); });
    await e.disparar(300000); assert.equal(e.expirada(), false); assert.equal(e.timers.size, 1); e.limpar();
  });
  await teste("requisição pendente não redireciona após desmontar", async () => {
    let resolver; const e = montarEfeito(() => new Promise((r) => { resolver = r; }));
    const pendente = e.disparar(300000); e.limpar(); resolver({ ok: true, status: 200 }); await pendente;
    assert.equal(e.expirada(), false); assert.equal(e.timers.size, 0);
  });
  await teste("desenvolvimento e sessão ausente não iniciam relógio", async () => {
    assert.equal(montarEfeito(null, referencia, "development").timers.size, 0);
    assert.equal(montarEfeito(null, null).timers.size, 0);
  });
  console.log(`OK: ${testes} cenários de sessão, inatividade, troca de portal, logout e auditoria.`);
})().catch((erro) => { console.error(erro); process.exitCode = 1; }).finally(() => {
  if (segredoAnterior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = segredoAnterior;
});
