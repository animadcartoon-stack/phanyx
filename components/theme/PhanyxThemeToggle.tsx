"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { aplicarTemaPhanyx, lerTemaPhanyx, type TemaPhanyx } from "@/lib/tema-phanyx";

export default function PhanyxThemeToggle() {
  const t = useTranslations("Common");
  const [tema, setTema] = useState<TemaPhanyx>("light");

  useEffect(() => {
    const sincronizar = () => setTema(lerTemaPhanyx());
    sincronizar();
    window.addEventListener("phanyx-theme-change", sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener("phanyx-theme-change", sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  function alterarTema(novoTema: TemaPhanyx) {
    setTema(novoTema);
    try { localStorage.setItem("phanyx_tema", novoTema); } catch {}
    aplicarTemaPhanyx(novoTema);
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 [&_button:not(.ativo-tema)]:text-slate-700 dark:[&_button:not(.ativo-tema)]:text-slate-300">
      <button
        type="button"
        onClick={() => alterarTema("light")}
        aria-pressed={tema === "light"}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          tema === "light"
            ? "ativo-tema bg-blue-600 text-white"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        {t("lightTheme")}
      </button>

      <button
        type="button"
        onClick={() => alterarTema("dark")}
        aria-pressed={tema === "dark"}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          tema === "dark"
            ? "ativo-tema bg-blue-600 text-white"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        {t("darkTheme")}
      </button>

      <button
        type="button"
        onClick={() => alterarTema("system")}
        aria-pressed={tema === "system"}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          tema === "system"
            ? "ativo-tema bg-blue-600 text-white"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        {t("systemTheme")}
      </button>
    </div>
  );
}