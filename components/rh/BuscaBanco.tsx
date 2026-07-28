"use client";

import {
    KeyboardEvent,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";

export type BancoSelecionado = {
    codigo: string;
    nome: string;
    nomeCurto: string;
    ispb: string;
    apelidos: string[];
    label: string;
};

type BuscaBancoProps = {
    value: string;
    onChange: (
        valor: string,
        bancoSelecionado?: BancoSelecionado | null,
    ) => void;
    id?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    ariaLabel?: string;
};

export default function BuscaBanco({
    value,
    onChange,
    id,
    name,
    placeholder = "Digite o código ou nome do banco",
    disabled = false,
    required = false,
    className = "",
    ariaLabel = "Buscar banco",
}: BuscaBancoProps) {
    const idAutomatico = useId();
    const inputId = id || `busca-banco-${idAutomatico}`;
    const listaId = `${inputId}-lista`;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [textoBusca, setTextoBusca] = useState(value || "");
    const [bancos, setBancos] = useState<BancoSelecionado[]>([]);
    const [aberto, setAberto] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [indiceAtivo, setIndiceAtivo] = useState(-1);

    useEffect(() => {
        setTextoBusca(value || "");
    }, [value]);

    useEffect(() => {
        function fecharAoClicarFora(event: MouseEvent) {
            const alvo = event.target as Node;

            if (
                containerRef.current &&
                !containerRef.current.contains(alvo)
            ) {
                setAberto(false);
                setIndiceAtivo(-1);
            }
        }

        document.addEventListener("mousedown", fecharAoClicarFora);

        return () => {
            document.removeEventListener("mousedown", fecharAoClicarFora);
        };
    }, []);

    useEffect(() => {
        if (!aberto || disabled) return;

        const controller = new AbortController();

        const temporizador = window.setTimeout(async () => {
            try {
                setCarregando(true);
                setErro("");

                const parametros = new URLSearchParams({
                    q: textoBusca.trim(),
                    limite: "50",
                });

                const resposta = await fetch(
                    `/api/admin/rh/bancos?${parametros.toString()}`,
                    {
                        method: "GET",
                        signal: controller.signal,
                        cache: "no-store",
                    },
                );

                const dados = await resposta.json().catch(() => null);

                if (!resposta.ok) {
                    throw new Error(
                        dados?.error ||
                        "Não foi possível consultar os bancos.",
                    );
                }

                const itens = Array.isArray(dados?.bancos)
                    ? dados.bancos
                    : [];

                setBancos(itens);
                setIndiceAtivo(itens.length > 0 ? 0 : -1);
            } catch (error: any) {
                if (error?.name === "AbortError") return;

                setBancos([]);
                setIndiceAtivo(-1);
                setErro(
                    error?.message ||
                    "Não foi possível consultar os bancos.",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setCarregando(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(temporizador);
            controller.abort();
        };
    }, [aberto, disabled, textoBusca]);

    function selecionarBanco(banco: BancoSelecionado) {
        setTextoBusca(banco.label);
        setAberto(false);
        setIndiceAtivo(-1);
        setErro("");

        onChange(banco.label, banco);
    }

    function tratarTeclado(
        event: KeyboardEvent<HTMLInputElement>,
    ) {
        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (!aberto) {
                setAberto(true);
                return;
            }

            setIndiceAtivo((indiceAtual) => {
                if (bancos.length === 0) return -1;

                return indiceAtual >= bancos.length - 1
                    ? 0
                    : indiceAtual + 1;
            });

            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (!aberto) {
                setAberto(true);
                return;
            }

            setIndiceAtivo((indiceAtual) => {
                if (bancos.length === 0) return -1;

                return indiceAtual <= 0
                    ? bancos.length - 1
                    : indiceAtual - 1;
            });

            return;
        }

        if (event.key === "Enter") {
            if (
                aberto &&
                indiceAtivo >= 0 &&
                bancos[indiceAtivo]
            ) {
                event.preventDefault();
                selecionarBanco(bancos[indiceAtivo]);
            }

            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            setAberto(false);
            setIndiceAtivo(-1);
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <input
                ref={inputRef}
                id={inputId}
                name={name}
                value={textoBusca}
                type="text"
                autoComplete="off"
                spellCheck={false}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                aria-label={ariaLabel}
                aria-autocomplete="list"
                aria-controls={listaId}
                aria-expanded={aberto}
                aria-activedescendant={
                    aberto && indiceAtivo >= 0
                        ? `${listaId}-${indiceAtivo}`
                        : undefined
                }
                onFocus={() => {
                    if (!disabled) {
                        setAberto(true);
                    }
                }}
                onChange={(event) => {
                    const novoValor = event.target.value;

                    setTextoBusca(novoValor);
                    setAberto(true);
                    setIndiceAtivo(-1);
                    setErro("");

                    onChange(novoValor, null);
                }}
                onKeyDown={tratarTeclado}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
            />

            <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                aria-label={
                    aberto
                        ? "Fechar lista de bancos"
                        : "Abrir lista de bancos"
                }
                onClick={() => {
                    if (disabled) return;

                    setAberto((estadoAtual) => !estadoAtual);
                    inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
                <span
                    aria-hidden="true"
                    className={`block text-sm transition ${aberto ? "rotate-180" : ""
                        }`}
                >
                    ▼
                </span>
            </button>

            {aberto && (
                <div
                    id={listaId}
                    role="listbox"
                    className="absolute z-[80] mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                    {carregando && (
                        <div className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                            Consultando bancos...
                        </div>
                    )}

                    {!carregando && erro && (
                        <div className="m-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                            {erro}
                        </div>
                    )}

                    {!carregando && !erro && bancos.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            Nenhum banco encontrado para esta busca.
                        </div>
                    )}

                    {!carregando &&
                        !erro &&
                        bancos.map((banco, index) => {
                            const ativo = indiceAtivo === index;

                            return (
                                <button
                                    key={`${banco.codigo}-${banco.ispb}`}
                                    id={`${listaId}-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={ativo}
                                    onMouseEnter={() => setIndiceAtivo(index)}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                    }}
                                    onClick={() => selecionarBanco(banco)}
                                    className={`block w-full rounded-xl px-4 py-3 text-left transition ${ativo
                                            ? "bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white"
                                            : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <span className="flex items-start gap-3">
                                        <span className="inline-flex min-w-12 justify-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200">
                                            {banco.codigo}
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold">
                                                {banco.nomeCurto || banco.nome}
                                            </span>

                                            {banco.nome &&
                                                banco.nome !== banco.nomeCurto && (
                                                    <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                        {banco.nome}
                                                    </span>
                                                )}

                                            {banco.ispb && (
                                                <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                                                    ISPB: {banco.ispb}
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                </div>
            )}
        </div>
    );
}