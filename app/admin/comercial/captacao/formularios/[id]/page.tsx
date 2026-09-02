"use client";

import Link from "next/link";
import ProtecaoDadosFormulario from "./ProtecaoDadosFormulario";
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useTranslations,
} from "next-intl";
import { useParams } from "next/navigation";

type Tema =
    | "light"
    | "dark"
    | "system";

type CampoFormulario = {
    id: number;

    chave: string;
    rotulo: string;
    tipo: string;
    mapeamento: string;

    placeholder: string | null;
    textoAjuda: string | null;
    valorPadrao: string | null;
    mascara: string | null;

    obrigatorio: boolean;
    ativo: boolean;

    ordem: number;
    largura: number;

    opcoes: unknown;
    validacoes: unknown;

    criadoEm: string;
    atualizadoEm: string;
};

type RespostaCampos = {
    success: true;

    permissoes: {
        podeVer: boolean;
        podeGerenciar: boolean;
    };

    formulario: {
        id: number;
        nome: string;
        titulo: string;
        slug: string;
        tokenPublico: string;
        status: string;
        versao: number;
        ativo: boolean;
    };

    tiposDisponiveis:
    string[];

    mapeamentosDisponiveis:
    string[];

    referencias: {
        polos: {
            id: number;
            nome: string;
        }[];
    };

    resumo: {
        total: number;
        ativos: number;
        obrigatorios: number;
    };

    campos:
    CampoFormulario[];
};

type RespostaErro = {
    success?: false;
    error?: string;
    codigo?: string;

    detalhes?: {
        pendencias?: string[];
    };
};

type FormularioCampo = {
    rotulo: string;
    chave: string;

    tipo: string;
    mapeamento: string;

    placeholder: string;
    textoAjuda: string;
    mascara: string;

    obrigatorio: boolean;

    largura: string;

    opcoesTexto: string;
};

const CAMPO_INICIAL:
    FormularioCampo = {
    rotulo: "",
    chave: "",

    tipo:
        "TEXTO_CURTO",

    mapeamento:
        "PERSONALIZADO",

    placeholder: "",
    textoAjuda: "",
    mascara: "",

    obrigatorio:
        false,

    largura:
        "12",

    opcoesTexto:
        "",
};

function ehCampoComOpcoesManuais(
    tipo: string,
    mapeamento: string
) {
    const opcoesAutomaticas =
        mapeamento ===
        "CURSO_INTERESSE_ID" ||
        mapeamento ===
        "POLO_INTERESSE_ID";

    if (opcoesAutomaticas) {
        return false;
    }

    return (
        tipo ===
        "SELECAO_UNICA" ||
        tipo ===
        "SELECAO_MULTIPLA"
    );
}

function opcoesParaTexto(
    valor: unknown
) {
    if (!Array.isArray(valor)) {
        return "";
    }

    return valor
        .map((item) => {
            if (
                typeof item === "string" ||
                typeof item === "number"
            ) {
                return String(item);
            }

            if (
                item &&
                typeof item === "object" &&
                !Array.isArray(item)
            ) {
                const registro =
                    item as Record<
                        string,
                        unknown
                    >;

                return String(
                    registro.label ??
                    registro.nome ??
                    registro.value ??
                    ""
                ).trim();
            }

            return "";
        })
        .filter(Boolean)
        .join("\n");
}

function ehCampoConhecidoPhanyx(
    mapeamento: string
) {
    return (
        mapeamento !==
        "PERSONALIZADO"
    );
}

export default function ConfigurarFormularioCaptacaoPage() {
    const t =
        useTranslations(
            "AdminCommercialForms"
        );

    const params =
        useParams();

    const formularioId =
        Number(
            params.id
        );

    const [
        temaEscolhido,
        setTemaEscolhido,
    ] =
        useState<Tema>("light");

    const [
        temaEscuro,
        setTemaEscuro,
    ] =
        useState(false);

    const [
        dados,
        setDados,
    ] =
        useState<RespostaCampos | null>(
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
        reordenandoCampoId,
        setReordenandoCampoId,
    ] =
        useState<number | null>(
            null
        );

    const [
        erro,
        setErro,
    ] =
        useState("");

    const [
        modalAberto,
        setModalAberto,
    ] =
        useState(false);

    const [
        campoEmEdicao,
        setCampoEmEdicao,
    ] =
        useState<CampoFormulario | null>(
            null
        );

    const [
        formularioCampo,
        setFormularioCampo,
    ] =
        useState<FormularioCampo>(
            CAMPO_INICIAL
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
        useState<string | null>(
            null
        );

    const [
        modalPublicarAberto,
        setModalPublicarAberto,
    ] = useState(false);

    const [
        publicando,
        setPublicando,
    ] = useState(false);

    const [
        erroPublicacao,
        setErroPublicacao,
    ] = useState("");

    const [
        pendenciasPublicacao,
        setPendenciasPublicacao,
    ] = useState<string[]>([]);

    useEffect(() => {
        const root =
            document.documentElement;

        function calcularTema() {
            const escolha =
                root.dataset
                    .themeChoice;

            const temaSalvo =
                (
                    escolha === "light" ||
                    escolha === "dark" ||
                    escolha === "system"
                )
                    ? escolha
                    : (
                        localStorage.getItem(
                            "phanyx_tema"
                        ) ||
                        "light"
                    );

            setTemaEscolhido(
                temaSalvo as Tema
            );

            setTemaEscuro(
                root.classList.contains(
                    "dark"
                )
            );
        }

        calcularTema();

        const observador =
            new MutationObserver(
                calcularTema
            );

        observador.observe(
            root,
            {
                attributes: true,
                attributeFilter: [
                    "class",
                    "data-theme",
                    "data-theme-choice",
                ],
            }
        );

        const media =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

        media.addEventListener(
            "change",
            calcularTema
        );

        window.addEventListener(
            "storage",
            calcularTema
        );

        return () => {
            observador.disconnect();

            media.removeEventListener(
                "change",
                calcularTema
            );

            window.removeEventListener(
                "storage",
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

    const temaAzul =
        temaEscolhido ===
        "dark";

    const c =
        useMemo(
            () => ({
                pagina:
                    temaAzul
                        ? "bg-[#020b2a] text-blue-50"
                        : temaEscuro
                            ? "bg-neutral-950 text-neutral-100"
                            : "bg-slate-100 text-slate-900",

                card:
                    temaAzul
                        ? "border-blue-950 bg-[#0b1220]"
                        : temaEscuro
                            ? "border-neutral-700 bg-neutral-900"
                            : "border-slate-200 bg-white",

                subCard:
                    temaAzul
                        ? "border-blue-900 bg-[#0f1a33]"
                        : temaEscuro
                            ? "border-neutral-700 bg-neutral-800"
                            : "border-slate-200 bg-slate-50",

                titulo:
                    temaAzul
                        ? "text-blue-50"
                        : temaEscuro
                            ? "text-white"
                            : "text-slate-900",

                texto:
                    temaAzul
                        ? "text-blue-100"
                        : temaEscuro
                            ? "text-neutral-200"
                            : "text-slate-700",

                muted:
                    temaAzul
                        ? "text-blue-200/70"
                        : temaEscuro
                            ? "text-neutral-400"
                            : "text-slate-500",

                divisoria:
                    temaAzul
                        ? "border-blue-950"
                        : temaEscuro
                            ? "border-neutral-700"
                            : "border-slate-200",

                input:
                    temaAzul
                        ? "border-blue-900 bg-blue-950/70 text-blue-50 placeholder:text-blue-200/50"
                        : temaEscuro
                            ? "border-neutral-600 bg-neutral-800 text-neutral-100 placeholder:text-neutral-400"
                            : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

                botaoSecundario:
                    temaAzul
                        ? "border-blue-900 bg-[#0f1a33] text-blue-50 hover:bg-[#162447]"
                        : temaEscuro
                            ? "border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",

                botaoPrimario:
                    temaAzul
                        ? "bg-blue-700 text-white hover:bg-blue-600"
                        : temaEscuro
                            ? "bg-neutral-700 text-white hover:bg-neutral-600"
                            : "bg-slate-900 text-white hover:bg-slate-800",
            }),
            [
                temaAzul,
                temaEscuro,
            ]
        );

    function nomeTipoUi(
        tipo: string
    ) {
        switch (tipo) {
            case "TEXTO_CURTO":
                return t(
                    "shared.fieldTypes.shortText"
                );
            case "TEXTO_LONGO":
                return t(
                    "shared.fieldTypes.longText"
                );
            case "EMAIL":
                return t(
                    "shared.fieldTypes.email"
                );
            case "TELEFONE":
                return t(
                    "shared.fieldTypes.phone"
                );
            case "NUMERO":
                return t(
                    "shared.fieldTypes.number"
                );
            case "DATA":
                return t(
                    "shared.fieldTypes.date"
                );
            case "SELECAO_UNICA":
                return t(
                    "shared.fieldTypes.singleSelect"
                );
            case "SELECAO_MULTIPLA":
                return t(
                    "shared.fieldTypes.multiSelect"
                );
            case "CHECKBOX":
                return t(
                    "shared.fieldTypes.checkbox"
                );
            case "CONSENTIMENTO":
                return t(
                    "shared.fieldTypes.consent"
                );
            case "OCULTO":
                return t(
                    "shared.fieldTypes.hidden"
                );
            default:
                return tipo;
        }
    }

    function nomeMapeamentoUi(
        valor: string
    ) {
        switch (valor) {
            case "NOME":
                return t(
                    "shared.mappings.name"
                );
            case "EMAIL":
                return t(
                    "shared.mappings.email"
                );
            case "TELEFONE":
                return t(
                    "shared.mappings.phone"
                );
            case "INSTITUICAO_NOME":
                return t(
                    "shared.mappings.organization"
                );
            case "CARGO":
                return t(
                    "shared.mappings.role"
                );
            case "INTERESSE":
                return t(
                    "shared.mappings.interest"
                );
            case "OBSERVACOES":
                return t(
                    "shared.mappings.notes"
                );
            case "CURSO_INTERESSE_ID":
                return t(
                    "shared.mappings.courseInterest"
                );
            case "POLO_INTERESSE_ID":
                return t(
                    "shared.mappings.unitInterest"
                );
            case "CONSENTIMENTO":
                return t(
                    "shared.mappings.consent"
                );
            case "PERSONALIZADO":
                return t(
                    "shared.mappings.custom"
                );
            default:
                return valor;
        }
    }

    function nomeStatusUi(
        status: string
    ) {
        switch (status) {
            case "RASCUNHO":
                return t(
                    "shared.statuses.draft"
                );
            case "PUBLICADO":
                return t(
                    "shared.statuses.published"
                );
            case "PAUSADO":
                return t(
                    "shared.statuses.paused"
                );
            case "ARQUIVADO":
                return t(
                    "shared.statuses.archived"
                );
            default:
                return status;
        }
    }

    function nomeLarguraUi(
        largura: number
    ) {
        if (largura === 12) {
            return t(
                "shared.widths.full"
            );
        }

        if (largura === 6) {
            return t(
                "shared.widths.half"
            );
        }

        if (largura === 4) {
            return t(
                "shared.widths.third"
            );
        }

        if (largura === 3) {
            return t(
                "shared.widths.quarter"
            );
        }

        return t(
            "shared.widths.custom"
        );
    }

    const carregar =
        useCallback(
            async (
                silencioso =
                    false
            ) => {
                if (
                    !Number.isInteger(
                        formularioId
                    ) ||
                    formularioId <= 0
                ) {
                    setErro(
                        t("config.errors.invalidForm")
                    );

                    setCarregando(
                        false
                    );

                    return;
                }

                try {
                    if (
                        silencioso
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

                    const resposta =
                        await fetch(
                            `/api/admin/comercial/captacao/formularios/${formularioId}/campos`,
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
                        | RespostaCampos
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
                            t("config.errors.loadFields")
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
                            : t("config.errors.loadFields")
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
                formularioId,
            ]
        );

    useEffect(() => {
        void carregar();
    }, [carregar]);

    function abrirPublicacao() {
        setErroPublicacao("");
        setPendenciasPublicacao([]);
        setModalPublicarAberto(
            true
        );
    }

    function fecharPublicacao() {
        if (publicando) {
            return;
        }

        setModalPublicarAberto(
            false
        );

        setErroPublicacao("");
        setPendenciasPublicacao(
            []
        );
    }

    async function publicarFormulario() {
        if (
            !dados ||
            publicando
        ) {
            return;
        }

        try {
            setPublicando(true);
            setErroPublicacao("");
            setPendenciasPublicacao(
                []
            );

            const resposta =
                await fetch(
                    `/api/admin/comercial/captacao/formularios/${formularioId}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                status:
                                    "PUBLICADO",
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
                    success?: boolean;
                    error?: string;
                    codigo?: string;

                    detalhes?: {
                        pendencias?:
                        string[];
                    };
                };

            if (
                !resposta.ok ||
                json.success !==
                true
            ) {
                const pendencias =
                    Array.isArray(
                        json.detalhes
                            ?.pendencias
                    )
                        ? json.detalhes
                            ?.pendencias ??
                        []
                        : [];

                if (
                    pendencias.length >
                    0
                ) {
                    setPendenciasPublicacao(
                        pendencias
                    );

                    setErroPublicacao(
                        t("config.publish.reviewItems")
                    );

                    return;
                }

                throw new Error(
                    json.error ||
                    t("config.errors.publish")
                );
            }

            setModalPublicarAberto(
                false
            );

            setToast(
                t("config.success.published")
            );

            await carregar(true);
        } catch (error) {
            setErroPublicacao(
                error instanceof
                    Error
                    ? error.message
                    : t("config.errors.publish")
            );
        } finally {
            setPublicando(false);
        }
    }

    async function copiarLinkPublico() {
        if (
            !dados ||
            dados.formulario.status !==
            "PUBLICADO"
        ) {
            return;
        }

        try {
            const link =
                `${window.location.origin}/captacao/${dados.formulario.tokenPublico}`;

            await navigator.clipboard.writeText(
                link
            );

            setToast(
                t("config.success.linkCopied")
            );
        } catch {
            setErro(
                t("config.errors.copyLink")
            );
        }
    }

    function abrirNovoCampo() {
        setCampoEmEdicao(
            null
        );

        setFormularioCampo({
            ...CAMPO_INICIAL,

            tipo:
                dados
                    ?.tiposDisponiveis
                ?.[0] ??
                "TEXTO_CURTO",

            mapeamento:
                dados
                    ?.mapeamentosDisponiveis
                    .includes(
                        "PERSONALIZADO"
                    )
                    ? "PERSONALIZADO"
                    : (
                        dados
                            ?.mapeamentosDisponiveis
                        ?.[0] ??
                        "PERSONALIZADO"
                    ),
        });

        setErroFormulario(
            ""
        );

        setModalAberto(
            true
        );
    }

    function abrirEditarCampo(
        campo: CampoFormulario
    ) {
        setCampoEmEdicao(
            campo
        );

        setFormularioCampo({
            rotulo:
                campo.rotulo,

            chave:
                campo.chave,

            tipo:
                campo.tipo,

            mapeamento:
                campo.mapeamento,

            placeholder:
                campo.placeholder ??
                "",

            textoAjuda:
                campo.textoAjuda ??
                "",

            mascara:
                campo.mascara ??
                "",

            obrigatorio:
                campo.obrigatorio,

            largura:
                String(
                    campo.largura
                ),

            opcoesTexto:
                opcoesParaTexto(
                    campo.opcoes
                ),
        });

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

        setCampoEmEdicao(
            null
        );

        setErroFormulario(
            ""
        );
    }

    async function moverCampo(
        campo: CampoFormulario,
        direcao: "cima" | "baixo"
    ) {
        if (
            !dados ||
            reordenandoCampoId !== null
        ) {
            return;
        }

        const indiceAtual =
            dados.campos.findIndex(
                (item) =>
                    item.id ===
                    campo.id
            );

        if (indiceAtual < 0) {
            return;
        }

        const indiceDestino =
            direcao === "cima"
                ? indiceAtual - 1
                : indiceAtual + 1;

        const campoDestino =
            dados.campos[
            indiceDestino
            ];

        if (!campoDestino) {
            return;
        }

        try {
            setReordenandoCampoId(
                campo.id
            );

            const resposta =
                await fetch(
                    `/api/admin/comercial/captacao/formularios/${formularioId}/campos/${campo.id}`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                ordem:
                                    campoDestino.ordem,
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
                    success?: boolean;
                    error?: string;
                    message?: string;
                };

            if (
                !resposta.ok ||
                json.success !== true
            ) {
                throw new Error(
                    json.error ||
                    t("config.errors.reorder")
                );
            }

            setToast(
                t("config.success.reordered")
            );

            await carregar(
                true
            );
        } catch (error) {
            setToast(
                error instanceof Error
                    ? error.message
                    : t("config.errors.reorder")
            );
        } finally {
            setReordenandoCampoId(
                null
            );
        }
    }

    function atualizarCampo<
        K extends keyof FormularioCampo
    >(
        campo: K,
        valor:
            FormularioCampo[K]
    ) {
        setFormularioCampo(
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

    function selecionarMapeamento(
        mapeamento: string
    ) {
        const padroes:
            Record<
                string,
                Partial<FormularioCampo>
            > = {
            NOME: {
                tipo:
                    "TEXTO_CURTO",

                rotulo:
                    t("config.defaults.name.label"),

                placeholder:
                    t("config.defaults.name.placeholder"),

                textoAjuda:
                    "",

                mascara:
                    "",

                obrigatorio:
                    true,

                largura:
                    "12",
            },

            EMAIL: {
                tipo:
                    "EMAIL",

                rotulo:
                    t("shared.mappings.email"),

                placeholder:
                    "nome@exemplo.com",

                textoAjuda:
                    t("config.defaults.email.help"),

                mascara:
                    "",

                obrigatorio:
                    true,

                largura:
                    "6",
            },

            TELEFONE: {
                tipo:
                    "TELEFONE",

                rotulo:
                    t("shared.mappings.phone"),

                placeholder:
                    t("config.defaults.phone.placeholder"),

                textoAjuda:
                    t("config.defaults.phone.help"),

                mascara:
                    "",

                /*
                 * Telefone pode ser
                 * opcional dependendo
                 * da estratégia da instituição.
                 */
                obrigatorio:
                    false,

                largura:
                    "6",
            },

            INSTITUICAO_NOME: {
                tipo:
                    "TEXTO_CURTO",

                rotulo:
                    t("shared.mappings.organization"),

                placeholder:
                    t("config.defaults.organization.placeholder"),

                textoAjuda:
                    "",

                mascara:
                    "",

                obrigatorio:
                    false,

                largura:
                    "6",
            },

            CARGO: {
                tipo:
                    "TEXTO_CURTO",

                rotulo:
                    t("shared.mappings.role"),

                placeholder:
                    t("config.defaults.role.placeholder"),

                textoAjuda:
                    "",

                mascara:
                    "",

                obrigatorio:
                    false,

                largura:
                    "6",
            },

            INTERESSE: {
                tipo:
                    "TEXTO_CURTO",

                rotulo:
                    t("config.defaults.interest.label"),

                placeholder:
                    t("config.defaults.interest.placeholder"),

                textoAjuda:
                    "",

                mascara:
                    "",

                obrigatorio:
                    false,

                largura:
                    "12",
            },

            OBSERVACOES: {
                tipo:
                    "TEXTO_LONGO",

                rotulo:
                    t("config.defaults.notes.label"),

                placeholder:
                    t("config.defaults.notes.placeholder"),

                textoAjuda:
                    "",

                mascara:
                    "",

                obrigatorio:
                    false,

                largura:
                    "12",
            },

            CURSO_INTERESSE_ID: {
                tipo:
                    "SELECAO_UNICA",

                rotulo:
                    t("shared.mappings.courseInterest"),

                placeholder:
                    t("config.defaults.course.placeholder"),

                textoAjuda:
                    t("config.defaults.course.help"),

                mascara:
                    "",

                obrigatorio:
                    false,

                largura:
                    "6",
            },

            POLO_INTERESSE_ID: {
                tipo:
                    "SELECAO_UNICA",

                rotulo:
                    t("config.defaults.unit.label"),

                placeholder:
                    t("config.defaults.unit.placeholder"),

                textoAjuda:
                    t("config.defaults.unit.help"),

                mascara:
                    "",

                obrigatorio:
                    false,

                largura:
                    "6",
            },

            CONSENTIMENTO: {
                tipo:
                    "CONSENTIMENTO",

                rotulo:
                    t("config.defaults.consent.label"),

                placeholder:
                    "",

                textoAjuda:
                    t("config.defaults.consent.help"),

                mascara:
                    "",

                obrigatorio:
                    true,

                largura:
                    "12",
            },
        };

        setFormularioCampo(
            (atual) => {
                const padrao =
                    padroes[
                    mapeamento
                    ];

                return {
                    ...atual,

                    mapeamento,

                    ...(padrao ??
                        {}),
                };
            }
        );

        if (
            erroFormulario
        ) {
            setErroFormulario(
                ""
            );
        }
    }

    async function salvarCampo(
        event:
            FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const rotulo =
            formularioCampo
                .rotulo
                .trim();

        if (!rotulo) {
            setErroFormulario(
                t("config.validation.fieldLabel")
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

            let opcoes:
                string[] |
                undefined;

            if (
                ehCampoComOpcoesManuais(
                    formularioCampo.tipo,
                    formularioCampo.mapeamento
                )
            ) {
                opcoes =
                    formularioCampo
                        .opcoesTexto
                        .split("\n")
                        .map(
                            (
                                item
                            ) =>
                                item.trim()
                        )
                        .filter(
                            Boolean
                        );

                if (
                    opcoes.length ===
                    0
                ) {
                    throw new Error(
                        t("config.validation.optionRequired")
                    );
                }
            }

            const url =
                campoEmEdicao
                    ? `/api/admin/comercial/captacao/formularios/${formularioId}/campos/${campoEmEdicao.id}`
                    : `/api/admin/comercial/captacao/formularios/${formularioId}/campos`;

            const resposta =
                await fetch(
                    url,
                    {
                        method:
                            campoEmEdicao
                                ? "PATCH"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                rotulo,

                                chave:
                                    formularioCampo
                                        .chave
                                        .trim() ||
                                    null,

                                tipo:
                                    formularioCampo.tipo,

                                mapeamento:
                                    formularioCampo
                                        .mapeamento,

                                placeholder:
                                    formularioCampo
                                        .placeholder
                                        .trim() ||
                                    null,

                                textoAjuda:
                                    formularioCampo
                                        .textoAjuda
                                        .trim() ||
                                    null,

                                mascara:
                                    formularioCampo
                                        .mascara
                                        .trim() ||
                                    null,

                                obrigatorio:
                                    formularioCampo
                                        .obrigatorio,

                                ativo:
                                    true,

                                largura:
                                    Number(
                                        formularioCampo
                                            .largura
                                    ),

                                opcoes:
                                    opcoes,
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
                    t("config.errors.saveField")
                );
            }

            setModalAberto(
                false
            );

            setToast(
                json.message ||
                (
                    campoEmEdicao
                        ? t("config.success.fieldUpdated")
                        : t("config.success.fieldAdded")
                )
            );

            await carregar(
                true
            );
        } catch (
        error
        ) {
            setErroFormulario(
                error instanceof
                    Error
                    ? error.message
                    : t("config.errors.addField")
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
                <div
                    className={`mx-auto h-96 max-w-7xl animate-pulse rounded-3xl border ${c.card}`}
                />
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
                    className={`mx-auto max-w-2xl rounded-3xl border p-6 ${c.card}`}
                >
                    <h1
                        className={`text-xl font-bold ${c.titulo}`}
                    >
                        {t("config.loadError.title")}
                    </h1>

                    <p
                        className={`mt-2 text-sm ${c.texto}`}
                    >
                        {erro}
                    </p>

                    <Link
                        href="/admin/comercial/captacao/formularios"
                        className={`mt-5 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold ${c.botaoSecundario}`}
                    >
                        {t("common.back")}
                    </Link>
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
                <div className="fixed right-5 top-5 z-[120] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-xl">
                    {toast}
                </div>
            )}

            <div className="mx-auto max-w-7xl space-y-6">
                <section
                    className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${c.card}`}
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Link
                                href="/admin/comercial/captacao/formularios"
                                className={`text-sm font-semibold ${c.muted}`}
                            >
                                {t("config.header.back")}
                            </Link>

                            <h1
                                className={`mt-3 text-2xl font-bold sm:text-3xl ${c.titulo}`}
                            >
                                ⚙️ {t("config.header.title")}
                            </h1>

                            <p
                                className={`mt-2 text-lg font-semibold ${c.titulo}`}
                            >
                                {
                                    dados
                                        .formulario
                                        .titulo
                                }
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${c.subCard}`}
                                >
                                    {nomeStatusUi(
                                        dados
                                            .formulario
                                            .status
                                    )}
                                </span>

                                <span
                                    className={`rounded-full border px-2.5 py-1 text-xs ${c.subCard}`}
                                >
                                    {t("config.header.version")}{" "}
                                    {
                                        dados
                                            .formulario
                                            .versao
                                    }
                                </span>

                                <span
                                    className={`rounded-full border px-2.5 py-1 text-xs ${c.subCard}`}
                                >
                                    /{
                                        dados
                                            .formulario
                                            .slug
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">

                            <Link
                                href={`/admin/comercial/captacao/formularios/${formularioId}/visualizar`}
                                target="_blank"
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
                            >
                                👁️ {t("config.actions.preview")}
                            </Link>

                            {dados.permissoes
                                .podeGerenciar &&
                                dados.formulario
                                    .status !==
                                "PUBLICADO" &&
                                dados.formulario
                                    .status !==
                                "ARQUIVADO" && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirPublicacao
                                        }
                                        className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                                    >
                                        🚀 {t("config.actions.publish")}
                                    </button>
                                )}

                            {dados.formulario
                                .status ===
                                "PUBLICADO" && (
                                    <>
                                        <a
                                            href={`/captacao/${dados.formulario.tokenPublico}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                        >
                                            🌐 {t("config.actions.openPublic")}
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void copiarLinkPublico()
                                            }
                                            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
                                        >
                                            📋 {t("config.actions.copyLink")}
                                        </button>
                                    </>
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
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
                            >
                                {atualizando
                                    ? t("common.refreshing")
                                    : t("common.refresh")}
                            </button>

                            {dados
                                .permissoes
                                .podeGerenciar &&
                                dados.formulario
                                    .status !==
                                "ARQUIVADO" && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovoCampo
                                        }
                                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${c.botaoPrimario}`}
                                    >
                                        + {t("config.actions.addField")}
                                    </button>
                                )}
                        </div>
                    </div>
                </section>

                <ProtecaoDadosFormulario
                    formularioId={
                        formularioId
                    }
                    podeGerenciar={
                        dados.permissoes
                            .podeGerenciar
                    }
                    arquivado={
                        dados.formulario
                            .status ===
                        "ARQUIVADO"
                    }
                    temaEscuro={
                        temaEscuro
                    }
                    temaAzul={
                        temaAzul
                    }
                    onAtualizado={() =>
                        carregar(true)
                    }
                />

                <section className="grid gap-4 sm:grid-cols-3">
                    <div
                        className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
                    >
                        <p
                            className={`text-sm ${c.muted}`}
                        >
                            {t("config.summary.total")}
                        </p>

                        <p
                            className={`mt-2 text-3xl font-bold ${c.titulo}`}
                        >
                            {
                                dados
                                    .resumo
                                    .total
                            }
                        </p>
                    </div>

                    <div
                        className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
                    >
                        <p
                            className={`text-sm ${c.muted}`}
                        >
                            {t("config.summary.active")}
                        </p>

                        <p
                            className={`mt-2 text-3xl font-bold ${c.titulo}`}
                        >
                            {
                                dados
                                    .resumo
                                    .ativos
                            }
                        </p>
                    </div>

                    <div
                        className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
                    >
                        <p
                            className={`text-sm ${c.muted}`}
                        >
                            {t("config.summary.required")}
                        </p>

                        <p
                            className={`mt-2 text-3xl font-bold ${c.titulo}`}
                        >
                            {
                                dados
                                    .resumo
                                    .obrigatorios
                            }
                        </p>
                    </div>
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
                            {t("config.fields.title")}
                        </h2>

                        <p
                            className={`mt-1 text-sm ${c.muted}`}
                        >
                            {t("config.fields.description")}
                        </p>
                    </div>

                    {dados.campos.length ===
                        0 ? (
                        <div className="p-10 text-center">
                            <div className="text-4xl">
                                🧩
                            </div>

                            <p
                                className={`mt-3 font-semibold ${c.titulo}`}
                            >
                                {t("config.fields.emptyTitle")}
                            </p>

                            <p
                                className={`mt-1 text-sm ${c.muted}`}
                            >
                                {t("config.fields.emptyDescription")}
                            </p>

                            {dados
                                .permissoes
                                .podeGerenciar && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovoCampo
                                        }
                                        className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold ${c.botaoPrimario}`}
                                    >
                                        + {t("config.fields.addFirst")}
                                    </button>
                                )}
                        </div>
                    ) : (
                        <div className="space-y-3 p-5 sm:p-6">
                            {dados.campos.map(
                                (
                                    campo,
                                    indice
                                ) => (
                                    <div
                                        key={
                                            campo.id
                                        }
                                        className={`rounded-2xl border p-4 ${c.subCard}`}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${c.card}`}
                                                >
                                                    {
                                                        campo.ordem
                                                    }
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p
                                                            className={`font-semibold ${c.titulo}`}
                                                        >
                                                            {
                                                                campo.rotulo
                                                            }
                                                        </p>

                                                        {campo.obrigatorio && (
                                                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                                                {t("shared.required")}
                                                            </span>
                                                        )}

                                                        {!campo.ativo && (
                                                            <span
                                                                className={`rounded-full border px-2 py-0.5 text-[11px] ${c.muted}`}
                                                            >
                                                                {t("shared.statuses.inactive")}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p
                                                        className={`mt-1 text-xs ${c.muted}`}
                                                    >
                                                        {nomeTipoUi(
                                                            campo.tipo
                                                        )}

                                                        {" • "}

                                                        {nomeMapeamentoUi(
                                                            campo.mapeamento
                                                        )}

                                                        {" • "}

                                                        {nomeLarguraUi(
                                                            campo.largura
                                                        )}
                                                    </p>

                                                    {campo.textoAjuda && (
                                                        <p
                                                            className={`mt-2 text-sm ${c.texto}`}
                                                        >
                                                            {
                                                                campo.textoAjuda
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {dados
                                            .permissoes
                                            .podeGerenciar &&
                                            dados.formulario
                                                .status !==
                                            "ARQUIVADO" && (
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void moverCampo(
                                                                campo,
                                                                "cima"
                                                            )
                                                        }
                                                        disabled={
                                                            indice === 0 ||
                                                            reordenandoCampoId !==
                                                            null
                                                        }
                                                        title={t("config.fields.moveUp")}
                                                        aria-label={t("config.fields.moveUpAria", {name: campo.rotulo})}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${c.botaoSecundario}`}
                                                    >
                                                        ↑
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void moverCampo(
                                                                campo,
                                                                "baixo"
                                                            )
                                                        }
                                                        disabled={
                                                            indice ===
                                                            dados.campos.length -
                                                            1 ||
                                                            reordenandoCampoId !==
                                                            null
                                                        }
                                                        title={t("config.fields.moveDown")}
                                                        aria-label={t("config.fields.moveDownAria", {name: campo.rotulo})}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${c.botaoSecundario}`}
                                                    >
                                                        ↓
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirEditarCampo(
                                                                campo
                                                            )
                                                        }
                                                        disabled={
                                                            reordenandoCampoId !==
                                                            null
                                                        }
                                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${c.botaoSecundario}`}
                                                    >
                                                        ✏️ {t("common.edit")}
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>
            </div>

            {modalPublicarAberto && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4">
                    <div
                        className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${c.card}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl">
                                🚀
                            </div>

                            <div>
                                <h2
                                    className={`text-lg font-bold ${c.titulo}`}
                                >
                                    {t("config.publish.title")}
                                </h2>

                                <p
                                    className={`mt-2 text-sm leading-6 ${c.texto}`}
                                >
                                    {t("config.publish.description")}
                                </p>
                            </div>
                        </div>

                        {erroPublicacao && (
                            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                <p className="font-semibold">
                                    {erroPublicacao}
                                </p>

                                {pendenciasPublicacao.length >
                                    0 && (
                                        <ul className="mt-3 space-y-2">
                                            {pendenciasPublicacao.map(
                                                (
                                                    pendencia,
                                                    indice
                                                ) => (
                                                    <li
                                                        key={`${indice}-${pendencia}`}
                                                        className="flex gap-2"
                                                    >
                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            {
                                                                pendencia
                                                            }
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    )}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={
                                    fecharPublicacao
                                }
                                disabled={
                                    publicando
                                }
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${c.botaoSecundario}`}
                            >
                                {t("common.cancel")}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void publicarFormulario()
                                }
                                disabled={
                                    publicando
                                }
                                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {publicando
                                    ? t("config.publish.publishing")
                                    : t("config.publish.publishNow")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6 ${c.card}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    className={`text-xl font-bold ${c.titulo}`}
                                >
                                    {campoEmEdicao
                                        ? t("config.fieldModal.editTitle")
                                        : t("config.fieldModal.addTitle")}
                                </h2>

                                <p
                                    className={`mt-1 text-sm ${c.muted}`}
                                >
                                    {campoEmEdicao
                                        ? t("config.fieldModal.editDescription")
                                        : t("config.fieldModal.addDescription")}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharModal
                                }
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg ${c.botaoSecundario}`}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                salvarCampo
                            }
                            className="mt-6 space-y-5"
                        >
                            {erroFormulario && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {
                                        erroFormulario
                                    }
                                </div>
                            )}

                            <div>
                                <label
                                    className={`text-sm font-semibold ${c.titulo}`}
                                >
                                    {t("config.fieldModal.mappingLabel")}
                                </label>

                                <select
                                    value={
                                        formularioCampo
                                            .mapeamento
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        selecionarMapeamento(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                    style={{
                                        colorScheme:
                                            temaEscuro
                                                ? "dark"
                                                : "light",
                                    }}
                                >
                                    {dados
                                        .mapeamentosDisponiveis
                                        .filter(
                                            (item) =>
                                                item !==
                                                "CONSENTIMENTO" ||
                                                campoEmEdicao
                                                    ?.mapeamento ===
                                                "CONSENTIMENTO"
                                        )
                                        .map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    {nomeMapeamentoUi(
                                                        item
                                                    )}
                                                </option>
                                            )
                                        )}
                                </select>

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >
                                    {t("config.fieldModal.mappingHelp")}
                                </p>
                            </div>

                            {ehCampoConhecidoPhanyx(
                                formularioCampo.mapeamento
                            ) ? (
                                <>
                                    <div
                                        className={`rounded-2xl border p-4 ${c.subCard}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">
                                                {formularioCampo.mapeamento ===
                                                    "TELEFONE"
                                                    ? "📱"
                                                    : formularioCampo.mapeamento ===
                                                        "EMAIL"
                                                        ? "✉️"
                                                        : formularioCampo.mapeamento ===
                                                            "CURSO_INTERESSE_ID"
                                                            ? "🎓"
                                                            : formularioCampo.mapeamento ===
                                                                "POLO_INTERESSE_ID"
                                                                ? "📍"
                                                                : formularioCampo.mapeamento ===
                                                                    "CONSENTIMENTO"
                                                                    ? "🛡️"
                                                                    : "📝"}
                                            </span>

                                            <div>
                                                <p
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    {t("config.fieldModal.previewTitle")}
                                                </p>

                                                <p
                                                    className={`mt-0.5 text-xs ${c.muted}`}
                                                >
                                                    {t("config.fieldModal.previewHelp")}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={`mt-4 rounded-xl border p-4 ${c.card}`}
                                        >
                                            {formularioCampo.tipo ===
                                                "CONSENTIMENTO" ? (
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${c.divisoria}`}
                                                    />

                                                    <p
                                                        className={`text-sm ${c.texto}`}
                                                    >
                                                        {formularioCampo.rotulo}

                                                        {formularioCampo.obrigatorio && (
                                                            <span className="ml-1 text-red-500">
                                                                *
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <p
                                                        className={`text-sm font-semibold ${c.titulo}`}
                                                    >
                                                        {formularioCampo.rotulo}

                                                        {formularioCampo.obrigatorio && (
                                                            <span className="ml-1 text-red-500">
                                                                *
                                                            </span>
                                                        )}
                                                    </p>

                                                    {formularioCampo.mapeamento ===
                                                        "POLO_INTERESSE_ID" ? (
                                                        dados.referencias.polos.length ===
                                                            0 ? (
                                                            <div
                                                                className={
                                                                    temaEscuro
                                                                        ? "mt-2 rounded-xl border border-amber-800 bg-amber-950/40 px-3 py-3 text-sm text-amber-200"
                                                                        : "mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800"
                                                                }
                                                            >
                                                                ⚠️ {t("config.fieldModal.noUnits")}
                                                            </div>
                                                        ) : dados.referencias.polos.length ===
                                                            1 ? (
                                                            <div
                                                                className={`mt-2 rounded-xl border px-3 py-3 text-sm ${c.input}`}
                                                            >
                                                                <p className={`text-xs ${c.muted}`}>
                                                                    {t("config.fieldModal.autoUnit")}
                                                                </p>

                                                                <p
                                                                    className={`mt-1 font-semibold ${c.titulo}`}
                                                                >
                                                                    {
                                                                        dados.referencias
                                                                            .polos[0].nome
                                                                    }
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <select
                                                                    defaultValue=""
                                                                    className={`mt-2 w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                                    style={{
                                                                        colorScheme:
                                                                            temaEscuro
                                                                                ? "dark"
                                                                                : "light",
                                                                    }}
                                                                >
                                                                    <option
                                                                        value=""
                                                                        disabled
                                                                    >
                                                                        {t("config.defaults.unit.placeholder")}
                                                                    </option>

                                                                    {dados.referencias.polos.map(
                                                                        (polo) => (
                                                                            <option
                                                                                key={polo.id}
                                                                                value={polo.id}
                                                                            >
                                                                                {polo.nome}
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>

                                                                <p
                                                                    className={`mt-1.5 text-xs ${c.muted}`}
                                                                >
                                                                    {t("config.fieldModal.previewNotSaved")}
                                                                </p>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div
                                                            className={`mt-2 rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                        >
                                                            <span
                                                                className={
                                                                    temaEscuro
                                                                        ? "text-slate-500"
                                                                        : "text-slate-400"
                                                                }
                                                            >
                                                                {formularioCampo.placeholder ||
                                                                    t("config.fieldModal.fillHere")}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {formularioCampo.textoAjuda && (
                                                        <p
                                                            className={`mt-1.5 text-xs ${c.muted}`}
                                                        >
                                                            {
                                                                formularioCampo.textoAjuda
                                                            }
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <details
                                        className={`rounded-2xl border ${c.subCard}`}
                                    >
                                        <summary
                                            className={`cursor-pointer px-4 py-3 text-sm font-semibold ${c.titulo}`}
                                        >
                                            {t("config.fieldModal.customizeAppearance")}
                                        </summary>



                                        <div
                                            className={`space-y-4 border-t p-4 ${c.divisoria}`}
                                        >
                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    {t("config.fieldModal.displayLabel")}
                                                </label>

                                                <input
                                                    type="text"
                                                    value={
                                                        formularioCampo.rotulo
                                                    }
                                                    onChange={(event) =>
                                                        atualizarCampo(
                                                            "rotulo",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    {t("config.fieldModal.width")}
                                                </label>

                                                <select
                                                    value={
                                                        formularioCampo.largura
                                                    }
                                                    onChange={(event) =>
                                                        atualizarCampo(
                                                            "largura",
                                                            event.target.value
                                                        )
                                                    }
                                                    className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                >
                                                    <option value="12">
                                                        {t("shared.widths.full")}
                                                    </option>

                                                    <option value="6">
                                                        {t("shared.widths.half")}
                                                    </option>

                                                    <option value="4">
                                                        {t("shared.widths.third")}
                                                    </option>

                                                    <option value="3">
                                                        {t("shared.widths.quarter")}
                                                    </option>
                                                </select>
                                            </div>

                                            {formularioCampo.tipo !==
                                                "CONSENTIMENTO" && (
                                                    <>
                                                        <div>
                                                            <label
                                                                className={`text-sm font-semibold ${c.titulo}`}
                                                            >
                                                                {t("config.fieldModal.placeholderLabel")}
                                                            </label>

                                                            <input
                                                                type="text"
                                                                value={
                                                                    formularioCampo.placeholder
                                                                }
                                                                onChange={(event) =>
                                                                    atualizarCampo(
                                                                        "placeholder",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label
                                                                className={`text-sm font-semibold ${c.titulo}`}
                                                            >
                                                                {t("config.fieldModal.helpLabel")}
                                                            </label>

                                                            <textarea
                                                                rows={2}
                                                                value={
                                                                    formularioCampo.textoAjuda
                                                                }
                                                                onChange={(event) =>
                                                                    atualizarCampo(
                                                                        "textoAjuda",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                        </div>
                                    </details>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label
                                            className={`text-sm font-semibold ${c.titulo}`}
                                        >
                                            {t("config.fieldModal.displayLabel")} *
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                formularioCampo.rotulo
                                            }
                                            onChange={(event) =>
                                                atualizarCampo(
                                                    "rotulo",
                                                    event.target.value
                                                )
                                            }
                                            placeholder={t("config.fieldModal.customQuestionPlaceholder")}
                                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                className={`text-sm font-semibold ${c.titulo}`}
                                            >
                                                {t("config.fieldModal.answerType")}
                                            </label>

                                            <select
                                                value={
                                                    formularioCampo.tipo
                                                }
                                                onChange={(event) =>
                                                    atualizarCampo(
                                                        "tipo",
                                                        event.target.value
                                                    )
                                                }
                                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                            >
                                                {dados.tiposDisponiveis.map(
                                                    (tipo) => (
                                                        <option
                                                            key={tipo}
                                                            value={tipo}
                                                        >
                                                            {nomeTipoUi(tipo)}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                className={`text-sm font-semibold ${c.titulo}`}
                                            >
                                                {t("config.fieldModal.width")}
                                            </label>

                                            <select
                                                value={
                                                    formularioCampo.largura
                                                }
                                                onChange={(event) =>
                                                    atualizarCampo(
                                                        "largura",
                                                        event.target.value
                                                    )
                                                }
                                                className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                            >
                                                <option value="12">
                                                    {t("shared.widths.full")}
                                                </option>

                                                <option value="6">
                                                    {t("shared.widths.half")}
                                                </option>

                                                <option value="4">
                                                    {t("shared.widths.third")}
                                                </option>

                                                <option value="3">
                                                    {t("shared.widths.quarter")}
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className={`text-sm font-semibold ${c.titulo}`}
                                        >
                                            {t("config.fieldModal.placeholderHelp")}
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                formularioCampo.placeholder
                                            }
                                            onChange={(event) =>
                                                atualizarCampo(
                                                    "placeholder",
                                                    event.target.value
                                                )
                                            }
                                            placeholder={t("common.optional")}
                                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`text-sm font-semibold ${c.titulo}`}
                                        >
                                            {t("config.fieldModal.helpLabel")}
                                        </label>

                                        <textarea
                                            rows={2}
                                            value={
                                                formularioCampo.textoAjuda
                                            }
                                            onChange={(event) =>
                                                atualizarCampo(
                                                    "textoAjuda",
                                                    event.target.value
                                                )
                                            }
                                            placeholder={t("common.optional")}
                                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        />
                                    </div>
                                </>
                            )}

                            {(
                                formularioCampo.mapeamento ===
                                "CURSO_INTERESSE_ID" ||
                                formularioCampo.mapeamento ===
                                "POLO_INTERESSE_ID"
                            ) && (
                                    <div
                                        className={
                                            temaEscuro
                                                ? "rounded-2xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-200"
                                                : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                                        }
                                    >
                                        <p className="font-semibold">
                                            ✓ {t("config.fieldModal.autoListTitle")}
                                        </p>

                                        <p className="mt-1 leading-6">
                                            {formularioCampo.mapeamento ===
                                                "CURSO_INTERESSE_ID"
                                                ? t("config.fieldModal.autoCourseDescription")
                                                : t("config.fieldModal.autoUnitDescription")}
                                        </p>
                                    </div>
                                )}

                            {ehCampoComOpcoesManuais(
                                formularioCampo.tipo,
                                formularioCampo.mapeamento
                            ) && (
                                    <div>
                                        <label
                                            className={`text-sm font-semibold ${c.titulo}`}
                                        >
                                            {t("config.fieldModal.options")}
                                        </label>

                                        <p
                                            className={`mt-1 text-xs ${c.muted}`}
                                        >
                                            {t("config.fieldModal.optionsHelp")}
                                        </p>

                                        <textarea
                                            rows={5}
                                            value={
                                                formularioCampo
                                                    .opcoesTexto
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                atualizarCampo(
                                                    "opcoesTexto",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={t("config.fieldModal.optionsPlaceholder")}
                                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        />
                                    </div>
                                )}

                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${c.subCard}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        formularioCampo
                                            .obrigatorio
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        atualizarCampo(
                                            "obrigatorio",
                                            event
                                                .target
                                                .checked
                                        )
                                    }
                                    className="mt-1 h-4 w-4"
                                />

                                <div>
                                    <p
                                        className={`text-sm font-semibold ${c.titulo}`}
                                    >
                                        {t("config.fieldModal.requiredTitle")}
                                    </p>

                                    <p
                                        className={`mt-1 text-xs ${c.muted}`}
                                    >
                                        {t("config.fieldModal.requiredHelp")}
                                    </p>
                                </div>
                            </label>

                            <details
                                className={`rounded-2xl border p-4 ${c.subCard}`}
                            >
                                <summary
                                    className={`cursor-pointer text-sm font-semibold ${c.titulo}`}
                                >
                                    {t("config.fieldModal.technicalSettings")}
                                </summary>

                                <p
                                    className={`mb-4 text-xs leading-5 ${c.muted}`}
                                >
                                    {t("config.fieldModal.technicalHelp")}
                                </p>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label
                                            className={`text-xs font-semibold ${c.titulo}`}
                                        >
                                            {t("config.fieldModal.internalKey")}
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                formularioCampo
                                                    .chave
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                atualizarCampo(
                                                    "chave",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            placeholder={t("config.fieldModal.internalKeyPlaceholder")}
                                            className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        />
                                        <p
                                            className={`mt-1 text-xs ${c.muted}`}
                                        >
                                            {t("config.fieldModal.internalKeyHelp")}
                                        </p>
                                    </div>

                                </div>
                            </details>

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
                                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${c.botaoSecundario}`}
                                >
                                    {t("common.cancel")}
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60 ${c.botaoPrimario}`}
                                >
                                    {salvando
                                        ? (
                                            campoEmEdicao
                                                ? t("common.saving")
                                                : t("config.fieldModal.adding")
                                        )
                                        : (
                                            campoEmEdicao
                                                ? t("common.saveChanges")
                                                : t("config.actions.addField")
                                        )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}