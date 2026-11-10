"use client";
import {useEffect,useState} from "react";
import { useTranslations, useLocale } from "next-intl";
type Plano={id:number;tipo:string;titulo:string;status:string;inicioPeriodo:string;fimPeriodo:string;objetivos:string;conteudo:string;metodologia:string;avaliacao?:string|null;observacoes?:string|null;devolutiva?:string|null;professor:{nome:string};turma:{nome:string}};
type Registro={id:number;tipo:string;titulo:string;descricao:string;status:string;conceito?:string|null;nota?:number|string|null;devolutiva?:string|null;imagens:{id:number;nomeOriginal:string}[];aluno:{nome:string};professor:{nome:string};turma:{nome:string}};
type Regra={cursoId:number;periodicidade:string;exigeAprovacao:boolean};
const campo="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
export default function AcompanhamentoAulas(){
  const tr = useTranslations("PlanningTracking");
  const locale = useLocale();
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

  function formatarData(valor: string): string {
    const data = valor.slice(0,10);
    const dia = new Date(`${data}T12:00:00`);
    return Number.isNaN(dia.getTime()) ? data : dia.toLocaleDateString(locale);
  }


  const [planos,setPlanos]=useState<Plano[]>([]),[registros,setRegistros]=useState<Registro[]>([]),[cursos,setCursos]=useState<{id:number;nome:string}[]>([]),[regras,setRegras]=useState<Regra[]>([]),[cursoId,setCursoId]=useState(0),[periodicidade,setPeriodicidade]=useState("SEMANAL"),[exigeAprovacao,setExigeAprovacao]=useState(true),[tab,setTab]=useState<"planos"|"registros"|"regras">("planos"),[mensagem,setMensagem]=useState(""),[ocupado,setOcupado]=useState(false),[feedback,setFeedback]=useState<Record<number,string>>({}),[consentimentos,setConsentimentos]=useState<Record<number,boolean>>({});
  async function carregar(){const [a,b]=await Promise.all([fetch("/api/admin/acompanhamento-aulas",{cache:"no-store"}),fetch("/api/admin/planejamento-regras",{cache:"no-store"})]);const d=await a.json().catch(()=>({})),r=await b.json().catch(()=>({}));if(!a.ok||!b.ok){setMensagem(d.error||r.error||tr("loadError"));return}setPlanos(d.planos||[]);setRegistros(d.registros||[]);setCursos(r.cursos||[]);setRegras(r.regras||[])}
  useEffect(()=>{void carregar()},[]);
  function mudarCurso(id:number){setCursoId(id);const regra=regras.find(r=>r.cursoId===id);setPeriodicidade(regra?.periodicidade||"SEMANAL");setExigeAprovacao(regra?.exigeAprovacao??true)}
  async function salvarRegra(){setOcupado(true);setMensagem("");try{const r=await fetch("/api/admin/planejamento-regras",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({cursoId,periodicidade,exigeAprovacao})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("saveError"));setMensagem(tr("periodicitySaved"));await carregar()}catch(e){setMensagem(e instanceof Error?e.message:tr("error")) }finally{setOcupado(false)}}
  async function revisar(alvo:"PLANO"|"DESENVOLVIMENTO",id:number,acao:"APROVAR"|"DEVOLVER"|"REVOGAR"){setOcupado(true);setMensagem("");try{const r=await fetch("/api/admin/acompanhamento-aulas",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({alvo,id,acao,devolutiva:feedback[id]||"",autorizacaoImagemConfirmada:consentimentos[id]===true})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("reviewError"));setMensagem(tr("trackingUpdated"));await carregar()}catch(e){setMensagem(e instanceof Error?e.message:tr("error")) }finally{setOcupado(false)}}
  return <main className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100"><header><h1 className="text-2xl font-bold">{tr("trackingTitle")}</h1><p className="text-sm text-slate-600 dark:text-slate-300">{tr("trackingDescription")}</p></header>{mensagem&&<p role="status" className="rounded-xl border border-blue-400 p-3">{mensagem}</p>}
    <nav className="flex flex-wrap gap-2" aria-label={tr("tabsLabel")}>{(["planos","registros","regras"] as const).map(t=><button key={t} onClick={()=>setTab(t)} aria-current={tab===t?"page":undefined} className={`rounded-xl px-4 py-2 font-semibold ${tab===t?"bg-blue-700 text-white":"border border-slate-300 dark:border-slate-700"}`}>{t==="planos"?tr("plansTab"):t==="registros"?tr("developmentTab"):tr("requirementsTab")}</button>)}</nav>
    {tab==="regras"&&<section className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><h2 className="text-lg font-semibold">{tr("periodicityScope")}</h2><p className="text-sm">{tr("periodicityDescription")}</p><label className="block">{tr("applyTo")}<select className={`ml-2 ${campo}`} value={cursoId} onChange={e=>mudarCurso(Number(e.target.value))}><option value={0}>{tr("wholeInstitution")}</option>{cursos.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></label><label className="block">{tr("periodicity")}<select value={periodicidade} onChange={e=>setPeriodicidade(e.target.value)} className={`ml-2 ${campo}`}><option value="SEMANAL">{tr("weekly")}</option><option value="MENSAL">{tr("monthly")}</option><option value="ANUAL">{tr("annual")}</option></select></label><label className="flex gap-2"><input type="checkbox" checked={exigeAprovacao} onChange={e=>setExigeAprovacao(e.target.checked)}/>{tr("requireCoordinationApproval")}</label><button disabled={ocupado} onClick={()=>void salvarRegra()} className="rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white">{tr("saveRequirement")}</button></section>}
    {tab==="planos"&&<section className="space-y-3"><h2 className="text-lg font-semibold">{tr("receivedDocs")}</h2>{planos.length===0&&<p>{tr("noDocs")}</p>}{planos.map(p=><article key={p.id} className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{p.titulo||tr("noTitle")} · {rotuloCodigo(p.tipo)}</h3><span>{rotuloCodigo(p.status)}</span></div><p className="text-sm">{tr("teacherLabel")} {p.professor.nome} · {tr("classLabel")} {p.turma.nome} · {formatarData(p.inicioPeriodo)} {tr("to")} {formatarData(p.fimPeriodo)}</p><details><summary className="cursor-pointer text-blue-700 dark:text-blue-300">{tr("readDocument")}</summary><div className="mt-2 space-y-2 whitespace-pre-wrap text-sm"><p><strong>{tr("objectivesLabel")}</strong> {p.objetivos}</p><p><strong>{tr("contentLabel")}</strong> {p.conteudo}</p><p><strong>{tr("methodologyLabel")}</strong> {p.metodologia}</p><p><strong>{tr("assessmentLabel")}</strong> {p.avaliacao}</p><p>{p.observacoes}</p></div></details>{p.devolutiva&&<p className="text-sm">{tr("feedbackLabel")} {p.devolutiva}</p>}{p.status==="ENVIADO"&&<div className="space-y-2"><textarea aria-label={tr("feedbackTeacher")} placeholder={tr("feedbackReasonOptional")} className={`w-full ${campo}`} value={feedback[p.id]||""} onChange={e=>setFeedback(s=>({...s,[p.id]:e.target.value}))}/><div className="flex gap-2"><button disabled={ocupado} onClick={()=>void revisar("PLANO",p.id,"APROVAR")} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white">{tr("approve")}</button><button disabled={ocupado} onClick={()=>void revisar("PLANO",p.id,"DEVOLVER")} className="rounded-xl border px-4 py-2 font-semibold">{tr("returnForEdits")}</button></div></div>}</article>)}</section>}
    {tab==="registros"&&<section className="space-y-3"><h2 className="text-lg font-semibold">{tr("recordsHeading")}</h2>{registros.length===0&&<p>{tr("noRecords")}</p>}{registros.map(r=><article key={r.id} className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{r.titulo} · {r.aluno.nome}</h3><span>{rotuloCodigo(r.status)}</span></div><p className="text-sm">{rotuloCodigo(r.tipo)} · {tr("teacherLabel")} {r.professor.nome} · {tr("classLabel")} {r.turma.nome}</p><p className="whitespace-pre-wrap text-sm">{r.descricao}</p>{r.conceito&&<p>{tr("ratingLabel")} {r.conceito}</p>}{r.nota!==null&&r.nota!==undefined&&<p>{tr("gradeLabel")} {r.nota}</p>}{r.devolutiva&&<p>{tr("feedbackLabel")} {r.devolutiva}</p>}{r.imagens.length>0&&<div className="flex flex-wrap gap-2">{r.imagens.map(i=><a key={i.id} href={`/api/desenvolvimento/imagens/${i.id}`} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline dark:text-blue-300">{i.nomeOriginal}</a>)}</div>}
        {r.status==="ENVIADO"&&<div className="space-y-2"><textarea aria-label={tr("feedbackTeacher")} placeholder={tr("feedbackReason")} className={`w-full ${campo}`} value={feedback[r.id]||""} onChange={e=>setFeedback(s=>({...s,[r.id]:e.target.value}))}/>{r.imagens.length>0&&<label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consentimentos[r.id]===true} onChange={e=>setConsentimentos(s=>({...s,[r.id]:e.target.checked}))}/><span>{tr("imageConsent")}</span></label>}<div className="flex gap-2"><button disabled={ocupado} onClick={()=>void revisar("DESENVOLVIMENTO",r.id,"APROVAR")} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white">{tr("approvePublish")}</button><button disabled={ocupado} onClick={()=>void revisar("DESENVOLVIMENTO",r.id,"DEVOLVER")} className="rounded-xl border px-4 py-2">{tr("return")}</button></div></div>}
        {r.status==="PUBLICADO"&&<button disabled={ocupado} onClick={()=>void revisar("DESENVOLVIMENTO",r.id,"REVOGAR")} className="rounded-xl border border-red-500 px-4 py-2 text-red-700 dark:text-red-300">{tr("removeFromPortal")}</button>}
      </article>)}</section>}
  </main>;
}
