const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(req,parent,...rest) {
  if(req.startsWith('@/')) req=path.resolve(__dirname,'..',req.slice(2));
  return resolve.call(this,req,parent,...rest);
};
const load=Module._load;
Module._load=function(req,parent,isMain) {
  if(req==='@/lib/contratos/contrato-matricula') return {criarContratoPendenteMatricula:async()=>{}};
  return load.call(this,req,parent,isMain);
};
Module._extensions['.ts']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}
}).outputText,file);
const {calcularContratacaoModalidades:calcular,normalizarPrecosComboPorQuantidade:normalizar}=require('../lib/matriculas/combos.ts');
const {camposComboCurso}=require('../lib/matriculas/campos-combo-curso.ts');
const curso=(id,extra={})=>({id,nome:`Curso ${id}`,participaCombo:true,valorMatricula:'50.00',valorMensalidade:'240.00',valorMensalidadeCombo:null,quantidadeParcelas:12,
  precosComboPorQuantidade:[{quantidadeAtividades:2,valorMensalidade:'110.00'},{quantidadeAtividades:3,valorMensalidade:'100.00'}, {quantidadeAtividades:4,valorMensalidade:'80.00'}, {quantidadeAtividades:5,valorMensalidade:'75.00'}, {quantidadeAtividades:6,valorMensalidade:'75.00'}],...extra});
test('desenho: 2 a 6 atividades aplicam o valor de cada curso e somam as taxas existentes',()=>{
  for(const [q,valor] of [[2,11000],[3,10000],[4,8000],[5,7500],[6,7500]]) {
    const r=calcular(Array.from({length:q},(_,i)=>curso(i+1)),[]);
    assert.equal(r.tipoPreco,'QUANTIDADE');assert.equal(r.comboId,null);
    assert.equal(r.mensalidadeCentavos,q*valor); assert.equal(r.matriculaCentavos,q*5000);
    assert.equal(r.precosPorCurso.length,q); assert.ok(r.precosPorCurso.every(p=>p.quantidadeAtividades===q));
  }
});
test('preços são individuais: robótica 200 e balé 150 resultam em mensalidade 350',()=>{
  const r=calcular([curso(1,{precosComboPorQuantidade:[{quantidadeAtividades:2,valorMensalidade:'200'}]}),curso(2,{precosComboPorQuantidade:[{quantidadeAtividades:2,valorMensalidade:'150'}]})],[]);
  assert.equal(r.mensalidadeCentavos,35000); assert.equal(r.matriculaCentavos,10000);
});
test('um curso, quantidade não cadastrada e curso que não participa usam avulso',()=>{
  assert.equal(calcular([curso(1)],[]).mensalidadeCentavos,24000);
  assert.equal(calcular(Array.from({length:7},(_,i)=>curso(i+1)),[]).tipoPreco,'AVULSO');
  assert.equal(calcular([curso(1),curso(2,{participaCombo:false})],[]).tipoPreco,'AVULSO');
});
test('atividade sem preço para a quantidade recebe valor avulso, sem preço zero implícito',()=>{
  const r=calcular([curso(1),curso(2,{precosComboPorQuantidade:[]})],[]);
  assert.equal(r.mensalidadeCentavos,35000);assert.deepEqual(r.cursoIdsCombo,[1]);assert.deepEqual(r.cursoIdsAvulsos,[2]);
});
test('atividade fora do combo não aumenta a quantidade nem recebe desconto',()=>{
  const r=calcular([curso(1),curso(2),curso(3,{participaCombo:false})],[]);
  assert.equal(r.mensalidadeCentavos,46000);assert.deepEqual(r.cursoIdsAvulsos,[3]);
  assert.deepEqual(r.precosPorCurso.map(p=>p.quantidadeAtividades),[2,2,null]);
});
test('zero explícito, centavos e permutação de cursos são preservados',()=>{
  const cursos=[curso(1,{precosComboPorQuantidade:[{quantidadeAtividades:2,valorMensalidade:'0.00'}]}),curso(2,{precosComboPorQuantidade:[{quantidadeAtividades:2,valorMensalidade:'0.29'}]})];
  const r=calcular(cursos,[]);assert.equal(r.mensalidadeCentavos,29);assert.deepEqual(calcular([...cursos].reverse(),[]),r);
});
test('pacotes existentes mantêm taxa única e concorrem pelo menor total contratual',()=>{
  const pacote={id:10,nome:'Pacote legado',ativo:true,minimoModalidades:2,maximoModalidades:3,modoPreco:'FIXO',valorMatricula:'20.00',valorMensalidade:'210.00',quantidadeParcelas:12,cursoIds:[1,2]};
  const cursos=[curso(1),curso(2)]; assert.equal(calcular(cursos,[pacote]).comboId,10);
  assert.equal(calcular(cursos,[{...pacote,valorMensalidade:'300.00'}]).tipoPreco,'QUANTIDADE');
  const legado=cursos.map(c=>({...c,precosComboPorQuantidade:undefined}));assert.equal(calcular(legado,[pacote]).comboId,10);
});
test('não combina durações incompatíveis nem aceita curso repetido',()=>{
  assert.throws(()=>calcular([curso(1),curso(2,{quantidadeParcelas:6})],[]),e=>e.codigo==='PARCELAS_INCOMPATIVEIS');
  assert.throws(()=>calcular([curso(1),curso(1)],[]),e=>e.codigo==='SELECAO_INVALIDA');
});
test('API de cursos normaliza quantidades e moedas; omissão preserva tabela e [] limpa',()=>{
  assert.deepEqual(camposComboCurso({nome:'Curso'}),{});
  assert.deepEqual(camposComboCurso({precosComboPorQuantidade:[]}),{precosComboPorQuantidade:[]});
  assert.deepEqual(camposComboCurso({precosComboPorQuantidade:[{quantidadeAtividades:'3',valorMensalidade:'100'},{quantidadeAtividades:'2',valorMensalidade:110}]}).precosComboPorQuantidade,[{quantidadeAtividades:2,valorMensalidade:'110.00'},{quantidadeAtividades:3,valorMensalidade:'100.00'}]);
});
test('validação rejeita duplicatas, quantidade fracionária, valores ausentes e moeda inválida',()=>{
  const faixa={quantidadeAtividades:2,valorMensalidade:'100.00'};
  for(const valor of [null,{},[null],[faixa,faixa],...[0,1,101,2.5,true,'','2e0'].map(q=>[{...faixa,quantidadeAtividades:q}]),...[null,'',true,-1,'1.001','1e2'].map(v=>[{...faixa,valorMensalidade:v}])]) assert.throws(()=>normalizar(valor));
});
const {prepararContratacaoModalidades}=require('../lib/matriculas/modalidades-servidor.ts');
function banco(cursos) {
  const chamadas=[];
  return { chamadas,
    aluno:{findFirst:async args=>{chamadas.push(args);return {id:1,instituicaoId:26,nome:'Teste'};}},
    turma:{findMany:async args=>{
      chamadas.push(args); assert.equal(args.where.instituicaoId,26);
      if (args.where.codigo?.startsWith === "OFERTA-") {
        assert.equal(args.select.codigo,true);
        return []; // Fixture sem ofertas compartilhadas.
      }
      assert.equal(args.select.curso.select.precosComboPorQuantidade,true);
      return cursos.map((c,i)=>({id:i+1,nome:`Turma ${i+1}`,cursoId:c.id,poloId:1,periodoLetivo:'2027',etapaNumero:1,organizacaoCurricular:'ANUAL',modalidade:'EAD',dataInicio:null,dataFim:null,capacidadeMaxima:20,polo:{nome:'Sede'},curso:c,
        disciplinas:[{disciplinaId:i+1,dataInicio:null,dataFim:null,disciplina:{nome:`Disciplina ${i+1}`,cargaHoraria:40,semestre:1},horarios:[]}]}));
    }},
    itemMatricula:{findMany:async()=>[]},
    cursoRequisitoConjunto:{findMany:async()=>[]},
    comboModalidades:{findMany:async args=>{assert.equal(args.where.instituicaoId,26);return [];}}
  };
}
test('prévia do servidor lê tabela da instituição e registra preço por curso no snapshot',async()=>{
  const db=banco([curso(1),curso(2)]);
  const r=await prepararContratacaoModalidades(db,26,{alunoId:1,turmaIds:[1,2]});
  assert.equal(r.calculo.mensalidadeCentavos,22000);assert.equal(r.snapshot.calculo.tipoPreco,'QUANTIDADE');
  assert.equal(r.snapshot.calculo.precosPorCurso.length,2);assert.equal(r.snapshot.nome,'Curso 1 + Curso 2');
});
test('alteração de preço entre prévia e confirmação muda versão do cálculo',async()=>{
  const cursos=[curso(1),curso(2)],db=banco(cursos),body={alunoId:1,turmaIds:[1,2]};
  const antes=await prepararContratacaoModalidades(db,26,body);
  cursos[0].precosComboPorQuantidade[0].valorMensalidade='90.00';
  const depois=await prepararContratacaoModalidades(db,26,body);
  assert.notEqual(antes.versao,depois.versao);assert.equal(antes.snapshot.calculo.mensalidadeCentavos,22000);assert.equal(depois.calculo.mensalidadeCentavos,20000);
});
