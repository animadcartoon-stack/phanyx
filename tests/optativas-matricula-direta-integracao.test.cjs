const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");

const conexao = process.env.PHANYX_OPTATIVAS_TEST_DATABASE_URL;

test("sessões compartilhadas, matrícula, cobrança, frequência e regência em PostgreSQL isolado", {
  skip: !conexao, timeout: 60000,
}, async () => {
  const url = new URL(conexao);
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.searchParams.get("schema"), "optativas_test");
  process.env.DATABASE_URL = conexao;
  process.env.DIRECT_URL = conexao;
  let usuario;
  const raiz = path.resolve(__dirname, "..");
  const resolver = Module._resolveFilename;
  const carregar = Module._load;
  Module._resolveFilename = function(request, parent, ...args) {
    return resolver.call(this, request.startsWith("@/") ? path.join(raiz, request.slice(2)) : request, parent, ...args);
  };
  Module._load = function(request, parent, isMain) {
    if (request === "@/lib/server-auth") return { getUserFromToken: async () => usuario };
    if (request === "next-intl/server") return {
      getTranslations: async ({ locale = "pt-BR", namespace }) => require("use-intl/core").createTranslator({
        locale, namespace, messages: JSON.parse(fs.readFileSync(path.join(raiz, `messages/${locale}.json`), "utf8")),
      }),
    };
    return carregar.call(this, request, parent, isMain);
  };
  Module._extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, file);
  const { prisma: db } = require("../lib/prisma.ts");
  const { verificarVagasOptativasParaRetorno } = require("../lib/matriculas/optativas-avulsas-servidor.ts");
  const configuracao = require("../app/api/admin/cursos/[id]/optativas-avulsas/route.ts");
  const matriculas = require("../app/api/admin/matriculas/modalidades/route.ts");
  const chamada = require("../app/api/professor/turmas/optativas-avulsas/route.ts");
  const req = (body, query = "") => new Request("http://localhost/api/teste" + query, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : {});
  async function resposta(promessa, status) {
    const res = await promessa;
    const json = await res.json();
    assert.equal(res.status, status, JSON.stringify(json));
    return json;
  }
  const fixture = randomUUID();
  const fetchOriginal = global.fetch;
  global.fetch = async () => { throw Error("HTTP externo proibido no teste"); };
  try {
    const { id: instituicaoId } = await db.instituicao.create({
      data: { nome: "Optativas teste", slug: fixture, updatedAt: new Date(), isentaPagamento: true },
    });
    const criarUser = (nome, role) => db.user.create({
      data: { nome, email: `${nome}-${fixture}@example.invalid`, senha: "sem-login", role, instituicaoId },
    });
    const admin = await criarUser("Admin", "ADMIN");
    const orientadora = await criarUser("Regente", "PROFESSOR");
    const docente = await criarUser("Docente", "PROFESSOR");
    const regente = await db.professor.create({ data: { nome: orientadora.nome, userId: orientadora.id, instituicaoId } });
    const professor = await db.professor.create({ data: { nome: docente.nome, userId: docente.id, instituicaoId } });
    const alunos = [];
    for (let n = 0; n < 3; n++) {
      const user = await criarUser(`Aluno${n}`, "ALUNO");
      alunos.push(await db.aluno.create({ data: { nome: user.nome, userId: user.id, instituicaoId, dataNascimento: new Date("2000-01-01") } }));
    }
    const curso = await db.curso.create({ data: {
      nome: "PEVI teste", instituicaoId, organizacaoCurricular: "ANUAL", valorMensalidade: 360,
      valorMatricula: 98.50, quantidadeParcelas: 12, matriculaDiretaTurma: true,
    } });
    const turmas = [];
    for (const nome of ["Turma A", "Turma B"]) {
      const turma = await db.turma.create({ data: {
        nome, instituicaoId, cursoId: curso.id, professorId: regente.id, semestre: "1", etapaNumero: 1,
        organizacaoCurricular: "ANUAL", periodoLetivo: "2027", ativa: true, statusTurma: "ATIVA", capacidadeMaxima: 14,
      } });
      await db.turmaHorarioAvulso.create({ data: {
        instituicaoId, turmaId: turma.id, diaSemana: 2, horaInicio: "13:30", horaFim: "17:30",
      } });
      turmas.push(turma);
    }
    const disciplina = await db.disciplina.create({ data: { nome: "Ukulele teste", cursoId: curso.id, instituicaoId } });
    const contexto = { params: { id: String(curso.id) } };
    usuario = admin;
    process.env.PHANYX_AVULSOS_INSTITUICOES_HABILITADAS = String(instituicaoId);
    process.env.PHANYX_MATRICULA_SEM_GRADE_HABILITADA = "true";
    assert.equal((await resposta(configuracao.GET(req(), contexto), 200)).ativo, false);
    const nova = { acao: "CRIAR", disciplinaId: disciplina.id, turmaIds: turmas.map(t => t.id),
      professorId: professor.id, diaSemana: 2, horaInicio: "15:00", horaFim: "16:00", capacidade: 1 };
    await resposta(configuracao.POST(req(nova), contexto), 400);
    await resposta(configuracao.POST(req({ acao: "ATIVAR", ativo: true }), contexto), 200);
    await resposta(configuracao.POST(req({ ...nova, horaFim: "18:00" }), contexto), 400);
    await resposta(configuracao.POST(req(nova), contexto), 200);
    const sessao = (await resposta(configuracao.GET(req(), contexto), 200)).sessoes[0];
    const montar = (aluno, turma, escolha) => ({
      alunoId: aluno.id, cursoPrincipalId: curso.id, turmaIds: [turma.id],
      dataInicioCurso: "2027-02-01", primeiroVencimento: "2027-02-05", status: "ATIVA",
      ...(escolha ? { optativaSessaoIds: [sessao.id] } : {}),
    });
    const previa = body => resposta(matriculas.POST(req({ ...body, acao: "PREVIA" })), 200);
    const pedidos = [montar(alunos[0], turmas[0], true), montar(alunos[1], turmas[1], true)];
    const previas = await Promise.all(pedidos.map(previa));
    assert.equal(previas[0].calculo.mensalidadeCentavos, 36000);
    const confirmar = (pedido, versao, chave = randomUUID()) => matriculas.POST(req({ ...pedido, acao: "CONFIRMAR", versao, chave }));
    const chaves = [randomUUID(), randomUUID()];
    const disputa = await Promise.all(pedidos.map((pedido, i) => confirmar(pedido, previas[i].versao, chaves[i])));
    assert.deepEqual(disputa.map(r => r.status).sort(), [201, 409]);
    const vencedor = disputa.findIndex(r => r.status === 201);
    const matricula = (await disputa[vencedor].json()).matricula;
    assert.equal((await resposta(confirmar(pedidos[vencedor], previas[vencedor].versao, chaves[vencedor]), 201)).matricula.id, matricula.id);
    assert.equal(await db.matriculaOptativaAvulsa.count({ where: { instituicaoId } }), 1);
    assert.equal(await db.itemMatricula.count({ where: { matriculaId: matricula.id } }), 0);
    assert.equal(await db.lancamentoFinanceiro.count({ where: { matriculaId: matricula.id, tipo: "MENSALIDADE" } }), 12);
    const semEscolha = montar(alunos[2], turmas[vencedor], false);
    await resposta(confirmar(semEscolha, (await previa(semEscolha)).versao), 201);

    const data = "2027-02-02";
    usuario = orientadora;
    const regencia = await resposta(chamada.GET(req(null, `?turmaId=${turmas[vencedor].id}&data=${data}`)), 200);
    assert.deepEqual(regencia.map(f => f.alunos.length), [2, 1, 2]);
    const presencas = [{ alunoId: alunos[vencedor].id, status: "PRESENTE" }];
    await resposta(chamada.POST(req({ sessaoId: sessao.id, data, presencas })), 403);
    usuario = docente;
    const lista = await resposta(chamada.GET(req(null, `?sessaoId=${sessao.id}&data=${data}`)), 200);
    assert.equal(lista.alunos[0].alunoId, alunos[vencedor].id);
    await resposta(chamada.POST(req({ sessaoId: sessao.id, data, presencas })), 200);
    assert.equal((await resposta(chamada.GET(req(null, `?sessaoId=${sessao.id}&data=${data}`)), 200)).alunos[0].status, "PRESENTE");

    await db.matricula.update({ where: { id: matricula.id }, data: { status: "SUSPENSA" } });
    usuario = admin;
    const outroPedido = pedidos[1 - vencedor];
    const outro = (await resposta(confirmar(outroPedido, (await previa(outroPedido)).versao), 201)).matricula;
    await assert.rejects(db.$transaction(tx => verificarVagasOptativasParaRetorno(tx, instituicaoId, matricula.id)),
      error => error.codigo === "OPTATIVA_SEM_VAGAS");
    await db.matricula.updateMany({ where: { id: { in: [matricula.id, outro.id] } },
      data: { status: "CANCELADA", canceladaEm: new Date() } });
    usuario = admin;
    assert.equal((await resposta(configuracao.GET(req(), contexto), 200)).sessoes[0].ocupadas, 0);
    assert.equal(await db.presencaOptativaAvulsa.count({ where: { instituicaoId } }), 1);
    usuario = { ...admin, instituicaoId: instituicaoId + 10000 };
    await resposta(configuracao.GET(req(), contexto), 404);
  } finally {
    global.fetch = fetchOriginal;
    await db.$disconnect();
  }
});
