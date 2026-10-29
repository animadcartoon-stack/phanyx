// Optativo. Executa rotas e helpers reais com gravação somente na branch descartável
// teste-avulsos-20261029 (br-little-river-aco0aqq9). Nunca aceita a produção.
// PHANYX_AVULSOS_TEST_DATABASE_URL deve conter a conexão desta branch.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { randomUUID } = require('node:crypto');
const ts = require('typescript');
const connection = process.env.PHANYX_AVULSOS_TEST_DATABASE_URL;
if (!connection) {
  test('fluxo integrado sem grade em Neon isolado', { skip: 'Defina PHANYX_AVULSOS_TEST_DATABASE_URL.' }, () => {});
} else {
  const hostPermitido = 'ep-lingering-feather-acp27t8k-pooler.sa-east-1.aws.neon.tech';
  assert.equal(new URL(connection).hostname, hostPermitido, 'Somente a branch de testes explicitamente reservada');
  assert.equal(new URL(connection).pathname, '/neondb');
  process.env.DATABASE_URL = connection;
  process.env.DIRECT_URL = connection;
  // O transporte HTTPS opcional do executor é inicializado antes deste arquivo.
  // Em um ambiente com PostgreSQL TCP acessível, usa o Prisma normal do projeto.
  let usuario = null;
  const root = path.resolve(__dirname, '..');
  const resolver = Module._resolveFilename;
  Module._resolveFilename = function(request, parent, ...rest) {
    if (request.startsWith('@/')) request = path.join(root, request.slice(2));
    return resolver.call(this, request, parent, ...rest);
  };
  const loader = Module._load;
  Module._load = function(request, parent, isMain) {
    if (request === '@/lib/server-auth') return {
      getUserFromToken: async () => usuario,
      isAdminLike: role => ['ADMIN', 'SUPER_ADMIN'].includes(role),
    };
    if (request === 'next-intl/server') return {
      getTranslations: async ({ locale = 'pt-BR', namespace }) => require('use-intl/core').createTranslator({
        locale, namespace, messages: JSON.parse(fs.readFileSync(path.join(root, `messages/${locale}.json`), 'utf8')),
      }),
    };
    return loader.call(this, request, parent, isMain);
  };
  Module._extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  const { prisma: db } = require('../lib/prisma.ts');
  const turmasApi = require('../app/api/admin/turmas/avulsas/route.ts');
  const matriculasApi = require('../app/api/admin/matriculas/modalidades/route.ts');
  const { prepararConfiguracaoCursoAvulso } = require('../lib/academico/configurar-curso-avulso-sem-grade.ts');
  const { carregarOfertasModalidades } = require('../lib/matriculas/modalidades-servidor.ts');
  const { carregarPainelTurmas } = require('../lib/academico/painel-turmas.ts');
  const chamada = require('../lib/professor-chamada-turma-avulsa.ts');
  const requisicao = body => new Request('http://localhost/api/teste-avulsos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  async function resposta(promise, status) {
    const res = await promise, body = await res.json();
    assert.equal(res.status, status, JSON.stringify(body));
    return body;
  }
  const fetchOriginal = global.fetch;
  global.fetch = async () => { throw Error('Efeito HTTP externo proibido no teste'); };
  test('turma, matrícula, financeiro, contrato e chamada sem disciplina fictícia', { timeout: 300000 }, async t => {
    const flags = ['PHANYX_AVULSOS_INSTITUICOES_HABILITADAS', 'PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA', 'PHANYX_MATRICULA_SEM_GRADE_HABILITADA'];
    const anteriores = Object.fromEntries(flags.map(k => [k, process.env[k]]));
    const unique = randomUUID();
    let instituicao;
    try {
      await t.test('API exige administrador autenticado', async () => {
        await resposta(turmasApi.GET(), 403);
      });
      instituicao = await db.instituicao.create({ data: { nome: 'TESTE AVULSOS SEM GRADE', slug: `teste-avulsos-${unique}`, updatedAt: new Date(), isentaPagamento: true } });
      const instituicaoId = instituicao.id;
      const criarUser = (nome, role) => db.user.create({ data: { nome, email: `${nome}-${unique}@example.invalid`, senha: 'sem-login', role, instituicaoId } });
      const admin = await criarUser('Admin', 'ADMIN');
      usuario = { id: admin.id, nome: admin.nome, role: 'ADMIN', instituicaoId };
      const professorUser = await criarUser('Professor', 'PROFESSOR');
      const professor = await db.professor.create({ data: { nome: 'Professor fictício', userId: professorUser.id, instituicaoId } });
      const alunos = [];
      for (let n = 0; n < 8; n++) {
        const user = await criarUser(`Aluno${n}`, 'ALUNO');
        alunos.push(await db.aluno.create({ data: { nome: user.nome, userId: user.id, instituicaoId, dataNascimento: new Date('2000-01-01') } }));
      }
      const cursos = [], turmas = [];
      process.env.PHANYX_ATIVACAO_TURMAS_AVULSAS_HABILITADA = 'true';
      process.env.PHANYX_MATRICULA_SEM_GRADE_HABILITADA = 'true';
      process.env.PHANYX_AVULSOS_INSTITUICOES_HABILITADAS = String(instituicaoId);
      await t.test('curso limpo pode optar por matrícula direta e turma é criada inativa', async () => {
        for (const [i, nome] of ['Robótica 2027', 'Balé 2027', 'Jiu-Jitsu 2027'].entries()) {
          const curso = await db.curso.create({ data: { nome, instituicaoId, organizacaoCurricular: 'ANUAL', valorMatricula: 98.5,
            valorMensalidade: [239, 139, 150][i], quantidadeParcelas: 12, permiteCursosAdicionais: true, disponivelComoAdicional: true, participaCombo: true } });
          cursos.push(curso);
          await db.$transaction(async tx => {
            const modo = await prepararConfiguracaoCursoAvulso(tx, { instituicaoId, cursoId: curso.id, atual: false, destino: true,
              organizacaoCurricular: 'ANUAL', regrasPrecoDisciplinas: null, regrasSelecaoDisciplinas: null, cursoRecebidoDaRede: false });
            await tx.curso.update({ where: { id: curso.id }, data: modo });
          });
          const body = await resposta(turmasApi.POST(requisicao({ acao: 'CRIAR_TURMA', cursoId: curso.id, nome: `Turma ${nome}`, periodoLetivo: '2027', turno: 'MATUTINO', professorId: professor.id,
            capacidadeMaxima: 10, horarios: [{ diaSemana: i + 1, horaInicio: '08:00', horaFim: '09:50' }] })), 201);
          assert.equal(body.turma.ativa, false);
          turmas.push(body.turma);
        }
        assert.equal(await db.turmaHorarioAvulso.count({ where: { instituicaoId } }), 3);
        assert.equal(await db.disciplina.count({ where: { instituicaoId } }), 0);
        assert.equal(await db.turmaDisciplina.count({ where: { instituicaoId } }), 0);
      });
      await t.test('lista institucional restringe ativação, e horários reais chegam ao validador', async () => {
        process.env.PHANYX_AVULSOS_INSTITUICOES_HABILITADAS = String(instituicaoId + 10000);
        assert.equal((await resposta(turmasApi.GET(), 200)).ativacaoHabilitada, false);
        await resposta(turmasApi.PATCH(requisicao({ acao: 'ATIVAR_TURMA', turmaId: turmas[0].id })), 409);
        process.env.PHANYX_AVULSOS_INSTITUICOES_HABILITADAS = String(instituicaoId);
        for (const turma of turmas) await resposta(turmasApi.PATCH(requisicao({ acao: 'ATIVAR_TURMA', turmaId: turma.id })), 200);
        assert.equal((await carregarOfertasModalidades(db, instituicaoId)).filter(o => !o.horariosPendentes).length, 3);
      });
      const combo = await db.comboModalidades.create({ data: { instituicaoId, nome: 'Casadinho de teste', minimoModalidades: 2, maximoModalidades: 3,
        modoPreco: 'PERCENTUAL', descontoPercentual: 10, valorMatricula: 98.5, quantidadeParcelas: 12,
        cursos: { create: cursos.map(c => ({ cursoId: c.id })) } } });
      const base = (aluno, ids) => ({ alunoId: aluno.id, cursoPrincipalId: cursos[0].id, turmaIds: ids,
        dataInicioCurso: '2027-02-01', primeiroVencimento: '2027-02-05', status: 'A_INICIAR' });
      async function previa(body) { return resposta(matriculasApi.POST(requisicao({ ...body, acao: 'PREVIA' })), 200); }
      async function confirmar(body, p, extra = {}) {
        return resposta(matriculasApi.POST(requisicao({ ...body, acao: 'CONFIRMAR', versao: p.versao, chave: randomUUID(), ...extra })), 201);
      }
      let individual;
      await t.test('um curso sozinho mantém preço integral e gera um contrato mais 13 lançamentos', async () => {
        const body = base(alunos[0], [turmas[0].id]), p = await previa(body);
        assert.equal(p.calculo.matriculaCentavos, 9850); assert.equal(p.calculo.mensalidadeCentavos, 23900);
        const chave = randomUUID();
        individual = (await confirmar(body, p, { chave })).matricula;
        assert.equal((await confirmar(body, p, { chave })).matricula.id, individual.id, 'Repetição idempotente preserva matrícula');
        assert.equal(await db.matriculaTurmaAvulsa.count({ where: { matriculaId: individual.id } }), 1);
        assert.equal(await db.itemMatricula.count({ where: { matriculaId: individual.id } }), 0);
        const contrato = await db.contrato.findFirst({ where: { matriculaId: individual.id } });
        assert.match(contrato.conteudo, /Robótica 2027/); assert.match(contrato.conteudo, /08:00/);
        assert.equal(await db.documentoAluno.count({ where: { matriculaId: individual.id, tipo: 'CONTRATO' } }), 1);
        assert.equal(await db.lancamentoFinanceiro.count({ where: { matriculaId: individual.id } }), 13);
      });
      await t.test('dois e três cursos usam desconto e taxa única do combo cadastrado', async () => {
        for (const n of [2, 3]) {
          const body = base(alunos[n - 1], turmas.slice(0, n).map(t => t.id)), p = await previa(body);
          assert.equal(p.calculo.comboId, combo.id); assert.equal(p.calculo.matriculaCentavos, 9850);
          assert.equal(p.calculo.mensalidadeCentavos, n === 2 ? 34020 : 47520);
          const { matricula } = await confirmar(body, p);
          assert.equal(await db.matriculaTurmaAvulsa.count({ where: { matriculaId: matricula.id } }), n);
          const taxas = await db.lancamentoFinanceiro.findMany({ where: { matriculaId: matricula.id, tipo: 'MATRICULA' } });
          assert.equal(taxas.length, 1); assert.equal(Number(taxas[0].valorFinal), 98.5);
          assert.equal(await db.lancamentoFinanceiro.count({ where: { matriculaId: matricula.id, tipo: 'MENSALIDADE' } }), 12);
        }
      });
      await t.test('ajuste autorizado, bolsa e justificativa são auditados no snapshot e lançamentos', async () => {
        const body = base(alunos[3], [turmas[0].id]), p = await previa(body);
        const { matricula } = await confirmar(body, p, { bolsaPercentual: 50,
          ajuste: { motivo: 'Bolsa de teste autorizada', valorMatricula: 0, valorMensalidade: 200, quantidadeParcelas: 6 } });
        const salvo = await db.matricula.findUnique({ where: { id: matricula.id } });
        assert.equal(salvo.contratacaoModalidades.ajuste.motivo, 'Bolsa de teste autorizada');
        assert.equal(salvo.contratacaoModalidades.ajuste.usuarioId, admin.id);
        const lancamentos = await db.lancamentoFinanceiro.findMany({ where: { matriculaId: matricula.id } });
        assert.equal(lancamentos.length, 6); assert.ok(lancamentos.every(l => Number(l.valorFinal) === 100));
      });
      await t.test('duplicidade e conflito de horário não geram matrícula nem cobrança', async () => {
        const duplicada = await resposta(matriculasApi.POST(requisicao({ ...base(alunos[0], [turmas[0].id]), acao: 'PREVIA' })), 409);
        assert.equal(duplicada.codigo, 'ALUNO_JA_MATRICULADO');
        const extras = await resposta(turmasApi.POST(requisicao({ acao: 'CRIAR_TURMA', cursoId: cursos[1].id, nome: 'Balé em conflito', periodoLetivo: '2027', turno: 'MATUTINO', professorId: professor.id,
          capacidadeMaxima: 10, horarios: [{ diaSemana: 1, horaInicio: '09:00', horaFim: '10:00' }] })), 201);
        await resposta(turmasApi.PATCH(requisicao({ acao: 'ATIVAR_TURMA', turmaId: extras.turma.id })), 200);
        const conflito = await resposta(matriculasApi.POST(requisicao({ ...base(alunos[4], [turmas[0].id, extras.turma.id]), acao: 'PREVIA' })), 409);
        assert.equal(conflito.codigo, 'CONFLITO_HORARIO');
        assert.equal(await db.matricula.count({ where: { alunoId: alunos[4].id } }), 0);
      });
      await t.test('professor salva frequência sem disciplina, com auditoria e proteção institucional', async () => {
        const user = { id: professorUser.id, instituicaoId, role: 'PROFESSOR' };
        const contexto = await chamada.autorizarChamadaTurmaAvulsa(user, turmas[0].id);
        const lista = await chamada.carregarChamadaTurmaAvulsa(contexto, '2027-02-01', '08:00');
        assert.equal(lista.alunos.length, 4);
        const resultado = await chamada.salvarChamadaTurmaAvulsa(contexto, { data: '2027-02-01', hora: '08:00', presencas: lista.alunos.map(a => ({ alunoId: a.alunoId, status: 'PRESENTE' })) },
          { usuarioId: professorUser.id, impersonacaoId: null, ip: null, userAgent: 'teste-integrado' });
        assert.equal((await db.aula.findUnique({ where: { id: resultado.aulaId } })).disciplinaId, null);
        assert.equal(await db.historicoPresencaAula.count({ where: { instituicaoId } }), 4);
        await assert.rejects(chamada.autorizarChamadaTurmaAvulsa({ ...user, instituicaoId: instituicaoId + 10000 }, turmas[0].id));
      });
      await t.test('painel contabiliza vínculos diretos; trancamento/cancelamento liberam vaga sem apagar histórico', async () => {
        const painel = await carregarPainelTurmas(db, instituicaoId, true);
        assert.equal(painel.turmas.find(t => t.id === turmas[0].id).matriculados, 4);
        await db.matricula.update({ where: { id: individual.id }, data: { status: 'TRANCADA' } });
        assert.equal((await carregarOfertasModalidades(db, instituicaoId)).find(o => o.id === turmas[0].id).vagas, 7);
        await db.matricula.update({ where: { id: individual.id }, data: { status: 'CANCELADA', canceladaEm: new Date() } });
        assert.equal(await db.matriculaTurmaAvulsa.count({ where: { matriculaId: individual.id } }), 1);
        assert.equal((await carregarPainelTurmas(db, instituicaoId, true)).turmas.find(t => t.id === turmas[0].id).matriculados, 3);
      });
      await t.test('disputa concorrente pela última vaga confirma somente um aluno', async () => {
        const criada = await resposta(turmasApi.POST(requisicao({ acao: 'CRIAR_TURMA', cursoId: cursos[2].id, nome: 'Última vaga de teste', periodoLetivo: '2027', turno: 'VESPERTINO', professorId: professor.id,
          capacidadeMaxima: 1, horarios: [{ diaSemana: 5, horaInicio: '16:00', horaFim: '17:00' }] })), 201);
        await resposta(turmasApi.PATCH(requisicao({ acao: 'ATIVAR_TURMA', turmaId: criada.turma.id })), 200);
        const pedidos = [];
        for (const aluno of alunos.slice(6, 8)) {
          const body = { ...base(aluno, [criada.turma.id]), cursoPrincipalId: cursos[2].id };
          const p = await previa(body);
          pedidos.push({ ...body, acao: 'CONFIRMAR', versao: p.versao, chave: randomUUID() });
        }
        const respostas = await Promise.all(pedidos.map(body => matriculasApi.POST(requisicao(body))));
        assert.deepEqual(respostas.map(r => r.status).sort(), [201, 409]);
        assert.equal(await db.matriculaTurmaAvulsa.count({ where: { turmaId: criada.turma.id } }), 1);
      });
      await t.test('curso com grade antiga permanece intacto e não é convertido silenciosamente', async () => {
        const legado = await db.curso.create({ data: { nome: 'Balé legado preservado', instituicaoId, organizacaoCurricular: 'ANUAL' } });
        await db.disciplina.create({ data: { nome: 'Disciplina histórica', cursoId: legado.id, instituicaoId, cargaHoraria: 30 } });
        await assert.rejects(db.$transaction(tx => prepararConfiguracaoCursoAvulso(tx, { instituicaoId, cursoId: legado.id, atual: false, destino: true,
          organizacaoCurricular: 'ANUAL', regrasPrecoDisciplinas: null, regrasSelecaoDisciplinas: null, cursoRecebidoDaRede: false })), e => e.codigo === 'CURSO_COM_GRADE_OU_HISTORICO');
        assert.equal(await db.disciplina.count({ where: { cursoId: legado.id } }), 1);
        assert.equal((await db.curso.findUnique({ where: { id: legado.id } })).matriculaDiretaTurma, false);
      });
      await t.test('confirmação bloqueada fora do piloto não grava dados', async () => {
        const body = base(alunos[5], [turmas[0].id]), p = await previa(body);
        delete process.env.PHANYX_AVULSOS_INSTITUICOES_HABILITADAS;
        await resposta(matriculasApi.POST(requisicao({ ...body, acao: 'CONFIRMAR', versao: p.versao, chave: randomUUID() })), 409);
        assert.equal(await db.matricula.count({ where: { alunoId: alunos[5].id } }), 0);
      });
      console.log(`Fixtures fictícias preservadas para revisão: instituição ${instituicao.id}, branch br-little-river-aco0aqq9.`);
    } finally {
      for (const k of flags) if (anteriores[k] === undefined) delete process.env[k]; else process.env[k] = anteriores[k];
      global.fetch = fetchOriginal;
      await db.$disconnect();
    }
  });
}
