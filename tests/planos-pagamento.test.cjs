const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const arquivo = path.resolve(__dirname, '../lib/matriculas/planos-pagamento.ts');
const js = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const exportsMod = {};
vm.runInNewContext(js, { exports: exportsMod, require }, { filename: arquivo });
const {normalizarPlanosPagamento, cotarPlanoPagamento, dinheiroEmCentavos} = exportsMod;
const plano = (quantidadeParcelas, valorParcela, ajustes = [], valorAntecipacao = '98.50') => ({
  id: 'plano_' + quantidadeParcelas, nome: quantidadeParcelas + ' parcelas', quantidadeParcelas,
  valorParcela, ajustes, valorAntecipacao, precoIncluiPontualidade: true, ativo: true,
});
const normalizar = (...planos) => normalizarPlanosPagamento({ versao: 1, planos });

test('10x individual: crédito de R$98,50 somente na primeira parcela', () => {
  const p = cotarPlanoPagamento(normalizar(plano(10, '561.60')).planos[0]);
  assert.equal(p.totalCentavos, 561600);
  assert.equal(p.antecipacaoCentavos, 9850);
  assert.equal(p.restantePrimeiraParcelaCentavos, 46310);
  assert.equal(p.parcelasCentavos.reduce((a,b)=>a+b,0), p.totalCentavos);
});
test('11x individual: ajuste na primeira parcela reproduz a tabela', () => {
  const p = cotarPlanoPagamento(normalizar(plano(11,'510.55',[{numero:1,valor:'510.50'}])).planos[0]);
  assert.equal(p.totalCentavos, 561600);
  assert.equal(p.restantePrimeiraParcelaCentavos, 41200);
});
test('12x individual: mantém anuidade e não soma antecipação', () => {
  const p = cotarPlanoPagamento(normalizar(plano(12, '468.00')).planos[0]);
  assert.equal(p.totalCentavos,561600);
  assert.equal(p.restantePrimeiraParcelaCentavos,36950);
});
test('à vista e quatro parcelas são opções válidas', () => {
  assert.equal(cotarPlanoPagamento(normalizar(plano(1,'5616.00',[],'0.00')).planos[0]).totalCentavos,561600);
  assert.equal(cotarPlanoPagamento(normalizar(plano(4,'1404.00',[],'0.00')).planos[0]).totalCentavos,561600);
});
test('não infere alteração na tabela conjunta de 11 parcelas', () => {
  const p = cotarPlanoPagamento(normalizar(plano(11,'918.88',[{numero:1,valor:'919.00'}])).planos[0]);
  assert.equal(p.totalCentavos, 1010780); // divergência de R$1,00 é mostrada, não corrigida sem autorização
});
test('rejeita números, centavos e configurações perigosas', () => {
  for(const d of ['10.001','-1','1e3','', 'NaN']) assert.throws(()=>dinheiroEmCentavos(d));
  assert.throws(()=>normalizar(plano(0,'100.00')));
  assert.throws(()=>normalizar(plano(121,'100.00')));
  assert.throws(()=>normalizar(plano(12,'100.00',[{numero:1,valor:'90.00'},{numero:1,valor:'100.00'}])));
  assert.throws(()=>normalizar(plano(12,'80.00',[],'98.50')));
  assert.throws(()=>normalizar(plano(10,'0.00')));
});
test('não altera configuração legada quando recurso está desativado', () => {
  assert.equal(normalizarPlanosPagamento(null), null);
  assert.equal(normalizarPlanosPagamento({versao:1,planos:[]}), null);
  assert.equal(normalizar(plano(12,'468.00')).planos[0].precoIncluiPontualidade,true);
});
