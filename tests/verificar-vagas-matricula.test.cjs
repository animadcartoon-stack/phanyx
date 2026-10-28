'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'lib/matriculas/verificar-vagas-matricula.ts'),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
class ErroModalidades extends Error{constructor(codigo,status,detalhes){super(codigo);this.codigo=codigo;this.status=status;this.detalhes=detalhes;}}
const origemOfertaVinculada=t=>{const m=/^OFERTA-(\d+)-(\d+)$/.exec(t.codigo||'');return m&&Number(m[2])===t.cursoId?Number(m[1]):null};
const mod={};vm.runInNewContext(js,{exports:mod,require:n=>{
 if(n==='@prisma/client')return {Prisma:{sql:(s,...v)=>({s,v}),join:v=>v}};
 if(n==='./combos')return {ErroModalidades};
 if(n==='./vagas-ofertas-compartilhadas')return {origemOfertaVinculada};throw Error('Import '+n);
}});
const verificar=mod.verificarVagasMatricula;
const raiz={id:29,codigo:null,cursoId:18,ativa:true,capacidadeMaxima:12,disciplinas:[{disciplinaId:90},{disciplinaId:91}]};
const bale={id:31,codigo:'OFERTA-29-28',cursoId:28,ativa:true,capacidadeMaxima:4,disciplinas:[{disciplinaId:90}]};
const inglesa={id:32,codigo:'OFERTA-29-21',cursoId:21,ativa:true,capacidadeMaxima:3,disciplinas:[{disciplinaId:91}]};
function fake(turmas,inscritos=[]){const locks=[];
 const db={turma:{findMany:async({where})=>{
   if(where.id?.in)return turmas.filter(t=>where.id.in.includes(t.id)).map(t=>where && t);
   return turmas.filter(t=>where.OR.some(o=>String(t.codigo||'').startsWith(o.codigo.startsWith)));
 }},itemMatricula:{findMany:async({where})=>inscritos.filter(i=>where.turmaId.in.includes(i.turmaId)&&(!where.matricula.id||i.matriculaId!==where.matricula.id.not)).map(({matriculaId,...i})=>i)},$queryRaw:async v=>{locks.push(v);return []}};
 return {db,locks};
}
const item=(turmaId,disciplinaId,alunoId,matriculaId=999)=>({turmaId,disciplinaId,matricula:{alunoId},matriculaId});
const args=(turmaId,disciplinaId,alunoId=5)=>({instituicaoId:26,alunoId,itens:[{turmaId,disciplinaId}]});
test('matricula tradicional PEVI nao ignora 4 vagas fisicas ocupadas por PEVI e avulso',async()=>{
 const f=fake([raiz,bale],[item(29,90,1),item(29,90,2),item(31,90,3),item(31,90,4)]);
 await assert.rejects(verificar(f.db,args(29,90)),e=>e.codigo==='TURMA_SEM_VAGAS'&&e.status===409);
 assert.equal(f.locks.length,1);
});
test('matricula tradicional aceita a ultima vaga e bloqueia a proxima',async()=>{
 const f=fake([raiz,bale],[item(29,90,1),item(31,90,2),item(31,90,3)]);
 await verificar(f.db,args(29,90));
});
test('turma avulsa tambem enxerga alunos PEVI, sem dupla contagem do mesmo aluno',async()=>{
 const f=fake([raiz,bale],[item(29,90,1),item(31,90,1),item(31,90,2),item(31,90,3),item(31,90,4)]);
 await verificar(f.db,args(31,90,1));
 await assert.rejects(verificar(f.db,args(31,90,8)),e=>e.codigo==='TURMA_SEM_VAGAS');
});
test('disciplina diferente nao consome vaga de bale',async()=>{
 const f=fake([raiz,bale,inglesa],[item(29,91,1),item(32,91,2)]);
 await verificar(f.db,args(31,90));
});
test('turma comum preserva capacidade global e null legado',async()=>{
 const comum={...raiz,id:70,capacidadeMaxima:1};const f=fake([comum],[item(70,91,1)]);
 await assert.rejects(verificar(f.db,args(70,90)),e=>e.codigo==='TURMA_SEM_VAGAS');
 const livre=fake([{...comum,capacidadeMaxima:null}],[item(70,91,1)]);
 await verificar(livre.db,args(70,90));
});
test('edicao ignora sua propria matricula no calculo mas bloqueia outra',async()=>{
 const f=fake([raiz,bale],[item(29,90,1,200),item(31,90,2,201),item(31,90,3,202),item(31,90,4,203)]);
 await verificar(f.db,{...args(29,90),matriculaIdIgnorada:200});
 await assert.rejects(verificar(f.db,{...args(29,90,9),matriculaIdIgnorada:999}),e=>e.codigo==='TURMA_SEM_VAGAS');
});
test('oferta vinculada ativa sem capacidade configurada e bloqueada',async()=>{
 const f=fake([raiz,{...bale,capacidadeMaxima:null}]);
 await assert.rejects(verificar(f.db,args(29,90)),e=>e.codigo==='TURMA_SEM_VAGAS'&&e.detalhes.motivo==='CAPACIDADE_NAO_CONFIGURADA');
});
test('insere validacao dentro da transacao em criacao e edicao sem alterar financeiro',()=>{
 const main=fs.readFileSync(path.join(root,'app/api/matricula/route.ts'),'utf8');
 assert.match(main,/await verificarVagasMatricula\(tx, \{/);
 assert.match(main,/matriculaIdIgnorada: id/);
 assert.match(main,/await validarAgendaMatricula/);
 assert.match(main,/statusInicialItens/);
});
