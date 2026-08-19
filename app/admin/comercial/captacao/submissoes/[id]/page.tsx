"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

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
    valor?: string | null
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
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short",
        }
    ).format(data);
}

function nomeStatus(
    status: string
) {
    const mapa: Record<
        string,
        string
    > = {
        RECEBIDA:
            "Recebida",
        VALIDANDO:
            "Validando dados",
        PROCESSANDO:
            "Em processamento",
        PROCESSADA:
            "Processada",
        DUPLICADA:
            "Duplicada",
        REJEITADA:
            "Não processada",
        SPAM:
            "Bloqueada como spam",
        ERRO:
            "Com erro",
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
        status ===
        "ERRO" ||
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
    resultado?: string | null
) {
    if (!resultado) {
        return "Ainda não verificado";
    }

    const mapa: Record<
        string,
        string
    > = {
        NAO_VERIFICADA:
            "Ainda não verificado",

        NOVO_LEAD:
            "Novo lead criado",

        LEAD_EXISTENTE_ATUALIZADO:
            "Lead existente atualizado",

        DUPLICADA_IGNORADA:
            "Entrada duplicada ignorada",

        REVISAO_MANUAL:
            "Necessita revisão",
    };

    return (
        mapa[resultado] ||
        resultado
    );
}

function nomeDirecao(
    valor: string
) {
    if (valor === "ENTRADA") {
        return "Entrada";
    }

    if (valor === "SAIDA") {
        return "Saída";
    }

    return valor;
}

function JsonVisual({
    valor,
}: {
    valor: unknown;
}) {
    let texto = "Sem dados.";

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
            "Não foi possível exibir estes dados.";
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
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {titulo}
            </p>

            <p className="mt-1 break-words text-sm font-bold text-slate-900">
                {valor ??
                    "Não informado"}
            </p>

            {complemento && (
                <p className="phanyx-muted mt-1 text-xs leading-5">
                    {complemento}
                </p>
            )}
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
                        "Submissão inválida."
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
                                "Não foi possível consultar esta submissão."
                                : "Não foi possível consultar esta submissão."
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
                            : "Não foi possível consultar esta submissão."
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
            [submissaoId]
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
                    "Não foi possível tentar novamente."
                );
            }

            setModalReprocessar(
                false
            );

            setMensagem(
                json.message ||
                "Submissão reprocessada com sucesso."
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
                    : "Não foi possível tentar novamente."
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
                            Carregando submissão...
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
                        ← Voltar às submissões
                    </Link>

                    <div className="phanyx-card rounded-3xl p-8 shadow-sm">
                        <h1 className="text-2xl font-black">
                            Não foi possível abrir esta submissão
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
                                ← Submissões recebidas
                            </Link>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-2xl text-white">
                                    📥
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-3xl font-black text-slate-900">
                                            {submissao.nomeSnapshot ||
                                                `Submissão #${submissao.id}`}
                                        </h1>

                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-bold ${classeStatus(
                                                submissao.status
                                            )}`}
                                        >
                                            {nomeStatus(
                                                submissao.status
                                            )}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-slate-600">
                                        Submissão #{submissao.id} recebida em{" "}
                                        {formatarData(
                                            submissao.recebidoEm
                                        )}
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
                                    Abrir lead
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
                                    Tentar novamente
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
                                    ? "Atualizando..."
                                    : "↻ Atualizar"}
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
                            Situação
                        </p>

                        <strong className="mt-2 block text-xl">
                            {nomeStatus(
                                submissao.status
                            )}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {nomeResultado(
                                submissao.resultadoDeduplicacao
                            )}
                        </p>
                    </div>

                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            Origem
                        </p>

                        <strong className="mt-2 block text-xl">
                            {submissao.canal?.nome ||
                                submissao.integracao?.nome ||
                                "Não identificada"}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {submissao.campanha?.nome ||
                                "Sem campanha vinculada"}
                        </p>
                    </div>

                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            Interesse
                        </p>

                        <strong className="mt-2 block text-lg">
                            {submissao.lead?.cursoInteresse?.nome ||
                                "Não informado"}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {submissao.lead?.poloInteresse?.nome
                                ? `Unidade: ${submissao.lead.poloInteresse.nome}`
                                : "Unidade não informada"}
                        </p>
                    </div>

                    <div className="phanyx-card rounded-3xl p-5 shadow-sm">
                        <p className="phanyx-muted text-sm">
                            Lead resultante
                        </p>

                        <strong className="mt-2 block text-xl">
                            {submissao.lead
                                ? `#${submissao.lead.id}`
                                : "Ainda não criado"}
                        </strong>

                        <p className="phanyx-muted mt-2 text-xs">
                            {submissao.lead?.responsavelFuncionario?.nome ||
                                "Sem responsável definido"}
                        </p>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

                    <div className="space-y-6">

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Interessado
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    Dados recebidos
                                </h2>

                                <p className="phanyx-muted mt-1 text-sm">
                                    Informações principais enviadas pelo interessado.
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <ItemInformacao
                                    titulo="Nome"
                                    valor={
                                        submissao.nomeSnapshot
                                    }
                                />

                                <ItemInformacao
                                    titulo="E-mail"
                                    valor={
                                        submissao.emailSnapshot
                                    }
                                />

                                <ItemInformacao
                                    titulo="Telefone"
                                    valor={
                                        submissao.telefoneSnapshot
                                    }
                                />

                                <ItemInformacao
                                    titulo="Idioma"
                                    valor={
                                        submissao.idioma
                                    }
                                />
                            </div>
                        </section>

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Captação
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    Origem do interessado
                                </h2>

                                <p className="phanyx-muted mt-1 text-sm">
                                    Veja de onde este envio chegou ao PHANYX.
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <ItemInformacao
                                    titulo="Canal"
                                    valor={
                                        submissao.canal?.nome
                                    }
                                />

                                <ItemInformacao
                                    titulo="Campanha"
                                    valor={
                                        submissao.campanha?.nome
                                    }
                                />

                                <ItemInformacao
                                    titulo="Formulário"
                                    valor={
                                        submissao.formulario?.titulo ||
                                        submissao.formulario?.nome
                                    }
                                />

                                <ItemInformacao
                                    titulo="Integração"
                                    valor={
                                        submissao.integracao?.nome
                                    }
                                />
                            </div>

                            {(submissao.paginaOrigem ||
                                submissao.referrer) && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        <ItemInformacao
                                            titulo="Página de origem"
                                            valor={
                                                submissao.paginaOrigem
                                            }
                                        />

                                        <ItemInformacao
                                            titulo="Referência"
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
                                    Privacidade
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    Consentimento e proteção de dados
                                </h2>
                            </div>

                            <div className="mt-5">
                                {submissao.consentimentoLgpd ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                                        <p className="font-bold">
                                            ✓ Consentimento registrado
                                        </p>

                                        <p className="mt-1 text-sm">
                                            Registrado em{" "}
                                            {formatarData(
                                                submissao.consentimentoEm
                                            )}
                                            {submissao.versaoConsentimento
                                                ? ` · Versão ${submissao.versaoConsentimento}`
                                                : ""}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                        <p className="font-bold">
                                            Consentimento não registrado
                                        </p>
                                    </div>
                                )}

                                {submissao.textoConsentimentoSnapshot && (
                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Texto apresentado ao interessado
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
                                        Marketing
                                    </p>

                                    <h2 className="mt-1 text-2xl font-black">
                                        Rastreamento da campanha
                                    </h2>

                                    <p className="phanyx-muted mt-1 text-sm">
                                        Dados utilizados para identificar a origem da campanha.
                                    </p>
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    <ItemInformacao
                                        titulo="Origem da campanha"
                                        valor={
                                            submissao.utmSource
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Meio"
                                        valor={
                                            submissao.utmMedium
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Campanha"
                                        valor={
                                            submissao.utmCampaign
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Conteúdo"
                                        valor={
                                            submissao.utmContent
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Termo"
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
                                                Identificadores de anúncios
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
                                            Integrações
                                        </p>

                                        <h2 className="mt-1 text-2xl font-black">
                                            Histórico de integração
                                        </h2>

                                        <p className="phanyx-muted mt-1 text-sm">
                                            Eventos relacionados à entrada ou saída desta submissão.
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
                                                                {nomeDirecao(
                                                                    evento.direcao
                                                                )}{" "}
                                                                ·{" "}
                                                                {evento.status}{" "}
                                                                ·{" "}
                                                                {formatarData(
                                                                    evento.recebidoEm
                                                                )}
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
                                                            {
                                                                evento.mensagemErro
                                                            }
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
                                                                    Informações técnicas
                                                                </summary>

                                                                <div className="mt-3 space-y-3">
                                                                    {evento.headers !==
                                                                        undefined && (
                                                                            <div>
                                                                                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                                                                                    Cabeçalhos
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
                                                                                    Dados enviados
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
                                                                                    Resposta
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
                                Processamento
                            </p>

                            <h2 className="mt-1 text-xl font-black">
                                Situação atual
                            </h2>

                            <div className="mt-5 space-y-4">
                                <ItemInformacao
                                    titulo="Status"
                                    valor={nomeStatus(
                                        submissao.status
                                    )}
                                />

                                <ItemInformacao
                                    titulo="Resultado"
                                    valor={nomeResultado(
                                        submissao.resultadoDeduplicacao
                                    )}
                                />

                                <ItemInformacao
                                    titulo="Tentativas"
                                    valor={
                                        submissao.tentativasProcessamento
                                    }
                                />

                                <ItemInformacao
                                    titulo="Recebido"
                                    valor={formatarData(
                                        submissao.recebidoEm
                                    )}
                                />

                                <ItemInformacao
                                    titulo="Processado"
                                    valor={formatarData(
                                        submissao.processadoEm
                                    )}
                                />

                                <ItemInformacao
                                    titulo="Última atualização"
                                    valor={formatarData(
                                        submissao.atualizadoEm
                                    )}
                                />
                            </div>

                            {submissao.mensagemErro && (
                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                                    <p className="text-xs font-bold uppercase tracking-wide">
                                        O que aconteceu
                                    </p>

                                    <p className="mt-2 text-sm leading-6">
                                        {
                                            submissao.mensagemErro
                                        }
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Lead
                            </p>

                            <h2 className="mt-1 text-xl font-black">
                                Resultado comercial
                            </h2>

                            {submissao.lead ? (
                                <div className="mt-5 space-y-4">
                                    <ItemInformacao
                                        titulo="Lead"
                                        valor={
                                            submissao.lead.nome
                                        }
                                        complemento={`#${submissao.lead.id}`}
                                    />

                                    <ItemInformacao
                                        titulo="Curso"
                                        valor={
                                            submissao.lead.cursoInteresse?.nome
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Unidade"
                                        valor={
                                            submissao.lead.poloInteresse?.nome
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Responsável"
                                        valor={
                                            submissao.lead.responsavelFuncionario?.nome
                                        }
                                    />

                                    <ItemInformacao
                                        titulo="Equipe"
                                        valor={
                                            submissao.lead.equipeResponsavel?.nome
                                        }
                                    />

                                    <Link
                                        href={`/admin/comercial/leads/${submissao.lead.id}`}
                                        className="block rounded-xl bg-neutral-800 px-4 py-3 text-center text-sm font-bold text-white hover:bg-neutral-700"
                                    >
                                        Abrir Ficha 360°
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="font-bold">
                                        Nenhum lead vinculado
                                    </p>

                                    <p className="phanyx-muted mt-1 text-sm leading-6">
                                        O processamento ainda não gerou ou vinculou um lead a esta submissão.
                                    </p>
                                </div>
                            )}
                        </section>

                        <details className="phanyx-card rounded-3xl p-6 shadow-sm">
                            <summary className="cursor-pointer text-lg font-black">
                                Dados técnicos
                            </summary>

                            <p className="phanyx-muted mt-2 text-sm">
                                Informações para suporte, auditoria e diagnóstico.
                            </p>

                            <div className="mt-5 space-y-4">
                                <ItemInformacao
                                    titulo="Identificador externo"
                                    valor={
                                        submissao.identificadorExterno
                                    }
                                />

                                <ItemInformacao
                                    titulo="Código do erro"
                                    valor={
                                        submissao.codigoErro
                                    }
                                />

                                {permissoes.podeVerAuditoria && (
                                    <>
                                        <ItemInformacao
                                            titulo="Chave de deduplicação"
                                            valor={
                                                submissao.chaveDeduplicacao
                                            }
                                        />

                                        <ItemInformacao
                                            titulo="IP protegido"
                                            valor={
                                                submissao.ipHash
                                            }
                                        />

                                        <div>
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Dados originalmente recebidos
                                            </p>

                                            <JsonVisual
                                                valor={
                                                    submissao.dadosOriginais
                                                }
                                            />
                                        </div>

                                        <div>
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Dados normalizados pelo PHANYX
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
                            Tentar processar novamente?
                        </h2>

                        <p className="phanyx-muted mt-2 text-sm leading-6">
                            O PHANYX verificará novamente os dados desta submissão.
                        </p>

                        <p className="phanyx-muted mt-2 text-sm leading-6">
                            Se já existir um lead correspondente, as regras de deduplicação serão respeitadas.
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
                                Cancelar
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
                                    ? "Processando..."
                                    : "Tentar novamente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}