"use client";

type PhanyxToastProps = {
  tipo?: "sucesso" | "erro" | "aviso" | "info";
  titulo?: string;
  mensagem: string;
  onClose?: () => void;
};

export default function PhanyxToast({
  tipo = "info",
  titulo,
  mensagem,
  onClose,
}: PhanyxToastProps) {
  const estilos = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
    erro: "border-red-200 bg-red-50 text-red-800",
    aviso: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  const titulos = {
    sucesso: "Tudo certo.",
    erro: "Não foi possível concluir.",
    aviso: "Atenção.",
    info: "Informação.",
  };

  return (
    <div
      className={`rounded-2xl border p-4 text-sm shadow-sm ${estilos[tipo]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{titulo || titulos[tipo]}</p>
          <p className="mt-1 leading-5">{mensagem}</p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-bold opacity-70 hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}