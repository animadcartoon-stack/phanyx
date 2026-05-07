"use client";

type PhanyxConfirmModalProps = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  carregando?: boolean;
  tipo?: "perigo" | "normal";
  onConfirmar: () => void;
  onCancelar: () => void;
};

export default function PhanyxConfirmModal({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  carregando = false,
  tipo = "normal",
  onConfirmar,
  onCancelar,
}: PhanyxConfirmModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          PHANYX
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {titulo}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {mensagem}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {textoCancelar}
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              tipo === "perigo"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {carregando ? "Processando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}