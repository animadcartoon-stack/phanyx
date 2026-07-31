"use client";

import {
    ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import PhanyxToast from "@/components/ui/PhanyxToast";

type TipoLogo =
    | "PRINCIPAL"
    | "FUNDO_CLARO"
    | "FUNDO_ESCURO"
    | "MONOCROMATICA"
    | "OUTRA";

type LogoInstitucional = {
    id: number;
    nome: string;
    tipo: TipoLogo;
    arquivoUrl: string;
    arquivoPath?: string | null;
    mimeType?: string | null;
    largura?: number | null;
    altura?: number | null;
    ativa: boolean;
    principal: boolean;
    criadoEm: string;
    atualizadoEm: string;
    _count?: {
        templates: number;
    };
};

type ToastState = {
    tipo:
    | "sucesso"
    | "erro"
    | "aviso";
    titulo: string;
    mensagem: string;
} | null;

const TIPOS_LOGO: Array<{
    value: TipoLogo;
    label: string;
    descricao: string;
}> = [
        {
            value: "PRINCIPAL",
            label: "Logo principal",
            descricao:
                "Versão institucional padrão usada no sistema.",
        },
        {
            value: "FUNDO_CLARO",
            label: "Para fundo claro",
            descricao:
                "Indicada para folhas brancas ou fundos claros.",
        },
        {
            value: "FUNDO_ESCURO",
            label: "Para fundo escuro",
            descricao:
                "Indicada para cabeçalhos pretos, azuis ou escuros.",
        },
        {
            value: "MONOCROMATICA",
            label: "Monocromática",
            descricao:
                "Versão em uma única cor para documentos específicos.",
        },
        {
            value: "OUTRA",
            label: "Outra versão",
            descricao:
                "Logo horizontal, compacta ou para finalidade específica.",
        },
    ];

function nomeTipo(
    tipo: TipoLogo
) {
    return (
        TIPOS_LOGO.find(
            (item) =>
                item.value === tipo
        )?.label || tipo
    );
}

function classeTipo(
    tipo: TipoLogo
) {
    if (
        tipo === "PRINCIPAL"
    ) {
        return "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200";
    }

    if (
        tipo === "FUNDO_CLARO"
    ) {
        return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
    }

    if (
        tipo === "FUNDO_ESCURO"
    ) {
        return "border-slate-400 bg-slate-800 text-white dark:border-slate-600 dark:bg-slate-950";
    }

    if (
        tipo === "MONOCROMATICA"
    ) {
        return "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200";
    }

    return "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function obterDimensoesImagem(
    arquivo: File
) {
    return new Promise<{
        largura: number | null;
        altura: number | null;
    }>((resolve) => {
        const url =
            URL.createObjectURL(
                arquivo
            );

        const imagem =
            new Image();

        imagem.onload = () => {
            resolve({
                largura:
                    imagem.naturalWidth ||
                    null,

                altura:
                    imagem.naturalHeight ||
                    null,
            });

            URL.revokeObjectURL(
                url
            );
        };

        imagem.onerror = () => {
            resolve({
                largura: null,
                altura: null,
            });

            URL.revokeObjectURL(
                url
            );
        };

        imagem.src = url;
    });
}

export default function LogosInstitucionaisPage() {
    const [
        logos,
        setLogos,
    ] = useState<
        LogoInstitucional[]
    >([]);

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        salvando,
        setSalvando,
    ] = useState(false);

    const [
        atualizandoId,
        setAtualizandoId,
    ] = useState<
        number | null
    >(null);

    const [
        arquivo,
        setArquivo,
    ] = useState<
        File | null
    >(null);

    const [
        previewArquivo,
        setPreviewArquivo,
    ] = useState("");

    const [
        nome,
        setNome,
    ] = useState("");

    const [
        tipo,
        setTipo,
    ] = useState<TipoLogo>(
        "FUNDO_ESCURO"
    );

    const [
        tornarPrincipal,
        setTornarPrincipal,
    ] = useState(false);

    const [
        toast,
        setToast,
    ] = useState<ToastState>(
        null
    );

    const [
        logoExcluir,
        setLogoExcluir,
    ] = useState<
        LogoInstitucional | null
    >(null);

    const [
        excluindo,
        setExcluindo,
    ] = useState(false);

    const carregarLogos =
        useCallback(
            async () => {
                try {
                    setCarregando(
                        true
                    );

                    const resposta =
                        await fetch(
                            "/api/admin/configuracoes/logos",
                            {
                                credentials:
                                    "include",

                                cache:
                                    "no-store",
                            }
                        );

                    const data =
                        await resposta
                            .json()
                            .catch(
                                () => null
                            );

                    if (
                        !resposta.ok
                    ) {
                        throw new Error(
                            data?.error ||
                            "Erro ao carregar logos."
                        );
                    }

                    setLogos(
                        Array.isArray(
                            data?.logos
                        )
                            ? data.logos
                            : []
                    );
                } catch (
                error: any
                ) {
                    setToast({
                        tipo: "erro",
                        titulo:
                            "Não foi possível carregar",
                        mensagem:
                            error?.message ||
                            "Erro ao carregar as logos da instituição.",
                    });
                } finally {
                    setCarregando(
                        false
                    );
                }
            },
            []
        );

    useEffect(() => {
        carregarLogos();
    }, [carregarLogos]);

    useEffect(() => {
        return () => {
            if (
                previewArquivo
            ) {
                URL.revokeObjectURL(
                    previewArquivo
                );
            }
        };
    }, [previewArquivo]);

    const logoPrincipal =
        useMemo(
            () =>
                logos.find(
                    (logo) =>
                        logo.principal &&
                        logo.ativa
                ) || null,
            [logos]
        );

    function selecionarArquivo(
        event:
            ChangeEvent<HTMLInputElement>
    ) {
        const selecionado =
            event.target
                .files?.[0] ||
            null;

        if (
            previewArquivo
        ) {
            URL.revokeObjectURL(
                previewArquivo
            );
        }

        setArquivo(
            selecionado
        );

        setPreviewArquivo(
            selecionado
                ? URL.createObjectURL(
                    selecionado
                )
                : ""
        );

        if (
            selecionado &&
            !nome.trim()
        ) {
            const nomeInicial =
                selecionado.name
                    .replace(
                        /\.[^.]+$/,
                        ""
                    )
                    .replace(
                        /[-_]+/g,
                        " "
                    )
                    .trim();

            setNome(
                nomeInicial ||
                "Nova logo"
            );
        }
    }

    function limparFormulario() {
        if (
            previewArquivo
        ) {
            URL.revokeObjectURL(
                previewArquivo
            );
        }

        setArquivo(null);
        setPreviewArquivo("");
        setNome("");
        setTipo(
            "FUNDO_ESCURO"
        );
        setTornarPrincipal(
            false
        );
    }

    async function cadastrarLogo() {
        try {
            if (!arquivo) {
                setToast({
                    tipo: "aviso",
                    titulo:
                        "Selecione uma imagem",
                    mensagem:
                        "Envie o arquivo da logo antes de cadastrar.",
                });

                return;
            }

            if (
                nome.trim().length <
                2
            ) {
                setToast({
                    tipo: "aviso",
                    titulo:
                        "Informe o nome",
                    mensagem:
                        "Informe um nome para identificar esta versão da logo.",
                });

                return;
            }

            setSalvando(true);

            const dimensoes =
                await obterDimensoesImagem(
                    arquivo
                );

            const formData =
                new FormData();

            formData.append(
                "file",
                arquivo
            );

            const uploadRes =
                await fetch(
                    "/api/admin/configuracoes/logos/upload",
                    {
                        method: "POST",
                        credentials:
                            "include",
                        body: formData,
                    }
                );

            const uploadData =
                await uploadRes
                    .json()
                    .catch(
                        () => null
                    );

            if (!uploadRes.ok) {
                throw new Error(
                    uploadData?.error ||
                    "Erro ao enviar a imagem."
                );
            }

            const cadastroRes =
                await fetch(
                    "/api/admin/configuracoes/logos",
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body:
                            JSON.stringify({
                                nome:
                                    nome.trim(),

                                tipo,

                                principal:
                                    tornarPrincipal,

                                arquivoUrl:
                                    uploadData
                                        .arquivoUrl,

                                arquivoPath:
                                    uploadData
                                        .arquivoPath,

                                mimeType:
                                    uploadData
                                        .mimeType,

                                largura:
                                    dimensoes.largura,

                                altura:
                                    dimensoes.altura,
                            }),
                    }
                );

            const cadastroData =
                await cadastroRes
                    .json()
                    .catch(
                        () => null
                    );

            if (
                !cadastroRes.ok
            ) {
                throw new Error(
                    cadastroData?.error ||
                    "Erro ao cadastrar a logo."
                );
            }

            setToast({
                tipo: "sucesso",
                titulo:
                    "Logo cadastrada",
                mensagem:
                    cadastroData?.mensagem ||
                    "A nova versão da logo foi cadastrada.",
            });

            limparFormulario();
            await carregarLogos();
        } catch (
        error: any
        ) {
            setToast({
                tipo: "erro",
                titulo:
                    "Não foi possível cadastrar",
                mensagem:
                    error?.message ||
                    "Erro ao cadastrar a logo.",
            });
        } finally {
            setSalvando(false);
        }
    }

    async function atualizarLogo(
        logo: LogoInstitucional,
        dados: Record<
            string,
            unknown
        >
    ) {
        try {
            setAtualizandoId(
                logo.id
            );

            const resposta =
                await fetch(
                    `/api/admin/configuracoes/logos/${logo.id}`,
                    {
                        method: "PATCH",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body:
                            JSON.stringify(
                                dados
                            ),
                    }
                );

            const data =
                await resposta
                    .json()
                    .catch(
                        () => null
                    );

            if (
                !resposta.ok
            ) {
                throw new Error(
                    data?.error ||
                    "Erro ao atualizar a logo."
                );
            }

            setToast({
                tipo: "sucesso",
                titulo:
                    "Logo atualizada",
                mensagem:
                    data?.mensagem ||
                    "A logo foi atualizada.",
            });

            await carregarLogos();
        } catch (
        error: any
        ) {
            setToast({
                tipo: "erro",
                titulo:
                    "Não foi possível atualizar",
                mensagem:
                    error?.message ||
                    "Erro ao atualizar a logo.",
            });
        } finally {
            setAtualizandoId(
                null
            );
        }
    }

    async function excluirLogo() {
        if (!logoExcluir) {
            return;
        }

        try {
            setExcluindo(true);

            const resposta =
                await fetch(
                    `/api/admin/configuracoes/logos/${logoExcluir.id}`,
                    {
                        method:
                            "DELETE",

                        credentials:
                            "include",
                    }
                );

            const data =
                await resposta
                    .json()
                    .catch(
                        () => null
                    );

            if (
                !resposta.ok
            ) {
                throw new Error(
                    data?.error ||
                    "Erro ao excluir a logo."
                );
            }

            setToast({
                tipo: "sucesso",
                titulo:
                    "Logo excluída",
                mensagem:
                    data?.mensagem ||
                    "A logo foi excluída.",
            });

            setLogoExcluir(
                null
            );

            await carregarLogos();
        } catch (
        error: any
        ) {
            setToast({
                tipo: "erro",
                titulo:
                    "Não foi possível excluir",
                mensagem:
                    error?.message ||
                    "Erro ao excluir a logo.",
            });
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="phanyx-logos-page space-y-6">
            {toast && (
                <PhanyxToast
                    tipo={toast.tipo}
                    titulo={toast.titulo}
                    mensagem={
                        toast.mensagem
                    }
                    onClose={() =>
                        setToast(null)
                    }
                />
            )}

            <header>
                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
                    Logos institucionais
                </h1>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Cadastre versões da
                    marca para fundos
                    claros, escuros e
                    diferentes documentos.
                </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                                Adicionar nova logo
                            </h2>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                Envie PNG, JPG ou
                                WEBP com até 5 MB.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Nome da versão
                                </label>

                                <input
                                    value={nome}
                                    onChange={(event) =>
                                        setNome(
                                            event.target
                                                .value
                                        )
                                    }
                                    maxLength={80}
                                    placeholder="Ex.: Logo cinza para fundo escuro"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Finalidade
                                </label>

                                <select
                                    value={tipo}
                                    onChange={(event) =>
                                        setTipo(
                                            event.target
                                                .value as TipoLogo
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
                                >
                                    {TIPOS_LOGO.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {item.label}
                                            </option>
                                        )
                                    )}
                                </select>

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    {
                                        TIPOS_LOGO.find(
                                            (item) =>
                                                item.value ===
                                                tipo
                                        )?.descricao
                                    }
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Arquivo da logo
                            </label>

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={
                                    selecionarArquivo
                                }
                                className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            />
                        </div>

                        <label className="phanyx-logos-principal-card flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                            <input
                                type="checkbox"
                                checked={
                                    tornarPrincipal
                                }
                                onChange={(event) =>
                                    setTornarPrincipal(
                                        event.target
                                            .checked
                                    )
                                }
                                className="mt-1 h-4 w-4 accent-blue-600"
                            />

                            <span>
                                <span className="block font-semibold text-slate-900 dark:text-white">
                                    Tornar esta a
                                    logo principal
                                </span>

                                <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                                    A logo principal
                                    também será usada
                                    pelas áreas antigas
                                    do PHANYX.
                                </span>
                            </span>
                        </label>

                        <div className="flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={
                                    limparFormulario
                                }
                                disabled={
                                    salvando
                                }
                                className="phanyx-logos-secondary rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                            >
                                Limpar
                            </button>

                            <button
                                type="button"
                                onClick={cadastrarLogo}
                                disabled={salvando}
                                className="phanyx-logos-primary rounded-xl border px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="phanyx-logo-button-label">
                                    {salvando
                                        ? "Enviando..."
                                        : "Cadastrar logo"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Pré-visualização
                        </p>

                        <div className="grid gap-3">
                            <div className="phanyx-logo-preview-light flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border p-5">
                                {previewArquivo ? (
                                    <img
                                        src={
                                            previewArquivo
                                        }
                                        alt="Prévia em fundo claro"
                                        className="max-h-36 max-w-full object-contain"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-400">
                                        Fundo claro
                                    </span>
                                )}
                            </div>

                            <div className="phanyx-logo-preview-dark flex min-h-40 items-center justify-center overflow-hidden rounded-2xl border p-5">
                                {previewArquivo ? (
                                    <img
                                        src={
                                            previewArquivo
                                        }
                                        alt="Prévia em fundo escuro"
                                        className="max-h-36 max-w-full object-contain"
                                    />
                                ) : (
                                    <span className="text-sm text-slate-500">
                                        Fundo escuro
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6 dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                            Biblioteca de logos
                        </h2>

                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {logos.length} versão
                            {logos.length === 1
                                ? ""
                                : "ões"}{" "}
                            cadastrada
                            {logos.length === 1
                                ? ""
                                : "s"}.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            carregarLogos
                        }
                        disabled={
                            carregando
                        }
                        className="phanyx-logo-action phanyx-logo-action-neutral rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                    >
                        Recarregar
                    </button>
                </div>

                {carregando ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        Carregando logos...
                    </div>
                ) : logos.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        Nenhuma logo
                        cadastrada.
                    </div>
                ) : (
                    <div className="grid gap-5 p-6 md:grid-cols-2 2xl:grid-cols-3">
                        {logos.map(
                            (logo) => {
                                const ocupada =
                                    Number(
                                        logo._count
                                            ?.templates ||
                                        0
                                    ) > 0;

                                const atualizando =
                                    atualizandoId ===
                                    logo.id;

                                return (
                                    <article
                                        key={
                                            logo.id
                                        }
                                        className={`phanyx-logo-card overflow-hidden rounded-2xl border ${logo.principal
                                            ? "phanyx-logo-card-principal"
                                            : ""
                                            }`}
                                    >
                                        <div className="grid grid-cols-2">
                                            <div className="phanyx-logo-preview-light flex h-32 items-center justify-center p-4">
                                                <img
                                                    src={
                                                        logo.arquivoUrl
                                                    }
                                                    alt={
                                                        logo.nome
                                                    }
                                                    className="max-h-24 max-w-full object-contain"
                                                />
                                            </div>

                                            <div className="phanyx-logo-preview-dark flex h-32 items-center justify-center p-4">
                                                <img
                                                    src={
                                                        logo.arquivoUrl
                                                    }
                                                    alt={
                                                        logo.nome
                                                    }
                                                    className="max-h-24 max-w-full object-contain"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-5">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="phanyx-logo-card-title font-bold">
                                                        {
                                                            logo.nome
                                                        }
                                                    </h3>

                                                    {logo.principal && (
                                                        <span className="phanyx-logo-badge phanyx-logo-badge-principal rounded-full border px-2 py-1 text-[10px] font-bold uppercase">
                                                            Principal
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span
                                                        data-tipo={logo.tipo}
                                                        className={`phanyx-logo-badge phanyx-logo-badge-tipo rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${classeTipo(
                                                            logo.tipo
                                                        )}`}
                                                    >
                                                        {nomeTipo(
                                                            logo.tipo
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`phanyx-logo-badge-status rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${logo.ativa
                                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                                                            : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                                                            }`}
                                                    >
                                                        {logo.ativa
                                                            ? "Ativa"
                                                            : "Inativa"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="phanyx-logo-meta text-xs">
                                                {logo.largura &&
                                                    logo.altura
                                                    ? `${logo.largura} × ${logo.altura}px`
                                                    : "Dimensões não informadas"}

                                                <br />

                                                Usada por{" "}
                                                {logo._count
                                                    ?.templates ||
                                                    0}{" "}
                                                template
                                                {Number(
                                                    logo._count
                                                        ?.templates ||
                                                    0
                                                ) === 1
                                                    ? ""
                                                    : "s"}
                                                .
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2">
  {!logo.principal && (
    <button
      type="button"
      disabled={
        atualizando ||
        !logo.ativa
      }
      onClick={() =>
        atualizarLogo(
          logo,
          {
            principal: true,
          }
        )
      }
      className="phanyx-logo-action phanyx-logo-action-primary rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="phanyx-logo-button-label">
        Definir principal
      </span>
    </button>
  )}

  <button
    type="button"
    disabled={atualizando}
    onClick={() =>
      atualizarLogo(
        logo,
        {
          ativa:
            !logo.ativa,
        }
      )
    }
    className="phanyx-logo-action phanyx-logo-action-neutral rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span className="phanyx-logo-button-label">
      {logo.ativa
        ? "Desativar"
        : "Ativar"}
    </span>
  </button>

  <button
    type="button"
    disabled={atualizando}
    onClick={() => {
      const atual =
        TIPOS_LOGO.findIndex(
          (item) =>
            item.value ===
            logo.tipo
        );

      const proximo =
        TIPOS_LOGO[
          (atual + 1) %
            TIPOS_LOGO.length
        ];

      atualizarLogo(
        logo,
        {
          tipo:
            proximo.value,
        }
      );
    }}
    className="phanyx-logo-action phanyx-logo-action-secondary rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span className="phanyx-logo-button-label">
      Alterar finalidade
    </span>
  </button>

  <button
    type="button"
    disabled={
      atualizando ||
      ocupada
    }
    onClick={() =>
      setLogoExcluir(
        logo
      )
    }
    className="phanyx-logo-action phanyx-logo-action-danger rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span className="phanyx-logo-button-label">
      Excluir
    </span>
  </button>
</div>

                                            {ocupada && (
                                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                    Esta logo está
                                                    vinculada a
                                                    templates e não
                                                    pode ser excluída.
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </section>

            {logoExcluir && (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="titulo-excluir-logo"
                >
                    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="border-b border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
                            <h2
                                id="titulo-excluir-logo"
                                className="text-xl font-bold text-red-900 dark:text-red-100"
                            >
                                Excluir logo
                            </h2>

                            <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                                A logo será removida
                                da biblioteca desta
                                instituição.
                            </p>
                        </div>

                        <div className="p-6">
                            <p className="text-slate-700 dark:text-slate-200">
                                Tem certeza que deseja
                                excluir{" "}
                                <strong>
                                    {logoExcluir.nome}
                                </strong>
                                ?
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                            <button
                                type="button"
                                onClick={() =>
                                    setLogoExcluir(
                                        null
                                    )
                                }
                                disabled={
                                    excluindo
                                }
                                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={
                                    excluirLogo
                                }
                                disabled={
                                    excluindo
                                }
                                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {excluindo
                                    ? "Excluindo..."
                                    : "Excluir logo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {logoPrincipal && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Logo principal atual:{" "}
                    <strong>
                        {logoPrincipal.nome}
                    </strong>
                    .
                </p>
            )}
        </div>
    );
}