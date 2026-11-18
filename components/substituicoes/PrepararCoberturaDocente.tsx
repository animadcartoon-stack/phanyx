"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type Vinculo = { turmaId: number; disciplinaId: number; turma: { nome: string }; disciplina: { nome: string } };
type Plano = {
  id: number; turmaId: number; disciplinaId: number; dataAula: string; titulo: string;
  orientacoes: string; materiais: string | null; status: string; devolutiva: string | null;
  turma: { nome: string }; disciplina: { nome: string };
  substituicaoDocente: { professorSubstituto: { nome: string } } | null;
};
const vazio = { vinculo: "", dataAula: "", titulo: "", orientacoes: "", materiais: "" };
const textos = {
  "pt-BR": { heading: "Preparar aula para minha ausência", lead: "Deixe instruções para a coordenação organizar a cobertura e designar outro professor. Não publica tarefas diretamente aos alunos.", class: "Turma e disciplina", date: "Data da aula", title: "Tema da aula", instructions: "Orientações para o substituto", material: "Links dos materiais (um por linha)", submit: "Enviar plano à coordenação", resend: "Reenviar plano corrigido", cancel: "Cancelar edição", records: "Minhas solicitações de cobertura", empty: "Nenhum plano de cobertura enviado.", edit: "Corrigir e reenviar", teacher: "Substituto", sent: "Plano enviado à coordenação.", error: "Falha ao registrar o plano.", choose: "Selecione", feedback: "Devolutiva da coordenação" },
  "pt-PT": { heading: "Preparar aula para a minha ausência", lead: "Deixe instruções para a coordenação organizar a substituição. Não publica tarefas diretamente para os alunos.", class: "Turma e disciplina", date: "Data da aula", title: "Tema da aula", instructions: "Orientações para o substituto", material: "Ligações para materiais (uma por linha)", submit: "Enviar à coordenação", resend: "Reenviar plano corrigido", cancel: "Cancelar edição", records: "Pedidos de substituição", empty: "Nenhum plano enviado.", edit: "Corrigir e reenviar", teacher: "Substituto", sent: "Plano enviado à coordenação.", error: "Não foi possível enviar o plano.", choose: "Selecione", feedback: "Resposta da coordenação" },
  "en-US": { heading: "Prepare a lesson for my absence", lead: "Provide instructions for coordination to assign a substitute. This does not publish assignments to students.", class: "Class and subject", date: "Lesson date", title: "Lesson topic", instructions: "Instructions for substitute", material: "Material links (one per line)", submit: "Send plan to coordination", resend: "Resubmit revised plan", cancel: "Cancel edit", records: "My coverage requests", empty: "No coverage plans submitted.", edit: "Revise and resubmit", teacher: "Substitute", sent: "Plan sent to coordination.", error: "Could not submit the plan.", choose: "Select", feedback: "Coordination feedback" },
  "es-ES": { heading: "Preparar clase para mi ausencia", lead: "Deje indicaciones para que coordinación asigne un sustituto. No publica tareas a los alumnos.", class: "Grupo y asignatura", date: "Fecha de clase", title: "Tema", instructions: "Instrucciones para sustituto", material: "Enlaces de materiales (uno por línea)", submit: "Enviar a coordinación", resend: "Reenviar plan corregido", cancel: "Cancelar edición", records: "Mis solicitudes", empty: "No hay planes enviados.", edit: "Corregir y reenviar", teacher: "Sustituto", sent: "Plan enviado.", error: "No se pudo enviar.", choose: "Seleccione", feedback: "Comentarios de coordinación" },
  "fr-FR": { heading: "Préparer un cours en cas d'absence", lead: "Donnez des consignes pour que la coordination désigne un remplaçant. Aucune activité n'est publiée directement aux élèves.", class: "Classe et matière", date: "Date du cours", title: "Sujet", instructions: "Consignes pour le remplaçant", material: "Liens vers les documents (un par ligne)", submit: "Envoyer à la coordination", resend: "Renvoyer le plan corrigé", cancel: "Annuler", records: "Mes demandes", empty: "Aucun plan envoyé.", edit: "Corriger et renvoyer", teacher: "Remplaçant", sent: "Plan envoyé.", error: "Échec de l'envoi.", choose: "Sélectionner", feedback: "Retour de la coordination" },
} as const;
const campo = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function PrepararCoberturaDocente() {
  const locale = useLocale();
  const t = textos[locale as keyof typeof textos] ?? textos["en-US"];
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  async function carregar() {
    try {
      const resposta = await fetch("/api/professor/planos-cobertura", { cache: "no-store" });
      const d = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(d.error || t.error);
      setVinculos(d.vinculos ?? []); setPlanos(d.planos ?? []);
    } catch (e) { setMensagem(e instanceof Error ? e.message : t.error); }
  }
  useEffect(() => { void carregar(); }, []);
  function editar(p: Plano) {
    setEditando(p.id);
    setForm({ vinculo: `${p.turmaId}:${p.disciplinaId}`, dataAula: p.dataAula.slice(0, 10), titulo: p.titulo, orientacoes: p.orientacoes, materiais: p.materiais || "" });
    setMensagem("");
  }
  async function enviar() {
    setOcupado(true); setMensagem("");
    try {
      const [turmaId, disciplinaId] = form.vinculo.split(":").map(Number);
      const resposta = await fetch("/api/professor/planos-cobertura", {
        method: editando ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editando ? { id: editando, titulo: form.titulo, orientacoes: form.orientacoes, materiais: form.materiais } : { turmaId, disciplinaId, dataAula: form.dataAula, titulo: form.titulo, orientacoes: form.orientacoes, materiais: form.materiais }),
      });
      const d = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(d.error || t.error);
      setEditando(null); setForm(vazio); setMensagem(t.sent); await carregar();
    } catch (e) { setMensagem(e instanceof Error ? e.message : t.error); }
    finally { setOcupado(false); }
  }
  return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
    <div><h2 className="text-xl font-bold">{t.heading}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.lead}</p></div>
    {mensagem && <p role="status" className="rounded-lg border border-blue-300 p-3 text-sm dark:border-blue-700">{mensagem}</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">{t.class}<select className={campo} disabled={editando !== null} value={form.vinculo} onChange={e => setForm(s => ({ ...s, vinculo: e.target.value }))}><option value="">{t.choose}</option>{vinculos.map((v,i) => <option key={`${v.turmaId}:${v.disciplinaId}:${i}`} value={`${v.turmaId}:${v.disciplinaId}`}>{v.turma.nome} — {v.disciplina.nome}</option>)}</select></label>
      <label className="text-sm font-semibold">{t.date}<input type="date" className={campo} disabled={editando !== null} value={form.dataAula} onChange={e => setForm(s => ({ ...s, dataAula: e.target.value }))}/></label>
    </div>
    <label className="block text-sm font-semibold">{t.title}<input className={campo} maxLength={150} value={form.titulo} onChange={e => setForm(s => ({ ...s, titulo: e.target.value }))}/></label>
    <label className="block text-sm font-semibold">{t.instructions}<textarea className={campo} rows={4} maxLength={6000} value={form.orientacoes} onChange={e => setForm(s => ({ ...s, orientacoes: e.target.value }))}/></label>
    <label className="block text-sm font-semibold">{t.material}<textarea className={campo} rows={2} maxLength={4500} value={form.materiais} onChange={e => setForm(s => ({ ...s, materiais: e.target.value }))}/></label>
    <div className="flex flex-wrap gap-2"><button type="button" disabled={ocupado || !form.vinculo || !form.dataAula || !form.titulo.trim() || !form.orientacoes.trim()} onClick={() => void enviar()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{editando ? t.resend : t.submit}</button>{editando !== null && <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setEditando(null); setForm(vazio); }}>{t.cancel}</button>}</div>
    <div className="space-y-2"><h3 className="font-semibold">{t.records}</h3>{planos.length === 0 && <p className="text-sm text-slate-500">{t.empty}</p>}{planos.map(p => <article key={p.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><strong>{p.titulo} · {p.turma.nome} · {p.disciplina.nome}</strong><span>{p.status}</span></div><p>{p.dataAula.slice(0,10)}</p>{p.devolutiva && <p className="mt-1 text-amber-700 dark:text-amber-300">{t.feedback}: {p.devolutiva}</p>}{p.substituicaoDocente && <p>{t.teacher}: {p.substituicaoDocente.professorSubstituto.nome}</p>}{p.status === "DEVOLVIDO" && <button type="button" onClick={() => editar(p)} className="mt-2 rounded-lg border border-blue-500 px-3 py-1 text-blue-700 dark:text-blue-300">{t.edit}</button>}</article>)}</div>
  </section>;
}
