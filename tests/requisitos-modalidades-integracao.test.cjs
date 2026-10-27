'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function fixture(){
 const writes=[];let active=[],required=[{instituicaoId:7,cursoId:2,cursoObrigatorioId:1,curso:{nome:'Curso 2'},cursoObrigatorio:{nome:'Curso 1',ativo:true,excluidoEm:null}}];
 const turmas=[1,2].map(id=>({id,cursoId:id,nome:'Turma '+id,poloId:1,periodoLetivo:'2027',etapaNumero:1,organizacaoCurricular:'ANUAL',modalidade:'PRESENCIAL',dataInicio:new Date('2027-01-01'),dataFim:new Date('2027-12-31'),capacidadeMaxima:10,polo:{nome:'Polo'},
 curso:{id,nome:'Curso '+id,participaCombo:true,valorMatricula:98.5,valorMensalidade:139,regrasPrecoDisciplinas:null,descontoMensalidadePercentual:null,valorMensalidadeCombo:125,precosComboPorQuantidade:[],quantidadeParcelas:12,requisitosConjuntos:[]},
 disciplinas:[{disciplinaId:id,dataInicio:null,dataFim:null,disciplina:{nome:'Disciplina '+id,cargaHoraria:20,semestre:null},horarios:[{diaSemana:id,horaInicio:'09:00',horaFim:'10:00'}]}]}));
 const db={
  turma:{findMany:async()=>turmas},itemMatricula:{findMany:async()=>[]},
  aluno:{findFirst:async()=>({id:5,poloId:1,ativo:true,dataNascimento:new Date('2000-01-01')})},
  cursoRequisitoConjunto:{findMany:async({where})=>required.filter(r=>where.cursoId.in.includes(r.cursoId))},
  matricula:{findMany:async()=>active,create:async({data})=>{writes.push(['matricula',data]);return{id:50,numeroMatricula:'PHX-7',valorMatricula:data.valorMatricula,valorMensalidade:data.valorMensalidade}}},
  comboModalidades:{findMany:async()=>[{id:1,nome:'Combo teste',ativo:true,minimoModalidades:2,maximoModalidades:2,modoPreco:'PERCENTUAL',descontoPercentual:10,valorMatricula:98.5,valorMensalidade:null,quantidadeParcelas:12,cursos:[{cursoId:1},{cursoId:2}]}]},
  instituicao:{update:async()=>{writes.push(['contador']);return{proximoNumeroMatricula:2}}},
  lancamentoFinanceiro:{create:async({data})=>writes.push(['taxa',data]),createMany:async({data})=>writes.push(['mensalidades',data])},
  documentoAluno:{create:async()=>writes.push(['documento'])},
 };
 const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,Date,require:n=>{if(n==='node:crypto')return require(n);if(n==='@prisma/client')return{};if(n==='./confirmacao-menor')return{calcularIdade:()=>25,verificarDadosResponsavel:()=>[]};if(n==='@/lib/contratos/contrato-matricula')return{criarContratoPendenteMatricula:async()=>({conteudo:'Contrato'})};if(n.startsWith('.'))return load(path.posix.normalize(path.posix.join(path.posix.dirname(file),n+'.ts')));if(n.startsWith('@/'))return load(n.slice(2)+'.ts');throw Error(n)}});return exports;}
 const server=load('lib/matriculas/modalidades-servidor.ts');
 const body=ids=>({alunoId:5,turmaIds:ids,dataInicioCurso:'2027-03-01'});
 return{server,db,writes,body,setActive:v=>active=v,setRequired:v=>required=v};
}
test('prévia do servidor recusa curso dependente sozinho sem gerar cobrança',async()=>{const f=fixture();await assert.rejects(f.server.prepararContratacaoModalidades(f.db,7,f.body([2])),e=>e.codigo==='CURSO_CONJUNTO_PENDENTE');assert.equal(f.writes.length,0)});
test('prévia conjunta mantém desconto do combo e inclui condições na versão',async()=>{const f=fixture();const p=await f.server.prepararContratacaoModalidades(f.db,7,f.body([2,1]));assert.equal(p.calculo.mensalidadeCentavos,25020);assert.equal(p.calculo.matriculaCentavos,9850);assert.equal(p.snapshot.requisitosCursos.length,1);assert.equal(f.writes.length,0)});
test('confirmação registra os dois cursos e cobra uma única matrícula com 12 mensalidades corretas',async()=>{const f=fixture();const body=f.body([1,2]);const p=await f.server.prepararContratacaoModalidades(f.db,7,body);await f.server.confirmarContratacaoModalidades(f.db,{id:1,nome:'Admin',instituicaoId:7},{...body,versao:p.versao,primeiroVencimento:'2027-03-10',chave:'teste',pedidoHash:'hash'},new Request('http://localhost/test'));const m=f.writes.find(w=>w[0]==='matricula')[1];assert.equal(m.itens.create.length,2);assert.equal(m.valorMensalidade,250.2);assert.equal(f.writes.filter(w=>w[0]==='taxa').length,1);const mensal=f.writes.find(w=>w[0]==='mensalidades')[1];assert.equal(mensal.length,12);assert.ok(mensal.every(p=>p.valorFinal===250.2));});
test('confirmação revalida quando a matrícula obrigatória deixa de estar ativa após a prévia',async()=>{const f=fixture();f.setActive([{id:90,cursoId:1,periodoLetivo:'2027',dataInicioCurso:null,organizacaoCurricular:'ANUAL',turmaPrincipal:null,itens:[],periodosCursoLivre:[]}]);const body=f.body([2]);const p=await f.server.prepararContratacaoModalidades(f.db,7,body);f.setActive([]);await assert.rejects(f.server.confirmarContratacaoModalidades(f.db,{id:1,nome:'Admin',instituicaoId:7},{...body,versao:p.versao},new Request('http://localhost/test')),e=>e.codigo==='CURSO_CONJUNTO_PENDENTE');assert.equal(f.writes.length,0)});
test('exigência alterada após prévia invalida a confirmação e não grava valores',async()=>{const f=fixture();const body=f.body([1,2]);const p=await f.server.prepararContratacaoModalidades(f.db,7,body);f.setRequired([]);await assert.rejects(f.server.confirmarContratacaoModalidades(f.db,{id:1,nome:'Admin',instituicaoId:7},{...body,versao:p.versao},new Request('http://localhost/test')),e=>e.codigo==='DADOS_ALTERADOS');assert.equal(f.writes.length,0)});
