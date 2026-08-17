"use client";

import Link from "next/link";
import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

type ContadoresCanal = {
    campanhas: number;
    formularios: number;
    submissoes: number;
    regrasDistribuicao: number;
    integracoes: number;
};

type Canal = {
    id: number;
    nome: string;
    slug: string;
    descricao: string | null;
    tipo: string;
    cor: string | null;
    icone: string | null;
    padrao: boolean;
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
    _count: ContadoresCanal;
};

type Resumo = {
    total: number;
    ativos: number;
    inativos: number;
    padrao: Canal | null;
};

type RespostaLista = {
    success: boolean;
    error?: string;
    permissoes?: {
        podeVer: boolean;
        podeGerenciar: boolean;
    };
    tiposDisponiveis?: string[];
    resumo?: Resumo;
    canais?: Canal[];
};

type FormularioCanal = {
    nome: string;
    slug: string;
    descricao: string;
    tipo: string;
    cor: string;
    icone: string;
    padrao: boolean;
    ativo: boolean;
};

const FORMULARIO_INICIAL: FormularioCanal = {
    nome: "",
    slug: "",
    descricao: "",
    tipo: "SITE",
    cor: "#64748B",
    icone: "📡",
    padrao: false,
    ativo: true,
};

const LABELS_TIPO: Record<string, string> = {
    SITE: "Site",
    LANDING_PAGE: "Landing page",
    FORMULARIO: "Formulário",
    META_ADS: "Meta Ads",
    GOOGLE_ADS: "Google Ads",
    WHATSAPP: "WhatsApp",
    INDICACAO: "Indicação",
    EVENTO: "Evento",
    PARCERIA: "Parceria",
    IMPORTACAO: "Importação",
    API: "API",
    OUTRO: "Outro",
};

const ICONES_CANAL = [
    { valor: "🌐", nome: "Site" },
    { valor: "🎯", nome: "Landing page" },
    { valor: "📝", nome: "Formulário" },
    { valor: "📣", nome: "Anúncios" },
    { valor: "🔎", nome: "Pesquisa" },
    { valor: "💬", nome: "WhatsApp" },
    { valor: "🤝", nome: "Indicação" },
    { valor: "🎪", nome: "Evento" },
    { valor: "🏢", nome: "Parceria" },
    { valor: "📥", nome: "Importação" },
    { valor: "🔌", nome: "API" },
    { valor: "📡", nome: "Captação" },
    { valor: "📱", nome: "Celular" },
    { valor: "📧", nome: "E-mail" },
    { valor: "🔗", nome: "Link" },
    { valor: "📍", nome: "Local" },
];

const ICONE_POR_TIPO: Record<string, string> = {
    SITE: "🌐",
    LANDING_PAGE: "🎯",
    FORMULARIO: "📝",
    META_ADS: "📣",
    GOOGLE_ADS: "🔎",
    WHATSAPP: "💬",
    INDICACAO: "🤝",
    EVENTO: "🎪",
    PARCERIA: "🏢",
    IMPORTACAO: "📥",
    API: "🔌",
    OUTRO: "📡",
};

function labelTipo(tipo: string) {
    return (
        LABELS_TIPO[tipo] ??
        tipo
            .replaceAll("_", " ")
            .toLowerCase()
    );
}

export default function CanaisCaptacaoClient({
    podeGerenciarInicial,
}: {
    podeGerenciarInicial: boolean;
}) {
    const [canais, setCanais] =
        useState<Canal[]>([]);

    const [resumo, setResumo] =
        useState<Resumo>({
            total: 0,
            ativos: 0,
            inativos: 0,
            padrao: null,
        });

    const [
        tiposDisponiveis,
        setTiposDisponiveis,
    ] = useState<string[]>([]);

    const [
        podeGerenciar,
        setPodeGerenciar,
    ] = useState(
        podeGerenciarInicial
    );

    const [busca, setBusca] =
        useState("");

    const [filtroTipo, setFiltroTipo] =
        useState("");

    const [filtroAtivo, setFiltroAtivo] =
        useState("");

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [
        canalEmProcessamento,
        setCanalEmProcessamento,
    ] = useState<number | null>(null);

    const [erro, setErro] =
        useState("");

    const [sucesso, setSucesso] =
        useState("");

    const [modalAberto, setModalAberto] =
        useState(false);

    const [canalEditando, setCanalEditando] =
        useState<Canal | null>(null);

    const [formulario, setFormulario] =
        useState<FormularioCanal>(
            FORMULARIO_INICIAL
        );

    const carregarCanais =
        useCallback(async () => {
            try {
                setCarregando(true);
                setErro("");

                const query =
                    new URLSearchParams();

                if (busca.trim()) {
                    query.set(
                        "busca",
                        busca.trim()
                    );
                }

                if (filtroTipo) {
                    query.set(
                        "tipo",
                        filtroTipo
                    );
                }

                if (filtroAtivo) {
                    query.set(
                        "ativo",
                        filtroAtivo
                    );
                }

                const url =
                    query.toString()
                        ? `/api/admin/comercial/captacao/canais?${query.toString()}`
                        : "/api/admin/comercial/captacao/canais";

                const res = await fetch(url, {
                    cache: "no-store",
                    credentials: "include",
                });

                const data =
                    (await res
                        .json()
                        .catch(() => null)) as
                    | RespostaLista
                    | null;

                if (!res.ok) {
                    throw new Error(
                        data?.error ||
                        "Não foi possível carregar os canais."
                    );
                }

                setCanais(
                    Array.isArray(data?.canais)
                        ? data!.canais!
                        : []
                );

                if (data?.resumo) {
                    setResumo(data.resumo);
                }

                setTiposDisponiveis(
                    Array.isArray(
                        data?.tiposDisponiveis
                    )
                        ? data!.tiposDisponiveis!
                        : []
                );

                if (
                    typeof data?.permissoes
                        ?.podeGerenciar ===
                    "boolean"
                ) {
                    setPodeGerenciar(
                        data.permissoes
                            .podeGerenciar
                    );
                }
            } catch (error) {
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar os canais."
                );
            } finally {
                setCarregando(false);
            }
        }, [
            busca,
            filtroAtivo,
            filtroTipo,
        ]);

    useEffect(() => {
        const timer = window.setTimeout(
            () => {
                carregarCanais();
            },
            250
        );

        return () =>
            window.clearTimeout(timer);
    }, [carregarCanais]);

    function abrirNovoCanal() {
        setCanalEditando(null);

        setFormulario({
            ...FORMULARIO_INICIAL,
        });

        setErro("");
        setSucesso("");
        setModalAberto(true);
    }

    function abrirEdicao(
        canal: Canal
    ) {
        setCanalEditando(canal);

        setFormulario({
            nome: canal.nome,
            slug: canal.slug,
            descricao:
                canal.descricao ?? "",
            tipo: canal.tipo,
            cor:
                canal.cor ?? "#64748B",
            icone:
                canal.icone ?? "📡",
            padrao: canal.padrao,
            ativo: canal.ativo,
        });

        setErro("");
        setSucesso("");
        setModalAberto(true);
    }

    function fecharModal() {
        if (salvando) return;

        setModalAberto(false);
        setCanalEditando(null);
    }

    async function salvarCanal(
        event: FormEvent
    ) {
        event.preventDefault();

        try {
            setSalvando(true);
            setErro("");
            setSucesso("");

            const editando =
                Boolean(canalEditando);

            const url =
                canalEditando
                    ? `/api/admin/comercial/captacao/canais/${canalEditando.id}`
                    : "/api/admin/comercial/captacao/canais";

            const res = await fetch(url, {
                method:
                    editando
                        ? "PATCH"
                        : "POST",

                credentials: "include",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    nome:
                        formulario.nome,
                    slug:
                        formulario.slug ||
                        undefined,
                    descricao:
                        formulario.descricao,
                    tipo:
                        formulario.tipo,
                    cor:
                        formulario.cor,
                    icone:
                        formulario.icone,
                    padrao:
                        formulario.padrao,
                    ativo:
                        formulario.ativo,
                }),
            });

            const data =
                await res
                    .json()
                    .catch(() => null);

            if (!res.ok) {
                throw new Error(
                    data?.error ||
                    "Não foi possível salvar o canal."
                );
            }

            setSucesso(
                editando
                    ? "Canal atualizado com sucesso."
                    : "Canal criado com sucesso."
            );

            setModalAberto(false);
            setCanalEditando(null);

            await carregarCanais();
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível salvar o canal."
            );
        } finally {
            setSalvando(false);
        }
    }

    async function atualizarCanal(
        canal: Canal,
        alteracoes: Record<
            string,
            unknown
        >,
        mensagem: string
    ) {
        try {
            setCanalEmProcessamento(
                canal.id
            );

            setErro("");
            setSucesso("");

            const res = await fetch(
                `/api/admin/comercial/captacao/canais/${canal.id}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        alteracoes
                    ),
                }
            );

            const data =
                await res
                    .json()
                    .catch(() => null);

            if (!res.ok) {
                throw new Error(
                    data?.error ||
                    "Não foi possível atualizar o canal."
                );
            }

            setSucesso(mensagem);

            await carregarCanais();
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível atualizar o canal."
            );
        } finally {
            setCanalEmProcessamento(
                null
            );
        }
    }

    return (
        <div className="phanyx-captacao-canais-page mx-auto w-full max-w-7xl space-y-6">
            <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/admin/comercial/captacao"
                            className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            ← Central de Captação
                        </Link>

                        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                            Canais de captação
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Configure as origens pelas
                            quais os leads entram no
                            PHANYX.
                        </p>
                    </div>

                    {podeGerenciar && (
                        <button
                            type="button"
                            onClick={abrirNovoCanal}
                            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            + Novo canal
                        </button>
                    )}
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500">
                        Total
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                        {resumo.total}
                    </p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500">
                        Ativos
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                        {resumo.ativos}
                    </p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500">
                        Inativos
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                        {resumo.inativos}
                    </p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-500">
                        Canal padrão
                    </p>
                    <p className="mt-2 truncate text-lg font-black text-slate-950 dark:text-white">
                        {resumo.padrao?.nome ??
                            "Não definido"}
                    </p>
                </article>
            </section>

            {(erro || sucesso) && (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${erro
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                >
                    {erro || sucesso}
                </div>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
                    <input
                        value={busca}
                        onChange={(e) =>
                            setBusca(
                                e.target.value
                            )
                        }
                        placeholder="Buscar por nome, descrição ou identificador..."
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />

                    <select
                        value={filtroTipo}
                        onChange={(e) =>
                            setFiltroTipo(
                                e.target.value
                            )
                        }
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                        <option value="">
                            Todos os tipos
                        </option>

                        {tiposDisponiveis.map(
                            (tipo) => (
                                <option
                                    key={tipo}
                                    value={tipo}
                                >
                                    {labelTipo(tipo)}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={filtroAtivo}
                        onChange={(e) =>
                            setFiltroAtivo(
                                e.target.value
                            )
                        }
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
            </section>

            <section className="space-y-3">
                {carregando ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        Carregando canais...
                    </div>
                ) : canais.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-3xl">
                            📡
                        </p>

                        <h2 className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                            Nenhum canal encontrado
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Cadastre a primeira origem
                            de leads da instituição.
                        </p>
                    </div>
                ) : (
                    canais.map((canal) => (
                        <article
                            key={canal.id}
                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                        >
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex min-w-0 gap-4">
                                    <div
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                                        style={{
                                            backgroundColor:
                                                `${canal.cor || "#64748B"}18`,
                                            border:
                                                `1px solid ${canal.cor || "#64748B"}40`,
                                        }}
                                    >
                                        {canal.icone ||
                                            "📡"}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-black text-slate-950 dark:text-white">
                                                {canal.nome}
                                            </h2>

                                            {canal.padrao && (
                                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    Padrão
                                                </span>
                                            )}

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${canal.ativo
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                    }`}
                                            >
                                                {canal.ativo
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                            {labelTipo(
                                                canal.tipo
                                            )}{" "}
                                            · {canal.slug}
                                        </p>

                                        {canal.descricao && (
                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                {
                                                    canal.descricao
                                                }
                                            </p>
                                        )}

                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span>
                                                {
                                                    canal._count
                                                        .campanhas
                                                }{" "}
                                                campanhas
                                            </span>
                                            <span>
                                                {
                                                    canal._count
                                                        .formularios
                                                }{" "}
                                                formulários
                                            </span>
                                            <span>
                                                {
                                                    canal._count
                                                        .submissoes
                                                }{" "}
                                                submissões
                                            </span>
                                            <span>
                                                {
                                                    canal._count
                                                        .integracoes
                                                }{" "}
                                                integrações
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {podeGerenciar && (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                abrirEdicao(
                                                    canal
                                                )
                                            }
                                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                                        >
                                            Editar
                                        </button>

                                        {!canal.padrao &&
                                            canal.ativo && (
                                                <button
                                                    type="button"
                                                    disabled={
                                                        canalEmProcessamento ===
                                                        canal.id
                                                    }
                                                    onClick={() =>
                                                        atualizarCanal(
                                                            canal,
                                                            {
                                                                padrao:
                                                                    true,
                                                            },
                                                            `"${canal.nome}" definido como canal padrão.`
                                                        )
                                                    }
                                                    className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900 dark:text-blue-300"
                                                >
                                                    Definir padrão
                                                </button>
                                            )}

                                        <button
                                            type="button"
                                            disabled={
                                                canalEmProcessamento ===
                                                canal.id
                                            }
                                            onClick={() =>
                                                atualizarCanal(
                                                    canal,
                                                    {
                                                        ativo:
                                                            !canal.ativo,
                                                    },
                                                    canal.ativo
                                                        ? `"${canal.nome}" foi desativado.`
                                                        : `"${canal.nome}" foi ativado.`
                                                )
                                            }
                                            className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${canal.ativo
                                                ? "border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300"
                                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                }`}
                                        >
                                            {canal.ativo
                                                ? "Desativar"
                                                : "Ativar"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))
                )}
            </section>

            {modalAberto && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">
                                {canalEditando
                                    ? "Editar canal"
                                    : "Novo canal de captação"}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Configure como essa origem
                                será identificada na
                                Central de Captação.
                            </p>
                        </div>

                        <form
                            onSubmit={salvarCanal}
                            className="space-y-5 p-6"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        Nome *
                                    </span>

                                    <input
                                        required
                                        maxLength={150}
                                        value={
                                            formulario.nome
                                        }
                                        onChange={(e) =>
                                            setFormulario(
                                                (atual) => ({
                                                    ...atual,
                                                    nome:
                                                        e.target
                                                            .value,
                                                })
                                            )
                                        }
                                        placeholder="Ex.: Site institucional"
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        Tipo *
                                    </span>

                                    <select
                                        required
                                        value={
                                            formulario.tipo
                                        }
                                        onChange={(e) => {
                                            const novoTipo =
                                                e.target.value;

                                            setFormulario(
                                                (atual) => ({
                                                    ...atual,
                                                    tipo: novoTipo,
                                                    icone:
                                                        ICONE_POR_TIPO[
                                                        novoTipo
                                                        ] || "📡",
                                                })
                                            );
                                        }}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        {(tiposDisponiveis
                                            .length
                                            ? tiposDisponiveis
                                            : Object.keys(
                                                LABELS_TIPO
                                            )
                                        ).map((tipo) => (
                                            <option
                                                key={tipo}
                                                value={tipo}
                                            >
                                                {labelTipo(
                                                    tipo
                                                )}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Identificador
                                </span>

                                <input
                                    value={
                                        formulario.slug
                                    }
                                    onChange={(e) =>
                                        setFormulario(
                                            (atual) => ({
                                                ...atual,
                                                slug:
                                                    e.target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Gerado automaticamente pelo nome"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Descrição
                                </span>

                                <textarea
                                    maxLength={3000}
                                    rows={4}
                                    value={
                                        formulario.descricao
                                    }
                                    onChange={(e) =>
                                        setFormulario(
                                            (atual) => ({
                                                ...atual,
                                                descricao:
                                                    e.target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Descreva a origem e quando ela é utilizada."
                                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </label>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        Ícone
                                    </span>

                                    <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                                            {ICONES_CANAL.map((icone) => {
                                                const selecionado =
                                                    formulario.icone ===
                                                    icone.valor;

                                                return (
                                                    <button
                                                        key={icone.valor}
                                                        type="button"
                                                        title={icone.nome}
                                                        aria-label={
                                                            `Selecionar ícone ${icone.nome}`
                                                        }
                                                        aria-pressed={selecionado}
                                                        onClick={() =>
                                                            setFormulario(
                                                                (atual) => ({
                                                                    ...atual,
                                                                    icone:
                                                                        icone.valor,
                                                                })
                                                            )
                                                        }
                                                        className={`flex h-12 items-center justify-center rounded-xl border text-2xl transition ${selecionado
                                                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950/40"
                                                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                                                            }`}
                                                    >
                                                        {icone.valor}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                            <span>Selecionado:</span>

                                            <span className="text-xl">
                                                {formulario.icone || "📡"}
                                            </span>

                                            <span>
                                                Clique em uma opção acima para alterar.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        Cor
                                    </span>

                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={
                                                formulario.cor
                                            }
                                            onChange={(e) =>
                                                setFormulario(
                                                    (atual) => ({
                                                        ...atual,
                                                        cor:
                                                            e.target
                                                                .value
                                                                .toUpperCase(),
                                                    })
                                                )
                                            }
                                            className="h-12 w-14 rounded-xl border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                                        />

                                        <input
                                            value={
                                                formulario.cor
                                            }
                                            onChange={(e) =>
                                                setFormulario(
                                                    (atual) => ({
                                                        ...atual,
                                                        cor:
                                                            e.target
                                                                .value,
                                                    })
                                                )
                                            }
                                            maxLength={7}
                                            placeholder="#64748B"
                                            className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={
                                            formulario.padrao
                                        }
                                        onChange={(e) =>
                                            setFormulario(
                                                (atual) => ({
                                                    ...atual,
                                                    padrao:
                                                        e.target
                                                            .checked,
                                                    ativo:
                                                        e.target
                                                            .checked
                                                            ? true
                                                            : atual.ativo,
                                                })
                                            )
                                        }
                                        className="mt-1 h-4 w-4"
                                    />

                                    <span>
                                        <strong className="block text-sm text-slate-950 dark:text-white">
                                            Canal padrão
                                        </strong>

                                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                                            Será usado quando
                                            nenhuma origem mais
                                            específica for
                                            informada.
                                        </span>
                                    </span>
                                </label>

                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={
                                            formulario.ativo
                                        }
                                        disabled={
                                            formulario.padrao
                                        }
                                        onChange={(e) =>
                                            setFormulario(
                                                (atual) => ({
                                                    ...atual,
                                                    ativo:
                                                        e.target
                                                            .checked,
                                                    padrao:
                                                        !e.target
                                                            .checked
                                                            ? false
                                                            : atual.padrao,
                                                })
                                            )
                                        }
                                        className="mt-1 h-4 w-4"
                                    />

                                    <span>
                                        <strong className="block text-sm text-slate-950 dark:text-white">
                                            Canal ativo
                                        </strong>

                                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                                            Canais inativos
                                            permanecem no
                                            histórico, mas não
                                            devem receber novas
                                            entradas.
                                        </span>
                                    </span>
                                </label>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                    className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando ||
                                        !formulario.nome.trim()
                                    }
                                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {salvando
                                        ? "Salvando..."
                                        : canalEditando
                                            ? "Salvar alterações"
                                            : "Criar canal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}