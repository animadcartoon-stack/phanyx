"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useLocale,
    useTranslations,
} from "next-intl";

type EventoIntegracao = {
    id: number;
    integracaoId: number;
    submissaoId?: number | null;

    identificadorEvento?: string | null;
    tipoEvento: string;
    direcao: string;
    status: string;

    headers?: unknown;
    payload?: unknown;
    resposta?: unknown;

    codigoHttp?: number | null;
    numeroTentativas: number;
    proximaTentativaEm?: string | null;
    mensagemErro?: string | null;

    recebidoEm: string;
    processadoEm?: string | null;
    criadoEm: string;
    atualizadoEm: string;

    integracao?: {
        id: number;
        nome: string;
        tipo: string;
        status: string;
    } | null;
};

type Submissao = {
    id: number;
    instituicaoId: number;

    canalId?: number | null;
    campanhaId?: number | null;
    formularioId?: number | null;
    integracaoId?: number | null;
    leadId?: number | null;

    identificadorExterno?: string | null;
    chaveDeduplicacao?: string | null;

    status: string;
    resultadoDeduplicacao?: string | null;

    nomeSnapshot?: string | null;
    emailSnapshot?: string | null;
    telefoneSnapshot?: string | null;

    dadosOriginais: unknown;
    dadosNormalizados?: unknown;

    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    utmTerm?: string | null;

    gclid?: string | null;
    fbclid?: string | null;
    msclkid?: string | null;

    paginaOrigem?: string | null;
    referrer?: string | null;

    ipHash?: string | null;
    userAgent?: string | null;
    idioma?: string | null;

    consentimentoLgpd: boolean;
    consentimentoEm?: string | null;
    versaoConsentimento?: string | null;
    textoConsentimentoSnapshot?: string | null;

    tentativasProcessamento: number;
    codigoErro?: string | null;
    mensagemErro?: string | null;

    recebidoEm: string;
    processadoEm?: string | null;
    atualizadoEm: string;

    canal?: {
        id: number;
        nome: string;
        slug: string;
        tipo: string;
        cor?: string | null;
        ativo: boolean;
    } | null;

    campanha?: {
        id: number;
        nome: string;
        codigo: string;
        status: string;
        ativo: boolean;

        utmSource?: string | null;
        utmMedium?: string | null;
        utmCampaign?: string | null;
        utmContent?: string | null;
        utmTerm?: string | null;
    } | null;

    formulario?: {
        id: number;
        nome: string;
        slug: string;
        tokenPublico: string;
        titulo: string;

        status: string;
        versao: number;
        publico: boolean;
        ativo: boolean;

        exigeConsentimento: boolean;
        bloquearDuplicados: boolean;
        atualizarLeadExistente: boolean;

        criarTarefaPrimeiroContato: boolean;
        tipoTarefaInicial: string;
        prazoPrimeiroContatoMinutos: number;
    } | null;

    integracao?: {
        id: number;
        nome: string;
        tipo: string;
        status: string;
        ativo: boolean;

        ultimoSucessoEm?: string | null;
        ultimoErroEm?: string | null;
        ultimoErro?: string | null;
    } | null;

    lead?: {
        id: number;
        nome: string;
        email: string;
        telefone?: string | null;

        status: string;
        prioridade: string;
        origem: string;

        cursoInteresseId?: number | null;
        poloInteresseId?: number | null;

        responsavelFuncionarioId?: number | null;
        equipeResponsavelId?: number | null;

        cursoInteresse?: {
            id: number;
            nome: string;
        } | null;

        poloInteresse?: {
            id: number;
            nome: string;
        } | null;

        responsavelFuncionario?: {
            id: number;
            nome: string;
        } | null;

        equipeResponsavel?: {
            id: number;
            nome: string;
        } | null;
    } | null;

    eventosIntegracao: EventoIntegracao[];
};

type RespostaApi = {
    success: true;

    permissoes: {
        podeVer: boolean;
        podeReprocessar: boolean;
        podeVerAuditoria: boolean;
        podeReprocessarAgora: boolean;
    };

    statusDisponiveis: string[];
    resultadosDeduplicacaoDisponiveis: string[];

    submissao: Submissao;
};

type RespostaErro = {
    success?: false;
    error?: string;
    codigo?: string;
};

function formatarData(
    valor: string | null | undefined,
    locale: string
) {
    if (!valor) {
        return "—";
    }

    const data = new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        locale,
        {
            dateStyle: "short",
            timeStyle: "short",
        }
    ).format(data);
}

function nomeStatus(
    status: string,
    t: any
) {
    const mapa: Record<
        string,
        string
    > = {
        RECEBIDA:
            t("statuses.received.name"),
        VALIDANDO:
            t("statuses.validating.name"),
        PROCESSANDO:
            t("statuses.processing.name"),
        PROCESSADA:
            t("statuses.processed.name"),
        DUPLICADA:
            t("statuses.duplicate.name"),
        REJEITADA:
            t("statuses.rejected.name"),
        SPAM:
            t("statuses.spam.name"),
        ERRO:
            t("statuses.error.name"),
    };

    return (
        mapa[status] ||
        status
    );
}

function classeStatus(
    status: string
) {
    if (
        status ===
        "PROCESSADA"
    ) {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }

    if (
        status ===
        "VALIDANDO" ||
        status ===
        "PROCESSANDO"
    ) {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (
        status === "ERRO" ||
        status ===
        "REJEITADA"
    ) {
        return "border-red-200 bg-red-50 text-red-800";
    }

    if (
        status === "SPAM"
    ) {
        return "border-orange-200 bg-orange-50 text-orange-800";
    }

    return "border-slate-300 bg-slate-100 text-slate-700";
}

function nomeResultado(
    resultado: string | null | undefined,
    t: any
) {
    if (!resultado) {
        return t("results.notChecked");
    }

    const mapa: Record<
        string,
        string
    > = {
        NAO_VERIFICADA:
            t("results.notChecked"),

        NOVO_LEAD:
            t("results.newLead"),

        LEAD_EXISTENTE_ATUALIZADO:
            t("results.existingLeadUpdated"),

        DUPLICADA_IGNORADA:
            t("results.duplicateIgnored"),

        REVISAO_MANUAL:
            t("results.manualReview"),
    };

    return (
        mapa[resultado] ||
        resultado
    );
}

function nomeDirecao(
    valor: string,
    t: any
) {
    if (valor === "ENTRADA") {
        return t("common.inbound");
    }

    if (valor === "SAIDA") {
        return t("common.outbound");
    }

    return valor;
}

function nomeStatusEvento(
    valor: string,
    t: any
) {
    const mapa: Record<string, string> = {
        RECEBIDO: t("eventStatuses.received"),
        PENDENTE: t("eventStatuses.pending"),
        PROCESSANDO: t("eventStatuses.processing"),
        PROCESSADO: t("eventStatuses.processed"),
        ENTREGUE: t("eventStatuses.delivered"),
        DESCARTADO: t("eventStatuses.discarded"),
        ERRO: t("eventStatuses.error"),
    };

    return mapa[valor] || valor;
}

function JsonVisual({
    valor,
}: {
    valor: unknown;
}) {
    const t =
        useTranslations(
            "AdminCommercialSubmissions"
        );

    let texto =
        t(
            "detail.technical.noData"
        );

    try {
        if (
            valor !== undefined &&
            valor !== null
        ) {
            texto = JSON.stringify(
                valor,
                null,
                2
            );
        }
    } catch {
        texto =
            t(
                "detail.technical.cannotDisplayData"
            );
    }

    return (
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-300 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {texto}
        </pre>
    );
}

function ItemInformacao({
    titulo,
    valor,
    complemento,
}: {
    titulo: string;
    valor:
    | string
    | number
    | null
    | undefined;
    complemento?: string | null;
}) {
    const t =
        useTranslations(
            "AdminCommercialSubmissions"
        );

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {titulo}
            </p>

            <p className="mt-1 break-words text-sm font-bold text-slate-900">
                {valor ??
                    t(
                        "common.notInformed"
                    )}
            </p>

            {complemento && (
                <p className="phanyx-muted mt-1 text-xs leading-5">
                    {complemento}
                </p>
            )}
            <style jsx global>{`
                html[data-theme="dark"]
                    .captacao-submissao-detalhe-page {
                    background: #020b2a;
                    color: #f8fafc;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page {
                    background: #262626;
                    color: #ffffff;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .phanyx-admin-hero,
                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .phanyx-card {
                    background: #171717 !important;
                    border-color: #404040 !important;
                    color: #ffffff !important;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .bg-slate-50 {
                    background: #262626 !important;
                    border-color: #525252 !important;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .bg-white {
                    background: #262626 !important;
                    color: #ffffff !important;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .text-slate-900,
                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .text-slate-950 {
                    color: #ffffff !important;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .text-slate-600,
                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .text-slate-500,
                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .phanyx-muted {
                    color: #b3b3b3 !important;
                }

                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .border-slate-200,
                html[data-theme="system"].dark
                    .captacao-submissao-detalhe-page
                    .border-slate-300 {
                    border-color: #525252 !important;
                }
            `}</style>

        </div>
    );
}

export default function DetalheSubmissaoPage({
    params,
}: {
    params: {
        id: string;
    };
}) {
    const t =
        useTranslations(
            "AdminCommercialSubmissions"
        );

    const locale =
        useLocale();

    const submissaoId =
        Number(params.id);

    const [
        dados,
        setDados,
    ] =
        useState<RespostaApi | null>(
            null
        );

    const [
        carregando,
        setCarregando,
    ] =
        useState(true);

    const [
        atualizando,
        setAtualizando,
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
        modalReprocessar,
        setModalReprocessar,
    ] =
        useState(false);

    const [
        reprocessando,
        setReprocessando,
    ] =
        useState(false);
        
    const carregar =
        useCallback(
            async (
                silencioso = false
            ) => {
                if (
                    !Number.isInteger(
                        submissaoId
                    ) ||
                    submissaoId <= 0
                ) {
                    setErro(
                        t("errors.invalidSubmission")
                    );

                    setCarregando(
                        false
                    );

                    return;
                }

                try {
                    if (silencioso) {
                        setAtualizando(
                            true
                        );
                    } else {
                        setCarregando(
                            true
                        );
                    }

                    setErro("");

                    const resposta =
                        await fetch(
                            `/api/admin/comercial/captacao/submissoes/${submissaoId}`,
                            {
                                cache:
                                    "no-store",
                            }
                        );

                    const json =
                        (await resposta
                            .json()
                            .catch(
                                () => null
                            )) as
                        | RespostaApi
                        | RespostaErro
                        | null;

                    if (
                        !resposta.ok ||
                        !json ||
                        json.success !== true
                    ) {
                        throw new Error(
                            json &&
                                "error" in json
                                ? json.error ||
                                t("errors.loadDetail")
                                : t("errors.loadDetail")
                        );
                    }

                    setDados(
                        json
                    );
                } catch (
                error
                ) {
                    setErro(
                        error instanceof
                            Error
                            ? error.message
                            : t("errors.loadDetail")
                    );
                } finally {
                    setCarregando(
                        false
                    );

                    setAtualizando(
                        false
                    );
                }
            },
            [
                submissaoId,
                t,
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
                    setMensagem("");
                },
                4500
            );

        return () =>
            window.clearTimeout(
                timer
            );
    }, [mensagem]);

    const temRastreamento =
        useMemo(() => {
            if (!dados) {
                return false;
            }

            const submissao =
                dados.submissao;

            return Boolean(
                submissao.utmSource ||
                submissao.utmMedium ||
                submissao.utmCampaign ||
                submissao.utmContent ||
                submissao.utmTerm ||
                submissao.gclid ||
                submissao.fbclid ||
                submissao.msclkid
            );
        }, [dados]);

    function traduzirErroPersistido(
        mensagem:
        | string
        | null
        | undefined
    ) {
        if (!mensagem) {
            return "";
        }

        const campoObrigatorio =
            mensagem.match(
                /^O campo ["“](.+?)["”] é obrigatório\.?$/i
            );

        if (
            campoObrigatorio
        ) {
            const campo =
                campoObrigatorio[1];

            const campos: Record<
                string,
                string
            > = {
                "Nome completo":
                    t(
                        "persistedErrors.fields.fullName"
                    ),
                "E-mail":
                    t(
                        "persistedErrors.fields.email"
                    ),
                "Telefone":
                    t(
                        "persistedErrors.fields.phone"
                    ),
            };

            return t(
                "persistedErrors.requiredField",
                {
                    field:
                        campos[campo] ||
                        campo,
                }
            );
        }

        return mensagem;
    }

    async function reprocessar() {
        if (
            !dados ||
            !dados.permissoes
                .podeReprocessarAgora
        ) {
            return;
        }

        try {
            setReprocessando(
                true
            );

            setErro("");
            setMensagem("");

            const resposta =
                await fetch(
                    `/api/admin/comercial/captacao/submissoes/${submissaoId}/reprocessar`,
                    {
                        method:
                            "POST",
                    }
                );

            const json =
                (await resposta
                    .json()
                    .catch(
                        () => null
                    )) as
                | {
                    success?: boolean;
                    error?: string;
                    message?: string;
                }
                | null;

            if (
                !resposta.ok ||
                !json?.success
            ) {
                throw new Error(
                    json?.error ||
                    t("errors.retry")
                );
            }

            setModalReprocessar(
                false
            );

            setMensagem(
                json.message ||
                t("detail.success.reprocessed")
            );

            await carregar(
                true
            );
        } catch (
        error
        ) {
            setErro(
                error instanceof
                    Error
                    ? error.message
                    : t("errors.retry")
            );
        } finally {
            setReprocessando(
                false
            );
        }
    }

    if (
        carregando &&
        !dados
    ) {
        return (
            <div className="captacao-submissao-detalhe-page min-h-screen p-4 sm:p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="phanyx-card rounded-3xl p-8 shadow-sm">
                        <p className="font-semibold">
                            {t("detail.loading")}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (
        erro &&
        !dados
    ) {
        return (
            <div className="captacao-submissao-detalhe-page min-h-screen p-4 sm:p-6">
                <div className="mx-auto max-w-4xl space-y-4">
                    <Link
                        href="/admin/comercial/captacao/submissoes"
                        className="text-sm font-bold text-slate-600"
                    >
                        {t("detail.loadError.back")}
                    </Link>

                    <div className="phanyx-card rounded-3xl p-8 shadow-sm">
                        <h1 className="text-2xl font-black">
                            {t("detail.loadError.title")}
                        </h1>

                        <p className="phanyx-muted mt-3">
                            {erro}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!dados) {
        return null;
    }

    const {
        submissao,
        permissoes,
    } = dados;

    return (
        <div className="captacao-submissao-detalhe-page min-h-screen p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-6">

                <section className="phanyx-admin-hero rounded-3xl border p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Link
                                href="/admin/comercial/captacao/submissoes"
                                className="text-sm font-bold text-slate-500"
                            >
                                {t("detail.header.back")}
                            </Link>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-2xl text-white">
                                    📥
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-3xl font-black text-slate-900">
                                            {submissao.nomeSnapshot ||
                                                t("common.submissionNumber", { id: submissao.id })}
                                        </h1>

                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                                                submissao.status
                                            )}`}
                                        >
                                            {nomeStatus(submissao.status, t)}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-slate-600">
                                        {t("detail.header.receivedAt", { id: submissao.id, date: formatarData(submissao.recebidoEm, locale) })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {submissao.lead && (
                                <Link
                                    href={`/admin/comercial/leads/${submissao.lead.id}`}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm"
                                >
                                    {t("common.openLead")}
                                </Link>
                            )}

                            {permissoes.podeReprocessarAgora && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setModalReprocessar(
                                            true
                                        )
                                    }
                                    className="rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-700"
                                >
                                    {t("common.retry")}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    void carregar(
                                        true
                                    )
                                }
                                disabled={
                                    atualizando
                                }
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm disabled:opacity-60"
                            >
                                {atualizando
                                    ? t("common.refreshing")
                                    : t("common.refresh")}
                            </button>
                        </div>
                    </div>
                </section>

                {mensagem && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                        ✓ {mensagem}
                    </div>
                )}

                {erro && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                        {erro}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            {t("common.status")}
                        </p>

                        <strong className="mt-2 block text-xl">
                            {nomeStatus(submissao.status, t)}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {nomeResultado(submissao.resultadoDeduplicacao, t)}
                        </p>
                    </div>

                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            {t("common.origin")}
                        </p>

                        <strong className="mt-2 block text-xl">
                            {submissao.canal?.nome ||
                                submissao.integracao?.nome ||
                                t("detail.summary.unknownOrigin")}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {submissao.campanha?.nome ||
                                t("detail.summary.noCampaign")}
                        </p>
                    </div>

                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            {t("common.interest")}
                        </p>

                        <strong className="mt-2 block text-lg">
                            {submissao.lead?.cursoInteresse?.nome ||
                                t("common.notInformed")}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {submissao.lead?.poloInteresse?.nome
                                ? t("detail.summary.unitValue", { name: submissao.lead.poloInteresse.nome })
                                : t("detail.summary.unitNotInformed")}
                        </p>
                    </div>

                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            {t("detail.summary.resultingLead")}
                        </p>

                        <strong className="mt-2 block text-xl">
                            {submissao.lead
                                ? `#${submissao.lead.id}`
                                : t("detail.summary.notCreatedYet")}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {submissao.lead?.responsavelFuncionario?.nome ||
                                t("detail.summary.noOwner")}
                        </p>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

                    <div className="space-y-6">

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t("detail.prospect.eyebrow")}
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    {t("detail.prospect.title")}
                                </h2>

                                <p className="phanyx-muted mt-1 text-sm">
                                    {t("detail.prospect.description")}
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <ItemInformacao
                                    titulo={t("common.name")}
                                    valor={
                                        submissao.nomeSnapshot
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.email")}
                                    valor={
                                        submissao.emailSnapshot
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.phone")}
                                    valor={
                                        submissao.telefoneSnapshot
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.language")}
                                    valor={
                                        submissao.idioma
                                    }
                                />
                            </div>
                        </section>

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t("detail.source.eyebrow")}
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    {t("detail.source.title")}
                                </h2>

                                <p className="phanyx-muted mt-1 text-sm">
                                    {t("detail.source.description")}
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <ItemInformacao
                                    titulo={t("common.channel")}
                                    valor={
                                        submissao.canal?.nome
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.campaign")}
                                    valor={
                                        submissao.campanha?.nome
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.form")}
                                    valor={
                                        submissao.formulario?.titulo ||
                                        submissao.formulario?.nome
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.integration")}
                                    valor={
                                        submissao.integracao?.nome
                                    }
                                />
                            </div>

                            {(submissao.paginaOrigem ||
                                submissao.referrer) && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <ItemInformacao
                                            titulo={t("detail.source.originPage")}
                                            valor={
                                                submissao.paginaOrigem
                                            }
                                        />

                                        <ItemInformacao
                                            titulo={t("detail.source.referrer")}
                                            valor={
                                                submissao.referrer
                                            }
                                        />
                                    </div>
                                )}
                        </section>

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t("detail.privacy.eyebrow")}
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    {t("detail.privacy.title")}
                                </h2>
                            </div>

                            <div className="mt-5">
                                {submissao.consentimentoLgpd ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                                        <p className="font-bold">
                                            ✓ {t("common.consentRecorded")}
                                        </p>

                                        <p className="mt-1 text-sm">
                                            {t("detail.privacy.registeredAt", { date: formatarData(submissao.consentimentoEm, locale) })}
                                            {submissao.versaoConsentimento
                                                ? t("detail.privacy.versionSuffix", { version: submissao.versaoConsentimento })
                                                : ""}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                        <p className="font-bold">
                                            {t("common.consentNotRecorded")}
                                        </p>
                                    </div>
                                )}

                                {submissao.textoConsentimentoSnapshot && (
                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            {t("detail.privacy.consentText")}
                                        </p>

                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                                            {
                                                submissao.textoConsentimentoSnapshot
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {temRastreamento && (
                            <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        {t("detail.marketing.eyebrow")}
                                    </p>

                                    <h2 className="mt-1 text-2xl font-black">
                                        {t("detail.marketing.title")}
                                    </h2>

                                    <p className="phanyx-muted mt-1 text-sm">
                                        {t("detail.marketing.description")}
                                    </p>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <ItemInformacao
                                        titulo={t("detail.marketing.source")}
                                        valor={
                                            submissao.utmSource
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("detail.marketing.medium")}
                                        valor={
                                            submissao.utmMedium
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("common.campaign")}
                                        valor={
                                            submissao.utmCampaign
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("detail.marketing.content")}
                                        valor={
                                            submissao.utmContent
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("detail.marketing.term")}
                                        valor={
                                            submissao.utmTerm
                                        }
                                    />
                                </div>

                                {(submissao.gclid ||
                                    submissao.fbclid ||
                                    submissao.msclkid) && (
                                        <details className="mt-5 rounded-2xl border border-slate-200 p-4">
                                            <summary className="cursor-pointer font-bold">
                                                {t("detail.marketing.adIdentifiers")}
                                            </summary>

                                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                                <ItemInformacao
                                                    titulo="Google"
                                                    valor={
                                                        submissao.gclid
                                                    }
                                                />

                                                <ItemInformacao
                                                    titulo="Meta"
                                                    valor={
                                                        submissao.fbclid
                                                    }
                                                />

                                                <ItemInformacao
                                                    titulo="Microsoft"
                                                    valor={
                                                        submissao.msclkid
                                                    }
                                                />
                                            </div>
                                        </details>
                                    )}
                            </section>
                        )}

                        {submissao.eventosIntegracao.length >
                            0 && (
                                <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {t("detail.integrationHistory.eyebrow")}
                                        </p>

                                        <h2 className="mt-1 text-2xl font-black">
                                            {t("detail.integrationHistory.title")}
                                        </h2>

                                        <p className="phanyx-muted mt-1 text-sm">
                                            {t("detail.integrationHistory.description")}
                                        </p>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {submissao.eventosIntegracao.map(
                                            (evento) => (
                                                <div
                                                    key={
                                                        evento.id
                                                    }
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-bold">
                                                                {evento.integracao?.nome ||
                                                                    evento.tipoEvento}
                                                            </p>

                                                            <p className="phanyx-muted mt-1 text-xs">
                                                                {nomeDirecao(evento.direcao, t)}{" "}
                                                                ·{" "}
                                                                {nomeStatusEvento(evento.status, t)}{" "}
                                                                ·{" "}
                                                                {formatarData(evento.recebidoEm, locale)}
                                                            </p>
                                                        </div>

                                                        {evento.codigoHttp && (
                                                            <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold">
                                                                HTTP{" "}
                                                                {
                                                                    evento.codigoHttp
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    {evento.mensagemErro && (
                                                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                                            {traduzirErroPersistido(
                                                                evento.mensagemErro
                                                            )}
                                                        </div>
                                                    )}

                                                    {permissoes.podeVerAuditoria &&
                                                        (evento.payload !==
                                                            undefined ||
                                                            evento.resposta !==
                                                            undefined ||
                                                            evento.headers !==
                                                            undefined) && (
                                                            <details className="mt-4">
                                                                <summary className="cursor-pointer text-sm font-bold">
                                                                    {t("detail.integrationHistory.technicalInformation")}
                                                                </summary>

                                                                <div className="mt-3 space-y-3">
                                                                    {evento.headers !==
                                                                        undefined && (
                                                                            <div>
                                                                                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                                                                                    {t("detail.integrationHistory.headers")}
                                                                                </p>

                                                                                <JsonVisual
                                                                                    valor={
                                                                                        evento.headers
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}

                                                                    {evento.payload !==
                                                                        undefined && (
                                                                            <div>
                                                                                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                                                                                    {t("detail.integrationHistory.sentData")}
                                                                                </p>

                                                                                <JsonVisual
                                                                                    valor={
                                                                                        evento.payload
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}

                                                                    {evento.resposta !==
                                                                        undefined && (
                                                                            <div>
                                                                                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                                                                                    {t("detail.integrationHistory.response")}
                                                                                </p>

                                                                                <JsonVisual
                                                                                    valor={
                                                                                        evento.resposta
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </details>
                                                        )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </section>
                            )}
                    </div>

                    <div className="space-y-6">

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t("detail.processing.eyebrow")}
                            </p>

                            <h2 className="mt-1 text-xl font-black">
                                {t("detail.processing.title")}
                            </h2>

                            <div className="mt-5 space-y-4">
                                <ItemInformacao
                                    titulo={t("common.status")}
                                    valor={nomeStatus(submissao.status, t)}
                                />

                                <ItemInformacao
                                    titulo={t("common.result")}
                                    valor={nomeResultado(submissao.resultadoDeduplicacao, t)}
                                />

                                <ItemInformacao
                                    titulo={t("common.attempts")}
                                    valor={
                                        submissao.tentativasProcessamento
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("common.received")}
                                    valor={formatarData(submissao.recebidoEm, locale)}
                                />

                                <ItemInformacao
                                    titulo={t("common.processed")}
                                    valor={formatarData(submissao.processadoEm, locale)}
                                />

                                <ItemInformacao
                                    titulo={t("common.lastUpdate")}
                                    valor={formatarData(submissao.atualizadoEm, locale)}
                                />
                            </div>

                            {submissao.mensagemErro && (
                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                                    <p className="text-xs font-bold uppercase tracking-wide">
                                        {t("common.whatHappened")}
                                    </p>

                                    <p className="mt-2 text-sm leading-6">
                                        {traduzirErroPersistido(
                                            submissao.mensagemErro
                                        )}
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t("common.lead")}
                            </p>

                            <h2 className="mt-1 text-xl font-black">
                                {t("detail.commercial.title")}
                            </h2>

                            {submissao.lead ? (
                                <div className="mt-5 space-y-4">
                                    <ItemInformacao
                                        titulo={t("common.lead")}
                                        valor={
                                            submissao.lead.nome
                                        }
                                        complemento={`#${submissao.lead.id}`}
                                    />

                                    <ItemInformacao
                                        titulo={t("common.course")}
                                        valor={
                                            submissao.lead.cursoInteresse?.nome
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("common.unit")}
                                        valor={
                                            submissao.lead.poloInteresse?.nome
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("common.owner")}
                                        valor={
                                            submissao.lead.responsavelFuncionario?.nome
                                        }
                                    />

                                    <ItemInformacao
                                        titulo={t("common.team")}
                                        valor={
                                            submissao.lead.equipeResponsavel?.nome
                                        }
                                    />

                                    <Link
                                        href={`/admin/comercial/leads/${submissao.lead.id}`}
                                        className="block rounded-xl bg-neutral-800 px-4 py-3 text-center text-sm font-bold text-white hover:bg-neutral-700"
                                    >
                                        {t("detail.commercial.open360")}
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="font-bold">
                                        {t("detail.commercial.noLeadTitle")}
                                    </p>

                                    <p className="phanyx-muted mt-1 text-sm leading-6">
                                        {t("detail.commercial.noLeadDescription")}
                                    </p>
                                </div>
                            )}
                        </section>

                        <details className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <summary className="cursor-pointer text-lg font-black">
                                {t("detail.technical.title")}
                            </summary>

                            <p className="phanyx-muted mt-2 text-sm">
                                {t("detail.technical.description")}
                            </p>

                            <div className="mt-5 space-y-4">
                                <ItemInformacao
                                    titulo={t("detail.technical.externalIdentifier")}
                                    valor={
                                        submissao.identificadorExterno
                                    }
                                />

                                <ItemInformacao
                                    titulo={t("detail.technical.errorCode")}
                                    valor={
                                        submissao.codigoErro
                                    }
                                />

                                {permissoes.podeVerAuditoria && (
                                    <>
                                        <ItemInformacao
                                            titulo={t("detail.technical.deduplicationKey")}
                                            valor={
                                                submissao.chaveDeduplicacao
                                            }
                                        />

                                        <ItemInformacao
                                            titulo={t("detail.technical.protectedIp")}
                                            valor={
                                                submissao.ipHash
                                            }
                                        />

                                        <div>
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                {t("detail.technical.originalData")}
                                            </p>

                                            <JsonVisual
                                                valor={
                                                    submissao.dadosOriginais
                                                }
                                            />
                                        </div>

                                        <div>
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                {t("detail.technical.normalizedData")}
                                            </p>

                                            <JsonVisual
                                                valor={
                                                    submissao.dadosNormalizados
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {modalReprocessar && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/65 p-4">
                    <div className="phanyx-card w-full max-w-lg rounded-3xl p-6 shadow-2xl">
                        <h2 className="text-xl font-black">
                            {t("detail.retryModal.title")}
                        </h2>

                        <p className="phanyx-muted mt-2 text-sm leading-6">
                            {t("detail.retryModal.description")}
                        </p>

                        <p className="phanyx-muted mt-2 text-sm leading-6">
                            {t("detail.retryModal.deduplication")}
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    setModalReprocessar(
                                        false
                                    )
                                }
                                disabled={
                                    reprocessando
                                }
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold"
                            >
                                {t("common.cancel")}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void reprocessar()
                                }
                                disabled={
                                    reprocessando
                                }
                                className="rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-700 disabled:opacity-60"
                            >
                                {reprocessando
                                    ? t("common.processing")
                                    : t("common.retry")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}