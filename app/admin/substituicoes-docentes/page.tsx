"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

type StatusSubstituicao =
  | "AGENDADA"
  | "ATIVA"
  | "SUSPENSA"
  | "ENCERRADA"
  | "CANCELADA";

type Professor = {
  id: number;
  nome: string;
};

type Curso = {
  id: number;
  nome: string;
};

type Turma = {
  id: number;
  nome: string;
  cursoId?: number | null;
};

type Disciplina = {
  id: number;
  nome: string;
  cursoId?: number | null;
};

type VinculoTitular = {
  id: number;
  professorTitularId: number;
  turmaId: number;
  turmaNome: string;
  disciplinaId: number;
  disciplinaNome: string;
  cursoId?: number | null;
  cursoNome: string;
};

type SubstituicaoDocente = {
  id: number;
  status: StatusSubstituicao;
  professorTitular?: Professor | null;
  professorSubstituto?: Professor | null;
  curso?: Curso | null;
  turma?: Turma | null;
  disciplina?: Disciplina | null;
  dataInicio: string;
  dataFim?: string | null;
  motivo?: string | null;
  observacoes?: string | null;
};

type FeedbackTipo = "sucesso" | "erro" | "";

const motivosSubstituicao = [
  "Licença médica",
  "Licença maternidade",
  "Férias",
  "Capacitação",
  "Afastamento",
  "Vacância",
  "Outro",
];

export default function SubstituicoesDocentesPage() {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
  const [substituicoes, setSubstituicoes] = useState<SubstituicaoDocente[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [vinculosTitular, setVinculosTitular] = useState<VinculoTitular[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [substituicaoVisualizada, setSubstituicaoVisualizada] =
    useState<SubstituicaoDocente | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const [professorTitularId, setProfessorTitularId] = useState("");
  const [professorSubstitutoId, setProfessorSubstitutoId] = useState("");
  const [vinculoSelecionadoId, setVinculoSelecionadoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [semDataFim, setSemDataFim] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoOutro, setMotivoOutro] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [permissoesAberto, setPermissoesAberto] = useState(false);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);

    setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);
  }

  async function carregarDados() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/substituicoes-docentes", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (json?.error || t("substitutionsLoadError")) : t("substitutionsLoadError")));
      }

      setSubstituicoes(Array.isArray(json.items) ? json.items : []);
      setProfessores(Array.isArray(json.professores) ? json.professores : []);
      setVinculosTitular(
        Array.isArray(json.vinculosTitular) ? json.vinculosTitular : []
      );
    } catch (e: any) {
      mostrarFeedback(
        "erro",
        (locale.startsWith("pt") ? (e?.message || t("substitutionsLoadError")) : t("substitutionsLoadError"))
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const vinculosDoTitular = useMemo(() => {
    if (!professorTitularId) return [];

    return vinculosTitular.filter(
      (item) => String(item.professorTitularId) === professorTitularId
    );
  }, [vinculosTitular, professorTitularId]);

  const vinculoSelecionado = useMemo(() => {
    if (!vinculoSelecionadoId) return null;

    return (
      vinculosTitular.find(
        (item) => String(item.id) === String(vinculoSelecionadoId)
      ) || null
    );
  }, [vinculosTitular, vinculoSelecionadoId]);

  const professoresSubstitutos = useMemo(() => {
    if (!professorTitularId) return professores;

    return professores.filter(
      (professor) => String(professor.id) !== professorTitularId
    );
  }, [professores, professorTitularId]);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return substituicoes.filter((item) => {
      const texto = [
        item.professorTitular?.nome,
        item.professorSubstituto?.nome,
        item.curso?.nome,
        item.turma?.nome,
        item.disciplina?.nome,
        item.status,
        item.motivo,
      ]
        .join(" ")
        .toLowerCase();

      const bateBusca = !termo || texto.includes(termo);
      const bateStatus = !filtroStatus || item.status === filtroStatus;

      return bateBusca && bateStatus;
    });
  }, [substituicoes, busca, filtroStatus]);

  const resumo = useMemo(() => {
    return {
      ativas: substituicoes.filter((s) => s.status === "ATIVA").length,
      agendadas: substituicoes.filter((s) => s.status === "AGENDADA").length,
      encerradas: substituicoes.filter((s) => s.status === "ENCERRADA").length,
      canceladas: substituicoes.filter((s) => s.status === "CANCELADA").length,
      total: substituicoes.length,
    };
  }, [substituicoes]);

  function limparFormulario() {
    setProfessorTitularId("");
    setProfessorSubstitutoId("");
    setVinculoSelecionadoId("");
    setDataInicio("");
    setDataFim("");
    setSemDataFim(false);
    setMotivo("");
    setMotivoOutro("");
    setObservacoes("");
    setPermissoesAberto(false);
  }

  async function criarSubstituicao(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);

      if (!vinculoSelecionado) {
        throw new Error(t("substitutionsSelectError"));
      }

      const motivoFinal =
        motivo === "Outro" ? motivoOutro.trim() : motivo.trim();

      const res = await fetch("/api/admin/substituicoes-docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          professorTitularId: Number(professorTitularId),
          professorSubstitutoId: Number(professorSubstitutoId),
          turmaId: Number(vinculoSelecionado.turmaId),
          disciplinaId: Number(vinculoSelecionado.disciplinaId),
          dataInicio,
          dataFim: semDataFim ? null : dataFim || null,
          semDataFim,
          motivo: motivoFinal || null,
          observacoes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (json?.error || t("substitutionsCreateError")) : t("substitutionsCreateError")));
      }

      limparFormulario();
      setModalAberto(false);
      await carregarDados();
      mostrarFeedback("sucesso", t("substitutionsCreated"));
    } catch (e: any) {
      mostrarFeedback("erro", (locale.startsWith("pt") ? (e?.message || t("substitutionsCreateError")) : t("substitutionsCreateError")));
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString(locale, { timeZone: "UTC" });
  }

  function statusClasse(status: StatusSubstituicao) {
    if (status === "ATIVA") return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300";
    if (status === "AGENDADA") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    if (status === "ENCERRADA") return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    if (status === "CANCELADA") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-300";
  }

  async function alterarStatusSubstituicao(
    id: number,
    acao: "ENCERRAR" | "SUSPENDER" | "REATIVAR" | "CANCELAR"
  ) {
    try {
      setSalvando(true);

      const res = await fetch("/api/admin/substituicoes-docentes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, acao }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (json?.error || t("substitutionsUpdateError")) : t("substitutionsUpdateError")));
      }

      await carregarDados();
      mostrarFeedback("sucesso", t("substitutionsUpdated"));
    } catch (e: any) {
      mostrarFeedback("erro", (locale.startsWith("pt") ? (e?.message || t("substitutionsUpdateError")) : t("substitutionsUpdateError")));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-substituicoes-page space-y-6 text-slate-900 dark:text-slate-100">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${feedbackTipo === "sucesso"
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
            : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            }`}
        >
          {feedback}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
              {t("commonAcademic")}
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {t("substitutionsTitle")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("substitutionsIntro")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            {t("substitutionsNew")}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [t("substitutionsActivePlural"), resumo.ativas],
          [t("substitutionsScheduledPlural"), resumo.agendadas],
          [t("substitutionsClosedPlural"), resumo.encerradas],
          [t("substitutionsCancelledPlural"), resumo.canceladas],
          [t("commonTotal"), resumo.total],
        ].map(([label, valor]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {valor}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t("substitutionsSearch")}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">{t("commonAllStatuses")}</option>
            <option value="AGENDADA">{t("substitutionsScheduled")}</option>
            <option value="ATIVA">Ativa</option>
            <option value="SUSPENSA">{t("substitutionsSuspended")}</option>
            <option value="ENCERRADA">{t("substitutionsClosed")}</option>
            <option value="CANCELADA">{t("substitutionsCancelled")}</option>
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            {t("substitutionsRecords")}
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            {t("substitutionsLoading")}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            {t("substitutionsEmpty")}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t("commonStatus")}</th>
                    <th className="px-4 py-3">{t("substitutionsOwner")}</th>
                    <th className="px-4 py-3">{t("substitutionsSubstitute")}</th>
                    <th className="px-4 py-3">{t("commonClass")}</th>
                    <th className="px-4 py-3">{t("commonSubject")}</th>
                    <th className="px-4 py-3">{t("substitutionsStart")}</th>
                    <th className="px-4 py-3">{t("substitutionsEnd")}</th>
                    <th className="px-4 py-3">{t("substitutionsActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasse(item.status)}`}>
                          {t(({ AGENDADA: "substitutionsScheduled", ATIVA: "classesActive", SUSPENSA: "substitutionsSuspended", ENCERRADA: "substitutionsClosed", CANCELADA: "substitutionsCancelled" } as const)[item.status])}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.professorTitular?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.professorSubstituto?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.turma?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {item.disciplina?.nome || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatarData(item.dataInicio)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatarData(item.dataFim)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSubstituicaoVisualizada(item)}
                            className="phanyx-substituicoes-visualizar rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold transition dark:border-slate-700"
                          >
                            {t("substitutionsView")}
                          </button>

                          {item.status === "ATIVA" && (
                            <>
                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "SUSPENDER")}
                                disabled={salvando}
                                className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                              >
                                {t("substitutionsSuspend")}
                              </button>

                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "ENCERRAR")}
                                disabled={salvando}
                                className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-60"
                              >
                                {t("substitutionsFinish")}
                              </button>
                            </>
                          )}

                          {item.status === "SUSPENSA" && (
                            <>
                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "REATIVAR")}
                                disabled={salvando}
                                className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-60"
                              >
                                {t("substitutionsReactivate")}
                              </button>

                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "ENCERRAR")}
                                disabled={salvando}
                                className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-800 transition hover:bg-green-100 disabled:opacity-60"
                              >
                                {t("substitutionsFinish")}
                              </button>
                            </>
                          )}

                          {(item.status === "AGENDADA" ||
                            item.status === "ATIVA" ||
                            item.status === "SUSPENSA") && (
                              <button
                                type="button"
                                onClick={() => alterarStatusSubstituicao(item.id, "CANCELAR")}
                                disabled={salvando}
                                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                {t("commonCancel")}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {listaFiltrada.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasse(item.status)}`}>
                      {t(({ AGENDADA: "substitutionsScheduled", ATIVA: "classesActive", SUSPENSA: "substitutionsSuspended", ENCERRADA: "substitutionsClosed", CANCELADA: "substitutionsCancelled" } as const)[item.status])}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatarData(item.dataInicio)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <strong>{t("commonOwnerPrefix")}</strong>{" "}
                      {item.professorTitular?.nome || "-"}
                    </p>
                    <p>
                      <strong>{t("commonSubstitutePrefix")}</strong>{" "}
                      {item.professorSubstituto?.nome || "-"}
                    </p>
                    <p>
                      <strong>{t("commonClassPrefix")}</strong> {item.turma?.nome || "-"}
                    </p>
                    <p>
                      <strong>{t("commonSubjectPrefix")}</strong>{" "}
                      {item.disciplina?.nome || "-"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {modalAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {t("substitutionsNewTitle")}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("substitutionsModalHelp")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="phanyx-substituicoes-fechar rounded-full px-3 py-1 text-sm font-bold transition"
              >
                {t("commonClose")}
              </button>
            </div>

            <form onSubmit={criarSubstituicao} className="mt-6 grid gap-4 md:grid-cols-2">
              <select required value={professorTitularId} onChange={(e) => setProfessorTitularId(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">{t("commonPrimaryTeacher")}</option>
                {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>

              <select required value={professorSubstitutoId} onChange={(e) => setProfessorSubstitutoId(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">{t("commonSubstituteTeacher")}</option>
                {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>

              <select
                required
                value={vinculoSelecionadoId}
                onChange={(e) => setVinculoSelecionadoId(e.target.value)}
                className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              >
                <option value="">
                  {t("substitutionsSelectAssignment")}
                </option>

                {vinculosDoTitular.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.turmaNome} • {v.disciplinaNome}
                  </option>
                ))}
              </select>

              {vinculoSelecionado && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30 md:col-span-2">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        {t("commonCourse")}
                      </p>
                      <p className="font-semibold">
                        {vinculoSelecionado.cursoNome}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        {t("commonClass")}
                      </p>
                      <p className="font-semibold">
                        {vinculoSelecionado.turmaNome}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        {t("commonSubject")}
                      </p>
                      <p className="font-semibold">
                        {vinculoSelecionado.disciplinaNome}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 mt-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t("substitutionsPeriod")}
                </h3>
              </div>

              <input aria-label={t("commonStartDate")} required type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900" />

              <input aria-label={t("commonEndDate")} type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900" />

              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={t("substitutionsReasonPlaceholder")} className="rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900 md:col-span-2" />

              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder={t("substitutionsObservations")} className="min-h-28 rounded-2xl border p-3 dark:border-slate-700 dark:bg-slate-900 md:col-span-2" />

              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                <button type="button" onClick={() => setModalAberto(false)} className="rounded-2xl border px-5 py-3 text-sm font-bold dark:border-slate-700">
                  {t("commonCancel")}
                </button>

                <button disabled={salvando} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
                  {salvando ? t("visitorsSaving") : t("substitutionsRegister")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {substituicaoVisualizada && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                  {t("substitutionsOfficial")}
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  {t("substitutionsSingular")}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("substitutionsDetailHelp")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSubstituicaoVisualizada(null)}
                className="phanyx-substituicoes-fechar rounded-full px-3 py-1 text-sm font-bold transition"
              >
                {t("commonClose")}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("commonStatus")}
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {t(({ AGENDADA: "substitutionsScheduled", ATIVA: "classesActive", SUSPENSA: "substitutionsSuspended", ENCERRADA: "substitutionsClosed", CANCELADA: "substitutionsCancelled" } as const)[substituicaoVisualizada.status])}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("substitutionsPeriod")}
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {formatarData(substituicaoVisualizada.dataInicio)} {t("substitutionsUntil")}{" "}
                  {formatarData(substituicaoVisualizada.dataFim)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("commonPrimaryTeacher")}
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.professorTitular?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("commonSubstituteTeacher")}
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.professorSubstituto?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("commonCourse")}
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.curso?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("commonClass")}
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.turma?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("commonSubject")}
                </p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                  {substituicaoVisualizada.disciplina?.nome || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("substitutionsReason")}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {substituicaoVisualizada.motivo || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  {t("substitutionsObservations")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {substituicaoVisualizada.observacoes || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
