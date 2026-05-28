"use client";

import { useEffect, useState } from "react";

type Tema = "light" | "dark" | "system";

function aplicarTema(tema: Tema) {
  const root = document.documentElement;

  const prefereEscuro = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const usarEscuro = tema === "dark" || (tema === "system" && prefereEscuro);

  root.classList.toggle("dark", usarEscuro);
  root.dataset.theme = tema;
}

export default function PhanyxThemeToggle() {
  const [tema, setTema] = useState<Tema>("light");

  useEffect(() => {
    const salvo = (localStorage.getItem("phanyx_tema") as Tema) || "light";
    setTema(salvo);
    aplicarTema(salvo);
  }, []);

  function alterarTema(novoTema: Tema) {
    setTema(novoTema);
    localStorage.setItem("phanyx_tema", novoTema);
    aplicarTema(novoTema);
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => alterarTema("light")}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          tema === "light"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        Claro
      </button>

      <button
        type="button"
        onClick={() => alterarTema("dark")}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          tema === "dark"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        Escuro
      </button>

      <button
        type="button"
        onClick={() => alterarTema("system")}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
          tema === "system"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        Sistema
      </button>
    </div>
  );
}