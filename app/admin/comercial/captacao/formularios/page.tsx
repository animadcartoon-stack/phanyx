"use client";

import Link from "next/link";
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

type Tema =
    | "light"
    | "dark"
    | "system";

type CanalReferencia = {
    id: number;
    nome: string;
    tipo: string;
    cor: string;
    padrao: boolean;
};

type CampanhaReferencia = {
    id: number;
    canalId: number | null;
    nome: string;
    codigo: string;
    status: string;
};

type FormularioCaptacao = {
    id: number;

    nome: string;
    slug: string;
    tokenPublico: string;

    titulo: string;
    descricao: string | null;

    status: string;
    versao: number;

    publico: boolean;
    ativo: boolean;

    exigeConsentimento: boolean;

    criarTarefaPrimeiroContato: boolean;
    tipoTarefaInicial: string;
    prazoPrimeiroContatoMinutos: number;

    recaptchaAtivo: boolean;
    honeypotAtivo: boolean;

    publicadoEm: string | null;
    pausadoEm: string | null;
    arquivadoEm: string | null;

    criadoEm: string;
    atualizadoEm: string;

    canal: {
        id: number;
        nome: string;
        tipo: string;
        cor: string;
    } | null;

    campanha: {
        id: number;
        nome: string;
        codigo: string;
        status: string;
    } | null;

    funilPadrao: {
        id: number;
        nome: string;
    } | null;

    etapaPadrao: {
        id: number;
        nome: string;
        ordem: number;
        categoria: string;
    } | null;

    equipePadrao: {
        id: number;
        nome: string;
    } | null;

    responsavelPadrao: {
        id: number;
        nome: string;
        cargo: string | null;
    } | null;

    cursoPadrao: {
        id: number;
        nome: string;
        codigo: string | null;
    } | null;

    poloPadrao: {
        id: number;
        nome: string;
        codigo: string | null;
    } | null;

    _count: {
        campos: number;
        submissoes: number;
        regrasDistribuicao: number;
        integracoes: number;
    };
};

type RespostaFormularios = {
    success: true;

    permissoes: {
        podeVer: boolean;
        podeGerenciar: boolean;
    };

    statusDisponiveis:
    string[];

    tiposTarefaDisponiveis:
    string[];

    resumo: {
        total: number;
        publicados: number;
        rascunhos: number;
        pausados: number;
        arquivados: number;
    };

    referencias: {
        canais:
        CanalReferencia[];

        campanhas:
        CampanhaReferencia[];

        funis: unknown[];
        equipes: unknown[];
        responsaveis: unknown[];
        cursos: unknown[];
        polos: unknown[];
    };

    formularios:
    FormularioCaptacao[];
};

type RespostaErro = {
    success?: false;
    error?: string;
    codigo?: string;
};

type FormularioNovo = {
    nome: string;
    titulo: string;
    slug: string;
    descricao: string;

    canalId: string;
    campanhaId: string;
};

const FORMULARIO_INICIAL:
    FormularioNovo = {
    nome: "",
    titulo: "",
    slug: "",
    descricao: "",

    canalId: "",
    campanhaId: "",
};

function formatarNumero(
    valor: number
) {
    return new Intl.NumberFormat(
        "pt-BR"
    ).format(
        Number(valor || 0)
    );
}

function formatarDataHora(
    valor:
        | string
        | null
        | undefined
) {
    if (!valor) {
        return "—";
    }

    const data =
        new Date(valor);

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
            timeZone:
                "America/Sao_Paulo",

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",
        }
    ).format(data);
}

function nomeStatus(
    status: string
) {
    const mapa:
        Record<string, string> = {
        RASCUNHO:
            "Rascunho",

        PUBLICADO:
            "Publicado",

        PAUSADO:
            "Pausado",

        ARQUIVADO:
            "Arquivado",
    };

    return (
        mapa[status] ??
        status
    );
}

function classesStatus(
    status: string,
    temaEscuro: boolean
) {
    if (
        status ===
        "PUBLICADO"
    ) {
        return temaEscuro
            ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (
        status ===
        "PAUSADO"
    ) {
        return temaEscuro
            ? "border-amber-800 bg-amber-950/60 text-amber-300"
            : "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (
        status ===
        "ARQUIVADO"
    ) {
        return temaEscuro
            ? "border-slate-700 bg-slate-800 text-slate-300"
            : "border-slate-200 bg-slate-100 text-slate-600";
    }

    return temaEscuro
        ? "border-violet-800 bg-violet-950/60 text-violet-300"
        : "border-violet-200 bg-violet-50 text-violet-700";
}

export default function FormulariosCaptacaoPage() {
    const [
        temaEscuro,
        setTemaEscuro,
    ] =
        useState(false);

    const [
        dados,
        setDados,
    ] =
        useState<RespostaFormularios | null>(
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
        busca,
        setBusca,
    ] =
        useState("");

    const [
        canalFiltro,
        setCanalFiltro,
    ] =
        useState("");

    const [
        campanhaFiltro,
        setCampanhaFiltro,
    ] =
        useState("");

    const [
        statusFiltro,
        setStatusFiltro,
    ] =
        useState("");

    const [
        ativoFiltro,
        setAtivoFiltro,
    ] =
        useState("");

    const [
        modalNovoAberto,
        setModalNovoAberto,
    ] =
        useState(false);

    const [
        formulario,
        setFormulario,
    ] =
        useState<FormularioNovo>(
            FORMULARIO_INICIAL
        );

    const [
        erroFormulario,
        setErroFormulario,
    ] =
        useState("");

    const [
        toast,
        setToast,
    ] =
        useState<{
            tipo:
            | "sucesso"
            | "erro";

            mensagem:
            string;
        } | null>(
            null
        );

    useEffect(() => {
        function calcularTema() {
            const tema =
                (
                    localStorage.getItem(
                        "phanyx_tema"
                    ) ||
                    "system"
                ) as Tema;

            const sistemaEscuro =
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches;

            setTemaEscuro(
                tema === "dark" ||
                (
                    tema ===
                    "system" &&
                    sistemaEscuro
                )
            );
        }

        calcularTema();

        window.addEventListener(
            "storage",
            calcularTema
        );

        const media =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

        media.addEventListener(
            "change",
            calcularTema
        );

        return () => {
            window.removeEventListener(
                "storage",
                calcularTema
            );

            media.removeEventListener(
                "change",
                calcularTema
            );
        };
    }, []);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timer =
            window.setTimeout(
                () => {
                    setToast(null);
                },
                3500
            );

        return () =>
            window.clearTimeout(
                timer
            );
    }, [toast]);

    const c =
        useMemo(
            () => ({
                pagina:
                    temaEscuro
                        ? "bg-slate-950 text-slate-100"
                        : "bg-slate-100 text-slate-900",

                card:
                    temaEscuro
                        ? "border-slate-800 bg-slate-900"
                        : "border-slate-200 bg-white",

                subCard:
                    temaEscuro
                        ? "border-slate-800 bg-slate-950"
                        : "border-slate-200 bg-slate-50",

                titulo:
                    temaEscuro
                        ? "text-white"
                        : "text-slate-900",

                texto:
                    temaEscuro
                        ? "text-slate-300"
                        : "text-slate-700",

                muted:
                    temaEscuro
                        ? "text-slate-400"
                        : "text-slate-500",

                divisoria:
                    temaEscuro
                        ? "border-slate-800"
                        : "border-slate-200",

                input:
                    temaEscuro
                        ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                        : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

                botaoSecundario:
                    temaEscuro
                        ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            }),
            [
                temaEscuro,
            ]
        );

    const carregar =
        useCallback(
            async (
                opcoes?: {
                    silencioso?: boolean;

                    busca?: string;
                    canalId?: string;
                    campanhaId?: string;
                    status?: string;
                    ativo?: string;
                }
            ) => {
                try {
                    if (
                        opcoes
                            ?.silencioso
                    ) {
                        setAtualizando(
                            true
                        );
                    } else {
                        setCarregando(
                            true
                        );
                    }

                    setErro("");

                    const params =
                        new URLSearchParams();

                    const buscaAtual =
                        opcoes?.busca ??
                        "";

                    const canalAtual =
                        opcoes?.canalId ??
                        "";

                    const campanhaAtual =
                        opcoes?.campanhaId ??
                        "";

                    const statusAtual =
                        opcoes?.status ??
                        "";

                    const ativoAtual =
                        opcoes?.ativo ??
                        "";

                    if (
                        buscaAtual.trim()
                    ) {
                        params.set(
                            "busca",
                            buscaAtual.trim()
                        );
                    }

                    if (
                        canalAtual
                    ) {
                        params.set(
                            "canalId",
                            canalAtual
                        );
                    }

                    if (
                        campanhaAtual
                    ) {
                        params.set(
                            "campanhaId",
                            campanhaAtual
                        );
                    }

                    if (
                        statusAtual
                    ) {
                        params.set(
                            "status",
                            statusAtual
                        );
                    }

                    if (
                        ativoAtual
                    ) {
                        params.set(
                            "ativo",
                            ativoAtual
                        );
                    }

                    const query =
                        params.toString();

                    const resposta =
                        await fetch(
                            `/api/admin/comercial/captacao/formularios${query
                                ? `?${query}`
                                : ""
                            }`,
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
                        | RespostaFormularios
                        | RespostaErro;

                    if (
                        !resposta.ok ||
                        !(
                            "success" in
                            json
                        ) ||
                        json.success !==
                        true
                    ) {
                        throw new Error(
                            (
                                json as
                                RespostaErro
                            ).error ||
                            "Não foi possível carregar os formulários de captação."
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
                            : "Não foi possível carregar os formulários de captação."
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
            []
        );

    useEffect(() => {
        void carregar();
    }, [carregar]);

    function aplicarFiltros(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        void carregar({
            busca,
            canalId:
                canalFiltro,

            campanhaId:
                campanhaFiltro,

            status:
                statusFiltro,

            ativo:
                ativoFiltro,
        });
    }

    function limparFiltros() {
        setBusca("");
        setCanalFiltro("");
        setCampanhaFiltro("");
        setStatusFiltro("");
        setAtivoFiltro("");

        void carregar();
    }

    function abrirNovoFormulario() {
        const canalPadrao =
            dados
                ?.referencias
                .canais
                .find(
                    (canal) =>
                        canal.padrao
                );

        setFormulario({
            ...FORMULARIO_INICIAL,

            canalId:
                canalPadrao
                    ? String(
                        canalPadrao.id
                    )
                    : "",
        });

        setErroFormulario(
            ""
        );

        setModalNovoAberto(
            true
        );
    }

    function fecharNovoFormulario() {
        if (salvando) {
            return;
        }

        setModalNovoAberto(
            false
        );

        setErroFormulario(
            ""
        );
    }

    function atualizarFormulario<
        K extends keyof FormularioNovo
    >(
        campo: K,
        valor:
            FormularioNovo[K]
    ) {
        setFormulario(
            (
                atual
            ) => ({
                ...atual,

                [campo]:
                    valor,
            })
        );

        if (
            erroFormulario
        ) {
            setErroFormulario(
                ""
            );
        }
    }

    function selecionarCanal(
        canalId: string
    ) {
        setFormulario(
            (
                atual
            ) => {
                const campanhaAtual =
                    dados
                        ?.referencias
                        .campanhas
                        .find(
                            (
                                campanha
                            ) =>
                                String(
                                    campanha.id
                                ) ===
                                atual.campanhaId
                        );

                const campanhaContinuaValida =
                    !campanhaAtual ||
                    !canalId ||
                    !campanhaAtual.canalId ||
                    String(
                        campanhaAtual.canalId
                    ) === canalId;

                return {
                    ...atual,

                    canalId,

                    campanhaId:
                        campanhaContinuaValida
                            ? atual.campanhaId
                            : "",
                };
            }
        );
    }

    function selecionarCampanha(
        campanhaId: string
    ) {
        const campanha =
            dados
                ?.referencias
                .campanhas
                .find(
                    (
                        item
                    ) =>
                        String(
                            item.id
                        ) ===
                        campanhaId
                );

        setFormulario(
            (
                atual
            ) => ({
                ...atual,

                campanhaId,

                canalId:
                    campanha
                        ?.canalId
                        ? String(
                            campanha.canalId
                        )
                        : atual.canalId,
            })
        );
    }

    const campanhasFormulario =
        useMemo(
            () => {
                if (!dados) {
                    return [];
                }

                if (
                    !formulario.canalId
                ) {
                    return dados
                        .referencias
                        .campanhas;
                }

                return dados
                    .referencias
                    .campanhas
                    .filter(
                        (
                            campanha
                        ) =>
                            !campanha.canalId ||
                            String(
                                campanha.canalId
                            ) ===
                            formulario.canalId
                    );
            },
            [
                dados,
                formulario.canalId,
            ]
        );

    async function criarFormulario(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const nome =
            formulario
                .nome
                .trim();

        const titulo =
            formulario
                .titulo
                .trim();

        if (!nome) {
            setErroFormulario(
                "Informe o nome interno do formulário."
            );

            return;
        }

        if (!titulo) {
            setErroFormulario(
                "Informe o título que será exibido para o interessado."
            );

            return;
        }

        try {
            setSalvando(
                true
            );

            setErroFormulario(
                ""
            );

            const resposta =
                await fetch(
                    "/api/admin/comercial/captacao/formularios",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                nome,

                                titulo,

                                slug:
                                    formulario
                                        .slug
                                        .trim() ||
                                    null,

                                descricao:
                                    formulario
                                        .descricao
                                        .trim() ||
                                    null,

                                canalId:
                                    formulario
                                        .canalId
                                        ? Number(
                                            formulario
                                                .canalId
                                        )
                                        : null,

                                campanhaId:
                                    formulario
                                        .campanhaId
                                        ? Number(
                                            formulario
                                                .campanhaId
                                        )
                                        : null,

                                /*
                                 * Todo formulário nasce
                                 * como rascunho.
                                 */
                                status:
                                    "RASCUNHO",

                                publico:
                                    true,

                                ativo:
                                    true,

                                /*
                                 * Padrões seguros.
                                 * Serão configuráveis
                                 * na etapa seguinte.
                                 */
                                exigeConsentimento:
                                    true,

                                bloquearDuplicados:
                                    true,

                                atualizarLeadExistente:
                                    true,

                                criarTarefaPrimeiroContato:
                                    true,

                                tipoTarefaInicial:
                                    "RETORNO",

                                prazoPrimeiroContatoMinutos:
                                    15,

                                recaptchaAtivo:
                                    false,

                                honeypotAtivo:
                                    true,

                                limiteSubmissoesPorIpHora:
                                    20,
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
                json.success !==
                true
            ) {
                throw new Error(
                    json.error ||
                    "Não foi possível criar o formulário."
                );
            }

            setModalNovoAberto(
                false
            );

            setToast({
                tipo:
                    "sucesso",

                mensagem:
                    json.message ||
                    "Formulário criado como rascunho.",
            });

            await carregar({
                silencioso:
                    true,
            });
        } catch (
        error
        ) {
            setErroFormulario(
                error instanceof
                    Error
                    ? error.message
                    : "Não foi possível criar o formulário."
            );
        } finally {
            setSalvando(
                false
            );
        }
    }

    if (
        carregando &&
        !dados
    ) {
        return (
            <div
                className={`min-h-screen p-6 ${c.pagina}`}
            >
                <div className="mx-auto max-w-7xl space-y-5">
                    <div
                        className={`h-32 animate-pulse rounded-3xl border ${c.card}`}
                    />

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({
                            length: 4,
                        }).map(
                            (
                                _,
                                index
                            ) => (
                                <div
                                    key={
                                        index
                                    }
                                    className={`h-28 animate-pulse rounded-3xl border ${c.card}`}
                                />
                            )
                        )}
                    </div>

                    <div
                        className={`h-96 animate-pulse rounded-3xl border ${c.card}`}
                    />
                </div>
            </div>
        );
    }

    if (
        erro &&
        !dados
    ) {
        return (
            <div
                className={`min-h-screen p-6 ${c.pagina}`}
            >
                <div
                    className={`mx-auto max-w-2xl rounded-3xl border p-6 shadow-sm ${c.card}`}
                >
                    <div className="text-3xl">
                        ⚠️
                    </div>

                    <h1
                        className={`mt-4 text-xl font-bold ${c.titulo}`}
                    >
                        Não foi possível
                        carregar os formulários
                    </h1>

                    <p
                        className={`mt-2 text-sm ${c.texto}`}
                    >
                        {erro}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void carregar()
                        }
                        className={`mt-5 rounded-xl border px-4 py-2 text-sm font-semibold ${c.botaoSecundario}`}
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    if (!dados) {
        return null;
    }

    return (
        <div
            className={`min-h-screen p-4 sm:p-6 ${c.pagina}`}
        >
            {toast && (
                <div className="fixed right-5 top-5 z-[120]">
                    <div
                        className={
                            toast.tipo ===
                                "sucesso"
                                ? (
                                    temaEscuro
                                        ? "rounded-2xl border border-emerald-800 bg-emerald-950 px-4 py-3 text-sm font-medium text-emerald-200 shadow-xl"
                                        : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-xl"
                                )
                                : (
                                    temaEscuro
                                        ? "rounded-2xl border border-red-900 bg-red-950 px-4 py-3 text-sm font-medium text-red-200 shadow-xl"
                                        : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-xl"
                                )
                        }
                    >
                        {
                            toast.mensagem
                        }
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-7xl space-y-6">
                <section
                    className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <Link
                                href="/admin/comercial/captacao"
                                className={`text-sm font-semibold ${c.muted}`}
                            >
                                ← Central de
                                Captação
                            </Link>

                            <h1
                                className={`mt-3 text-2xl font-bold sm:text-3xl ${c.titulo}`}
                            >
                                📝 Formulários de
                                captação
                            </h1>

                            <p
                                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
                            >
                                Crie formulários
                                públicos para receber
                                interessados e
                                encaminhá-los
                                automaticamente ao
                                processo comercial.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    void carregar({
                                        silencioso:
                                            true,

                                        busca,
                                        canalId:
                                            canalFiltro,

                                        campanhaId:
                                            campanhaFiltro,

                                        status:
                                            statusFiltro,

                                        ativo:
                                            ativoFiltro,
                                    })
                                }
                                disabled={
                                    atualizando
                                }
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${c.botaoSecundario}`}
                            >
                                {atualizando
                                    ? "Atualizando..."
                                    : "↻ Atualizar"}
                            </button>

                            {dados
                                .permissoes
                                .podeGerenciar && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovoFormulario
                                        }
                                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        + Novo formulário
                                    </button>
                                )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            nome:
                                "Total",

                            valor:
                                dados.resumo
                                    .total,
                        },

                        {
                            nome:
                                "Publicados",

                            valor:
                                dados.resumo
                                    .publicados,
                        },

                        {
                            nome:
                                "Rascunhos",

                            valor:
                                dados.resumo
                                    .rascunhos,
                        },

                        {
                            nome:
                                "Pausados",

                            valor:
                                dados.resumo
                                    .pausados,
                        },
                    ].map(
                        (
                            item
                        ) => (
                            <div
                                key={
                                    item.nome
                                }
                                className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
                            >
                                <p
                                    className={`text-sm ${c.muted}`}
                                >
                                    {
                                        item.nome
                                    }
                                </p>

                                <p
                                    className={`mt-2 text-3xl font-bold ${c.titulo}`}
                                >
                                    {formatarNumero(
                                        item.valor
                                    )}
                                </p>
                            </div>
                        )
                    )}
                </section>

                <section
                    className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
                >
                    <form
                        onSubmit={
                            aplicarFiltros
                        }
                        className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
                    >
                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >
                                Buscar
                            </label>

                            <input
                                type="text"
                                value={
                                    busca
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBusca(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Nome, título ou identificador"
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                            />
                        </div>

                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >
                                Canal
                            </label>

                            <select
                                value={
                                    canalFiltro
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCanalFiltro(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                            >
                                <option value="">
                                    Todos
                                </option>

                                {dados
                                    .referencias
                                    .canais
                                    .map(
                                        (
                                            canal
                                        ) => (
                                            <option
                                                key={
                                                    canal.id
                                                }
                                                value={
                                                    canal.id
                                                }
                                            >
                                                {
                                                    canal.nome
                                                }
                                            </option>
                                        )
                                    )}
                            </select>
                        </div>

                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >
                                Campanha
                            </label>

                            <select
                                value={
                                    campanhaFiltro
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCampanhaFiltro(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                            >
                                <option value="">
                                    Todas
                                </option>

                                {dados
                                    .referencias
                                    .campanhas
                                    .map(
                                        (
                                            campanha
                                        ) => (
                                            <option
                                                key={
                                                    campanha.id
                                                }
                                                value={
                                                    campanha.id
                                                }
                                            >
                                                {
                                                    campanha.nome
                                                }
                                            </option>
                                        )
                                    )}
                            </select>
                        </div>

                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >
                                Status
                            </label>

                            <select
                                value={
                                    statusFiltro
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStatusFiltro(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                            >
                                <option value="">
                                    Todos
                                </option>

                                {dados
                                    .statusDisponiveis
                                    .map(
                                        (
                                            status
                                        ) => (
                                            <option
                                                key={
                                                    status
                                                }
                                                value={
                                                    status
                                                }
                                            >
                                                {nomeStatus(
                                                    status
                                                )}
                                            </option>
                                        )
                                    )}
                            </select>
                        </div>

                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >
                                Situação
                            </label>

                            <select
                                value={
                                    ativoFiltro
                                }
                                onChange={(
                                    event
                                ) =>
                                    setAtivoFiltro(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                            >
                                <option value="">
                                    Todos
                                </option>

                                <option value="true">
                                    Ativos
                                </option>

                                <option value="false">
                                    Inativos
                                </option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2 md:col-span-2 xl:col-span-5 xl:justify-end">
                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Filtrar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    limparFiltros
                                }
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
                            >
                                Limpar
                            </button>
                        </div>
                    </form>
                </section>

                <section
                    className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
                >
                    <div
                        className={`border-b p-5 sm:p-6 ${c.divisoria}`}
                    >
                        <h2
                            className={`text-lg font-bold ${c.titulo}`}
                        >
                            Formulários cadastrados
                        </h2>

                        <p
                            className={`mt-1 text-sm ${c.muted}`}
                        >
                            {formatarNumero(
                                dados.formularios
                                    .length
                            )}{" "}
                            resultado
                            {dados.formularios
                                .length === 1
                                ? ""
                                : "s"}{" "}
                            nesta consulta.
                        </p>
                    </div>

                    {dados.formularios
                        .length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="text-4xl">
                                📝
                            </div>

                            <p
                                className={`mt-3 font-semibold ${c.titulo}`}
                            >
                                Nenhum formulário
                                encontrado
                            </p>

                            <p
                                className={`mt-1 text-sm ${c.muted}`}
                            >
                                Crie o primeiro
                                formulário de
                                captação ou altere os
                                filtros.
                            </p>

                            {dados
                                .permissoes
                                .podeGerenciar && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovoFormulario
                                        }
                                        className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        + Criar formulário
                                    </button>
                                )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {dados.formularios.map(
                                (
                                    item
                                ) => (
                                    <article
                                        key={
                                            item.id
                                        }
                                        className="p-5 sm:p-6"
                                    >
                                        <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3
                                                        className={`text-lg font-bold ${c.titulo}`}
                                                    >
                                                        {
                                                            item.titulo
                                                        }
                                                    </h3>

                                                    <span
                                                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classesStatus(
                                                            item.status,
                                                            temaEscuro
                                                        )}`}
                                                    >
                                                        {nomeStatus(
                                                            item.status
                                                        )}
                                                    </span>

                                                    {!item.ativo && (
                                                        <span
                                                            className={
                                                                temaEscuro
                                                                    ? "rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300"
                                                                    : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                                            }
                                                        >
                                                            Inativo
                                                        </span>
                                                    )}
                                                    {dados
                                                        .permissoes
                                                        .podeGerenciar && (
                                                            <Link
                                                                href={`/admin/comercial/captacao/formularios/${item.id}`}
                                                                className={`ml-1 rounded-lg border px-3 py-1 text-xs font-semibold transition ${c.botaoSecundario}`}
                                                            >
                                                                ⚙️ Configurar formulário
                                                            </Link>
                                                        )}
                                                </div>

                                                <p
                                                    className={`mt-1 text-sm ${c.muted}`}
                                                >
                                                    Nome interno:{" "}
                                                    {
                                                        item.nome
                                                    }
                                                </p>

                                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                                                    <span
                                                        className={`text-sm ${c.texto}`}
                                                    >
                                                        Canal:{" "}
                                                        {item
                                                            .canal
                                                            ?.nome ||
                                                            "Sem canal"}
                                                    </span>

                                                    <span
                                                        className={`text-sm ${c.texto}`}
                                                    >
                                                        Campanha:{" "}
                                                        {item
                                                            .campanha
                                                            ?.nome ||
                                                            "Sem campanha"}
                                                    </span>
                                                </div>

                                                <p
                                                    className={`mt-2 text-xs ${c.muted}`}
                                                >
                                                    Identificador:
                                                    /{
                                                        item.slug
                                                    }
                                                </p>

                                                {item.descricao && (
                                                    <p
                                                        className={`mt-3 max-w-3xl text-sm leading-6 ${c.texto}`}
                                                    >
                                                        {
                                                            item.descricao
                                                        }
                                                    </p>
                                                )}

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <span
                                                        className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                    >
                                                        Versão{" "}
                                                        {
                                                            item.versao
                                                        }
                                                    </span>

                                                    <span
                                                        className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                    >
                                                        {item.exigeConsentimento
                                                            ? "🛡️ LGPD exigida"
                                                            : "LGPD não exigida"}
                                                    </span>

                                                    <span
                                                        className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                    >
                                                        Atualizado em{" "}
                                                        {formatarDataHora(
                                                            item.atualizadoEm
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[420px]">
                                                {[
                                                    {
                                                        nome:
                                                            "Campos",

                                                        valor:
                                                            item
                                                                ._count
                                                                .campos,
                                                    },

                                                    {
                                                        nome:
                                                            "Submissões",

                                                        valor:
                                                            item
                                                                ._count
                                                                .submissoes,
                                                    },

                                                    {
                                                        nome:
                                                            "Regras",

                                                        valor:
                                                            item
                                                                ._count
                                                                .regrasDistribuicao,
                                                    },

                                                    {
                                                        nome:
                                                            "Integrações",

                                                        valor:
                                                            item
                                                                ._count
                                                                .integracoes,
                                                    },
                                                ].map(
                                                    (
                                                        contador
                                                    ) => (
                                                        <div
                                                            key={
                                                                contador.nome
                                                            }
                                                            className={`rounded-xl border p-3 text-center ${c.subCard}`}
                                                        >
                                                            <p
                                                                className={`text-lg font-bold ${c.titulo}`}
                                                            >
                                                                {formatarNumero(
                                                                    contador.valor
                                                                )}
                                                            </p>

                                                            <p
                                                                className={`mt-1 text-[11px] ${c.muted}`}
                                                            >
                                                                {
                                                                    contador.nome
                                                                }
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </section>
            </div>

            {modalNovoAberto && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharNovoFormulario();
                        }
                    }}
                >
                    <div
                        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6 ${c.card}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    className={`text-xl font-bold ${c.titulo}`}
                                >
                                    Novo formulário de
                                    captação
                                </h2>

                                <p
                                    className={`mt-1 text-sm ${c.muted}`}
                                >
                                    Comece pelas
                                    informações básicas.
                                    O formulário será
                                    salvo como rascunho.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharNovoFormulario
                                }
                                disabled={
                                    salvando
                                }
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg ${c.botaoSecundario}`}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                criarFormulario
                            }
                            className="mt-6 space-y-5"
                        >
                            {erroFormulario && (
                                <div
                                    className={
                                        temaEscuro
                                            ? "rounded-2xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300"
                                            : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                    }
                                >
                                    {
                                        erroFormulario
                                    }
                                </div>
                            )}

                            <div
                                className={
                                    temaEscuro
                                        ? "rounded-2xl border border-violet-900 bg-violet-950/40 px-4 py-3 text-sm text-violet-200"
                                        : "rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800"
                                }
                            >
                                📝 Este formulário
                                será criado como
                                <strong>
                                    {" "}
                                    Rascunho
                                </strong>
                                . Depois vamos
                                configurar campos,
                                LGPD, automações e
                                publicação.
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    Nome interno *
                                </label>

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >
                                    Nome utilizado pela
                                    equipe para
                                    identificar o
                                    formulário.
                                </p>

                                <input
                                    type="text"
                                    maxLength={
                                        180
                                    }
                                    value={
                                        formulario.nome
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarFormulario(
                                            "nome",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ex.: Formulário Vestibular 2027"
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    Título exibido para
                                    o interessado *
                                </label>

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >
                                    Este é o título que
                                    a pessoa verá ao
                                    abrir o formulário.
                                </p>

                                <input
                                    type="text"
                                    maxLength={
                                        250
                                    }
                                    value={
                                        formulario.titulo
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarFormulario(
                                            "titulo",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ex.: Inscreva-se para o Vestibular 2027"
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Canal
                                    </label>

                                    <select
                                        value={
                                            formulario
                                                .canalId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            selecionarCanal(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    >
                                        <option value="">
                                            Sem canal
                                            específico
                                        </option>

                                        {dados
                                            .referencias
                                            .canais
                                            .map(
                                                (
                                                    canal
                                                ) => (
                                                    <option
                                                        key={
                                                            canal.id
                                                        }
                                                        value={
                                                            canal.id
                                                        }
                                                    >
                                                        {
                                                            canal.nome
                                                        }
                                                    </option>
                                                )
                                            )}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Campanha
                                    </label>

                                    <select
                                        value={
                                            formulario
                                                .campanhaId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            selecionarCampanha(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    >
                                        <option value="">
                                            Sem campanha
                                            específica
                                        </option>

                                        {campanhasFormulario.map(
                                            (
                                                campanha
                                            ) => (
                                                <option
                                                    key={
                                                        campanha.id
                                                    }
                                                    value={
                                                        campanha.id
                                                    }
                                                >
                                                    {
                                                        campanha.nome
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    Identificador
                                </label>

                                <input
                                    type="text"
                                    maxLength={
                                        180
                                    }
                                    value={
                                        formulario.slug
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarFormulario(
                                            "slug",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Opcional — gerado pelo nome"
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >
                                    Se ficar vazio, o
                                    PHANYX gera
                                    automaticamente.
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    Descrição
                                </label>

                                <textarea
                                    rows={4}
                                    value={
                                        formulario
                                            .descricao
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarFormulario(
                                            "descricao",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Explique brevemente o objetivo deste formulário."
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />
                            </div>

                            <div
                                className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${c.divisoria}`}
                            >
                                <button
                                    type="button"
                                    onClick={
                                        fecharNovoFormulario
                                    }
                                    disabled={
                                        salvando
                                    }
                                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${c.botaoSecundario}`}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvando
                                        ? "Criando..."
                                        : "Criar rascunho"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}