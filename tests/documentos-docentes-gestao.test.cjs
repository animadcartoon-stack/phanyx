const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

function carregar(arquivo, dependencias = {}) {
  const filename = resolve(__dirname, "..", arquivo);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    module, exports: module.exports, Buffer, console, URL,
    require: nome => dependencias[nome] ?? require(nome),
  }, { filename });
  return module.exports;
}

const destinos = carregar("lib/documentos-docentes/destinos-email.ts");
const operacao = "612001bc-01dd-43cf-a9e7-0f68b2c48d7b";
const params = { params: { id: "7" } };

function ambiente({ papel = "ADMIN", acesso = true, status = "AGUARDANDO_PROFESSOR" } = {}) {
  const ctx = { papel, instituicaoId: 9, professorId: papel === "PROFESSOR" ? 5 : null, usuario: { id: 20 } };
  const documento = { id: 7, titulo: "Plano de aula", versaoAtual: 2, status };
  const eventos = [];
  const envios = [];
  const consultas = [];
  let fila = Promise.resolve();
  const prisma = {
    documentoDocente: {
      findMany: async ({ where }) => { consultas.push(where); return []; },
      updateMany: async ({ where, data }) => {
        assert.equal(where.instituicaoId, 9);
        if (where.status?.not === documento.status || typeof where.status === "string" && where.status !== documento.status) return { count: 0 };
        Object.assign(documento, data);
        return { count: 1 };
      },
    },
    documentoDocenteEvento: {
      findFirst: async ({ where }) => eventos.find(e => e.usuarioId === where.usuarioId && e.descricao.startsWith(where.descricao.startsWith)),
      create: async ({ data }) => {
        const evento = { id: eventos.length + 1, ...data };
        eventos.push(evento);
        return evento;
      },
      update: async ({ where, data }) => Object.assign(eventos.find(e => e.id === where.id), data),
    },
    departamento: {
      findFirst: async ({ where }) => {
        assert.equal(where.instituicaoId, 9);
        assert.equal(where.ativo, true);
        return where.id === 3 ? { nome: "Coordenação" } : null;
      },
    },
    user: {
      findFirst: async ({ where }) => {
        assert.equal(where.instituicaoId, 9);
        return where.id === 42 ? { nome: "Pessoa de teste", email: "pessoa@example.test" } : null;
      },
      findMany: async ({ where }) => {
        assert.equal(where.instituicaoId, 9);
        assert.equal(where.ativo, true);
        assert.equal(where.OR[0].funcionario.is.departamentoId, 3);
        assert.equal(where.OR[1].professor.is.instituicaoId, 9);
        return [{ email: "a@example.test" }, { email: "A@example.test" }, { email: "b@example.test" }, { email: "inválido" }];
      },
    },
    $transaction: executar => {
      const atual = fila.then(() => executar(prisma));
      fila = atual.catch(() => {});
      return atual;
    },
  };
  const deps = {
    "@/lib/prisma": { prisma },
    "@/lib/documentos-docentes/destinos-email": destinos,
    "@/lib/documentos-docentes/seguranca": {
      documentoAutorizado: async id => acesso && id === 7 ? { ctx, documento: { ...documento } } : null,
      contextoDocumentosDocentes: async () => ctx,
    },
    "@/lib/documentos-docentes/gerar-pdf": {
      gerarPdfDocente: async (_auth, versao) => new Response(Buffer.from(`PDF versão ${versao}`)),
    },
    "@/lib/email": {
      prepararEmailDocumentoDocente: async instituicaoId => {
        assert.equal(instituicaoId, 9);
        return async opcoes => {
          envios.push(opcoes);
          return { accepted: opcoes.bcc ?? [opcoes.to] };
        };
      },
    },
  };
  const { DELETE } = carregar("app/api/documentos-docentes/[id]/route.ts", deps);
  const { GET } = carregar("app/api/documentos-docentes/route.ts", deps);
  const { POST } = carregar("app/api/documentos-docentes/[id]/envios/route.ts", deps);
  return {
    documento, eventos, envios, consultas,
    excluir: versao => DELETE(new Request(`https://example.test/?versao=${versao}`, { method: "DELETE" }), params),
    listar: (excluidos = false) => GET(new Request(`https://example.test/?excluidos=${excluidos ? 1 : 0}`)),
    enviar: (tipo, destino) => POST(new Request("https://example.test", {
      method: "POST", body: JSON.stringify({ tipo, destino, operacao, versao: 1 }),
    }), params),
  };
}

test("a administração pode excluir inclusive documentos aguardando professor e consultar o histórico", async () => {
  const app = ambiente();
  assert.equal((await app.excluir(1)).status, 409);
  assert.equal((await app.excluir(2)).status, 200);
  assert.equal((await app.excluir(2)).status, 200);
  assert.equal(app.documento.status, "CANCELADO");
  assert.equal(app.eventos.length, 1);
  assert.equal(app.eventos[0].tipo, "EXCLUIDO");
  assert.equal(app.eventos[0].descricao, "AGUARDANDO_PROFESSOR");
  await app.listar();
  await app.listar(true);
  assert.equal(app.consultas[0].status.not, "CANCELADO");
  assert.equal(app.consultas[1].status, "CANCELADO");
  assert.equal((await app.enviar("EMAIL", "pessoa@example.test")).status, 409);
});

test("o professor não pode excluir, consultar excluídos ou enviar por e-mail", async () => {
  const app = ambiente({ papel: "PROFESSOR" });
  assert.equal((await app.excluir(2)).status, 403);
  assert.equal((await app.enviar("USUARIO", 42)).status, 403);
  await app.listar(true);
  assert.equal(app.consultas[0].professorId, 5);
  assert.equal(app.consultas[0].status.not, "CANCELADO");
  const outraInstituicao = ambiente({ acesso: false });
  assert.equal((await outraInstituicao.excluir(2)).status, 404);
  assert.equal((await outraInstituicao.enviar("EMAIL", "a@example.test")).status, 404);
});

test("envia o PDF da versão selecionada para o e-mail digitado ou para o usuário pelo ID", async () => {
  for (const [tipo, destino] of [["EMAIL", "pessoa@example.test"], ["USUARIO", 42]]) {
    const app = ambiente();
    assert.deepEqual(await (await app.enviar(tipo, destino)).json(), { estado: "aceito", aceitos: 1, recusados: 0 });
    assert.equal(app.envios[0].to, "pessoa@example.test");
    assert.equal(app.envios[0].attachments[0].content.toString(), "PDF versão 1");
    assert.equal(app.envios[0].attachments[0].filename, "documento-docente-7-v1.pdf");
    assert.equal(app.eventos[0].tipo, "EMAIL_ENVIADO");
  }
  assert.equal((await ambiente().enviar("EMAIL", "pessoa@example.test,outra@example.test")).status, 422);
  assert.equal((await ambiente().enviar("USUARIO", 99)).status, 422);
});

test("o departamento recebe em cópia oculta sem duplicar o mesmo envio concorrente", async () => {
  const app = ambiente();
  await Promise.all([app.enviar("DEPARTAMENTO", 3), app.enviar("DEPARTAMENTO", 3)]);
  assert.equal(app.envios.length, 1);
  assert.equal(app.envios[0].to, undefined);
  assert.deepEqual(Array.from(app.envios[0].bcc).map(e => e.toLowerCase()), ["a@example.test", "b@example.test"]);
  assert.deepEqual(await (await app.enviar("DEPARTAMENTO", 3)).json(), { estado: "aceito", aceitos: 2, recusados: 0 });
  assert.equal(app.envios.length, 1);
});
