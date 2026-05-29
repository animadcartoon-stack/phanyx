"use client";

import { useEffect } from "react";

type Tema = "light" | "dark" | "system";

function aplicarTema(tema: Tema) {
  const root = document.documentElement;
  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const usarEscuro = tema === "dark" || (tema === "system" && prefereEscuro);

  root.dataset.theme = tema;

  if (tema === "light") {
    root.classList.remove("dark");
    return;
  }

  root.classList.toggle("dark", usarEscuro);
}

export default function PhanyxThemeBoot() {
  useEffect(() => {
    const salvo = (localStorage.getItem("phanyx_tema") as Tema) || "light";
    aplicarTema(salvo);
  }, []);

  return null;
}