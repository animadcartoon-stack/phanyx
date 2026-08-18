"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import type {
    CountryCode,
} from "libphonenumber-js";

import CampoTelefoneInternacional from "@/components/comercial/captacao/CampoTelefoneInternacional";

type Campo = {
    id: number;
    chave: string;
    rotulo: string;
    tipo: string;
    mapeamento: string;

    placeholder:
    string | null;

    textoAjuda:
    string | null;

    valorPadrao:
    string | null;

    mascara:
    string | null;

    obrigatorio: boolean;
    ativo: boolean;

    ordem: number;
    largura: number;

    opcoes: unknown;
    validacoes: unknown;
};

type Referencia = {
    id: number;
    nome: string;
};

type RespostaFormulario = {
    success: true;

    formulario: {
        id: number;
        titulo: string;

        descricao:
        string | null;

        mensagemSucesso:
        string | null;

        status: string;

        exigeConsentimento:
        boolean;

        textoConsentimento:
        string | null;

        politicaPrivacidadeUrl:
        string | null;

        campos:
        Campo[];
    };

    referencias: {
        cursos:
        Referencia[];

        polos:
        Referencia[];
    };
};

type Opcao = {
    value: string;
    label: string;
};

function larguraClasse(
    largura: number
) {
    if (largura === 6) {
        return "md:col-span-6";
    }

    if (largura === 4) {
        return "md:col-span-4";
    }

    if (largura === 3) {
        return "md:col-span-3";
    }

    return "md:col-span-12";
}

function transformarOpcoes(
    valor: unknown
): Opcao[] {
    if (!Array.isArray(valor)) {
        return [];
    }

    return valor
        .map((item) => {
            if (
                typeof item ===
                "string" ||
                typeof item ===
                "number"
            ) {
                return {
                    value:
                        String(item),

                    label:
                        String(item),
                };
            }

            if (
                item &&
                typeof item ===
                "object" &&
                !Array.isArray(
                    item
                )
            ) {
                const registro =
                    item as Record<
                        string,
                        unknown
                    >;

                const value =
                    String(
                        registro.value ??
                        registro.id ??
                        ""
                    ).trim();

                const label =
                    String(
                        registro.label ??
                        registro.nome ??
                        registro.value ??
                        ""
                    ).trim();

                if (
                    value &&
                    label
                ) {
                    return {
                        value,
                        label,
                    };
                }
            }

            return null;
        })
        .filter(
            (
                item
            ): item is Opcao =>
                item !== null
        );
}

export default function VisualizarFormularioCaptacaoPage() {
    const params =
        useParams();

    const formularioId =
        Number(
            params.id
        );

    const [
        dados,
        setDados,
    ] =
        useState<RespostaFormulario | null>(
            null
        );

    const [
        carregando,
        setCarregando,
    ] =
        useState(true);

    const [
        erro,
        setErro,
    ] =
        useState("");

    const [
        temaEscuro,
        setTemaEscuro,
    ] =
        useState(false);

    const [
        simulouEnvio,
        setSimulouEnvio,
    ] =
        useState(false);

    const [
        telefones,
        setTelefones,
    ] = useState<
        Record<string, string>
    >({});

    const [
        paisesTelefone,
        setPaisesTelefone,
    ] = useState<
        Record<
            string,
            CountryCode
        >
    >({});

    useEffect(() => {
        function calcularTema() {
            const tema =
                localStorage.getItem(
                    "phanyx_tema"
                ) ||
                "system";

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

        async function carregar() {
            try {
                setCarregando(
                    true
                );

                setErro("");

                const resposta =
                    await fetch(
                        `/api/admin/comercial/captacao/formularios/${formularioId}`,
                        {
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
                    | RespostaFormulario
                    | {
                        success?:
                        false;

                        error?:
                        string;
                    };

                if (
                    !resposta.ok ||
                    json.success !==
                    true
                ) {
                    throw new Error(
                        (
                            "error" in
                                json
                                ? json.error
                                : null
                        ) ||
                        "Não foi possível carregar a pré-visualização."
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
                        : "Não foi possível carregar a pré-visualização."
                );
            } finally {
                setCarregando(
                    false
                );
            }
        }

        void carregar();
    }, [formularioId]);

    const c = {
        pagina:
            temaEscuro
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-900",

        card:
            temaEscuro
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white",

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

        input:
            temaEscuro
                ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

        secundario:
            temaEscuro
                ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50",
    };

    function obterOpcoes(
        campo: Campo
    ) {
        if (!dados) {
            return [];
        }

        if (
            campo.mapeamento ===
            "CURSO_INTERESSE_ID"
        ) {
            return dados
                .referencias
                .cursos
                .map(
                    (
                        curso
                    ) => ({
                        value:
                            String(
                                curso.id
                            ),

                        label:
                            curso.nome,
                    })
                );
        }

        if (
            campo.mapeamento ===
            "POLO_INTERESSE_ID"
        ) {
            return dados
                .referencias
                .polos
                .map(
                    (
                        polo
                    ) => ({
                        value:
                            String(
                                polo.id
                            ),

                        label:
                            polo.nome,
                    })
                );
        }

        return transformarOpcoes(
            campo.opcoes
        );
    }

    function enviarSimulacao(
        event: FormEvent
    ) {
        event.preventDefault();

        setSimulouEnvio(
            true
        );

        window.scrollTo({
            top: 0,
            behavior:
                "smooth",
        });
    }

    if (carregando) {
        return (
            <main
                className={`min-h-screen p-6 ${c.pagina}`}
            >
                <div className="mx-auto max-w-4xl">
                    Carregando pré-visualização...
                </div>
            </main>
        );
    }

    if (
        erro ||
        !dados
    ) {
        return (
            <main
                className={`min-h-screen p-6 ${c.pagina}`}
            >
                <div
                    className={`mx-auto max-w-4xl rounded-3xl border p-6 ${c.card}`}
                >
                    <p className="font-semibold text-red-600">
                        {erro ||
                            "Formulário não encontrado."}
                    </p>

                    <Link
                        href={`/admin/comercial/captacao/formularios/${formularioId}`}
                        className={`mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold ${c.secundario}`}
                    >
                        ← Voltar
                    </Link>
                </div>
            </main>
        );
    }

    const campos =
        dados.formulario.campos
            .filter(
                (campo) =>
                    campo.ativo
            )
            .filter(
                (campo) => {
                    /*
                     * Com apenas uma unidade,
                     * o formulário público
                     * selecionará o polo
                     * automaticamente.
                     */
                    if (
                        campo.mapeamento ===
                        "POLO_INTERESSE_ID" &&
                        dados.referencias
                            .polos.length ===
                        1
                    ) {
                        return false;
                    }

                    return (
                        campo.tipo !==
                        "OCULTO"
                    );
                }
            );

    return (
        <main
            className={`min-h-screen px-4 py-8 sm:px-6 ${c.pagina}`}
        >
            <div className="mx-auto max-w-4xl space-y-5">
                <div
                    className={
                        temaEscuro
                            ? "rounded-2xl border border-blue-900 bg-blue-950/40 px-4 py-3 text-sm text-blue-200"
                            : "rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
                    }
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">
                                👁️ Pré-visualização
                            </p>

                            <p className="mt-1">
                                Você está vendo como este formulário aparecerá para o interessado. Nenhuma resposta será enviada.
                            </p>
                        </div>

                        <Link
                            href={`/admin/comercial/captacao/formularios/${formularioId}`}
                            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold ${c.secundario}`}
                        >
                            ← Voltar à configuração
                        </Link>
                    </div>
                </div>

                <section
                    className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
                >
                    <div className="border-b border-slate-200 p-6 sm:p-8">
                        <h1
                            className={`text-2xl font-bold sm:text-3xl ${c.titulo}`}
                        >
                            {
                                dados
                                    .formulario
                                    .titulo
                            }
                        </h1>

                        {dados.formulario
                            .descricao && (
                                <p
                                    className={`mt-3 leading-7 ${c.texto}`}
                                >
                                    {
                                        dados
                                            .formulario
                                            .descricao
                                    }
                                </p>
                            )}
                    </div>

                    <form
                        onSubmit={
                            enviarSimulacao
                        }
                        className="p-6 sm:p-8"
                    >
                        {simulouEnvio && (
                            <div
                                className={
                                    temaEscuro
                                        ? "mb-6 rounded-2xl border border-emerald-900 bg-emerald-950/40 p-4 text-emerald-200"
                                        : "mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
                                }
                            >
                                <p className="font-semibold">
                                    ✓ Simulação concluída
                                </p>

                                <p className="mt-1 text-sm">
                                    {dados
                                        .formulario
                                        .mensagemSucesso ||
                                        "Seus dados foram recebidos com sucesso."}
                                </p>

                                <p className="mt-2 text-xs opacity-80">
                                    Esta foi apenas uma pré-visualização. Nenhum lead foi criado.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-5">
                            {campos.map(
                                (
                                    campo
                                ) => {
                                    const opcoes =
                                        obterOpcoes(
                                            campo
                                        );

                                    const comum =
                                        `mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${c.input}`;

                                    return (
                                        <div
                                            key={
                                                campo.id
                                            }
                                            className={`col-span-12 ${larguraClasse(
                                                campo.largura
                                            )}`}
                                        >
                                            {campo.tipo ===
                                                "CHECKBOX" ||
                                                campo.tipo ===
                                                "CONSENTIMENTO" ? (
                                                <label
                                                    className={`flex items-start gap-3 text-sm ${c.texto}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        required={
                                                            campo.obrigatorio
                                                        }
                                                        className="mt-1 h-4 w-4"
                                                    />

                                                    <span>
                                                        {
                                                            campo.rotulo
                                                        }

                                                        {campo.obrigatorio && (
                                                            <span className="ml-1 text-red-500">
                                                                *
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                            ) : (
                                                <>
                                                    <label
                                                        className={`text-sm font-semibold ${c.titulo}`}
                                                    >
                                                        {
                                                            campo.rotulo
                                                        }

                                                        {campo.obrigatorio && (
                                                            <span className="ml-1 text-red-500">
                                                                *
                                                            </span>
                                                        )}
                                                    </label>

                                                    {campo.tipo ===
                                                        "TEXTO_LONGO" ? (
                                                        <textarea
                                                            rows={
                                                                4
                                                            }
                                                            required={
                                                                campo.obrigatorio
                                                            }
                                                            placeholder={
                                                                campo.placeholder ??
                                                                ""
                                                            }
                                                            defaultValue={
                                                                campo.valorPadrao ??
                                                                ""
                                                            }
                                                            className={
                                                                comum
                                                            }
                                                        />
                                                    ) : campo.tipo ===
                                                        "SELECAO_UNICA" ? (
                                                        <select
                                                            required={
                                                                campo.obrigatorio
                                                            }
                                                            defaultValue=""
                                                            className={
                                                                comum
                                                            }
                                                        >
                                                            <option
                                                                value=""
                                                                disabled={
                                                                    campo.obrigatorio
                                                                }
                                                            >
                                                                {campo.placeholder ||
                                                                    "Selecione uma opção"}
                                                            </option>

                                                            {opcoes.map(
                                                                (
                                                                    opcao
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            opcao.value
                                                                        }
                                                                        value={
                                                                            opcao.value
                                                                        }
                                                                    >
                                                                        {
                                                                            opcao.label
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    ) : campo.tipo ===
                                                        "SELECAO_MULTIPLA" ? (
                                                        <div
                                                            className={`mt-2 space-y-2 rounded-xl border p-3 ${c.input}`}
                                                        >
                                                            {opcoes.map(
                                                                (
                                                                    opcao
                                                                ) => (
                                                                    <label
                                                                        key={
                                                                            opcao.value
                                                                        }
                                                                        className="flex items-center gap-2 text-sm"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            value={
                                                                                opcao.value
                                                                            }
                                                                        />

                                                                        {
                                                                            opcao.label
                                                                        }
                                                                    </label>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : campo.tipo ===
                                                        "TELEFONE" ? (
                                                        <CampoTelefoneInternacional
                                                            value={
                                                                telefones[
                                                                campo.chave
                                                                ] ??
                                                                campo.valorPadrao ??
                                                                ""
                                                            }
                                                            pais={
                                                                paisesTelefone[
                                                                campo.chave
                                                                ] ?? "BR"
                                                            }
                                                            required={
                                                                campo.obrigatorio
                                                            }
                                                            placeholder="Digite seu telefone"
                                                            onChange={(
                                                                valor,
                                                                pais
                                                            ) => {
                                                                setTelefones(
                                                                    (
                                                                        atual
                                                                    ) => ({
                                                                        ...atual,
                                                                        [campo.chave]:
                                                                            valor,
                                                                    })
                                                                );

                                                                setPaisesTelefone(
                                                                    (
                                                                        atual
                                                                    ) => ({
                                                                        ...atual,
                                                                        [campo.chave]:
                                                                            pais,
                                                                    })
                                                                );
                                                            }}
                                                        />
                                                    ) : (
                                                        <input
                                                            type={
                                                                campo.tipo ===
                                                                    "EMAIL"
                                                                    ? "email"
                                                                    : campo.tipo ===
                                                                        "NUMERO"
                                                                        ? "number"
                                                                        : campo.tipo ===
                                                                            "DATA"
                                                                            ? "date"
                                                                            : "text"
                                                            }

                                                            autoComplete={
                                                                campo.mapeamento ===
                                                                    "NOME"
                                                                    ? "name"
                                                                    : campo.mapeamento ===
                                                                        "EMAIL"
                                                                        ? "email"
                                                                        : undefined
                                                            }

                                                            required={
                                                                campo.obrigatorio
                                                            }

                                                            placeholder={
                                                                campo.placeholder ??
                                                                ""
                                                            }

                                                            defaultValue={
                                                                campo.valorPadrao ??
                                                                ""
                                                            }

                                                            className={
                                                                comum
                                                            }
                                                        />
                                                    )}

                                                    {campo.textoAjuda && (
                                                        <p
                                                            className={`mt-1.5 text-xs leading-5 ${c.muted}`}
                                                        >
                                                            {
                                                                campo.textoAjuda
                                                            }
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        {dados.formulario
                            .exigeConsentimento && (
                                <div
                                    className={`mt-7 rounded-2xl border p-4 ${c.card}`}
                                >
                                    <label
                                        className={`flex items-start gap-3 text-sm leading-6 ${c.texto}`}
                                    >
                                        <input
                                            type="checkbox"
                                            required
                                            className="mt-1 h-4 w-4 shrink-0"
                                        />

                                        <span>
                                            {dados
                                                .formulario
                                                .textoConsentimento ||
                                                "Autorizo o uso dos dados informados neste formulário para atendimento relacionado ao meu interesse."}
                                        </span>
                                    </label>

                                    {dados
                                        .formulario
                                        .politicaPrivacidadeUrl && (
                                            <a
                                                href={
                                                    dados
                                                        .formulario
                                                        .politicaPrivacidadeUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex pl-7 text-sm font-semibold text-blue-600 hover:underline"
                                            >
                                                Consultar Política de Privacidade
                                            </a>
                                        )}
                                </div>
                            )}

                        <button
                            type="submit"
                            className="mt-7 w-full rounded-xl border border-slate-900 !bg-slate-900 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition hover:!bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Enviar formulário
                        </button>

                        <p
                            className={`mt-3 text-center text-xs ${c.muted}`}
                        >
                            Pré-visualização administrativa — nenhum dado será enviado.
                        </p>
                    </form>
                </section>
            </div>
        </main>
    );
}