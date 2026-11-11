const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { runInNewContext } = require("node:vm");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

function carregarModulo(arquivo, dependencias = {}) {
  const filename = resolve(__dirname, "..", arquivo);
  const { outputText, diagnostics } = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  });
  assert.deepEqual(diagnostics, []);
  const module = { exports: {} };
  runInNewContext(outputText, {
    module, exports: module.exports, Buffer, Date, console,
    require: nome => Object.hasOwn(dependencias, nome) ? dependencias[nome] : require(nome),
  }, { filename });
  return module.exports;
}

const fluxo = carregarModulo("lib/documentos-docentes/fluxo.ts");
const i18n = carregarModulo("lib/documentos-docentes/i18n-etapa3.ts");
const hashRevisado = "a".repeat(64);

function contexto({ papel = "PROFESSOR", impersonacao = false, autorizado = true, status = "RASCUNHO", assinado = false } = {}) {
  const documento = { id: 7, titulo: "Plano de aula", versaoAtual: 2, status };
  const usuario = { id: 19, nome: "Docente de teste", impersonacao };
  const assinatura = assinado ? { id: 4 } : null;
  const gravacoes = [];
  const trilha = [];
  const prisma = {
    documentoDocenteAssinatura: {
      findUnique: async () => assinatura,
      create: async ({ data }) => { gravacoes.push(data); return { id: 4 }; },
    },
    documentoDocenteAnexo: { findMany: async () => [{ id: 8, nomeOriginal: "anexo.pdf", versao: 2 }] },
    documentoDocenteVersao: { findUnique: async () => ({ numero: 2 }) },
    documentoDocente: { updateMany: async () => ({ count: 1 }) },
    documentoDocenteEvento: { create: async ({ data }) => { trilha.push(data); } },
    $transaction: async executar => executar(prisma),
  };
  const dependencias = {
    "@prisma/client": { Prisma: { PrismaClientKnownRequestError: class extends Error {} } },
    sharp: () => { throw new Error("Este teste usa assinatura digital sem imagem."); },
    "@/lib/prisma": { prisma },
    "@/lib/documentos-docentes/seguranca": {
      documentoAutorizado: async id => autorizado && id === 7
        ? { documento, ctx: { papel, usuario, instituicaoId: 3 } } : null,
    },
    "@/lib/documentos-docentes/fluxo": fluxo,
    "@/lib/documentos-docentes/integridade": { hashVersaoDocente: () => hashRevisado },
    "@/lib/documentos-docentes/i18n": { traduzirDocumentoDocente: () => "Versão" },
    "@/lib/documentos-docentes/i18n-etapa3": i18n,
    "@/components/documentos-docentes/AssinaturaDocumentoDocenteModal": {
      AssinaturaDocumentoDocentePagina: ({ documentoId, versao, retorno, hashEsperado }) =>
        require("react").createElement("form", {
          "data-documento": documentoId, "data-versao": versao, "data-retorno": retorno, "data-hash": hashEsperado,
        }),
    },
    "@/components/documentos-docentes/LeitorPdfDocumento": {
      default: ({ url }) => require("react").createElement("div", { "data-phanyx-pdf": url }),
      __esModule: true,
    },
    "next-intl/server": { getLocale: async () => "pt-BR" },
  };
  const { default: pagina } = carregarModulo("app/professor/documentos/[id]/assinar/page.tsx", dependencias);
  const { POST } = carregarModulo("app/api/documentos-docentes/[id]/assinaturas/route.ts", dependencias);
  const params = { id: "7" };
  return {
    gravacoes, trilha,
    abrir: async versao => renderToStaticMarkup(await pagina({ params, searchParams: { versao } })),
    assinar: (versao, consentimento = true, hashEsperado = hashRevisado) => POST(new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ versao, consentimento, tipo: "DIGITAL", hashEsperado }),
    }), { params }),
  };
}

test("a assinatura do docente revisa o PDF, lista os anexos e volta ao mesmo documento", async () => {
  const html = await contexto().abrir("2");
  assert.match(html, /Assinatura PHANYX/);
  assert.match(html, /data-phanyx-pdf="\/api\/documentos-docentes\/7\/pdf\?versao=2"/);
  assert.match(html, /\/api\/documentos-docentes\/7\/anexos\/8/);
  assert.match(html, /data-documento="7" data-versao="2" data-retorno="\/professor\/documentos\?documento=7"/);
  assert.ok(html.includes(`data-hash="${hashRevisado}"`));
});

test("a página recusa documentos sem acesso e exige papel de professor", async () => {
  await assert.rejects(contexto({ autorizado: false }).abrir("2"), /NEXT_NOT_FOUND/);
  await assert.rejects(contexto({ papel: "ADMIN" }).abrir("2"), /NEXT_NOT_FOUND/);
  assert.equal((await contexto({ autorizado: false }).assinar(2)).status, 404);
});

test("modo suporte permite conferir o PDF e não permite assinar como professor", async () => {
  const suporte = contexto({ impersonacao: true });
  const html = await suporte.abrir("2");
  assert.match(html, /Entre na sua conta de professor/);
  assert.match(html, /data-phanyx-pdf="\/api\/documentos-docentes\/7\/pdf\?versao=2"/);
  assert.doesNotMatch(html, /data-versao=/);
  assert.equal((await suporte.assinar(2)).status, 403);
  assert.equal(suporte.gravacoes.length, 0);
});

test("versão anterior, já assinada ou documento enviado ficam fora do formulário", async () => {
  assert.match(await contexto().abrir("1"), /Este documento foi atualizado/);
  assert.match(await contexto({ assinado: true }).abrir("2"), /Você já assinou esta versão/);
  assert.match(await contexto({ status: "ENVIADO" }).abrir("2"), /estado atual do documento/);
  assert.equal((await contexto().assinar(1)).status, 400);
  assert.equal((await contexto({ assinado: true }).assinar(2)).status, 409);
});

test("professor autenticado registra a assinatura e a trilha na versão consentida", async () => {
  const c = contexto();
  assert.equal((await c.assinar(2, false)).status, 400);
  assert.equal((await c.assinar(2, true, "b".repeat(64))).status, 409);
  assert.equal(c.gravacoes.length, 0);
  const resposta = await c.assinar(2);
  assert.equal(resposta.status, 201);
  assert.deepEqual(await resposta.json(), { ok: true, assinaturaId: 4, versao: 2, hashConteudo: hashRevisado });
  assert.equal(c.gravacoes[0].assinanteId, 19);
  assert.equal(c.gravacoes[0].versao, 2);
  assert.equal(c.trilha[0].tipo, "ASSINATURA_PROFESSOR");
});
