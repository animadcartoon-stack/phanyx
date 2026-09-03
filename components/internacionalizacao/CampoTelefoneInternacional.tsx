"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

import type {
  CountryCode,
} from "libphonenumber-js";

import {
  detectarPaisTelefone,
  formatarTelefonePorPais,
  obterPaisesTelefone,
} from "@/lib/internacionalizacao/telefone";

export type CampoTelefoneInternacionalProps = {
  value: string;
  pais: CountryCode;

  onChange: (
    valor: string,
    pais: CountryCode
  ) => void;

  id?: string;
  name?: string;
  erro?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

function bandeiraPais(
  codigo: CountryCode
) {
  return String(codigo)
    .toUpperCase()
    .replace(
      /./g,
      (letra) =>
        String.fromCodePoint(
          127397 +
            letra.charCodeAt(0)
        )
    );
}

function normalizarBusca(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

export default function CampoTelefoneInternacional({
  value,
  pais,
  onChange,
  id,
  name,
  erro,
  disabled = false,
  required = false,
  placeholder,
}: CampoTelefoneInternacionalProps) {
  const locale = useLocale();

  const t = useTranslations(
    "InternationalPhone"
  );

  const [
    aberto,
    setAberto,
  ] = useState(false);

  const [
    busca,
    setBusca,
  ] = useState("");

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const paises = useMemo(
    () =>
      obterPaisesTelefone(locale),
    [locale]
  );

  useEffect(() => {
    function fecharAoClicarFora(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    function fecharComEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setAberto(false);
        setBusca("");
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    document.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );

      document.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, []);

  const paisAtual = useMemo(
    () =>
      paises.find(
        (item) =>
          item.codigo === pais
      ) ??
      paises.find(
        (item) =>
          item.codigo === "BR"
      ) ??
      paises[0],
    [pais, paises]
  );

  const paisesFiltrados =
    useMemo(() => {
      const termo =
        normalizarBusca(busca);

      if (!termo) {
        return paises;
      }

      return paises.filter(
        (item) => {
          const texto =
            normalizarBusca(
              [
                item.nome,
                item.prefixo,
                item.codigo,
              ].join(" ")
            );

          return texto.includes(
            termo
          );
        }
      );
    }, [busca, paises]);

  function selecionarPais(
    novoPais: CountryCode
  ) {
    const valorReformatado =
      formatarTelefonePorPais(
        value,
        novoPais
      );

    onChange(
      valorReformatado,
      novoPais
    );

    setAberto(false);
    setBusca("");
  }

  function alterarTelefone(
    valorDigitado: string
  ) {
    const paisDetectado =
      detectarPaisTelefone(
        valorDigitado
      );

    const proximoPais =
      paisDetectado ?? pais;

    const formatado =
      formatarTelefonePorPais(
        valorDigitado,
        proximoPais
      );

    onChange(
      formatado,
      proximoPais
    );
  }

  const erroId =
    erro && id
      ? `${id}-erro`
      : undefined;

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <div
        className={`flex min-w-0 rounded-xl border transition focus-within:ring-2 ${
          erro
            ? "border-red-500 bg-red-50 focus-within:border-red-600 focus-within:ring-red-200 dark:border-red-500 dark:bg-red-950/30 dark:focus-within:ring-red-900"
            : "border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-900"
        }`}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setAberto(
              (atual) => !atual
            )
          }
          className="flex shrink-0 items-center gap-2 rounded-l-xl border-r border-slate-300 bg-white px-3 py-3 text-left text-sm font-medium text-slate-800 transition hover:!bg-slate-100 hover:!text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:!bg-slate-800 dark:hover:!text-white"
          aria-expanded={aberto}
          aria-haspopup="listbox"
          aria-label={t(
            "selectCountry"
          )}
        >
          <span
            className="text-lg"
            aria-hidden="true"
          >
            {bandeiraPais(
              paisAtual.codigo
            )}
          </span>

          <span className="hidden sm:inline">
            {paisAtual.nome}
          </span>

          <span className="font-semibold">
            {paisAtual.prefixo}
          </span>

          <span
            className="text-xs text-slate-600 dark:text-slate-300"
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        <input
          id={id}
          name={name}
          required={required}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={value}
          onChange={(event) =>
            alterarTelefone(
              event.target.value
            )
          }
          placeholder={
            placeholder ??
            t("placeholder")
          }
          aria-invalid={
            Boolean(erro)
          }
          aria-describedby={
            erroId
          }
          className="min-w-0 flex-1 rounded-r-xl border-0 bg-transparent px-3.5 py-3 text-base text-slate-950 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:placeholder:text-slate-400"
        />
      </div>

      {aberto && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-0 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl sm:min-w-[320px] dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 p-3 dark:border-slate-700">
            <input
              type="search"
              autoFocus
              value={busca}
              onChange={(event) =>
                setBusca(
                  event.target.value
                )
              }
              placeholder={t(
                "searchCountry"
              )}
              aria-label={t(
                "searchCountry"
              )}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {paisesFiltrados.length >
            0 ? (
              paisesFiltrados.map(
                (item) => {
                  const selecionado =
                    item.codigo ===
                    pais;

                  return (
                    <button
                      key={
                        item.codigo
                      }
                      type="button"
                      role="option"
                      aria-selected={
                        selecionado
                      }
                      onClick={() =>
                        selecionarPais(
                          item.codigo
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        selecionado
                          ? "bg-blue-100 font-semibold text-blue-950 dark:bg-blue-900/50 dark:text-blue-100"
                          : "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span
                        className="text-lg"
                        aria-hidden="true"
                      >
                        {bandeiraPais(
                          item.codigo
                        )}
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {item.nome}
                      </span>

                      <span className="shrink-0 font-medium text-slate-600 dark:text-slate-300">
                        {item.prefixo}
                      </span>

                      {selecionado && (
                        <span
                          className="shrink-0 text-blue-700 dark:text-blue-300"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                }
              )
            ) : (
              <div className="px-3 py-6 text-center text-sm font-medium text-slate-700 dark:text-slate-200">
                {t(
                  "noCountryFound"
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {erro && (
        <p
          id={erroId}
          className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-300"
        >
          {erro}
        </p>
      )}
    </div>
  );
}