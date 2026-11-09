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
  const inicioContratacao = require("../app/api/admin/matriculas/[id]/inicio-contratacao/route.ts");
  const revisaoValores = require("../app/api/admin/matriculas/[id]/revisao-valores/route.ts");
  const alterarModalidades = require("../app/api/admin/matriculas/[id]/alterar-modalidades/route.ts");
  const historicoEdicoes = require("../app/api/admin/matriculas/[id]/historico-edicoes/route.ts");
  const edicaoLegada = require("../app/api/admin/matriculas/[id]/route.ts");
  const cursosApi = require("../app/api/admin/cursos/route.ts");
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
        funcionarioId: 127,
      };
      await t.test("curso livre aceita zero ou campo vazio sem exigir preço de combo", async () => {
        for (const [indice, semestres] of [0, "0", "", null].entries()) {
          const res = await cursosApi.POST(req({
            nome: `Robótica regressão ${indice}`,
            codigo: `ROB-${indice}-${unique}`,
            quantidadeSemestres: semestres,
            valorMatricula: 98.5,
            valorMensalidade: 239,
            quantidadeParcelas: 12,
            participaCombo: true,
            valorMensalidadeCombo: null,
            poloIds: [],
          }));
          assert.equal(res.status, 201, JSON.stringify(await res.clone().json()));
          const curso = await res.json();
          assert.equal(curso.quantidadeSemestres, null);
          assert.equal(Number(curso.valorMatricula), 98.5);
          assert.equal(Number(curso.valorMensalidade), 239);
          assert.equal(curso.participaCombo, true);
          assert.equal(curso.valorMensalidadeCombo, null);
        }
      });
      await t.test("curso universitário mantém semestres positivos e edição aceita zero", async () => {
        const dados = {
          nome: "Curso universitário regressão",
          quantidadeSemestres: 8,
          valorMatricula: 98.5,
          valorMensalidade: 239,
          quantidadeParcelas: 12,
        };
        const res = await cursosApi.POST(req(dados));
        assert.equal(res.status, 201, JSON.stringify(await res.clone().json()));
        const curso = await res.json();
        assert.equal(curso.quantidadeSemestres, 8);
        for (const semestres of [0, 6]) {
          const editar = await cursosApi.PUT(req({ ...dados, id: curso.id, quantidadeSemestres: semestres }));
          assert.equal(editar.status, 200, JSON.stringify(await editar.clone().json()));
          assert.equal((await editar.json()).quantidadeSemestres, semestres || null);
        }
      });
      await t.test("semestres negativos ou fracionários são rejeitados na criação e edição", async () => {
        const curso = await prisma.curso.findFirst({ where: { instituicaoId, nome: "Curso universitário regressão" } });
        for (const semestres of [-1, 1.5]) {
          for (const metodo of ["POST", "PUT"]) {
            const nome = `Curso inválido ${semestres} ${metodo}`;
            const res = await cursosApi[metodo](req({ id: curso.id, nome, quantidadeSemestres: semestres }));
            assert.equal(res.status, 400);
            assert.equal((await res.json()).codigo, "SEMESTRES_INVALIDOS");
            assert.equal(await prisma.curso.count({ where: { instituicaoId, nome } }), 0);
          }
        }
        assert.equal((await prisma.curso.findUnique({ where: { id: curso.id } })).quantidadeSemestres, 6);
      });
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
          await prisma.aluno.update({
            where: { id: aluno1.id },
            data: { emailResponsavel: null },
          });
          try {
            const res = await api.POST(req(pedido));
            assert.equal(res.status, 409);
            const aviso = await res.json();
            assert.equal(aviso.codigo, "CONFIRMACAO_MENOR_NECESSARIA");
            assert.deepEqual(aviso.detalhes.pendencias, ["e-mail do responsável"]);
          } finally {
            await prisma.aluno.update({
              where: { id: aluno1.id },
              data: { emailResponsavel: "responsavel@example.invalid" },
            });
          }
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
          const res = await api.POST(req(pedido));
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
          assert.equal(matricula.alunoMenorNoMomentoMatricula, true);
          assert.equal(matricula.responsavelIncompletoNoMomentoMatricula, false);
          assert.equal(matricula.confirmacaoMenorEm, null);
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
      await t.test(
        "percentual configurável é persistido e gera a cobrança calculada",
        async () => {
          const cadastro = await regras.POST(
            req({
              ...config,
              nome: "Percentual teste",
              minimoModalidades: 2,
              maximoModalidades: 2,
              modoPreco: "PERCENTUAL",
              valorMensalidade: null,
              descontoPercentual: "5.00",
            }),
          );
          assert.equal(
            cadastro.status,
            201,
            JSON.stringify(await cadastro.clone().json()),
          );
          const registro = await prisma.comboModalidades.findUnique({
            where: { id: (await cadastro.json()).id },
          });
          assert.equal(Number(registro.descontoPercentual), 5);
          const selecao = {
            ...base,
            alunoId: aluno2.id,
            turmaIds: selecionadas.slice(0, 2),
            acao: "PREVIA",
          };
          const res = await api.POST(req(selecao));
          assert.equal(
            res.status,
            200,
            JSON.stringify(await res.clone().json()),
          );
          const p = await res.json();
          assert.equal(p.calculo.mensalidadeCentavos, 19000);
          const criar = await api.POST(
            req({
              ...pedido,
              ...selecao,
              acao: "CONFIRMAR",
              chave: crypto.randomUUID(),
              versao: p.versao,
              confirmacaoMenorAceita: true,
            }),
          );
          assert.equal(
            criar.status,
            201,
            JSON.stringify(await criar.clone().json()),
          );
          const m = await prisma.matricula.findUnique({
            where: { id: (await criar.json()).matricula.id },
            include: { lancamentosFinanceiros: true },
          });
          assert.ok(
            m.lancamentosFinanceiros
              .filter((l) => l.tipo === "MENSALIDADE")
              .every((l) => l.valorFinal === 190),
          );
        },
      );
      await t.test("revisão da matrícula comum grava a taxa, a bolsa e o contrato sem duplicar cobranças", async () => {
        const novoAluno = await aluno("AlunoRevisaoComum");
        const primeiro = new Date();
        primeiro.setUTCFullYear(primeiro.getUTCFullYear() + 1);
        const matricula = await prisma.matricula.create({
          data: { instituicaoId, alunoId: novoAluno.id, cursoId: cursos[0].id,
            valorMatricula: 0, valorMensalidade: 0, quantidadeMensalidades: 2,
            primeiroVencimento: primeiro, dataInicioCurso: primeiro },
        });
        const contexto = { params: { id: String(matricula.id) } };
        const valores = { valorMatricula: "75.00", valorMensalidade: "400.00", bolsaPercentual: "25", motivo: "Condição negociada na secretaria" };
        const consulta = await revisaoValores.POST(req(valores), contexto);
        assert.equal(consulta.status, 200, JSON.stringify(await consulta.clone().json()));
        const previa = await consulta.json();
        assert.equal(previa.nova.total, 67500);
        assert.equal(await prisma.lancamentoFinanceiro.count({ where: { matriculaId: matricula.id } }), 0);
        const confirmar = () => revisaoValores.PATCH(req({ ...valores, versao: previa.versao }), contexto);
        const resultado = await confirmar();
        assert.equal(resultado.status, 200, JSON.stringify(await resultado.clone().json()));
        assert.notEqual((await confirmar()).status, 200);
        const dados = await prisma.matricula.findUniqueOrThrow({
          where: { id: matricula.id },
          include: { contratos: true, lancamentosFinanceiros: true, edicoes: { orderBy: { id: "asc" } } },
        });
        assert.equal(Number(dados.valorMatricula), 75);
        assert.equal(Number(dados.bolsaPercentual), 25);
        assert.equal(dados.contratos.length, 1);
        assert.deepEqual(dados.lancamentosFinanceiros.map(l => l.valorFinal).sort((a, b) => a - b), [75, 300, 300]);
        assert.equal(dados.edicoes[0].motivo, valores.motivo);
        const autor = dados.edicoes[0];
        assert.equal(autor.usuarioId, admin.id);
        assert.equal(autor.funcionarioId, usuario.funcionarioId);
        assert.ok(autor.criadoEm instanceof Date);
        assert.deepEqual(autor.alteracoes.valorMatricula, { anterior: 0, novo: 75 });
        const historico = await historicoEdicoes.GET(req({}), contexto);
        assert.equal(historico.status, 200);
        assert.equal((await historico.json()).edicoes[0].id, autor.id);
        const usuarioOriginal = usuario;
        try {
          usuario = { ...usuario, instituicaoId: outraInstituicao.id };
          assert.equal((await historicoEdicoes.GET(req({}), contexto)).status, 404);
        } finally {
          usuario = usuarioOriginal;
        }
        const taxa = dados.lancamentosFinanceiros.find(l => l.tipo === "MATRICULA");
        await prisma.lancamentoFinanceiro.update({ where: { id: taxa.id }, data: { status: "PARCIAL", valorPago: 20 } });
        const comRecebimento = await revisaoValores.POST(req({ ...valores, valorMatricula: "60" }), contexto);
        assert.equal(comRecebimento.status, 409);
        assert.match((await comRecebimento.json()).error, /recebimentos ou cobranças emitidas/);
        assert.equal(await prisma.edicaoMatricula.count({ where: { matriculaId: matricula.id } }), 1);
      });
      await t.test("edição legada registra o autor autenticado e os campos modificados", async () => {
        const novoAluno = await aluno("AlunoAuditoria");
        const matricula = await prisma.matricula.create({
          data: { instituicaoId, alunoId: novoAluno.id, cursoId: cursos[0].id, valorMatricula: 0 },
        });
        const contexto = { params: { id: String(matricula.id) } };
        const resposta = await edicaoLegada.PUT(req({ valorMatricula: 30, usuarioId: 99999 }), contexto);
        assert.equal(resposta.status, 200);
        const edicao = await prisma.edicaoMatricula.findFirstOrThrow({ where: { matriculaId: matricula.id } });
        assert.equal(edicao.acao, "EDICAO");
        assert.equal(edicao.usuarioId, admin.id);
        assert.deepEqual(edicao.alteracoes.valorMatricula, { anterior: "0", novo: "30" });
      });
      await t.test("combo com antecipação grava entrada e somente a primeira parcela reduzida", async () => {
        const combo = await prisma.comboModalidades.findUniqueOrThrow({ where: { id: pacote } });
        const atualizar = await regras.PUT(req({
          ...config, id: pacote, versao: combo.updatedAt.toISOString(), taxaComoAntecipacao: true,
          valorMatricula: "98.50", valorMensalidade: "936.00",
        }));
        assert.equal(atualizar.status, 200, JSON.stringify(await atualizar.clone().json()));
        const novoAluno = await aluno("AlunoComAntecipacao");
        const selecao = { ...base, alunoId: novoAluno.id };
        const vencimentoTeste = new Date();
        vencimentoTeste.setUTCFullYear(vencimentoTeste.getUTCFullYear() + 1);
        const primeiroVencimento = vencimentoTeste.toISOString().slice(0, 10);
        const conteudo = "Início {{inicioAnuidade}}. {{textoMatriculaAnuidade}}. {{textoPontualidadeAnuidade}}";
        const modelo = await prisma.documentoTemplate.create({
          data: { instituicaoId, nome: "Contrato para validação", tipo: "CONTRATO", conteudo },
        });
        const chave = crypto.randomUUID();
        const semInicio = { ...selecao, dataInicioCurso: null };
        const previaSemInicio = await api.POST(req({ ...semInicio, acao: "PREVIA" }));
        assert.equal(previaSemInicio.status, 200);
        const bloqueada = await api.POST(req({
          ...pedido, ...semInicio, chave, versao: (await previaSemInicio.json()).versao,
        }));
        assert.equal(bloqueada.status, 422);
        const pendencia = await bloqueada.json();
        assert.equal(pendencia.codigo, "CONTRATO_PENDENTE");
        assert.match(pendencia.error, /Data de início do curso/);

        const consulta = await api.POST(req({ ...selecao, acao: "PREVIA" }));
        assert.equal(consulta.status, 200, JSON.stringify(await consulta.clone().json()));
        const p = await consulta.json();
        assert.equal(p.calculo.antecipacaoCentavos, 9850);
        await prisma.documentoTemplate.update({
          where: { id: modelo.id }, data: { conteudo: conteudo + " {{variavelInexistente}}" },
        });
        const modeloInvalido = await api.POST(req({ ...pedido, ...selecao, chave, versao: p.versao }));
        assert.equal(modeloInvalido.status, 422);
        assert.match((await modeloInvalido.json()).error, /variavelInexistente/);
        const where = { instituicaoId, alunoId: novoAluno.id };
        assert.equal(await prisma.matricula.count({ where }), 0);
        assert.equal(await prisma.lancamentoFinanceiro.count({ where }), 0);
        assert.equal(await prisma.contrato.count({ where }), 0);

        await prisma.documentoTemplate.update({ where: { id: modelo.id }, data: { conteudo } });
        const resposta = await api.POST(req({ ...pedido, ...selecao, chave, versao: p.versao, primeiroVencimento }));
        assert.equal(resposta.status, 201, JSON.stringify(await resposta.clone().json()));
        const m = await prisma.matricula.findUnique({
          where: { id: (await resposta.json()).matricula.id },
          include: { contratos: true, lancamentosFinanceiros: { orderBy: [{ vencimento: "asc" }, { id: "asc" }] } },
        });
        assert.equal(m.contratos.length, 1);
        assert.match(m.contratos[0].conteudo, /98,50/);
        assert.doesNotMatch(m.contratos[0].conteudo, /{{/);
        assert.equal(m.planoPagamentoContratado.antecipacaoCentavos, 9850);
        const taxas = m.lancamentosFinanceiros.filter(l => l.tipo === "MATRICULA");
        const mensais = m.lancamentosFinanceiros.filter(l => l.tipo === "MENSALIDADE");
        assert.equal(taxas.length, 1);
        assert.equal(taxas[0].valorFinal, 98.5);
        assert.equal(mensais.length, 12);
        assert.equal(mensais[0].valorOriginal, 936);
        assert.equal(mensais[0].valorFinal, 837.5);
        assert.equal(mensais[0].valorAntecipacaoAbatida, 98.5);
        assert.ok(mensais.slice(1).every(l => l.valorFinal === 936 && l.valorAntecipacaoAbatida === 0));
        assert.equal(m.lancamentosFinanceiros.reduce((soma, l) => soma + l.valorFinal, 0), 11232);

        // Recria a condição de um combo legado confirmado sem a data no contrato.
        await prisma.matricula.update({ where: { id: m.id }, data: { dataInicioCurso: null } });
        const contratoAntigo = m.contratos[0];
        await prisma.contrato.update({ where: { id: contratoAntigo.id }, data: { assinaturaSecretariaEm: new Date() } });
        const corrigirInicio = (dataInicioCurso, dataInicioAnterior = null) => inicioContratacao.PATCH(
          new Request(`http://localhost/api/admin/matriculas/${m.id}/inicio-contratacao`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataInicioCurso, dataInicioAnterior }),
          }),
          { params: { id: String(m.id) } },
        );
        const comAssinatura = await corrigirInicio("2027-02-08");
        assert.equal(comAssinatura.status, 422);
        assert.match((await comAssinatura.json()).error, /assinatura/);
        assert.equal((await prisma.matricula.findUniqueOrThrow({ where: { id: m.id } })).dataInicioCurso, null);

        await prisma.contrato.update({ where: { id: contratoAntigo.id }, data: { assinaturaSecretariaEm: null } });
        const corrigida = await corrigirInicio("2027-02-08");
        assert.equal(corrigida.status, 200, JSON.stringify(await corrigida.clone().json()));
        assert.equal((await corrigirInicio("2027-02-08")).status, 200);
        const depois = await prisma.matricula.findUniqueOrThrow({
          where: { id: m.id }, include: { contratos: { orderBy: { id: "asc" } }, lancamentosFinanceiros: true },
        });
        assert.equal(depois.dataInicioCurso.toISOString().slice(0, 10), "2027-02-08");
        assert.deepEqual(depois.planoPagamentoContratado, m.planoPagamentoContratado);
        assert.deepEqual(depois.lancamentosFinanceiros.map(l => l.id).sort(), m.lancamentosFinanceiros.map(l => l.id).sort());
        assert.equal(depois.contratos.length, 2);
        assert.equal(depois.contratos[0].status, "CANCELADO");
        assert.equal(depois.contratos[0].tokenAssinatura, null);
        assert.equal(depois.contratos[1].status, "PENDENTE");
        assert.match(depois.contratos[1].conteudo, /08\/02\/2027/);
        assert.equal(await prisma.documentoAluno.count({
          where: { matriculaId: m.id, instituicaoId, tipo: "CONTRATO", arquivado: false },
        }), 1);

        const desatualizada = await corrigirInicio("2027-02-02", "2027-02-01");
        assert.equal(desatualizada.status, 422);
        assert.match((await desatualizada.json()).error, /Recarregue/);
        const adiantada = await corrigirInicio("2027-02-02", "2027-02-08");
        assert.equal(adiantada.status, 200, JSON.stringify(await adiantada.clone().json()));
        const revisada = await prisma.matricula.findUniqueOrThrow({
          where: { id: m.id }, include: { contratos: { where: { status: "PENDENTE" } }, lancamentosFinanceiros: true },
        });
        assert.equal(revisada.dataInicioCurso.toISOString().slice(0, 10), "2027-02-02");
        assert.ok(revisada.contratacaoModalidades.ofertas.every(oferta =>
          oferta.horarios.every(horario => horario.dataInicio === "2027-02-02")));
        assert.equal(revisada.contratacaoModalidades.revisoesInicio.at(-1).anterior, "2027-02-08");
        assert.deepEqual(revisada.planoPagamentoContratado, m.planoPagamentoContratado);
        assert.deepEqual(revisada.lancamentosFinanceiros.map(l => l.id).sort(), m.lancamentosFinanceiros.map(l => l.id).sort());
        assert.equal(revisada.contratos.length, 1);
        assert.match(revisada.contratos[0].conteudo, /02\/02\/2027/);
        const valores = { valorMatricula: "120.00", valorMensalidade: "920.00", bolsaPercentual: "5", motivo: "Revisão antes da assinatura" };
        const contexto = { params: { id: String(m.id) } };
        const consultaValores = await revisaoValores.POST(req(valores), contexto);
        assert.equal(consultaValores.status, 200, JSON.stringify(await consultaValores.clone().json()));
        const previaValores = await consultaValores.json();
        assert.equal(previaValores.nova.antecipacao, 12000);
        assert.equal(previaValores.nova.liquida, 87400);
        const confirmaValores = await revisaoValores.PATCH(req({ ...valores, versao: previaValores.versao }), contexto);
        assert.equal(confirmaValores.status, 200, JSON.stringify(await confirmaValores.clone().json()));
        const valoresAtualizados = await prisma.matricula.findUniqueOrThrow({
          where: { id: m.id },
          include: { contratos: { where: { status: "PENDENTE" } },
            lancamentosFinanceiros: { orderBy: [{ vencimento: "asc" }, { id: "asc" }] }, edicoes: { orderBy: { id: "asc" } } },
        });
        assert.equal(valoresAtualizados.planoPagamentoContratado.antecipacaoCentavos, 12000);
        assert.equal(valoresAtualizados.lancamentosFinanceiros.length, 13);
        assert.deepEqual(valoresAtualizados.lancamentosFinanceiros.filter(l => l.tipo === "MENSALIDADE").map(l => l.valorFinal),
          [754, ...Array(11).fill(874)]);
        assert.match(valoresAtualizados.contratos[0].conteudo, /120,00/);
        assert.deepEqual(valoresAtualizados.edicoes.map(e => e.acao), ["DATA_INICIO", "DATA_INICIO", "VALORES"]);
        assert.deepEqual(valoresAtualizados.edicoes[1].alteracoes.dataInicioCurso, {
          anterior: "2027-02-08", novo: "2027-02-02",
        });
        assert.deepEqual(valoresAtualizados.edicoes[2].alteracoes.valorMatricula, { anterior: 98.5, novo: 120 });

        await prisma.contrato.update({ where: { id: valoresAtualizados.contratos[0].id }, data: { assinaturaSecretariaEm: new Date() } });
        const comAssinaturaValores = await revisaoValores.POST(req({ ...valores, valorMatricula: "121" }), contexto);
        assert.equal(comAssinaturaValores.status, 409);
        assert.match((await comAssinaturaValores.json()).error, /emitido ou assinado/);
        const alteracaoAssinada = await corrigirInicio("2027-02-03", "2027-02-02");
        assert.equal(alteracaoAssinada.status, 422);
        assert.match((await alteracaoAssinada.json()).error, /assinatura/);
      });
      await t.test("alterar modalidades reprecifica, libera as turmas retiradas e preserva a matrícula", async () => {
        const novoAluno = await aluno("AlunoAlterarCombo");
        const primeiro = new Date();
        primeiro.setUTCFullYear(primeiro.getUTCFullYear() + 1);
        const selecao = { ...base, alunoId: novoAluno.id, primeiroVencimento: primeiro.toISOString().slice(0, 10) };
        const calculo = await api.POST(req({ ...selecao, acao: "PREVIA" }));
        assert.equal(calculo.status, 200);
        const criada = await api.POST(req({ ...pedido, ...selecao, chave: crypto.randomUUID(), versao: (await calculo.json()).versao }));
        assert.equal(criada.status, 201, JSON.stringify(await criada.clone().json()));
        const matriculaId = (await criada.json()).matricula.id;
        const contexto = { params: { id: String(matriculaId) } };
        const atual = await prisma.matricula.findUniqueOrThrow({ where: { id: matriculaId }, include: {
          contratos: true, lancamentosFinanceiros: true, itens: true,
        } });
        const opcoes = await alterarModalidades.GET(req({}), contexto);
        assert.equal(opcoes.status, 200);
        assert.equal((await opcoes.json()).atuais.length, 3);
        const body = { turmaIds: [turmas[0].id], motivo: "Família pediu para manter só a primeira modalidade" };
        const semModalidade = await alterarModalidades.POST(req({ ...body, turmaIds: [] }), contexto);
        assert.equal(semModalidade.status, 400);
        assert.match((await semModalidade.json()).error, /Cancelar matrícula/);
        const comConflito = await alterarModalidades.POST(req({ ...body, turmaIds: [turmas[0].id, turmas[1].id] }), contexto);
        assert.equal(comConflito.status, 409);
        assert.equal((await comConflito.json()).codigo, "CONFLITO_HORARIO");
        const previa = await alterarModalidades.POST(req(body), contexto);
        assert.equal(previa.status, 200, JSON.stringify(await previa.clone().json()));
        const p = await previa.json();
        assert.equal(p.comboAnterior, true);
        assert.equal(p.comboNovo, false);
        assert.equal(p.anterior.antecipacao, 9850);
        assert.equal(p.nova.antecipacao, 0);
        assert.equal(p.nova.taxa, 5000);
        assert.equal(p.nova.liquida, 10000);
        assert.equal(await prisma.edicaoMatricula.count({ where: { matriculaId } }), 0);
        assert.equal((await alterarModalidades.PATCH(req({ ...body, versao: "desatualizada" }), contexto)).status, 409);
        const confirmada = await alterarModalidades.PATCH(req({ ...body, versao: p.versao }), contexto);
        assert.equal(confirmada.status, 200, JSON.stringify(await confirmada.clone().json()));
        assert.notEqual((await alterarModalidades.PATCH(req({ ...body, versao: p.versao }), contexto)).status, 200);
        const revista = await prisma.matricula.findUniqueOrThrow({ where: { id: matriculaId }, include: {
          contratos: { orderBy: { id: "asc" } }, lancamentosFinanceiros: true, itens: true,
          disciplinasContratadas: true, edicoes: true,
        } });
        assert.equal(revista.numeroMatricula, atual.numeroMatricula);
        assert.equal(revista.alunoId, atual.alunoId);
        assert.equal(revista.comboId, null);
        assert.equal(revista.planoPagamentoContratado, null);
        assert.deepEqual(revista.itens.filter(i => i.status === "A_CURSAR").map(i => i.turmaId), [turmas[0].id]);
        assert.equal(revista.itens.filter(i => i.status === "CANCELADO").length, 2);
        assert.equal(revista.disciplinasContratadas.length, 1);
        assert.deepEqual(revista.lancamentosFinanceiros.map(l => l.id).sort(), atual.lancamentosFinanceiros.map(l => l.id).sort());
        assert.ok(revista.lancamentosFinanceiros.filter(l => l.tipo === "MENSALIDADE")
          .every(l => l.valorFinal === 100 && l.valorAntecipacaoAbatida === 0));
        assert.equal(revista.contratos[0].status, "CANCELADO");
        assert.equal(revista.contratos[0].tokenAssinatura, null);
        assert.equal(revista.contratos[1].status, "PENDENTE");
        assert.equal(revista.edicoes[0].acao, "MODALIDADES");
        assert.equal(revista.edicoes[0].usuarioId, admin.id);
        assert.equal(revista.edicoes[0].motivo, body.motivo);
        assert.equal(revista.edicoes[0].alteracoes.modalidades.anterior.length, 3);
        assert.equal(revista.edicoes[0].alteracoes.modalidades.novo.length, 1);
        const voltar = { ...body, turmaIds: selecionadas, motivo: "Família decidiu recompor o combo" };
        const voltarPrevia = await alterarModalidades.POST(req(voltar), contexto);
        assert.equal(voltarPrevia.status, 200, JSON.stringify(await voltarPrevia.clone().json()));
        const voltarDados = await voltarPrevia.json();
        assert.equal(voltarDados.comboNovo, true);
        const voltou = await alterarModalidades.PATCH(req({ ...voltar, versao: voltarDados.versao }), contexto);
        assert.equal(voltou.status, 200, JSON.stringify(await voltou.clone().json()));
        assert.equal(await prisma.itemMatricula.count({ where: { matriculaId, status: "A_CURSAR" } }), 3);
        const { contratoId } = await voltou.json();
        await prisma.contrato.update({ where: { id: contratoId }, data: { assinaturaSecretariaEm: new Date() } });
        const assinada = await alterarModalidades.POST(req(body), contexto);
        assert.equal(assinada.status, 409);
        assert.match((await assinada.json()).error, /emitido ou assinado/);
      });
      await t.test("turma direta mantém o próprio lugar e retira a optativa vinculada à modalidade que saiu", async () => {
        const novoAluno = await aluno("AlunoRevisaoDireta");
        const flags = ["PHANYX_AVULSOS_INSTITUICOES_HABILITADAS", "PHANYX_MATRICULA_SEM_GRADE_HABILITADA"];
        const anteriores = flags.map(chave => process.env[chave]);
        process.env[flags[0]] = String(instituicaoId);
        process.env[flags[1]] = "true";
        try {
          const criarTurma = async (n, diaSemana) => {
            const curso = await prisma.curso.create({ data: {
              nome: "Direta " + n, instituicaoId, matriculaDiretaTurma: true,
              optativasAvulsasAtivas: true, organizacaoCurricular: "ANUAL",
              valorMatricula: 50, valorMensalidade: 100, quantidadeParcelas: 12,
            } });
            const turma = await prisma.turma.create({ data: {
              nome: "Turma direta " + n, instituicaoId, cursoId: curso.id, poloId: polo.id,
              organizacaoCurricular: "ANUAL", etapaNumero: 1, semestre: "1", periodoLetivo: "2027",
              statusTurma: "A_INICIAR", modalidade: "PRESENCIAL", capacidadeMaxima: 1,
            } });
            await prisma.turmaHorarioAvulso.create({ data: {
              instituicaoId, turmaId: turma.id, diaSemana, horaInicio: "14:00", horaFim: "16:00",
            } });
            const disciplina = await prisma.disciplina.create({ data: { nome: "Optativa " + n, cursoId: curso.id, instituicaoId } });
            const optativa = await prisma.sessaoOptativaAvulsa.create({ data: {
              instituicaoId, cursoId: curso.id, disciplinaId: disciplina.id, diaSemana,
              horaInicio: "14:30", horaFim: "15:30", capacidade: 1,
            } });
            await prisma.turmaSessaoOptativaAvulsa.create({ data: { instituicaoId, turmaId: turma.id, sessaoId: optativa.id } });
            return { turma, optativa };
          };
          const manter = await criarTurma("A", 2);
          const retirar = await criarTurma("B", 4);
          const primeiro = new Date();
          primeiro.setUTCFullYear(primeiro.getUTCFullYear() + 1);
          const inicio = primeiro.toISOString().slice(0, 10);
          const selecao = {
            alunoId: novoAluno.id, turmaIds: [manter.turma.id, retirar.turma.id], dataInicioCurso: inicio,
            optativaSessaoIds: [manter.optativa.id, retirar.optativa.id], primeiroVencimento: inicio,
          };
          const calculo = await api.POST(req({ ...selecao, acao: "PREVIA" }));
          assert.equal(calculo.status, 200, JSON.stringify(await calculo.clone().json()));
          const criada = await api.POST(req({ ...pedido, ...selecao, chave: crypto.randomUUID(), versao: (await calculo.json()).versao }));
          assert.equal(criada.status, 201, JSON.stringify(await criada.clone().json()));
          const matriculaId = (await criada.json()).matricula.id;
          const contexto = { params: { id: String(matriculaId) } };
          const body = { turmaIds: [manter.turma.id], motivo: "Família retirou a segunda modalidade" };
          const previa = await alterarModalidades.POST(req(body), contexto);
          assert.equal(previa.status, 200, JSON.stringify(await previa.clone().json()));
          const p = await previa.json();
          assert.equal(p.optativasRetiradas, 1);
          const confirmada = await alterarModalidades.PATCH(req({ ...body, versao: p.versao }), contexto);
          assert.equal(confirmada.status, 200, JSON.stringify(await confirmada.clone().json()));
          const vinculos = await prisma.matriculaTurmaAvulsa.findMany({
            where: { matriculaId }, include: { optativas: true }, orderBy: { turmaId: "asc" },
          });
          assert.equal(vinculos[0].status, "A_CURSAR");
          assert.deepEqual(vinculos[0].optativas.map(o => o.sessaoId), [manter.optativa.id]);
          assert.equal(vinculos[1].status, "CANCELADO");
          assert.equal(vinculos[1].optativas.length, 0);
          await prisma.curso.update({ where: { id: manter.turma.cursoId }, data: { valorMensalidade: 400 } });
          const alternativa = await prisma.turma.create({ data: {
            nome: "Turma direta alternativa", instituicaoId, cursoId: manter.turma.cursoId, poloId: polo.id,
            organizacaoCurricular: "ANUAL", etapaNumero: 1, semestre: "1", periodoLetivo: "2027",
            statusTurma: "A_INICIAR", modalidade: "PRESENCIAL", capacidadeMaxima: 1,
          } });
          await prisma.turmaHorarioAvulso.create({ data: {
            instituicaoId, turmaId: alternativa.id, diaSemana: 3, horaInicio: "14:00", horaFim: "16:00",
          } });
          const troca = { ...body, turmaIds: [alternativa.id], motivo: "Família pediu outro horário" };
          const previaTroca = await alterarModalidades.POST(req(troca), contexto);
          assert.equal(previaTroca.status, 200, JSON.stringify(await previaTroca.clone().json()));
          const trocaDados = await previaTroca.json();
          assert.equal(trocaDados.preservarValores, true);
          assert.equal(trocaDados.nova.liquida, 10000);
          const trocaFeita = await alterarModalidades.PATCH(req({ ...troca, versao: trocaDados.versao }), contexto);
          assert.equal(trocaFeita.status, 200, JSON.stringify(await trocaFeita.clone().json()));
          const mesma = await prisma.matriculaTurmaAvulsa.findUniqueOrThrow({ where: { id: vinculos[0].id } });
          assert.equal(mesma.turmaId, alternativa.id);
          assert.equal(mesma.status, "A_CURSAR");
        } finally {
          flags.forEach((chave, i) => {
            if (anteriores[i] === undefined) delete process.env[chave];
            else process.env[chave] = anteriores[i];
          });
        }
      });
    } finally {
      // Apenas dados sintéticos do banco local reservado.
      if (instituicaoId) {
        await prisma.matricula.deleteMany({ where: { instituicaoId } });
        await prisma.turmaSessaoOptativaAvulsa.deleteMany({ where: { instituicaoId } });
        await prisma.sessaoOptativaAvulsa.deleteMany({ where: { instituicaoId } });
        await prisma.instituicao.delete({ where: { id: instituicaoId } });
      }
      if (outraInstituicao)
        await prisma.instituicao.delete({ where: { id: outraInstituicao.id } });
      await prisma.$disconnect();
    }
  });
}
