/* Exercita código real com autenticação e persistência simuladas; não usa o banco da instituição. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { NextRequest } = require("next/server");
const root = path.resolve(__dirname, "..");
let testes = 0;
const usuarioPadrao = { id: 10, role: "ALUNO", instituicaoId: 2, impersonacao: false };
const obra = { id: 8, instituicaoId: 2, status: "PUBLICADO", titulo: "Obra de teste", slug: "obra", modalidade: "LEITURA_INTERNA", acessoLivre: false, permitirDownload: false,
  licencas: [{ instituicaoId: 2, ativo: true, permitirVisualizacao: true, permitirDownload: false, permitirCopia: false, permitirImpressao: false }] };
const arquivo = { id: 9, instituicaoId: 2, itemId: 8, tipo: "PDF", status: "DISPONIVEL", arquivadoEm: null, storageKey: "biblioteca/privado.pdf", nomeOriginal: "obra.pdf" };
let state;
function reset() { state = { usuario: { ...usuarioPadrao }, portal: true, vinculo: true, favoritos: [], progressos: [], anotacoes: [], recomendacoes: [], obra: structuredClone(obra), arquivo: { ...arquivo }, permitirFavoritos: true }; }
reset();
function match(row, where) { return ["id", "instituicaoId", "usuarioId", "itemId", "arquivoId", "tipo", "pagina", "professorId", "status", "arquivadoEm"].every((k) => where[k] === undefined || row[k] === where[k]); }
const prisma = {
  moduloAdicionalInstituicao: { findUnique: async () => ({ id: 1, plano: "BIBLIOTECA_AVANCADA", status: "ATIVO", testeGratisFimEm: null, armazenamentoContratadoBytes: 100n, armazenamentoExtraBytes: 0n }) },
  bibliotecaConfiguracao: { findUnique: async () => ({ id: 1, permitirDownload: false, permitirFavoritos: state.permitirFavoritos, armazenamentoUtilizadoBytes: 0n }) },
  bibliotecaOperador: { findUnique: async () => null },
  configuracaoPortalInstituicao: { findUnique: async () => ({ visivel: state.portal }) },
  aluno: { findFirst: async ({ where }) => state.vinculo && where.instituicaoId === 2 && where.userId === state.usuario.id && where.ativo === true ? { id: 4 } : null },
  professor: { findFirst: async ({ where }) => state.vinculo && where.instituicaoId === 2 && where.userId === state.usuario.id && where.ativo === true ? { id: 7 } : null },
  bibliotecaItem: { findFirst: async ({ where, select }) => {
    if (!match(state.obra, where)) return null;
    const filtro = select.licencas.where;
    assert.equal(filtro.instituicaoId, 2); assert.equal(filtro.ativo, true);
    assert.ok(filtro.OR.some((x) => x.inicioVigencia?.lte instanceof Date));
    assert.ok(filtro.AND[0].OR.some((x) => x.fimVigencia?.gte instanceof Date));
    const agora = new Date();
    return { ...state.obra, licencas: state.obra.licencas.filter((l) => l.ativo && l.instituicaoId === 2 && (!l.inicioVigencia || l.inicioVigencia <= agora) && (!l.fimVigencia || l.fimVigencia >= agora)) };
  } },
  bibliotecaArquivo: { findFirst: async ({ where }) => match(state.arquivo, where) && where.item.instituicaoId === state.obra.instituicaoId && where.item.status === state.obra.status ? { ...state.arquivo } : null },
  bibliotecaFavorito: {
    upsert: async ({ where, create }) => { assert.equal(where.instituicaoId_usuarioId_itemId.instituicaoId, 2); if (!state.favoritos.some((r) => match(r, create))) state.favoritos.push(create); return create; },
    deleteMany: async ({ where }) => { const antes = state.favoritos.length; state.favoritos = state.favoritos.filter((r) => !match(r, where)); return { count: antes - state.favoritos.length }; },
  },
  bibliotecaProgressoLeitura: {
    findFirst: async ({ where }) => state.progressos.find((r) => match(r, where)) || null,
    upsert: async ({ where, create, update }) => {
      const key = where.instituicaoId_usuarioId_itemId; let row = state.progressos.find((r) => match(r, key));
      if (row) Object.assign(row, update); else state.progressos.push(row = create); return row;
    },
  },
  bibliotecaAnotacao: {
    findMany: async ({ where }) => state.anotacoes.filter((r) => match(r, where)),
    findFirst: async ({ where }) => state.anotacoes.find((r) => match(r, where)) || null,
    count: async ({ where }) => state.anotacoes.filter((r) => match(r, where)).length,
    create: async ({ data }) => { const row = { ...data, id: `nota-${state.anotacoes.length + 1}` }; state.anotacoes.push(row); return row; },
    deleteMany: async ({ where }) => { const antes = state.anotacoes.length; state.anotacoes = state.anotacoes.filter((r) => !match(r, where)); return { count: antes - state.anotacoes.length }; },
  },
  turma: { findMany: async ({ where }) => { assert.equal(where.instituicaoId, 2); assert.ok(where.OR.some((x) => x.professorId === 7)); return [{ id: 5, nome: "Turma autorizada", cursoId: 3 }]; } },
  disciplina: { findMany: async ({ where }) => { assert.equal(where.instituicaoId, 2); return [{ id: 6, nome: "Disciplina autorizada", cursoId: 3 }]; } },
  curso: { findMany: async ({ where }) => { assert.equal(where.instituicaoId, 2); assert.deepEqual(where.id.in, [3]); return [{ id: 3, nome: "Curso autorizado" }]; } },
  matricula: { findMany: async ({ where }) => { assert.equal(where.status, "ATIVA"); assert.equal(where.excluidaEm, null); assert.equal(where.canceladaEm, null); assert.equal(where.instituicaoId, 2); return [{ cursoId: 3, turmaPrincipalId: 5, itens: [{ turmaId: 5, disciplinaId: 6 }] }]; } },
  bibliotecaRecomendacao: {
    create: async ({ data }) => { const row = { ...data, id: 1 }; state.recomendacoes.push(row); return row; },
    findFirst: async ({ where }) => state.recomendacoes.find((r) => match(r, where)) || null,
    findMany: async () => [],
    updateMany: async ({ where, data }) => { const rows = state.recomendacoes.filter((r) => match(r, where)); rows.forEach((r) => Object.assign(r, data)); return { count: rows.length }; },
    update: async ({ where, data }) => { const row = state.recomendacoes.find((r) => match(r, { ...where.id_instituicaoId, professorId: where.professorId })); assert.ok(row); Object.assign(row, data); return row; },
  },
  bibliotecaRecomendacaoDestino: { deleteMany: async () => ({ count: 1 }) },
  $queryRaw: async () => [],
  $transaction: async (callback) => callback(prisma),
};
const cache = new Map();
function carregar(file) {
  const absolute = path.join(root, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const module = { exports: {} }; cache.set(absolute, module);
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const requisitar = (id) => {
    if (id === "server-only") return {};
    if (id === "@/lib/prisma") return { prisma };
    if (id === "@/lib/server-auth") return { getUserFromToken: async () => state.usuario, isAdminLike: () => false, temAlgumaPermissao: () => false };
    if (id.startsWith("@/")) return carregar(`${id.slice(2)}.ts`);
    return require(id);
  };
  vm.runInThisContext(`(function(exports,require,module){${code}\n})`, { filename: absolute })(module.exports, requisitar, module);
  return module.exports;
}
async function teste(nome, callback) { reset(); await callback(); testes++; }
function request(method, body, origin = "http://localhost", raw) { return new NextRequest("http://localhost/api/biblioteca/teste", { method, headers: { "Content-Type": "application/json", origin }, body: method === "GET" ? undefined : raw ?? JSON.stringify(body) }); }
const params = { params: { arquivoId: "9" } };
const favorito = carregar("app/api/biblioteca/itens/[itemId]/favorito/route.ts");
const progresso = carregar("app/api/biblioteca/arquivos/[arquivoId]/progresso/route.ts");
const notas = carregar("app/api/biblioteca/arquivos/[arquivoId]/anotacoes/route.ts");
const recomenda = carregar("app/api/biblioteca/recomendacoes/route.ts");
const direitos = carregar("lib/biblioteca-direitos-leitura.ts");
const academico = carregar("lib/biblioteca-recomendacoes.ts");

(async () => {
  await teste("leitura interna sem download", async () => { const d = direitos.direitosLeituraBiblioteca(obra); assert.equal(d.lerPdf, true); assert.equal(d.copiarTrecho, false); assert.equal(d.imprimir, false); });
  await teste("licença negativa restringe acesso livre", async () => { const d = direitos.direitosLeituraBiblioteca({ ...obra, acessoLivre: true, licencas: [{ permitirVisualizacao: false, permitirCopia: true, permitirImpressao: true }] }); assert.deepEqual(d, { visualizar: false, lerPdf: false, copiarTrecho: false, imprimir: false }); });
  await teste("cópia e impressão autorizadas", async () => { assert.equal(direitos.direitosLeituraBiblioteca({ ...obra, licencas: [{ permitirVisualizacao: true, permitirCopia: true, permitirImpressao: true }] }).copiarTrecho, true); });
  await teste("acesso livre não concede cópia sem licença", async () => { const d = direitos.direitosLeituraBiblioteca({ ...obra, acessoLivre: true, licencas: [] }); assert.equal(d.lerPdf, true); assert.equal(d.copiarTrecho, false); assert.equal(d.imprimir, false); });
  for (const modalidade of ["EMPRESTIMO_FISICO", "EMPRESTIMO_DIGITAL", "LINK_EXTERNO", "STREAMING"]) await teste(`modalidade ${modalidade}`, async () => assert.equal(direitos.direitosLeituraBiblioteca({ ...obra, modalidade }).lerPdf, false));
  for (const [page, total] of [[0, 20], [21, 20], [1.5, 20], [1, 50001], ["2", 20], [NaN, 20], [1, 0]]) await teste("posição inválida", async () => assert.equal(direitos.validarPosicaoLeitura(page, total), null));
  await teste("percentual calculado no servidor", async () => assert.equal(direitos.validarPosicaoLeitura(5, 20).percentual, 25));
  for (const setup of [() => state.usuario = null, () => state.usuario.role = "ADMIN", () => state.portal = false, () => state.vinculo = false, () => state.usuario.instituicaoId = null]) await teste("acesso negado", async () => { setup(); assert.ok([401, 403].includes((await progresso.GET(request("GET"), params)).status)); });
  await teste("arquivo de outra instituição", async () => { state.arquivo.instituicaoId = 99; assert.equal((await progresso.GET(request("GET"), params)).status, 404); });
  await teste("obra em rascunho", async () => { state.obra.status = "RASCUNHO"; assert.equal((await progresso.GET(request("GET"), params)).status, 404); });
  await teste("arquivo arquivado", async () => { state.arquivo.arquivadoEm = new Date(); assert.equal((await progresso.GET(request("GET"), params)).status, 404); });
  await teste("licença vencida", async () => { state.obra.licencas[0].fimVigencia = new Date("2000-01-01"); assert.equal((await progresso.GET(request("GET"), params)).status, 403); });
  await teste("licença futura", async () => { state.obra.licencas[0].inicioVigencia = new Date("2100-01-01"); assert.equal((await progresso.GET(request("GET"), params)).status, 403); });
  await teste("origem cruzada", async () => assert.equal((await progresso.PUT(request("PUT", { paginaAtual: 1, totalPaginas: 5 }, "https://outro.example"), params)).status, 403));
  await teste("suporte somente leitura", async () => { state.usuario.impersonacao = true; assert.equal((await progresso.PUT(request("PUT", { paginaAtual: 1, totalPaginas: 5 }), params)).status, 403); assert.equal(state.progressos.length, 0); });
  await teste("JSON malformado", async () => assert.equal((await progresso.PUT(request("PUT", {}, "http://localhost", "{"), params)).status, 400));
  await teste("retomada e isolamento do progresso", async () => {
    state.progressos.push({ instituicaoId: 2, usuarioId: 99, itemId: 8, arquivoId: 9, paginaAtual: 19 });
    assert.equal((await progresso.PUT(request("PUT", { paginaAtual: 5, totalPaginas: 20, percentual: 100 }), params)).status, 200);
    const json = await (await progresso.GET(request("GET"), params)).json(); assert.equal(json.progresso.paginaAtual, 5); assert.equal(json.progresso.percentual, 25); assert.equal(state.progressos[0].paginaAtual, 19);
  });
  await teste("favorito idempotente e remoção", async () => { const p = { params: { itemId: "8" } }; for (let i = 0; i < 2; i++) assert.equal((await favorito.PUT(request("PUT", { favorito: true }), p)).status, 200); assert.equal(state.favoritos.length, 1); await favorito.PUT(request("PUT", { favorito: false }), p); assert.equal(state.favoritos.length, 0); });
  await teste("favoritos desabilitados", async () => { state.permitirFavoritos = false; assert.equal((await favorito.PUT(request("PUT", { favorito: true }), { params: { itemId: "8" } })).status, 403); });
  await teste("marcador idempotente", async () => { for (let i = 0; i < 2; i++) assert.equal((await notas.POST(request("POST", { tipo: "MARCADOR", pagina: 3 }), params)).status, 201); assert.equal(state.anotacoes.length, 1); });
  await teste("nota privada e exclusão protegida", async () => { const res = await notas.POST(request("POST", { tipo: "NOTA", pagina: 3, conteudo: "Minha nota" }), params); const { anotacao } = await res.json(); state.usuario.id = 20; assert.equal((await (await notas.GET(request("GET"), params)).json()).anotacoes.length, 0); assert.equal((await notas.DELETE(request("DELETE", { id: anotacao.id }), params)).status, 404); state.usuario.id = 10; assert.equal((await notas.DELETE(request("DELETE", { id: anotacao.id }), params)).status, 200); });
  await teste("destaque persiste coordenadas", async () => { const areas = [{ x: .1, y: .2, largura: .3, altura: .04 }]; const res = await notas.POST(request("POST", { tipo: "DESTAQUE", pagina: 3, trecho: "trecho selecionado", areas }), params); assert.equal(res.status, 201); assert.deepEqual((await res.json()).anotacao.areas, areas); });
  for (const body of [{ tipo: "OUTRO", pagina: 1 }, { tipo: "NOTA", pagina: 1, conteudo: "" }, { tipo: "DESTAQUE", pagina: 1, trecho: "teste", areas: [{ x: .9, y: .1, largura: .9, altura: .1 }] }, { tipo: "MARCADOR", pagina: 50001 }]) await teste("anotação inválida", async () => assert.equal((await notas.POST(request("POST", body), params)).status, 400));
  await teste("aluno não publica recomendação", async () => assert.equal((await recomenda.POST(request("POST", { itemId: 8 }))).status, 403));
  const body = { itemId: 8, titulo: "Leia esta obra", mensagem: "Capítulo 1", status: "PUBLICADA", obrigatoria: true, destinos: ["TURMA:5"] };
  await teste("professor publica para turma autorizada", async () => { state.usuario.role = "PROFESSOR"; const res = await recomenda.POST(request("POST", body)); assert.equal(res.status, 201); assert.equal(state.recomendacoes[0].instituicaoId, 2); assert.equal(state.recomendacoes[0].professorId, 7); assert.equal(state.recomendacoes[0].destinos.create[0].turmaId, 5); });
  await teste("turma fora da atribuição", async () => { state.usuario.role = "PROFESSOR"; assert.equal((await recomenda.POST(request("POST", { ...body, destinos: ["TURMA:999"] }))).status, 403); assert.equal(state.recomendacoes.length, 0); });
  await teste("outro professor não altera recomendação", async () => { state.usuario.role = "PROFESSOR"; state.recomendacoes.push({ id: 1, instituicaoId: 2, professorId: 99 }); assert.equal((await recomenda.PATCH(request("PATCH", { id: 1, status: "ENCERRADA" }))).status, 404); });
  await teste("publicação sem destinatário", async () => { state.usuario.role = "PROFESSOR"; assert.equal((await recomenda.POST(request("POST", { ...body, destinos: [] }))).status, 400); });
  await teste("intervalo invertido", async () => { state.usuario.role = "PROFESSOR"; assert.equal((await recomenda.POST(request("POST", { ...body, disponivelInicioEm: "2030-01-02", disponivelFimEm: "2030-01-01" }))).status, 400); });
  await teste("destinos do aluno com matrícula ativa", async () => { const leitor = await carregar("lib/biblioteca-leitor.ts").obterLeitorBiblioteca(); const filtro = await academico.filtroDestinosLeitor(leitor); assert.deepEqual(new Set(filtro.chaveDestino.in), new Set(["TODOS", "CURSO:3", "TURMA:5", "DISCIPLINA:6"])); });
  await teste("traduções em cinco idiomas", async () => {
    const idiomas = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"].map((l) => JSON.parse(fs.readFileSync(path.join(root, "messages", `${l}.json`), "utf8").replace(/^\uFEFF/, "")).ReaderLibrary);
    const flatten = (v, p = "") => Object.entries(v).flatMap(([k, x]) => typeof x === "object" ? flatten(x, `${p}${k}.`) : [[`${p}${k}`, x]]);
    const base = flatten(idiomas[0]); for (const locale of idiomas.slice(1)) { const trad = new Map(flatten(locale)); for (const [k, v] of base) { assert.ok(trad.get(k), k); assert.deepEqual((v.match(/\{\w+/g) || []).sort(), (trad.get(k).match(/\{\w+/g) || []).sort(), k); } }
  });
  console.log(`OK: ${testes} cenários de leitor, licenças, isolamento, favoritos, progresso, anotações, recomendações e traduções.`);
})().catch((erro) => { console.error(erro); process.exitCode = 1; });
