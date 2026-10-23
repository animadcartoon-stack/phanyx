export type TemaPhanyx = "light" | "dark" | "system";

export function normalizarTemaPhanyx(valor: unknown): TemaPhanyx {
  return valor === "dark" || valor === "system" ? valor : "light";
}

export function lerTemaPhanyx(): TemaPhanyx {
  try { return normalizarTemaPhanyx(localStorage.getItem("phanyx_tema")); }
  catch { return normalizarTemaPhanyx(document.documentElement.dataset.themeChoice); }
}

/** O terceiro tema do PHANYX tem uma paleta cinza própria no CSS global. */
export function temaPhanyxEscuro(tema: TemaPhanyx) {
  return tema === "dark" || tema === "system";
}

export function aplicarTemaPhanyx(tema: TemaPhanyx, pathname = window.location.pathname) {
  const root = document.documentElement;
  const privado = /^\/(admin|professor|aluno|master)(\/|$)/.test(pathname);
  const escolha = privado ? tema : "public";
  const mudou = root.dataset.themeChoice !== escolha ||
    root.getAttribute("data-theme") !== (privado ? tema : null) ||
    root.classList.contains("dark") !== (privado && temaPhanyxEscuro(tema));
  if (!mudou) return;

  if (privado) root.dataset.theme = tema;
  else root.removeAttribute("data-theme");
  root.dataset.themeChoice = escolha;
  root.classList.toggle("dark", privado && temaPhanyxEscuro(tema));
  window.dispatchEvent(new Event("phanyx-theme-change"));
}
