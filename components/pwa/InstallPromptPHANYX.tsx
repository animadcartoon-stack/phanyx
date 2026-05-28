"use client";

import { useEffect, useState } from "react";

function estaEmModoApp() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
}

function ehDesktop() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(min-width: 1024px)").matches;
}

export default function InstallPromptPHANYX() {
  const [eventoInstall, setEventoInstall] = useState<any>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
  if (estaEmModoApp() || ehDesktop()) {
    setVisivel(false);
    return;
  }

    const jaFechouSessao = sessionStorage.getItem(
      "phanyx_install_fechado_sessao"
    );

    const jaInstalou = localStorage.getItem("phanyx_app_instalado");

    if (jaInstalou === "true") {
      setVisivel(false);
      return;
    }

    function capturarEvento(e: any) {
      e.preventDefault();
      setEventoInstall(e);

      if (jaFechouSessao !== "true" && !estaEmModoApp() && !ehDesktop()) {
  setVisivel(true);
}
    }

    function marcarComoInstalado() {
      localStorage.setItem("phanyx_app_instalado", "true");
      setVisivel(false);
      setEventoInstall(null);
    }

    window.addEventListener("beforeinstallprompt", capturarEvento);
    window.addEventListener("appinstalled", marcarComoInstalado);

    const timer = setTimeout(() => {
      if (
  !estaEmModoApp() &&
  !ehDesktop() &&
  jaFechouSessao !== "true" &&
  jaInstalou !== "true"
) {
  setVisivel(true);
}
    }, 2500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", capturarEvento);
      window.removeEventListener("appinstalled", marcarComoInstalado);
    };
  }, []);

  async function instalar() {
    if (estaEmModoApp()) {
      setVisivel(false);
      return;
    }

    if (eventoInstall) {
      eventoInstall.prompt();
      const escolha = await eventoInstall.userChoice;

      if (escolha?.outcome === "accepted") {
        localStorage.setItem("phanyx_app_instalado", "true");
      }

      setEventoInstall(null);
      setVisivel(false);
      return;
    }

    alert(
      "Para instalar o PHANYX no Android: toque nos 3 pontinhos do navegador e escolha 'Instalar app' ou 'Adicionar à tela inicial'.\n\nNo iPhone: toque em Compartilhar e depois em 'Adicionar à Tela de Início'."
    );
  }

  function fechar() {
    sessionStorage.setItem("phanyx_install_fechado_sessao", "true");
    setVisivel(false);
  }

  if (!visivel || estaEmModoApp()) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[90] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[380px]">
      <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <img
            src="/icon.png"
            alt="PHANYX"
            className="h-14 w-14 rounded-2xl border border-slate-200 bg-white p-1"
          />

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              App PHANYX
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Instale no seu celular
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Acesse aluno, professor ou admin direto pela tela inicial, com
              experiência de aplicativo.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={fechar}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600"
          >
            Agora não
          </button>

          <button
            type="button"
            onClick={instalar}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}