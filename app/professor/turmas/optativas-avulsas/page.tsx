"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirmDialog } from "@/components/providers/ConfirmDialogProvider";
import { STATUS_CHAMADA, type StatusChamada } from "@/lib/chamada-encontro";
import { copyTurmasAvulsas } from "@/lib/professor/turmas-avulsas-copy";

const api = "/api/professor/turmas/optativas-avulsas";
const campo = "mt-1 w-full rounded-lg border border-slate-400 bg-white p-2 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100";
type Sessao = { id: number; ativa: boolean; propria: boolean; diaSemana: number; horaInicio: string; horaFim: string;
  disciplina: { nome: string }; curso: { nome: string }; turmas: string[] };
type Pessoa = { id: number; nome: string };
type Aluno = { inscricaoId: number; alunoId: number; nome: string; turma: string; status: StatusChamada | "";
  observacao: string; editavel: boolean };
type Faixa = { inicio: string; fim: string; alunos: Pessoa[] };

export default function ChamadaOptativasAvulsasPage() {
  const locale = useLocale();
  const copy = copyTurmasAvulsas(locale);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [opcoes, setOpcoes] = useState<{ sessoes: Sessao[]; turmasRegencia: Pessoa[] } | null>(null);
  const [escolha, setEscolha] = useState("");
  const [data, setData] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [erro, setErro] = useState("");
  const [alunos, setAlunos] = useState<Aluno[] | null>(null);
  const [faixas, setFaixas] = useState<Faixa[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(api, { cache: "no-store", signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!controller.signal.aborted) setOpcoes(json);
      })
      .catch(() => { if (!controller.signal.aborted) setErro(copy.fetchError); });
    return () => controller.abort();
  }, [copy.fetchError]);

  async function alterarConsulta(mudar: () => void) {
    if (alterado && !await confirm({
      title: copy.discardTitle, message: copy.discardMessage,
      confirmText: copy.discardConfirm, cancelText: copy.discardCancel,
    })) return;
    setAlterado(false); setAlunos(null); setFaixas(null); setErro(""); mudar();
  }

  async function consultar() {
    const [chave, id] = escolha.split(":");
    const query = new URLSearchParams({ [chave]: id, data });
    setOcupado(true); setErro("");
    try {
      const res = await fetch(`${api}?${query}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errorCode === "invalidMeeting" ? copy.noTime : copy.loadError);
      if (chave === "turmaId") setFaixas(json);
      else setAlunos(json.alunos);
    } catch (error) {
      setErro(error instanceof Error ? error.message : copy.loadError);
    } finally { setOcupado(false); }
  }

  async function salvar() {
    const editaveis = alunos?.filter(a => a.editavel) ?? [];
    if (editaveis.some(a => !a.status)) { setErro(copy.invalidAttendance); return; }
    if (editaveis.some(a => ["JUSTIFICADA", "ATESTADO"].includes(a.status) && !a.observacao.trim())) {
      setErro(copy.invalidReason); return;
    }
    setOcupado(true); setErro("");
    try {
      const res = await fetch(api, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessaoId: Number(escolha.split(":")[1]), data,
          presencas: editaveis.map(({ alunoId, status, observacao }) => ({ alunoId, status, observacao })) }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(res.status === 409 ? "A lista mudou. Abra a chamada novamente antes de salvar." :
          json?.errorCode === "forbidden" ? copy.forbidden : copy.saveError);
      }
      setAlterado(false);
      showToast(copy.saved, "success");
    } catch (error) { setErro(error instanceof Error ? error.message : copy.saveError); }
    finally { setOcupado(false); }
  }

  return <main className="min-h-screen space-y-4 bg-slate-50 p-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <Link href="/professor/turmas/avulsas" className="text-blue-700 dark:text-blue-300">← {copy.backToList}</Link>
    <h1 className="text-2xl font-bold">Optativas e regência</h1>
    {erro && <p role="alert" className="text-red-700 dark:text-red-300">{erro}</p>}
    {!opcoes && !erro && <p role="status">{copy.loading}</p>}
    {opcoes && <fieldset disabled={ocupado} className="grid gap-3 rounded-xl border border-slate-300 p-4 dark:border-slate-700 md:grid-cols-2">
      <label>Sessão ou turma<select className={campo} value={escolha} onChange={event => {
        const valor = event.target.value;
        void alterarConsulta(() => setEscolha(valor));
      }}>
        <option value="">Selecione</option>
        {opcoes.sessoes.map(s => <option key={s.id} value={`sessaoId:${s.id}`}>
          {s.disciplina.nome} · {copy.days[s.diaSemana]} · {s.horaInicio}–{s.horaFim} · {s.turmas.join(", ")}{!s.ativa ? " · Arquivada" : ""}
        </option>)}
        {opcoes.turmasRegencia.map(t => <option key={t.id} value={`turmaId:${t.id}`}>Regência · {t.nome}</option>)}
      </select></label>
      <label>{copy.date}<input type="date" className={campo} value={data} onChange={event => {
        const valor = event.target.value;
        void alterarConsulta(() => setData(valor));
      }} /></label>
      <button type="button" disabled={!escolha || !data || alterado} onClick={() => void consultar()}
        className="w-fit rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Consultar</button>
      {alterado && <button type="button" onClick={() => void alterarConsulta(() => undefined)}>Descartar alterações</button>}
    </fieldset>}
    {alunos && <section className="space-y-3">
      <h2 className="text-lg font-semibold">{copy.studentsOnDate}</h2>
      {!alunos.length && <p>{copy.noStudents}</p>}
      {alunos.map(a => <fieldset key={a.inscricaoId} disabled={ocupado || !a.editavel}
        className="grid gap-2 rounded border border-slate-300 p-3 dark:border-slate-700 md:grid-cols-3">
        <p><strong>{a.nome}</strong> · {a.turma}</p>
        {a.editavel ? <>
          <label>{copy.status}<select className={campo} value={a.status} onChange={e => {
            const status = e.target.value as Aluno["status"];
            setAlunos(lista => lista?.map(x => x.inscricaoId === a.inscricaoId ? { ...x, status } : x) ?? null);
            setAlterado(true);
          }}>
            <option value="">{copy.unmarked}</option>
            {STATUS_CHAMADA.map(status => <option key={status} value={status}>{copy.statuses[status]}</option>)}
          </select></label>
          <label>{copy.observation}<input className={campo} maxLength={2000} value={a.observacao} onChange={e => {
            const observacao = e.target.value;
            setAlunos(lista => lista?.map(x => x.inscricaoId === a.inscricaoId ? { ...x, observacao } : x) ?? null);
            setAlterado(true);
          }} /></label>
        </> : <p>{a.status ? copy.statuses[a.status] : copy.unmarked}</p>}
      </fieldset>)}
      {alunos.some(a => a.editavel) && <button type="button" disabled={ocupado || !alterado} onClick={() => void salvar()}
        className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50">{copy.save}</button>}
    </section>}
    {faixas && <section className="space-y-3">
      <h2 className="text-lg font-semibold">Alunos na regência por horário</h2>
      {faixas.map(faixa => <article key={faixa.inicio} className="rounded border border-slate-300 p-3 dark:border-slate-700">
        <h3 className="font-semibold">{faixa.inicio}–{faixa.fim}</h3>
        <p>{faixa.alunos.map(a => a.nome).join(", ") || "Todos os alunos estão em atividades optativas neste horário."}</p>
      </article>)}
    </section>}
  </main>;
}
