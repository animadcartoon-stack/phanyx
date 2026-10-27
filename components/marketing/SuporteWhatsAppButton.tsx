"use client";

import { useState } from "react";

const mensagem =
  "Ol\u00e1! Vim pelo site PHANYX e preciso de suporte t\u00e9cnico para utilizar a plataforma. Poderiam me ajudar?";

const whatsappUrl =
  `https://wa.me/5548988101240?text=${encodeURIComponent(mensagem)}`;

export default function SuporteWhatsAppButton() {
  const [estado, setEstado] = useState<
    "inicial" | "copiada" | "falha"
  >("inicial");

  function copiarMensagem() {
    if (!navigator.clipboard?.writeText) {
      setEstado("falha");
      return;
    }

    void navigator.clipboard.writeText(mensagem)
      .then(() => setEstado("copiada"))
      .catch(() => setEstado("falha"));
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden flex-col items-end gap-2 md:flex">
      {estado !== "inicial" && (
        <div
          role="status"
          className="max-w-xs rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-xl"
        >
          <p>
            {estado === "copiada"
              ? "Mensagem copiada! Se n\u00e3o aparecer no WhatsApp, pressione Ctrl+V."
              : "N\u00e3o foi poss\u00edvel copiar automaticamente. Selecione a mensagem abaixo e pressione Ctrl+C."}
          </p>

          {estado === "falha" ? (
            <textarea
              aria-label="Mensagem de suporte"
              value={mensagem}
              readOnly
              rows={3}
              onFocus={(evento) => evento.currentTarget.select()}
              className="mt-2 w-full rounded-md border border-slate-300 p-2"
            />
          ) : (
            <button
              type="button"
              onClick={copiarMensagem}
              className="mt-2 font-semibold text-green-700 underline"
            >
              Copiar novamente
            </button>
          )}
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={copiarMensagem}
        className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:bg-green-400"
      >
        {"\uD83D\uDCAC"} Suporte
      </a>
    </div>
  );
}