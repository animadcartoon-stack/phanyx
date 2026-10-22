/* Regressões da navegação e das APIs reais, com autenticação e banco simulados. */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const assert = require("node:assert/strict"), ts = require("typescript");
const { NextRequest } = require("next/server");
const root = path.resolve(__dirname, "..");
let testes = 0, estado;
function reset() {
  estado = { usuario: { id: 7, instituicaoId: 2, role: "ADMIN", isMasterAdmin: false, impersonacao: false }, modulo: null, consultasAcervo: 0 };
}
reset();
function modulo(status) {
  return { id: 1, plano: "BIBLIOTECA_ESSENCIAL", status, testeGratisFimEm: new Date(Date.now() + 86400000),
    armazenamentoContratadoBytes: 10737418240n, armazenamentoExtraBytes: 0n, valorMensal: 99 };
}
const prisma = {
  moduloAdicionalInstituicao: { findUnique: async ({ where }) => {
    assert.deepEqual(where.instituicaoId_tipo, { instituicaoId: 2, tipo: "BIBLIOTECA_VIRTUAL" }); return estado.modulo;
  } },
  bibliotecaConfiguracao: { findUnique: async ({ where }) => { assert.equal(where.instituicaoId, 2); return { id: 1, armazenamentoUtilizadoBytes: 0n }; } },
  bibliotecaOperador: { findUnique: async ({ where }) => { assert.equal(where.instituicaoId_usuarioId.instituicaoId, 2); return null; } },
  moduloAdicionalContratacao: { findFirst: async ({ where }) => { assert.equal(where.instituicaoId, 2); return null; } },
  bibliotecaItem: {
    count: async () => { estado.consultasAcervo++; return 0; },
    findMany: async () => { estado.consultasAcervo++; return []; },
  },
};
const cache = new Map();
function carregar(arquivo) {
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const module = { exports: {} }; cache.set(arquivo, module);
  const source = fs.readFileSync(path.join(root, arquivo), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const requisitar = (id) => {
    if (id === "server-only") return {};
    if (id === "@/lib/prisma") return { prisma };
    if (id === "@/lib/server-auth") return { getUserFromToken: async () => estado.usuario,
      isAdminLike: (role) => ["ADMIN", "SUPER_ADMIN", "GERENCIA"].includes(role), temAlgumaPermissao: () => false };
    if (id === "@/lib/server-permissions") return { obterPermissoesDoUsuario: async () => ["*"] };
    if (id === "@/lib/asaas") return { criarCheckoutBibliotecaAsaas: () => { throw new Error("A verificação não cria cobranças"); } };
    if (id === "@/lib/biblioteca-cutter") return {};
    if (id.startsWith("@/")) return carregar(`${id.slice(2)}.ts`);
    return require(id);
  };
  vm.runInThisContext(`(function(exports,require,module){${code}\n})`, { filename: arquivo })(module.exports, requisitar, module);
  return module.exports;
}
async function teste(nome, callback) { reset(); await callback(); testes++; }
const acesso = carregar("app/api/admin/biblioteca/acesso/route.ts");
const dashboard = carregar("app/api/admin/biblioteca/dashboard/route.ts");
const acervo = carregar("app/api/admin/biblioteca/acervo/route.ts");
const contratacao = carregar("app/api/admin/biblioteca/contratacao/route.ts");
const { decidirNavegacaoBiblioteca } = carregar("lib/biblioteca-navegacao-admin.ts");
const request = () => new NextRequest("http://localhost/api/admin/biblioteca/acervo");
(async () => {
  for (const [statusModulo, codigo] of [[null, "MODULO_NAO_CONTRATADO"], ["PENDENTE", "MODULO_INDISPONIVEL"], ["SUSPENSO", "MODULO_INDISPONIVEL"], ["CANCELADO", "MODULO_INDISPONIVEL"]]) {
    await teste(`módulo ${statusModulo || "não contratado"} mostra planos e bloqueia as APIs`, async () => {
      estado.modulo = statusModulo ? modulo(statusModulo) : null;
      const resposta = await acesso.GET(); const corpo = await resposta.json();
      assert.equal(resposta.status, 403); assert.equal(corpo.codigo, codigo);
      assert.equal(decidirNavegacaoBiblioteca(resposta.status, corpo), "planos");
      assert.equal((await dashboard.GET()).status, 403); assert.equal((await acervo.GET(request())).status, 403);
      assert.equal((await acervo.POST(new NextRequest("http://localhost/api/admin/biblioteca/acervo", {
        method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost" }, body: "{}",
      }))).status, 403);
      assert.equal(estado.consultasAcervo, 0, "Não pode consultar o acervo sem o módulo");
    });
  }
  await teste("teste grátis vencido mostra planos", async () => {
    estado.modulo = modulo("TESTE_GRATIS"); estado.modulo.testeGratisFimEm = new Date(0);
    const resposta = await acesso.GET(); const corpo = await resposta.json();
    assert.equal(corpo.codigo, "TESTE_GRATIS_EXPIRADO"); assert.equal(decidirNavegacaoBiblioteca(resposta.status, corpo), "planos");
  });
  for (const status of ["ATIVO", "TESTE_GRATIS", "EM_ATRASO"]) await teste(`acesso existente ${status} preservado`, async () => {
    estado.modulo = modulo(status); const resposta = await acesso.GET(); const corpo = await resposta.json();
    assert.equal(resposta.status, 200); assert.equal(decidirNavegacaoBiblioteca(resposta.status, corpo), "permitido");
    assert.match(resposta.headers.get("cache-control"), /no-store/);
  });
  await teste("usuário sem sessão vai para login", async () => {
    estado.usuario = null; const resposta = await acesso.GET(); assert.equal(resposta.status, 401);
    assert.equal(decidirNavegacaoBiblioteca(resposta.status, await resposta.json()), "login");
  });
  await teste("permissão negada não é confundida com falta de plano", async () => {
    estado.modulo = modulo("ATIVO"); estado.usuario.role = "FUNCIONARIO";
    const resposta = await acesso.GET(); assert.equal(resposta.status, 403);
    assert.equal(decidirNavegacaoBiblioteca(resposta.status, await resposta.json()), "negado");
  });
  await teste("instituição inválida não redireciona para cobrança", async () => {
    estado.usuario.instituicaoId = null; const resposta = await acesso.GET();
    assert.equal(decidirNavegacaoBiblioteca(resposta.status, await resposta.json()), "negado");
  });
  await teste("planos podem ser consultados sem módulo contratado", async () => {
    const resposta = await contratacao.GET(); assert.equal(resposta.status, 200);
    const dados = await resposta.json(); assert.equal(dados.ok, true); assert.equal(dados.modulo, null);
    assert.equal(dados.planos.length, 3); assert.equal(dados.permissoes.podeGerenciar, true);
  });
  for (const [status, corpo] of [[500, { codigo: "MODULO_NAO_CONTRATADO" }], [200, {}], [200, { disponivel: true }], [200, null], [403, { codigo: "SEM_PERMISSAO_BIBLIOTECA" }]]) {
    await teste("resposta incompleta ou erro nunca libera o acervo", async () => assert.notEqual(decidirNavegacaoBiblioteca(status, corpo), "permitido"));
  }
  const shell = ts.createSourceFile("AdminShell.tsx", fs.readFileSync(path.join(root, "app/admin/AdminShell.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const permissoesMenu = new Map();
  function localizar(no) {
    if (ts.isVariableDeclaration(no) && /^pode(Ver|Gerenciar).*Biblioteca$/.test(no.name.getText(shell)) && no.name.getText(shell) !== "podeVerBiblioteca") {
      permissoesMenu.set(no.name.getText(shell), no.initializer.getText(shell));
    }
    ts.forEachChild(no, localizar);
  }
  localizar(shell); assert.equal(permissoesMenu.size, 9);
  for (const [nome, expressao] of permissoesMenu) await teste(`${nome} exige contratação mesmo para administrador`, async () => {
    const codigo = ts.transpileModule(`(${expressao})`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
    for (const acessoBiblioteca of [null, { disponivel: false }, { disponivel: true }]) {
      const resultado = vm.runInNewContext(codigo, { acessoBiblioteca, podeAcessar: () => true, operadorBiblioteca: null });
      assert.equal(resultado, acessoBiblioteca?.disponivel === true);
    }
    assert.equal(vm.runInNewContext(codigo, { acessoBiblioteca: { disponivel: true }, podeAcessar: () => false, operadorBiblioteca: null }), false);
  });
  await teste("galeria completa, traduções e imagens presentes", async () => {
    const chaves = ["overview", "collection", "authorities", "shelves", "loans", "reservations", "fines", "reports", "audit", "licenses", "operators", "settings"];
    for (const locale of ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"]) {
      const mensagens = JSON.parse(fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8").replace(/^\uFEFF/, ""));
      for (const chave of chaves) { assert.ok(mensagens.AdminNavigation[chave]); assert.ok(mensagens.AdminLibraryPresentation.pages[chave]); }
      assert.match(mensagens.AdminLibraryPresentation.previewAlt, /\{page\}/);
    }
    for (const nome of ["visao-geral", "acervo", "autoridades", "prateleiras", "emprestimos", "reservas", "multas", "relatorios", "auditoria", "licencas", "operadores", "configuracoes"]) {
      const imagem = fs.readFileSync(path.join(root, "public/images/biblioteca/apresentacao", `${nome}.webp`));
      assert.equal(imagem.subarray(8, 12).toString(), "WEBP"); assert.ok(imagem.length > 1000);
    }
  });
  console.log(`OK: ${testes} cenários de plano, navegação, permissões, isolamento, contratação e galeria da Biblioteca.`);
})().catch((erro) => { console.error(erro); process.exitCode = 1; });
