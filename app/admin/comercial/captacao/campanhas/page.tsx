"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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
    locale: string,
    valor: number
) {
    return new Intl.NumberFormat(
        locale
    ).format(
        Number(valor || 0)
    );
}

function formatarMoeda(
    locale: string,
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
            locale,
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
    locale: string,
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
        locale,
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
    t: any,
    status: string
) {
    const chave =
        String(status || "")
            .trim()
            .toUpperCase();

    const mapa: Record<string, string> = {
        RASCUNHO: "draft",
        AGENDADA: "scheduled",
        ATIVA: "active",
        PAUSADA: "paused",
        ENCERRADA: "ended",
        ARQUIVADA: "archived",
    };

    const traducao =
        mapa[chave];

    return traducao
        ? t(`statuses.${traducao}`)
        : t("statuses.unknown");
}


function descricaoStatusCampanha(
    t: any,
    status: string
) {
    const chave =
        String(status || "")
            .trim()
            .toUpperCase();

    const mapa: Record<string, string> = {
        RASCUNHO: "draft",
        AGENDADA: "scheduled",
        ATIVA: "active",
        PAUSADA: "paused",
        ENCERRADA: "ended",
        ARQUIVADA: "archived",
    };

    const traducao =
        mapa[chave];

    return traducao
        ? t(`statusDescriptions.${traducao}`)
        : t("statusDescriptions.unknown");
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
    const t =
        useTranslations(
            "AdminCommercialCampaigns"
        );

    const locale =
        useLocale();

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
                            t("errors.load")
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
                            : t("errors.load")
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
                t("errors.nameRequired")
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
                t("errors.invalidDateRange")
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
                            ? t("errors.update")
                            : t("errors.create")
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
                            ? t("success.updated")
                            : t("success.created")
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
                    : t("errors.save")
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
                    >{t("errorPage.title")}</h1>

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
                    >{t("errorPage.retry")}</button>
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
                            >{t("header.back")}</Link>

                            <h1
                                className={`mt-3 text-2xl font-bold sm:text-3xl ${c.titulo}`}
                            >{t("header.title")}</h1>

                            <p
                                className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
                            >{t("header.description")}</p>
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
                                    ? t("header.refreshing")
                                    : t("header.refresh")}
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
                                    >{t("header.newCampaign")}</button>
                                )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            nome:
                                t("summary.total"),

                            valor:
                                dados.resumo
                                    .total,
                        },

                        {
                            nome:
                                t("summary.active"),

                            valor:
                                dados.resumo
                                    .ativas,
                        },

                        {
                            nome:
                                t("summary.scheduled"),

                            valor:
                                dados.resumo
                                    .agendadas,
                        },

                        {
                            nome:
                                t("summary.paused"),

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
                                    {formatarNumero(locale,
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
                            >{t("filters.search")}</label>

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
                                placeholder={t("filters.searchPlaceholder")}
                                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${c.input}`}
                            />
                        </div>

                        <div>
                            <label
                                className={`text-xs font-semibold ${c.muted}`}
                            >{t("filters.channel")}</label>

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
                                <option value="">{t("common.all")}</option>

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
                            >{t("filters.status")}</label>

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
                                <option value="">{t("common.all")}</option>

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
                                                {nomeStatus(t,
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
                            >{t("filters.situation")}</label>

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
                                <option value="">{t("common.all")}</option>

                                <option value="true">{t("summary.active")}</option>

                                <option value="false">{t("filters.inactive")}</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >{t("filters.apply")}</button>

                            <button
                                type="button"
                                onClick={
                                    limparFiltros
                                }
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
                            >{t("filters.clear")}</button>
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
                        >{t("list.title")}</h2>

                        <p
                            className={`mt-1 text-sm ${c.muted}`}
                        >
                            {t("list.results", {
                                count:
                                    dados.campanhas
                                        .length,
                            })}
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
                            >{t("list.emptyTitle")}</p>

                            <p
                                className={`mt-1 text-sm ${c.muted}`}
                            >{t("list.emptyDescription")}</p>

                            {dados
                                .permissoes
                                .podeGerenciar && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovaCampanha
                                        }
                                        className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >{t("list.createCampaign")}</button>
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
                                                        {nomeStatus(t,
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
                                                        >{t("card.inactive")}</span>
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
                                                            >{t("common.edit")}</button>
                                                        )}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                                    <span
                                                        className={`text-sm font-medium ${c.texto}`}
                                                    >
                                                        {t("card.code")}:{" "}
                                                        {
                                                            campanha.codigo
                                                        }
                                                    </span>

                                                    <span
                                                        className={`text-sm ${c.muted}`}
                                                    >
                                                        {t("card.channel")}:{" "}
                                                        {campanha
                                                            .canal
                                                            ?.nome ||
                                                            t("card.noChannel")}
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
                                                        {formatarData(locale,
                                                            campanha.dataInicio
                                                        )}{" "}
                                                        →{" "}
                                                        {formatarData(locale,
                                                            campanha.dataFim
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`rounded-xl border px-3 py-2 text-xs ${c.subCard}`}
                                                    >
                                                        💰{" "}
                                                        {formatarMoeda(locale,
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
                                                            t("card.forms"),

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .formularios,
                                                    },

                                                    {
                                                        nome:
                                                            t("card.submissions"),

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .submissoes,
                                                    },

                                                    {
                                                        nome:
                                                            t("card.rules"),

                                                        valor:
                                                            campanha
                                                                ._count
                                                                .regrasDistribuicao,
                                                    },

                                                    {
                                                        nome:
                                                            t("card.integrations"),

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
                                                                {formatarNumero(locale,
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
                                        ? t("modal.editTitle")
                                        : t("modal.newTitle")}
                                </h2>

                                <p
                                    className={`mt-1 text-sm ${c.muted}`}
                                >
                                    {campanhaEditando
                                        ? t("modal.editDescription")
                                        : t("modal.newDescription")}
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
                                aria-label={t("common.close")}
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
                                    >{t("modal.name")} *</label>

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
                                        placeholder={t("modal.namePlaceholder")}
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >{t("modal.channel")}</label>

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
                                        <option value="">{t("modal.noSpecificChannel")}</option>

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
                                    >{t("modal.code")}</label>

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
                                        placeholder={t("modal.codePlaceholder")}
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    />

                                    <p
                                        className={`mt-1 text-xs ${c.muted}`}
                                    >{t("modal.codeExample")}</p>
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >{t("modal.status")}</label>

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
                                                        {nomeStatus(t,
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
                                >{t("modal.description")}</label>

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
                                    placeholder={t("modal.descriptionPlaceholder")}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >{t("modal.startDate")}</label>

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
                                    >{t("modal.endDate")}</label>

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
                                    >{t("modal.budget")}</label>

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
                                        placeholder={t("modal.budgetPlaceholder")}
                                        className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    />
                                </div>

                                <div>
                                    <label
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >{t("modal.currency")}</label>

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
                                        <option value="BRL">{t("currencies.BRL")}</option>

                                        <option value="USD">{t("currencies.USD")}</option>

                                        <option value="EUR">{t("currencies.EUR")}</option>
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
                                        >{t("tracking.title")}<span
                                                className={`ml-2 text-xs font-normal ${c.muted}`}
                                            >{t("tracking.optional")}</span>
                                        </h3>

                                        <p
                                            className={`mt-1 text-xs leading-5 ${c.muted}`}
                                        >{t("tracking.description")}</p>
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
                                        >{t("tracking.info")}</div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >{t("tracking.source")}</label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >{t("tracking.sourceHelp")}</p>

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
                                                    placeholder={t("tracking.sourcePlaceholder")}
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >{t("tracking.technicalField", { field: "utm_source" })}</p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >{t("tracking.medium")}</label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >{t("tracking.mediumHelp")}</p>

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
                                                    placeholder={t("tracking.mediumPlaceholder")}
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >{t("tracking.technicalField", { field: "utm_medium" })}</p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >{t("tracking.campaign")}</label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >{t("tracking.campaignHelp")}</p>

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
                                                    placeholder={t("tracking.campaignPlaceholder")}
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >{t("tracking.technicalField", { field: "utm_campaign" })}</p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >{t("tracking.content")}</label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >{t("tracking.contentHelp")}</p>

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
                                                    placeholder={t("tracking.contentPlaceholder")}
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >{t("tracking.technicalField", { field: "utm_content" })}</p>
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >{t("tracking.term")}</label>

                                                <p
                                                    className={`mt-1 text-xs ${c.muted}`}
                                                >{t("tracking.termHelp")}</p>

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
                                                    placeholder={t("tracking.termPlaceholder")}
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />

                                                <p
                                                    className={`mt-1 text-[11px] ${c.muted}`}
                                                >{t("tracking.technicalField", { field: "utm_term" })}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >{t("modal.destinationUrl")}</label>

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >{t("modal.destinationUrlHelp")}</p>

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
                                    placeholder={t("modal.destinationUrlPlaceholder")}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                />
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >{t("modal.notes")}</label>

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
                                    placeholder={t("modal.notesPlaceholder")}
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
                                        {nomeStatus(t,
                                            formulario.status
                                        )}
                                    </span>

                                    <span
                                        className={`text-xs font-semibold ${c.muted}`}
                                    >{t("modal.campaignSituation")}</span>
                                </div>

                                <p
                                    className={`mt-3 text-sm leading-6 ${c.texto}`}
                                >
                                    {descricaoStatusCampanha(t,
                                        formulario.status
                                    )}
                                </p>

                                <p
                                    className={`mt-2 text-xs leading-5 ${c.muted}`}
                                >{t("modal.statusAvailabilityHelp")}</p>
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
                                >{t("common.cancel")}</button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvando
                                        ? t("modal.saving")
                                        : campanhaEditando
                                            ? t("modal.saveChanges")
                                            : t("modal.createCampaign")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}