'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const input=fs.readFileSync(path.join(root,'lib/matriculas/vagas-ofertas-compartilhadas.ts'),'utf8');
const js=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const lib={exports:{}};vm.runInNewContext(js,{exports:lib.exports,require,console});const m=lib.exports;
const origem={id:29,cursoId:18,codigo:null,capacidadeMaxima:12,disciplinas:[{disciplinaId:90},{disciplinaId:91}]};
const bale={id:31,cursoId:28,codigo:'OFERTA-29-28',capacidadeMaxima:4,disciplinas:[{disciplinaId:90}]};
const ingles={id:32,cursoId:21,codigo:'OFERTA-29-21',capacidadeMaxima:6,disciplinas:[{disciplinaId:91}]};
const ballet2={id:33,cursoId:34,codigo:'OFERTA-29-34',capacidadeMaxima:6,disciplinas:[{disciplinaId:90}]};
const o=(turmaId,disciplinaId,alunoId)=>({turmaId,disciplinaId,matricula:{alunoId}});
test('identifica origem apenas em codigos validos e preserva turmas comuns',()=>{
 assert.equal(m.origemOfertaVinculada(bale),29);
 assert.equal(m.origemOfertaVinculada({id:31,cursoId:90,codigo:'OFERTA-29-28'}),null);
 assert.equal(m.origemOfertaVinculada(origem),null);
 assert.equal(m.vagasOfertaCompartilhada(origem,[origem,bale],[o(29,90,1)]),11);
});
test('um aluno PEVI e outro avulso ocupam o mesmo limite fisico',()=>{
 const ocupacoes=[o(29,90,1),o(31,90,2),o(33,90,3)];
 assert.equal(m.vagasOfertaCompartilhada(bale,[origem,bale,ballet2],ocupacoes),1);
 assert.equal(m.vagasOfertaCompartilhada(ballet2,[origem,bale,ballet2],ocupacoes),1);
});
test('mesmo aluno inscrito em ofertas distintas nao ocupa duas vagas da mesma aula',()=>{
 const ocupacoes=[o(29,90,1),o(31,90,1)];
 assert.equal(m.vagasOfertaCompartilhada(bale,[origem,bale],ocupacoes),3);
});
test('aulas de disciplinas diferentes nao dividem o mesmo teto',()=>{
 const ocupacoes=[o(29,90,1),o(31,90,2),o(29,91,3)];
 assert.equal(m.vagasOfertaCompartilhada(ingles,[origem,bale,ingles],ocupacoes),5);
 assert.equal(m.vagasOfertaCompartilhada(bale,[origem,bale,ingles],ocupacoes),2);
});
test('oferta vinculada sem capacidade ou origem nao entra na matricula',()=>{
 const pendente={...bale,capacidadeMaxima:null};
 assert.equal(m.capacidadePendenteOferta(pendente,[origem,pendente]),true);
 assert.equal(m.vagasOfertaCompartilhada(pendente,[origem,pendente],[]),0);
 assert.equal(m.vagasOfertaCompartilhada(bale,[bale],[]),0);
});
test('servidor usa contagem compartilhada e confirmacao trava turma raiz',()=>{
 const server=fs.readFileSync(path.join(root,'lib/matriculas/modalidades-servidor.ts'),'utf8');
 const api=fs.readFileSync(path.join(root,'app/api/admin/matriculas/modalidades/route.ts'),'utf8');
 const component=fs.readFileSync(path.join(root,'components/admin/SeletorAdicionaisMatricula.tsx'),'utf8');
 assert.match(server,/vagasOfertaCompartilhada/);
 assert.match(server,/capacidadePendenteOferta/);
 assert.match(server,/codigo: \{ startsWith: "OFERTA-" \}/);
 assert.match(api,/turmasParaBloquear/);
 assert.match(api,/origemOfertaVinculada/);
 assert.match(component,/configure a capacidade compartilhada/);
});
