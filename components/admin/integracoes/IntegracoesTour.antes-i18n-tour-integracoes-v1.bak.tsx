"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    target: '[data-tour="cards-integracoes"]',
    titulo: "Central de integrações",
    destaque: "Aqui ficam as integrações Google do PHANYX.",
    descricao:
      "Nesta área você configura Analytics, Tag Manager, Search Console, Google Ads e presença local.",
    imagem: "/images/formix-tutorial.png",
  },
];

export default function IntegracoesTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const [targetRect, setTargetRect] = useState<any>(null);
  const step = steps[0];

  useEffect(() => {
    if (!aberto) return;

    const el = document.querySelector(step.target);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }, 250);
  }, [aberto, step.target]);

  if (!aberto) return null;

  const spotlight = targetRect
    ? {
        top: Math.max(targetRect.top - 8, 8),
        left: Math.max(targetRect.left - 8, 8),
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-3xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
          style={spotlight}
        />
      )}

      <div
        className="absolute w-[min(430px,calc(100vw-32px))] rounded-[28px] border bg-white px-5 py-4 shadow-2xl"
        style={{
          top: spotlight
            ? Math.min(spotlight.top + spotlight.height + 18, window.innerHeight - 320)
            : 160,
          left: spotlight
            ? Math.max(24, Math.min(spotlight.left, window.innerWidth - 460))
            : 360,
        }}
      >
        <div className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t bg-white" />

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 object-contain drop-shadow-lg"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              Tutorial guiado
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {step.titulo}
            </h3>

            <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {step.destaque}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {step.descricao}
            </p>

            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}