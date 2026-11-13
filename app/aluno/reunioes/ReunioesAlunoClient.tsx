"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Reuniao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  link: string;
  dataHora: string;
  publicoTipo: string;
  status: string;
};

export default function ReunioesAlunoClient() {
  const locale = useLocale();
  const t = useTranslations("StudentMeetings");

  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarReunioes() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/reunioes", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro retornado pela API de reuniões:", data?.error);
        throw new Error(t("errors.load"));
      }

      setReunioes(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarReunioes();
    // A consulta deve ser executada somente quando a página for aberta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatarData(dataHora: string) {
    const data = new Date(dataHora);

    if (Number.isNaN(data.getTime())) {
      return dataHora || t("common.notProvided");
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(data);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="aluno-reunioes-fix">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 {t("title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {erro}
        </div>
      )}

      {loading ? (
        <div className="aluno-reunioes-card rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("loading")}
        </div>
      ) : reunioes.filter((r) => r.status === "AGENDADA").length === 0 ? (
        <div className="aluno-reunioes-card rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-4">
          {reunioes.filter((r) => r.status === "AGENDADA").map((reuniao) => (
            <div
              key={reuniao.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {reuniao.titulo}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {formatarData(reuniao.dataHora)}
                  </p>

                  {reuniao.descricao && (
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                      {reuniao.descricao}
                    </p>
                  )}
                </div>

                <a
                  href={reuniao.link}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {t("join")}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      {reunioes.some((r) => r.status === "CANCELADA") && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{locale.startsWith("pt") ? "Reuniões canceladas" : locale.startsWith("es") ? "Reuniones canceladas" : locale.startsWith("fr") ? "Réunions annulées" : "Cancelled meetings"}</h2>
          {reunioes.filter((r) => r.status === "CANCELADA").map((r) => (
            <div key={r.id} className="mb-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-white">{r.titulo}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{formatarData(r.dataHora)}</p>
              <p className="mt-1 font-semibold text-red-600 dark:text-red-300">{locale.startsWith("pt") ? "Cancelada" : locale.startsWith("es") ? "Cancelada" : locale.startsWith("fr") ? "Annulée" : "Cancelled"}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}