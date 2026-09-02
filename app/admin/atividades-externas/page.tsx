"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type Responsavel = {
  id: number;
  nome?: string | null;
  email?: string | null;

  funcionario?: {
    nome?: string | null;
  } | null;
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

type ContadoresAtividade = {
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

  curricular: boolean;
  obrigatoria: boolean;
  internacional: boolean;

  destinoNome?: string | null;
  cidadeDestino?: string | null;
  regiaoDestino?: string | null;
  paisDestino?: string | null;

  saidaEm?: string | null;
  retornoPrevistoEm?: string | null;

  capacidadeMaxima?: number | null;

  polo?: Polo | null;
  responsavelPrincipal?: Responsavel | null;

  turmas?: TurmaVinculada[];

  _count?: ContadoresAtividade;
};

type Paginacao = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

type RespostaApi = {
  ok?: boolean;
  atividades?: AtividadeExterna[];
  paginacao?: Paginacao;
  message?: string;
  error?: string;
};

const STATUS = [
  "RASCUNHO",
  "PLANEJAMENTO",
  "AGUARDANDO_AUTORIZACOES",
  "CONFIRMADA",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "CANCELADA",
  "ARQUIVADA",
] as const;

const TIPOS = [
  "EXCURSAO",
  "VISITA_TECNICA",
  "VIAGEM_PEDAGOGICA",
  "ACAMPAMENTO",
  "RETIRO",
  "COMPETICAO",
  "INTERCAMBIO",
  "EVENTO_ESPORTIVO",
  "ATIVIDADE_COMUNITARIA",
  "VIAGEM_INTERNACIONAL",
  "OUTRA",
] as const;

function corStatus(status: string) {
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

function iconeTipo(tipo: string) {
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

export default function AtividadesExternasPage() {
  const t =
    useTranslations(
      "AdminExternalActivities"
    );

  const locale = useLocale();

  const [atividades, setAtividades] =
    useState<AtividadeExterna[]>([]);

  const [paginacao, setPaginacao] =
    useState<Paginacao>({
      pagina: 1,
      limite: 24,
      total: 0,
      totalPaginas: 0,
    });

  const [busca, setBusca] =
    useState("");

  const [buscaAplicada, setBuscaAplicada] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [pagina, setPagina] =
    useState(1);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const formatadorData = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );

  function formatarData(
    valor?: string | null
  ) {
    if (!valor) {
      return t("labels.noDate");
    }

    const data = new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return t("labels.noDate");
    }

    return formatadorData.format(data);
  }

  function traduzirStatus(
    valor: string
  ) {
    switch (valor) {
      case "RASCUNHO":
        return t("status.RASCUNHO");

      case "PLANEJAMENTO":
        return t(
          "status.PLANEJAMENTO"
        );

      case "AGUARDANDO_AUTORIZACOES":
        return t(
          "status.AGUARDANDO_AUTORIZACOES"
        );

      case "CONFIRMADA":
        return t("status.CONFIRMADA");

      case "EM_ANDAMENTO":
        return t(
          "status.EM_ANDAMENTO"
        );

      case "CONCLUIDA":
        return t("status.CONCLUIDA");

      case "CANCELADA":
        return t("status.CANCELADA");

      case "ARQUIVADA":
        return t("status.ARQUIVADA");

      default:
        return valor;
    }
  }

  function traduzirTipo(
    valor: string
  ) {
    switch (valor) {
      case "EXCURSAO":
        return t("types.EXCURSAO");

      case "VISITA_TECNICA":
        return t(
          "types.VISITA_TECNICA"
        );

      case "VIAGEM_PEDAGOGICA":
        return t(
          "types.VIAGEM_PEDAGOGICA"
        );

      case "ACAMPAMENTO":
        return t("types.ACAMPAMENTO");

      case "RETIRO":
        return t("types.RETIRO");

      case "COMPETICAO":
        return t("types.COMPETICAO");

      case "INTERCAMBIO":
        return t("types.INTERCAMBIO");

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
        return t("types.OUTRA");

      default:
        return valor;
    }
  }

  function destinoDaAtividade(
    atividade: AtividadeExterna
  ) {
    const local =
      atividade.destinoNome?.trim();

    const cidade =
      atividade.cidadeDestino?.trim();

    const regiao =
      atividade.regiaoDestino?.trim();

    const pais =
      atividade.paisDestino?.trim();

    const partes = [
      cidade,
      regiao,
      pais,
    ].filter(Boolean);

    if (
      local &&
      partes.length > 0
    ) {
      return `${local} — ${partes.join(
        ", "
      )}`;
    }

    if (local) {
      return local;
    }

    if (partes.length > 0) {
      return partes.join(", ");
    }

    return t(
      "labels.noDestination"
    );
  }

  function nomeDoResponsavel(
  atividade: AtividadeExterna
) {
  const responsavel =
    atividade.responsavelPrincipal;

  if (!responsavel) {
    return t(
      "labels.noResponsible"
    );
  }

  return (
    responsavel.nome?.trim() ||
    responsavel.funcionario?.nome?.trim() ||
    responsavel.email?.trim() ||
    t("labels.noResponsible")
  );
}

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const params =
        new URLSearchParams();

      params.set(
        "pagina",
        String(pagina)
      );

      params.set("limite", "24");

      if (buscaAplicada) {
        params.set(
          "busca",
          buscaAplicada
        );
      }

      if (status) {
        params.set(
          "status",
          status
        );
      }

      if (tipo) {
        params.set(
          "tipo",
          tipo
        );
      }

      const resposta = await fetch(
        `/api/admin/atividades-externas?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados: RespostaApi =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.message ||
            dados?.error ||
            t("errors.load")
        );
      }

      setAtividades(
        Array.isArray(
          dados?.atividades
        )
          ? dados.atividades
          : []
      );

      setPaginacao(
        dados?.paginacao || {
          pagina,
          limite: 24,
          total: 0,
          totalPaginas: 0,
        }
      );
    } catch (e: unknown) {
      setErro(
        e instanceof Error
          ? e.message
          : t("errors.load")
      );

      setAtividades([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setPagina(1);
        setBuscaAplicada(
          busca.trim()
        );
      }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [busca]);

  useEffect(() => {
    void carregar();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagina,
    buscaAplicada,
    status,
    tipo,
  ]);

  function limparFiltros() {
    setBusca("");
    setBuscaAplicada("");
    setStatus("");
    setTipo("");
    setPagina(1);
  }

  const possuiFiltros =
    Boolean(
      busca ||
        status ||
        tipo
    );

  return (
    <main className="phanyx-atividades-externas-page min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Cabeçalho */}
        <section className="phanyx-theme-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                {t("eyebrow")}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-2xl dark:border-blue-900 dark:bg-blue-950/40">
                  🧭
                </div>

                <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {t("title")}
                </h1>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                {t("subtitle")}
              </p>
            </div>

            <Link
              href="/admin/atividades-externas/nova"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              <span
                aria-hidden="true"
                className="text-lg"
              >
                +
              </span>

              {t("newActivity")}
            </Link>
          </div>
        </section>

        {/* Busca e filtros */}
        <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_220px_240px_auto]">
            <label className="block">
              <span className="sr-only">
                {t(
                  "searchPlaceholder"
                )}
              </span>

              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  🔎
                </span>

                <input
                  type="search"
                  value={busca}
                  onChange={(evento) =>
                    setBusca(
                      evento.target.value
                    )
                  }
                  placeholder={t(
                    "searchPlaceholder"
                  )}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 xl:sr-only">
                {t(
                  "filters.status"
                )}
              </span>

              <select
                value={status}
                onChange={(evento) => {
                  setStatus(
                    evento.target.value
                  );
                  setPagina(1);
                }}
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">
                  {t(
                    "filters.allStatuses"
                  )}
                </option>

                {STATUS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {traduzirStatus(
                        item
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 xl:sr-only">
                {t("filters.type")}
              </span>

              <select
                value={tipo}
                onChange={(evento) => {
                  setTipo(
                    evento.target.value
                  );
                  setPagina(1);
                }}
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">
                  {t(
                    "filters.allTypes"
                  )}
                </option>

                {TIPOS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {traduzirTipo(
                        item
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <button
              type="button"
              onClick={limparFiltros}
              disabled={!possuiFiltros}
              className="h-12 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("filters.clear")}
            </button>
          </div>
        </section>

        {/* Erro */}
        {erro ? (
          <section className="rounded-3xl border border-red-300 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                {erro}
              </p>

              <button
                type="button"
                onClick={() =>
                  void carregar()
                }
                className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
              >
                {t("retry")}
              </button>
            </div>
          </section>
        ) : null}

        {/* Contagem */}
        {!carregando && !erro ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {paginacao.total === 1
                ? t(
                    "results.one",
                    {
                      count:
                        paginacao.total,
                    }
                  )
                : t(
                    "results.other",
                    {
                      count:
                        paginacao.total,
                    }
                  )}
            </p>

            {paginacao.totalPaginas >
            1 ? (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {paginacao.pagina} /{" "}
                {
                  paginacao.totalPaginas
                }
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Loading */}
        {carregando ? (
          <section className="phanyx-theme-card rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

            <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t("loading")}
            </p>
          </section>
        ) : null}

        {/* Vazio */}
        {!carregando &&
        !erro &&
        atividades.length === 0 ? (
          <section className="phanyx-theme-card rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-3xl dark:border-slate-700 dark:bg-slate-800">
              🗺️
            </div>

            <h2 className="mt-5 text-lg font-black text-slate-900 dark:text-white">
              {t("empty.title")}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(
                "empty.description"
              )}
            </p>
          </section>
        ) : null}

        {/* Cards */}
        {!carregando &&
        !erro &&
        atividades.length > 0 ? (
          <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {atividades.map(
              (atividade) => {
                const contadores =
                  atividade._count;

                return (
                  <article
                    key={
                      atividade.id
                    }
                    className="phanyx-theme-card group flex min-h-[390px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl dark:border-slate-700 dark:bg-slate-800">
                          {iconeTipo(
                            atividade.tipo
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                            {traduzirTipo(
                              atividade.tipo
                            )}
                          </p>

                          <h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-950 dark:text-white">
                            {
                              atividade.titulo
                            }
                          </h2>
                        </div>
                      </div>

                      <span className="inline-flex flex-none items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${corStatus(
                            atividade.status
                          )}`}
                        />

                        {traduzirStatus(
                          atividade.status
                        )}
                      </span>
                    </div>

                    {/* Características */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {atividade.curricular ? (
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                          📘{" "}
                          {t(
                            "labels.curricular"
                          )}
                        </span>
                      ) : null}

                      {atividade.obrigatoria ? (
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                          📌{" "}
                          {t(
                            "labels.mandatory"
                          )}
                        </span>
                      ) : null}

                      {atividade.internacional ? (
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                          🌍{" "}
                          {t(
                            "labels.international"
                          )}
                        </span>
                      ) : null}
                    </div>

                    {/* Dados principais */}
                    <dl className="mt-5 grid gap-4">
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "labels.destination"
                          )}
                        </dt>

                        <dd className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                          {destinoDaAtividade(
                            atividade
                          )}
                        </dd>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t(
                              "labels.departure"
                            )}
                          </dt>

                          <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {formatarData(
                              atividade.saidaEm
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t(
                              "labels.return"
                            )}
                          </dt>

                          <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {formatarData(
                              atividade.retornoPrevistoEm
                            )}
                          </dd>
                        </div>
                      </div>

                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(
                            "labels.responsible"
                          )}
                        </dt>

                        <dd className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {nomeDoResponsavel(
  atividade
)}
                        </dd>
                      </div>
                    </dl>

                    {/* Contadores */}
                    <div className="mt-5 grid grid-cols-4 gap-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                        <strong className="block text-lg font-black text-slate-950 dark:text-white">
                          {contadores?.participantes ??
                            0}
                        </strong>

                        <span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                          {t(
                            "labels.participants"
                          )}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                        <strong className="block text-lg font-black text-slate-950 dark:text-white">
                          {contadores?.autorizacoes ??
                            0}
                        </strong>

                        <span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                          {t(
                            "labels.authorizations"
                          )}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                        <strong className="block text-lg font-black text-slate-950 dark:text-white">
                          {contadores?.trechos ??
                            0}
                        </strong>

                        <span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                          {t(
                            "labels.legs"
                          )}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                        <strong className="block text-lg font-black text-slate-950 dark:text-white">
                          {contadores?.riscos ??
                            0}
                        </strong>

                        <span className="mt-1 block text-[11px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                          {t(
                            "labels.risks"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      <Link
                        href={`/admin/atividades-externas/${atividade.id}`}
                        className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-blue-300 bg-blue-50 px-4 text-sm font-bold text-blue-800 transition hover:border-blue-400 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70"
                      >
                        {t(
                          "actions.open"
                        )}
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        ) : null}

        {/* Paginação */}
        {!carregando &&
        !erro &&
        paginacao.totalPaginas > 1 ? (
          <nav
            aria-label="Pagination"
            className="phanyx-theme-card flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              disabled={
                pagina <= 1
              }
              onClick={() =>
                setPagina(
                  (atual) =>
                    Math.max(
                      1,
                      atual - 1
                    )
                )
              }
              className="min-h-11 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ←{" "}
              {t(
                "actions.previous"
              )}
            </button>

            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {paginacao.pagina} /{" "}
              {
                paginacao.totalPaginas
              }
            </span>

            <button
              type="button"
              disabled={
                pagina >=
                paginacao.totalPaginas
              }
              onClick={() =>
                setPagina(
                  (atual) =>
                    Math.min(
                      paginacao.totalPaginas,
                      atual + 1
                    )
                )
              }
              className="min-h-11 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("actions.next")} →
            </button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}