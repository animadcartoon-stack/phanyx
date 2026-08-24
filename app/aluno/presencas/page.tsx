"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Presenca = {
  id: number;
  status: string;
  observacao?: string;
  data?: string;
  aula?: string;
  turma?: string;
};

type RespostaApi = {
  ok: boolean;
  resumo: {
    total: number;
    presentes: number;
    faltas: number;
    justificadas: number;
    atestados: number;
  };
  items: Presenca[];
};

function classeStatus(status?: string) {
  switch (status) {
    case "PRESENTE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "FALTA":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200";
    case "JUSTIFICADA":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
    case "ATESTADO":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function classeFrequencia(freq: number) {
  if (freq >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (freq >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function PresencasAlunoPage() {
  const locale = useLocale();
  const t = useTranslations("StudentAttendance");

  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/aluno/presencas", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || t("errors.load"));
        }

        setDados(json);
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : t("errors.load"));
        setDados(null);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [t]);

  const freq = useMemo(() => {
    if (!dados) return 0;

    const presencasValidas =
      dados.resumo.presentes +
      dados.resumo.justificadas +
      dados.resumo.atestados;

    return dados.resumo.total > 0
      ? Math.round((presencasValidas / dados.resumo.total) * 100)
      : 0;
  }, [dados]);

  function formatarStatus(status?: string) {
    switch (status) {
      case "PRESENTE":
        return t("statuses.present");
      case "FALTA":
        return t("statuses.absent");
      case "JUSTIFICADA":
        return t("statuses.excused");
      case "ATESTADO":
        return t("statuses.medicalCertificate");
      default:
        return status || t("common.notProvided");
    }
  }

  function formatarData(data?: string) {
    if (!data) return t("common.notProvided");

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return data;
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(valor);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("emptyData")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <CardResumo title={t("summary.total")} value={dados.resumo.total} />
        <CardResumo
          title={t("summary.present")}
          value={dados.resumo.presentes}
          variant="green"
        />
        <CardResumo
          title={t("summary.absences")}
          value={dados.resumo.faltas}
          variant="red"
        />
        <CardResumo
          title={t("summary.excused")}
          value={dados.resumo.justificadas}
          variant="yellow"
        />
        <CardResumo
          title={t("summary.medicalCertificates")}
          value={dados.resumo.atestados}
          variant="blue"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
          {t("frequency.title")}
        </p>
        <p className={`mt-2 text-3xl font-bold ${classeFrequencia(freq)}`}>
          {freq}%
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          {t("frequency.description")}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("history.title")}
          </h2>

          <span className="aluno-pill-legivel inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
            {t("history.records", { count: dados.items.length })}
          </span>
        </div>

        {dados.items.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            {t("history.empty")}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {dados.items.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {p.aula || t("item.lessonUnknown")}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatus(
                          p.status
                        )}`}
                      >
                        {formatarStatus(p.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                      <p>
                        <strong className="font-medium text-slate-800 dark:text-slate-100">
                          {t("item.classLabel")}:
                        </strong>{" "}
                        {p.turma || t("common.notProvided")}
                      </p>

                      <p>
                        <strong className="font-medium text-slate-800 dark:text-slate-100">
                          {t("item.dateLabel")}:
                        </strong>{" "}
                        {formatarData(p.data)}
                      </p>
                    </div>

                    {p.observacao && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {t("item.observation")}
                        </p>
                        <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                          {p.observacao}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CardResumo({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value: number;
  variant?: "default" | "green" | "red" | "yellow" | "blue";
}) {
  const classes = {
    default:
      "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
    yellow:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${classes[variant]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}