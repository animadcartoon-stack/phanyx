"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useTranslations,
} from "next-intl";

type RespostaLgpd = {
    success: true;

    permissoes: {
        podeGerenciar: boolean;
    };

    lgpd: {
        exigeConsentimento:
            boolean;

        textoConsentimento:
            string | null;

        textoSugerido:
            string;

        versaoConsentimento:
            string | null;

        politicaPrivacidadeUrl:
            string | null;

        atualizadoEm:
            string;

        configurado:
            boolean;
    };
};

type Props = {
    formularioId: number;

    podeGerenciar: boolean;

    arquivado: boolean;

    temaEscuro: boolean;

    temaAzul: boolean;

    onAtualizado?:
        () =>
            | void
            | Promise<void>;
};

export default function ProtecaoDadosFormulario({
    formularioId,
    podeGerenciar,
    arquivado,
    temaEscuro,
    temaAzul,
    onAtualizado,
}: Props) {
    const t =
        useTranslations(
            "AdminCommercialForms"
        );

    const [
        dados,
        setDados,
    ] =
        useState<RespostaLgpd | null>(
            null
        );

    const [
        carregando,
        setCarregando,
    ] =
        useState(true);

    const [
        salvando,
        setSalvando,
    ] =
        useState(false);

    const [
        erro,
        setErro,
    ] =
        useState("");

    const [
        mensagem,
        setMensagem,
    ] =
        useState("");

    const [
        exigeConsentimento,
        setExigeConsentimento,
    ] =
        useState(true);

    const [
        textoConsentimento,
        setTextoConsentimento,
    ] =
        useState("");

    const [
        politicaPrivacidadeUrl,
        setPoliticaPrivacidadeUrl,
    ] =
        useState("");

    const card =
        temaAzul
            ? "border-blue-950 bg-[#0b1220]"
            : temaEscuro
                ? "border-neutral-700 bg-neutral-900"
                : "border-slate-200 bg-white";

    const subCard =
        temaAzul
            ? "border-blue-900 bg-[#0f1a33]"
            : temaEscuro
                ? "border-neutral-700 bg-neutral-800"
                : "border-slate-200 bg-slate-50";

    const titulo =
        temaAzul
            ? "text-blue-50"
            : temaEscuro
                ? "text-white"
                : "text-slate-900";

    const texto =
        temaAzul
            ? "text-blue-100"
            : temaEscuro
                ? "text-neutral-200"
                : "text-slate-700";

    const muted =
        temaAzul
            ? "text-blue-200/70"
            : temaEscuro
                ? "text-neutral-400"
                : "text-slate-500";

    const input =
        temaAzul
            ? "border-blue-900 bg-blue-950/70 text-blue-50 placeholder:text-blue-200/50"
            : temaEscuro
                ? "border-neutral-600 bg-neutral-800 text-neutral-100 placeholder:text-neutral-400"
                : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

    const carregar =
        useCallback(
            async () => {
                if (
                    !Number.isInteger(
                        formularioId
                    ) ||
                    formularioId <= 0
                ) {
                    setErro(
                        t("protection.errors.invalidForm")
                    );

                    setCarregando(
                        false
                    );

                    return;
                }

                try {
                    setCarregando(
                        true
                    );

                    setErro("");

                    const resposta =
                        await fetch(
                            `/api/admin/comercial/captacao/formularios/${formularioId}/lgpd`,
                            {
                                method:
                                    "GET",

                                cache:
                                    "no-store",
                            }
                        );

                    const json =
                        (
                            await resposta
                                .json()
                                .catch(
                                    () => ({})
                                )
                        ) as
                        | RespostaLgpd
                        | {
                            success?:
                                false;

                            error?:
                                string;
                        };

                    if (
                        !resposta.ok ||
                        json.success !==
                            true
                    ) {
                        throw new Error(
                            (
                                "error" in
                                json
                                    ? json.error
                                    : null
                            ) ||
                            t("protection.errors.load")
                        );
                    }

                    setDados(
                        json
                    );

                    setExigeConsentimento(
                        json.lgpd
                            .exigeConsentimento
                    );

                    setTextoConsentimento(
                        json.lgpd
                            .textoConsentimento
                            ?.trim() ||
                        json.lgpd
                            .textoSugerido
                    );

                    setPoliticaPrivacidadeUrl(
                        json.lgpd
                            .politicaPrivacidadeUrl ??
                            ""
                    );
                } catch (
                    error
                ) {
                    setErro(
                        error instanceof
                            Error
                            ? error.message
                            : t("protection.errors.load")
                    );
                } finally {
                    setCarregando(
                        false
                    );
                }
            },
            [
                formularioId,
            ]
        );

    useEffect(() => {
        void carregar();
    }, [carregar]);

    useEffect(() => {
        if (!mensagem) {
            return;
        }

        const timer =
            window.setTimeout(
                () => {
                    setMensagem(
                        ""
                    );
                },
                3500
            );

        return () =>
            window.clearTimeout(
                timer
            );
    }, [mensagem]);

    async function salvar(
        event: FormEvent
    ) {
        event.preventDefault();

        if (
            exigeConsentimento &&
            !textoConsentimento.trim()
        ) {
            setErro(
                t("protection.validation.consentText")
            );

            return;
        }

        try {
            setSalvando(
                true
            );

            setErro("");
            setMensagem("");

            const resposta =
                await fetch(
                    `/api/admin/comercial/captacao/formularios/${formularioId}/lgpd`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                exigeConsentimento,

                                textoConsentimento:
                                    exigeConsentimento
                                        ? (
                                            textoConsentimento
                                                .trim() ||
                                            null
                                        )
                                        : (
                                            textoConsentimento
                                                .trim() ||
                                            null
                                        ),

                                politicaPrivacidadeUrl:
                                    politicaPrivacidadeUrl
                                        .trim() ||
                                    null,
                            }),
                    }
                );

            const json =
                (
                    await resposta
                        .json()
                        .catch(
                            () => ({})
                        )
                ) as {
                    success?:
                        boolean;

                    message?:
                        string;

                    error?:
                        string;
                };

            if (
                !resposta.ok ||
                json.success !== true
            ) {
                throw new Error(
                    json.error ||
                    t("protection.errors.save")
                );
            }

            setMensagem(
                json.message ||
                t("protection.success.saved")
            );

            await carregar();

            await onAtualizado?.();
        } catch (
            error
        ) {
            setErro(
                error instanceof
                    Error
                    ? error.message
                    : t("protection.errors.save")
            );
        } finally {
            setSalvando(
                false
            );
        }
    }

    return (
        <section
            className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${card}`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">
                            🛡️
                        </span>

                        <h2
                            className={`text-lg font-bold ${titulo}`}
                        >
                            {t("protection.title")}
                        </h2>
                    </div>

                    <p
                        className={`mt-1 text-sm ${muted}`}
                    >
                        {t("protection.description")}
                    </p>
                </div>

                {!carregando &&
                    dados && (
                        <span
                            className={
                                dados
                                    .lgpd
                                    .configurado
                                    ? (
                                        temaEscuro
                                            ? "inline-flex rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-300"
                                            : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                                    )
                                    : (
                                        temaEscuro
                                            ? "inline-flex rounded-full border border-amber-800 bg-amber-950/50 px-3 py-1 text-xs font-semibold text-amber-300"
                                            : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                                    )
                            }
                        >
                            {dados
                                .lgpd
                                .configurado
                                ? t("protection.configured")
                                : t("protection.needsReview")}
                        </span>
                    )}
            </div>

            {carregando ? (
                <div
                    className={`mt-5 rounded-2xl border p-5 text-sm ${subCard} ${muted}`}
                >
                    {t("protection.loading")}
                </div>
            ) : erro &&
              !dados ? (
                <div
                    className={`mt-5 rounded-2xl border p-5 ${subCard}`}
                >
                    <p className="text-sm font-medium text-red-600">
                        {erro}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void carregar()
                        }
                        className={`mt-4 rounded-xl border px-4 py-2 text-sm font-semibold ${input}`}
                    >
                        {t("common.tryAgain")}
                    </button>
                </div>
            ) : (
                <form
                    onSubmit={
                        salvar
                    }
                    className="mt-5 space-y-5"
                >
                    {erro && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {erro}
                        </div>
                    )}

                    {mensagem && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            {mensagem}
                        </div>
                    )}

                    <label
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${subCard}`}
                    >
                        <input
                            type="checkbox"
                            checked={
                                exigeConsentimento
                            }
                            onChange={(
                                event
                            ) =>
                                setExigeConsentimento(
                                    event
                                        .target
                                        .checked
                                )
                            }
                            disabled={
                                !podeGerenciar ||
                                arquivado ||
                                salvando
                            }
                            className="mt-1 h-4 w-4"
                        />

                        <div>
                            <p
                                className={`font-semibold ${titulo}`}
                            >
                                {t("protection.requireConsent.title")}
                            </p>

                            <p
                                className={`mt-1 text-sm ${muted}`}
                            >
                                {t("protection.requireConsent.description")}
                            </p>
                        </div>
                    </label>

                    {exigeConsentimento ? (
                        <>
                            <div
                                className={`rounded-2xl border p-4 ${subCard}`}
                            >
                                <p
                                    className={`text-sm font-semibold ${titulo}`}
                                >
                                    👁️ {t("protection.preview.title")}
                                </p>

                                <div
                                    className={`mt-3 rounded-xl border p-4 ${card}`}
                                >
                                    <label className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            disabled
                                            className="mt-1 h-4 w-4"
                                        />

                                        <span
                                            className={`text-sm leading-6 ${texto}`}
                                        >
                                            {textoConsentimento ||
                                                dados
                                                    ?.lgpd
                                                    .textoSugerido}
                                        </span>
                                    </label>

                                    {politicaPrivacidadeUrl.trim() && (
                                        <p
                                            className={`mt-3 pl-7 text-xs ${muted}`}
                                        >
                                            🔗 {t("protection.preview.privacyAvailable")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${titulo}`}
                                >
                                    {t("protection.consentMessage.label")}
                                </label>

                                <textarea
                                    rows={
                                        4
                                    }
                                    value={
                                        textoConsentimento
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setTextoConsentimento(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        !podeGerenciar ||
                                        arquivado ||
                                        salvando
                                    }
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${input}`}
                                />

                                <p
                                    className={`mt-1.5 text-xs ${muted}`}
                                >
                                    {t("protection.consentMessage.help")}
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${titulo}`}
                                >
                                    {t("protection.privacyUrl.label")}{" "}
                                    <span
                                        className={`font-normal ${muted}`}
                                    >
                                        {t("common.optional")}
                                    </span>
                                </label>

                                <input
                                    type="url"
                                    value={
                                        politicaPrivacidadeUrl
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setPoliticaPrivacidadeUrl(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        !podeGerenciar ||
                                        arquivado ||
                                        salvando
                                    }
                                    placeholder="https://..."
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${input}`}
                                />

                                <p
                                    className={`mt-1.5 text-xs ${muted}`}
                                >
                                    {t("protection.privacyUrl.help")}
                                </p>
                            </div>

                            <div
                                className={
                                    temaAzul
                                        ? "rounded-2xl border border-blue-800 bg-blue-950/60 p-4 text-sm text-blue-100"
                                        : temaEscuro
                                            ? "rounded-2xl border border-neutral-600 bg-neutral-800 p-4 text-sm text-neutral-200"
                                            : "rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
                                }
                            >
                                🔒 {t("protection.auditNotice")}
                            </div>
                        </>
                    ) : (
                        <div
                            className={
                                temaEscuro
                                    ? "rounded-2xl border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-200"
                                    : "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                            }
                        >
                            {t("protection.disabledNotice")}
                        </div>
                    )}

                    {arquivado && (
                        <p
                            className={`text-sm ${muted}`}
                        >
                            {t("protection.archivedNotice")}
                        </p>
                    )}

                    {podeGerenciar &&
                        !arquivado && (
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                    className={
                                        temaAzul
                                            ? "rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            : temaEscuro
                                                ? "rounded-xl bg-neutral-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-60"
                                                : "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    }
                                >
                                    {salvando
                                        ? t("common.saving")
                                        : t("protection.save")}
                                </button>
                            </div>
                        )}
                </form>
            )}
        </section>
    );
}