"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ler = (p) => fs.readFileSync(p, "utf8");

test("funcionario: instituicaoId obrigatorio e poloId nullable no esquema", () => {
  const schema = ler("prisma/schema.prisma");
  assert.match(schema, /model Funcionario \{/);
  assert.match(schema, /poloId\s+Int\?/);
  assert.match(schema, /instituicaoId\s+Int/);
});
test("funcionario: tela nao obriga polo sem polos ativos e envia null", () => {
  const ui = ler("app/admin/funcionarios/page.tsx");
  assert.match(ui, /existePoloDisponivel && !poloId/);
  assert.match(ui, /required=\{!editandoId && existePoloDisponivel\}/);
  assert.match(ui, /poloId: poloId \? Number\(poloId\) : null/);
  assert.match(ui, /polos\.length > 0 \|\| Boolean\(editandoId\)/);
});
test("funcionario: servidor exige polo apenas se houver opcoes ativas visiveis", () => {
  const api = ler("app/api/funcionario/route.ts");
  assert.match(api, /filtroPolosVisiveis\(contextoPolos\)/);
  assert.match(api, /quantidadePolosAtivos > 0/);
  assert.match(api, /if \(poloId && !poloSelecionado\)/);
  assert.match(api, /poloId,\s+statusFuncionario/);
});
test("historico de lotacao so existe quando ha um polo selecionado", () => {
  const api = ler("app/api/funcionario/route.ts");
  assert.match(api, /if \(poloSelecionado\) \{[\s\S]*?tx\.funcionarioLotacaoRH\.create/);
});
test("lista limitada de polos acessivel sem permissao de GERENCIAR, com escopo", () => {
  const opcoes = ler("app/api/admin/polos/opcoes/route.ts");
  const gestao = ler("app/api/admin/polos/route.ts");
  assert.match(opcoes, /filtroPolosVisiveis\(contexto\)/);
  assert.match(opcoes, /isAdminLike\(user\.role\)/);
  assert.doesNotMatch(opcoes, /cnpj: true/);
  assert.match(gestao, /if \(!contexto\.podeGerenciarPolos\)/);
  for (const pagina of ["funcionarios", "professores", "alunos", "alunos/novo"]) {
    assert.match(ler("app/admin/" + pagina + "/page.tsx"), /fetch\("\/api\/admin\/polos\/opcoes"/);
  }
});
test("matriculas administrativas e padrao aceitam instituicoes sem polo ativo", () => {
  for (const p of ["app/api/admin/matriculas/route.ts", "app/api/matricula/route.ts"]) {
    const api = ler(p);
    assert.match(api, /quantidadePolosAtivos > 0/);
  }
});
