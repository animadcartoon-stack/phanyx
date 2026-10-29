"use client";
import type { ReactNode } from "react";

type PhanyxConfirmModalProps = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  children?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  textoCarregando?: string;
  carregando?: boolean;
  mostrarCancelar?: boolean;
  tipo?: "perigo" | "normal";
  onConfirmar: () => void;
  onCancelar: () => void;
};

export default function PhanyxConfirmModal({
  aberto,
  titulo,
  mensagem,
  children,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  textoCarregando = "Processando...",
  carregando = false,
  mostrarCancelar = true,
  tipo = "normal",
  onConfirmar,
  onCancelar,
}: PhanyxConfirmModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          PHANYX
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          {titulo}
        </h2>

        <p className="mt-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
          {mensagem}
        </p>

        {children ? <div className="mt-4 space-y-4 text-slate-900 dark:text-slate-100">{children}</div> : null}

        <div className="mt-6 flex justify-end gap-3">
          {mostrarCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              disabled={carregando}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {textoCancelar}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirmar}
            autoFocus={!mostrarCancelar}
            disabled={carregando}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              tipo === "perigo"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {carregando ? textoCarregando : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}