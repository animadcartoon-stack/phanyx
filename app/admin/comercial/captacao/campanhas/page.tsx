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

type Campanha = {
    id: number;

    nome: string;
    codigo: string;
    descricao: string | null;

    status: string;
    ativo: boolean;

    dataInicio: string | null;
    dataFim: string | null;

    orcamento:
    | string
    | number
    | null;

    moeda: string;

    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    utmTerm: string | null;

    urlDestino: string | null;
    observacoes: string | null;

    criadoEm: string;
    atualizadoEm: string;

    canal: {
        id: number;
        nome: string;
        tipo: string;
        cor: string;
        ativo: boolean;
    } | null;

    _count: {
        formularios: number;
        submissoes: number;
        regrasDistribuicao: number;
        integracoes: number;
    };
};

type RespostaCampanhas = {
    success: true;

    permissoes: {
        podeVer: boolean;
        podeGerenciar: boolean;
    };

    statusDisponiveis:
    string[];

    referencias: {
        canais:
        CanalReferencia[];
    };

    resumo: {
        total: number;
        ativas: number;
        agendadas: number;
        pausadas: number;
    };

    campanhas:
    Campanha[];
};

type RespostaErro = {
    success?: false;
    error?: string;
    codigo?: string;
};

type FormularioCampanha = {
    canalId: string;

    nome: string;
    codigo: string;
    descricao: string;

    status: string;
    ativo: boolean;

    dataInicio: string;
    dataFim: string;

    orcamento: string;
    moeda: string;

    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;

    urlDestino: string;
    observacoes: string;
};

const FORMULARIO_INICIAL:
    FormularioCampanha = {
    canalId: "",

    nome: "",
    codigo: "",
    descricao: "",

    status: "RASCUNHO",
    ativo: true,

    dataInicio: "",
    dataFim: "",

    orcamento: "",
    moeda: "BRL",

    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",

    urlDestino: "",
    observacoes: "",
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

function formatarMoeda(
    valor:
        | string
        | number
        | null,
    moeda = "BRL"
) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return "—";
    }

    const numero =
        Number(valor);

    if (
        !Number.isFinite(numero)
    ) {
        return String(valor);
    }

    try {
        return new Intl.NumberFormat(
            "pt-BR",
            {
                style: "currency",
                currency:
                    moeda || "BRL",
            }
        ).format(numero);
    } catch {
        return `${moeda} ${numero.toFixed(
            2
        )}`;
    }
}

function formatarData(
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
        }
    ).format(data);
}

function dataParaInput(
    valor:
        | string
        | null
        | undefined
) {
    if (!valor) {
        return "";
    }

    return valor.slice(
        0,
        10
    );
}

function prepararDataEnvio(
    valor: string
) {
    if (!valor) {
        return null;
    }

    return `${valor}T12:00:00-03:00`;
}

function nomeStatus(
    status: string
) {
    const mapa:
        Record<
            string,
            string
        > = {
        RASCUNHO:
            "Rascunho",

        AGENDADA:
            "Agendada",

        ATIVA:
            "Ativa",

        PAUSADA:
            "Pausada",

        ENCERRADA:
            "Encerrada",

        ARQUIVADA:
            "Arquivada",
    };

    return (
        mapa[status] ??
        status
    );
}

function descricaoStatusCampanha(
    status: string
) {
    const mapa:
        Record<string, string> = {
        RASCUNHO:
            "A campanha está sendo preparada e ainda não está em execução.",

        AGENDADA:
            "A campanha está programada para execução no período definido.",

        ATIVA:
            "A campanha está em execução e pode receber novas captações.",

        PAUSADA:
            "A campanha foi interrompida temporariamente e poderá ser retomada.",

        ENCERRADA:
            "A campanha foi finalizada e permanece disponível apenas para histórico e análise.",

        ARQUIVADA:
            "A campanha foi arquivada e permanece preservada no histórico.",
    };

    return (
        mapa[status] ??
        "Situação atual da campanha."
    );
}

function normalizarUtm(
    valor: string
) {
    return valor
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        );
}

function utmSourcePorTipoCanal(
    tipo: string
) {
    const mapa:
        Record<string, string> = {
        SITE:
            "site",

        LANDING_PAGE:
            "landing_page",

        FORMULARIO:
            "formulario",

        META_ADS:
            "facebook",

        GOOGLE_ADS:
            "google",

        WHATSAPP:
            "whatsapp",

        INDICACAO:
            "indicacao",

        EVENTO:
            "evento",

        PARCERIA:
            "parceria",

        IMPORTACAO:
            "importacao",

        API:
            "api",

        OUTRO:
            "outro",
    };

    return (
        mapa[tipo] ??
        normalizarUtm(tipo)
    );
}

function classesStatus(
    status: string,
    temaEscuro: boolean
) {
    if (
        status === "ATIVA"
    ) {
        return temaEscuro
            ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (
        status ===
        "AGENDADA"
    ) {
        return temaEscuro
            ? "border-blue-800 bg-blue-950/60 text-blue-300"
            : "border-blue-200 bg-blue-50 text-blue-700";
    }

    if (
        status ===
        "PAUSADA"
    ) {
        return temaEscuro
            ? "border-amber-800 bg-amber-950/60 text-amber-300"
            : "border-amber-200 bg-amber-50 text-amber-800";
    }

    if (
        status ===
        "ENCERRADA" ||
        status ===
        "ARQUIVADA"
    ) {
        return temaEscuro
            ? "border-slate-700 bg-slate-800 text-slate-300"
            : "border-slate-200 bg-slate-100 text-slate-600";
    }

    return temaEscuro
        ? "border-violet-800 bg-violet-950/60 text-violet-300"
        : "border-violet-200 bg-violet-50 text-violet-700";
}

export default function CampanhasCaptacaoPage() {
    const [
        temaEscuro,
        setTemaEscuro,
    ] = useState(false);

    const [
        dados,
        setDados,
    ] =
        useState<RespostaCampanhas | null>(
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
        modalAberto,
        setModalAberto,
    ] =
        useState(false);

    const [
        campanhaEditando,
        setCampanhaEditando,
    ] =
        useState<Campanha | null>(
            null
        );

    const [
        formulario,
        setFormulario,
    ] =
        useState<FormularioCampanha>(
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

    const [
        rastreamentoAberto,
        setRastreamentoAberto,
    ] = useState(false);

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
            setTimeout(
                () => {
                    setToast(null);
                },
                3500
            );

        return () =>
            clearTimeout(timer);
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
                        busca;

                    const canalAtual =
                        opcoes?.canalId ??
                        canalFiltro;

                    const statusAtual =
                        opcoes?.status ??
                        statusFiltro;

                    const ativoAtual =
                        opcoes?.ativo ??
                        ativoFiltro;

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
                            `/api/admin/comercial/captacao/campanhas${query
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
                        | RespostaCampanhas
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
                            "Não foi possível carregar as campanhas."
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
                            : "Não foi possível carregar as campanhas."
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
                busca,
                canalFiltro,
                statusFiltro,
                ativoFiltro,
            ]
        );

    useEffect(() => {
        void carregar({
            busca: "",
            canalId: "",
            status: "",
            ativo: "",
        });
    }, []);

    function abrirNovaCampanha() {
        const canalPadrao =
            dados
                ?.referencias
                .canais
                .find(
                    (canal) =>
                        canal.padrao
                );

        setCampanhaEditando(
            null
        );

        setFormulario({
            ...FORMULARIO_INICIAL,

            canalId:
                canalPadrao
                    ? String(
                        canalPadrao.id
                    )
                    : "",

            utmSource:
                canalPadrao
                    ? utmSourcePorTipoCanal(
                        canalPadrao.tipo
                    )
                    : "",
        });

        setErroFormulario(
            ""
        );

        setRastreamentoAberto(
            false
        );

        setModalAberto(
            true
        );
    }

    function abrirEditarCampanha(
        campanha: Campanha
    ) {
        setCampanhaEditando(
            campanha
        );

        setFormulario({
            canalId:
                campanha.canal
                    ? String(
                        campanha.canal.id
                    )
                    : "",

            nome:
                campanha.nome,

            codigo:
                campanha.codigo,

            descricao:
                campanha.descricao ??
                "",

            status:
                campanha.status,

            ativo:
                campanha.ativo,

            dataInicio:
                dataParaInput(
                    campanha.dataInicio
                ),

            dataFim:
                dataParaInput(
                    campanha.dataFim
                ),

            orcamento:
                campanha.orcamento !==
                    null &&
                    campanha.orcamento !==
                    undefined
                    ? String(
                        campanha.orcamento
                    )
                    : "",

            moeda:
                campanha.moeda ||
                "BRL",

            utmSource:
                campanha.utmSource ??
                "",

            utmMedium:
                campanha.utmMedium ??
                "",

            utmCampaign:
                campanha.utmCampaign ??
                "",

            utmContent:
                campanha.utmContent ??
                "",

            utmTerm:
                campanha.utmTerm ??
                "",

            urlDestino:
                campanha.urlDestino ??
                "",

            observacoes:
                campanha.observacoes ??
                "",
        });

        /*
         * Se a campanha já possui algum
         * rastreamento, abrimos o bloco
         * automaticamente na edição.
         */
        setRastreamentoAberto(
            Boolean(
                campanha.utmSource ||
                campanha.utmMedium ||
                campanha.utmCampaign ||
                campanha.utmContent ||
                campanha.utmTerm
            )
        );

        setErroFormulario(
            ""
        );

        setModalAberto(
            true
        );
    }

    function fecharModal() {
        if (salvando) {
            return;
        }

        setModalAberto(
            false
        );

        setCampanhaEditando(
            null
        );

        setErroFormulario(
            ""
        );
    }

    function atualizarFormulario<
        K extends keyof FormularioCampanha
    >(
        campo: K,
        valor:
            FormularioCampanha[K]
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

    async function salvarCampanha(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const nome =
            formulario
                .nome
                .trim();

        if (!nome) {
            setErroFormulario(
                "Informe o nome da campanha."
            );

            return;
        }

        if (
            formulario.dataInicio &&
            formulario.dataFim &&
            formulario.dataFim <
            formulario.dataInicio
        ) {
            setErroFormulario(
                "A data final não pode ser anterior à data inicial."
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

            const editando =
                campanhaEditando !==
                null;

            const url =
                campanhaEditando
                    ? `/api/admin/comercial/captacao/campanhas/${campanhaEditando.id}`
                    : "/api/admin/comercial/captacao/campanhas";

            const resposta =
                await fetch(
                    url,
                    {
                        method:
                            editando
                                ? "PATCH"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                nome,

                                codigo:
                                    formulario
                                        .codigo
                                        .trim() ||
                                    (
                                        editando
                                            ? campanhaEditando
                                                ?.codigo
                                            : null
                                    ),

                                canalId:
                                    formulario
                                        .canalId
                                        ? Number(
                                            formulario
                                                .canalId
                                        )
                                        : null,

                                descricao:
                                    formulario
                                        .descricao
                                        .trim() ||
                                    null,

                                status:
                                    formulario.status,

                                ativo:
                                    formulario.ativo,

                                dataInicio:
                                    prepararDataEnvio(
                                        formulario
                                            .dataInicio
                                    ),

                                dataFim:
                                    prepararDataEnvio(
                                        formulario
                                            .dataFim
                                    ),

                                orcamento:
                                    formulario
                                        .orcamento
                                        .trim() ||
                                    null,

                                moeda:
                                    formulario
                                        .moeda
                                        .trim() ||
                                    "BRL",

                                utmSource:
                                    formulario
                                        .utmSource
                                        .trim() ||
                                    null,

                                utmMedium:
                                    formulario
                                        .utmMedium
                                        .trim() ||
                                    null,

                                utmCampaign:
                                    formulario
                                        .utmCampaign
                                        .trim() ||
                                    null,

                                utmContent:
                                    formulario
                                        .utmContent
                                        .trim() ||
                                    null,

                                utmTerm:
                                    formulario
                                        .utmTerm
                                        .trim() ||
                                    null,

                                urlDestino:
                                    formulario
                                        .urlDestino
                                        .trim() ||
                                    null,

                                observacoes:
                                    formulario
                                        .observacoes
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
                json.success !==
                true
            ) {
                throw new Error(
                    json.error ||
                    (
                        editando
                            ? "Não foi possível atualizar a campanha."
                            : "Não foi possível cadastrar a campanha."
                    )
                );
            }

            setModalAberto(
                false
            );

            setCampanhaEditando(
                null
            );

            setToast({
                tipo:
                    "sucesso",

                mensagem:
                    json.message ||
                    (
                        editando
                            ? "Campanha atualizada com sucesso."
                            : "Campanha criada com sucesso."
                    ),
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
                    : "Não foi possível salvar a campanha."
            );
        } finally {
            setSalvando(
                false
            );
        }
    }

    function aplicarFiltros(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        void carregar();
    }

    function limparFiltros() {
        setBusca("");
        setCanalFiltro("");
        setStatusFiltro("");
        setAtivoFiltro("");

        void carregar({
            busca: "",
            canalId: "",
            status: "",
            ativo: "",
        });
    }

    function selecionarCanal(
        valor: string
    ) {
        const canal =
            dados
                ?.referencias
                .canais
                .find(
                    (item) =>
                        String(item.id) ===
                        valor
                );

        setFormulario(
            (atual) => ({
                ...atual,

                canalId:
                    valor,

                /*
                 * Só sugere se o usuário
                 * ainda não preencheu.
                 */
                utmSource:
                    atual.utmSource.trim()
                        ? atual.utmSource
                        : canal
                            ? utmSourcePorTipoCanal(
                                canal.tipo
                            )
                            : "",
            })
        );
    }

    function selecionarStatusCampanha(
        valor: string
    ) {
        setFormulario(
            (atual) => ({
                ...atual,

                status: valor,

                ativo:
                    valor === "ATIVA" ||
                        valor === "AGENDADA" ||
                        valor === "PAUSADA"
                        ? true
                        : valor === "ENCERRADA" ||
                            valor === "ARQUIVADA"
                            ? false
                            : atual.ativo,
            })
        );
    }

    function sugerirIdentificadorCampanha() {
        setFormulario(
            (atual) => {
                if (
                    atual.utmCampaign
                        .trim()
                ) {
                    return atual;
                }

                const base =
                    atual.codigo.trim() ||
                    atual.nome.trim();

                if (!base) {
                    return atual;
                }

                return {
                    ...atual,

                    utmCampaign:
                        normalizarUtm(
                            base
                        ),
                };
            }
        );
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
                        carregar as campanhas
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
                                📣 Campanhas de
                                captação
                            </h1>

                            <p
                                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
                            >
                                Organize campanhas,
                                períodos, orçamento
                                e parâmetros UTM das
                                ações de captação.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    void carregar({
                                        silencioso:
                                            true,
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
                                            abrirNovaCampanha
                                        }
                                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        + Nova campanha
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
                                "Ativas",

                            valor:
                                dados.resumo
                                    .ativas,
                        },

                        {
                            nome:
                                "Agendadas",

                            valor:
                                dados.resumo
                                    .agendadas,
                        },

                        {
                            nome:
                                "Pausadas",

                            valor:
                                dados.resumo
                                    .pausadas,
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
                        className="grid gap-3 xl:grid-cols-[1fr_220px_190px_160px_auto]"
                    >
                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >
                                Buscar
                            </label>

                            <input
                                type="text"
                                value={busca}
                                onChange={(
                                    event
                                ) =>
                                    setBusca(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Nome, código, descrição ou UTM"
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${c.input}`}
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
                                    Ativas
                                </option>

                                <option value="false">
                                    Inativas
                                </option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
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
                            Campanhas cadastradas
                        </h2>

                        <p
                            className={`mt-1 text-sm ${c.muted}`}
                        >
                            {formatarNumero(
                                dados.campanhas
                                    .length
                            )}{" "}
                            resultado
                            {dados.campanhas
                                .length === 1
                                ? ""
                                : "s"}{" "}
                            nesta consulta.
                        </p>
                    </div>

                    {dados.campanhas
                        .length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="text-4xl">
                                📣
                            </div>

                            <p
                                className={`mt-3 font-semibold ${c.titulo}`}
                            >
                                Nenhuma campanha
                                encontrada
                            </p>

                            <p
                                className={`mt-1 text-sm ${c.muted}`}
                            >
                                Cadastre a primeira
                                campanha ou altere os
                                filtros.
                            </p>

                            {dados
                                .permissoes
                                .podeGerenciar && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovaCampanha
                                        }
                                        className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        + Cadastrar
                                        campanha
                                    </button>
                                )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {dados.campanhas.map(
                                (
                                    campanha
                                ) => (
                                    <article
                                        key={
                                            campanha.id
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
                                                            campanha.nome
                                                        }
                                                    </h3>

                                                    <span
                                                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classesStatus(
                                                            campanha.status,
                                                            temaEscuro
                                                        )}`}
                                                    >
                                                        {nomeStatus(
                                                            campanha.status
                                                        )}
                                                    </span>

                                                    {!campanha.ativo && (
                                                        <span
                                                            className={
                                                                temaEscuro
                                                                    ? "rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300"
                                                                    : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                                            }
                                                        >
                                                            Inativa
                                                        </span>
                                                    )}
                                                    {dados
                                                        .permissoes
                                                        .podeGerenciar && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirEditarCampanha(
                                                                        campanha
                                                                    )
                                                                }
                                                                className={`ml-1 rounded-lg border px-3 py-1 text-xs font-semibold transition ${c.botaoSecundario}`}
                                                            >
                                                                ✏️ Editar
                                                            </button>
                                                        )}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                                    <span
                                                        className={`text-sm font-medium ${c.texto}`}
                                                    >
                                                        Código:{" "}
                                                        {
                                                            campanha.codigo
                                                        }
                                                    </span>

                                                    <span
                                                        className={`text-sm ${c.muted}`}
                                                    >
                                                        Canal:{" "}
                                                        {campanha
                                                            .canal
                                                            ?.nome ||
                                                            "Sem canal"}
                                                    </span>
                                                </div>

                                                {campanha.descricao && (
                                                    <p
                                                        className={`mt-3 max-w-3xl text-sm leading-6 ${c.texto}`}
                                                    >
                                                        {
                                                            campanha.descricao
                                                        }
                                                    </p>
                                                )}

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <span
                                                        className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                    >
                                                        📅{" "}
                                                        {formatarData(
                                                            campanha.dataInicio
                                                        )}{" "}
                                                        →{" "}
                                                        {formatarData(
                                                            campanha.dataFim
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                    >
                                                        💰{" "}
                                                        {formatarMoeda(
                                                            campanha.orcamento,
                                                            campanha.moeda
                                                        )}
                                                    </span>

                                                    {campanha.utmCampaign && (
                                                        <span
                                                            className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                        >
                                                            UTM:{" "}
                                                            {
                                                                campanha.utmCampaign
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[420px]">
                                                {[
                                                    {
                                                        nome:
                                                            "Formulários",

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .formularios,
                                                    },

                                                    {
                                                        nome:
                                                            "Submissões",

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .submissoes,
                                                    },

                                                    {
                                                        nome:
                                                            "Regras",

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .regrasDistribuicao,
                                                    },

                                                    {
                                                        nome:
                                                            "Integrações",

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .integracoes,
                                                    },
                                                ].map(
                                                    (
                                                        item
                                                    ) => (
                                                        <div
                                                            key={
                                                                item.nome
                                                            }
                                                            className={`rounded-xl border p-3 text-center ${c.subCard}`}
                                                        >
                                                            <p
                                                                className={`text-lg font-bold ${c.titulo}`}
                                                            >
                                                                {formatarNumero(
                                                                    item.valor
                                                                )}
                                                            </p>

                                                            <p
                                                                className={`mt-1 text-[11px] ${c.muted}`}
                                                            >
                                                                {
                                                                    item.nome
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

            {modalAberto && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4"
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            fecharModal();
                        }
                    }}
                >
                    <div
                        className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6 ${c.card}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    className={`text-xl font-bold ${c.titulo}`}
                                >
                                    {campanhaEditando
                                        ? "Editar campanha de captação"
                                        : "Nova campanha de captação"}
                                </h2>

                                <p
                                    className={`mt-1 text-sm ${c.muted}`}
                                >
                                    {campanhaEditando
                                        ? "Atualize as informações e configurações desta campanha."
                                        : "Configure a origem, período e rastreamento da campanha."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharModal
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
                                salvarCampanha
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

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Nome *
                                    </label>

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
                                        onBlur={
                                            sugerirIdentificadorCampanha
                                        }
                                        placeholder="Ex.: Vestibular 2027"
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        required
                                    />
                                </div>

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
                                        onChange={(event) =>
                                            selecionarCanal(
                                                event.target.value
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
                                        Código
                                    </label>

                                    <input
                                        type="text"
                                        maxLength={
                                            100
                                        }
                                        value={
                                            formulario.codigo
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarFormulario(
                                                "codigo",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        onBlur={
                                            sugerirIdentificadorCampanha
                                        }
                                        placeholder="Opcional — gerado pelo nome"
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    />

                                    <p
                                        className={`mt-1 text-xs ${c.muted}`}
                                    >
                                        Exemplo:
                                        VESTIBULAR_2027
                                    </p>
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Status
                                    </label>

                                    <select
                                        value={
                                            formulario.status
                                        }
                                        onChange={(event) =>
                                            selecionarStatusCampanha(
                                                event.target.value
                                            )
                                        }
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    >
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
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    Descrição
                                </label>

                                <textarea
                                    rows={3}
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
                                    placeholder="Objetivo e contexto da campanha."
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Data inicial
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formulario
                                                .dataInicio
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarFormulario(
                                                "dataInicio",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Data final
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            formulario
                                                .dataFim
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarFormulario(
                                                "dataFim",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Orçamento
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                            formulario
                                                .orcamento
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarFormulario(
                                                "orcamento",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Ex.: 2500,00"
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        Moeda
                                    </label>

                                    <select
                                        value={
                                            formulario.moeda
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            atualizarFormulario(
                                                "moeda",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    >
                                        <option value="BRL">
                                            BRL — Real
                                        </option>

                                        <option value="USD">
                                            USD — Dólar
                                        </option>

                                        <option value="EUR">
                                            EUR — Euro
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div
                                className={`overflow-hidden rounded-2xl border ${c.subCard}`}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setRastreamentoAberto(
                                            (atual) => !atual
                                        )
                                    }
                                    className="flex w-full items-center justify-between gap-4 p-4 text-left"
                                >
                                    <div>
                                        <h3
                                            className={`font-semibold ${c.titulo}`}
                                        >
                                            🔎 Rastreamento da campanha
                                            <span
                                                className={`ml-2 text-xs font-normal ${c.muted}`}
                                            >
                                                Opcional
                                            </span>
                                        </h3>

                                        <p
                                            className={`mt-1 text-xs leading-5 ${c.muted}`}
                                        >
                                            Identifique de onde vieram os leads.
                                            Configure apenas se esta campanha utilizar
                                            links rastreados.
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 text-lg transition-transform ${rastreamentoAberto
                                            ? "rotate-180"
                                            : ""
                                            } ${c.muted}`}
                                    >
                                        ⌄
                                    </span>
                                </button>

                                {rastreamentoAberto && (
                                    <div
                                        className={`border-t p-4 ${c.divisoria}`}
                                    >
                                        <div
                                            className={
                                                temaEscuro
                                                    ? "mb-4 rounded-xl border border-blue-900 bg-blue-950/40 px-4 py-3 text-xs leading-5 text-blue-200"
                                                    : "mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800"
                                            }
                                        >
                                            💡 Estes campos são usados para saber qual
                                            anúncio, rede social, link ou divulgação
                                            trouxe cada interessado. Se você não utiliza
                                            esse tipo de rastreamento, pode deixar tudo
                                            vazio.
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    Origem do tráfego
                                                </label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >
                                                    De onde a pessoa veio.
                                                    Ex.: Facebook, Google, Instagram ou site.
                                                </p>

                                                <input
                                                    type="text"
                                                    value={
                                                        formulario.utmSource
                                                    }
                                                    onChange={(event) =>
                                                        atualizarFormulario(
                                                            "utmSource",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Ex.: facebook"
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >
                                                    Campo técnico: utm_source
                                                </p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    Meio de divulgação
                                                </label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >
                                                    Como o conteúdo foi divulgado.
                                                    Ex.: anúncio, banner, e-mail ou rede social.
                                                </p>

                                                <input
                                                    type="text"
                                                    value={
                                                        formulario.utmMedium
                                                    }
                                                    onChange={(event) =>
                                                        atualizarFormulario(
                                                            "utmMedium",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Ex.: banner"
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >
                                                    Campo técnico: utm_medium
                                                </p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    Identificador da campanha
                                                </label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >
                                                    Nome usado para identificar esta campanha
                                                    nos links rastreados.
                                                </p>

                                                <input
                                                    type="text"
                                                    value={
                                                        formulario.utmCampaign
                                                    }
                                                    onChange={(event) =>
                                                        atualizarFormulario(
                                                            "utmCampaign",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Ex.: vestibular_2027"
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >
                                                    Campo técnico: utm_campaign
                                                </p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    Variação do anúncio
                                                </label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >
                                                    Diferencie banners, vídeos ou anúncios
                                                    da mesma campanha.
                                                </p>

                                                <input
                                                    type="text"
                                                    value={
                                                        formulario.utmContent
                                                    }
                                                    onChange={(event) =>
                                                        atualizarFormulario(
                                                            "utmContent",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Ex.: banner_principal"
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >
                                                    Campo técnico: utm_content
                                                </p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    Palavra-chave
                                                </label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >
                                                    Usado principalmente em campanhas de
                                                    pesquisa. Pode ficar vazio.
                                                </p>

                                                <input
                                                    type="text"
                                                    value={
                                                        formulario.utmTerm
                                                    }
                                                    onChange={(event) =>
                                                        atualizarFormulario(
                                                            "utmTerm",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Ex.: curso_teologia"
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >
                                                    Campo técnico: utm_term
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    URL de destino
                                </label>

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >
                                    Página para onde o anúncio, botão ou link da
                                    campanha direcionará o interessado.
                                </p>

                                <input
                                    type="url"
                                    value={
                                        formulario
                                            .urlDestino
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarFormulario(
                                            "urlDestino",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Ex.: https://www.suaescola.com.br/vestibular"
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    Observações
                                </label>

                                <textarea
                                    rows={3}
                                    value={
                                        formulario
                                            .observacoes
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarFormulario(
                                            "observacoes",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Informações internas sobre a campanha."
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />
                            </div>

                            <div
                                className={`rounded-2xl border p-4 ${c.subCard}`}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classesStatus(
                                            formulario.status,
                                            temaEscuro
                                        )}`}
                                    >
                                        {nomeStatus(
                                            formulario.status
                                        )}
                                    </span>

                                    <span
                                        className={`text-xs font-semibold ${c.muted}`}
                                    >
                                        Situação da campanha
                                    </span>
                                </div>

                                <p
                                    className={`mt-3 text-sm leading-6 ${c.texto}`}
                                >
                                    {descricaoStatusCampanha(
                                        formulario.status
                                    )}
                                </p>

                                <p
                                    className={`mt-2 text-xs leading-5 ${c.muted}`}
                                >
                                    O PHANYX ajusta automaticamente a disponibilidade
                                    da campanha de acordo com o status selecionado.
                                </p>
                            </div>

                            <div
                                className={`flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${c.divisoria}`}
                            >
                                <button
                                    type="button"
                                    onClick={
                                        fecharModal
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
                                        ? "Salvando..."
                                        : campanhaEditando
                                            ? "Salvar alterações"
                                            : "Cadastrar campanha"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}