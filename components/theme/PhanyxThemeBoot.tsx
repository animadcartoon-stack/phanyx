"use client";

import { useEffect } from "react";

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

  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const usarEscuro = tema === "dark" || (tema === "system" && prefereEscuro);

  root.dataset.theme = tema === "system" ? "system" : usarEscuro ? "dark" : "light";
  root.dataset.themeChoice = tema;

  root.classList.toggle("dark", usarEscuro);
}

export default function PhanyxThemeBoot() {
  useEffect(() => {
    const salvo = (localStorage.getItem("phanyx_tema") as Tema) || "light";
    aplicarTema(salvo);
  }, []);

  return null;
}