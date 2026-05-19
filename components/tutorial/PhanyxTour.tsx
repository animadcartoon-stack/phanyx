"use client";

import { useEffect, useState } from "react";

export type TourStep = {
  id: string;
  titulo: string;
  subtitulo?: string;
  descricao: string;
  target: string;
};

type PhanyxTourProps = {
  steps: TourStep[];
  storageKey: string;
  tituloFinal?: string;
  descricaoFinal?: string;
  onFinalPrimaryClick?: () => void;
  textoBotaoFinal?: string;
};

export default function PhanyxTour({
  steps,
  storageKey,
  tituloFinal = "Parabéns! Processo concluído 🚀",
  descricaoFinal = "Você concluiu o tutorial.",
  onFinalPrimaryClick,
  textoBotaoFinal = "Continuar",
}: PhanyxTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    const oculto = localStorage.getItem(storageKey);

    if (!oculto) {
      setAberto(true);
    }
  }, [storageKey]);

  const fechar = () => {
    setAberto(false);
  };

  const nuncaMais = () => {
    localStorage.setItem(storageKey, "hidden");
    setAberto(false);
  };

  const proximo = () => {
    if (stepIndex >= steps.length - 1) {
      setConcluido(true);
      return;
    }

    setStepIndex((prev) => prev + 1);
  };

  const anterior = () => {
    if (stepIndex <= 0) return;
    setStepIndex((prev) => prev - 1);
  };

  if (!aberto) return null;

  if (concluido) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <div className="text-center">
            <img
              src="/images/formix-bemvindo.png"
              alt="Mascote PHANYX"
              className="mx-auto h-24 w-24 object-contain"
            />

            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
              Tutorial concluído
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              {tituloFinal}
            </h2>

            <p className="mt-4 text-slate-600">
              {descricaoFinal}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.setItem(storageKey, "hidden");
                  setAberto(false);
                  onFinalPrimaryClick?.();
                }}
                className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white"
              >
                {textoBotaoFinal}
              </button>

              <button
                onClick={() => {
                  localStorage.setItem(storageKey, "hidden");
                  setAberto(false);
                }}
                className="rounded-2xl border border-slate-300 px-6 py-3 font-semibold"
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const step = steps[stepIndex];

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70">
      <div className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl">
        <img
          src="/images/formix.png"
          alt="Mascote"
          className="mb-4 h-20 w-20 object-contain"
        />

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
          Tutorial guiado
        </p>

        <h2 className="mt-2 text-3xl font-black text-slate-900">
          {step.titulo}
        </h2>

        {step.subtitulo && (
          <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-blue-700">
            {step.subtitulo}
          </div>
        )}

        <p className="mt-5 text-slate-600">
          {step.descricao}
        </p>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Etapa {stepIndex + 1} de {steps.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={fechar}
              className="rounded-2xl border border-slate-300 px-4 py-2"
            >
              Fechar
            </button>

            <button
              onClick={nuncaMais}
              className="rounded-2xl border border-amber-400 px-4 py-2 text-amber-700"
            >
              Não mostrar mais
            </button>

            {stepIndex > 0 && (
              <button
                onClick={anterior}
                className="rounded-2xl border border-slate-300 px-4 py-2"
              >
                Anterior
              </button>
            )}

            <button
              onClick={proximo}
              className="rounded-2xl bg-blue-600 px-5 py-2 font-bold text-white"
            >
              {stepIndex === steps.length - 1 ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}