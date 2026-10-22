const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function carregar(file, mocks = {}) {
  const modulo = { exports: {} };
  const compilado = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  assert.equal(compilado.diagnostics.filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0);
  new Function("require", "module", "exports", compilado.outputText)((id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("@/")) return carregar(id.replace("@/", "") + ".ts", mocks);
    return require(id);
  }, modulo, modulo.exports);
  return modulo.exports;
}
const validar = carregar("lib/chamada-encontro.ts");
const contexto = { instituicaoId: 7, turmaId: 10, disciplinaId: 20, professorId: 3, turma: { id: 10, nome: "Tarde" }, disciplina: { id: 20, nome: "Dança" } };
const user = { id: 5, role: "PROFESSOR", instituicaoId: 7, impersonacaoId: null };
const operador = { usuarioId: 5, impersonacaoId: null, ip: "127.0.0.1", userAgent: "teste" };
const entrada = { data: "2026-10-22", hora: "14:00", presencas: [{ alunoId: 1, status: "PRESENTE", observacao: null }, { alunoId: 2, status: "FALTA", observacao: null }] };
function ambiente() {
  let estado = { aulas: [], presencas: [], historico: [] };
  const controles = { permitidos: [1, 2], tentativas: 0, falhasConcorrentes: 0, acesso: true, falharHistorico: false, chamadas: [] };
  function atende(aula, where) {
    return ["instituicaoId", "turmaId", "disciplinaId", "horaEncontro"].every((chave) => where[chave] === undefined || aula[chave] === where[chave]) &&
      (!(where.dataEncontro instanceof Date) || aula.dataEncontro.getTime() === where.dataEncontro.getTime());
  }
  const tx = {
    aula: {
      findFirst: async ({ where }) => {
        const aula = estado.aulas.find((item) => atende(item, where));
        return aula ? { ...aula, presencas: estado.presencas.filter((item) => item.aulaId === aula.id) } : null;
      },
      aggregate: async ({ where }) => ({ _min: { ordem: estado.aulas.filter((item) => atende(item, where)).reduce((min, item) => Math.min(min, item.ordem), 0) } }),
      create: async ({ data }) => { const aula = { id: estado.aulas.length + 1, ...data }; estado.aulas.push(aula); return aula; },
      findMany: async ({ where }) => estado.aulas.filter((item) => atende(item, where)).map((item) => ({ ...item, _count: { presencas: estado.presencas.filter((p) => p.aulaId === item.id).length } })),
    },
    itemMatricula: { findMany: async ({ where, select }) => {
      controles.chamadas.push(where);
      assert.equal(where.instituicaoId, 7); assert.equal(where.turmaId, 10); assert.equal(where.disciplinaId, 20);
      assert.equal(where.matricula.excluidaEm, null); assert(where.status.notIn.includes("CANCELADO")); assert(where.matricula.status.notIn.includes("CANCELADA"));
      return controles.permitidos.map((id) => ({ matricula: select.matricula.select.aluno ? { aluno: { id, nome: "Aluno " + id } } : { alunoId: id } }));
    } },
    presencaAula: {
      findMany: async ({ where }) => structuredClone(estado.presencas.filter((item) => item.instituicaoId === where.instituicaoId && item.aulaId === where.aulaId)),
      upsert: async ({ where, create, update }) => {
        let item = estado.presencas.find((p) => p.aulaId === where.aulaId_alunoId.aulaId && p.alunoId === where.aulaId_alunoId.alunoId);
        if (item) Object.assign(item, update); else { item = { id: estado.presencas.length + 1, ...create }; estado.presencas.push(item); }
        return item;
      },
    },
    historicoPresencaAula: { create: async ({ data }) => {
      if (controles.falharHistorico) throw new Error("Falha simulada na auditoria");
      estado.historico.push(data);
    } },
  };
  const prisma = {
    ...tx,
    professor: { findFirst: async ({ where }) => { assert.equal(where.instituicaoId, user.instituicaoId); return { id: 3 }; } },
    turmaDisciplina: { findFirst: async ({ where }) => { assert.equal(where.AND[1].turma.instituicaoId, 7); return controles.acesso ? { turma: contexto.turma, disciplina: contexto.disciplina } : null; } },
    $transaction: async (fn, opcoes) => {
      controles.tentativas++; assert.equal(opcoes.isolationLevel, "Serializable");
      if (controles.falhasConcorrentes-- > 0) throw Object.assign(new Error("Conflito simulado"), { code: "P2034" });
      const antes = structuredClone(estado);
      try { return await fn(tx); } catch (error) { estado = antes; throw error; }
    },
  };
  const mocks = {
    "@prisma/client": { Prisma: { TransactionIsolationLevel: { Serializable: "Serializable" } } },
    "@/lib/prisma": { prisma },
    "@/lib/chamada-encontro": validar,
    "@/lib/professor-escopo-academico": { obterSubstituicoesAtivasProfessor: async () => [], montarFiltroTurmaDisciplinaProfessor: (p) => { assert.equal(p.instituicaoId, 7); return p; } },
  };
  const api = carregar("lib/professor-chamada-encontro.ts", mocks);
  return { api, controles, estado: () => estado, mocks };
}
let total = 0;
async function teste(nome, fn) { await fn(); total++; console.log("OK " + nome); }
(async () => {
  await teste("abrir lista sem aula não grava dados", async () => {
    const a = ambiente(); const r = await a.api.carregarChamadaEncontro(contexto, entrada.data, entrada.hora);
    assert.equal(r.encontro.salvo, false); assert.equal(r.alunos.length, 2); assert(r.alunos.every((item) => item.status === "")); assert.equal(a.estado().aulas.length, 0); assert.equal(a.controles.tentativas, 0);
  });
  await teste("salvar cria encontro não publicado e frequências compatíveis com o histórico", async () => {
    const a = ambiente(); await a.api.salvarChamadaEncontro(contexto, entrada, operador);
    assert.equal(a.estado().aulas.length, 1); assert.equal(a.estado().aulas[0].publicada, false); assert.equal(a.estado().aulas[0].ordem, -1);
    assert.equal(a.estado().aulas[0].dataEncontro.toISOString(), "2026-10-22T00:00:00.000Z"); assert.equal(a.estado().presencas.length, 2);
    assert.equal(a.estado().historico.length, 2); assert.equal(a.estado().historico[0].usuarioId, 5); assert.equal(a.estado().historico[0].ip, operador.ip);
  });
  await teste("reabrir e salvar o mesmo encontro não duplica chamada nem auditoria", async () => {
    const a = ambiente(); await a.api.salvarChamadaEncontro(contexto, entrada, operador); await a.api.salvarChamadaEncontro(contexto, entrada, operador);
    assert.equal(a.estado().aulas.length, 1); assert.equal(a.estado().historico.length, 2);
    const r = await a.api.carregarChamadaEncontro(contexto, entrada.data, entrada.hora); assert.equal(r.encontro.salvo, true); assert.equal(r.alunos[1].status, "FALTA");
  });
  await teste("dois horários no mesmo dia geram encontros independentes", async () => {
    const a = ambiente(); await a.api.salvarChamadaEncontro(contexto, entrada, operador); await a.api.salvarChamadaEncontro(contexto, { ...entrada, hora: "16:00" }, operador);
    assert.equal(a.estado().aulas.length, 2); assert.equal(a.estado().presencas.length, 4); assert.equal(a.estado().aulas[1].ordem, -2);
  });
  await teste("justificar falta preserva estado anterior e autor da correção", async () => {
    const a = ambiente(); await a.api.salvarChamadaEncontro(contexto, entrada, operador);
    const corrigida = structuredClone(entrada); corrigida.presencas[1] = { alunoId: 2, status: "JUSTIFICADA", observacao: "  Motivo informado  " };
    await a.api.salvarChamadaEncontro(contexto, corrigida, { ...operador, usuarioId: 9 });
    assert.equal(a.estado().presencas[1].status, "JUSTIFICADA"); const h = a.estado().historico.at(-1);
    assert.equal(h.statusAnterior, "FALTA"); assert.equal(h.observacao, "Motivo informado"); assert.equal(h.usuarioId, 9);
  });
  await teste("falha de auditoria desfaz encontro e frequências", async () => {
    const a = ambiente(); a.controles.falharHistorico = true; await assert.rejects(a.api.salvarChamadaEncontro(contexto, entrada, operador)); assert.deepEqual(a.estado(), { aulas: [], presencas: [], historico: [] });
  });
  await teste("recusa aluno de outra disciplina antes de criar encontro", async () => {
    const a = ambiente(); const input = { ...entrada, presencas: [{ alunoId: 99, status: "PRESENTE" }] };
    await assert.rejects(a.api.salvarChamadaEncontro(contexto, input, operador), /studentOutsideClass/); assert.equal(a.estado().aulas.length, 0);
  });
  await teste("lista alterada exige reabrir a chamada", async () => {
    const a = ambiente(); a.controles.permitidos.push(3); await assert.rejects(a.api.salvarChamadaEncontro(contexto, entrada, operador), /rosterChanged/); assert.equal(a.estado().aulas.length, 0);
  });
  await teste("conflito de transação repete com segurança", async () => {
    const a = ambiente(); a.controles.falhasConcorrentes = 1; await a.api.salvarChamadaEncontro(contexto, entrada, operador); assert.equal(a.controles.tentativas, 2); assert.equal(a.estado().aulas.length, 1);
  });
  await teste("conflitos persistentes retornam 409", async () => {
    const a = ambiente(); a.controles.falhasConcorrentes = 5; await assert.rejects(a.api.salvarChamadaEncontro(contexto, entrada, operador), (error) => error.status === 409); assert.equal(a.controles.tentativas, 3);
  });
  for (const usuario of [null, { ...user, role: "ALUNO" }, { ...user, instituicaoId: null }]) {
    await teste("recusa acesso sem sessão de professor/instituição", async () => {
      const a = ambiente(); await assert.rejects(a.api.autorizarChamadaEncontro(usuario, 10, 20), /unauthorized/);
    });
  }
  await teste("recusa oferta fora do escopo docente", async () => {
    const a = ambiente(); a.controles.acesso = false; await assert.rejects(a.api.autorizarChamadaEncontro(user, 10, 21), /forbidden/);
  });
  await teste("autoriza oferta com instituição da sessão", async () => {
    const a = ambiente(); const c = await a.api.autorizarChamadaEncontro(user, 10, 20); assert.equal(c.instituicaoId, 7); assert.equal(c.professorId, 3);
  });
  for (const [data, hora] of [["2026-02-30", "14:00"], ["2026-10-22", "24:00"], ["2026-10-22", "9:00"], ["2026-10-22", null]]) {
    await teste("recusa data/horário inválido " + data + " " + hora, async () => assert.throws(() => validar.validarEncontro(data, hora), /invalidMeeting/));
  }
  for (const presencas of [[], [{ alunoId: 1, status: "INVALIDO" }], [{ alunoId: 1, status: "PRESENTE" }, { alunoId: 1, status: "PRESENTE" }], [{ alunoId: 1, status: "JUSTIFICADA", observacao: " " }], [{ alunoId: 1, status: "ATESTADO" }]]) {
    await teste("recusa marcações incompletas, repetidas ou sem motivo", async () => assert.throws(() => validar.validarPresencasEncontro(presencas)));
  }
  await teste("atestado aceita motivo e conserva o status", async () => assert.equal(validar.validarPresencasEncontro([{ alunoId: 1, status: "ATESTADO", observacao: "Motivo informado" }])[0].status, "ATESTADO"));
  await teste("data civil não muda entre fusos horários", async () => {
    const anterior = process.env.TZ;
    try { for (const fuso of ["UTC", "America/Sao_Paulo", "Pacific/Honolulu"]) { process.env.TZ = fuso; assert.equal(validar.formatarDataEncontro("2026-10-22", "pt-BR"), "22/10/2026"); } }
    finally { if (anterior) process.env.TZ = anterior; else delete process.env.TZ; }
  });
  await teste("rota recusa JSON inválido e não consulta o banco", async () => {
    const a = ambiente(); const rota = carregar("app/api/professor/turmas/[turmaId]/chamadas/route.ts", {
      ...a.mocks, "next/server": { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
      "@/lib/server-auth": { getUserFromToken: async () => user },
      "@/lib/professor-chamada-encontro": a.api,
      "@/lib/student-success/solicitar-reanalise-por-alteracao-academica": {},
    });
    const r = await rota.POST({ json: async () => { throw new Error("JSON inválido"); } }, { params: Promise.resolve({ turmaId: "10" }) });
    assert.equal(r.status, 400); assert.equal(a.controles.tentativas, 0);
  });
  await teste("falha na reanálise não transforma frequência já salva em erro", async () => {
    const a = ambiente(); const rota = carregar("app/api/professor/turmas/[turmaId]/chamadas/route.ts", {
      ...a.mocks, "next/server": { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
      "@/lib/server-auth": { getUserFromToken: async () => user },
      "@/lib/professor-chamada-encontro": a.api,
      "@/lib/student-success/solicitar-reanalise-por-alteracao-academica": { solicitarReanalisePorAlteracaoAcademica: async () => { throw new Error("Falha simulada"); } },
    });
    const original = console.error; console.error = () => {};
    try { const r = await rota.POST({ json: async () => ({ ...entrada, disciplinaId: 20, instituicaoId: 99 }), headers: { get: () => null } }, { params: Promise.resolve({ turmaId: "10" }) }); assert.equal(r.status, 200); assert.equal(a.estado().presencas[0].instituicaoId, 7); }
    finally { console.error = original; }
  });
  await teste("cinco idiomas possuem as mesmas chaves e mensagens ICU válidas", async () => {
    const { createTranslator } = await import("next-intl");
    function chaves(obj, base = "") { return Object.entries(obj).flatMap(([key, value]) => typeof value === "string" ? [base + key] : chaves(value, base + key + ".")); }
    let referencia;
    for (const locale of ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"]) {
      const m = JSON.parse(fs.readFileSync(path.join(root, "messages", locale + ".json"), "utf8")).ProfessorMeetingAttendance;
      const keys = chaves(m).sort(); if (referencia) assert.deepEqual(keys, referencia); else referencia = keys;
      const t = createTranslator({ locale, messages: m, onError: (error) => { throw error; } });
      for (const key of keys) assert(t(key, { count: 2, name: "Aluno" }));
    }
  });
  console.log(`${total} cenários aprovados; testes isolados, sem conexão com banco de produção.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
