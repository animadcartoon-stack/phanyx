"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AlunoBloqueadoFinanceiroPage() {
  const { user } = useAuth();
  const t = useTranslations("StudentFinancialBlock");

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
          {t("title")}
        </h1>

        <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">
          {t("greeting", {
            name: user?.nome || t("studentFallback"),
          })}
        </p>

        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
          {t("pendingDescription")}
        </p>

        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
          {t("releaseDescription")}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {t("goToLogin")}
          </Link>

          <Link
            href="/aluno"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {t("tryAgain")}
          </Link>
        </div>
      </div>
    </div>
  );
}