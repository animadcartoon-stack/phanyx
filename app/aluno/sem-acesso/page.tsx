"use client";
import {useTranslations} from "next-intl";
export default function PaginaAlunoNaoDisponivel(){
  const tr = useTranslations("PlanningTracking");
return <main className="mx-auto max-w-3xl rounded-2xl border border-slate-300 bg-white p-8 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><h1 className="text-2xl font-bold">{tr("pageUnavailable")}</h1><p className="mt-3">{tr("studentPageUnavailable")}</p></main>}
