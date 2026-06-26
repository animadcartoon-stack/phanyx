"use client";

import { useEffect, useState } from "react";
import BannerPhanyx from "@/components/phanyx/BannerPhanyx";
import { getAvisoInteligente } from "@/lib/phanyx/avisos-inteligentes";

export default function AvisoInteligenteBanner() {
  const aviso = getAvisoInteligente();
  const [visivel, setVisivel] = useState(true);

  const hoje = new Date().toISOString().slice(0, 10);
  const chaveStorage = `phanyx-aviso-inteligente-${hoje}`;

  useEffect(() => {
    const avisoFechado = localStorage.getItem(chaveStorage);
    if (avisoFechado === "fechado") {
      setVisivel(false);
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
        titulo: aviso.titulo,
        descricao: aviso.descricao,
        frase: aviso.frase,
        icone: aviso.icone,
        categoria: aviso.categoria,
        cor: aviso.cor,
        textoBotao: aviso.textoBotao,
        onFechar: fecharAviso,
      }}
    />
  </div>
);
}