"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

function detectarSistema() {
  if (typeof window === "undefined") return "android";

  const ua = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "android";
}

export default function InstallPromptPHANYX() {
  const t = useTranslations("InstallPrompt");
  const [eventoInstall, setEventoInstall] = useState<any>(null);
  const [visivel, setVisivel] = useState(false);
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState(false);
  const sistema = detectarSistema();

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

    if (eventoInstall && sistema !== "ios") {
      eventoInstall.prompt();
      const escolha = await eventoInstall.userChoice;

      if (escolha?.outcome === "accepted") {
        localStorage.setItem("phanyx_app_instalado", "true");
      }

      setEventoInstall(null);
      setVisivel(false);
      return;
    }

    setMostrarInstrucoes(true);
  }

  function fechar() {
    sessionStorage.setItem("phanyx_install_fechado_sessao", "true");
    setVisivel(false);
  }

  if (!visivel || estaEmModoApp()) return null;

  return (
    <section className="my-4 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden" aria-label={t("title")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("title")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={fechar} className="min-h-11 rounded-xl px-3 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
            {t("dismiss")}
          </button>
          <button
            type="button"
            aria-expanded={mostrarInstrucoes}
            onClick={mostrarInstrucoes ? fechar : instalar}
            className="min-h-11 rounded-xl bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {mostrarInstrucoes ? t("done") : t("install")}
          </button>
        </div>
      </div>

      {mostrarInstrucoes && (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm leading-relaxed dark:border-slate-700">
          <p>{t(sistema === "ios" ? "iosIntro" : "androidIntro")}</p>
          <ol className="list-decimal space-y-1 ps-5">
            <li>{t(sistema === "ios" ? "iosShare" : "androidMenu")}</li>
            <li>{t(sistema === "ios" ? "iosAdd" : "androidAdd")}</li>
            <li>{t("openApp")}</li>
          </ol>
        </div>
      )}
    </section>
  );
}
