"use client";

import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";
import AvisoInteligenteBanner from "@/components/phanyx/AvisoInteligenteBanner";
import { feriadoNacionalHoje } from "@/lib/phanyx/feriados";

type Props = {
  variante?: "dashboard" | "compacta";
};

export default function CentralAvisosPhanyx({
  variante = "dashboard",
}: Props) {
  const existeFeriado = !!feriadoNacionalHoje();

  if (variante === "compacta") {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {existeFeriado
          ? "🇧🇷 Feriado próximo"
          : "🎗️ Campanha do mês"}
      </div>
    );
  }

  return existeFeriado ? (
    <PhanyxFeriadoAviso />
  ) : (
    <AvisoInteligenteBanner />
  );
}