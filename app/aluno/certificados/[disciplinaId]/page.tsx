"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type CertificadoItem = {
  id: number;
  codigo: string;
  emitidoEm: string;
  disciplina: {
    id: number;
    nome: string;
  };
};

export default function CertificadosAlunoClient() {
  const locale = useLocale();
  const t = useTranslations("StudentCertificates");

  const [loading, setLoading] = useState(true);
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/aluno/certificados", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Erro retornado pela API de certificados:", data?.error);
          setCertificados([]);
          setErro(t("errors.load"));
          return;
        }

        setCertificados(
          Array.isArray(data?.certificados) ? data.certificados : []
        );
      } catch (error) {
        console.error("Erro ao carregar certificados:", error);
        setCertificados([]);
        setErro(t("errors.load"));
      } finally {
        setLoading(false);
      }
    }

    carregar();
    // A consulta deve ser executada somente quando a página for aberta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatarData(dataTexto: string) {
    const data = new Date(dataTexto);

    if (Number.isNaN(data.getTime())) {
      return dataTexto || t("common.notProvided");
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
    }).format(data);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {t("description")}
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {erro}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("loading")}
          </div>
        ) : certificados.length === 0 ? (
          !erro && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {t("empty")}
            </div>
          )
        ) : (
          <div className="grid gap-4">
            {certificados.map((certificado) => (
              <div
                key={certificado.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {certificado.disciplina?.nome || t("subjectFallback")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("code")}: {certificado.codigo}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("issuedOn")}: {formatarData(certificado.emitidoEm)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/aluno/certificados/${certificado.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t("download")}
                    </a>

                    <a
                      href={`/validar-certificado?codigo=${encodeURIComponent(
                        certificado.codigo
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                      {t("validate")}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}