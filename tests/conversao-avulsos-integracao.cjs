'use strict';
// Execução manual exclusivamente no banco isolado indicado, com rollback integral.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{PrismaClient}=require('@prisma/client');
const root=path.resolve(__dirname,'..'),branch=process.env.PHANYX_TEST_BRANCH_ID,url=process.env.PHANYX_TEST_DATABASE_URL;
if(branch!=='br-blue-base-aclw74mj'||!url||!new URL(url).hostname.startsWith('ep-patient-wind-acuj36yq'))throw Error('Banco isolado obrigatório. Não utiliza DATABASE_URL do projeto.');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:p=>imports[p]||require(p),console,Date});return exports;}
const validacao=load('lib/academico/validar-turma-avulsa.ts'),{prepararConversaoAvulsa}=load('lib/academico/converter-cadastro-avulso.ts',{'./validar-turma-avulsa':validacao});
const prisma=new PrismaClient({datasources:{db:{url}}}),checks=[],tag='TESTE-CONVERSAO-'+Date.now();let ids=[];
module.exports=(async()=>{await prisma.$queryRaw`SELECT 1`;
try{await prisma.$transaction(async tx=>{
 const curso=await tx.curso.create({data:{instituicaoId:26,nome:tag+' IA',organizacaoCurricular:'ANUAL',valorMatricula:98.5,valorMensalidade:239,quantidadeParcelas:12}});
 const outro=await tx.curso.create({data:{instituicaoId:26,nome:tag+' PEVI',organizacaoCurricular:'ANUAL'}});ids=[curso.id,outro.id];
 const disciplina=await tx.disciplina.create({data:{instituicaoId:26,cursoId:curso.id,nome:tag+' disciplina'}});
 const etapa=await tx.cursoSemestre.create({data:{instituicaoId:26,cursoId:curso.id,numero:1,organizacaoCurricular:'ANUAL',disciplinas:{create:{instituicaoId:26,disciplinaId:disciplina.id}}}});
 const etapaOutro=await tx.cursoSemestre.create({data:{instituicaoId:26,cursoId:outro.id,numero:1,organizacaoCurricular:'ANUAL',disciplinas:{create:{instituicaoId:26,disciplinaId:disciplina.id}}}});
 const plano=await prepararConversaoAvulsa(tx,26,{tipo:'curso',id:curso.id});
 assert.equal((await tx.curso.findUnique({where:{id:curso.id}})).matriculaDiretaTurma,false);assert.equal(plano.previa.etapas,1);await plano.aplicar();
 const salvo=await tx.curso.findUnique({where:{id:curso.id}});assert.equal(salvo.id,curso.id);assert.equal(salvo.matriculaDiretaTurma,true);assert.equal(salvo.valorMensalidade,239);assert.equal(salvo.valorMatricula,98.5);assert.equal(salvo.quantidadeParcelas,12);
 assert.equal(await tx.cursoSemestre.count({where:{id:etapa.id}}),0);assert.equal(await tx.cursoSemestreDisciplina.count({where:{cursoSemestreId:etapaOutro.id,disciplinaId:disciplina.id}}),1);assert.equal((await tx.disciplina.findUnique({where:{id:disciplina.id}})).cursoId,null);checks.push('Curso convertido com mesmo ID e preços, catálogo e grade de outro curso preservados');
 const turma=await tx.turma.create({data:{instituicaoId:26,cursoId:outro.id,nome:tag+' E3M',semestre:'',organizacaoCurricular:'ANUAL',etapaNumero:1,periodoLetivo:'2027',turno:'MATUTINO',capacidadeMaxima:15,capacidadeMinima:0,ativa:true,statusTurma:'A_INICIAR',disciplinas:{create:{instituicaoId:26,disciplinaId:disciplina.id}}}});
 const modulo=await tx.modulo.create({data:{instituicaoId:26,turmaId:turma.id,nome:'TESTE bloqueio',ordem:1}});
 const body={tipo:'turma',id:turma.id,cursoDestinoId:curso.id,dadosTurma:{nome:tag+' E3M-Robótica',codigo:'TESTE',periodoLetivo:'2027',turno:'MATUTINO',capacidadeMaxima:'3',capacidadeMinima:'0',professorId:'',horarios:[{diaSemana:1,horaInicio:'08:00',horaFim:'09:40'}]}};
 await assert.rejects(prepararConversaoAvulsa(tx,26,body));assert.equal((await tx.turma.findUnique({where:{id:turma.id}})).cursoId,outro.id);checks.push('Vínculo acadêmico real impede transferência sem alterar a turma');
 await tx.modulo.delete({where:{id:modulo.id}});
 const conversao=await prepararConversaoAvulsa(tx,26,body);await conversao.aplicar();
 const convertida=await tx.turma.findUnique({where:{id:turma.id},include:{horariosAvulsos:true,disciplinas:true}});
 assert.equal(convertida.id,turma.id);assert.equal(convertida.cursoId,curso.id);assert.equal(convertida.ativa,false);assert.equal(convertida.disciplinas.length,0);assert.equal(convertida.horariosAvulsos.length,1);assert.equal(convertida.horariosAvulsos[0].instituicaoId,26);assert.equal(convertida.horariosAvulsos[0].horaInicio,'08:00');assert.equal(await tx.disciplina.count({where:{id:disciplina.id}}),1);assert.equal(await tx.cursoSemestreDisciplina.count({where:{cursoSemestreId:etapaOutro.id,disciplinaId:disciplina.id}}),1);checks.push('Turma reaproveitada com mesmo ID, horários próprios e FK composta válida, sem alterar catálogo ou grade de origem');
 await assert.rejects(prepararConversaoAvulsa(tx,999999,body));checks.push('Outra instituição não acessa o cadastro');
 throw Error('ROLLBACK_FIXTURES_CONVERSAO');
},{isolationLevel:'Serializable',timeout:90000,maxWait:20000})}catch(e){if(e.message!=='ROLLBACK_FIXTURES_CONVERSAO')throw e;}
assert.equal(await prisma.curso.count({where:{id:{in:ids}}}),0);checks.push('Rollback integral confirmado: cursos fictícios não persistiram');for(const c of checks)console.log('OK: '+c);
})().catch(e=>{console.error('FALHA: '+String(e.message).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[conexão omitida]'));process.exitCode=1}).finally(()=>prisma.$disconnect());
