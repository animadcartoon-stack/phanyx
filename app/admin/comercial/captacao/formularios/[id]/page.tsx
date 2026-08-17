"use client";

import Link from "next/link";
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
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

function nomeTipo(
    tipo: string
) {
    const mapa:
        Record<string, string> = {
        TEXTO_CURTO:
            "Texto curto",

        TEXTO_LONGO:
            "Texto longo",

        EMAIL:
            "E-mail",

        TELEFONE:
            "Telefone / WhatsApp",

        NUMERO:
            "Número",

        DATA:
            "Data",

        SELECAO_UNICA:
            "Seleção única",

        SELECAO_MULTIPLA:
            "Seleção múltipla",

        CHECKBOX:
            "Caixa de seleção",

        CONSENTIMENTO:
            "Consentimento",

        OCULTO:
            "Campo oculto",
    };

    return (
        mapa[tipo] ??
        tipo
    );
}

function nomeMapeamento(
    valor: string
) {
    const mapa:
        Record<string, string> = {
        NOME:
            "Nome do interessado",

        EMAIL:
            "E-mail",

        TELEFONE:
            "Telefone / WhatsApp",

        INSTITUICAO_NOME:
            "Instituição / empresa",

        CARGO:
            "Cargo / função",

        INTERESSE:
            "Interesse",

        OBSERVACOES:
            "Observações",

        CURSO_INTERESSE_ID:
            "Curso de interesse",

        POLO_INTERESSE_ID:
            "Polo de interesse",

        CONSENTIMENTO:
            "Consentimento LGPD",

        PERSONALIZADO:
            "Campo personalizado",
    };

    return (
        mapa[valor] ??
        valor
    );
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
    const params =
        useParams();

    const formularioId =
        Number(
            params.id
        );

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
                        "Formulário inválido."
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
                            "Não foi possível carregar os campos."
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
                            : "Não foi possível carregar os campos."
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
                    "Não foi possível alterar a ordem dos campos."
                );
            }

            setToast(
                "Ordem dos campos atualizada."
            );

            await carregar(
                true
            );
        } catch (error) {
            setToast(
                error instanceof Error
                    ? error.message
                    : "Não foi possível alterar a ordem dos campos."
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
                    "Nome completo",

                placeholder:
                    "Digite seu nome completo",

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
                    "E-mail",

                placeholder:
                    "nome@exemplo.com",

                textoAjuda:
                    "Informe um e-mail válido para receber nosso contato.",

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
                    "Telefone / WhatsApp",

                placeholder:
                    "(11) 98765-4321",

                textoAjuda:
                    "Informe seu número com DDD. Ex.: (11) 98765-4321",

                mascara:
                    "(00) 00000-0000",

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
                    "Instituição / empresa",

                placeholder:
                    "Digite o nome da instituição ou empresa",

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
                    "Cargo / função",

                placeholder:
                    "Ex.: Diretor, coordenador, professor",

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
                    "O que você procura?",

                placeholder:
                    "Conte brevemente o que você procura",

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
                    "Mensagem ou observações",

                placeholder:
                    "Escreva aqui se quiser acrescentar alguma informação",

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
                    "Curso de interesse",

                placeholder:
                    "Selecione um curso",

                textoAjuda:
                    "Escolha o curso sobre o qual deseja receber informações.",

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
                    "Onde você prefere estudar?",

                placeholder:
                    "Selecione uma unidade",

                textoAjuda:
                    "Escolha a unidade ou polo de sua preferência.",

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
                    "Li e concordo com a Política de Privacidade",

                placeholder:
                    "",

                textoAjuda:
                    "O consentimento é necessário para o tratamento dos dados informados.",

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
                "Informe o nome exibido para este campo."
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
                        "Informe pelo menos uma opção para este campo."
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
                    "Não foi possível salvar o campo."
                );
            }

            setModalAberto(
                false
            );

            setToast(
                json.message ||
                (
                    campoEmEdicao
                        ? "Campo atualizado com sucesso."
                        : "Campo adicionado com sucesso."
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
                    : "Não foi possível adicionar o campo."
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
                        Não foi possível abrir o formulário
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
                        Voltar
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
                                ← Formulários de captação
                            </Link>

                            <h1
                                className={`mt-3 text-2xl font-bold sm:text-3xl ${c.titulo}`}
                            >
                                ⚙️ Configurar formulário
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
                                    {nomeStatus(
                                        dados
                                            .formulario
                                            .status
                                    )}
                                </span>

                                <span
                                    className={`rounded-full border px-2.5 py-1 text-xs ${c.subCard}`}
                                >
                                    Versão{" "}
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
                                    ? "Atualizando..."
                                    : "↻ Atualizar"}
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
                                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        + Adicionar campo
                                    </button>
                                )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <div
                        className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
                    >
                        <p
                            className={`text-sm ${c.muted}`}
                        >
                            Total de campos
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
                            Campos ativos
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
                            Obrigatórios
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
                            Campos do formulário
                        </h2>

                        <p
                            className={`mt-1 text-sm ${c.muted}`}
                        >
                            Os campos aparecem para o interessado na ordem abaixo.
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
                                Nenhum campo configurado
                            </p>

                            <p
                                className={`mt-1 text-sm ${c.muted}`}
                            >
                                Adicione os campos que o interessado deverá preencher.
                            </p>

                            {dados
                                .permissoes
                                .podeGerenciar && (
                                    <button
                                        type="button"
                                        onClick={
                                            abrirNovoCampo
                                        }
                                        className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        + Adicionar primeiro campo
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
                                                                Obrigatório
                                                            </span>
                                                        )}

                                                        {!campo.ativo && (
                                                            <span
                                                                className={`rounded-full border px-2 py-0.5 text-[11px] ${c.muted}`}
                                                            >
                                                                Inativo
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p
                                                        className={`mt-1 text-xs ${c.muted}`}
                                                    >
                                                        {nomeTipo(
                                                            campo.tipo
                                                        )}
                                                        {" • "}
                                                        {nomeMapeamento(
                                                            campo.mapeamento
                                                        )}
                                                        {" • "}
                                                        Largura{" "}
                                                        {
                                                            campo.largura
                                                        }
                                                        /12
                                                    </p>

                                                    <p
                                                        className={`mt-1 text-xs ${c.muted}`}
                                                    >
                                                        Chave:{" "}
                                                        {
                                                            campo.chave
                                                        }
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
                                                        title="Mover para cima"
                                                        aria-label={`Mover ${campo.rotulo} para cima`}
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
                                                        title="Mover para baixo"
                                                        aria-label={`Mover ${campo.rotulo} para baixo`}
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
                                                        ✏️ Editar
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
                                        ? "Editar campo"
                                        : "Adicionar campo"}
                                </h2>

                                <p
                                    className={`mt-1 text-sm ${c.muted}`}
                                >
                                    {campoEmEdicao
                                        ? "Ajuste como esta informação será solicitada ao interessado."
                                        : "Defina o que o interessado deverá informar."}
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
                                    Qual informação você quer pedir?
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
                                >
                                    {dados
                                        .mapeamentosDisponiveis
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
                                                    {nomeMapeamento(
                                                        item
                                                    )}
                                                </option>
                                            )
                                        )}
                                </select>

                                <p
                                    className={`mt-1 text-xs ${c.muted}`}
                                >
                                    Escolha a informação que deseja solicitar. O PHANYX configura automaticamente como ela será usada.
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
                                                    Como aparecerá para o interessado
                                                </p>

                                                <p
                                                    className={`mt-0.5 text-xs ${c.muted}`}
                                                >
                                                    O PHANYX preparou este campo automaticamente.
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
                                                                ⚠️ Nenhuma unidade ativa está disponível no momento.
                                                            </div>
                                                        ) : dados.referencias.polos.length ===
                                                            1 ? (
                                                            <div
                                                                className={`mt-2 rounded-xl border px-3 py-3 text-sm ${c.input}`}
                                                            >
                                                                <p className={`text-xs ${c.muted}`}>
                                                                    Unidade selecionada automaticamente
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
                                                                >
                                                                    <option
                                                                        value=""
                                                                        disabled
                                                                    >
                                                                        Selecione uma unidade
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
                                                                    Pré-visualização. A escolha feita aqui não será salva.
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
                                                                    "Preencha aqui"}
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
                                            Personalizar como aparece
                                        </summary>



                                        <div
                                            className={`space-y-4 border-t p-4 ${c.divisoria}`}
                                        >
                                            <div>
                                                <label
                                                    className={`text-sm font-semibold ${c.titulo}`}
                                                >
                                                    Pergunta ou nome exibido
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
                                                    Tamanho na tela
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
                                                        Linha inteira
                                                    </option>

                                                    <option value="6">
                                                        Metade da linha
                                                    </option>

                                                    <option value="4">
                                                        Um terço
                                                    </option>

                                                    <option value="3">
                                                        Um quarto
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
                                                                Exemplo mostrado no campo
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
                                                                Orientação para quem vai preencher
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
                                            Pergunta ou nome exibido *
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
                                            placeholder="Ex.: Como podemos ajudar?"
                                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                className={`text-sm font-semibold ${c.titulo}`}
                                            >
                                                Que tipo de resposta deseja receber?
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
                                                            {nomeTipo(tipo)}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                className={`text-sm font-semibold ${c.titulo}`}
                                            >
                                                Tamanho na tela
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
                                                    Linha inteira
                                                </option>

                                                <option value="6">
                                                    Metade da linha
                                                </option>

                                                <option value="4">
                                                    Um terço
                                                </option>

                                                <option value="3">
                                                    Um quarto
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className={`text-sm font-semibold ${c.titulo}`}
                                        >
                                            Exemplo para ajudar no preenchimento
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
                                            placeholder="Opcional"
                                            className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`text-sm font-semibold ${c.titulo}`}
                                        >
                                            Orientação para quem vai preencher
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
                                            placeholder="Opcional"
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
                                            ✓ Lista atualizada automaticamente
                                        </p>

                                        <p className="mt-1 leading-6">
                                            {formularioCampo.mapeamento ===
                                                "CURSO_INTERESSE_ID"
                                                ? "O PHANYX exibirá automaticamente os cursos ativos da instituição. Você não precisa cadastrar as opções manualmente."
                                                : "O PHANYX verificará as unidades disponíveis automaticamente. Se houver apenas uma, ela será selecionada sem perguntar ao interessado. Se houver várias, o formulário mostrará as opções para escolha."}
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
                                            Opções
                                        </label>

                                        <p
                                            className={`mt-1 text-xs ${c.muted}`}
                                        >
                                            Digite uma opção por linha.
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
                                            placeholder={"Opção 1\nOpção 2\nOpção 3"}
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
                                        Preenchimento obrigatório
                                    </p>

                                    <p
                                        className={`mt-1 text-xs ${c.muted}`}
                                    >
                                        O interessado não poderá enviar o formulário sem preencher este campo.
                                    </p>
                                </div>
                            </label>

                            <details
                                className={`rounded-2xl border p-4 ${c.subCard}`}
                            >
                                <summary
                                    className={`cursor-pointer text-sm font-semibold ${c.titulo}`}
                                >
                                    Configurações técnicas
                                </summary>

                                <p
                                    className={`mb-4 text-xs leading-5 ${c.muted}`}
                                >
                                    Esta área normalmente não precisa ser alterada.
                                </p>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label
                                            className={`text-xs font-semibold ${c.titulo}`}
                                        >
                                            Identificador interno
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
                                            placeholder="Gerada automaticamente"
                                            className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`}
                                        />
                                        <p
                                            className={`mt-1 text-xs ${c.muted}`}
                                        >
                                            O PHANYX usa este identificador internamente. Evite alterá-lo depois que o formulário começar a receber respostas.
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
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {salvando
                                        ? (
                                            campoEmEdicao
                                                ? "Salvando..."
                                                : "Adicionando..."
                                        )
                                        : (
                                            campoEmEdicao
                                                ? "Salvar alterações"
                                                : "Adicionar campo"
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