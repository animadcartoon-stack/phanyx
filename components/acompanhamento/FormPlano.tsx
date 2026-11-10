"use client";
import {useEffect,useState} from "react";

type Turma={id:number;nome:string;curso?:{nome:string}|null;regra:{periodicidade:string}};
type Plano={id:number;turmaId:number;tipo:string;titulo:string;objetivos:string;conteudo:string;metodologia:string;recursos?:string|null;avaliacao?:string|null;observacoes?:string|null;inicioPeriodo:string;fimPeriodo:string;status:string;devolutiva?:string|null;turma:{nome:string}};
const vazio={turmaId:"",titulo:"",objetivos:"",conteudo:"",metodologia:"",recursos:"",avaliacao:"",observacoes:"",inicioPeriodo:"",fimPeriodo:""};
const campo="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
export default function FormPlano({tipo}:{tipo:"PLANEJAMENTO"|"RELATORIO"}){
  const [turmas,setTurmas]=useState<Turma[]>([]),[registros,setRegistros]=useState<Plano[]>([]);
  const [form,setForm]=useState(vazio),[editando,setEditando]=useState<number|null>(null),[mensagem,setMensagem]=useState(""),[ocupado,setOcupado]=useState(false);
  const tituloPagina=tipo==="PLANEJAMENTO"?"Planejamento de aulas":"Relatórios de aulas";
  const turma=turmas.find(t=>String(t.id)===form.turmaId);
  async function carregar(){
    const [r1,r2]=await Promise.all([fetch("/api/professor/acompanhamento-opcoes",{cache:"no-store"}),fetch(`/api/professor/planejamentos?tipo=${tipo}`,{cache:"no-store"})]);
    const d1=await r1.json().catch(()=>({})),d2=await r2.json().catch(()=>({}));
    if(!r1.ok||!r2.ok){setMensagem(d1.error||d2.error||"Não foi possível carregar");return;}
    setTurmas(d1.turmas||[]);setRegistros(d2.registros||[]);
  }
  useEffect(()=>{void carregar()},[tipo]);
  function editar(item:Plano){setEditando(item.id);setForm({turmaId:String(item.turmaId),titulo:item.titulo,objetivos:item.objetivos,conteudo:item.conteudo,metodologia:item.metodologia,recursos:item.recursos||"",avaliacao:item.avaliacao||"",observacoes:item.observacoes||"",inicioPeriodo:item.inicioPeriodo.slice(0,10),fimPeriodo:item.fimPeriodo.slice(0,10)});window.scrollTo({top:0,behavior:"smooth"});}
  async function salvar(enviar:boolean){
    setMensagem("");
    if(!turma){setMensagem("Selecione uma turma vinculada a você.");return;}
    setOcupado(true);
    try{
      const url=editando?`/api/professor/planejamentos/${editando}`:"/api/professor/planejamentos";
      const res=await fetch(url,{method:editando?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,turmaId:turma.id,tipo,periodicidade:turma.regra.periodicidade,...(editando?{acao:enviar?"ENVIAR":"SALVAR"}:{enviar})})});
      const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||"Erro ao salvar");
      setMensagem(enviar?"Documento enviado para acompanhamento.":"Rascunho salvo.");setForm(vazio);setEditando(null);await carregar();
    }catch(e){setMensagem(e instanceof Error?e.message:"Erro inesperado")}finally{setOcupado(false)}
  }
  return <main className="mx-auto max-w-5xl space-y-5 text-slate-900 dark:text-slate-100">
    <header><h1 className="text-2xl font-bold">{tituloPagina}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Registre as informações solicitadas pela coordenação; rascunhos não são enviados à administração.</p></header>
    {mensagem&&<p role="status" className="rounded-lg border border-blue-300 p-3 dark:border-blue-700">{mensagem}</p>}
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="font-semibold">{editando?"Editar documento":"Novo documento"}</h2>
      <label className="block text-sm font-medium">Turma<select className={campo} value={form.turmaId} disabled={editando!==null} onChange={e=>setForm(v=>({...v,turmaId:e.target.value}))}><option value="">Selecione a turma</option>{turmas.map(t=><option value={t.id} key={t.id}>{t.nome} — {t.curso?.nome||"Curso"}</option>)}</select></label>
      {turma&&<p className="text-sm">Periodicidade exigida: <strong>{turma.regra.periodicidade.toLowerCase()}</strong></p>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Início do período<input type="date" className={campo} value={form.inicioPeriodo} onChange={e=>setForm(v=>({...v,inicioPeriodo:e.target.value}))}/></label><label className="text-sm font-medium">Fim do período<input type="date" className={campo} value={form.fimPeriodo} onChange={e=>setForm(v=>({...v,fimPeriodo:e.target.value}))}/></label></div>
      <label className="block text-sm font-medium">Título<input maxLength={150} className={campo} value={form.titulo} onChange={e=>setForm(v=>({...v,titulo:e.target.value}))}/></label>
      {(["objetivos","conteudo","metodologia","recursos","avaliacao","observacoes"] as const).map(c=><label key={c} className="block text-sm font-medium">{({objetivos:"Objetivos",conteudo:"Conteúdo / Atividades realizadas",metodologia:"Metodologia",recursos:"Recursos utilizados",avaliacao:"Avaliação / Resultados",observacoes:"Observações"} as Record<string,string>)[c]}<textarea rows={3} maxLength={4000} className={campo} value={form[c]} onChange={e=>setForm(v=>({...v,[c]:e.target.value}))}/></label>)}
      <div className="flex flex-wrap gap-3"><button disabled={ocupado} onClick={()=>void salvar(false)} className="rounded-xl border border-blue-600 px-5 py-2 font-semibold text-blue-700 dark:text-blue-200">Salvar rascunho</button><button disabled={ocupado} onClick={()=>void salvar(true)} className="rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white">Enviar à coordenação</button>{editando&&<button onClick={()=>{setEditando(null);setForm(vazio)}} className="rounded-xl border px-5 py-2">Cancelar edição</button>}</div>
    </section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">Documentos cadastrados</h2>{registros.length===0&&<p>Nenhum documento cadastrado.</p>}{registros.map(r=><article key={r.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><strong>{r.titulo||"Sem título"} · {r.turma.nome}</strong><span>{r.status}</span></div><p className="text-sm">{r.inicioPeriodo.slice(0,10)} até {r.fimPeriodo.slice(0,10)}</p>{r.devolutiva&&<p className="mt-2 text-sm">Devolutiva: {r.devolutiva}</p>}{["RASCUNHO","REVISAO"].includes(r.status)&&<button className="mt-2 text-sm font-bold text-blue-700 dark:text-blue-300" onClick={()=>editar(r)}>Editar</button>}</article>)}</section>
  </main>;
}
