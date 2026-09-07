"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

import AvisoInteligenteBanner from "@/components/phanyx/AvisoInteligenteBanner";

import PhanyxFeriadoAviso, {
  type FeriadoAtivoPhanyx,
} from "@/components/ui/PhanyxFeriadoAviso";

type Props = {
  variante?:
    | "dashboard"
    | "compacta";
};

type RespostaFeriadoAtual = {
  ok?: boolean;
  feriado?:
    | FeriadoAtivoPhanyx
    | null;
};

export default function CentralAvisosPhanyx({
  variante = "dashboard",
}: Props) {
  const locale =
    useLocale();

  const tMonthly =
    useTranslations(
      "MonthlyCampaign"
    );

  const tHoliday =
    useTranslations(
      "PublicHolidayBanner"
    );

  const [
    feriado,
    setFeriado,
  ] =
    useState<FeriadoAtivoPhanyx | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  useEffect(() => {
    const controller =
      new AbortController();

    let ativo = true;

    async function carregarFeriado() {
      try {
        setCarregando(true);

        const resposta =
          await fetch(
            `/api/phanyx/feriado-atual?locale=${encodeURIComponent(
              locale
            )}`,
            {
              cache: "no-store",
              credentials:
                "include",
              signal:
                controller.signal,
            }
          );

        if (!resposta.ok) {
          if (ativo) {
            setFeriado(null);
          }

          return;
        }

        const dados =
          (await resposta.json()) as
            RespostaFeriadoAtual;

        if (!ativo) {
          return;
        }

        setFeriado(
          dados?.feriado ||
            null
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "Erro ao carregar feriado PHANYX:",
          error
        );

        if (ativo) {
          setFeriado(null);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarFeriado();

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [locale]);

  /*
   * Evita mostrar o aviso mensal por
   * alguns milissegundos antes de saber
   * se existe feriado ativo.
   */
  if (carregando) {
    return null;
  }

  if (
    variante ===
    "compacta"
  ) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {feriado
          ? tHoliday(
              "compact",
              {
                name:
                  feriado.nome,
              }
            )
          : `🎗️ ${tMonthly(
              "monthlyCampaign"
            )}`}
      </div>
    );
  }

  return feriado ? (
    <PhanyxFeriadoAviso
      feriado={feriado}
    />
  ) : (
    <AvisoInteligenteBanner />
  );
}
