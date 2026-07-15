"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function estaEmModoAplicativo() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & {
      standalone?: boolean;
    }).standalone === true
  );
}

function detectarSistema() {
  if (typeof window === "undefined") return "android";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  return "android";
}

export default function InstallPromptPhanyxRH({
  nomeInstituicao,
}: {
  nomeInstituicao: string;
}) {
  const [eventoInstalacao, setEventoInstalacao] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [visivel, setVisivel] = useState(false);
  const [mostrarInstrucoes, setMostrarInstrucoes] =
    useState(false);

  const sistema = detectarSistema();

  useEffect(() => {
    if (estaEmModoAplicativo()) {
      setVisivel(false);
      return;
    }

    const fechadoNestaSessao = sessionStorage.getItem(
      "phanyx_rh_install_fechado_sessao"
    );

    const jaInstalou = localStorage.getItem(
      "phanyx_rh_app_instalado"
    );

    if (jaInstalou === "true") {
      setVisivel(false);
      return;
    }

    function capturarEvento(evento: Event) {
      evento.preventDefault();

      setEventoInstalacao(
        evento as BeforeInstallPromptEvent
      );

      if (fechadoNestaSessao !== "true") {
        setVisivel(true);
      }
    }

    function marcarComoInstalado() {
      localStorage.setItem(
        "phanyx_rh_app_instalado",
        "true"
      );

      setVisivel(false);
      setEventoInstalacao(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      capturarEvento
    );

    window.addEventListener(
      "appinstalled",
      marcarComoInstalado
    );

    const timer = window.setTimeout(() => {
      if (
        !estaEmModoAplicativo() &&
        fechadoNestaSessao !== "true" &&
        jaInstalou !== "true"
      ) {
        setVisivel(true);
      }
    }, 1800);

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "beforeinstallprompt",
        capturarEvento
      );

      window.removeEventListener(
        "appinstalled",
        marcarComoInstalado
      );
    };
  }, []);

  async function instalar() {
    if (estaEmModoAplicativo()) {
      setVisivel(false);
      return;
    }

    if (eventoInstalacao && sistema !== "ios") {
      await eventoInstalacao.prompt();

      const escolha =
        await eventoInstalacao.userChoice;

      if (escolha.outcome === "accepted") {
        localStorage.setItem(
          "phanyx_rh_app_instalado",
          "true"
        );
      }

      setEventoInstalacao(null);
      setVisivel(false);
      return;
    }

    setMostrarInstrucoes(true);
  }

  function fechar() {
    sessionStorage.setItem(
      "phanyx_rh_install_fechado_sessao",
      "true"
    );

    setVisivel(false);
  }

  if (!visivel || estaEmModoAplicativo()) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-5 z-[200] mx-auto max-w-md">
      <div className="max-h-[82vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
        <div className="flex items-start gap-4">
          <img
            src="/app-rh-icon-192.png"
            alt="RH Ponto"
            className="h-16 w-16 rounded-2xl border border-slate-600 bg-white object-contain p-1"
          />

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
              RH Ponto
            </p>

            <h2 className="mt-1 text-lg font-black text-white">
              Instalar RH - {nomeInstituicao}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Adicione o aplicativo à tela inicial para
              registrar seu ponto rapidamente.
            </p>
          </div>
        </div>

        {mostrarInstrucoes && sistema === "ios" && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
            <p className="font-black text-white">
              Instalar no iPhone
            </p>

            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>Abra esta página no Safari.</li>
              <li>Toque no botão Compartilhar.</li>
              <li>
                Escolha “Adicionar à Tela de Início”.
              </li>
              <li>Confirme em “Adicionar”.</li>
            </ol>
          </div>
        )}

        {mostrarInstrucoes && sistema !== "ios" && (
          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
            <p className="font-black text-white">
              Instalar no Android
            </p>

            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>Use o Chrome ou Brave.</li>
              <li>
                Toque nos três pontinhos do navegador.
              </li>
              <li>
                Escolha “Instalar app” ou “Adicionar à
                tela inicial”.
              </li>
              <li>Confirme a instalação.</li>
            </ol>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={fechar}
            className="rounded-2xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300"
          >
            Agora não
          </button>

          <button
  type="button"
  onClick={
    mostrarInstrucoes
      ? fechar
      : instalar
  }
  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
>
  {mostrarInstrucoes
    ? "Entendi"
    : eventoInstalacao
      ? "Instalar aplicativo"
      : "Como instalar"}
</button>
        </div>
      </div>
    </div>
  );
}