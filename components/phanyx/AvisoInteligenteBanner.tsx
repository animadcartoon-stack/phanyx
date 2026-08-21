"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import BannerPhanyx from "@/components/phanyx/BannerPhanyx";
import { getAvisoInteligente } from "@/lib/phanyx/avisos-inteligentes";

export default function AvisoInteligenteBanner() {
  const locale = useLocale();
  const t = useTranslations("MonthlyCampaign");
  const aviso = getAvisoInteligente();

  const [visivel, setVisivel] = useState(true);

  const dataAtual = new Date();
  const hoje = dataAtual.toISOString().slice(0, 10);

  const nomeMesOriginal = new Intl.DateTimeFormat(locale, {
    month: "long",
  }).format(dataAtual);

  const nomeMes =
    nomeMesOriginal.charAt(0).toUpperCase() +
    nomeMesOriginal.slice(1);

  const conteudo =
    locale === "pt-BR"
      ? {
          titulo: aviso.titulo,
          descricao: aviso.descricao,
          frase: aviso.frase,
          categoria: aviso.categoria,
        }
      : {
          titulo: t("genericTitle", {
            month: nomeMes,
          }),
          descricao: t("genericDescription"),
          frase: t("genericPhrase"),
          categoria: `❤️ ${t("health")}`,
        };

  const chaveStorage =
    `phanyx-aviso-inteligente-${locale}-${hoje}`;

  useEffect(() => {
    const avisoFechado = localStorage.getItem(chaveStorage);

    if (avisoFechado === "fechado") {
      setVisivel(false);
    } else {
      setVisivel(true);
    }
  }, [chaveStorage]);

  function fecharAviso() {
    localStorage.setItem(chaveStorage, "fechado");
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="phanyx-aviso-inteligente">
      <BannerPhanyx
        aviso={{
          titulo: conteudo.titulo,
          descricao: conteudo.descricao,
          frase: conteudo.frase,
          icone: aviso.icone,
          categoria: conteudo.categoria,
          origem: t("origin"),
          cor: aviso.cor,
          textoBotao:
            locale === "pt-BR"
              ? aviso.textoBotao
              : undefined,
          onFechar: fecharAviso,
        }}
      />
    </div>
  );
}