"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("RhAppAccess");
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
      <div className="max-h-[82vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-2xl">
        <div className="flex items-start gap-4">
          <img
            src="/app-rh-icon-192.png"
            alt={t("productName")}
            className="h-16 w-16 rounded-2xl border border-slate-600 bg-white object-contain p-1"
          />

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              {t("productName")}
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
              {t("install.title", {name: nomeInstituicao})}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {t("install.description")}
            </p>
          </div>
        </div>

        {mostrarInstrucoes && sistema === "ios" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <p className="font-black text-slate-900 dark:text-white">
              {t("install.iphoneTitle")}
            </p>

            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>{t("install.iosStep1")}</li>
              <li>{t("install.iosStep2")}</li>
              <li>
                {t("install.iosStep3")}
              </li>
              <li>{t("install.iosStep4")}</li>
            </ol>
          </div>
        )}

        {mostrarInstrucoes && sistema !== "ios" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <p className="font-black text-slate-900 dark:text-white">
              {t("install.androidTitle")}
            </p>

            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>{t("install.androidStep1")}</li>
              <li>
                {t("install.androidStep2")}
              </li>
              <li>
                {t("install.androidStep3")}
              </li>
              <li>{t("install.androidStep4")}</li>
            </ol>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={fechar}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-300"
          >
            {t("install.notNow")}
          </button>

          <button
  type="button"
  onClick={
    mostrarInstrucoes
      ? fechar
      : instalar
  }
  className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800"
>
  {mostrarInstrucoes
    ? t("install.gotIt")
    : eventoInstalacao
      ? t("install.installApp")
      : t("install.howToInstall")}
</button>
        </div>
      </div>
    </div>
  );
}