"use client";

import {
    type KeyboardEvent,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import {
    useLocale,
    useTranslations,
} from "next-intl";

import {
    LOCALE_PADRAO,
    LOCALES_SUPORTADOS,
    NOMES_DOS_LOCALES,
    localeEhSuportado,
    type LocalePhanyx,
} from "@/i18n/config";

type SeletorIdiomaProps = {
    className?: string;
    exibirRotulo?: boolean;
};

const BANDEIRAS_DOS_LOCALES: Record<
    LocalePhanyx,
    string
> = {
    "pt-BR": "🇧🇷",
    "pt-PT": "🇵🇹",
    "en-US": "🇺🇸",
    "es-ES": "🇪🇸",
    "fr-FR": "🇫🇷",
};

export default function SeletorIdioma({
    className = "",
    exibirRotulo = true,
}: SeletorIdiomaProps) {
    const id = useId();
    const menuId = `${id}-menu`;

    const localeAtual = useLocale();
    const t = useTranslations("Common");

    const localeInicial = localeEhSuportado(
        localeAtual
    )
        ? localeAtual
        : LOCALE_PADRAO;

    const [
        localeSelecionado,
        setLocaleSelecionado,
    ] = useState<LocalePhanyx>(localeInicial);

    const [alterando, setAlterando] =
        useState(false);

    const [erro, setErro] = useState("");

    const [aberto, setAberto] =
        useState(false);

    const [
        indiceFocado,
        setIndiceFocado,
    ] = useState(() =>
        Math.max(
            0,
            LOCALES_SUPORTADOS.indexOf(
                localeInicial
            )
        )
    );

    const containerRef =
        useRef<HTMLDivElement>(null);

    const botaoPrincipalRef =
        useRef<HTMLButtonElement>(null);

    const opcoesRefs =
        useRef<
            Array<HTMLButtonElement | null>
        >([]);

    useEffect(() => {
        if (
            !alterando &&
            localeEhSuportado(localeAtual)
        ) {
            setLocaleSelecionado(
                localeAtual
            );

            const indice =
                LOCALES_SUPORTADOS.indexOf(
                    localeAtual
                );

            if (indice >= 0) {
                setIndiceFocado(indice);
            }
        }
    }, [localeAtual, alterando]);

    useEffect(() => {
        if (!aberto) {
            return;
        }

        function fecharAoClicarFora(
            event: MouseEvent
        ) {
            const alvo =
                event.target as Node;

            if (
                !containerRef.current?.contains(
                    alvo
                )
            ) {
                setAberto(false);
            }
        }

        function fecharComEscape(
            event: globalThis.KeyboardEvent
        ) {
            if (event.key === "Escape") {
                setAberto(false);
                botaoPrincipalRef.current?.focus();
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
    }, [aberto]);

    useEffect(() => {
        if (!aberto) {
            return;
        }

        const indice =
            Math.max(
                0,
                LOCALES_SUPORTADOS.indexOf(
                    localeSelecionado
                )
            );

        setIndiceFocado(indice);

        requestAnimationFrame(() => {
            opcoesRefs.current[
                indice
            ]?.focus();
        });
    }, [aberto, localeSelecionado]);

    function abrirOuFechar() {
        if (alterando) {
            return;
        }

        setAberto((atual) => !atual);
        setErro("");
    }

    function moverFoco(
        direcao: 1 | -1
    ) {
        const total =
            LOCALES_SUPORTADOS.length;

        const proximo =
            (indiceFocado +
                direcao +
                total) %
            total;

        setIndiceFocado(proximo);

        opcoesRefs.current[
            proximo
        ]?.focus();
    }

    function tratarTecladoBotao(
        event: KeyboardEvent<HTMLButtonElement>
    ) {
        if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();

            if (!aberto) {
                setAberto(true);
            }
        }
    }

    function tratarTecladoOpcao(
        event: KeyboardEvent<HTMLButtonElement>,
        indice: number
    ) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moverFoco(1);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            moverFoco(-1);
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            setIndiceFocado(0);
            opcoesRefs.current[0]?.focus();
            return;
        }

        if (event.key === "End") {
            event.preventDefault();

            const ultimo =
                LOCALES_SUPORTADOS.length -
                1;

            setIndiceFocado(ultimo);

            opcoesRefs.current[
                ultimo
            ]?.focus();

            return;
        }

        if (
            event.key === "Escape" ||
            event.key === "Tab"
        ) {
            setAberto(false);

            if (event.key === "Escape") {
                event.preventDefault();
                botaoPrincipalRef.current?.focus();
            }

            return;
        }

        setIndiceFocado(indice);
    }

    async function alterarIdioma(
        novoLocale: LocalePhanyx
    ) {
        if (
            alterando ||
            novoLocale === localeSelecionado
        ) {
            setAberto(false);
            return;
        }

        const localeAnterior =
            localeSelecionado;

        setLocaleSelecionado(
            novoLocale
        );

        setAlterando(true);
        setAberto(false);
        setErro("");

        try {
            const response = await fetch(
                "/api/preferencias/idioma",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        locale: novoLocale,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Falha ao alterar o idioma."
                );
            }

            document.documentElement.lang =
                novoLocale;

            window.location.reload();
        } catch {
            setLocaleSelecionado(
                localeAnterior
            );

            setErro(
                t("languageChangeError")
            );
        } finally {
            setAlterando(false);
        }
    }

    return (
        <div
            ref={containerRef}
            className={`relative min-w-0 ${className}`}
        >
            {exibirRotulo && (
                <label
                    htmlFor={id}
                    className="phanyx-seletor-idioma-rotulo mb-1 block text-xs font-bold !text-slate-900 dark:!text-white"
                    style={{
                        WebkitTextFillColor:
                            "currentColor",
                    }}
                >
                    {t("language")}
                </label>
            )}

            <button
                ref={botaoPrincipalRef}
                id={id}
                type="button"
                disabled={alterando}
                aria-label={t("language")}
                aria-haspopup="listbox"
                aria-expanded={aberto}
                aria-controls={menuId}
                aria-busy={alterando}
                onClick={abrirOuFechar}
                onKeyDown={
                    tratarTecladoBotao
                }
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-950 shadow-sm outline-none transition hover:bg-slate-50 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-wait disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:focus:border-slate-400 dark:focus:ring-slate-700"
            >
                <span className="min-w-0 truncate">
                    <span
                        aria-hidden="true"
                        className="mr-2"
                    >
                        {
                            BANDEIRAS_DOS_LOCALES[
                                localeSelecionado
                            ]
                        }
                    </span>

                    {
                        NOMES_DOS_LOCALES[
                            localeSelecionado
                        ]
                    }
                </span>

                <span
                    aria-hidden="true"
                    className={[
                        "shrink-0 text-xs transition-transform",
                        aberto
                            ? "rotate-180"
                            : "",
                    ].join(" ")}
                >
                    ▾
                </span>
            </button>

            {aberto && !alterando && (
                <div
                    id={menuId}
                    role="listbox"
                    aria-label={t(
                        "language"
                    )}
                    className="relative z-[100] mt-2 w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-1 shadow-xl dark:border-slate-600 dark:bg-slate-900"
                >
                    {LOCALES_SUPORTADOS.map(
                        (locale, indice) => {
                            const selecionado =
                                locale ===
                                localeSelecionado;

                            return (
                                <button
                                    key={
                                        locale
                                    }
                                    ref={(
                                        elemento
                                    ) => {
                                        opcoesRefs.current[
                                            indice
                                        ] =
                                            elemento;
                                    }}
                                    type="button"
                                    role="option"
                                    aria-selected={
                                        selecionado
                                    }
                                    tabIndex={
                                        indice ===
                                        indiceFocado
                                            ? 0
                                            : -1
                                    }
                                    onFocus={() =>
                                        setIndiceFocado(
                                            indice
                                        )
                                    }
                                    onKeyDown={(
                                        event
                                    ) =>
                                        tratarTecladoOpcao(
                                            event,
                                            indice
                                        )
                                    }
                                    onClick={() =>
                                        alterarIdioma(
                                            locale
                                        )
                                    }
                                    className={[
                                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold outline-none transition",
                                        selecionado
                                            ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                                            : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800",
                                    ].join(
                                        " "
                                    )}
                                >
                                    <span className="min-w-0 truncate">
                                        <span
                                            aria-hidden="true"
                                            className="mr-2"
                                        >
                                            {
                                                BANDEIRAS_DOS_LOCALES[
                                                    locale
                                                ]
                                            }
                                        </span>

                                        {
                                            NOMES_DOS_LOCALES[
                                                locale
                                            ]
                                        }
                                    </span>

                                    {selecionado && (
                                        <span
                                            aria-hidden="true"
                                            className="shrink-0 text-sm"
                                        >
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        }
                    )}
                </div>
            )}

            {alterando && (
                <p
                    aria-live="polite"
                    className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                    {t(
                        "changingLanguage"
                    )}
                </p>
            )}

            {erro && (
                <p
                    role="alert"
                    className="mt-1 text-xs font-semibold text-red-700 dark:text-red-300"
                >
                    {erro}
                </p>
            )}
        </div>
    );
}
