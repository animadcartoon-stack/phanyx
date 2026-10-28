const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const path='lib/documentos/cursos-contratados.ts';
const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m={exports:{}};new Function('module','exports',js)(m,m.exports);
const resumo=m.exports.resumoCursosDocumento;
test('contratacao conjunta mostra todos os cursos e disciplinas por curso',()=>{
  const r=resumo({versao:1,nome:'Casadinho',ofertas:[
    {cursoNome:'Avulso Balé',disciplinas:[{nome:'Balé'}]},
    {cursoNome:'Avulso Robótica',disciplinas:[{nome:'Robótica'}]},
  ]},'Balé');
  assert.equal(r.cursosContratados,'- Avulso Balé\n- Avulso Robótica');
  assert.match(r.disciplinasPorCurso,/Avulso Robótica\n- Robótica/);
  assert.equal(r.disciplinasContratadasCombo,'- Balé\n- Robótica');
});
test('matricula tradicional permanece com curso unico e nao altera disciplinas antigas',()=>{
  const r=resumo(null,'Bacharel Livre em Teologia');
  assert.equal(r.cursosContratados,'- Bacharel Livre em Teologia');
  assert.equal(r.temModalidades,false);
  assert.equal(r.disciplinasContratadasCombo,null);
});
