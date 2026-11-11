"use client";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { traducaoDocentesEtapa3 } from "@/lib/documentos-docentes/i18n-etapa3";

type DocumentoAssinavel = { documentoId: number; titulo: string; versao: number };
type Props = DocumentoAssinavel & {
  onFechar: () => void;
  onAssinou?: () => Promise<void>;
  emPagina?: boolean;
  hashEsperado?: string;
};

export default function AssinaturaDocumentoDocenteModal({documentoId,titulo,versao,onFechar,onAssinou,emPagina = false,hashEsperado}:Props) {
  const locale = useLocale();
  const t = (chave: Parameters<typeof traducaoDocentesEtapa3>[1]) => traducaoDocentesEtapa3(locale,chave);
  const canvas = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const [tipo,setTipo] = useState<"DESENHO"|"DIGITAL">("DESENHO");
  const [temTraco,setTemTraco] = useState(false);
  const [consentimento,setConsentimento] = useState(false);
  const [ocupado,setOcupado] = useState(false);
  const [erro,setErro] = useState("");

  function coordenadas(e:ReactPointerEvent<HTMLCanvasElement>) {
    const area = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX-area.left)*(e.currentTarget.width/area.width), y:(e.clientY-area.top)*(e.currentTarget.height/area.height) };
  }
  function aoIniciar(e:ReactPointerEvent<HTMLCanvasElement>) {
    if(ocupado) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvas.current?.getContext("2d");
    if(!ctx) return;
    const p=coordenadas(e);
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#0f172a";
    desenhando.current=true;
  }
  function aoMover(e:ReactPointerEvent<HTMLCanvasElement>) {
    if(!desenhando.current||ocupado) return;
    const ctx = canvas.current?.getContext("2d");if(!ctx) return;
    const p=coordenadas(e);ctx.lineTo(p.x,p.y);ctx.stroke();setTemTraco(true);
  }
  function aoTerminar(e:ReactPointerEvent<HTMLCanvasElement>) {
    desenhando.current=false;
    if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  }
  async function confirmar() {
    if(ocupado||!consentimento) return;
    if(tipo==="DESENHO"&&!temTraco){setErro(t("signatureInvalid"));return;}
    setOcupado(true);setErro("");
    try {
      const response = await fetch(`/api/documentos-docentes/${documentoId}/assinaturas`,{method:"POST",cache:"no-store",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        versao,tipo,hashEsperado,consentimento:true,imagem:tipo==="DESENHO"?canvas.current?.toDataURL("image/png"):null,
      })});
      const body = await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(typeof body.error==="string"?body.error:t("signatureError"));
      await onAssinou?.();
      onFechar();
    } catch(e){setErro(e instanceof Error?e.message:t("signatureError"));}
    finally{setOcupado(false);}
  }
  return <div className={emPagina ? undefined : "fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4"} role={emPagina ? undefined : "presentation"}>
    <section role={emPagina ? undefined : "dialog"} aria-modal={emPagina ? undefined : true} aria-labelledby={emPagina ? "docente-pagina-assinatura-titulo" : "docente-modal-assinatura-titulo"} className={`w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${emPagina ? "" : "max-w-xl shadow-xl"}`}>
      {!emPagina && <div className="flex items-start justify-between gap-3"><div><h2 id="docente-modal-assinatura-titulo" className="text-xl font-bold">{t("signatureTitle")}</h2><p className="mt-1 text-sm">{titulo} · {versao}</p></div><button type="button" disabled={ocupado} onClick={onFechar} aria-label={t("signatureCancel")} className="rounded-lg border px-3 py-1">×</button></div>}
      <div className="flex flex-wrap gap-3"><label className="flex items-center gap-2"><input type="radio" name="tipo-assinatura-docente" checked={tipo==="DESENHO"} disabled={ocupado} onChange={()=>{setTipo("DESENHO");setTemTraco(false);}}/>{t("draw")}</label><label className="flex items-center gap-2"><input type="radio" name="tipo-assinatura-docente" checked={tipo==="DIGITAL"} disabled={ocupado} onChange={()=>setTipo("DIGITAL")}/>{t("typed")}</label></div>
      {tipo==="DESENHO" ? <div><canvas ref={canvas} width={800} height={220} className="h-36 w-full touch-none rounded-lg border border-slate-300 bg-white" onPointerDown={aoIniciar} onPointerMove={aoMover} onPointerUp={aoTerminar} onPointerCancel={aoTerminar} onPointerLeave={aoTerminar}/><button type="button" disabled={ocupado} onClick={()=>{canvas.current?.getContext("2d")?.clearRect(0,0,800,220);setTemTraco(false);}} className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm">{t("clear")}</button></div> : <p className="rounded-lg border bg-slate-50 px-3 py-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{t("typed")}: {t("signatureNotice")}</p>}
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consentimento} onChange={(e:{target:{checked:boolean}})=>setConsentimento(e.target.checked)} className="mt-1"/><span>{t("signatureTerms")}</span></label>
      <p className="text-xs text-slate-600 dark:text-slate-300">{t("signatureNotice")}</p>
      {erro&&<p role="alert" className="rounded-lg border border-red-500 p-2 text-sm text-red-700 dark:text-red-300">{erro}</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={ocupado} onClick={onFechar} className="rounded-lg border px-4 py-2">{t("signatureCancel")}</button><button type="button" disabled={ocupado||!consentimento||(tipo==="DESENHO"&&!temTraco)} onClick={()=>void confirmar()} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{t("signatureConfirm")}</button></div>
    </section>
  </div>;
}

export function AssinaturaDocumentoDocentePagina(props: DocumentoAssinavel & { retorno: string; hashEsperado: string }) {
  const router = useRouter();
  const { retorno, ...documento } = props;

  return <AssinaturaDocumentoDocenteModal {...documento} emPagina onFechar={() => router.replace(retorno)} />;
}
