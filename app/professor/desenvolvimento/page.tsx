"use client";
import {useEffect,useState} from "react";
import { useTranslations } from "next-intl";
type Turma={id:number;nome:string;alunos:{id:number;nome:string}[]};
type Registro={id:number;turmaId:number;alunoId:number;tipo:string;titulo:string;descricao:string;conceito?:string|null;nota?:string|null;prazoTarefa?:string|null;status:string;devolutiva?:string|null;aluno:{nome:string};turma:{nome:string};imagens:{id:number;nomeOriginal:string}[]};
const classe="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
export default function DesenvolvimentoProfessor(){
  const tr = useTranslations("PlanningTracking");
  function rotuloCodigo(valor: string): string {
    switch (valor) {
      case "RASCUNHO": return tr("codeDraft");
      case "ENVIADO": return tr("codeSent");
      case "APROVADO": return tr("codeApproved");
      case "DEVOLVIDO": return tr("codeReturned");
      case "PUBLICADO": return tr("codePublished");
      case "REVOGADO": return tr("codeRevoked");
      case "REVISAO": return tr("codeRevision");
      case "PLANEJAMENTO": return tr("codePlanning");
      case "RELATORIO": return tr("codeReport");
      case "EVOLUCAO": return tr("codeEvolution");
      case "AVALIACAO": return tr("codeAssessment");
      case "TAREFA": return tr("codeTask");
      case "SEMANAL": return tr("weekly");
      case "MENSAL": return tr("monthly");
      case "ANUAL": return tr("annual");
      case "PADRAO": return tr("codeDefault");
      case "HABILITADA": return tr("codeEnabled");
      case "DESABILITADA": return tr("codeDisabled");
      default: return valor;
    }
  }


  const [turmas,setTurmas]=useState<Turma[]>([]),[registros,setRegistros]=useState<Registro[]>([]),[form,setForm]=useState({turmaId:"",alunoId:"",tipo:"EVOLUCAO",titulo:"",descricao:"",conceito:"",nota:"",prazoTarefa:""});
  const [editando,setEditando]=useState<number|null>(null);
  const [mensagem,setMensagem]=useState(""),[ocupado,setOcupado]=useState(false),[uploading,setUploading]=useState<number|null>(null);
  const turma=turmas.find(t=>String(t.id)===form.turmaId);
  async function carregar(){const [r1,r2]=await Promise.all([fetch("/api/professor/acompanhamento-opcoes",{cache:"no-store"}),fetch("/api/professor/desenvolvimento",{cache:"no-store"})]);const a=await r1.json().catch(()=>({})),b=await r2.json().catch(()=>({}));if(!r1.ok||!r2.ok){setMensagem(a.error||b.error||tr("cannotLoad"));return}setTurmas(a.turmas||[]);setRegistros(b.registros||[])}
  useEffect(()=>{void carregar()},[]);
  async function criar(){setOcupado(true);setMensagem("");try{const r=await fetch(editando?`/api/professor/desenvolvimento/${editando}`:"/api/professor/desenvolvimento",{method:editando?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,turmaId:Number(form.turmaId),alunoId:Number(form.alunoId),enviar:false,acao:"SALVAR"})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("saveError"));setMensagem(editando?tr("recordUpdated"):tr("recordDraftCreated"));setEditando(null);setForm({turmaId:"",alunoId:"",tipo:"EVOLUCAO",titulo:"",descricao:"",conceito:"",nota:"",prazoTarefa:""});await carregar()}catch(e){setMensagem(e instanceof Error?e.message:tr("error")) }finally{setOcupado(false)}}
  async function enviar(item:Registro){setOcupado(true);setMensagem("");try{const r=await fetch(`/api/professor/desenvolvimento/${item.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({acao:"ENVIAR",titulo:item.titulo,descricao:item.descricao,conceito:item.conceito,nota:item.nota,prazoTarefa:item.prazoTarefa?.slice(0,10)||null})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("sendError"));setMensagem(tr("recordSent"));await carregar()}catch(e){setMensagem(e instanceof Error?e.message:tr("error")) }finally{setOcupado(false)}}
  async function anexar(id:number,arquivo:File){setUploading(id);setMensagem("");try{const body=new FormData();body.append("arquivo",arquivo);const r=await fetch(`/api/professor/desenvolvimento/${id}/imagens`,{method:"POST",body});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("imageSendError"));setMensagem(tr("imageStored"));await carregar()}catch(e){setMensagem(e instanceof Error?e.message:tr("error")) }finally{setUploading(null)}}
  return <main className="mx-auto max-w-5xl space-y-6 text-slate-900 dark:text-slate-100"><header><h1 className="text-2xl font-bold">{tr("developmentTitle")}</h1><p className="text-sm text-slate-600 dark:text-slate-300">{tr("developmentIntro")}</p></header>
    {mensagem&&<p role="status" className="rounded-xl border border-blue-400 p-3">{mensagem}</p>}
    <section className="space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><h2 className="font-semibold">{editando?tr("editRecord"):tr("newRecord")}</h2><label className="block text-sm font-semibold">{tr("class")}<select className={classe} value={form.turmaId} disabled={editando!==null} onChange={e=>setForm(v=>({...v,turmaId:e.target.value,alunoId:""}))}><option value="">{tr("select")}</option>{turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
    <label className="block text-sm font-semibold">{tr("student")}<select className={classe} value={form.alunoId} disabled={editando!==null} onChange={e=>setForm(v=>({...v,alunoId:e.target.value}))}><option value="">{tr("select")}</option>{turma?.alunos.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></label>
    <label className="block text-sm font-semibold">{tr("type")}<select className={classe} value={form.tipo} disabled={editando!==null} onChange={e=>setForm(v=>({...v,tipo:e.target.value}))}><option value="EVOLUCAO">{tr("practicalProgress")}</option><option value="AVALIACAO">{tr("assessmentConcept")}</option><option value="TAREFA">{tr("homework")}</option></select></label>
    <label className="block text-sm font-semibold">{tr("title")}<input maxLength={150} className={classe} value={form.titulo} onChange={e=>setForm(v=>({...v,titulo:e.target.value}))}/></label><label className="block text-sm font-semibold">{tr("developmentNotes")}<textarea rows={4} maxLength={6000} className={classe} value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">{tr("ratingBand")}<input className={classe} maxLength={100} placeholder={tr("ratingExample")} value={form.conceito} onChange={e=>setForm(v=>({...v,conceito:e.target.value}))}/></label><label className="text-sm font-semibold">{tr("optionalGrade")}<input className={classe} type="number" min="0" max="100" step="0.01" value={form.nota} onChange={e=>setForm(v=>({...v,nota:e.target.value}))}/></label></div>
    {form.tipo==="TAREFA"&&<label className="block text-sm font-semibold">{tr("dueBy")}<input className={classe} type="date" value={form.prazoTarefa} onChange={e=>setForm(v=>({...v,prazoTarefa:e.target.value}))}/></label>}
    <button disabled={ocupado} onClick={()=>void criar()} className="rounded-xl bg-blue-700 px-5 py-2 font-bold text-white disabled:opacity-50"> {editando?tr("saveChanges"):tr("saveDraft")}</button>{editando&&<button onClick={()=>{setEditando(null);setForm({turmaId:"",alunoId:"",tipo:"EVOLUCAO",titulo:"",descricao:"",conceito:"",nota:"",prazoTarefa:""})}} className="ml-3 rounded-xl border px-5 py-2">{tr("cancelEdit")}</button>}</section>
    <section className="space-y-3"><h2 className="text-xl font-semibold">{tr("records")}</h2>{registros.length===0&&<p>{tr("noRecordsCreated")}</p>}{registros.map(r=><article key={r.id} className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><strong>{r.titulo} · {r.aluno.nome}</strong><span>{rotuloCodigo(r.status)}</span></div><p className="text-sm">{r.turma.nome} · {rotuloCodigo(r.tipo)}</p><p className="whitespace-pre-wrap text-sm">{r.descricao}</p>{r.devolutiva&&<p className="text-sm">{tr("feedbackLabel")} {r.devolutiva}</p>}{r.imagens.length>0&&<div className="flex flex-wrap gap-2">{r.imagens.map(i=><a key={i.id} href={`/api/desenvolvimento/imagens/${i.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 underline dark:text-blue-300">{i.nomeOriginal}</a>)}</div>}
      {["RASCUNHO","DEVOLVIDO"].includes(r.status)&&<div className="flex flex-wrap items-center gap-3"><button className="rounded-xl border border-blue-500 px-4 py-2 text-sm" onClick={()=>{setEditando(r.id);setForm({turmaId:String(r.turmaId),alunoId:String(r.alunoId),tipo:r.tipo,titulo:r.titulo,descricao:r.descricao,conceito:r.conceito||"",nota:r.nota===null||r.nota===undefined?"":String(r.nota),prazoTarefa:r.prazoTarefa?.slice(0,10)||""});window.scrollTo({top:0,behavior:"smooth"})}}>{tr("edit")}</button><label className="rounded-xl border border-blue-400 p-2 text-sm">{uploading===r.id?tr("sending"):tr("attachPhoto")}<input disabled={uploading!==null} type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 block max-w-[230px] text-xs" onChange={e=>{const f=e.target.files?.[0];if(f)void anexar(r.id,f);e.target.value=""}}/></label><button disabled={ocupado||uploading!==null} onClick={()=>void enviar(r)} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white">{tr("sendToCoordination")}</button></div>}</article>)}</section>
  </main>;
}
