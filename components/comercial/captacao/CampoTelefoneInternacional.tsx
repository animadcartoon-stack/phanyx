"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    CountryCode,
} from "libphonenumber-js";

import {
    detectarPaisTelefone,
    formatarTelefonePorPais,
    PAISES_TELEFONE,
} from "@/lib/comercial/captacao/telefone";

type Props = {
    value: string;
    pais: CountryCode;

    onChange: (
        valor: string,
        pais: CountryCode
    ) => void;

    erro?: string;
    disabled?: boolean;
    placeholder?: string;
    required?: boolean;
};

function bandeiraPais(
    codigo: CountryCode
) {
    return String(codigo)
        .toUpperCase()
        .replace(
            /./g,
            (letra) =>
                String.fromCodePoint(
                    127397 +
                    letra.charCodeAt(0)
                )
        );
}

function normalizarBusca(
    valor: string
) {
    return valor
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}

export default function CampoTelefoneInternacional({
    value,
    pais,
    onChange,
    erro,
    disabled = false,
    required = false,
    placeholder = "Digite seu telefone",
}: Props) {
    const [
        aberto,
        setAberto,
    ] = useState(false);

    const [
        busca,
        setBusca,
    ] = useState("");

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    useEffect(() => {
        function fecharAoClicarFora(
            event: MouseEvent
        ) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                setAberto(false);
            }
        }

        document.addEventListener(
            "mousedown",
            fecharAoClicarFora
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                fecharAoClicarFora
            );
        };
    }, []);

    const paisAtual =
        useMemo(
            () =>
                PAISES_TELEFONE.find(
                    (item) =>
                        item.codigo === pais
                ) ??
                PAISES_TELEFONE.find(
                    (item) =>
                        item.codigo === "BR"
                ) ??
                PAISES_TELEFONE[0],
            [pais]
        );

    const paisesFiltrados =
        useMemo(() => {
            const termo =
                normalizarBusca(
                    busca
                );

            if (!termo) {
                return PAISES_TELEFONE;
            }

            return PAISES_TELEFONE.filter(
                (item) => {
                    const texto =
                        normalizarBusca(
                            [
                                item.nome,
                                item.prefixo,
                                item.codigo,
                            ].join(" ")
                        );

                    return texto.includes(
                        termo
                    );
                }
            );
        }, [busca]);

    function selecionarPais(
        novoPais: CountryCode
    ) {
        const valorReformatado =
            formatarTelefonePorPais(
                value,
                novoPais
            );

        onChange(
            valorReformatado,
            novoPais
        );

        setAberto(false);
        setBusca("");
    }

    function alterarTelefone(
        valorDigitado: string
    ) {
        /*
         * Se a pessoa colar:
         *
         * +351...
         * +1...
         * +55...
         *
         * o PHANYX identifica o país.
         */
        const paisDetectado =
            detectarPaisTelefone(
                valorDigitado
            );

        const proximoPais =
            paisDetectado ?? pais;

        const formatado =
            formatarTelefonePorPais(
                valorDigitado,
                proximoPais
            );

        onChange(
            formatado,
            proximoPais
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <div
                className={`flex min-w-0 rounded-xl border bg-white transition focus-within:ring-2 ${erro
                        ? "border-red-400 bg-red-50 focus-within:border-red-500 focus-within:ring-red-100"
                        : "border-slate-300 focus-within:border-blue-500 focus-within:ring-blue-100"
                    }`}
            >
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                        setAberto(
                            (atual) => !atual
                        )
                    }
                    className="flex shrink-0 items-center gap-2 rounded-l-xl border-r border-slate-300 px-3 py-3 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-expanded={
                        aberto
                    }
                    aria-label="Selecionar país do telefone"
                >
                    <span
                        className="text-lg"
                        aria-hidden="true"
                    >
                        {bandeiraPais(
                            paisAtual.codigo
                        )}
                    </span>

                    <span className="hidden sm:inline">
                        {paisAtual.nome}
                    </span>

                    <span className="font-semibold">
                        {
                            paisAtual.prefixo
                        }
                    </span>

                    <span
                        className="text-xs text-slate-500"
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>

                <input
                    required={required}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    disabled={disabled}
                    value={value}
                    onChange={(event) =>
                        alterarTelefone(
                            event.target.value
                        )
                    }
                    placeholder={
                        placeholder
                    }
                    className="min-w-0 flex-1 rounded-r-xl border-0 bg-transparent px-3.5 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
            </div>

            {aberto && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-200 p-3">
                        <input
                            type="search"
                            autoFocus
                            value={busca}
                            onChange={(
                                event
                            ) =>
                                setBusca(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Buscar país ou prefixo"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="max-h-72 overflow-y-auto p-2">
                        {paisesFiltrados.length >
                            0 ? (
                            paisesFiltrados.map(
                                (item) => {
                                    const selecionado =
                                        item.codigo ===
                                        pais;

                                    return (
                                        <button
                                            key={
                                                item.codigo
                                            }
                                            type="button"
                                            onClick={() =>
                                                selecionarPais(
                                                    item.codigo
                                                )
                                            }
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${selecionado
                                                    ? "bg-blue-50 font-semibold text-blue-800"
                                                    : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            <span className="text-lg">
                                                {bandeiraPais(
                                                    item.codigo
                                                )}
                                            </span>

                                            <span className="min-w-0 flex-1 truncate">
                                                {
                                                    item.nome
                                                }
                                            </span>

                                            <span className="shrink-0 font-medium text-slate-500">
                                                {
                                                    item.prefixo
                                                }
                                            </span>

                                            {selecionado && (
                                                <span className="shrink-0 text-blue-700">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    );
                                }
                            )
                        ) : (
                            <div className="px-3 py-6 text-center text-sm text-slate-500">
                                Nenhum país
                                encontrado.
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}