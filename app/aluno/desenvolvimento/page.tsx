"use client";
import {useEffect,useState} from "react";
import { useTranslations, useLocale } from "next-intl";
import MateriaisDesenvolvimento from "@/components/desenvolvimento/MateriaisDesenvolvimento";
import type { AnexoDesenvolvimento } from "@/lib/desenvolvimento-materiais";
type Registro={id:number;tipo:string;titulo:string;descricao:string;conceito?:string|null;nota?:string|null;prazoTarefa?:string|null;publicadoEm?:string|null;turma:{nome:string};professor:{nome:string};imagens:AnexoDesenvolvimento[];links?:string[]};
export default function MeuDesenvolvimento(){
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

const [itens,setItens]=useState<Registro[]>([]),[mensagem,setMensagem]=useState("");useEffect(()=>{void(async()=>{const res=await fetch("/api/aluno/desenvolvimento",{cache:"no-store"});const data=await res.json().catch(()=>({}));if(!res.ok)setMensagem(data.error||tr("cannotLoad"));else setItens(data.registros||[])})();},[]);return <main className="mx-auto max-w-5xl space-y-5 text-slate-900 dark:text-white"><h1 className="text-2xl font-bold">{tr("myDevelopment")}</h1><p className="text-sm text-slate-600 dark:text-slate-300">{tr("myDevelopmentIntro")}</p>{mensagem&&<p role="status">{mensagem}</p>}{itens.length===0&&!mensagem&&<p>{tr("noPublishedRecords")}</p>}{itens.map(r=><article key={r.id} className="space-y-2 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{r.titulo}</h2><span className="text-sm">{rotuloCodigo(r.tipo)}</span></div><p className="text-sm">{r.turma.nome} · {r.professor.nome}</p><p className="whitespace-pre-wrap">{r.descricao}</p>{r.conceito&&<p>{tr("ratingLabel")} <strong>{r.conceito}</strong></p>}{r.nota!==null&&r.nota!==undefined&&<p>{tr("gradeLabel")} <strong>{r.nota}</strong></p>}{r.prazoTarefa&&<p>{tr("dueByLabel")} {formatarData(r.prazoTarefa)}</p>}<MateriaisDesenvolvimento anexos={r.imagens} links={r.links}/></article>)}</main>}
