"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Tema = "light" | "dark" | "system";

function aplicarTema(tema: Tema) {
  const root = document.documentElement;
  const rotaAtual = window.location.pathname;

  const rotaComTemaPrivado =
    rotaAtual.startsWith("/admin") ||
    rotaAtual.startsWith("/professor") ||
    rotaAtual.startsWith("/aluno");

  if (!rotaComTemaPrivado) {
    root.removeAttribute("data-theme");
    root.dataset.themeChoice = "public";
    root.classList.remove("dark");
    return;
  }

  const prefereEscuro = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const usarEscuro =
    tema === "dark" ||
    (tema === "system" && prefereEscuro);

  root.dataset.theme =
    tema === "system"
      ? "system"
      : usarEscuro
        ? "dark"
        : "light";

  root.dataset.themeChoice = tema;
  root.classList.toggle("dark", usarEscuro);
}

export default function PhanyxThemeToggle() {
  const t = useTranslations("Common");
  const [tema, setTema] = useState<Tema>("light");

  useEffect(() => {
    const salvo =
      (localStorage.getItem("phanyx_tema") as Tema) ||
      "light";

    setTema(salvo);
    aplicarTema(salvo);
  }, []);

  function alterarTema(novoTema: Tema) {
    setTema(novoTema);
    localStorage.setItem(
      "phanyx_tema",
      novoTema
    );
    aplicarTema(novoTema);
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