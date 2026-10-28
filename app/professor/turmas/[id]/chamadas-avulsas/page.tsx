"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirmDialog } from "@/components/providers/ConfirmDialogProvider";
import { STATUS_CHAMADA, formatarDataEncontro, type StatusChamada } from "@/lib/chamada-encontro";
import { copyTurmasAvulsas } from "@/lib/professor/turmas-avulsas-copy";

type Horario = { diaSemana: number; horaInicio: string; horaFim: string };
type Turma = { id: number; nome: string; curso: { id: number; nome: string } | null; horarios: Horario[] };
type Aluno = { alunoId: number; nome: string; status: StatusChamada | ""; observacao: string };
type Encontro = { data: string; hora: string };
type Resposta = {
  turma: { id: number; nome: string };
  curso: { id: number; nome: string };
  encontro: Encontro & { salvo: boolean };
  alunos: Aluno[];
  historico: (Encontro & { alunos: number })[];
};
const painel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white";
function diaSemana(data: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const dt = new Date(`${data}T12:00:00.000Z`);
  return Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== data ? null : dt.getUTCDay();
}

export default function ChamadaTurmaAvulsaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const copy = copyTurmasAvulsas(locale);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [dados, setDados] = useState<Resposta | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState("");
  const numeroRequisicao = useRef(0);
  const alterado = dados !== null && JSON.stringify(alunos) !== JSON.stringify(dados.alunos);
  const horario = useMemo(() => {
    const dia = diaSemana(data);
    return dia === null || !turma ? [] : [...new Set(turma.horarios.filter(h => h.diaSemana === dia).map(h => h.horaInicio))].sort();
  }, [data, turma]);
  const visiveis = useMemo(() => {
    const termo = busca.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return alunos.filter(aluno => aluno.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(termo));
  }, [alunos, busca]);
  const ocupado = loading || consultando || salvando;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/professor/turmas/avulsas", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async r => {
        const json = await r.json();
        if (!r.ok || !Array.isArray(json)) throw new Error(json?.error || copy.loadError);
        const encontrada = json.find((t: Turma) => t.id === Number(id));
        if (!encontrada) throw new Error(copy.forbidden);
        if (!controller.signal.aborted) setTurma(encontrada);
      })
      .catch(error => { if (!controller.signal.aborted) setErro(error?.message || copy.loadError); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, copy.forbidden, copy.loadError]);

  async function permitirDescartar() {
    if (!alterado) return true;
    return confirm({ title: copy.discardTitle, message: copy.discardMessage,
      confirmText: copy.discardConfirm, cancelText: copy.discardCancel });
  }
  async function mudarSelecao(novaData: string, novaHora: string) {
    if (!await permitirDescartar()) return;
    ++numeroRequisicao.current;
    setData(novaData); setHora(novaHora); setDados(null); setAlunos([]); setBusca(""); setErro("");
  }
  async function abrir(encontro: Encontro, permitirAlterado = false) {
    if (!permitirAlterado && !await permitirDescartar()) return;
    const seq = ++numeroRequisicao.current;
    setConsultando(true); setErro("");
    try {
      const query = new URLSearchParams(encontro);
      const response = await fetch(`/api/professor/turmas/${encodeURIComponent(id)}/chamadas-avulsas?${query}`, {
        credentials: "include", cache: "no-store",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.errorCode || json?.error || copy.loadError);
      if (seq !== numeroRequisicao.current) return;
      setData(encontro.data); setHora(encontro.hora); setDados(json); setAlunos(json.alunos); setBusca("");
    } catch (error) {
      if (seq === numeroRequisicao.current) showToast(error instanceof Error ? error.message : copy.loadError, "error");
    } finally {
      if (seq === numeroRequisicao.current) setConsultando(false);
    }
  }
  function alterarAluno(alunoId: number, novo: Partial<Aluno>) {
    setAlunos(lista => lista.map(aluno => aluno.alunoId === alunoId ? { ...aluno, ...novo } : aluno));
  }
  async function salvar() {
    if (!dados || ocupado || !alunos.length) return;
    if (alunos.some(aluno => !aluno.status)) { showToast(copy.invalidAttendance, "error"); return; }
    if (alunos.some(aluno => (aluno.status === "JUSTIFICADA" || aluno.status === "ATESTADO") && !aluno.observacao.trim())) {
      showToast(copy.invalidReason, "error"); return;
    }
    setSalvando(true);
    try {
      const response = await fetch(`/api/professor/turmas/${encodeURIComponent(id)}/chamadas-avulsas`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dados.encontro.data, hora: dados.encontro.hora,
          presencas: alunos.map(a => ({ alunoId: a.alunoId, status: a.status, observacao: a.observacao.trim() || null })) }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.errorCode || json?.error || copy.saveError);
      showToast(copy.saved, "success");
      // Carrega novamente a lista e o historico que o servidor efetivamente salvou.
      const normalizados = alunos.map(a => ({ ...a, observacao: a.observacao.trim() }));
      setAlunos(normalizados);
      setDados({
        ...dados,
        alunos: normalizados,
        encontro: { ...dados.encontro, salvo: true },
        historico: [
          { data: dados.encontro.data, hora: dados.encontro.hora, alunos: normalizados.length },
          ...dados.historico.filter(h => h.data !== dados.encontro.data || h.hora !== dados.encontro.hora),
        ].slice(0, 50),
      });
      await abrir({ data: dados.encontro.data, hora: dados.encontro.hora }, true);
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.saveError, "error");
    } finally { setSalvando(false); }
  }
  return (
    <main className="min-h-screen space-y-5 bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:p-8">
      <button type="button" disabled={ocupado} className="font-semibold text-blue-700 disabled:opacity-50 dark:text-blue-300"
        onClick={async () => { if (await permitirDescartar()) router.push("/professor/turmas/avulsas"); }}>
        ← {copy.backToList}
      </button>
      <header className={painel}>
        <h1 className="text-2xl font-bold">{copy.attendanceTitle}</h1>
        {turma && <p className="mt-2 font-semibold">{turma.nome} · {turma.curso?.nome}</p>}
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{copy.selectMeeting}</p>
      </header>
      {loading && <p role="status">{copy.loading}</p>}
      {erro && <div role="alert" className={painel}><p className="text-red-800 dark:text-red-300">{erro}</p></div>}
      {turma && <section className={painel}>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1 text-sm font-semibold">{copy.date}
            <input type="date" className={campo} disabled={ocupado} value={data}
              onChange={event => { void mudarSelecao(event.target.value, ""); }} />
          </label>
          <label className="space-y-1 text-sm font-semibold">{copy.time}
            <select className={campo} disabled={ocupado || !horario.length} value={hora}
              onChange={event => { void mudarSelecao(data, event.target.value); }}>
              <option value="">{copy.time}</option>
              {horario.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
          <button type="button" disabled={ocupado || !data || !hora || !horario.includes(hora)}
            onClick={() => void abrir({ data, hora })}
            className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50">
            {copy.open}
          </button>
        </div>
        {data && !horario.length && <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{copy.noTime}</p>}
      </section>}
      {consultando && <p role="status">{copy.loading}</p>}
      {dados && <>
        <section className={painel}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{copy.studentsOnDate}: {alunos.length}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {formatarDataEncontro(dados.encontro.data, locale)} · {dados.encontro.hora} · {dados.encontro.salvo ? copy.existingMeeting : copy.newMeeting}
              </p>
            </div>
            {alterado && <span role="status" className="text-sm font-semibold text-amber-700 dark:text-amber-300">{copy.unsaved}</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="min-w-44 flex-1 text-sm"><span className="sr-only">{copy.search}</span>
              <input type="search" value={busca} onChange={event => setBusca(event.target.value)} className={campo} placeholder={copy.search} />
            </label>
            <button type="button" disabled={ocupado || !alunos.some(a => !a.status)}
              className="rounded-xl border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50 dark:text-emerald-200"
              onClick={() => setAlunos(lista => lista.map(a => a.status ? a : { ...a, status: "PRESENTE" }))}>
              {copy.markRemaining}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm" aria-live="polite">
            {STATUS_CHAMADA.map(status => <span key={status}>{copy.statuses[status]}: {alunos.filter(a => a.status === status).length}</span>)}
          </div>
          {!alunos.length && <p className="mt-4">{copy.noStudents}</p>}
          <div className="mt-4 space-y-3">
            {visiveis.map(aluno => <div key={aluno.alunoId} className="grid gap-3 rounded-xl border border-slate-300 p-4 dark:border-slate-700 sm:grid-cols-[1fr_190px]">
              <p className="self-center font-semibold">{aluno.nome}</p>
              <label className="space-y-1 text-sm"><span className="sr-only">{copy.status}: {aluno.nome}</span>
                <select className={campo} value={aluno.status} disabled={ocupado}
                  onChange={event => alterarAluno(aluno.alunoId, { status: event.target.value as StatusChamada | "" })}>
                  <option value="">{copy.unmarked}</option>
                  {STATUS_CHAMADA.map(status => <option key={status} value={status}>{copy.statuses[status]}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                {aluno.status === "JUSTIFICADA" || aluno.status === "ATESTADO" ? copy.reason : copy.observation}
                <textarea value={aluno.observacao} rows={2} maxLength={2000} className={campo} disabled={ocupado}
                  onChange={event => alterarAluno(aluno.alunoId, { observacao: event.target.value })} />
              </label>
            </div>)}
            {alunos.length > 0 && !visiveis.length && <p>{copy.noResults}</p>}
          </div>
          <button type="button" disabled={ocupado || !alunos.length || (!alterado && dados.encontro.salvo)}
            onClick={() => void salvar()} className="mt-5 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-50">
            {salvando ? copy.saving : copy.save}
          </button>
        </section>
        <section className={painel}>
          <h2 className="text-lg font-bold">{copy.history}</h2>
          {!dados.historico.length ? <p className="mt-2 text-sm">{copy.emptyHistory}</p> :
            <div className="mt-3 flex flex-wrap gap-2">
              {dados.historico.map(item => <button key={`${item.data}-${item.hora}`} type="button" disabled={ocupado}
                onClick={() => void abrir({ data: item.data, hora: item.hora })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800">
                {formatarDataEncontro(item.data, locale)} · {item.hora}
              </button>)}
            </div>}
        </section>
      </>}
    </main>
  );
}
