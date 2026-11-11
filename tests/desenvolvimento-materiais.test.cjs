const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

function carregar(arquivo, dependencias = {}) {
  const filename = resolve(__dirname, "..", arquivo);
  const { outputText, diagnostics } = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  });
  assert.deepEqual(diagnostics, []);
  const module = { exports: {} };
  runInNewContext(outputText, {
    module, exports: module.exports, URL, Request, Response, Headers, ReadableStream, process, Buffer,
    require: nome => Object.hasOwn(dependencias, nome) ? dependencias[nome] : require(nome),
  }, { filename });
  return module.exports;
}

const materiais = carregar("lib/desenvolvimento-materiais.ts");
const foto = { id: 1, mime: "image/png", nomeOriginal: "atividade.png" };
const video = { id: 2, mime: "video/mp4", nomeOriginal: "atividade.mp4" };
const pdf = { id: 3, mime: "application/pdf", nomeOriginal: "atividade.pdf" };
const anexo = { ...video, instituicaoId: 4, chaveR2: "arquivo-privado", tamanho: 8 };
const ctxAdmin = { instituicaoId: 4, usuario: { id: 3 } };

test("normaliza links HTTP e HTTPS e rejeita URLs executáveis ou com credenciais", () => {
  assert.deepEqual(Array.from(materiais.validarLinksDesenvolvimento(["https://exemplo.test", "https://exemplo.test/"])), ["https://exemplo.test/"]);
  for (const valor of [["javascript:alert(1)"], ["data:text/html,abc"], ["https://user:senha@exemplo.test"], ["//exemplo.test"], Array(11).fill("https://exemplo.test")]) {
    assert.equal(materiais.validarLinksDesenvolvimento(valor), null);
  }
});

test("o portal do aluno consulta só seus registros publicados e limita os anexos sem autorização", async () => {
  const { GET } = carregar("app/api/aluno/desenvolvimento/route.ts", {
    "@/lib/acompanhamento-permissoes": { contextoAluno: async () => ({ instituicaoId: 4, aluno: { id: 7 } }) },
    "@/lib/desenvolvimento-materiais": materiais,
    "@/lib/prisma": { prisma: { registroDesenvolvimento: { findMany: async ({ where }) => {
      assert.equal(where.instituicaoId, 4);
      assert.equal(where.alunoId, 7);
      assert.equal(where.status, "PUBLICADO");
      return [{ id: 9, autorizacaoImagemConfirmada: false, imagens: [foto, video, pdf], links: ["https://exemplo.test/"] }];
    } } } },
  });
  const resposta = await GET();
  assert.equal(resposta.headers.get("Cache-Control"), "private, no-store");
  assert.deepEqual((await resposta.json()).registros, [{ id: 9, imagens: [pdf], links: ["https://exemplo.test/"] }]);
});

test("Student Success consulta só campos acadêmicos e recusa acesso administrativo sem permissão", async () => {
  let consulta;
  let permitido = true;
  const { GET } = carregar("app/api/admin/student-success/alunos/[alunoId]/desenvolvimento/route.ts", {
    "@/lib/acompanhamento-permissoes": { contextoAdmin: async () => ctxAdmin },
    "@/lib/student-success/verificar-acesso-student-success": { verificarAcessoStudentSuccess: async () => ({ permitido }) },
    "@/lib/prisma": { prisma: { registroDesenvolvimento: { findMany: async args => { consulta = args; return []; } } } },
  });
  assert.equal((await GET(null, { params: { alunoId: "7" } })).status, 200);
  assert.equal(consulta.where.alunoId, 7);
  assert.equal(consulta.where.instituicaoId, 4);
  assert.ok(!consulta.where.status.in.includes("RASCUNHO"));
  assert.equal(consulta.select.descricao, true);
  assert.equal(consulta.select.nota, true);
  assert.equal(consulta.select.devolutiva, true);
  assert.equal(consulta.select.imagens, undefined);
  assert.equal(consulta.select.links, undefined);
  permitido = false;
  assert.equal((await GET(null, { params: { alunoId: "7" } })).status, 403);
});

test("aprovação exige autorização para fotos e vídeos e publica registros com PDF sem essa confirmação", async () => {
  let imagens = [video, pdf];
  let atualizacoes = 0;
  const { PATCH } = carregar("app/api/admin/acompanhamento-aulas/route.ts", {
    "@/lib/acompanhamento-permissoes": { contextoAdmin: async () => ctxAdmin, textoCurto: valor => String(valor ?? "") },
    "@/lib/desenvolvimento-materiais": materiais,
    "@/lib/prisma": { prisma: { registroDesenvolvimento: {
      findFirst: async () => ({ id: 9, status: "ENVIADO", atualizadoEm: new Date(0), imagens }),
      updateMany: async ({ where, data }) => {
        assert.equal(where.instituicaoId, 4);
        assert.equal(data.status, "PUBLICADO");
        atualizacoes++;
        return { count: 1 };
      },
    } } },
  });
  const aprovar = autorizacaoImagemConfirmada => PATCH(new Request("https://exemplo.test", {
    method: "PATCH", body: JSON.stringify({ id: 9, alvo: "DESENVOLVIMENTO", acao: "APROVAR", autorizacaoImagemConfirmada }),
  }));
  assert.equal((await aprovar(false)).status, 400);
  assert.equal(atualizacoes, 0);
  assert.equal((await aprovar(true)).status, 200);
  imagens = [pdf];
  assert.equal((await aprovar(false)).status, 200);
  assert.equal(atualizacoes, 2);
});

test("mídia privada valida titularidade e publicação e aceita requisição parcial de vídeo", async () => {
  const anterior = process.env.R2_PRIVATE_BUCKET_NAME;
  process.env.R2_PRIVATE_BUCKET_NAME = "bucket-teste-desenvolvimento";
  try {
    let alunoId = 8;
    let status = "PUBLICADO";
    let autorizacao = true;
    let acessosR2 = 0;
    const { GET } = carregar("app/api/desenvolvimento/imagens/[id]/route.ts", {
      "@/lib/server-auth": { getUserFromToken: async () => ({ id: 2, instituicaoId: 4, role: "ALUNO" }), isAdminLike: () => false },
      "@/lib/portal-config": { paginaVisivel: async () => true },
      "@/lib/portal-professor-permissoes": { paginaProfessorVisivel: async () => true },
      "@/lib/desenvolvimento-materiais": materiais,
      "@/lib/prisma": { prisma: {
        imagemDesenvolvimento: { findFirst: async () => ({
          ...anexo, registro: { instituicaoId: 4, alunoId: 7, status, autorizacaoImagemConfirmada: autorizacao },
        }) },
        aluno: { findFirst: async () => ({ id: alunoId }) },
      } },
      "@/lib/storage/r2": { getR2Client: () => ({ send: async comando => {
        acessosR2++;
        assert.equal(comando.input.Range, "bytes=2-5");
        return {
          Body: { transformToWebStream: () => new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1, 2, 3, 4])); c.close(); } }) },
          ContentLength: 4, ContentRange: "bytes 2-5/8",
        };
      } }) },
    });
    const abrir = () => GET(new Request("https://exemplo.test", { headers: { range: "bytes=2-5" } }), { params: { id: "2" } });
    assert.equal((await abrir()).status, 403);
    alunoId = 7;
    status = "ENVIADO";
    assert.equal((await abrir()).status, 403);
    status = "PUBLICADO";
    autorizacao = false;
    assert.equal((await abrir()).status, 403);
    autorizacao = true;
    const resposta = await abrir();
    assert.equal(resposta.status, 206);
    assert.equal(resposta.headers.get("Content-Type"), "video/mp4");
    assert.equal(resposta.headers.get("Content-Range"), "bytes 2-5/8");
    assert.equal((await resposta.arrayBuffer()).byteLength, 4);
    assert.equal(acessosR2, 1);
  } finally {
    if (anterior === undefined) delete process.env.R2_PRIVATE_BUCKET_NAME;
    else process.env.R2_PRIVATE_BUCKET_NAME = anterior;
  }
});
