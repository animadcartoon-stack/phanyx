const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const transpilar = name => ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/matriculas', name), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const load = (name, customRequire) => {
  const exp = {};
  vm.runInNewContext(transpilar(name), { exports: exp, require: customRequire ?? require });
  return exp;
};
const base = load('planos-pagamento.ts');
const regras = load('plano-contratado.ts', p => p === './planos-pagamento' ? base : require(p));
const plano = (n, v, ajustes = [], antecipacao = '98.50') => ({
  id: 'p' + n, nome: n + ' parcelas', quantidadeParcelas: n, valorParcela: v, ajustes,
  valorAntecipacao: antecipacao, precoIncluiPontualidade: true, ativo: true,
});
const config = (...planos) => ({ versao: 1, planos });
for(const [n,v,aj] of [[12,'468.00',[]],[11,'510.55',[{numero:1,valor:'510.50'}]],[10,'561.60',[]],[4,'1404.00',[]],[1,'5616.00',[]]]) {
  test('cronograma personalizado ' + n + 'x preserva anuidade', () => {
    const a = n === 1 ? '0.00' : '98.50';
    const es = regras.selecionarPlanoContratado(config(plano(n,v,aj,a)), 'p' + n);
    const sn = regras.congelarPlanoContratado(es, 37, new Date('2027-01-10T12:00:00Z'));
    assert.equal(sn.totalCentavos,561600);
    assert.equal(sn.parcelasExigiveisCentavos.reduce((s,v)=>s+v,sn.antecipacaoCentavos),561600);
    assert.equal(sn.parcelasCentavos.length,n);
  });
}
test('opt-in: sem plano selecionado nao muda matricula tradicional', () => {
  assert.equal(regras.selecionarPlanoContratado(null,null),null);
  assert.equal(regras.selecionarPlanoContratado(config(plano(12,'468.00')),null),null);
  assert.equal(regras.selecionarPlanoContratado(config(plano(12,'468.00')),''),null);
});
test('id inexistente, inativo, tipo incorreto sao rejeitados', () => {
  const c=config(plano(12,'468.00'),{...plano(10,'561.60'),ativo:false});
  assert.throws(()=>regras.selecionarPlanoContratado(c,'p10'));
  assert.throws(()=>regras.selecionarPlanoContratado(c,'inexistente'));
  assert.throws(()=>regras.selecionarPlanoContratado(c,100));
});
test('servidor impede troca de valores e bolsa acidental', () => {
  const es=regras.selecionarPlanoContratado(config(plano(12,'468.00')),'p12');
  const valid={valorMatricula:'98.50',valorMensalidade:'468.00',quantidadeParcelas:12,bolsaPercentual:0,valorInformadoNoAto:0};
  assert.doesNotThrow(()=>regras.validarValoresRecebidosDoPlano(es,valid));
  for(const bad of [{valorMatricula:99},{valorMensalidade:467},{quantidadeParcelas:11},{bolsaPercentual:10},{valorInformadoNoAto:50}])
    assert.throws(()=>regras.validarValoresRecebidosDoPlano(es,{...valid,...bad}));
});
test('antecipacao nao duplica e primeira parcela diminui exatamente',()=>{
  const es=regras.selecionarPlanoContratado(config(plano(12,'468.00')),'p12');
  const sn=regras.congelarPlanoContratado(es,37,new Date('2027-01-10T12:00:00Z'));
  assert.equal(sn.parcelasExigiveisCentavos[0],36950);
  assert.equal(sn.antecipacaoCentavos,9850);
  assert.equal(sn.parcelasExigiveisCentavos[1],46800);
  assert.equal(sn.precoIncluiPontualidade,true);
});
test('valor antecipado acima da primeira parcela e configuracao invalida bloqueiam',()=>{
  assert.throws(()=>regras.selecionarPlanoContratado(config(plano(12,'60.00',[],'98.50')),'p12'));
});
