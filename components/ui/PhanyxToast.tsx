"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

type PhanyxToastProps = {
  tipo?: "sucesso" | "erro" | "aviso" | "info";
  titulo?: string;
  mensagem: string;
  onClose?: () => void;
};

type Tema = "light" | "dark" | "system";

type ModoTema =
  | "light"
  | "dark"
  | "system-dark";

type TipoToast =
  | "sucesso"
  | "erro"
  | "aviso"
  | "info";

function obterTituloPadrao(
  locale: string,
  tipo: TipoToast
) {
  const idioma = locale.toLowerCase();

  if (idioma.startsWith("en")) {
    const titulos = {
      sucesso: "All set.",
      erro: "Could not complete.",
      aviso: "Attention.",
      info: "Information.",
    };

    return titulos[tipo];
  }

  if (idioma.startsWith("es")) {
    const titulos = {
      sucesso: "Todo listo.",
      erro: "No se pudo completar.",
      aviso: "Atención.",
      info: "Información.",
    };

    return titulos[tipo];
  }

  if (idioma.startsWith("fr")) {
    const titulos = {
      sucesso: "Tout est prêt.",
      erro: "Impossible de terminer.",
      aviso: "Attention.",
      info: "Information.",
    };

    return titulos[tipo];
  }

  if (idioma === "pt-pt") {
    const titulos = {
      sucesso: "Tudo certo.",
      erro: "Não foi possível concluir.",
      aviso: "Atenção.",
      info: "Informação.",
    };

    return titulos[tipo];
  }

  const titulos = {
    sucesso: "Tudo certo.",
    erro: "Não foi possível concluir.",
    aviso: "Atenção.",
    info: "Informação.",
  };

  return titulos[tipo];
}

export default function PhanyxToast({
  tipo = "info",
  titulo,
  mensagem,
  onClose,
}: PhanyxToastProps) {
  const locale = useLocale();

  const [temaAtual, setTemaAtual] =
    useState<Tema>("light");

  const [sistemaEscuro, setSistemaEscuro] =
    useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function atualizarTema() {
      const temaSalvo =
        localStorage.getItem("phanyx_tema");

      const tema: Tema =
        temaSalvo === "light" ||
        temaSalvo === "dark" ||
        temaSalvo === "system"
          ? temaSalvo
          : "system";

      setTemaAtual(tema);
      setSistemaEscuro(media.matches);
    }

    atualizarTema();

    window.addEventListener(
      "storage",
      atualizarTema
    );

    window.addEventListener(
      "phanyx-theme-change",
      atualizarTema
    );

    media.addEventListener(
      "change",
      atualizarTema
    );

    const observer = new MutationObserver(
      atualizarTema
    );

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: [
          "data-theme",
          "data-theme-choice",
          "class",
        ],
      }
    );

    return () => {
      window.removeEventListener(
        "storage",
        atualizarTema
      );

      window.removeEventListener(
        "phanyx-theme-change",
        atualizarTema
      );

      media.removeEventListener(
        "change",
        atualizarTema
      );

      observer.disconnect();
    };
  }, []);

  const modoTema: ModoTema =
    temaAtual === "dark"
      ? "dark"
      : temaAtual === "system" &&
          sistemaEscuro
        ? "system-dark"
        : "light";

  const estilos = useMemo(() => {
    if (modoTema === "dark") {
      return {
        sucesso: {
          caixa:
            "!border-emerald-800 !bg-emerald-950/60",
          texto:
            "!text-emerald-200",
        },

        erro: {
          caixa:
            "!border-red-800 !bg-red-950/60",
          texto:
            "!text-red-200",
        },

        aviso: {
          caixa:
            "!border-amber-700 !bg-amber-950/50",
          texto:
            "!text-amber-200",
        },

        info: {
          caixa:
            "!border-blue-800 !bg-blue-950/60",
          texto:
            "!text-blue-200",
        },
      };
    }

    if (modoTema === "system-dark") {
      return {
        sucesso: {
          caixa:
            "!border-emerald-700 !bg-neutral-900",
          texto:
            "!text-emerald-200",
        },

        erro: {
          caixa:
            "!border-red-700 !bg-neutral-900",
          texto:
            "!text-red-200",
        },

        aviso: {
          caixa:
            "!border-amber-600 !bg-neutral-900",
          texto:
            "!text-amber-200",
        },

        info: {
          caixa:
            "!border-sky-700 !bg-neutral-900",
          texto:
            "!text-sky-200",
        },
      };
    }

    return {
      sucesso: {
        caixa:
          "!border-emerald-200 !bg-emerald-50",
        texto:
          "!text-emerald-800",
      },

      erro: {
        caixa:
          "!border-red-200 !bg-red-50",
        texto:
          "!text-red-800",
      },

      aviso: {
        caixa:
          "!border-amber-200 !bg-amber-50",
        texto:
          "!text-amber-800",
      },

      info: {
        caixa:
          "!border-blue-200 !bg-blue-50",
        texto:
          "!text-blue-800",
      },
    };
  }, [modoTema]);

  const estiloAtual =
    estilos[tipo];

  const tituloExibido =
    titulo ||
    obterTituloPadrao(
      locale,
      tipo
    );

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border p-4 text-sm shadow-sm transition-colors ${estiloAtual.caixa}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`font-semibold ${estiloAtual.texto}`}
          >
            {tituloExibido}
          </p>

          <p
            className={`mt-1 leading-5 ${estiloAtual.texto}`}
          >
            {mensagem}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className={`rounded-lg px-2 py-1 text-xs font-bold opacity-70 transition hover:opacity-100 ${estiloAtual.texto}`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}