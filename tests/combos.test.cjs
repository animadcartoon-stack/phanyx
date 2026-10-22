const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
function carregar(arquivo) {
  const filename = path.resolve(arquivo);
  const codigo = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const m = new Module(filename, module);
  m.filename = filename;
  m.paths = module.paths;
  m._compile(codigo, filename);
  return m.exports;
}
const {
  centavos,
  idsPositivos,
  calcularContratacaoModalidades: calcular,
  horariosSobrepostos,
  encontrarConflitos,
  horarioValido,
  vencimentoMensal,
  nomeContratacaoModalidades,
} = carregar("lib/matriculas/combos.ts");
const curso = (id, extra = {}) => ({
  id,
  nome: `Curso ${id}`,
  participaCombo: true,
  valorMatricula: "50.00",
  valorMensalidade: "100.00",
  valorMensalidadeCombo: "70.00",
  quantidadeParcelas: 12,
  ...extra,
});
const combo = (extra = {}) => ({
  id: 1,
  nome: "PEVI",
  ativo: true,
  minimoModalidades: 3,
  maximoModalidades: null,
  modoPreco: "FIXO",
  valorMatricula: "90.00",
  valorMensalidade: "239.00",
  quantidadeParcelas: 12,
  cursoIds: [1, 2, 3, 4],
  ...extra,
});
const h = (extra = {}) => ({
  diaSemana: 2,
  horaInicio: "14:00",
  horaFim: "15:00",
  dataInicio: "2027-02-01",
  dataFim: "2027-12-20",
  turmaId: 1,
  disciplinaId: 1,
  turmaNome: "A",
  disciplinaNome: "Balé",
  ...extra,
});
test("preços usam centavos exatos e aceitam isenção explícita", () => {
  assert.equal(centavos("0.10") + centavos("0.20"), 30);
  assert.equal(centavos(0), 0);
  assert.equal(centavos("239.9"), 23990);
});
test("preço ausente, negativo, infinito ou com mais de duas casas não vira zero", () => {
  for (const v of [
    null,
    undefined,
    "",
    false,
    NaN,
    Infinity,
    -1,
    "1.001",
    "1,99",
    "-0",
  ])
    assert.throws(() => centavos(v));
});
test("IDs duplicados ou inválidos não inflacionam o número de modalidades", () => {
  for (const ids of [[1, 1], [1, 0], ["1.2"], [""], [null], [true]])
    assert.throws(() => idsPositivos(ids));
  assert.deepEqual(idsPositivos(["1", 2]), [1, 2]);
});
test("abaixo do mínimo soma matrícula e mensalidades avulsas", () => {
  const r = calcular([curso(1), curso(2)], [combo()]);
  assert.equal(r.comboId, null);
  assert.equal(r.matriculaCentavos, 10000);
  assert.equal(r.mensalidadeCentavos, 20000);
});
test("no mínimo aplica uma matrícula única e mensalidade fechada", () => {
  const r = calcular([curso(1), curso(2), curso(3)], [combo()]);
  assert.equal(r.comboId, 1);
  assert.equal(r.matriculaCentavos, 9000);
  assert.equal(r.mensalidadeCentavos, 23900);
});
test("mais de três exige quatro e o limite máximo é respeitado", () => {
  assert.equal(
    calcular(
      [1, 2, 3].map((id) => curso(id)),
      [combo({ minimoModalidades: 4 })],
    ).comboId,
    null,
  );
  assert.equal(
    calcular(
      [1, 2, 3, 4].map((id) => curso(id)),
      [combo({ minimoModalidades: 4 })],
    ).comboId,
    1,
  );
  assert.equal(
    calcular(
      [1, 2, 3, 4].map((id) => curso(id)),
      [combo({ maximoModalidades: 3 })],
    ).comboId,
    null,
  );
});
test("remoção de modalidade volta aos valores avulsos", () => {
  assert.equal(
    calcular(
      [1, 2, 3].map((id) => curso(id)),
      [combo()],
    ).comboId,
    1,
  );
  assert.equal(
    calcular(
      [1, 2].map((id) => curso(id)),
      [combo()],
    ).comboId,
    null,
  );
});
test("combo por soma usa preço de combo em cada modalidade e matrícula única", () => {
  const r = calcular(
    [1, 2, 3].map((id) => curso(id)),
    [combo({ modoPreco: "SOMA", valorMensalidade: null })],
  );
  assert.equal(r.mensalidadeCentavos, 21000);
  assert.equal(r.matriculaCentavos, 9000);
});
test("curso não participante e pacote inativo não entram no mínimo", () => {
  assert.equal(
    calcular(
      [curso(1), curso(2), curso(3, { participaCombo: false })],
      [combo()],
    ).comboId,
    null,
  );
  assert.equal(
    calcular(
      [1, 2, 3].map((id) => curso(id)),
      [combo({ ativo: false })],
    ).comboId,
    null,
  );
});
test("extras fora do combo entram pelos preços avulsos", () => {
  const r = calcular(
    [1, 2, 3, 8].map((id) => curso(id)),
    [combo()],
  );
  assert.equal(r.matriculaCentavos, 14000);
  assert.equal(r.mensalidadeCentavos, 33900);
  assert.deepEqual(r.cursoIdsAvulsos, [8]);
});
test("preço de soma ausente não oferece desconto inventado", () => {
  assert.equal(
    calcular(
      [curso(1), curso(2), curso(3, { valorMensalidadeCombo: null })],
      [combo({ modoPreco: "SOMA" })],
    ).comboId,
    null,
  );
});
test("múltiplos pacotes escolhem menor total contratual de forma estável", () => {
  const cursos = [1, 2, 3].map((id) => curso(id));
  const regras = [
    combo({ id: 9, valorMensalidade: "200.00", valorMatricula: "1000.00" }),
    combo({ id: 2 }),
  ];
  assert.equal(calcular(cursos, regras).comboId, 2);
  assert.deepEqual(
    calcular(cursos.reverse(), regras.reverse()),
    calcular(cursos, regras),
  );
});
test("curso repetido não conta como modalidade adicional", () => {
  assert.throws(() => calcular([curso(1), curso(1)], [combo()]));
});
test("conflito inclui sobreposição parcial e contenção total", () => {
  assert.equal(
    horariosSobrepostos(h(), h({ horaInicio: "14:30", horaFim: "16:20" })),
    true,
  );
  assert.equal(
    horariosSobrepostos(h(), h({ horaInicio: "13:00", horaFim: "16:00" })),
    true,
  );
});
test("fim de uma aula igual ao início de outra é permitido", () => {
  assert.equal(
    horariosSobrepostos(h(), h({ horaInicio: "15:00", horaFim: "16:00" })),
    false,
  );
});
test("dias diferentes e períodos de datas distintos não conflitam", () => {
  assert.equal(horariosSobrepostos(h(), h({ diaSemana: 4 })), false);
  assert.equal(
    horariosSobrepostos(
      h(),
      h({ dataInicio: "2028-02-01", dataFim: "2028-12-01" }),
    ),
    false,
  );
});
test("intervalo comum sem nenhuma ocorrência do dia da semana não conflita", () => {
  assert.equal(
    horariosSobrepostos(
      h({ dataInicio: "2027-02-03", dataFim: "2027-02-04" }),
      h(),
    ),
    false,
  );
});
test("aula sem horário final e intervalos invertidos são inválidos", () => {
  assert.equal(horarioValido(h({ horaFim: null })), false);
  assert.equal(
    horarioValido(h({ horaInicio: "15:00", horaFim: "14:00" })),
    false,
  );
  assert.equal(horarioValido(h({ diaSemana: 8 })), false);
});
test("verifica todos os encontros obrigatórios de cada turma", () => {
  const novos = [
    h({ turmaId: 2, disciplinaId: 2, diaSemana: 4 }),
    h({ turmaId: 2, disciplinaId: 2, diaSemana: 2 }),
  ];
  assert.equal(encontrarConflitos(novos, [h()]).length, 1);
});
test("consulta compromissos anteriores e ignora registro duplicado do mesmo encontro", () => {
  assert.equal(
    encontrarConflitos([h({ turmaId: 2, disciplinaId: 2 })], [h()]).length,
    1,
  );
  assert.equal(encontrarConflitos([h()], [h()]).length, 0);
});
test("vencimentos no dia 31 permanecem no fim do mês sem pular fevereiro", () => {
  assert.equal(
    vencimentoMensal("2027-01-31", 1).toISOString().slice(0, 10),
    "2027-02-28",
  );
  assert.equal(
    vencimentoMensal("2028-01-31", 1).toISOString().slice(0, 10),
    "2028-02-29",
  );
  assert.equal(
    vencimentoMensal("2027-01-31", 2).toISOString().slice(0, 10),
    "2027-03-31",
  );
});
test("datas inexistentes são rejeitadas", () => {
  for (const d of ["2027-02-30", "2027-13-01", "2027-2-01", "x"])
    assert.throws(() => vencimentoMensal(d, 0));
});
test("nome da contratação só é lido de snapshots reconhecidos", () => {
  assert.equal(nomeContratacaoModalidades({ versao: 1, nome: "PEVI" }), "PEVI");
  assert.equal(nomeContratacaoModalidades({ nome: "x" }), null);
  assert.equal(nomeContratacaoModalidades(null), null);
});
test("todos os idiomas possuem as mesmas chaves de combos", () => {
  const idiomas = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];
  const keys = idiomas.map((l) => {
    const d = JSON.parse(
      fs.readFileSync(`messages/${l}.json`, "utf8"),
    ).EnrollmentCombos;
    return [
      ...Object.keys(d).filter((k) => k !== "errors"),
      ...Object.keys(d.errors).map((k) => `errors.${k}`),
    ].sort();
  });
  for (const k of keys) assert.deepEqual(k, keys[0]);
});
test("avulsos com durações diferentes não geram parcelas extras silenciosamente", () => {
  assert.throws(
    () => calcular([curso(1), curso(2, { quantidadeParcelas: 6 })], []),
    { codigo: "PARCELAS_INCOMPATIVEIS" },
  );
});
test("combo tem duração própria, mas extras precisam ser compatíveis", () => {
  assert.equal(
    calcular(
      [curso(1, { quantidadeParcelas: 6 }), curso(2), curso(3)],
      [combo()],
    ).quantidadeParcelas,
    12,
  );
  assert.throws(
    () =>
      calcular(
        [curso(1), curso(2), curso(3), curso(8, { quantidadeParcelas: 6 })],
        [combo()],
      ),
    { codigo: "PARCELAS_INCOMPATIVEIS" },
  );
});

test("percentual é calculado em centavos sobre a soma avulsa, sem descontar matrícula", () => {
  const r = calcular(
    [curso(1, { valorMensalidade: 139 }), curso(2, { valorMensalidade: 189 })],
    [
      combo({
        modoPreco: "PERCENTUAL",
        descontoPercentual: "5.00",
        minimoModalidades: 2,
        maximoModalidades: 2,
        valorMensalidade: null,
      }),
    ],
  );
  assert.equal(r.mensalidadeCentavos, 31160);
  assert.equal(r.matriculaCentavos, 9000);
  assert.equal(r.descontoPercentual, 5);
});
test("255 combinações seguem as faixas percentuais propostas, sem cadastro automático", () => {
  const precos = [139, 139, 139, 189, 189, 189, 189, 239];
  const regras = [
    combo({
      id: 2,
      modoPreco: "PERCENTUAL",
      descontoPercentual: 5,
      minimoModalidades: 2,
      maximoModalidades: 2,
      cursoIds: [1, 2, 3, 4, 5, 6, 7, 8],
    }),
    combo({
      id: 3,
      modoPreco: "PERCENTUAL",
      descontoPercentual: 10,
      minimoModalidades: 3,
      maximoModalidades: 3,
      cursoIds: [1, 2, 3, 4, 5, 6, 7, 8],
    }),
    combo({
      id: 4,
      modoPreco: "PERCENTUAL",
      descontoPercentual: 15,
      minimoModalidades: 4,
      cursoIds: [1, 2, 3, 4, 5, 6, 7, 8],
    }),
  ];
  for (let mask = 1; mask < 256; mask++) {
    const selecionados = precos.flatMap((p, i) =>
      mask & (1 << i) ? [curso(i + 1, { valorMensalidade: p })] : [],
    );
    const pct =
      selecionados.length === 1
        ? 0
        : selecionados.length === 2
          ? 5
          : selecionados.length === 3
            ? 10
            : 15;
    const total = selecionados.reduce(
      (s, c) => s + 100 * c.valorMensalidade,
      0,
    );
    assert.equal(
      calcular(selecionados, regras).mensalidadeCentavos,
      Math.round((total * (100 - pct)) / 100),
      `combinação ${mask}`,
    );
    assert.equal(calcular(selecionados, []).mensalidadeCentavos, total);
  }
});
test("desconto de 100% permite isenção e percentuais inválidos são recusados", () => {
  const cursos = [curso(1), curso(2), curso(3)];
  assert.equal(
    calcular(cursos, [
      combo({ modoPreco: "PERCENTUAL", descontoPercentual: 100 }),
    ]).mensalidadeCentavos,
    0,
  );
  for (const pct of [-1, 101, "1.001", null])
    assert.throws(() =>
      calcular(cursos, [
        combo({ modoPreco: "PERCENTUAL", descontoPercentual: pct }),
      ]),
    );
});
test("arredondamento percentual ocorre uma vez, depois de somar os valores", () => {
  const r = calcular(
    [
      curso(1, { valorMensalidade: "0.05" }),
      curso(2, { valorMensalidade: "0.05" }),
    ],
    [
      combo({
        modoPreco: "PERCENTUAL",
        descontoPercentual: 10,
        minimoModalidades: 2,
      }),
    ],
  );
  assert.equal(r.mensalidadeCentavos, 9);
});
