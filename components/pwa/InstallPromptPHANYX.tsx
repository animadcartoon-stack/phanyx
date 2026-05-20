"use client";

import { useEffect, useState } from "react";

export default function InstallPromptPHANYX() {
  const [eventoInstall, setEventoInstall] = useState<any>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const jaRecusou = localStorage.getItem("phanyx_install_recusado");

    function capturarEvento(e: any) {
      e.preventDefault();
      setEventoInstall(e);

      if (jaRecusou !== "true") {
        setVisivel(true);
      }
    }

    window.addEventListener("beforeinstallprompt", capturarEvento);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturarEvento);
    };
  }, []);

  async function instalar() {
    if (!eventoInstall) return;

    eventoInstall.prompt();
    await eventoInstall.userChoice;

    setEventoInstall(null);
    setVisivel(false);
  }

  function fechar() {
    localStorage.setItem("phanyx_install_recusado", "true");
    setVisivel(false);
  }

  if (!visivel) return null;

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
              Acesse aluno, professor ou admin com aparência de aplicativo,
              direto pela tela inicial.
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