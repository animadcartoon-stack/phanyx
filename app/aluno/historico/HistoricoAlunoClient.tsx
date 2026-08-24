"use client";

import { useAluno } from "@/app/context/AlunoContext";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

export default function HistoricoAlunoClient() {
  const locale = useLocale();
  const t = useTranslations("StudentAcademicHistory");

  const [historicoAcademico] = useState("");
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [modalErroHistorico, setModalErroHistorico] = useState("");

  async function gerarHistoricoAcademico() {
    try {
      setCarregandoHistorico(true);
      setModalErroHistorico("");

      const resposta = await fetch("/api/aluno/historico/pdf");

      if (!resposta.ok) {
        setModalErroHistorico(t("errors.generateUnavailable"));
        return;
      }

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = t("official.fileName");
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setModalErroHistorico(t("errors.generateFailed"));
    } finally {
      setCarregandoHistorico(false);
    }
  }

  const { notas } = useAluno();
  const router = useRouter();

  const mediaGeral =
    notas.length > 0
      ? notas.reduce((acc, nota) => acc + nota.nota, 0) / notas.length
      : null;

  const dadosGrafico = notas.map((nota) => ({
    nome: t("exam.subjectId", { id: nota.disciplinaId }),
    nota: nota.nota,
  }));

  function formatarNumero(valor: number) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }).format(valor);
  }

  function formatarData(valor: string | Date | null | undefined) {
    if (!valor) return t("common.notProvided");

    const data = valor instanceof Date ? valor : new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(data);
  }

  return (
    <main className="space-y-6 p-8 text-slate-900 dark:text-slate-100">
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/40">
        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200">
          {t("official.title")}
        </h2>

        <p className="mt-2 text-blue-700 dark:text-blue-300">
          {t("official.description")}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={gerarHistoricoAcademico}
            disabled={carregandoHistorico}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {carregandoHistorico
              ? t("official.generating")
              : t("official.generate")}
          </button>

          {historicoAcademico && (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              {t("official.print")}
            </button>
          )}
        </div>

        {historicoAcademico && (
          <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {historicoAcademico}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        📚 {t("examHistory.title")}
      </h1>

      {mediaGeral !== null && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-200">
            📊 {t("average", { value: formatarNumero(mediaGeral) })}
          </p>
        </div>
      )}

      {notas.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            📈 {t("chart.title")}
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosGrafico}>
              <XAxis
                dataKey="nome"
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "currentColor", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
                labelStyle={{ color: "#f8fafc" }}
                itemStyle={{ color: "#93c5fd" }}
              />
              <Line
                type="monotone"
                dataKey="nota"
                name={t("chart.grade")}
                stroke="#2563eb"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {notas.map((nota) => (
        <div
          key={nota.disciplinaId}
          className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("exam.subjectId", { id: nota.disciplinaId })}
          </h2>

          <p className="text-slate-700 dark:text-slate-200">
            📊 {t("exam.gradeLabel")}: {" "}
            <strong>{formatarNumero(nota.nota)}</strong>
          </p>

          <p
            className={`font-semibold ${
              nota.aprovado
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {nota.aprovado
              ? t("exam.approved")
              : t("exam.failed")}
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            📅 {t("exam.dateLabel")}: {formatarData(nota.data)}
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            ⏱ {t("exam.durationLabel")}: {" "}
            {t("exam.duration", {
              minutes: Math.floor(nota.tempo / 60),
              seconds: nota.tempo % 60,
            })}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(`/aluno/historico/${nota.disciplinaId}`)
            }
            className="mt-3 rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            {t("exam.viewDetails")}
          </button>
        </div>
      ))}

      {modalErroHistorico && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="historico-modal-title"
            className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl dark:border-blue-800 dark:bg-slate-900"
          >
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              {t("modal.eyebrow")}
            </p>

            <h2
              id="historico-modal-title"
              className="mt-2 text-xl font-black text-slate-900 dark:text-white"
            >
              {t("modal.title")}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {modalErroHistorico}
            </p>

            <button
              type="button"
              onClick={() => setModalErroHistorico("")}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              {t("modal.understood")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}