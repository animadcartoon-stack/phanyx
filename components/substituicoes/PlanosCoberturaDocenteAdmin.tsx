"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type Professor = { id: number; nome: string };
type Plano = {
  id: number; professorTitularId: number; dataAula: string; titulo: string; orientacoes: string; materiais: string | null;
  status: string; devolutiva: string | null;
  professorTitular: { nome: string }; turma: { nome: string }; disciplina: { nome: string };
  substituicaoDocente: { id: number; status: string; professorSubstituto: { nome: string } } | null;
};
const textos = {
  "pt-BR": { title: "Planos para cobertura de ausência", desc: "O professor titular prepara a aula; a coordenação aprova e escolhe quem a aplicará. Esta aprovação não publica a atividade aos alunos.", waiting: "Aguardando análise", empty: "Nenhum plano enviado pelos docentes.", teacher: "Titular", class: "Turma", subject: "Disciplina", date: "Data", substitute: "Professor substituto", select: "Selecione o substituto", approve: "Aprovar e designar substituto", return: "Devolver para ajuste", reason: "Motivo da devolução (obrigatório)", links: "Materiais", instructions: "Orientações da aula", refresh: "Atualizar", error: "Falha ao analisar o plano.", saved: "Atualização concluída.", assigned: "Designado" },
  "pt-PT": { title: "Planos de substituição", desc: "A coordenação aprova e escolhe o substituto. Não publica conteúdos diretamente aos alunos.", waiting: "A aguardar análise", empty: "Nenhum plano enviado.", teacher: "Titular", class: "Turma", subject: "Disciplina", date: "Data", substitute: "Docente substituto", select: "Selecione", approve: "Aprovar e designar", return: "Devolver", reason: "Motivo da devolução", links: "Materiais", instructions: "Orientações", refresh: "Atualizar", error: "Falha na revisão.", saved: "Concluído.", assigned: "Atribuído" },
  "en-US": { title: "Absence coverage lesson plans", desc: "The original teacher prepares the lesson; coordination approves and assigns a substitute. This does not publish to students.", waiting: "Pending review", empty: "No lesson plans submitted.", teacher: "Original teacher", class: "Class", subject: "Subject", date: "Date", substitute: "Substitute teacher", select: "Select substitute", approve: "Approve and assign", return: "Return for changes", reason: "Reason for return (required)", links: "Materials", instructions: "Lesson instructions", refresh: "Refresh", error: "Could not review the plan.", saved: "Update saved.", assigned: "Assigned" },
  "es-ES": { title: "Planes para clases de sustitución", desc: "Coordinación aprueba el plan y asigna un sustituto. No publica tareas a alumnos.", waiting: "Pendiente de revisión", empty: "No hay planes enviados.", teacher: "Titular", class: "Grupo", subject: "Asignatura", date: "Fecha", substitute: "Sustituto", select: "Seleccionar", approve: "Aprobar y asignar", return: "Devolver", reason: "Motivo (obligatorio)", links: "Materiales", instructions: "Instrucciones", refresh: "Actualizar", error: "No se pudo revisar.", saved: "Actualización guardada.", assigned: "Asignado" },
  "fr-FR": { title: "Plans de cours de remplacement", desc: "La coordination valide et désigne un remplaçant. Aucune publication automatique aux élèves.", waiting: "En attente", empty: "Aucun plan envoyé.", teacher: "Titulaire", class: "Classe", subject: "Matière", date: "Date", substitute: "Remplaçant", select: "Sélectionner", approve: "Approuver et désigner", return: "Renvoyer", reason: "Motif obligatoire", links: "Documents", instructions: "Consignes", refresh: "Actualiser", error: "Échec de la validation.", saved: "Mise à jour enregistrée.", assigned: "Désigné" },
} as const;
const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function PlanosCoberturaDocenteAdmin({ professores, onDesignado }: { professores: Professor[]; onDesignado: () => void | Promise<void> }) {
  const locale = useLocale(); const t = textos[locale as keyof typeof textos] ?? textos["en-US"];
  const [planos, setPlanos] = useState<Plano[]>([]), [selecoes, setSelecoes] = useState<Record<number,string>>({}), [motivos, setMotivos] = useState<Record<number,string>>({});
  const [erro, setErro] = useState(""), [mensagem, setMensagem] = useState(""), [ocupado, setOcupado] = useState(false);
  async function carregar() {
    try { const res = await fetch("/api/admin/planos-cobertura", { cache: "no-store" }); const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.error || t.error); setPlanos(d.planos ?? []); }
    catch(e) { setErro(e instanceof Error ? e.message : t.error); }
  }
  useEffect(() => { void carregar(); }, []);
  async function revisar(id: number, acao: "APROVAR_E_DESIGNAR" | "DEVOLVER") {
    setOcupado(true); setErro(""); setMensagem("");
    try {
      const res = await fetch("/api/admin/planos-cobertura", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, acao, professorSubstitutoId: Number(selecoes[id]), motivo: motivos[id] || "" }) });
      const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.error || t.error);
      setMensagem(d.message || t.saved); await carregar(); if (acao === "APROVAR_E_DESIGNAR") await onDesignado();
    } catch(e) { setErro(e instanceof Error ? e.message : t.error); }
    finally { setOcupado(false); }
  }
  return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{t.title}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.desc}</p></div><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => void carregar()}>{t.refresh}</button></div>
    {erro && <p role="alert" className="rounded-lg border border-red-300 p-3 text-sm text-red-700 dark:text-red-300">{erro}</p>}{mensagem && <p role="status" className="rounded-lg border border-blue-300 p-3 text-sm">{mensagem}</p>}
    {!planos.length && <p className="text-sm text-slate-500">{t.empty}</p>}
    {planos.map(p => <article key={p.id} className="space-y-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
      <div className="flex flex-wrap justify-between gap-3"><div><strong>{p.titulo}</strong><p>{t.teacher}: {p.professorTitular.nome} · {t.class}: {p.turma.nome} · {t.subject}: {p.disciplina.nome}</p><p>{t.date}: {p.dataAula.slice(0,10)}</p></div><span className="font-semibold">{p.status}</span></div>
      <details><summary className="cursor-pointer font-semibold text-blue-700 dark:text-blue-300">{t.instructions} / {t.links}</summary><p className="mt-2 whitespace-pre-wrap">{p.orientacoes}</p>{p.materiais && <div className="mt-2 space-y-1">{p.materiais.split(/\r?\n/).filter(Boolean).map((link,i) => <p key={i}><a target="_blank" rel="noopener noreferrer" className="break-all text-blue-700 underline dark:text-blue-300" href={link}>{link}</a></p>)}</div>}</details>
      {p.devolutiva && <p className="text-amber-700 dark:text-amber-300">{p.devolutiva}</p>}
      {p.substituicaoDocente && <p>{t.assigned}: {p.substituicaoDocente.professorSubstituto.nome}</p>}
      {p.status === "ENVIADO" && <div className="grid gap-3 md:grid-cols-2">
        <label className="block font-semibold">{t.substitute}<select className={campo} value={selecoes[p.id] || ""} onChange={e => setSelecoes(s => ({ ...s, [p.id]: e.target.value }))}><option value="">{t.select}</option>{professores.filter(x => x.id !== p.professorTitularId).map(x => <option value={x.id} key={x.id}>{x.nome}</option>)}</select></label>
        <label className="block font-semibold">{t.reason}<textarea rows={2} maxLength={2000} className={campo} value={motivos[p.id] || ""} onChange={e => setMotivos(s => ({ ...s, [p.id]: e.target.value }))}/></label>
        <div className="flex flex-wrap gap-2 md:col-span-2"><button type="button" disabled={ocupado || !selecoes[p.id]} onClick={() => void revisar(p.id, "APROVAR_E_DESIGNAR")} className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">{t.approve}</button><button type="button" disabled={ocupado || !(motivos[p.id] || "").trim()} onClick={() => void revisar(p.id, "DEVOLVER")} className="rounded-lg border border-amber-400 px-4 py-2 text-amber-800 disabled:opacity-50 dark:text-amber-300">{t.return}</button></div>
      </div>}
    </article>)}
  </section>;
}
