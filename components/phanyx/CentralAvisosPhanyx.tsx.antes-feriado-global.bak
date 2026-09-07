"use client";

import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";
import AvisoInteligenteBanner from "@/components/phanyx/AvisoInteligenteBanner";
import { feriadoNacionalHoje } from "@/lib/phanyx/feriados";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  variante?: "dashboard" | "compacta";
};

export default function CentralAvisosPhanyx({
  variante = "dashboard",
}: Props) {
  const locale = useLocale();
  const t = useTranslations("MonthlyCampaign");

  /*
   * Enquanto o país da instituição ainda não estiver cadastrado,
   * feriados nacionais brasileiros aparecem somente no pt-BR.
   */
  const existeFeriado =
    locale === "pt-BR" && Boolean(feriadoNacionalHoje());

  if (variante === "compacta") {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {existeFeriado
          ? `🇧🇷 ${t("upcomingHoliday")}`
          : `🎗️ ${t("monthlyCampaign")}`}
      </div>
    );
  }

  return existeFeriado ? (
    <PhanyxFeriadoAviso />
  ) : (
    <AvisoInteligenteBanner />
  );
}