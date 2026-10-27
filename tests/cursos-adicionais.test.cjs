'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x));
function carregar(file,imports={}){
 const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,Date,Intl,URL,URLSearchParams,console,require:n=>{
  if(n in imports)return imports[n];if(n==='node:crypto')return require(n);if(n==='@prisma/client')return {};
  if(n==='next/server')return {NextResponse:{json:(data,opts)=>new Response(JSON.stringify(data),opts)}};
  if(n==='./confirmacao-menor')return {calcularIdade:()=>25,verificarDadosResponsavel:()=>[]};
  if(n==='@/lib/contratos/contrato-matricula')return {criarContratoPendenteMatricula:async()=>({conteudo:'Contrato'})};
  if(n.startsWith('.'))return load(path.posix.normalize(path.posix.join(path.posix.dirname(file),n+'.ts')));
  if(n.startsWith('@/'))return load(n.slice(2)+'.ts');throw Error(n);
 }});return exports;}return load(file);
}
function fixture(){
 const writes=[];
 const turmas=[{id:50,cursoId:25,nome:'Inglês',valor:188.98,permite:true,adicional:false,dia:1},{id:10,cursoId:20,nome:'Robótica',valor:239,permite:false,adicional:true,dia:2}].map(o=>({
  id:o.id,cursoId:o.cursoId,nome:'Turma '+o.nome,poloId:1,periodoLetivo:'2027',etapaNumero:1,organizacaoCurricular:'ANUAL',modalidade:'PRESENCIAL',dataInicio:new Date('2027-01-01'),dataFim:new Date('2027-12-31'),capacidadeMaxima:10,polo:{nome:'Polo'},
  curso:{id:o.cursoId,nome:o.nome,participaCombo:true,permiteCursosAdicionais:o.permite,disponivelComoAdicional:o.adicional,valorMatricula:98.5,valorMensalidade:o.valor,regrasPrecoDisciplinas:null,regrasSelecaoDisciplinas:null,descontoMensalidadePercentual:null,valorMensalidadeCombo:null,precosComboPorQuantidade:[],quantidadeParcelas:12,requisitosConjuntos:[]},
  disciplinas:[{disciplinaId:o.cursoId,dataInicio:null,dataFim:null,disciplina:{nome:o.nome,cargaHoraria:20,semestre:null},horarios:[{diaSemana:o.dia,horaInicio:'09:00',horaFim:'10:00'}]}]
 }));
 const db={turma:{findMany:async()=>turmas},itemMatricula:{findMany:async()=>[]},turmaDisciplina:{findMany:async()=>[]},aluno:{findFirst:async()=>({id:5,poloId:1,ativo:true,dataNascimento:new Date('2000-01-01')})},cursoRequisitoConjunto:{findMany:async()=>[]},matricula:{findMany:async()=>[],create:async({data})=>{writes.push(['matricula',data]);return{id:77,numeroMatricula:'PHX-7',valorMatricula:data.valorMatricula,valorMensalidade:data.valorMensalidade}}},comboModalidades:{findMany:async()=>[{id:1,nome:'Dois cursos',ativo:true,minimoModalidades:2,maximoModalidades:2,modoPreco:'PERCENTUAL',descontoPercentual:10,valorMatricula:98.5,valorMensalidade:null,quantidadeParcelas:12,cursos:[{cursoId:20},{cursoId:25}]}]},instituicao:{update:async()=>{writes.push(['contador']);return {proximoNumeroMatricula:2}}},lancamentoFinanceiro:{create:async({data})=>writes.push(['taxa',data]),createMany:async({data})=>writes.push(['mensalidades',data])},documentoAluno:{create:async()=>writes.push(['documento'])}};
 return {db,writes,turmas,server:carregar('lib/matriculas/modalidades-servidor.ts'),body:{alunoId:5,cursoPrincipalId:25,turmaIds:[10,50],dataInicioCurso:'2027-03-01'}};
}
test('marcações são independentes, opcionais e não aceitam strings ou modos incompatíveis',()=>{
 const m=carregar('lib/matriculas/cursos-adicionais.ts');assert.deepEqual(plain(m.camposCursosAdicionais({})),{});
 assert.deepEqual(plain(m.camposCursosAdicionais({permiteCursosAdicionais:true,disponivelComoAdicional:false})),{permiteCursosAdicionais:true,disponivelComoAdicional:false});
 assert.throws(()=>m.camposCursosAdicionais({permiteCursosAdicionais:'false'}),e=>e.codigo==='ADICIONAIS_CONFIGURACAO_INVALIDA');
 for(const modo of [{organizacaoCurricular:'LIVRE'},{regrasPrecoDisciplinas:{versao:1}},{regrasSelecaoDisciplinas:{versao:1}}])assert.throws(()=>m.camposCursosAdicionais({permiteCursosAdicionais:true,...modo}),e=>e.codigo==='ADICIONAIS_MODO_INCOMPATIVEL');
 assert.throws(()=>m.camposCursosAdicionais({regrasPrecoDisciplinas:{}},{permiteCursosAdicionais:true}));
 const selecao=carregar('lib/matriculas/selecao-disciplinas.ts');
 for(const flag of ['permiteCursosAdicionais','disponivelComoAdicional'])assert.throws(()=>selecao.validarModoSelecao({[flag]:true}),e=>e.codigo==='SELECAO_EXIGE_PRECO_FIXO');
});
test('soma preços diferentes e aplica 10% apenas pelo combo configurado; prévia não grava',async()=>{
 const f=fixture(),p=await f.server.prepararContratacaoModalidades(f.db,7,f.body);
 assert.equal(p.calculo.mensalidadeCentavos,38518);assert.equal(p.calculo.matriculaCentavos,9850);assert.equal(p.snapshot.cursoPrincipalId,25);assert.equal(f.writes.length,0);
 const semDesconto=fixture();semDesconto.db.comboModalidades.findMany=async()=>[];
 assert.equal((await semDesconto.server.prepararContratacaoModalidades(semDesconto.db,7,semDesconto.body)).calculo.mensalidadeCentavos,42798);
});
test('curso principal sozinho continua válido e não ativa combo de duas modalidades',async()=>{
  const f=fixture();f.body.turmaIds=[50];
  const p=await f.server.prepararContratacaoModalidades(f.db,7,f.body);
  assert.equal(p.calculo.quantidadeModalidades,1);
  assert.equal(p.calculo.mensalidadeCentavos,18898);
  assert.equal(p.calculo.comboId,null);
  assert.equal(f.writes.length,0);
});
test('matrícula principal integra o formulário avulso e adicionais começam opcionais',()=>{
  const main=fs.readFileSync(path.join(root,'app/admin/matriculas/page.tsx'),'utf8');
  const component=fs.readFileSync(path.join(root,'components/admin/MatriculaModalidadesForm.tsx'),'utf8');
  assert.doesNotMatch(main,/router\.push\(urlCursosAdicionais/);
  assert.match(main,/<MatriculaModalidadesForm/);
  assert.match(component,/mostrarAdicionais, setMostrarAdicionais\] = useState\(false\)/);
  assert.match(component,/Adicionar outro curso \(opcional\)/);
  assert.match(component,/curso\.id === principalId \|\| mostrarAdicionais/);
});
test('confirmação mantém o principal, mesmo se a turma adicional vier primeiro, e preserva todas as disciplinas',async()=>{
 const f=fixture(),p=await f.server.prepararContratacaoModalidades(f.db,7,f.body);
 await f.server.confirmarContratacaoModalidades(f.db,{id:1,nome:'Admin',instituicaoId:7},{...f.body,versao:p.versao,primeiroVencimento:'2027-03-05',status:'A_INICIAR',chave:'teste',pedidoHash:'teste'},new Request('http://localhost'));
 const data=f.writes.find(w=>w[0]==='matricula')[1];assert.equal(data.cursoId,25);assert.equal(data.turmaPrincipalId,50);assert.equal(data.organizacaoCurricular,'ANUAL');assert.equal(data.valorMensalidade,385.18);assert.equal(data.itens.create.length,2);assert.equal(data.contratacaoModalidades.cursoPrincipalId,25);
});
test('principal ausente, sem permissão ou adicional não marcado são recusados antes de gravar',async()=>{
 for(const alterar of [f=>{f.body.cursoPrincipalId=999},f=>{f.turmas[0].curso.permiteCursosAdicionais=false},f=>{f.turmas[1].curso.disponivelComoAdicional=false},f=>{f.body.turmaIds=[10]}]){
  const f=fixture();alterar(f);await assert.rejects(f.server.prepararContratacaoModalidades(f.db,7,f.body),e=>['PRINCIPAL_NAO_PERMITE_ADICIONAIS','CURSO_NAO_DISPONIVEL_ADICIONAL'].includes(e.codigo));assert.equal(f.writes.length,0);
 }
});
test('desativar o adicional depois da prévia impede confirmar com condições antigas',async()=>{
 const f=fixture(),p=await f.server.prepararContratacaoModalidades(f.db,7,f.body);f.turmas[1].curso.disponivelComoAdicional=false;
 await assert.rejects(f.server.confirmarContratacaoModalidades(f.db,{id:1,nome:'Admin',instituicaoId:7},{...f.body,versao:p.versao},new Request('http://localhost')),e=>e.codigo==='CURSO_NAO_DISPONIVEL_ADICIONAL');assert.equal(f.writes.length,0);
});
test('modo geral legado continua independente das novas marcações',async()=>{
 const f=fixture();delete f.body.cursoPrincipalId;f.turmas.forEach(t=>{t.curso.permiteCursosAdicionais=false;t.curso.disponivelComoAdicional=false});
 const p=await f.server.prepararContratacaoModalidades(f.db,7,f.body);assert.equal(p.calculo.mensalidadeCentavos,38518);assert.equal('cursoPrincipalId' in p.snapshot,false);
});
test('URL transporta IDs válidos sem presumir turma, preço ou aluno',()=>{
 const m=carregar('lib/matriculas/cursos-adicionais.ts');const u=new URL(m.urlCursosAdicionais(25,'5'),'https://teste');assert.equal(u.searchParams.get('cursoPrincipalId'),'25');assert.equal(u.searchParams.get('alunoId'),'5');assert.equal(u.searchParams.get('turmaId'),null);assert.throws(()=>m.urlCursosAdicionais(25,'0'));assert.equal(m.idCursoPrincipal(null),null);
});
test('GET do fluxo mostra o principal e somente adicionais marcados da instituição; principal bloqueado não vaza dados',async()=>{
 let permitido=true;const consultas=[];
 const api=carregar('app/api/admin/matriculas/modalidades/route.ts',{'@/lib/prisma':{prisma:{curso:{findFirst:async({where})=>{consultas.push(where);return where.instituicaoId===7&&where.id===25?{id:25,nome:'Inglês',permiteCursosAdicionais:permitido}:null}}}},'@/lib/matriculas/combos-api':{administradorCombos:async()=>({id:1,instituicaoId:7}),erroCombos:e=>new Response(JSON.stringify({codigo:e.codigo}),{status:e.status||500})},'@/lib/matriculas/modalidades-servidor':{carregarOfertasModalidades:async()=>[{cursoId:25,curso:{disponivelComoAdicional:false}},{cursoId:20,curso:{disponivelComoAdicional:true}},{cursoId:30,curso:{disponivelComoAdicional:false}}]}});
 let r=await api.GET(new Request('https://teste?cursoPrincipalId=25'));assert.deepEqual((await r.json()).ofertas.map(o=>o.cursoId),[25,20]);assert.equal(consultas[0].instituicaoId,7);assert.equal(consultas[0].ativo,true);assert.equal(consultas[0].excluidoEm,null);
 permitido=false;r=await api.GET(new Request('https://teste?cursoPrincipalId=25'));assert.equal(r.status,409);
 r=await api.GET(new Request('https://teste?cursoPrincipalId=999'));assert.equal(r.status,409);
});
test('busca do aluno por ID mantém isolamento e retorna apenas dados de identificação',async()=>{
 let user={role:'ADMIN',instituicaoId:7};let where;
 const api=carregar('app/api/admin/alunos/busca-simples/route.ts',{'@/lib/server-auth':{getUserFromToken:async()=>user},'@/lib/prisma':{prisma:{aluno:{findMany:async args=>{where=args.where;return [{id:5,nome:'Aluno',matricula:'123',user:{email:'aluno@example.invalid',password:'nao-expor'}}]}}}}});
 let r=await api.GET(new Request('https://teste?id=5'));const data=await r.json();assert.equal(where.instituicaoId,7);assert.equal(where.id,5);assert.equal('user' in data[0],false);assert.equal('password' in data[0],false);
 r=await api.GET(new Request('https://teste?id=abc'));assert.equal(r.status,400);user=null;r=await api.GET(new Request('https://teste?id=5'));assert.equal(r.status,403);
});
test('migração é aditiva e desativada por padrão; cinco idiomas têm as mesmas mensagens',()=>{
 const sql=fs.readFileSync(path.join(root,'prisma/migrations/20261027170000_cursos_adicionais_matricula/migration.sql'),'utf8');assert.equal((sql.match(/DEFAULT false/g)||[]).length,2);assert.doesNotMatch(sql,/DROP|DELETE|UPDATE/i);
 let modelo;for(const locale of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']){const c=JSON.parse(fs.readFileSync(path.join(root,'messages',locale+'.json'),'utf8')).AdditionalCourses;const keys=Object.keys(c).sort().concat(Object.keys(c.errors).sort());if(modelo)assert.deepEqual(keys,modelo);else modelo=keys;}
});
test('aplicador só permite a migração prevista, verifica checksum e recusa falhas e outras pendências',()=>{
 const m=require('../scripts/aplicar-migracao-cursos-adicionais.cjs'),os=require('node:os'),crypto=require('node:crypto');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'phanyx-adicionais-'));
 const criar=(name,sql)=>{fs.mkdirSync(path.join(dir,name));fs.writeFileSync(path.join(dir,name,'migration.sql'),sql)};
 try{
  const sql='ALTER TABLE teste;\n';criar(m.TARGET,sql);
  assert.deepEqual(m.analisar([],dir),[m.TARGET]);
  const row={migration_name:m.TARGET,finished_at:new Date(),checksum:crypto.createHash('sha256').update(sql).digest('hex')};
  assert.deepEqual(m.analisar([row],dir),[]);
  assert.throws(()=>m.analisar([{...row,checksum:'invalido'}],dir));
  assert.throws(()=>m.analisar([{...row,finished_at:null}],dir));
  criar('20261027160000_outra','SELECT 1;');assert.throws(()=>m.analisar([],dir),/outras migrações/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('aplicador só confirma colunas booleanas não nulas e padrão false',()=>{
 const {validarColunas}=require('../scripts/aplicar-migracao-cursos-adicionais.cjs');
 const rows=['permiteCursosAdicionais','disponivelComoAdicional'].map(column_name=>({column_name,data_type:'boolean',is_nullable:'NO',column_default:'false'}));
 validarColunas(rows);assert.throws(()=>validarColunas(rows.slice(0,1)));assert.throws(()=>validarColunas(rows.map(c=>({...c,column_default:'true'}))));
});
