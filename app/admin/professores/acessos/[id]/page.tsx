"use client";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect,useState} from "react";
import { useTranslations, useLocale } from "next-intl";
import { traduzirDocumentoDocente } from "@/lib/documentos-docentes/i18n";
type Historico={id:number;chavePagina:string;modoAnterior:string;modoNovo:string;alteradoEm:string;alteradoPorId:number};
type Pagina={chave:string;nome:string;modo:"PADRAO"|"HABILITADA"|"DESABILITADA";institucional:boolean};
export default function AcessoProfessor(){
  const tr = useTranslations("PlanningTracking");
  const locale = useLocale();
  function rotuloPagina(chave:string, fallback:string): string {
    if (chave === "professor.documentos") return traduzirDocumentoDocente(locale, "menuProfessor");
    const nomes: Record<string, string> = {
      "professor.painel": "pageDashboard",
      "professor.turmas": "pageClasses",
      "professor.substituicoes": "pageSubstitutions",
      "professor.alunos": "pageStudents",
      "professor.materiais": "pageMaterials",
      "professor.biblioteca": "pageLibrary",
      "professor.atividades": "pageActivities",
      "professor.provas": "pageExams",
      "professor.trabalhos": "pageAssignments",
      "professor.reunioes": "pageMeetings",
      "professor.mobilidade": "pageMobility",
      "professor.ouvidoria": "pageOmbudsman",
      "professor.planejamento": "planningTitle",
      "professor.relatorios": "reportsTitle",
      "professor.desenvolvimento": "developmentTitle",
    };
    const key = nomes[chave];
    return key ? tr(key as Parameters<typeof tr>[0]) : fallback;
  }
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

const params=useParams();const id=String(params.id);const [historico,setHistorico]=useState<Historico[]>([]);const [professor,setProfessor]=useState<{nome:string;id:number}|null>(null),[paginas,setPaginas]=useState<Pagina[]>([]),[mensagem,setMensagem]=useState(""),[salvando,setSalvando]=useState(false);useEffect(()=>{void(async()=>{const r=await fetch(`/api/admin/professores/${id}/paginas`,{cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok){setMensagem(d.error||tr("loadError"));return}setProfessor(d.professor);setPaginas(d.paginas||[]);setHistorico(d.historico||[])})()},[id]);async function salvar(){setSalvando(true);setMensagem("");try{const r=await fetch(`/api/admin/professores/${id}/paginas`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({paginas:paginas.map(({chave,modo})=>({chave,modo}))})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||tr("failedToSave"));setMensagem(tr("permissionUpdated"))}catch(e){setMensagem(e instanceof Error?e.message:tr("saveError"))}finally{setSalvando(false)}}return <main className="mx-auto max-w-4xl space-y-5 text-slate-900 dark:text-slate-100"><Link href="/admin/professores/acessos" className="text-blue-700 underline dark:text-blue-300">{tr("backTeachers")}</Link><h1 className="text-2xl font-bold">{professor?tr("teacherPortal", {name: professor.nome}):tr("loadingTeacher")}</h1><p className="text-sm text-slate-600 dark:text-slate-300">{tr("teacherAccessInfo")}</p>{mensagem&&<p role="status" className="rounded-xl border p-3">{mensagem}</p>}<div className="space-y-2">{paginas.map(p=><div key={p.chave} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div><strong>{rotuloPagina(p.chave,p.nome)}</strong><p className="text-xs text-slate-500 dark:text-slate-400">{tr("institutionDefault")} {p.institucional?tr("visible"):tr("hidden")} · {p.chave}</p></div><select aria-label={tr("permissionFor",{name:rotuloPagina(p.chave,p.nome)})} className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-900" value={p.modo} onChange={e=>setPaginas(a=>a.map(x=>x.chave===p.chave?{...x,modo:e.target.value as Pagina["modo"]}:x))}><option value="PADRAO">{tr("institutionSetting")}</option><option value="HABILITADA">{tr("enabled")}</option><option value="DESABILITADA">{tr("disabled")}</option></select></div>)}</div><button disabled={salvando||!professor} onClick={()=>void salvar()} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white disabled:opacity-50">{salvando?tr("saving"):tr("savePermissions")}</button><details className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><summary className="cursor-pointer font-semibold">{tr("accessHistory")}</summary><div className="mt-3 space-y-2">{historico.map(h=><p key={h.id} className="text-sm">{new Date(h.alteradoEm).toLocaleString(locale)} · {tr("userLabel")} {h.alteradoPorId} · {h.chavePagina}: {rotuloCodigo(h.modoAnterior)} → {rotuloCodigo(h.modoNovo)}</p>)}{historico.length===0&&<p className="text-sm">{tr("noAccessHistory")}</p>}</div></details></main>}
