"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

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
    onAtualizado,
}: Props) {
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
        temaEscuro
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white";

    const subCard =
        temaEscuro
            ? "border-slate-800 bg-slate-950"
            : "border-slate-200 bg-slate-50";

    const titulo =
        temaEscuro
            ? "text-white"
            : "text-slate-900";

    const texto =
        temaEscuro
            ? "text-slate-300"
            : "text-slate-700";

    const muted =
        temaEscuro
            ? "text-slate-400"
            : "text-slate-500";

    const input =
        temaEscuro
            ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
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
                        "Formulário inválido."
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
                            "Não foi possível carregar a proteção de dados."
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
                            : "Não foi possível carregar a proteção de dados."
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
                "Informe a mensagem de autorização que será mostrada ao interessado."
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
                    "Não foi possível salvar a proteção de dados."
                );
            }

            setMensagem(
                json.message ||
                "Proteção de dados atualizada com sucesso."
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
                    : "Não foi possível salvar a proteção de dados."
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
                            Proteção de dados
                        </h2>
                    </div>

                    <p
                        className={`mt-1 text-sm ${muted}`}
                    >
                        Defina como o interessado será informado sobre o uso dos dados enviados.
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
                                ? "✓ Configurado"
                                : "Precisa revisar"}
                        </span>
                    )}
            </div>

            {carregando ? (
                <div
                    className={`mt-5 rounded-2xl border p-5 text-sm ${subCard} ${muted}`}
                >
                    Carregando proteção de dados...
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
                        Tentar novamente
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
                                Pedir autorização para usar os dados e entrar em contato
                            </p>

                            <p
                                className={`mt-1 text-sm ${muted}`}
                            >
                                O interessado precisará marcar uma opção de concordância antes de enviar o formulário.
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
                                    👁️ Como aparecerá para o interessado
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
                                            🔗 Política de Privacidade disponível para consulta
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${titulo}`}
                                >
                                    Mensagem de autorização
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
                                    O PHANYX já preparou uma mensagem inicial. Altere somente se a instituição precisar de outro texto.
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${titulo}`}
                                >
                                    Link da Política de Privacidade{" "}
                                    <span
                                        className={`font-normal ${muted}`}
                                    >
                                        Opcional
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
                                    Se a instituição possuir uma página de privacidade, informe o endereço aqui.
                                </p>
                            </div>

                            <div
                                className={
                                    temaEscuro
                                        ? "rounded-2xl border border-blue-900 bg-blue-950/40 p-4 text-sm text-blue-200"
                                        : "rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
                                }
                            >
                                🔒 Quando o interessado enviar o formulário, o PHANYX guardará a autorização junto com o envio.
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
                            A autorização não será mostrada ao interessado. Desative esta opção somente quando a instituição já tiver definido internamente como fará o tratamento desses dados.
                        </div>
                    )}

                    {arquivado && (
                        <p
                            className={`text-sm ${muted}`}
                        >
                            Este formulário está arquivado e não pode mais ser alterado.
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
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvando
                                        ? "Salvando..."
                                        : "Salvar proteção de dados"}
                                </button>
                            </div>
                        )}
                </form>
            )}
        </section>
    );
}