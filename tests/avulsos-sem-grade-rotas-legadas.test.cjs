'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript');
const raiz=path.resolve(__dirname,'..');
const ler=p=>fs.readFileSync(path.join(raiz,p),'utf8');
const exec={};
vm.runInNewContext(ts.transpileModule(ler('lib/matriculas/bloquear-matricula-direta-na-rota-legada.ts'),
 {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports:exec,require:p=>p==='./combos'?{ErroModalidades:class extends Error {constructor(codigo,status){super(codigo);this.codigo=codigo;this.status=status;}}}:require(p)});
const bloquear=exec.exigirCursoComGradeNaRotaLegada;
test('curso direto sem grade recusa a rota legada com codigo e status de negocio',()=>{
 assert.throws(()=>bloquear({matriculaDiretaTurma:true}),e=>e.codigo==='TURMA_INDISPONIVEL'&&e.status===409);
});
test('curso tradicional e cursos ausentes mantem fluxo antigo',()=>{
 for(const c of [null,undefined,{}, {matriculaDiretaTurma:false},{matriculaDiretaTurma:null}])
  assert.doesNotThrow(()=>bloquear(c));
});
test('POST legado verifica modo do curso apos trava e antes de gravar matricula',()=>{
 const s=ler('app/api/matricula/route.ts');const post=s.slice(s.indexOf('export async function POST('),s.indexOf('export async function PATCH('));
 const lock=post.indexOf('SELECT "id" FROM "Curso"');
 const check=post.indexOf('exigirCursoComGradeNaRotaLegada(cursoRotaLegada)',lock);
 const create=post.indexOf('await tx.matricula.create(');
 assert.ok(lock>=0&&check>lock&&create>check);
 assert.match(post,/select: { matriculaDiretaTurma: true }/);
});
test('PUT legado verifica modo do curso antes de atualizar e preserva bloqueio de combo',()=>{
 const s=ler('app/api/matricula/route.ts');const put=s.slice(s.indexOf('export async function PUT('));
 const combo=put.indexOf('if (matriculaExistente.contratacaoModalidades)');
 const lock=put.indexOf('Protecao de curso destino em edicoes legadas');
 const check=put.indexOf('exigirCursoComGradeNaRotaLegada(cursoRotaLegada)',lock);
 const update=put.indexOf('await tx.matricula.update(');
 assert.ok(combo>=0&&lock>combo&&check>lock&&update>check);
});
test('rota de modalidades continua unica entrada para confirmacao direta com flag desligada',()=>{
 const modal=ler('lib/matriculas/modalidades-servidor.ts');
 assert.match(modal,/process\.env\.PHANYX_MATRICULA_SEM_GRADE_HABILITADA !== "true"/);
 assert.ok(modal.includes('turmasAvulsas: {'));
});
