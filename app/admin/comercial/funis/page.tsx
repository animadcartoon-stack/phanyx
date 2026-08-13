"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

type EtapaFunil = {
    id: number;
    nome: string;
    descricao: string | null;
    categoria: string;
    resultado: string;
    ordem: number;
    cor: string;
    probabilidadeConversao: number;
    prazoMaximoHoras: number | null;
    exigeProximaAcao: boolean;
    exigeMotivoPerda: boolean;
    permiteMovimentoManual: boolean;
    visivelNoKanban: boolean;
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
    arquivadoEm: string | null;
};

type FunilComercial = {
    id: number;
    nome: string;
    descricao: string | null;
    padrao: boolean;
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
    arquivadoEm: string | null;
    etapas: EtapaFunil[];
};

type MotivoPerda = {
    id: number;
    nome: string;
    descricao: string | null;
    categoria: string;
    exigeObservacao: boolean;
    ordem: number;
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
    arquivadoEm: string | null;
};

type RespostaFunis = {
    success: boolean;
    error?: string;
    permissoes: {
        podeVer: boolean;
        podeGerenciar: boolean;
    };
    configuracao: {
        estruturaConfigurada: boolean;
        funilPadraoId: number | null;
        quantidadeFunis: number;
        quantidadeEtapas: number;
        quantidadeMotivosPerda: number;
        totalLeads: number;
        leadsSemEstrutura: number;
    };
    funis: FunilComercial[];
    motivosPerda: MotivoPerda[];
};

type Toast = {
    tipo: "sucesso" | "erro";
    mensagem: string;
};

const CATEGORIAS_ETAPA: Record<string, string> = {
    ENTRADA: "Entrada",
    PRIMEIRO_CONTATO: "Primeiro contato",
    EM_ATENDIMENTO: "Em atendimento",
    QUALIFICACAO: "Qualificação",
    APRESENTACAO: "Apresentação",
    PROPOSTA: "Proposta",
    NEGOCIACAO: "Negociação",
    DOCUMENTACAO: "Documentação",
    PAGAMENTO: "Pagamento",
    CONVERSAO: "Conversão",
    PERDA: "Perda",
    PAUSA: "Pausa",
    DESCARTE: "Descarte",
};

const RESULTADOS_ETAPA: Record<string, string> = {
    ABERTA: "Em aberto",
    GANHA: "Ganha",
    PERDIDA: "Perdida",
    DESCARTADA: "Descartada",
};

const CATEGORIAS_PERDA: Record<string, string> = {
    SEM_INTERESSE: "Sem interesse",
    PRECO: "Preço",
    CONCORRENCIA: "Concorrência",
    SEM_CONTATO: "Sem contato",
    CURSO_INDISPONIVEL: "Curso indisponível",
    HORARIO_INCOMPATIVEL: "Horário incompatível",
    LOCALIZACAO: "Localização",
    DOCUMENTACAO: "Documentação",
    FINANCEIRO: "Financeiro",
    DESISTENCIA: "Desistência",
    DUPLICIDADE: "Duplicidade",
    FORA_DO_PERFIL: "Fora do perfil",
    OUTRO: "Outro",
};

function formatarPrazo(horas: number | null) {
    if (horas === null) {
        return "Sem prazo máximo";
    }

    if (horas < 24) {
        return `${horas}h`;
    }

    const dias = horas / 24;

    if (Number.isInteger(dias)) {
        return `${dias} dia${dias === 1 ? "" : "s"}`;
    }

    return `${horas}h`;
}

function formatarData(valor: string) {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return "Data indisponível";
    }

    return data.toLocaleString("pt-BR");
}

export default function FunisComerciaisPage() {
    const [dados, setDados] =
        useState<RespostaFunis | null>(null);

    const [carregando, setCarregando] =
        useState(true);

    const [inicializando, setInicializando] =
        useState(false);

    const [erro, setErro] = useState("");
    const [toast, setToast] =
        useState<Toast | null>(null);

    const exibirToast = useCallback(
        (
            tipo: Toast["tipo"],
            mensagem: string
        ) => {
            setToast({
                tipo,
                mensagem,
            });
        },
        []
    );

    useEffect(() => {
        if (!toast) {
            return;
        }

        const temporizador = window.setTimeout(() => {
            setToast(null);
        }, 5000);

        return () => {
            window.clearTimeout(temporizador);
        };
    }, [toast]);

    const carregarFunis = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");

            const resposta = await fetch(
                "/api/admin/comercial/funis",
                {
                    method: "GET",
                    cache: "no-store",
                }
            );

            const payload = (await resposta
                .json()
                .catch(() => null)) as
                | RespostaFunis
                | null;

            if (!resposta.ok || !payload?.success) {
                throw new Error(
                    payload?.error ??
                    "Não foi possível carregar os funis."
                );
            }

            setDados(payload);
        } catch (error) {
            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar os funis.";

            setErro(mensagem);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        void carregarFunis();
    }, [carregarFunis]);

    async function inicializarEstrutura() {
        try {
            setInicializando(true);
            setErro("");

            const resposta = await fetch(
                "/api/admin/comercial/funis/inicializar",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const payload = (await resposta
                .json()
                .catch(() => null)) as
                | {
                    success?: boolean;
                    mensagem?: string;
                    error?: string;
                }
                | null;

            if (!resposta.ok || !payload?.success) {
                throw new Error(
                    payload?.error ??
                    "Não foi possível inicializar o funil."
                );
            }

            exibirToast(
                "sucesso",
                payload.mensagem ??
                "Estrutura comercial inicializada."
            );

            await carregarFunis();
        } catch (error) {
            const mensagem =
                error instanceof Error
                    ? error.message
                    : "Não foi possível inicializar o funil.";

            setErro(mensagem);
            exibirToast("erro", mensagem);
        } finally {
            setInicializando(false);
        }
    }

    const configuracao = dados?.configuracao;
    const podeGerenciar =
        dados?.permissoes.podeGerenciar ?? false;

    const textoBotaoInicializacao =
        !configuracao?.estruturaConfigurada
            ? "Criar estrutura comercial"
            : configuracao.leadsSemEstrutura > 0
                ? "Vincular leads pendentes"
                : "Verificar estrutura";

    return (
        <div className="phanyx-funis-comerciais-page mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
            {toast ? (
                <div
                    aria-live="polite"
                    className={`fixed right-4 top-4 z-50 max-w-md rounded-2xl border px-5 py-4 text-sm font-semibold shadow-xl ${toast.tipo === "sucesso"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                        : "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <span>
                            {toast.tipo === "sucesso"
                                ? "✅"
                                : "⚠️"}
                        </span>

                        <span>{toast.mensagem}</span>

                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="ml-auto rounded-lg px-2 py-1 opacity-70 transition hover:opacity-100"
                            aria-label="Fechar mensagem"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ) : null}

            <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-7">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                            <Link
                                href="/admin/comercial"
                                className="font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                            >
                                Comercial
                            </Link>

                            <span className="text-slate-400">/</span>

                            <span className="font-semibold text-slate-950 dark:text-white">
                                Funis comerciais
                            </span>
                        </div>

                        <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                            Configuração do funil comercial
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Organize as etapas do atendimento, os
                            prazos, as probabilidades de conversão e os
                            motivos de perda das oportunidades.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => void carregarFunis()}
                            disabled={carregando || inicializando}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                        >
                            {carregando
                                ? "Atualizando..."
                                : "Atualizar"}
                        </button>

                        {podeGerenciar ? (
                            <button
                                type="button"
                                onClick={() =>
                                    void inicializarEstrutura()
                                }
                                disabled={
                                    carregando || inicializando
                                }
                                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                                {inicializando
                                    ? "Processando..."
                                    : textoBotaoInicializacao}
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            {erro ? (
                <section className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100">
                    <h2 className="font-black">
                        Não foi possível concluir a operação
                    </h2>

                    <p className="mt-1 text-sm">{erro}</p>

                    <button
                        type="button"
                        onClick={() => void carregarFunis()}
                        className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-800 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                    >
                        Tentar novamente
                    </button>
                </section>
            ) : null}

            {carregando && !dados ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-3xl">⏳</div>

                    <p className="mt-3 font-bold text-slate-900 dark:text-white">
                        Carregando configuração comercial...
                    </p>
                </section>
            ) : null}

            {dados ? (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                            {
                                titulo: "Situação",
                                valor: configuracao?.estruturaConfigurada
                                    ? "Configurado"
                                    : "Pendente",
                                detalhe:
                                    configuracao?.estruturaConfigurada
                                        ? "Funil padrão disponível"
                                        : "Inicialização necessária",
                                icone: configuracao?.estruturaConfigurada
                                    ? "✅"
                                    : "⚠️",
                            },
                            {
                                titulo: "Funis",
                                valor:
                                    configuracao?.quantidadeFunis ?? 0,
                                detalhe: "Cadastrados na instituição",
                                icone: "🧭",
                            },
                            {
                                titulo: "Etapas",
                                valor:
                                    configuracao?.quantidadeEtapas ?? 0,
                                detalhe: "No funil comercial padrão",
                                icone: "📊",
                            },
                            {
                                titulo: "Motivos de perda",
                                valor:
                                    configuracao?.quantidadeMotivosPerda ??
                                    0,
                                detalhe: "Motivos disponíveis",
                                icone: "📋",
                            },
                            {
                                titulo: "Leads pendentes",
                                valor:
                                    configuracao?.leadsSemEstrutura ?? 0,
                                detalhe: `De ${configuracao?.totalLeads ?? 0
                                    } leads cadastrados`,
                                icone: "🎯",
                            },
                        ].map((card) => (
                            <article
                                key={card.titulo}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div
                                    className={`flex min-w-0 items-center gap-3 ${card.titulo === "Situação"
                                            ? ""
                                            : "justify-between"
                                        }`}
                                >
                                    <span className="shrink-0 text-2xl">
                                        {card.icone}
                                    </span>

                                    <span
                                        className={`min-w-0 font-black text-slate-950 dark:text-white ${card.titulo === "Situação"
                                                ? "whitespace-nowrap text-lg"
                                                : "text-2xl"
                                            }`}
                                    >
                                        {card.valor}
                                    </span>
                                </div>

                                <h2 className="mt-4 font-black text-slate-950 dark:text-white">
                                    {card.titulo}
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                                    {card.detalhe}
                                </p>
                            </article>
                        ))}
                    </section>

                    {!configuracao?.estruturaConfigurada ? (
                        <section className="rounded-3xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-6 shadow-sm dark:border-slate-800 dark:border-l-amber-500 dark:bg-slate-950">
                            <h2 className="text-lg font-black text-slate-950 dark:text-white">
                                O CRM ainda precisa ser inicializado
                            </h2>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                                A inicialização criará o funil padrão,
                                suas etapas, os motivos de perda e
                                vinculará os leads antigos. Nenhum lead
                                será apagado.
                            </p>

                            {podeGerenciar ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        void inicializarEstrutura()
                                    }
                                    disabled={inicializando}
                                    className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
                                >
                                    {inicializando
                                        ? "Inicializando..."
                                        : "Inicializar agora"}
                                </button>
                            ) : (
                                <p className="mt-4 text-sm font-bold text-amber-950 dark:text-amber-100">
                                    Você não possui permissão para
                                    inicializar esta estrutura.
                                </p>
                            )}
                        </section>
                    ) : null}

                    <section className="space-y-5">
                        {dados.funis.map((funil) => (
                            <article
                                key={funil.id}
                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                                    {funil.nome}
                                                </h2>

                                                {funil.padrao ? (
                                                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                                        Funil padrão
                                                    </span>
                                                ) : null}

                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-bold ${funil.ativo
                                                        ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                        : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                                                        }`}
                                                >
                                                    {funil.ativo
                                                        ? "Ativo"
                                                        : "Arquivado"}
                                                </span>
                                            </div>

                                            {funil.descricao ? (
                                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                    {funil.descricao}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Atualizado em{" "}
                                            {formatarData(funil.atualizadoEm)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="font-black text-slate-950 dark:text-white">
                                                Etapas do processo comercial
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                {funil.etapas.length} etapa(s)
                                                configurada(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {funil.etapas.map((etapa) => (
                                            <div
                                                key={etapa.id}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                                            >
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                                                    <div className="flex min-w-0 flex-1 items-start gap-4">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                                                            {etapa.ordem}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span
                                                                    className="h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-950"
                                                                    style={{
                                                                        backgroundColor:
                                                                            etapa.cor,
                                                                    }}
                                                                />

                                                                <h4 className="font-black text-slate-950 dark:text-white">
                                                                    {etapa.nome}
                                                                </h4>

                                                                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                                                    {CATEGORIAS_ETAPA[
                                                                        etapa.categoria
                                                                    ] ?? etapa.categoria}
                                                                </span>

                                                                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                                                    {RESULTADOS_ETAPA[
                                                                        etapa.resultado
                                                                    ] ?? etapa.resultado}
                                                                </span>
                                                            </div>

                                                            {etapa.descricao ? (
                                                                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                                                                    {etapa.descricao}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
                                                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500">
                                                                Conversão
                                                            </div>

                                                            <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                                                                {
                                                                    etapa.probabilidadeConversao
                                                                }
                                                                %
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500">
                                                                Prazo
                                                            </div>

                                                            <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                                                                {formatarPrazo(
                                                                    etapa.prazoMaximoHoras
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500">
                                                                Próxima ação
                                                            </div>

                                                            <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                                                                {etapa.exigeProximaAcao
                                                                    ? "Obrigatória"
                                                                    : "Opcional"}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                                                            <div className="text-[10px] font-bold uppercase text-slate-500">
                                                                Movimento
                                                            </div>

                                                            <div className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                                                                {etapa.permiteMovimentoManual
                                                                    ? "Manual"
                                                                    : "Automático"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {funil.etapas.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                                Nenhuma etapa cadastrada neste
                                                funil.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}

                        {dados.funis.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-950">
                                <div className="text-4xl">🧭</div>

                                <h2 className="mt-3 font-black text-slate-950 dark:text-white">
                                    Nenhum funil comercial cadastrado
                                </h2>

                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    Inicialize a estrutura para criar o
                                    funil padrão da instituição.
                                </p>
                            </div>
                        ) : null}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                Motivos de perda
                            </h2>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Motivos utilizados para compreender por
                                que as oportunidades não foram
                                convertidas.
                            </p>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {dados.motivosPerda.map((motivo) => (
                                <article
                                    key={motivo.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-black text-slate-950 dark:text-white">
                                                {motivo.nome}
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                                {CATEGORIAS_PERDA[
                                                    motivo.categoria
                                                ] ?? motivo.categoria}
                                            </p>
                                        </div>

                                        <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                            {motivo.ativo
                                                ? "Ativo"
                                                : "Arquivado"}
                                        </span>
                                    </div>

                                    {motivo.exigeObservacao ? (
                                        <p className="phanyx-motivo-observacao mt-3 text-xs font-bold">
                                            ⚠ Exige observação complementar
                                        </p>
                                    ) : null}
                                </article>
                            ))}

                            {dados.motivosPerda.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                    Nenhum motivo de perda cadastrado.
                                </div>
                            ) : null}
                        </div>
                    </section>
                </>
            ) : null}
        </div>
    );
}