'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const compiled=ts.transpileModule(read('lib/academico/configurar-curso-avulso-sem-grade.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported={};vm.runInNewContext(compiled,{exports:exported,Date,Number,Boolean,Promise,Error,Array});
const {prepararConfiguracaoCursoAvulso:preparar,opcaoMatriculaDireta:opcao}=exported;
const dados={instituicaoId:26,cursoId:20,atual:false,destino:true,organizacaoCurricular:'ANUAL',regrasPrecoDisciplinas:null,regrasSelecaoDisciplinas:null,cursoRecebidoDaRede:false};
function fake(contagens={}){const calls=[];const db={};for(const nome of ['cursoSemestreDisciplina','disciplina','turmaDisciplina','matricula','turmaHorarioAvulso','matriculaTurmaAvulsa']) db[nome]={count:async q=>{calls.push({nome,q});return contagens[nome]||0}};return{db,calls};}
test('modo avulso eh opt-in booleano; valores invalidos nao sao interpretados como true',()=>{
 assert.equal(opcao(undefined,false),false);assert.equal(opcao(undefined,true),true);
 assert.equal(opcao(true,false),true);assert.equal(opcao(false,true),false);
 for(const v of ['true','false',1,0,null,{}])assert.throws(()=>opcao(v,false));
});
test('opt-in exige curso anual/semestral com preco fixo sem selecao de disciplinas',async()=>{
 for(const diff of [{organizacaoCurricular:'LIVRE'},{organizacaoCurricular:'OUTRO'},{regrasPrecoDisciplinas:{}},{regrasSelecaoDisciplinas:{}}]){
   await assert.rejects(preparar(fake().db,{...dados,...diff}));
 }
 await assert.rejects(preparar(fake().db,{...dados,cursoRecebidoDaRede:true}));
});
test('ativacao recusa grade, disciplinas soltas, vinculos em turmas e matriculas existentes',async()=>{
 for(const nome of ['cursoSemestreDisciplina','disciplina','turmaDisciplina','matricula']){
   const x=fake({[nome]:1});await assert.rejects(preparar(x.db,dados),e=>e.codigo==='CURSO_COM_GRADE_OU_HISTORICO');
   assert.ok(x.calls.every(c=>c.q.where.instituicaoId===26));
 }
});
test('ativacao limpa nao apaga dados nem grava diretamente; salvar curso ja ativo nao repete verificacao antiga',async()=>{
 const x=fake();assert.deepEqual(JSON.parse(JSON.stringify(await preparar(x.db,dados))),{matriculaDiretaTurma:true});
 assert.equal(x.calls.length,4);assert.ok(x.calls.every(c=>c.q.where.instituicaoId===26));
 assert.deepEqual(JSON.parse(JSON.stringify(await preparar(x.db,{...dados,atual:true}))),{matriculaDiretaTurma:true});
 assert.equal(x.calls.length,4);
});
test('desligar com horarios ou matriculas diretas eh proibido; sem vinculos fica permitido',async()=>{
 for(const nome of ['turmaHorarioAvulso','matriculaTurmaAvulsa']) await assert.rejects(preparar(fake({[nome]:1}).db,{...dados,atual:true,destino:false}),e=>e.codigo==='CURSO_AVULSO_COM_VINCULOS');
 const a=fake();assert.deepEqual(JSON.parse(JSON.stringify(await preparar(a.db,{...dados,atual:true,destino:false}))),{matriculaDiretaTurma:false});
});
test('edicao usa transacao e impede reintroduzir disciplinas na grade do curso direto',()=>{
 const api=read('app/api/admin/cursos/route.ts');const grade=read('app/api/admin/curso-semestre-disciplinas/route.ts');const ui=read('app/admin/cursos/[id]/page.tsx');
 assert.ok(api.includes('matriculaDiretaTurma: true'));assert.ok(api.includes('prepararConfiguracaoCursoAvulso(tx'));assert.ok(api.includes('...modoDireto'));
 assert.ok(grade.indexOf('curso?.matriculaDiretaTurma')<grade.indexOf('tx.cursoSemestreDisciplina.deleteMany('));
 assert.ok(grade.includes('CURSO_SEM_GRADE_NAO_ACEITA_DISCIPLINAS'));
 assert.ok(ui.includes('matriculaDiretaTurma: false'));assert.ok(ui.includes('formCurso.matriculaDiretaTurma'));
 // A pagina ja possuia window.confirm no fluxo LEGADO de exclusao de etapa.
 // Esta etapa deve garantir que apenas o NOVO bloco nao use dialogos nativos,
 // sem exigir uma refatoracao nao relacionada do comportamento anterior.
 const inicioNovoBloco = ui.indexOf('Curso avulso sem grade — matrícula diretamente na turma');
 const fimNovoBloco = ui.indexOf('<CamposCursosAdicionais', inicioNovoBloco);
 assert.ok(inicioNovoBloco >= 0 && fimNovoBloco > inicioNovoBloco, 'Configuracao sem grade nao encontrada');
 const novoBloco = ui.slice(ui.lastIndexOf('<div className="rounded-xl border border-blue-300', inicioNovoBloco), fimNovoBloco);
 assert.ok(!/\bwindow\.(?:alert|confirm|prompt)\s*\(/.test(novoBloco), 'O novo bloco nao pode usar dialogos nativos');
});
