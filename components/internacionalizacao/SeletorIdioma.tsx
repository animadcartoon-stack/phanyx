"use client";

import {
    type ChangeEvent,
    useId,
    useState,
} from "react";
import {
    useLocale,
    useTranslations,
} from "next-intl";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
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

    async function alterarIdioma(
        event: ChangeEvent<HTMLSelectElement>
    ) {
        const novoLocale = event.target.value;

        if (!localeEhSuportado(novoLocale)) {
            return;
        }

        const localeAnterior = localeSelecionado;

        setLocaleSelecionado(novoLocale);
        setAlterando(true);
        setErro("");

        try {
            const response = await fetch(
                "/api/preferencias/idioma",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
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

            router.refresh();
        } catch {
            setLocaleSelecionado(localeAnterior);
            setErro(t("languageChangeError"));
        } finally {
            setAlterando(false);
        }
    }

    return (
        <div className={`min-w-0 ${className}`}>
            {exibirRotulo && (
                <label
                    htmlFor={id}
                    className="phanyx-seletor-idioma-rotulo mb-1 block text-xs font-bold !text-slate-900 dark:!text-white"
                    style={{
                        WebkitTextFillColor: "currentColor",
                    }}
                >
                    {t("language")}
                </label>
            )}

            <select
                id={id}
                value={localeSelecionado}
                onChange={alterarIdioma}
                disabled={alterando}
                aria-label={t("language")}
                aria-busy={alterando}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
            >
                {LOCALES_SUPORTADOS.map((locale) => (
                    <option
                        key={locale}
                        value={locale}
                    >
                        {BANDEIRAS_DOS_LOCALES[locale]}{" "}
                        {NOMES_DOS_LOCALES[locale]}
                    </option>
                ))}
            </select>

            {alterando && (
                <p
                    aria-live="polite"
                    className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                    {t("changingLanguage")}
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