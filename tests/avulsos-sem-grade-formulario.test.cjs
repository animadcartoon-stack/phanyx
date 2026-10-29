'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(base,p),'utf8');
test('avulso opt-in exige somente curso/aluno/turma e nao reabre grade do PEVI',()=>{
 const s=read('app/admin/matriculas/page.tsx');
 assert.match(s,/matriculaDiretaTurma: curso\?\.matriculaDiretaTurma === true/);
 assert.match(s,/if \(cursoSemGrade\) \{/);
 assert.match(s,/\(cursoSemGrade \|\| disciplinasIdsSelecionadasParaEnvio\.length > 0\)/);
 assert.match(s,/\(cursoSemGrade \|\| semestresSelecionados\.length > 0\)/);
 assert.match(s,/hidden=\{Boolean\(regrasIncluidas\) \|\| cursoSemGrade\}/);
});
test('um avulso sozinho ou com adicional usa calculo do servidor com turma propria',()=>{
 const p=read('app/admin/matriculas/page.tsx'),v=read('components/admin/SeletorAdicionaisMatricula.tsx');
 assert.match(p,/if \(cursoSemGrade \|\| cursosAdicionaisEscolhidos\.length > 0\)/);
 assert.match(p,/principalSemGrade=\{cursoSemGrade\}/);
 assert.match(v,/\(!escolhidos\.length && !principalSemGrade\)/);
 assert.match(v,/fetch\(\"\/api\/admin\/matriculas\/modalidades\"/);
 assert.match(v,/Mensalidade calculada/);
});
test('registro financeiro continua controlado por backend e flag de confirmacao segura',()=>{
 const s=read('lib/matriculas/modalidades-servidor.ts');
 assert.ok(s.includes('calcularContratacaoModalidades('));
 assert.ok(s.includes('!matriculaSemGradeHabilitada(user.instituicaoId)'));
 const p=read('app/admin/matriculas/page.tsx');assert.ok(p.includes('previaCombo.calculo.mensalidadeCentavos'));
});
