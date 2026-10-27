"use client";
import Link from "next/link";
import { mensalidadeComDesconto } from "@/lib/matriculas/desconto-curso";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import withAuth from "@/lib/withAuth";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import { copySelecao } from "@/lib/matriculas/selecao-disciplinas-copy";
import { fimSugeridoLivre, type PeriodicidadeLivre, periodoEstaPago } from "@/lib/matriculas/cursos-livres";

type Curso = { id: number; nome: string; valorSemanal: string | null; valorMensalidade: number | null; descontoMensalidadePercentual?: string | number | null; turmas: { id: number; nome: string }[] };
type Periodo = { id: string; periodicidade: PeriodicidadeLivre; dataInicio: string; dataFim: string; valor: string; lancamentoId: number; lancamento: { status: string; valorPago: number; valorFinal: number } };
type Vinculo = { id: number; numeroMatricula: string; status: string; aluno: { id: number; nome: string }; curso: Omit<Curso, "turmas">; turmaPrincipal: { id: number; nome: string } | null; periodosCursoLivre: Periodo[]; _count: { periodosCursoLivre: number } };
const campo = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white";
const painel = "rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white";
function CursosLivresPage() {
  const t = useTranslations("CoursePeriods");
  const locale = useLocale();
  const params = useSearchParams();
  const [cursos, setCursos] = useState<Curso[]>([]), [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [alunos, setAlunos] = useState<{ id: number; nome: string }[]>([]), [busca, setBusca] = useState("");
  const [alunoId, setAlunoId] = useState(params.get("alunoId") || ""), [cursoId, setCursoId] = useState(params.get("cursoId") || "");
  const [turmaId, setTurmaId] = useState(""), [matriculaId, setMatriculaId] = useState(params.get("matriculaId") || "");
  const [tipo, setTipo] = useState<PeriodicidadeLivre>("SEMANAL");
  const [inicio, setInicio] = useState(""), [fim, setFim] = useState("");
  const [erro, setErro] = useState(""), [sucesso, setSucesso] = useState("");
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const [confirmacao, setConfirmacao] = useState<Record<string, unknown> | null>(null);
  const chave = useRef<{ pedido: string; id: string } | null>(null), operacao = useRef(false);
  const vinculo = vinculos.find(v => String(v.id) === matriculaId);
  const curso = vinculo?.curso || cursos.find(c => String(c.id) === cursoId);
  const valor = tipo === "SEMANAL" ? curso?.valorSemanal : mensalidadeComDesconto(curso?.valorMensalidade, curso?.descontoMensalidadePercentual);
  const moeda = (n: unknown) => new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(Number(n));
  const data = (s: string) => new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(s));
  const mensagem = useCallback((codigo?: string) => copySelecao(locale).errors[codigo || ""] || (t.has(`errors.${codigo}`) ? t(`errors.${codigo}`) : t("errors.ERRO_INTERNO")), [t, locale]);
  const carregar = useCallback(async (signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (alunoId) query.set("alunoId", alunoId);
    if (matriculaId) { query.set("matriculaId", matriculaId); query.set("pagina", String(pagina)); }
    const res = await fetch(`/api/admin/matriculas/cursos-livres?${query}`, { cache: "no-store", signal });
    const json = await res.json();
    if (!res.ok) throw new Error(mensagem(json.codigo));
    setCursos(json.cursos); setVinculos(json.matriculas);
  }, [alunoId, matriculaId, pagina, mensagem]);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true);
    carregar(abort.signal).catch(e => { if (!abort.signal.aborted) setErro(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [carregar, versao]);
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/admin/alunos/busca-simples?busca=${encodeURIComponent(busca)}`, { signal: abort.signal, cache: "no-store" })
        .then(async res => { if (!res.ok) throw new Error(mensagem()); return res.json(); })
        .then(json => setAlunos(Array.isArray(json) ? json : []))
        .catch(e => { if (!abort.signal.aborted) setErro(e.message); });
    }, 250);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [busca, mensagem]);
  function datas(novoInicio: string, novoTipo: PeriodicidadeLivre) {
    setInicio(novoInicio); setTipo(novoTipo); setFim(novoInicio ? fimSugeridoLivre(novoInicio, novoTipo) : "");
  }
  async function contratar(pedido: Record<string, unknown>) {
    if (operacao.current) return;
    operacao.current = true; setBusy(true); setErro(""); setSucesso("");
    const identificacao = JSON.stringify(pedido);
    if (!chave.current || chave.current.pedido !== identificacao) chave.current = { pedido: identificacao, id: crypto.randomUUID() };
    try {
      const res = await fetch("/api/admin/matriculas/cursos-livres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pedido, chave: chave.current.id }) });
      const json = await res.json();
      if (!res.ok) {
        if (json.codigo === "CONFIRMACAO_MENOR_NECESSARIA") { setConfirmacao(pedido); return; }
        throw new Error(mensagem(json.codigo));
      }
      chave.current = null; setMatriculaId(String(json.matriculaId)); setPagina(1);
      setSucesso(t("created")); setInicio(""); setFim("");
      setVersao(v => v + 1);
    } catch (e) { setErro(e instanceof Error ? e.message : mensagem()); }
    finally { operacao.current = false; setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl space-y-5 p-5">
    <Link href="/admin/matriculas" className="font-semibold text-blue-700 dark:text-blue-300">{t("back")}</Link>
    <header className={painel}><h1 className="text-2xl font-bold">{t("title")}</h1><p className="mt-2">{t("description")}</p></header>
    {erro && <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-950 dark:bg-red-950 dark:text-red-100">{erro}</p>}
    {sucesso && <p role="status" className="rounded-lg bg-emerald-100 p-3 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">{sucesso}</p>}
    <section className={painel}>
      <h2 className="text-lg font-bold">{t("contractPeriod")}</h2>
      <form className="mt-3 grid gap-4 md:grid-cols-2" onSubmit={e => { e.preventDefault(); void contratar({ ...(matriculaId ? { matriculaId } : { alunoId, cursoId, turmaId }), periodicidade: tipo, dataInicio: inicio, dataFim: fim }); }}>
        <fieldset disabled={busy || loading} className="contents">
          <label>{t("searchStudent")}<input className={campo} value={busca} onChange={e => setBusca(e.target.value)} /></label>
          <label>{t("student")}<select className={campo} value={alunoId} required={!matriculaId} onChange={e => { setAlunoId(e.target.value); setMatriculaId(""); setPagina(1); }}>
            <option value="">{t("choose")}</option>{alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select></label>
          <label className="md:col-span-2">{t("existingEnrollment")}<select className={campo} value={matriculaId} onChange={e => { setMatriculaId(e.target.value); setPagina(1); }}>
            <option value="">{t("newEnrollment")}</option>{vinculos.map(v => <option key={v.id} value={v.id}>{v.aluno.nome} · {v.curso.nome} · {v.numeroMatricula}</option>)}
          </select></label>
          {vinculo ? <p className="md:col-span-2">{vinculo.curso.nome} · {vinculo.turmaPrincipal?.nome}</p> : <>
            <label>{t("course")}<select required className={campo} value={cursoId} onChange={e => { setCursoId(e.target.value); setTurmaId(""); }}><option value="">{t("choose")}</option>{cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
            <label>{t("class")}<select required className={campo} value={turmaId} onChange={e => setTurmaId(e.target.value)}><option value="">{t("choose")}</option>{cursos.find(c => String(c.id) === cursoId)?.turmas.map(tr => <option key={tr.id} value={tr.id}>{tr.nome}</option>)}</select></label>
          </>}
          <label>{t("periodicity")}<select className={campo} value={tipo} onChange={e => datas(inicio, e.target.value as PeriodicidadeLivre)}><option value="SEMANAL">{t("SEMANAL")}</option><option value="MENSAL">{t("MENSAL")}</option></select></label>
          <p className="self-end py-2 font-semibold">{t("price")}: {valor == null ? t("unavailable") : moeda(valor)}</p>
          <label>{t("start")}<input required type="date" className={campo} value={inicio} onChange={e => datas(e.target.value, tipo)} /></label>
          <label>{t("end")}<input required type="date" min={inicio} className={campo} value={fim} onChange={e => setFim(e.target.value)} /></label>
          <p className="text-sm md:col-span-2">{t("datesHelp")}</p>
          <button disabled={valor == null || (vinculo && !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(vinculo.status))} className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? t("saving") : t("contractPeriod")}</button>
        </fieldset>
      </form>
      {!cursos.length && !loading && <p className="mt-4">{t("noCourses")} <Link className="underline" href="/admin/cursos">{t("configureCourse")}</Link></p>}
    </section>
    <section className={painel}>
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-bold">{t("history")}</h2><button disabled={busy || loading} onClick={() => void carregar().catch(e => setErro(e.message))} className="rounded-lg border px-3 py-2">{t("refresh")}</button></div>
      <p className="mt-2 text-sm">{t("paymentHelp")}</p>
      {!matriculaId && <p className="mt-2 text-sm">{t("listHelp")}</p>}
      {vinculos.map(v => <article key={v.id} className="mt-4 space-y-3 border-t border-slate-300 pt-4 dark:border-slate-600">
        <button className="text-left font-semibold text-blue-700 dark:text-blue-300" onClick={() => { setMatriculaId(String(v.id)); setPagina(1); }}>{v.aluno.nome} · {v.curso.nome} · {v.numeroMatricula}</button>
        {v.periodosCursoLivre.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-950">
          <p>{data(p.dataInicio)} – {data(p.dataFim)} · {t(p.periodicidade)} · {moeda(p.valor)} · <strong>{t(periodoEstaPago(p.lancamento) ? "paid" : p.lancamento.status === "CANCELADO" ? "cancelled" : "pending")}</strong></p>
          <Link className="rounded-lg border border-blue-600 px-3 py-2 text-blue-800 dark:text-blue-200" href={`/admin/financeiro/recebimentos?lancamentoId=${p.lancamentoId}`}>{t("financialEntry")}</Link>
        </div>)}
        {matriculaId && v._count.periodosCursoLivre > 20 && <div className="flex items-center gap-3"><button disabled={pagina <= 1 || loading} onClick={() => setPagina(pagina - 1)}>{t("previous")}</button><span>{pagina}</span><button disabled={pagina * 20 >= v._count.periodosCursoLivre || loading} onClick={() => setPagina(pagina + 1)}>{t("next")}</button></div>}
      </article>)}
      {!vinculos.length && !loading && <p className="mt-3">{t("empty")}</p>}
    </section>
    {confirmacao && <PhanyxConfirmModal aberto titulo={t("minorTitle")} mensagem={t("minorHelp")} textoConfirmar={t("confirm")} onCancelar={() => setConfirmacao(null)} onConfirmar={() => { const pedido = confirmacao; setConfirmacao(null); void contratar({ ...pedido, confirmacaoMenorAceita: true }); }} />}
  </main>;
}
export default withAuth(CursosLivresPage, ["admin"]);
