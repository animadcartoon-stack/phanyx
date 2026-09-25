"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function ImportacaoAFDPage() {
  const t = useTranslations("AdminHRPointAfdImport");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [resumo, setResumo] = useState<any>(null);

  async function importar(e: React.FormEvent) {
    e.preventDefault();

    if (!arquivo) {
      setErro(t("fileRequired"));
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      setSucesso("");
      setResumo(null);

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const res = await fetch("/api/admin/rh/ponto/importacao-afd", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale === "pt-BR" && data.error) || t("importError"));
      }

      setSucesso((locale === "pt-BR" && data.message) || t("importSuccess"));
      setResumo(data.resumo || null);
      setArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setErro(e.message || t("importError"));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="phanyx-rh-page min-h-screen p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{t("title")}</h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100">
          <h2 className="text-lg font-bold">{t("uploadHeading")}</h2>

          <form onSubmit={importar} className="mt-5 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("fileLabel")}</span>

              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.afd"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-500"
              />
            </label>

            {arquivo && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-100">
                {t("selectedFile")} <strong>{arquivo.name}</strong>
              </div>
            )}

            <button
              disabled={carregando}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {carregando ? t("importing") : t("importAfd")}
            </button>
          </form>
        </section>

        {resumo && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100">
            <h2 className="text-lg font-bold">{t("summaryHeading")}</h2>

            <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-slate-600 dark:text-slate-300">{t("fileLines")}</p>
                <p className="text-xl font-bold">{resumo.linhasArquivo}</p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-300">{t("readLines")}</p>
                <p className="text-xl font-bold">{resumo.linhasLidas}</p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-300">{t("ignoredLines")}</p>
                <p className="text-xl font-bold">{resumo.linhasIgnoradas}</p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-300">{t("employeesDaysFound")}</p>
                <p className="text-xl font-bold">
                  {resumo.funcionariosEncontrados}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-300">{t("createdRecords")}</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  {resumo.registrosCriados}
                </p>
              </div>

              <div>
                <p className="text-slate-600 dark:text-slate-300">{t("updatedRecords")}</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {resumo.registrosAtualizados}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-100">
          <h2 className="font-bold">{t("attention")}</h2>
          <p className="mt-2 leading-6">{t("attentionStart")} <strong>{t("timeClockCode")}</strong>{" "}
            {t("or")} <strong>{t("pisPasep")}</strong> {t("attentionEnd")}</p>
        </section>
      </div>
    </main>
  );
}
