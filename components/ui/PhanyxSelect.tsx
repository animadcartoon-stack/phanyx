"use client";

import { useEffect, useRef, useState } from "react";

type Opcao = {
  value: string;
  label: string;
};

export default function PhanyxSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Opcao[];
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const opcaoSelecionada = options.find((opcao) => opcao.value === value);

  useEffect(() => {
    function fecharFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharFora);
    return () => document.removeEventListener("mousedown", fecharFora);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <span className="truncate">
          {opcaoSelecionada?.label || placeholder}
        </span>

        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
          ▼
        </span>
      </button>

      {aberto && (
        <div className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {options.map((opcao) => {
            const ativo = opcao.value === value;

            return (
              <button
                key={opcao.value || "vazio"}
                type="button"
                onClick={() => {
                  onChange(opcao.value);
                  setAberto(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  ativo
                    ? "bg-blue-600 text-white"
                    : "text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {opcao.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}