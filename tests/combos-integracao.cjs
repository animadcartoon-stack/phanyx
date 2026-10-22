// Execução optativa: PHANYX_COMBOS_TEST_DATABASE_URL deve apontar para um banco
// local vazio, com o schema aplicado. Nunca aceita endereços de produção.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const url = process.env.PHANYX_COMBOS_TEST_DATABASE_URL;
if (!url) {
  test(
    "integração com PostgreSQL local",
    { skip: "Defina PHANYX_COMBOS_TEST_DATABASE_URL para executar." },
    () => {},
  );
} else {
  const parsed = new URL(url);
  assert.ok(
    ["localhost", "127.0.0.1"].includes(parsed.hostname),
    "Somente banco local de testes",
  );
  assert.ok(
    parsed.pathname.endsWith("/phanyx_combos"),
    "Banco reservado phanyx_combos",
  );
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
  let usuario = null;
  const resolver = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    if (request.startsWith("@/"))
      request = path.resolve(__dirname, "..", request.slice(2));
    return resolver.call(this, request, parent, ...rest);
  };
  const loader = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "@/lib/server-auth")
      return { getUserFromToken: async () => usuario };
    if (request === "next-intl/server")
      return {
        getTranslations: async ({ locale = "pt-BR", namespace }) => {
          const { createTranslator } = require("use-intl/core");
          return createTranslator({
            locale,
            messages: JSON.parse(
              fs.readFileSync(
                path.resolve(__dirname, `../messages/${locale}.json`),
                "utf8",
              ),
            ),
            namespace,
          });
        },
      };
    return loader.call(this, request, parent, isMain);
  };
  Module._extensions[".ts"] = function (m, filename) {
    m._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
  };
  const { prisma } = require("../lib/prisma.ts");
  const api = require("../app/api/admin/matriculas/modalidades/route.ts");
  const regras = require("../app/api/admin/combos/route.ts");
  const {
    validarAgendaMatricula,
  } = require("../lib/matriculas/validar-agenda.ts");
  const req = (body) =>
    new Request("http://localhost/api/admin/matriculas/modalidades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent": "combos-integration",
      },
      body: JSON.stringify(body),
    });
  const unique = crypto.randomUUID();
  let instituicaoId,
    outraInstituicao,
    aluno1,
    aluno2,
    aluno3,
    turmas = [],
    cursos = [],
    pacote;
  test("fluxo integrado de combos", async (t) => {
    try {
      await t.test("endpoints exigem administrador autenticado", async () => {
        assert.equal((await api.GET()).status, 403);
        assert.equal((await regras.GET()).status, 403);
      });
      const instituicao = await prisma.instituicao.create({
        data: {
          nome: "TESTE COMBOS",
          slug: `test-combos-${unique}`,
          updatedAt: new Date(),
          isentaPagamento: true,
        },
      });
      instituicaoId = instituicao.id;
      outraInstituicao = await prisma.instituicao.create({
        data: {
          nome: "TESTE OUTRA INSTITUICAO",
          slug: `test-outro-${unique}`,
          updatedAt: new Date(),
        },
      });
      const admin = await prisma.user.create({
        data: {
          nome: "Admin teste",
          email: `admin-${unique}@example.invalid`,
          senha: "sem-login",
          role: "ADMIN",
          instituicaoId,
        },
      });
      usuario = {
        id: admin.id,
        nome: admin.nome,
        role: "ADMIN",
        instituicaoId,
      };
      const polo = await prisma.polo.create({
        data: { nome: "Polo teste", instituicaoId },
      });
      async function aluno(nome) {
        const user = await prisma.user.create({
          data: {
            nome,
            email: `${nome}-${unique}@example.invalid`,
            senha: "sem-login",
            role: "ALUNO",
            instituicaoId,
          },
        });
        return prisma.aluno.create({
          data: {
            nome,
            userId: user.id,
            instituicaoId,
            poloId: polo.id,
            dataNascimento: new Date("2016-01-01"),
            nomeResponsavel: "Responsável teste",
            cpfResponsavel: "00000000000",
            emailResponsavel: "responsavel@example.invalid",
            telefoneResponsavel: "48999999999",
            parentescoResponsavel: "Responsável",
          },
        });
      }
      aluno1 = await aluno("AlunoA");
      aluno2 = await aluno("AlunoB");
      aluno3 = await aluno("AlunoC");
      for (let i = 0; i < 3; i++) {
        const curso = await prisma.curso.create({
          data: {
            nome: `Modalidade ${i}`,
            instituicaoId,
            participaCombo: true,
            valorMatricula: 50,
            valorMensalidade: 100,
            valorMensalidadeCombo: 70,
            quantidadeParcelas: 12,
          },
        });
        cursos.push(curso);
        const disciplina = await prisma.disciplina.create({
          data: {
            nome: `Disciplina ${i}`,
            instituicaoId,
            cursoId: curso.id,
            cargaHoraria: 30,
          },
        });
        const turma = await prisma.turma.create({
          data: {
            nome: `Turma ${i}`,
            instituicaoId,
            cursoId: curso.id,
            poloId: polo.id,
            periodoLetivo: "2027",
            semestre: "1",
            statusTurma: "A_INICIAR",
            modalidade: "PRESENCIAL",
            dataInicio: new Date("2027-02-01"),
            dataFim: new Date("2027-12-20"),
            capacidadeMaxima: 10,
            disciplinas: {
              create: {
                instituicaoId,
                disciplinaId: disciplina.id,
                horarios: {
                  create: {
                    instituicaoId,
                    diaSemana: i === 2 ? 4 : 2,
                    horaInicio: i === 1 ? "14:30" : "14:00",
                    horaFim: i === 1 ? "16:20" : "15:00",
                  },
                },
              },
            },
          },
        });
        turmas.push(turma);
        if (i === 1) {
          const alternativa = await prisma.turma.create({
            data: {
              nome: "Turma alternativa",
              instituicaoId,
              cursoId: curso.id,
              poloId: polo.id,
              periodoLetivo: "2027",
              semestre: "1",
              statusTurma: "A_INICIAR",
              modalidade: "PRESENCIAL",
              capacidadeMaxima: 10,
              dataInicio: new Date("2027-02-01"),
              dataFim: new Date("2027-12-20"),
              disciplinas: {
                create: {
                  instituicaoId,
                  disciplinaId: disciplina.id,
                  horarios: {
                    create: {
                      instituicaoId,
                      diaSemana: 3,
                      horaInicio: "14:00",
                      horaFim: "15:00",
                    },
                  },
                },
              },
            },
          });
          turmas.push(alternativa);
        }
      }
      const config = {
        nome: "PEVI TESTE",
        ativo: true,
        minimoModalidades: 3,
        maximoModalidades: null,
        modoPreco: "FIXO",
        valorMatricula: "90.00",
        valorMensalidade: "239.00",
        quantidadeParcelas: 12,
        cursoIds: cursos.map((c) => c.id),
      };
      await t.test("cadastro de combo e isolamento institucional", async () => {
        const res = await regras.POST(req(config));
        assert.equal(res.status, 201, JSON.stringify(await res.clone().json()));
        pacote = (await res.json()).id;
        const estrangeiro = await prisma.curso.create({
          data: {
            nome: "Estrangeiro",
            instituicaoId: outraInstituicao.id,
            participaCombo: true,
          },
        });
        const invalido = await regras.POST(
          req({
            ...config,
            nome: "INVÁLIDO",
            cursoIds: [cursos[0].id, estrangeiro.id],
            minimoModalidades: 2,
          }),
        );
        assert.equal(invalido.status, 400);
        const duplicado = await regras.POST(req(config));
        assert.equal(duplicado.status, 409);
      });
      const selecionadas = [turmas[0].id, turmas[2].id, turmas[3].id];
      const base = {
        alunoId: aluno1.id,
        turmaIds: selecionadas,
        dataInicioCurso: "2027-02-01",
      };
      let previa;
      await t.test(
        "conflito parcial oferece turma alternativa sem trocar automaticamente",
        async () => {
          const res = await api.POST(
            req({
              ...base,
              acao: "PREVIA",
              turmaIds: [turmas[0].id, turmas[1].id],
            }),
          );
          assert.equal(res.status, 409);
          const data = await res.json();
          assert.equal(data.codigo, "CONFLITO_HORARIO");
          assert.equal(data.detalhes.alternativas[0].oferta.id, turmas[2].id);
          assert.equal(
            await prisma.matricula.count({ where: { instituicaoId } }),
            0,
          );
        },
      );
      await t.test("prévia aplica taxa única e valor fechado", async () => {
        const res = await api.POST(req({ ...base, acao: "PREVIA" }));
        assert.equal(res.status, 200, JSON.stringify(await res.clone().json()));
        previa = await res.json();
        assert.equal(previa.calculo.matriculaCentavos, 9000);
        assert.equal(previa.calculo.mensalidadeCentavos, 23900);
      });
      const pedido = {
        ...base,
        acao: "CONFIRMAR",
        chave: crypto.randomUUID(),
        versao: previa.versao,
        primeiroVencimento: "2027-01-31",
        status: "A_INICIAR",
        ajuste: null,
      };
      await t.test(
        "confirmação do menor e validação de ajuste precedem qualquer cobrança",
        async () => {
          const res = await api.POST(req(pedido));
          assert.equal(
            (await res.json()).codigo,
            "CONFIRMACAO_MENOR_NECESSARIA",
          );
          const invalido = await api.POST(
            req({
              ...pedido,
              confirmacaoMenorAceita: true,
              ajuste: {
                valorMatricula: "-1",
                valorMensalidade: "200",
                quantidadeParcelas: 12,
                motivo: "Teste",
              },
            }),
          );
          assert.equal(invalido.status, 400);
          assert.equal(
            await prisma.lancamentoFinanceiro.count({
              where: { instituicaoId },
            }),
            0,
          );
        },
      );
      let matriculaId;
      await t.test(
        "confirmação grava vínculos, uma taxa, doze mensalidades e contrato",
        async () => {
          const res = await api.POST(
            req({ ...pedido, confirmacaoMenorAceita: true }),
          );
          assert.equal(
            res.status,
            201,
            JSON.stringify(await res.clone().json()),
          );
          matriculaId = (await res.json()).matricula.id;
          const matricula = await prisma.matricula.findUnique({
            where: { id: matriculaId },
            include: {
              itens: true,
              lancamentosFinanceiros: true,
              contratos: true,
            },
          });
          assert.equal(matricula.itens.length, 3);
          assert.equal(
            matricula.lancamentosFinanceiros.filter(
              (l) => l.tipo === "MATRICULA",
            ).length,
            1,
          );
          const mensalidades = matricula.lancamentosFinanceiros.filter(
            (l) => l.tipo === "MENSALIDADE",
          );
          assert.equal(mensalidades.length, 12);
          assert.ok(
            mensalidades.every(
              (l) => l.valorFinal === 239 && l.status === "PENDENTE",
            ),
          );
          assert.equal(
            mensalidades
              .sort((a, b) => a.vencimento - b.vencimento)[1]
              .vencimento.toISOString()
              .slice(0, 10),
            "2027-02-28",
          );
          assert.equal(matricula.contratos.length, 1);
          assert.ok(
            matricula.contratos[0].conteudo.includes("data-phanyx-modalidades"),
          );
          assert.ok(
            matricula.contratos[0].conteudo.includes("Turma alternativa"),
          );
        },
      );
      await t.test(
        "repetir requisição não duplica matrícula, contrato ou cobrança",
        async () => {
          const res = await api.POST(
            req({ ...pedido, confirmacaoMenorAceita: true }),
          );
          assert.equal(res.status, 201);
          assert.equal((await res.json()).matricula.id, matriculaId);
          assert.equal(
            await prisma.matricula.count({ where: { instituicaoId } }),
            1,
          );
          assert.equal(
            await prisma.lancamentoFinanceiro.count({
              where: { instituicaoId },
            }),
            13,
          );
          const alterado = await api.POST(
            req({
              ...pedido,
              confirmacaoMenorAceita: true,
              primeiroVencimento: "2027-02-01",
            }),
          );
          assert.equal((await alterado.json()).codigo, "CHAVE_REUTILIZADA");
        },
      );
      await t.test(
        "matrícula avulsa também consulta horários ocupados pelo combo",
        async () => {
          await assert.rejects(
            () =>
              prisma.$transaction((tx) =>
                validarAgendaMatricula(tx, {
                  instituicaoId,
                  alunoId: aluno1.id,
                  itens: [
                    {
                      turmaId: turmas[1].id,
                      disciplinaId: turmas[1].cursoId
                        ? matriculaDisciplina()
                        : 0,
                    },
                  ],
                }),
              ),
            { codigo: "CONFLITO_HORARIO" },
          );
          function matriculaDisciplina() {
            return previa.snapshot.ofertas.find(
              (o) => o.turmaId === turmas[2].id,
            ).disciplinaIds[0];
          }
        },
      );
      await t.test(
        "última vaga e alteração de preço são conferidas na confirmação",
        async () => {
          const res = await api.POST(
            req({ ...base, alunoId: aluno2.id, acao: "PREVIA" }),
          );
          const p = await res.json();
          assert.equal(res.status, 200);
          await prisma.turma.update({
            where: { id: turmas[0].id },
            data: { capacidadeMaxima: 1 },
          });
          const lotada = await api.POST(
            req({
              ...pedido,
              chave: crypto.randomUUID(),
              alunoId: aluno2.id,
              versao: p.versao,
              confirmacaoMenorAceita: true,
            }),
          );
          assert.equal((await lotada.json()).codigo, "TURMA_SEM_VAGAS");
          await prisma.turma.update({
            where: { id: turmas[0].id },
            data: { capacidadeMaxima: 10 },
          });
          await prisma.comboModalidades.update({
            where: { id: pacote },
            data: { valorMensalidade: 249 },
          });
          const alterada = await api.POST(
            req({
              ...pedido,
              chave: crypto.randomUUID(),
              alunoId: aluno2.id,
              versao: p.versao,
              confirmacaoMenorAceita: true,
            }),
          );
          assert.equal((await alterada.json()).codigo, "DADOS_ALTERADOS");
          assert.equal(
            await prisma.matricula.count({ where: { instituicaoId } }),
            1,
          );
        },
      );
      await t.test(
        "ajuste administrativo fica auditado e usa os valores ajustados",
        async () => {
          const res = await api.POST(
            req({ ...base, alunoId: aluno3.id, acao: "PREVIA" }),
          );
          const p = await res.json();
          assert.equal(res.status, 200);
          const confirmar = await api.POST(
            req({
              ...pedido,
              chave: crypto.randomUUID(),
              alunoId: aluno3.id,
              versao: p.versao,
              confirmacaoMenorAceita: true,
              ajuste: {
                valorMatricula: "80.00",
                valorMensalidade: "220.00",
                quantidadeParcelas: 10,
                motivo: "Condição especial autorizada",
              },
            }),
          );
          assert.equal(
            confirmar.status,
            201,
            JSON.stringify(await confirmar.clone().json()),
          );
          const m = await prisma.matricula.findUnique({
            where: { id: (await confirmar.json()).matricula.id },
            include: { lancamentosFinanceiros: true },
          });
          assert.equal(m.lancamentosFinanceiros.length, 11);
          assert.equal(m.contratacaoModalidades.ajuste.usuarioId, admin.id);
          assert.equal(
            m.contratacaoModalidades.finais.mensalidadeCentavos,
            22000,
          );
        },
      );
    } finally {
      // Apenas dados sintéticos do banco local reservado.
      if (instituicaoId) {
        await prisma.matricula.deleteMany({ where: { instituicaoId } });
        await prisma.instituicao.delete({ where: { id: instituicaoId } });
      }
      if (outraInstituicao)
        await prisma.instituicao.delete({ where: { id: outraInstituicao.id } });
      await prisma.$disconnect();
    }
  });
}
