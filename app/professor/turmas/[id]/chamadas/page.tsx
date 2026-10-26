"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirmDialog } from "@/components/providers/ConfirmDialogProvider";
import { formatarDataEncontro, STATUS_CHAMADA, type StatusChamada } from "@/lib/chamada-encontro";

type Aluno = { periodoCursoLivre?: "PAGO" | "PENDENTE" | "SEM_PERIODO" | null; alunoId: number; nome: string; status: StatusChamada | ""; observacao: string };
type Selecao = { disciplinaId: string; data: string; hora: string };
type Resposta = {
  turma: { id: number; nome: string };
  disciplina: { id: number; nome: string };
  encontro: { data: string; hora: string; salvo: boolean };
  alunos: Aluno[];
  historico: { data: string; hora: string; alunos: number }[];
};
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:[color-scheme:dark]";
const panelClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900";

function hojeLocal() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

export default function ChamadaPorDataPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("ProfessorMeetingAttendance");
  const tl = useTranslations("CoursePeriods");
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [ofertas, setOfertas] = useState<{ disciplinaId: number; disciplina: { id: number; nome: string }; nome: string; horarios: { horaInicio: string }[] }[]>([]);
  const [selecao, setSelecao] = useState<Selecao>({ disciplinaId: search.get("disciplinaId") || "", data: "", hora: "" });
  const [dados, setDados] = useState<Resposta | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const sequencia = useRef(0);
  const alterado = dados !== null && JSON.stringify(alunos) !== JSON.stringify(dados.alunos);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setDados(null);
    fetch("/api/professor/turmas", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !Array.isArray(json)) throw new Error(t("errors.forbidden"));
        const lista = json.filter((item) => item.id === Number(id) && item.disciplina?.id);
        setOfertas(lista);
        if (!lista.length) throw new Error(t("errors.forbidden"));
        setSelecao((anterior) => {
          const oferta = lista.find((item) => String(item.disciplina.id) === anterior.disciplinaId) ?? (lista.length === 1 ? lista[0] : null);
          const horas: string[] = Array.from(new Set<string>(oferta?.horarios?.map((item: { horaInicio: string }) => item.horaInicio) ?? []));
          return { disciplinaId: oferta ? String(oferta.disciplina.id) : "", data: hojeLocal(), hora: horas.length === 1 ? horas[0] : "" };
        });
      })
      .catch((error) => { if (!controller.signal.aborted) setErro(error.message || t("errors.unexpected")); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [id, t]);

  function mensagemErro(json: { errorCode?: string }) {
    return t.has(`errors.${json?.errorCode}`) ? t(`errors.${json.errorCode}`) : t("errors.unexpected");
  }

  async function podeDescartar() {
    return !alterado || await confirm({ title: t("discard.title"), message: t("discard.message"), confirmText: t("discard.confirm"), cancelText: t("discard.cancel") });
  }

  async function abrir(encontro: Selecao) {
    if (!await podeDescartar()) return;
    const atual = ++sequencia.current;
    setCarregando(true);
    setErro("");
    try {
      const query = new URLSearchParams(encontro);
      const res = await fetch(`/api/professor/turmas/${id}/chamadas?${query}`, { credentials: "include", cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(mensagemErro(json));
      if (atual !== sequencia.current) return;
      setSelecao(encontro);
      setDados(json);
      setAlunos(json.alunos);
      setBusca("");
    } catch (error) {
      if (atual === sequencia.current) showToast(error instanceof Error ? error.message : t("errors.unexpected"), "error");
    } finally { if (atual === sequencia.current) setCarregando(false); }
  }

  async function salvar() {
    if (!dados || salvando) return;
    if (alunos.some((aluno) => !aluno.status)) { showToast(t("errors.invalidAttendance"), "error"); return; }
    if (alunos.some((aluno) => (aluno.status === "JUSTIFICADA" || aluno.status === "ATESTADO") && !aluno.observacao.trim())) {
      showToast(t("errors.reasonRequired"), "error"); return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`/api/professor/turmas/${id}/chamadas`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplinaId: dados.disciplina.id, data: dados.encontro.data, hora: dados.encontro.hora, presencas: alunos }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(mensagemErro(json));
      const normalizados = alunos.map((aluno) => ({ ...aluno, observacao: aluno.observacao.trim() }));
      setAlunos(normalizados);
      setDados({ ...dados, alunos: normalizados, encontro: { ...dados.encontro, salvo: true },
        historico: [{ ...dados.encontro, alunos: alunos.length }, ...dados.historico.filter((item) => item.data !== dados.encontro.data || item.hora !== dados.encontro.hora)].slice(0, 50) });
      showToast(t("saved"), "success");
    } catch (error) { showToast(error instanceof Error ? error.message : t("errors.unexpected"), "error"); }
    finally { setSalvando(false); }
  }

  function atualizarAluno(alunoId: number, alteracao: Partial<Aluno>) {
    setAlunos((atual) => atual.map((aluno) => aluno.alunoId === alunoId ? { ...aluno, ...alteracao } : aluno));
  }

  const oferta = ofertas.find((item) => String(item.disciplina.id) === selecao.disciplinaId);
  const bloqueado = carregando || salvando;
  const buscaNormalizada = busca.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visiveis = alunos.filter((aluno) => aluno.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(buscaNormalizada));

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 text-slate-900 dark:text-slate-100 md:p-8">
      <button type="button" disabled={bloqueado} className="font-semibold text-blue-700 dark:text-blue-300" onClick={async () => { if (await podeDescartar()) router.push("/professor/turmas"); }}>{t("back")}</button>
      <header className={panelClass}>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
        {ofertas[0] && <p className="mt-3 font-semibold">{ofertas[0].nome}</p>}
      </header>
      {erro ? <div role="alert" className={panelClass}>{erro}</div> : <form className={`${panelClass} grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4`} onSubmit={(event) => { event.preventDefault(); void abrir(selecao); }}>
        <label className="space-y-1 text-sm font-semibold">{t("subject")}
          <select required disabled={bloqueado} className={inputClass} value={selecao.disciplinaId} onChange={(event) => setSelecao({ ...selecao, disciplinaId: event.target.value, hora: "" })}>
            <option value="">{t("chooseSubject")}</option>
            {ofertas.map((item) => <option key={item.disciplina.id} value={item.disciplina.id}>{item.disciplina.nome}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold">{t("date")}<input type="date" required disabled={bloqueado} className={inputClass} value={selecao.data} onChange={(event) => setSelecao({ ...selecao, data: event.target.value })} /></label>
        <label className="space-y-1 text-sm font-semibold">{t("time")}<input type="time" required list="horarios-chamada" disabled={bloqueado} className={inputClass} value={selecao.hora} onChange={(event) => setSelecao({ ...selecao, hora: event.target.value })} />
          <datalist id="horarios-chamada">{Array.from(new Set(oferta?.horarios.map((item) => item.horaInicio))).map((hora) => <option key={hora} value={hora} />)}</datalist>
        </label>
        <button type="submit" disabled={bloqueado} className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{carregando ? t("loading") : t("open")}</button>
      </form>}
      {dados && <>
        <section className={panelClass} aria-busy={bloqueado}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-bold">{dados.disciplina.nome}</h2><p className="mt-1 font-semibold">{formatarDataEncontro(dados.encontro.data, locale)} • {dados.encontro.hora}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dados.encontro.salvo ? t("existing") : t("newMeeting")}</p></div>
            <p role="status" className="text-sm font-semibold text-amber-800 dark:text-amber-200">{alterado ? t("unsaved") : ""}</p>
          </div>
          <div className="my-4 flex flex-wrap gap-3">
            <label className="min-w-48 flex-1 text-sm"><span className="sr-only">{t("search")}</span><input type="search" className={inputClass} value={busca} placeholder={t("search")} onChange={(event) => setBusca(event.target.value)} /></label>
            <button type="button" disabled={bloqueado || !alunos.some((aluno) => !aluno.status)} className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50 dark:text-emerald-200" onClick={() => setAlunos((lista) => lista.map((aluno) => aluno.status ? aluno : { ...aluno, status: "PRESENTE" }))}>{t("markRemainingPresent")}</button>
          </div>
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-live="polite">
            <span>{t("students", { count: alunos.length })}</span>
            {STATUS_CHAMADA.map((status) => <span key={status}>{t(`statuses.${status}`)}: {alunos.filter((aluno) => aluno.status === status).length}</span>)}
          </div>
          {!alunos.length ? <p className="py-6">{t("empty")}</p> : <div className="space-y-3">
            {visiveis.map((aluno) => <div key={aluno.alunoId} className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 md:grid-cols-[1fr_200px]">
              <div className="self-center"><p className="font-semibold">{aluno.nome}</p>{aluno.periodoCursoLivre && <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{tl(`attendance.${aluno.periodoCursoLivre}`)}</p>}</div>
              <label className="text-sm"><span className="sr-only">{t("statusFor", { name: aluno.nome })}</span>
                <select value={aluno.status} disabled={bloqueado} className={inputClass} onChange={(event) => atualizarAluno(aluno.alunoId, { status: event.target.value as StatusChamada | "" })}>
                  <option value="">{t("unmarked")}</option>{STATUS_CHAMADA.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">{aluno.status === "JUSTIFICADA" || aluno.status === "ATESTADO" ? t("reason") : t("observation")}
                <textarea rows={2} maxLength={2000} disabled={bloqueado} value={aluno.observacao} className={inputClass} onChange={(event) => atualizarAluno(aluno.alunoId, { observacao: event.target.value })} />
              </label>
            </div>)}
            {!visiveis.length && <p>{t("noSearchResults")}</p>}
          </div>}
          <button type="button" disabled={bloqueado || !alunos.length || (!alterado && dados.encontro.salvo)} onClick={() => void salvar()} className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{salvando ? t("saving") : t("save")}</button>
        </section>
        <section className={panelClass}><h2 className="text-lg font-bold">{t("history")}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("historyHint")}</p>
          {!dados.historico.length ? <p className="mt-3 text-sm">{t("emptyHistory")}</p> : <div className="mt-3 flex flex-wrap gap-2">{dados.historico.map((item) => <button key={`${item.data}-${item.hora}`} type="button" disabled={bloqueado} onClick={() => void abrir({ disciplinaId: String(dados.disciplina.id), data: item.data, hora: item.hora })} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">{formatarDataEncontro(item.data, locale)} • {item.hora}</button>)}</div>}
        </section>
      </>}
    </main>
  );
}
