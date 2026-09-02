"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useLocale,
    useTranslations,
} from "next-intl";
import ParticipantesAtividadeExterna from "@/components/admin/atividades-externas/ParticipantesAtividadeExterna";
import AutorizacoesAtividadeExterna from "@/components/admin/atividades-externas/AutorizacoesAtividadeExterna";
import EquipeAtividadeExterna from "@/components/admin/atividades-externas/EquipeAtividadeExterna";

type Responsavel = {
    id: number;
    nome?: string | null;
    email?: string | null;

    funcionario?: {
        nome?: string | null;
    } | null;
};

type Polo = {
    id: number;
    nome: string;
    codigo?: string | null;
};

type TurmaVinculada = {
    id: number;

    turma: {
        id: number;
        nome: string;
        codigo?: string | null;
        periodoLetivo?: string | null;
        turno?: string | null;
    };
};

type Contadores = {
    participantes: number;
    equipe: number;
    autorizacoes: number;
    trechos: number;
    documentos: number;
    riscos: number;
    checkpoints: number;
};

type AtividadeExterna = {
    id: number;

    titulo: string;
    tipo: string;
    status: string;

    descricao?: string | null;
    objetivoPedagogico?: string | null;

    curricular: boolean;
    obrigatoria: boolean;
    internacional: boolean;

    destinoNome?: string | null;
    enderecoDestino?: string | null;
    cidadeDestino?: string | null;
    regiaoDestino?: string | null;
    paisDestino?: string | null;
    fusoHorario?: string | null;

    saidaEm?: string | null;
    retornoPrevistoEm?: string | null;

    capacidadeMaxima?: number | null;

    valorParticipante?: string | number | null;
    moeda?: string | null;

    exigeAutorizacaoResponsavel: boolean;
    exigePagamento: boolean;
    exigeCheckin: boolean;

    polo?: Polo | null;

    responsavelPrincipal?: Responsavel | null;

    turmas?: TurmaVinculada[];

    _count?: Contadores;
};

type RespostaApi = {
    ok?: boolean;
    atividade?: AtividadeExterna;
    error?: string;
    message?: string;
};

type Aba =
    | "overview"
    | "participants"
    | "permissions"
    | "team"
    | "transport"
    | "safety"
    | "health"
    | "documents";

const ABAS: Array<{
    id: Aba;
    icone: string;
}> = [
        {
            id: "overview",
            icone: "📋",
        },
        {
            id: "participants",
            icone: "👥",
        },
        {
            id: "permissions",
            icone: "✍️",
        },
        {
            id: "team",
            icone: "🧑‍🏫",
        },
        {
            id: "transport",
            icone: "🚌",
        },
        {
            id: "safety",
            icone: "🛡️",
        },
        {
            id: "health",
            icone: "🩺",
        },
        {
            id: "documents",
            icone: "📄",
        },
    ];

function iconeTipo(
    tipo: string
) {
    switch (tipo) {
        case "EXCURSAO":
            return "🚌";

        case "VISITA_TECNICA":
            return "🏭";

        case "VIAGEM_PEDAGOGICA":
            return "🎓";

        case "ACAMPAMENTO":
            return "⛺";

        case "RETIRO":
            return "🌿";

        case "COMPETICAO":
            return "🏆";

        case "INTERCAMBIO":
            return "🌎";

        case "EVENTO_ESPORTIVO":
            return "⚽";

        case "ATIVIDADE_COMUNITARIA":
            return "🤝";

        case "VIAGEM_INTERNACIONAL":
            return "✈️";

        default:
            return "📍";
    }
}

function corStatus(
    status: string
) {
    switch (status) {
        case "RASCUNHO":
            return "bg-slate-400";

        case "PLANEJAMENTO":
            return "bg-blue-500";

        case "AGUARDANDO_AUTORIZACOES":
            return "bg-amber-500";

        case "CONFIRMADA":
            return "bg-emerald-500";

        case "EM_ANDAMENTO":
            return "bg-cyan-500";

        case "CONCLUIDA":
            return "bg-green-600";

        case "CANCELADA":
            return "bg-red-500";

        case "ARQUIVADA":
            return "bg-zinc-500";

        default:
            return "bg-slate-400";
    }
}

export default function AtividadeExternaDetalhePage() {
    const params = useParams();

    const t =
        useTranslations(
            "AdminExternalActivityDetail"
        );

    const locale = useLocale();

    const atividadeId = Number(
        Array.isArray(params?.id)
            ? params.id[0]
            : params?.id
    );

    const [atividade, setAtividade] =
        useState<AtividadeExterna | null>(
            null
        );

    const [abaAtiva, setAbaAtiva] =
        useState<Aba>("overview");

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const formatadorData = useMemo(
        () =>
            new Intl.DateTimeFormat(
                locale,
                {
                    dateStyle: "medium",
                    timeStyle: "short",
                }
            ),
        [locale]
    );

    async function carregar() {
        try {
            setCarregando(true);
            setErro("");

            if (
                !Number.isInteger(
                    atividadeId
                ) ||
                atividadeId <= 0
            ) {
                throw new Error(
                    t("notFound")
                );
            }

            const resposta =
                await fetch(
                    `/api/admin/atividades-externas/${atividadeId}`,
                    {
                        credentials:
                            "include",

                        cache: "no-store",
                    }
                );

            const dados: RespostaApi =
                await resposta.json();

            if (
                !resposta.ok ||
                !dados.atividade
            ) {
                throw new Error(
                    dados?.message ||
                    t("notFound")
                );
            }

            setAtividade(
                dados.atividade
            );
        } catch (e: unknown) {
            setErro(
                e instanceof Error
                    ? e.message
                    : t("notFound")
            );

            setAtividade(null);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        void carregar();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atividadeId]);

    function formatarData(
        valor?: string | null
    ) {
        if (!valor) {
            return t("noDate");
        }

        const data =
            new Date(valor);

        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return t("noDate");
        }

        return formatadorData.format(
            data
        );
    }

    function nomeResponsavel() {
        const responsavel =
            atividade
                ?.responsavelPrincipal;

        if (!responsavel) {
            return t(
                "noResponsible"
            );
        }

        return (
            responsavel.nome?.trim() ||
            responsavel.funcionario?.nome?.trim() ||
            responsavel.email?.trim() ||
            t("noResponsible")
        );
    }

    function destinoCompleto() {
        if (!atividade) {
            return t(
                "noDestination"
            );
        }

        const nome =
            atividade.destinoNome?.trim();

        const localizacao = [
            atividade.cidadeDestino,
            atividade.regiaoDestino,
            atividade.paisDestino,
        ]
            .map((item) =>
                item?.trim()
            )
            .filter(Boolean);

        if (
            nome &&
            localizacao.length > 0
        ) {
            return `${nome} — ${localizacao.join(
                ", "
            )}`;
        }

        if (nome) {
            return nome;
        }

        if (
            localizacao.length > 0
        ) {
            return localizacao.join(
                ", "
            );
        }

        return t(
            "noDestination"
        );
    }

    function traduzirStatus(
        status: string
    ) {
        switch (status) {
            case "RASCUNHO":
                return t(
                    "statusValues.RASCUNHO"
                );

            case "PLANEJAMENTO":
                return t(
                    "statusValues.PLANEJAMENTO"
                );

            case "AGUARDANDO_AUTORIZACOES":
                return t(
                    "statusValues.AGUARDANDO_AUTORIZACOES"
                );

            case "CONFIRMADA":
                return t(
                    "statusValues.CONFIRMADA"
                );

            case "EM_ANDAMENTO":
                return t(
                    "statusValues.EM_ANDAMENTO"
                );

            case "CONCLUIDA":
                return t(
                    "statusValues.CONCLUIDA"
                );

            case "CANCELADA":
                return t(
                    "statusValues.CANCELADA"
                );

            case "ARQUIVADA":
                return t(
                    "statusValues.ARQUIVADA"
                );

            default:
                return status;
        }
    }

    function traduzirTipo(
        tipo: string
    ) {
        switch (tipo) {
            case "EXCURSAO":
                return t(
                    "types.EXCURSAO"
                );

            case "VISITA_TECNICA":
                return t(
                    "types.VISITA_TECNICA"
                );

            case "VIAGEM_PEDAGOGICA":
                return t(
                    "types.VIAGEM_PEDAGOGICA"
                );

            case "ACAMPAMENTO":
                return t(
                    "types.ACAMPAMENTO"
                );

            case "RETIRO":
                return t(
                    "types.RETIRO"
                );

            case "COMPETICAO":
                return t(
                    "types.COMPETICAO"
                );

            case "INTERCAMBIO":
                return t(
                    "types.INTERCAMBIO"
                );

            case "EVENTO_ESPORTIVO":
                return t(
                    "types.EVENTO_ESPORTIVO"
                );

            case "ATIVIDADE_COMUNITARIA":
                return t(
                    "types.ATIVIDADE_COMUNITARIA"
                );

            case "VIAGEM_INTERNACIONAL":
                return t(
                    "types.VIAGEM_INTERNACIONAL"
                );

            case "OUTRA":
                return t(
                    "types.OUTRA"
                );

            default:
                return tipo;
        }
    }

    if (carregando) {
        return (
            <main className="phanyx-atividade-externa-detalhe-page min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1600px]">
                    <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

                        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {t("loading")}
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    if (
        erro ||
        !atividade
    ) {
        return (
            <main className="phanyx-atividade-externa-detalhe-page min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-5">

                    <Link
                        href="/admin/atividades-externas"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300"
                    >
                        ← {t("back")}
                    </Link>

                    <section className="rounded-3xl border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
                        <p className="font-bold text-red-800 dark:text-red-200">
                            {erro ||
                                t(
                                    "notFound"
                                )}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                void carregar()
                            }
                            className="mt-4 rounded-2xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
                        >
                            {t("retry")}
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    const contadores =
        atividade._count;

    return (
        <main className="phanyx-atividade-externa-detalhe-page min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* ==================================================
            CABEÇALHO
            ================================================== */}
                <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">

                    <Link
                        href="/admin/atividades-externas"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                        ← {t("back")}
                    </Link>

                    <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

                        <div className="flex min-w-0 items-start gap-4">

                            <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-3xl dark:border-blue-900 dark:bg-blue-950/40">
                                {iconeTipo(
                                    atividade.tipo
                                )}
                            </div>

                            <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                    <span className="text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                                        {traduzirTipo(
                                            atividade.tipo
                                        )}
                                    </span>

                                    {atividade.curricular ? (
                                        <Badge>
                                            📘{" "}
                                            {t(
                                                "curricular"
                                            )}
                                        </Badge>
                                    ) : null}

                                    {atividade.obrigatoria ? (
                                        <Badge>
                                            📌{" "}
                                            {t(
                                                "mandatory"
                                            )}
                                        </Badge>
                                    ) : null}

                                    {atividade.internacional ? (
                                        <Badge>
                                            🌍{" "}
                                            {t(
                                                "international"
                                            )}
                                        </Badge>
                                    ) : null}
                                </div>

                                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                    {atividade.titulo}
                                </h1>

                                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {destinoCompleto()}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-none flex-wrap gap-3">

                            <div className="phanyx-atividade-detalhe-status rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {t("status")}
                                </p>

                                <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${corStatus(
                                            atividade.status
                                        )}`}
                                    />

                                    {traduzirStatus(
                                        atividade.status
                                    )}
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ==================================================
            RESUMO OPERACIONAL
            ================================================== */}
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                    <ResumoCard
                        titulo={t(
                            "destination"
                        )}
                        valor={destinoCompleto()}
                        icone="📍"
                    />

                    <ResumoCard
                        titulo={t(
                            "departure"
                        )}
                        valor={formatarData(
                            atividade.saidaEm
                        )}
                        icone="🕗"
                    />

                    <ResumoCard
                        titulo={t(
                            "expectedReturn"
                        )}
                        valor={formatarData(
                            atividade.retornoPrevistoEm
                        )}
                        icone="🏁"
                    />

                    <ResumoCard
                        titulo={t(
                            "responsible"
                        )}
                        valor={nomeResponsavel()}
                        icone="👤"
                    />
                </section>

                {/* ==================================================
            CONTADORES
            ================================================== */}
                <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">

                        <Contador
                            icone="👥"
                            valor={
                                contadores?.participantes ??
                                0
                            }
                            titulo={t(
                                "counters.participants"
                            )}
                        />

                        <Contador
                            icone="✍️"
                            valor={
                                contadores?.autorizacoes ??
                                0
                            }
                            titulo={t(
                                "counters.permissions"
                            )}
                        />

                        <Contador
                            icone="🧑‍🏫"
                            valor={
                                contadores?.equipe ??
                                0
                            }
                            titulo={t(
                                "counters.team"
                            )}
                        />

                        <Contador
                            icone="🚌"
                            valor={
                                contadores?.trechos ??
                                0
                            }
                            titulo={t(
                                "counters.legs"
                            )}
                        />

                        <Contador
                            icone="⚠️"
                            valor={
                                contadores?.riscos ??
                                0
                            }
                            titulo={t(
                                "counters.risks"
                            )}
                        />

                        <Contador
                            icone="📄"
                            valor={
                                contadores?.documentos ??
                                0
                            }
                            titulo={t(
                                "counters.documents"
                            )}
                        />

                        <Contador
                            icone="📍"
                            valor={
                                contadores?.checkpoints ??
                                0
                            }
                            titulo={t(
                                "counters.checkpoints"
                            )}
                        />

                    </div>
                </section>

                {/* ==================================================
            ABAS
            ================================================== */}
                <section className="phanyx-theme-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <div className="overflow-x-auto border-b border-slate-200 p-2 dark:border-slate-800">

                        <div className="flex min-w-max gap-1">

                            {ABAS.map(
                                (aba) => {
                                    const ativa =
                                        abaAtiva ===
                                        aba.id;

                                    return (
                                        <button
                                            key={aba.id}
                                            type="button"
                                            onClick={() =>
                                                setAbaAtiva(
                                                    aba.id
                                                )
                                            }
                                            className={[
                                                "inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition",
                                                ativa
                                                    ? "bg-blue-700 text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                                            ].join(
                                                " "
                                            )}
                                        >
                                            <span
                                                aria-hidden="true"
                                            >
                                                {
                                                    aba.icone
                                                }
                                            </span>

                                            {t(
                                                `tabs.${aba.id}`
                                            )}
                                        </button>
                                    );
                                }
                            )}

                        </div>
                    </div>

       <div className="p-5 sm:p-6">

  {abaAtiva === "overview" ? (
    <VisaoGeral
      atividade={atividade}
      t={t}
      formatarData={formatarData}
      nomeResponsavel={nomeResponsavel}
      destinoCompleto={destinoCompleto}
    />
  ) : abaAtiva === "participants" ? (
    <ParticipantesAtividadeExterna
      atividadeId={atividade.id}
      onParticipantesAlterados={carregar}
    />
  ) : abaAtiva === "permissions" ? (
    <AutorizacoesAtividadeExterna
      atividadeId={atividade.id}
      onAutorizacoesAlteradas={carregar}
    />
  ) : abaAtiva === "team" ? (
    <EquipeAtividadeExterna
      atividadeId={atividade.id}
      onEquipeAlterada={carregar}
    />
  ) : (
    <AreaEmPreparacao
      icone={
        ABAS.find(
          (item) =>
            item.id === abaAtiva
        )?.icone || "📋"
      }
      titulo={t(
        `tabs.${abaAtiva}`
      )}
      descricao={t(
        "sectionPlaceholder.description"
      )}
      rotulo={t(
        "sectionPlaceholder.title"
      )}
    />
  )}

</div>
                </section>
            </div>
        </main>
    );
}

function VisaoGeral({
    atividade,
    t,
    formatarData,
    nomeResponsavel,
    destinoCompleto,
}: {
    atividade: AtividadeExterna;

    t: ReturnType<
        typeof useTranslations
    >;

    formatarData: (
        valor?: string | null
    ) => string;

    nomeResponsavel: () => string;

    destinoCompleto: () => string;
}) {
    return (
        <div className="space-y-6">

            <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                    {t(
                        "overview.planning"
                    )}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t(
                        "overview.planningDescription"
                    )}
                </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">

                {/* Planejamento */}
                <section className="phanyx-atividade-detalhe-planejamento rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">

                    <div className="space-y-5">

                        <Informacao
                            titulo={t(
                                "destination"
                            )}
                            valor={destinoCompleto()}
                        />

                        <Informacao
                            titulo={t(
                                "departure"
                            )}
                            valor={formatarData(
                                atividade.saidaEm
                            )}
                        />

                        <Informacao
                            titulo={t(
                                "expectedReturn"
                            )}
                            valor={formatarData(
                                atividade.retornoPrevistoEm
                            )}
                        />

                        <Informacao
                            titulo={t(
                                "responsible"
                            )}
                            valor={nomeResponsavel()}
                        />

                        <Informacao
                            titulo={t(
                                "campus"
                            )}
                            valor={
                                atividade.polo?.nome ||
                                t(
                                    "noCampus"
                                )
                            }
                        />

                    </div>
                </section>

                {/* Descrição */}
                <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        {t(
                            "overview.description"
                        )}
                    </h3>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {atividade.descricao?.trim() ||
                            "—"}
                    </p>

                    <div className="my-5 border-t border-slate-200 dark:border-slate-700" />

                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        {t(
                            "overview.educationalObjective"
                        )}
                    </h3>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {atividade.objetivoPedagogico?.trim() ||
                            "—"}
                    </p>

                </section>

                {/* Regras */}
                <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        {t(
                            "overview.rules"
                        )}
                    </h3>

                    <div className="mt-4 space-y-3">

                        <Regra
                            titulo={t(
                                "overview.requiresAuthorization"
                            )}
                            ativa={
                                atividade.exigeAutorizacaoResponsavel
                            }
                            sim={t(
                                "overview.yes"
                            )}
                            nao={t(
                                "overview.no"
                            )}
                        />

                        <Regra
                            titulo={t(
                                "overview.payment"
                            )}
                            ativa={
                                atividade.exigePagamento
                            }
                            sim={t(
                                "overview.yes"
                            )}
                            nao={t(
                                "overview.no"
                            )}
                        />

                        <Regra
                            titulo={t(
                                "overview.checkin"
                            )}
                            ativa={
                                atividade.exigeCheckin
                            }
                            sim={t(
                                "overview.yes"
                            )}
                            nao={t(
                                "overview.no"
                            )}
                        />

                    </div>

                    {atividade.capacidadeMaxima ? (
                        <div className="phanyx-atividade-detalhe-capacidade mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {t("overview.capacity")}
                            </p>

                            <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                                {
                                    atividade.capacidadeMaxima
                                }
                            </p>
                        </div>
                    ) : null}

                </section>
            </div>

            {/* Turmas */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

                <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                    {t("classes")}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">

                    {atividade.turmas &&
                        atividade.turmas.length >
                        0 ? (
                        atividade.turmas.map(
                            (vinculo) => (
                                <div
                                    key={
                                        vinculo.id
                                    }
                                    className="phanyx-atividade-detalhe-turma rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                        {
                                            vinculo
                                                .turma
                                                .nome
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {[
                                            vinculo
                                                .turma
                                                .codigo,

                                            vinculo
                                                .turma
                                                .periodoLetivo,

                                            vinculo
                                                .turma
                                                .turno,
                                        ]
                                            .filter(
                                                Boolean
                                            )
                                            .join(
                                                " • "
                                            )}
                                    </p>
                                </div>
                            )
                        )
                    ) : (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            —
                        </span>
                    )}

                </div>
            </section>
        </div>
    );
}

function ResumoCard({
    titulo,
    valor,
    icone,
}: {
    titulo: string;
    valor: string;
    icone: string;
}) {
    return (
        <article className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-start gap-3">

                <div className="phanyx-atividade-detalhe-icone flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">
                    {icone}
                </div>

                <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {titulo}
                    </p>

                    <p className="mt-1 text-sm font-black leading-5 text-slate-900 dark:text-white">
                        {valor}
                    </p>

                </div>
            </div>

        </article>
    );
}

function Contador({
    icone,
    valor,
    titulo,
}: {
    icone: string;
    valor: number;
    titulo: string;
}) {
    return (
        <div className="phanyx-atividade-detalhe-contador rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">

            <span className="text-lg">
                {icone}
            </span>

            <strong className="mt-1 block text-xl font-black text-slate-950 dark:text-white">
                {valor}
            </strong>

            <span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                {titulo}
            </span>

        </div>
    );
}

function Informacao({
    titulo,
    valor,
}: {
    titulo: string;
    valor: string;
}) {
    return (
        <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {titulo}
            </dt>

            <dd className="mt-1 text-sm font-bold leading-6 text-slate-900 dark:text-white">
                {valor}
            </dd>
        </div>
    );
}

function Regra({
    titulo,
    ativa,
    sim,
    nao,
}: {
    titulo: string;
    ativa: boolean;
    sim: string;
    nao: string;
}) {
    return (
        <div className="phanyx-atividade-detalhe-regra flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">

            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {titulo}
            </span>

            <span
                className={[
                    "phanyx-atividade-detalhe-regra-status rounded-full px-3 py-1 text-xs font-black",
                    ativa
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
                ].join(" ")}
            >
                {ativa
                    ? sim
                    : nao}
            </span>

        </div>
    );
}

function Badge({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {children}
        </span>
    );
}

function AreaEmPreparacao({
    icone,
    titulo,
    rotulo,
    descricao,
}: {
    icone: string;
    titulo: string;
    rotulo: string;
    descricao: string;
}) {
    return (
        <section className="py-10 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-3xl dark:border-slate-700 dark:bg-slate-800">
                {icone}
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                {titulo}
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                {rotulo}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {descricao}
            </p>

        </section>
    );
}