const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const file=path.resolve(__dirname,'../lib/matriculas/cursos-livres.ts'),m=new Module(file,module);m.paths=module.paths;
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file);
const r=m.exports,periodo=(tipo,inicio,fim)=>r.validarPeriodoLivre({periodicidade:tipo,dataInicio:inicio,dataFim:fim});
test('semana e mês respeitam limites inclusivos, sem depender de fuso horário',()=>{
 assert.equal(periodo('SEMANAL','2027-03-01','2027-03-07').dataFim.toISOString(),'2027-03-07T00:00:00.000Z');
 assert.equal(periodo('MENSAL','2027-03-01','2027-03-31').periodicidade,'MENSAL');
 for(const p of [['SEMANAL','2027-03-01','2027-03-08'],['MENSAL','2027-03-01','2027-04-01'],['MENSAL','2027-03-02','2027-03-01']])assert.throws(()=>periodo(...p),e=>e.codigo==='PERIODO_INVALIDO');
});
test('datas inválidas e timestamps não viram datas civis por coerção',()=>{
 for(const d of ['2027-02-29','2027-04-31','2027-03-01T00:00:00Z','2027-3-1','',null,true])assert.throws(()=>r.dataCivilLivre(d),e=>e.codigo==='DATA_INVALIDA');
 assert.ok(r.dataCivilLivre('2028-02-29'));
});
test('datas sugeridas atravessam meses, anos e fevereiro sem dias inexistentes',()=>{
 assert.equal(r.fimSugeridoLivre('2027-12-29','SEMANAL'),'2028-01-04');
 assert.equal(r.fimSugeridoLivre('2027-02-01','MENSAL'),'2027-02-28');
 assert.equal(r.fimSugeridoLivre('2028-02-01','MENSAL'),'2028-02-29');
 assert.equal(r.fimSugeridoLivre('2027-01-31','MENSAL'),'2027-02-27');
});
test('preços em centavos e opções opcionais rejeitam valores inválidos',()=>{
 assert.deepEqual(r.camposPrecoCursoLivre({valorSemanal:'150.00',valorMensalidade:480},'LIVRE'),{valorSemanal:150});
 assert.deepEqual(r.camposPrecoCursoLivre({valorMensalidade:480},'LIVRE'),{valorSemanal:null});
 for(const value of [-1,0,NaN,Infinity,'150,00',true,1.001,100000000])assert.throws(()=>r.precoLivre(value),e=>e.codigo==='VALOR_INVALIDO');
 assert.throws(()=>r.camposPrecoCursoLivre({},'LIVRE'),e=>e.codigo==='PRECO_NAO_CONFIGURADO');
 assert.deepEqual(r.camposPrecoCursoLivre({},'ANUAL'),{valorSemanal:null});
});
test('pagamento parcial, cancelamento e status incoerente não liberam período',()=>{
 assert.equal(r.periodoEstaPago({status:'PAGO',valorPago:150,valorFinal:150}),true);
 for(const p of [{status:'PENDENTE',valorPago:150,valorFinal:150},{status:'PARCIAL',valorPago:80,valorFinal:150},{status:'CANCELADO',valorPago:150,valorFinal:150},{status:'PAGO',valorPago:149,valorFinal:150}])assert.equal(r.periodoEstaPago(p),false);
});
test('identificadores não aceitam booleanos, decimais, negativos ou inteiros inseguros',()=>{
 for(const x of [true,{},[],0,-1,1.5,'1abc',Number.MAX_SAFE_INTEGER+1])assert.throws(()=>r.idCursoLivre(x));
 assert.equal(r.idCursoLivre('12'),12);
});
test('interface possui traduções completas nos cinco idiomas',()=>{
 let keys;function all(o,prefix=''){return Object.entries(o).flatMap(([k,v])=>typeof v==='object'?all(v,prefix+k+'.'):[prefix+k]).sort();}
 for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']){const msg=JSON.parse(fs.readFileSync(path.resolve(__dirname,`../messages/${locale}.json`),'utf8'));assert.ok(msg.AcademicStructure.LIVRE);const actual=all(msg.CoursePeriods);if(keys)assert.deepEqual(actual,keys);else keys=actual;}
});
const helperFile=path.resolve(__dirname,'../lib/matriculas/cursos-livres-chamada.ts');const helperModule=new Module(helperFile,module);helperModule.paths=module.paths;helperModule.require=req=>req==='@/lib/matriculas/cursos-livres'?r:require(req);helperModule._compile(ts.transpileModule(fs.readFileSync(helperFile,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,helperFile);
const chamada=helperModule.exports.situacaoPeriodosNaChamada;
test('chamada regular não ganha consulta financeira adicional nem indicação de pendência',async()=>{
 const map=await chamada({},12,new Date('2027-03-01'),[{alunoId:4,matriculaId:9,organizacaoCurricular:'ANUAL'}]);assert.equal(map.size,0);
});
test('chamada paga por data distingue períodos pendentes, ausentes e múltiplos vínculos',async()=>{
 const dia=new Date('2027-03-01');const db={periodoCursoLivre:{findMany:async({where})=>{assert.equal(where.instituicaoId,12);assert.equal(where.dataInicio.lte,dia);assert.equal(where.dataFim.gte,dia);assert.deepEqual(where.matriculaId.in,[9,10,11]);return [{matriculaId:9,lancamento:{status:'PARCIAL',valorPago:50,valorFinal:150}},{matriculaId:10,lancamento:{status:'PAGO',valorPago:150,valorFinal:150}}];}}};
 const map=await chamada(db,12,dia,[{alunoId:4,matriculaId:9,organizacaoCurricular:'LIVRE'},{alunoId:4,matriculaId:10,organizacaoCurricular:'LIVRE'},{alunoId:5,matriculaId:11,organizacaoCurricular:'LIVRE'}]);assert.equal(map.get(4),'PAGO');assert.equal(map.get(5),'SEM_PERIODO');
});
test('migração assistida recusa outras alterações pendentes e histórico incompleto',()=>{
 const h=require('../scripts/aplicar-migracao-curso-livre.cjs'),os=require('node:os'),crypto=require('node:crypto');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'test-livre-migrations-'));const nomes=['20260101000000_base',...h.TARGETS];
 try {for(const name of nomes){fs.mkdirSync(path.join(dir,name));fs.writeFileSync(path.join(dir,name,'migration.sql'),'-- teste\n');}const applied=name=>({migration_name:name,finished_at:new Date(),rolled_back_at:null,checksum:crypto.createHash('sha256').update('-- teste\n').digest('hex')});
 assert.deepEqual(h.analisarMigracoes([applied(nomes[0])],dir),h.TARGETS);assert.throws(()=>h.analisarMigracoes([],dir),/outras migrações/);assert.throws(()=>h.analisarMigracoes([{migration_name:'falhou',finished_at:null,rolled_back_at:null}],dir),/incompleta/);assert.deepEqual(h.analisarMigracoes(nomes.map(applied),dir),[]);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
