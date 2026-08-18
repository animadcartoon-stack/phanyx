"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Link from "next/link";

type Estrategia =
    | "RODIZIO"
    | "MENOR_CARGA"
    | "ALEATORIA"
    | "RESPONSAVEL_FIXO"
    | "EQUIPE_SEM_RESPONSAVEL"
    | "MANUAL";

type Referencia = {
    id: number;
    nome: string;
};

type Regra = {
    id: number;

    nome: string;
    descricao?: string | null;

    estrategia: Estrategia;

    ordemPrioridade: number;

    maximoLeadsAbertosPorResponsavel?:
        number | null;

    somenteMembrosAtivos: boolean;
    respeitarDisponibilidade: boolean;

    ativo: boolean;

    canal?: Referencia | null;
    campanha?: Referencia | null;

    formulario?: {
        id: number;
        nome: string;
        titulo?: string | null;
    } | null;

    curso?: Referencia | null;
    polo?: Referencia | null;

    equipe?: Referencia | null;

    responsavelFixo?: {
        id: number;
        nome: string;
        cargo?: string | null;
    } | null;

    criadoEm?: string;
    atualizadoEm?: string;
};

type RespostaDistribuicao = {
    success: true;

    permissoes: {
        podeVer: boolean;
        podeGerenciar: boolean;
    };

    estrategiasDisponiveis:
        Estrategia[];

    resumo: {
        total: number;
        ativas: number;
        inativas: number;
    };

    referencias: {
        canais: Referencia[];

        campanhas: Referencia[];

        formularios: {
            id: number;
            nome: string;
            titulo?: string | null;
        }[];

        equipes: Referencia[];

        responsaveis: {
            id: number;
            nome: string;
            cargo?: string | null;
        }[];

        cursos: Referencia[];
        polos: Referencia[];
    };

    regras: Regra[];
};

type RespostaErro = {
    success?: false;
    error?: string;
    codigo?: string;
};

function nomeEstrategia(
    estrategia: Estrategia
) {
    switch (estrategia) {
        case "RODIZIO":
            return "Revezamento entre a equipe";

        case "MENOR_CARGA":
            return "Quem tem menos leads";

        case "ALEATORIA":
            return "Distribuição aleatória";

        case "RESPONSAVEL_FIXO":
            return "Pessoa específica";

        case "EQUIPE_SEM_RESPONSAVEL":
            return "Encaminhar para a equipe";

        case "MANUAL":
            return "Distribuição manual";

        default:
            return "Distribuição automática";
    }
}

function descricaoEstrategia(
    estrategia: Estrategia
) {
    switch (estrategia) {
        case "RODIZIO":
            return "O PHANYX alterna os novos interessados entre os membros da equipe.";

        case "MENOR_CARGA":
            return "O PHANYX direciona o novo interessado para quem está com menos leads em atendimento.";

        case "ALEATORIA":
            return "Os novos interessados são distribuídos aleatoriamente entre os membros disponíveis.";

        case "RESPONSAVEL_FIXO":
            return "Todos os leads desta regra são direcionados para a mesma pessoa.";

        case "EQUIPE_SEM_RESPONSAVEL":
            return "O lead entra na equipe e pode ser assumido posteriormente por um integrante.";

        case "MANUAL":
            return "O lead fica disponível para que o responsável seja definido manualmente.";

        default:
            return "";
    }
}

function destinoRegra(
    regra: Regra
) {
    if (
        regra.estrategia ===
            "RESPONSAVEL_FIXO" &&
        regra.responsavelFixo
    ) {
        return regra
            .responsavelFixo.nome;
    }

    if (regra.equipe) {
        return regra.equipe.nome;
    }

    return "Sem destino específico";
}

function criteriosRegra(
    regra: Regra
) {
    const criterios: string[] =
        [];

    if (regra.canal?.nome) {
        criterios.push(
            `Canal: ${regra.canal.nome}`
        );
    }

    if (regra.campanha?.nome) {
        criterios.push(
            `Campanha: ${regra.campanha.nome}`
        );
    }

    if (regra.formulario) {
        criterios.push(
            `Formulário: ${
                regra.formulario
                    .titulo ||
                regra.formulario.nome
            }`
        );
    }

    if (regra.curso?.nome) {
        criterios.push(
            `Curso: ${regra.curso.nome}`
        );
    }

    if (regra.polo?.nome) {
        criterios.push(
            `Unidade: ${regra.polo.nome}`
        );
    }

    return criterios;
}

export default function DistribuicaoCaptacaoPage() {
    const [
        dados,
        setDados,
    ] =
        useState<RespostaDistribuicao | null>(
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
    ] = useState("");

    const [
        busca,
        setBusca,
    ] = useState("");

    const [
        somenteAtivas,
        setSomenteAtivas,
    ] =
        useState(false);

    const carregar =
        useCallback(
            async (
                silencioso = false
            ) => {
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
                            "/api/admin/comercial/captacao/distribuicao",
                            {
                                cache:
                                    "no-store",
                            }
                        );

                    const json =
                        (await resposta
                            .json()
                            .catch(
                                () =>
                                    null
                            )) as
                            | RespostaDistribuicao
                            | RespostaErro
                            | null;

                    if (
                        !resposta.ok ||
                        !json ||
                        json.success !==
                            true
                    ) {
                        throw new Error(
                            json &&
                                "error" in
                                    json
                                ? json.error ||
                                      "Não foi possível carregar as regras."
                                : "Não foi possível carregar as regras."
                        );
                    }

                    setDados(json);
                } catch (error) {
                    setErro(
                        error instanceof
                            Error
                            ? error.message
                            : "Não foi possível carregar as regras de distribuição."
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

    const regrasFiltradas =
        useMemo(() => {
            if (!dados) {
                return [];
            }

            const termo =
                busca
                    .trim()
                    .toLocaleLowerCase(
                        "pt-BR"
                    );

            return dados.regras.filter(
                (regra) => {
                    if (
                        somenteAtivas &&
                        !regra.ativo
                    ) {
                        return false;
                    }

                    if (!termo) {
                        return true;
                    }

                    const texto = [
                        regra.nome,
                        regra.descricao,
                        regra.canal?.nome,
                        regra.campanha
                            ?.nome,
                        regra.formulario
                            ?.titulo,
                        regra.formulario
                            ?.nome,
                        regra.curso?.nome,
                        regra.polo?.nome,
                        regra.equipe
                            ?.nome,
                        regra
                            .responsavelFixo
                            ?.nome,
                        nomeEstrategia(
                            regra.estrategia
                        ),
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLocaleLowerCase(
                            "pt-BR"
                        );

                    return texto.includes(
                        termo
                    );
                }
            );
        }, [
            busca,
            dados,
            somenteAtivas,
        ]);

    if (carregando) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
                <div className="mx-auto max-w-7xl">
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">
                                🔄
                            </span>

                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Carregando
                                regras de
                                distribuição...
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Link
                                href="/admin/comercial/captacao"
                                className="text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                ← Central
                                de Captação
                            </Link>

                            <div className="mt-3 flex items-center gap-3">
                                <span
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800"
                                    aria-hidden="true"
                                >
                                    🔄
                                </span>

                                <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                                    Distribuição
                                    de leads
                                </h1>
                            </div>

                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                                Defina
                                automaticamente
                                quem deve
                                receber cada
                                novo
                                interessado.
                                O PHANYX
                                verifica as
                                regras assim
                                que o lead
                                entra na
                                Central de
                                Captação.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
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
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {atualizando
                                    ? "Atualizando..."
                                    : "↻ Atualizar"}
                            </button>

                            {dados
                                ?.permissoes
                                .podeGerenciar && (
                                <button
                                    type="button"
                                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    + Nova
                                    regra
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {erro && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        {erro}
                    </div>
                )}

                {dados && (
                    <>
                        <section className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Total
                                </p>

                                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                                    {
                                        dados
                                            .resumo
                                            .total
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Regras
                                    cadastradas
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Ativas
                                </p>

                                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                                    {
                                        dados
                                            .resumo
                                            .ativas
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Distribuindo
                                    novos
                                    leads
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Inativas
                                </p>

                                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                                    {
                                        dados
                                            .resumo
                                            .inativas
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Temporariamente
                                    pausadas
                                </p>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Buscar
                                    </label>

                                    <input
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
                                        placeholder="Nome, campanha, curso, equipe..."
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                                    />
                                </div>

                                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={
                                            somenteAtivas
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSomenteAtivas(
                                                event
                                                    .target
                                                    .checked
                                            )
                                        }
                                        className="h-4 w-4"
                                    />

                                    Mostrar
                                    somente
                                    regras
                                    ativas
                                </label>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                                    Regras
                                    cadastradas
                                </h2>

                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    {
                                        regrasFiltradas.length
                                    }{" "}
                                    {regrasFiltradas.length ===
                                    1
                                        ? "regra encontrada"
                                        : "regras encontradas"}
                                    .
                                </p>
                            </div>

                            {regrasFiltradas.length ===
                            0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                                        🔄
                                    </div>

                                    <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
                                        Nenhuma
                                        regra
                                        encontrada
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                                        Crie
                                        uma
                                        regra
                                        para o
                                        PHANYX
                                        distribuir
                                        automaticamente
                                        os
                                        próximos
                                        interessados.
                                    </p>

                                    {dados
                                        .permissoes
                                        .podeGerenciar && (
                                        <button
                                            type="button"
                                            className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                        >
                                            +
                                            Criar
                                            primeira
                                            regra
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {regrasFiltradas.map(
                                        (
                                            regra
                                        ) => {
                                            const criterios =
                                                criteriosRegra(
                                                    regra
                                                );

                                            return (
                                                <article
                                                    key={
                                                        regra.id
                                                    }
                                                    className="p-5"
                                                >
                                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                                                    {
                                                                        regra.nome
                                                                    }
                                                                </h3>

                                                                <span
                                                                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                                        regra.ativo
                                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                                            : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                                    }`}
                                                                >
                                                                    {regra.ativo
                                                                        ? "Ativa"
                                                                        : "Inativa"}
                                                                </span>
                                                            </div>

                                                            {regra.descricao && (
                                                                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                                    {
                                                                        regra.descricao
                                                                    }
                                                                </p>
                                                            )}

                                                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                                                        Como
                                                                        distribuir
                                                                    </p>

                                                                    <p className="mt-1 font-bold text-slate-950 dark:text-white">
                                                                        {nomeEstrategia(
                                                                            regra.estrategia
                                                                        )}
                                                                    </p>

                                                                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                                                                        {descricaoEstrategia(
                                                                            regra.estrategia
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                                                        Destino
                                                                    </p>

                                                                    <p className="mt-1 font-bold text-slate-950 dark:text-white">
                                                                        {destinoRegra(
                                                                            regra
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4">
                                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                                                    Quando
                                                                    esta
                                                                    regra
                                                                    se
                                                                    aplica
                                                                </p>

                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {criterios.length >
                                                                    0 ? (
                                                                        criterios.map(
                                                                            (
                                                                                criterio
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        criterio
                                                                                    }
                                                                                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                                                >
                                                                                    {
                                                                                        criterio
                                                                                    }
                                                                                </span>
                                                                            )
                                                                        )
                                                                    ) : (
                                                                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                                                            Todos
                                                                            os
                                                                            novos
                                                                            leads
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {dados
                                                            .permissoes
                                                            .podeGerenciar && (
                                                            <button
                                                                type="button"
                                                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                                            >
                                                                Editar
                                                            </button>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}