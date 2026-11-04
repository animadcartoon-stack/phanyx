"use client";

import { useEffect, useRef, useState } from "react";
import withAuth from "@/components/auth/withAuth";
import CentralAvisosPhanyx from "@/components/phanyx/CentralAvisosPhanyx";
import { useTranslations } from "next-intl";

type DashboardResponse = {
  professor: {
    id: number;
    nome?: string;
    fotoPerfil?: string | null;
  };
  resumo: {
    totalProvas: number;
    provasRascunho: number;
    provasPublicadas: number;
    provasEncerradas: number;
    totalTentativasFinalizadas: number;
    aprovados: number;
    reprovados: number;
    mediaGeral: number;
  };
  provasRecentes: {
    id: number;
    titulo: string;
    status: "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
    notaMaxima: number;
    disciplinaNome: string;
    totalTentativas: number;
    media: number;
  }[];
};

function ProfessorDashboardPage() {
  const t = useTranslations("ProfessorDashboard");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const inputFotoRef = useRef<HTMLInputElement | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

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
        throw new Error(
          jsonUpload?.error || t("errors.imageUpload")
        );
      }

      const fotoUrl = jsonUpload?.url || jsonUpload?.arquivo?.url;

      if (!fotoUrl) {
        throw new Error(t("errors.missingImageUrl"));
      }

      const resSalvar = await fetch("/api/professor/foto-perfil", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fotoPerfil: fotoUrl }),
      });

      const jsonSalvar = await resSalvar.json();

      if (!resSalvar.ok) {
        throw new Error(
          jsonSalvar?.error || t("errors.savePhoto")
        );
      }

      setData((prev) =>
        prev
          ? {
            ...prev,
            professor: {
              ...prev.professor,
              fotoPerfil: fotoUrl,
            },
          }
          : prev
      );
    } catch (e: any) {
      setErro(
        e?.message || t("errors.changePhoto")
      );
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function carregarDashboard() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/dashboard");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t("errors.loadDashboard"));
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || t("errors.loadDashboard"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  function getStatusLabel(status: string) {
    if (status === "PUBLICADA") {
      return t("statuses.published");
    }

    if (status === "ENCERRADA") {
      return t("statuses.closed");
    }

    return t("statuses.draft");
  }

  function getStatusClasses(status: string) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-200";
    }

    if (status === "ENCERRADA") {
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }

    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/35 dark:text-yellow-200";
  }

  return (
    <div className="px-2 py-3 sm:p-6">
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
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <CentralAvisosPhanyx />
        <div className="rounded-2xl border bg-white phanyx-theme-card p-4 shadow-sm sm:p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {t("title")}
          </h1>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border bg-slate-100">
              {data?.professor?.fotoPerfil ? (
                <img
                  src={data.professor.fotoPerfil}
                  alt={data.professor.nome || t("professor")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-700">
                  {data?.professor?.nome || t("professor")}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                {t("professor")}
              </p>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {data?.professor?.nome || "Professor"}
              </h2>
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={enviandoFoto}
                className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {enviandoFoto
                  ? t("photo.uploading")
                  : t("photo.change")}
              </button>
              <details className="mt-3 w-fit">
                <summary className="cursor-pointer list-none rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                  ℹ️ {t("photo.tips")}
                </summary>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {t("photo.instructions")}
                    <br />
                    {t("photo.formats")}
                  </p>
                </div>
              </details>
            </div>
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {t("description")}
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white phanyx-theme-card p-6 text-sm text-gray-500 dark:text-slate-400 shadow-sm">
            {t("loading")}
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.totalExams")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {data.resumo.totalProvas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.drafts")}
                </p>
                <p className="mt-2 text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {data.resumo.provasRascunho}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.published")}
                </p>
                <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-300">
                  {data.resumo.provasPublicadas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.closed")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {data.resumo.provasEncerradas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.completedAttempts")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {data.resumo.totalTentativasFinalizadas}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.approved")}
                </p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {data.resumo.aprovados}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.failed")}
                </p>
                <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">
                  {data.resumo.reprovados}
                </p>
              </div>

              <div className="rounded-2xl border bg-white phanyx-theme-card p-5 shadow-sm ">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  {t("stats.overallAverage")}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {data.resumo.mediaGeral}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="professor-dashboard-fix rounded-2xl border bg-white phanyx-theme-card p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="
  text-lg
  font-semibold
  text-slate-900
  dark:text-white
">
                      {t("recent.title")}
                    </h2>
                    <p className="
  text-sm
  text-slate-600
  dark:text-slate-400
">
                      {t("recent.description")}
                    </p>
                  </div>

                  <a
                    href="/professor/provas"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    {t("recent.viewAll")}
                  </a>
                </div>

                <div className="mt-6 space-y-4">
                  {data.provasRecentes.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500 dark:text-slate-400">
                      {t("recent.empty")}
                    </div>
                  ) : (
                    data.provasRecentes.map((prova) => (
                      <div
                        key={prova.id}
                        className="rounded-xl border p-5 transition hover:border-gray-300"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                {prova.titulo}
                              </h3>

                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                  prova.status
                                )}`}
                              >
                                {getStatusLabel(prova.status)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
                              <span>
                                <strong className="font-medium text-slate-800 dark:text-slate-200">
                                  {t("recent.subject")}:
                                </strong>{" "}
                                {prova.disciplinaNome}
                              </span>

                              <span>
                                <strong className="font-medium text-slate-800 dark:text-slate-200">
                                  {t("recent.attempts")}:
                                </strong>{" "}
                                {prova.totalTentativas}
                              </span>

                              <span>
                                <strong className="font-medium text-slate-800 dark:text-slate-200">
                                  {t("recent.average")}:
                                </strong>{" "}
                                {prova.media}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <a
                              href={`/professor/provas/${prova.id}`}
                              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              {t("recent.open")}
                            </a>

                            <a
                              href={`/professor/provas/${prova.id}/boletim`}
                              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              {t("recent.gradebook")}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="professor-dashboard-fix rounded-2xl border bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="
  text-lg
  font-semibold
  text-slate-900
  dark:text-white
">
                    {t("shortcuts.title")}
                  </h2>

                  <div className="mt-4 space-y-3">
                    <a
                      href="/professor/provas/nova"
                      className="block rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                    >
                      {t("shortcuts.newExam")}
                    </a>

                    <a
                      href="/professor/provas"
                      className="
block
rounded-lg
border
border-slate-300
px-4
py-3
text-sm
font-medium
text-slate-800
transition
hover:bg-slate-100
hover:text-slate-950
dark:border-slate-700
dark:text-slate-100
dark:hover:bg-slate-800
dark:hover:text-white
"                 >
                      {t("shortcuts.manageExams")}
                    </a>
                  </div>
                </div>

                <div className="professor-dashboard-fix rounded-2xl border bg-white phanyx-theme-card p-6 shadow-sm">
                  <h2 className="
  text-lg
  font-semibold
  text-slate-900
  dark:text-white
">
                    {t("summary.title")}
                  </h2>

                  <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                    <p>
                      {t("summary.totalExams", {
                        count: data.resumo.totalProvas,
                      })}
                    </p>

                    <p>
                      {t("summary.publishedExams", {
                        count: data.resumo.provasPublicadas,
                      })}
                    </p>

                    <p>
                      {t("summary.completedAttempts", {
                        count: data.resumo.totalTentativasFinalizadas,
                      })}
                    </p>

                    <p>
                      {t("summary.results", {
                        approved: data.resumo.aprovados,
                        failed: data.resumo.reprovados,
                      })}
                    </p>

                    <p>
                      {t("summary.overallAverage", {
                        average: data.resumo.mediaGeral,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(ProfessorDashboardPage, ["professor"]);