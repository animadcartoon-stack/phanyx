"use client";

import * as Bandeiras from "country-flag-icons/react/3x2";

type Props = {
  codigo?: string | null;
  nome?: string;
  className?: string;
};

export default function BandeiraPais({
  codigo,
  nome,
  className = "h-5 w-7 rounded-sm object-cover shadow-sm",
}: Props) {
  const codigoNormalizado = String(codigo || "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(codigoNormalizado)) {
    return (
      <span
        className="inline-flex h-5 w-7 items-center justify-center rounded-sm bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        aria-hidden="true"
      >
        —
      </span>
    );
  }

  const Bandeira =
    Bandeiras[
      codigoNormalizado as keyof typeof Bandeiras
    ];

  if (!Bandeira) {
    return (
      <span
        className="inline-flex h-5 min-w-7 items-center justify-center rounded-sm bg-slate-100 px-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        title={nome || codigoNormalizado}
      >
        {codigoNormalizado}
      </span>
    );
  }

  return (
    <Bandeira
      title={nome || codigoNormalizado}
      className={className}
    />
  );
}
