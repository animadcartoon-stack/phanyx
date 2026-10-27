"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { copySelecao } from "@/lib/matriculas/selecao-disciplinas-copy";
import { normalizarSelecaoDisciplinas, type RegrasSelecaoDisciplinas } from "@/lib/matriculas/selecao-disciplinas";

const vazia = (): RegrasSelecaoDisciplinas => ({ versao: 1, horariosPendentesPermitidos: false, disciplinaIdsObrigatorias: [], grupos: [] });
type Dados = { regras: RegrasSelecaoDisciplinas | null; grade: { id: number; nome: string }[]; modoPermitido: boolean; rede: boolean; updatedAt: string };
export default function ConfiguracaoDisciplinasIncluidas({ cursoId }: { cursoId: number }) {
  const t = copySelecao(useLocale());
  const [dados, setDados] = useState<Dados | null>(null), [regras, setRegras] = useState(vazia), [ativa, setAtiva] = useState(false);
  const [busy, setBusy] = useState(false), [erro, setErro] = useState(""), [salvo, setSalvo] = useState(false), [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); setDados(null); setErro(""); setSalvo(false);
    fetch(`/api/admin/cursos/${cursoId}/selecao-disciplinas`, { credentials: "include", cache: "no-store", signal: abort.signal })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.codigo || "ERRO"); return data as Dados; })
      .then(data => { if (abort.signal.aborted) return; setDados(data); setRegras(data.regras || vazia()); setAtiva(Boolean(data.regras)); })
      .catch(e => { if (!abort.signal.aborted) setErro(t.errors[e.message] || t.error); });
    return () => abort.abort();
  }, [cursoId, tentativa, t.error, t.errors]);
  // Copy objects must be stable for the effect above; locale is the only translation input.
  async function salvar() {
    if (!dados || busy) return;
    setErro(""); setSalvo(false);
    let normalizadas;
    try { normalizadas = ativa ? normalizarSelecaoDisciplinas(regras) : null; }
    catch (e) { setErro(t.errors[(e as { codigo?: string }).codigo || ""] || t.invalid); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}/selecao-disciplinas`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ regras: normalizadas, updatedAt: dados.updatedAt }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.codigo || "ERRO");
      setDados(data); setRegras(data.regras || vazia()); setAtiva(Boolean(data.regras)); setSalvo(true);
    } catch (e) { setErro(t.errors[(e as Error).message] || t.error); } finally { setBusy(false); }
  }
  const mudar = (r: RegrasSelecaoDisciplinas) => { setRegras(r); setSalvo(false); };
  const input = "w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-950 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
  return <details className="rounded-2xl border border-slate-300 bg-white p-5 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <summary className="cursor-pointer font-bold">{t.title}</summary>
    <p className="my-3 text-sm">{t.help}</p>
    {erro && <p role="alert" className="my-3 rounded-lg border border-red-400 p-3 text-red-800 dark:text-red-200">{erro}</p>}
    {salvo && <p role="status" className="my-3 rounded-lg border border-green-400 p-3 text-green-800 dark:text-green-200">{t.saved}</p>}
    {!dados ? <p role="status">{erro ? <button type="button" onClick={() => setTentativa(x => x + 1)} className={input}>{t.retry}</button> : t.loading}</p> : <>
      {(!dados.modoPermitido || dados.rede) && <p className="my-3 text-sm">{dados.rede ? t.errors.SELECAO_REDE : t.pricesInfo}</p>}
      {!dados.grade.length && <p role="status" className="my-3 text-sm">{t.emptyGrade}</p>}
      <fieldset disabled={busy || dados.rede} className="space-y-4 disabled:opacity-60">
        <label className="flex items-center gap-2"><input type="checkbox" checked={ativa} disabled={!ativa && (!dados.modoPermitido || !dados.grade.length)} onChange={e => { setAtiva(e.target.checked); setSalvo(false); }} />{t.enabled}</label>
        {ativa && <>
          <p className="text-sm">{t.included}</p>
          <label className="flex items-center gap-2"><input type="checkbox" checked={regras.horariosPendentesPermitidos} onChange={e => mudar({ ...regras, horariosPendentesPermitidos: e.target.checked })} />{t.pending}</label>
          <fieldset className="rounded-xl border border-slate-300 p-3 dark:border-slate-600"><legend>{t.required}</legend><div className="grid gap-2 sm:grid-cols-2">{dados.grade.map(d => <label key={d.id} className="flex gap-2 text-sm"><input type="checkbox" checked={regras.disciplinaIdsObrigatorias.includes(d.id)} disabled={regras.grupos.some(g => g.disciplinaIds.includes(d.id))} onChange={e => mudar({ ...regras, disciplinaIdsObrigatorias: e.target.checked ? [...regras.disciplinaIdsObrigatorias, d.id] : regras.disciplinaIdsObrigatorias.filter(id => id !== d.id) })} />{d.nome}</label>)}</div></fieldset>
          <p className="font-semibold">{t.groups}</p>
          {regras.grupos.map((g, index) => <fieldset key={g.id} className="space-y-3 rounded-xl border border-slate-300 p-3 dark:border-slate-600">
            <legend>{g.nome || `${t.group} ${index + 1}`}</legend>
            <label className="block text-sm">{t.name}<input className={input} maxLength={100} value={g.nome} onChange={e => mudar({ ...regras, grupos: regras.grupos.map((x,i) => i === index ? { ...x, nome: e.target.value } : x) })} /></label>
            <div className="grid grid-cols-2 gap-3">{(["minimo", "maximo"] as const).map(campo => <label key={campo} className="text-sm">{campo === "minimo" ? t.min : t.max}<input className={input} type="number" min={campo === "minimo" ? 0 : 1} max={200} value={g[campo]} onChange={e => mudar({ ...regras, grupos: regras.grupos.map((x,i) => i === index ? { ...x, [campo]: Number(e.target.value) } : x) })} /></label>)}</div>
            <div className="grid gap-2 sm:grid-cols-2">{dados.grade.map(d => <label key={d.id} className="flex gap-2 text-sm"><input type="checkbox" checked={g.disciplinaIds.includes(d.id)} disabled={regras.disciplinaIdsObrigatorias.includes(d.id) || regras.grupos.some((x,i) => i !== index && x.disciplinaIds.includes(d.id))} onChange={e => mudar({ ...regras, grupos: regras.grupos.map((x,i) => i === index ? { ...x, disciplinaIds: e.target.checked ? [...x.disciplinaIds, d.id] : x.disciplinaIds.filter(id => id !== d.id) } : x) })} />{d.nome}</label>)}</div>
            <button type="button" className="rounded-lg border border-red-400 px-3 py-2 text-sm text-red-800 dark:text-red-200" onClick={() => mudar({ ...regras, grupos: regras.grupos.filter((_,i) => i !== index) })}>{t.remove}</button>
          </fieldset>)}
          <button type="button" className="rounded-lg border border-slate-400 px-3 py-2" disabled={regras.grupos.length >= 30} onClick={() => mudar({ ...regras, grupos: [...regras.grupos, { id: crypto.randomUUID(), nome: "", minimo: 1, maximo: 1, disciplinaIds: [] }] })}>{t.add}</button>
        </>}
        <button type="button" disabled={busy} className="block rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800" onClick={salvar}>{busy ? t.loading : t.save}</button>
      </fieldset>
    </>}
  </details>;
}
