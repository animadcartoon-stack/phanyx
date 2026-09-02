"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import {
    useTranslations,
} from "next-intl";

import Link from "next/link";
import { useParams } from "next/navigation";
import type {
    CountryCode,
} from "libphonenumber-js";

import CampoTelefoneInternacional from "@/components/comercial/captacao/CampoTelefoneInternacional";

type Tema =
    | "light"
    | "dark"
    | "system";

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
        if (
            !Number.isInteger(
                formularioId
            ) ||
            formularioId <= 0
        ) {
            setErro(
                t("preview.errors.invalidForm")
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
                        t("preview.errors.load")
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
                        : t("preview.errors.load")
                );
            } finally {
                setCarregando(
                    false
                );
            }
        }

        void carregar();
    }, [formularioId]);

    const temaAzul =
        temaEscolhido ===
        "dark";

    const c = {
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

        input:
            temaAzul
                ? "border-blue-900 bg-blue-950/70 text-blue-50 placeholder:text-blue-200/50"
                : temaEscuro
                    ? "border-neutral-600 bg-neutral-800 text-neutral-100 placeholder:text-neutral-400"
                    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",

        secundario:
            temaAzul
                ? "border-blue-900 bg-[#0f1a33] text-blue-50 hover:bg-[#162447]"
                : temaEscuro
                    ? "border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
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
                    {t("preview.loading")}
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
                            t("preview.errors.notFound")}
                    </p>

                    <Link
                        href={`/admin/comercial/captacao/formularios/${formularioId}`}
                        className={`mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold ${c.secundario}`}
                    >
                        ← {t("common.back")}
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
                        temaAzul
                            ? "rounded-2xl border border-blue-800 bg-blue-950/60 px-4 py-3 text-sm text-blue-100"
                            : temaEscuro
                                ? "rounded-2xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-sm text-neutral-200"
                                : "rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
                    }
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">
                                👁️ {t("preview.banner.title")}
                            </p>

                            <p className="mt-1">
                                {t("preview.banner.description")}
                            </p>
                        </div>

                        <Link
                            href={`/admin/comercial/captacao/formularios/${formularioId}`}
                            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold ${c.secundario}`}
                        >
                            ← {t("preview.banner.backToConfig")}
                        </Link>
                    </div>
                </div>

                <section
                    className={`overflow-hidden rounded-3xl border shadow-sm ${c.card}`}
                >
                    <div
                        className={
                            temaAzul
                                ? "border-b border-blue-950 p-6 sm:p-8"
                                : temaEscuro
                                    ? "border-b border-neutral-700 p-6 sm:p-8"
                                    : "border-b border-slate-200 p-6 sm:p-8"
                        }
                    >
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
                                    ✓ {t("preview.simulation.title")}
                                </p>

                                <p className="mt-1 text-sm">
                                    {dados
                                        .formulario
                                        .mensagemSucesso ||
                                        t("preview.defaultSuccess")}
                                </p>

                                <p className="mt-2 text-xs opacity-80">
                                    {t("preview.simulation.notice")}
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
                                                            style={{
                                                                colorScheme:
                                                                    temaEscuro
                                                                        ? "dark"
                                                                        : "light",
                                                            }}
                                                        >
                                                            <option
                                                                value=""
                                                                disabled={
                                                                    campo.obrigatorio
                                                                }
                                                            >
                                                                {campo.placeholder ||
                                                                    t("preview.selectOption")}
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
                                                            placeholder={t("preview.phonePlaceholder")}
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

                                                    {(
                                                        campo.tipo ===
                                                        "TELEFONE" ||
                                                        campo.textoAjuda
                                                    ) && (
                                                            <p
                                                                className={`mt-1.5 text-xs leading-5 ${c.muted}`}
                                                            >
                                                                {campo.tipo ===
                                                                    "TELEFONE"
                                                                    ? t("preview.phoneHelp")
                                                                    : campo.textoAjuda}
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
                                                t("preview.defaultConsent")}
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
                                                {t("preview.privacyPolicy")}
                                            </a>
                                        )}
                                </div>
                            )}

                        <button
                            type="submit"
                            className={
                                temaAzul
                                    ? "mt-7 w-full rounded-xl border border-blue-700 bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    : temaEscuro
                                        ? "mt-7 w-full rounded-xl border border-neutral-700 bg-neutral-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        : "mt-7 w-full rounded-xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            }
                        >
                            {t("preview.submit")}
                        </button>

                        <p
                            className={`mt-3 text-center text-xs ${c.muted}`}
                        >
                            {t("preview.footer")}
                        </p>
                    </form>
                </section>
            </div>
        </main>
    );
}