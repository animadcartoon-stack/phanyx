"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import withAuth from "@/components/auth/withAuth";
import CentralAvisosPhanyx from "@/components/phanyx/CentralAvisosPhanyx";

type DashboardAlunoResponse = {
  aluno: {
    id: number;
    userId: number;
    nome?: string;
    fotoPerfil?: string | null;
  };
  resumo: {
    totalDisciplinas: number;
    totalProvasConcluidas: number;
    mediaGeral: number;
  };
  ultimasProvas: {
    tentativaId: number;
    provaId: number;
    titulo: string;
    disciplinaNome: string;
    nota: number;
    notaMaxima: number;
    finishedAt?: string | null;
  }[];
};

type MatriculaDisciplinaResponse = any[];

type AuthMeResponse = {
  plano?: string;
  user?: {
    plano?: string;
  };
};

function AlunoDashboardPage() {
  const t = useTranslations("StudentDashboard");
  const locale = useLocale();
  const [data, setData] = useState<DashboardAlunoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [totalDisciplinasMatriculadas, setTotalDisciplinasMatriculadas] =
    useState(0);
  const [plano, setPlano] = useState<string>("ESSENCIAL");
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [matricula, setMatricula] = useState<any>(null);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const inputFotoRef = useRef<HTMLInputElement | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [modalDicaFotoAberto, setModalDicaFotoAberto] = useState(false);

  useEffect(() => {
    carregarDashboard();
    carregarDisciplinasMatriculadas();
    carregarPlano();
    carregarMatricula();
    carregarAulas();
  }, []);

  async function alterarFotoPerfil(file: File | null) {
    if (!file) return;

    try {
      setEnviandoFoto(true);
      setErro("");

      const formData = new FormData();
      formData.append("file", file);

      const resUpload = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const jsonUpload = await resUpload.json();

      if (!resUpload.ok) {
        throw new Error(jsonUpload?.error || t("errors.imageUpload"));
      }

      const fotoUrl = jsonUpload?.url || jsonUpload?.arquivo?.url;

      if (!fotoUrl) {
        throw new Error(t("errors.missingImageUrl"));
      }

      const resSalvar = await fetch("/api/aluno/foto-perfil", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fotoPerfil: fotoUrl,
        }),
      });

      const jsonSalvar = await resSalvar.json();

      if (!resSalvar.ok) {
        throw new Error(jsonSalvar?.error || t("errors.savePhoto"));
      }

      setData((prev) =>
        prev
          ? {
            ...prev,
            aluno: {
              ...prev.aluno,
              fotoPerfil: fotoUrl,
            },
          }
          : prev
      );
    } catch (e: any) {
      setErro(e?.message || t("errors.changePhoto"));
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function carregarDashboard() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/dashboard", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        if (json?.error === "INADIMPLENTE") {
          setErro(json.message || t("errors.paymentBlocked"));
          setData(null);
          return;
        }

        throw new Error(json.error || t("errors.loadDashboard"));
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || t("errors.loadDashboard"));
    } finally {
      setLoading(false);
    }
  }

  async function carregarAulas() {
    try {
      const res = await fetch("/api/aluno/aulas", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (res.ok) {
        setDisciplinas(json.disciplinas || []);
      }
    } catch { }
  }

  async function carregarMatricula() {
    try {
      const res = await fetch("/api/aluno/matricula", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (res.ok) {
        setMatricula(json.matricula);
      }
    } catch { }
  }

  async function carregarDisciplinasMatriculadas() {
    try {
      const res = await fetch("/api/aluno/disciplinas", {
        credentials: "include",
        cache: "no-store",
      });

      const json: MatriculaDisciplinaResponse = await res.json();

      if (!res.ok || !Array.isArray(json)) {
        setTotalDisciplinasMatriculadas(0);
        return;
      }

      const total = json.reduce((acc: number, matricula: any) => {
        return acc + (matricula.itens?.length || 0);
      }, 0);

      setTotalDisciplinasMatriculadas(total);
    } catch {
      setTotalDisciplinasMatriculadas(0);
    }
  }

  async function carregarPlano() {
    try {
      setLoadingPlano(true);

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      const json: AuthMeResponse = await res.json();

      const planoRecebido = json?.plano || json?.user?.plano || "ESSENCIAL";
      setPlano(planoRecebido);
    } catch {
      setPlano("ESSENCIAL");
    } finally {
      setLoadingPlano(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleString(locale);
    } catch {
      return data;
    }
  }

  function getMediaClass(media: number) {
    if (media >= 7) return "text-emerald-600";
    if (media >= 5) return "text-amber-500";
    return "text-red-500";
  }

  function getNotaBadgeClass(nota: number) {
    if (nota >= 7) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (nota >= 5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  }

  function traduzirStatusMatricula(status?: string | null) {
    const statusNormalizado = String(status || "")
      .trim()
      .toUpperCase();

    switch (statusNormalizado) {
      case "ATIVA":
      case "ATIVO":
      case "REGULAR":
      case "CURSANDO":
        return t("enrollmentStatuses.active");

      case "PENDENTE":
        return t("enrollmentStatuses.pending");

      case "TRANCADA":
      case "TRANCADO":
        return t("enrollmentStatuses.locked");

      case "CANCELADA":
      case "CANCELADO":
        return t("enrollmentStatuses.cancelled");

      case "CONCLUIDA":
      case "CONCLUÍDA":
      case "CONCLUIDO":
      case "CONCLUÍDO":
        return t("enrollmentStatuses.completed");

      case "INATIVA":
      case "INATIVO":
        return t("enrollmentStatuses.inactive");

      case "SUSPENSA":
      case "SUSPENSO":
        return t("enrollmentStatuses.suspended");

      default:
        return status || t("hero.notInformed");
    }
  }

  const mediaGeral = data?.resumo?.mediaGeral ?? 0;
  const totalProvas = data?.resumo?.totalProvasConcluidas ?? 0;

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return t("greetings.morning");
    if (hora < 18) return t("greetings.afternoon");

    return t("greetings.evening");
  }, [t]);

  const disciplinaPrincipal = useMemo(() => {
    return disciplinas?.find((disc: any) => !disc.bloqueadaPorAulas) || null;
  }, [disciplinas]);

  const ultimaProva = useMemo(() => {
    return data?.ultimasProvas?.[0] || null;
  }, [data]);

  const progressoAproveitamento = useMemo(() => {
    const percentual = Math.round((mediaGeral / 10) * 100);
    return Math.max(0, Math.min(100, percentual));
  }, [mediaGeral]);

  const mensagemDesempenho = useMemo(() => {
    if (mediaGeral >= 8) {
      return t("performance.excellent");
    }

    if (mediaGeral >= 7) {
      return t("performance.veryGood");
    }

    if (mediaGeral >= 5) {
      return t("performance.good");
    }

    return t("performance.needsImprovement");
  }, [mediaGeral, t]);

  const proximoPasso = useMemo(() => {
    if (erro) {
      return {
        titulo: t("nextStep.regularizeTitle"),
        descricao: t("nextStep.regularizeDescription"),
        href: "/suporte",
        label: t("nextStep.openSupport"),
      };
    }

    if (disciplinaPrincipal) {
      return {
        titulo: t("nextStep.continueTitle"),
        descricao: t("nextStep.continueDescription"),
        href: `/aluno/disciplinas/${disciplinaPrincipal.id}`,
        label: t("nextStep.openSubject"),
      };
    }

    if (ultimaProva) {
      return {
        titulo: t("nextStep.reviewTitle"),
        descricao: t("nextStep.reviewDescription"),
        href: "/aluno/boletim",
        label: t("nextStep.viewGrades"),
      };
    }

    return {
      titulo: t("nextStep.exploreTitle"),
      descricao: t("nextStep.exploreDescription"),
      href: "/aluno",
      label: t("nextStep.refreshDashboard"),
    };
  }, [erro, disciplinaPrincipal, ultimaProva, t]);

  return (
    <div className="min-h-screen bg-slate-50">
      <input
        ref={inputFotoRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          alterarFotoPerfil(file);
          e.target.value = "";
        }}
      />
      <div className="mx-auto max-w-7xl space-y-4 px-2 py-3 sm:space-y-6 sm:p-6">
        <CentralAvisosPhanyx />
        <section className="aluno-dashboard-hero overflow-hidden rounded-[30px] border border-slate-800 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-sm">
          <div className="grid gap-6 px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:grid-cols-[1.45fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700 dark:text-blue-700 dark:text-blue-200">
                {t("hero.eyebrow")}
              </p>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10">
                  {data?.aluno?.fotoPerfil ? (
                    <img
                      src={data.aluno.fotoPerfil}
                      alt={data.aluno.nome || t("hero.student")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">
                      {data?.aluno?.nome?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
                    {t("hero.student")}
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {data?.aluno?.nome || t("hero.student")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => inputFotoRef.current?.click()}
                    disabled={enviandoFoto}
                    className="mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white transition hover:bg-white/20 disabled:opacity-60"
                  >
                    {enviandoFoto
                      ? t("hero.sendingPhoto")
                      : t("hero.changePhoto")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalDicaFotoAberto(true)}
                    className="mt-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white transition hover:bg-white/20"
                  >
                    ℹ️ {t("hero.photoTips")}
                  </button>
                </div>
              </div>

              <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                {t("hero.heading", {
                  greeting: saudacao,
                })}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-700 dark:text-blue-100 md:text-base">
                {t("hero.description")}
              </p>

              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                <a
                  href={
                    disciplinaPrincipal
                      ? `/aluno/disciplinas/${disciplinaPrincipal.id}`
                      : "/aluno/boletim"
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {disciplinaPrincipal
                    ? t("hero.continueStudies")
                    : t("hero.viewGrades")}
                </a>

                <a
                  href="/aluno/boletim"
                  className="aluno-botao-secundario block rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("hero.openGrades")}
                </a>

                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-white/10"
                >
                  {t("hero.refreshDashboard")}
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/10 dark:backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
                  {t("hero.currentCourse")}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {matricula?.curso?.nome || t("hero.unknownCourse")}
                </p>
                <p className="mt-2 text-sm text-blue-700 dark:text-blue-100">
                  {t("hero.status")}:{" "}
                  {traduzirStatusMatricula(matricula?.status)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/10 dark:backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
                  {t("hero.currentPerformance")}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {progressoAproveitamento}%
                </p>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${progressoAproveitamento}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-blue-700 dark:text-blue-100">
                  {t("hero.performanceBasis")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 text-sm text-slate-500 shadow-sm">
            {t("hero.loading")}
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
                  {t("restricted.eyebrow")}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-red-700">
                  {t("restricted.title")}
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-red-600">
                  {erro}
                </p>

                <p className="mt-3 text-xs text-red-500">
                  {t("restricted.institutionInstruction")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/suporte"
                  className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-slate-900 dark:text-slate-700 dark:text-white/90 transition hover:bg-red-700"
                >
                  {t("restricted.contactSupport")}
                </a>

                <a
                  href="/aluno"
                  className="inline-flex items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  {t("restricted.refreshDashboard")}
                </a>
              </div>
            </div>
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {t("stats.enrolledSubjects")}
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {totalDisciplinasMatriculadas}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("stats.enrolledSubjectsDescription")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {t("stats.overallAverage")}
                </p>
                <p className={`mt-3 text-3xl font-bold ${getMediaClass(mediaGeral)}`}>
                  {mediaGeral}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("stats.overallAverageDescription")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {t("stats.completedExams")}
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {!loadingPlano && plano !== "ESSENCIAL" ? totalProvas : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {!loadingPlano && plano !== "ESSENCIAL"
                    ? t("stats.completedExamsDescription")
                    : t("stats.higherPlans")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {t("stats.enrollmentStatus")}
                </p>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {matricula?.status
                    ? traduzirStatusMatricula(matricula.status)
                    : "—"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("stats.enrollmentStatusDescription")}
                </p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {t("subjects.title")}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {t("subjects.description")}
                      </p>
                    </div>

                    <span className="aluno-pill-legivel inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {t("subjects.count", {
                        count: disciplinas.length,
                      })}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {disciplinas.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 md:col-span-2">
                        {t("subjects.empty")}
                      </div>
                    ) : (
                      disciplinas.map((disc: any) => (
                        <div
                          key={disc.id}
                          className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
                        >
                          <h3 className="text-base font-semibold text-slate-900">
                            {disc.nome}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {t("subjects.cardDescription")}
                          </p>

                          {disc.bloqueadaPorAulas ? (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                              <p className="text-sm font-semibold text-amber-800">
                                {t("subjects.availableSoon")}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-amber-700">
                                {disc.mensagemBloqueio ||
                                  t("subjects.blockedDefault")}
                              </p>
                            </div>
                          ) : (
                            <a
                              href={`/aluno/disciplinas/${disc.id}`}
                              className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                              {t("subjects.access")} →
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-s">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {t("exams.title")}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {t("exams.description")}
                      </p>
                    </div>

                    <a
                      href="/aluno/boletim"
                      className="aluno-botao-secundario inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("exams.viewGrades")}
                    </a>
                  </div>

                  {!loadingPlano && plano === "ESSENCIAL" ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                      {t("exams.higherPlans")}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {data.ultimasProvas.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                          {t("exams.empty")}
                        </div>
                      ) : (
                        data.ultimasProvas.map((prova) => (
                          <div
                            key={prova.tentativaId}
                            className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                  {prova.titulo}
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                  <span>
                                    <strong className="font-medium text-slate-700">
                                      {t("exams.subject")}:
                                    </strong>{" "}
                                    {prova.disciplinaNome}
                                  </span>

                                  <span>
                                    <strong className="font-medium text-slate-700">
                                      {t("exams.completedAt")}:
                                    </strong>{" "}
                                    {formatarData(prova.finishedAt)}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getNotaBadgeClass(
                                  prova.nota
                                )}`}
                              >
                                {t("exams.grade")}: {prova.nota} / {prova.notaMaxima}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("side.nextStep")}
                  </h2>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {proximoPasso.titulo}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {proximoPasso.descricao}
                    </p>

                    <a
                      href={proximoPasso.href}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-blue-700"
                    >
                      {proximoPasso.label}
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("side.visualProgress")}
                  </h2>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {t("hero.currentPerformance")}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {progressoAproveitamento}%
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 transition-all"
                        style={{ width: `${progressoAproveitamento}%` }}
                      />
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {mensagemDesempenho}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("side.quickLinks")}
                  </h2>


                  <div className="mt-4 space-y-3">
                    <a
                      href={
                        disciplinaPrincipal
                          ? `/aluno/disciplinas/${disciplinaPrincipal.id}`
                          : "/aluno"
                      }
                      className="block rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white transition hover:bg-blue-700"
                    >
                      {disciplinaPrincipal
                        ? t("side.continueStudies")
                        : t("side.refreshDashboard")}
                    </a>

                    <a
                      href="/aluno/boletim"
                      className="aluno-botao-secundario block rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("side.openGrades")}
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("side.academicSummary")}
                  </h2>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <p>
                      {t("side.enrolledSubjects", {
                        count: totalDisciplinasMatriculadas,
                      })}
                    </p>

                    {!loadingPlano && plano !== "ESSENCIAL" && (
                      <p>
                        {t("side.completedExams", {
                          count: totalProvas,
                        })}
                      </p>
                    )}

                    <p>
                      {t("side.currentAverage", {
                        average: mediaGeral,
                      })}
                    </p>

                    <p>
                      {t("side.currentCourse", {
                        course:
                          matricula?.curso?.nome ||
                          t("side.unknownCourse"),
                      })}
                    </p>

                    <p>
                      {t("side.enrollmentStatus", {
                        status: traduzirStatusMatricula(
                          matricula?.status
                        ),
                      })}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("side.institutionalSituation")}
                  </h2>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {t("side.institutionalDescription")}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {modalDicaFotoAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#111111]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  {t("photoModal.eyebrow")}
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                  {t("photoModal.title")}
                </h2>
              </div>

              <button
                type="button"
                aria-label={t("photoModal.closeAria")}
                onClick={() => setModalDicaFotoAberto(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>• {t("photoModal.square")}</p>
              <p>• {t("photoModal.resolution")}</p>
              <p>• {t("photoModal.formats")}</p>
              <p>• {t("photoModal.size")}</p>
            </div>

            <button
              type="button"
              onClick={() => setModalDicaFotoAberto(false)}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white"
            >
              {t("photoModal.understood")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AlunoDashboardPage, ["aluno"]);