"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Tema = "light" | "dark" | "system";

export default function PhanyxThemeGuard() {
  const pathname = usePathname();

 useEffect(() => {
  const root = document.documentElement;

  const rotaComTemaPrivado =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/professor") ||
    pathname.startsWith("/aluno");

  if (!rotaComTemaPrivado) {
    root.dataset.theme = "light";
    root.classList.remove("dark");
    return;
  }

  const tema = (localStorage.getItem("phanyx_tema") as Tema) || "light";

  const prefereEscuro = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const usarEscuro =
    tema === "dark" || (tema === "system" && prefereEscuro);

  root.dataset.theme = usarEscuro ? "dark" : "light";
  root.dataset.themeChoice = tema;

  root.classList.toggle("dark", usarEscuro);
}, [pathname]);

  return null;
}