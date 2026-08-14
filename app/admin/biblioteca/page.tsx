"use client";

import { useCallback, useEffect, useState } from "react";

type IndicadoresBiblioteca = {
  totalItens: number;
  itensPublicados: number;
  itensRascunho: number;
  arquivosDisponiveis: number;
  emprestimosAtivos: number;
  emprestimosAtrasados: number;
  reservasAguardando: number;
  avaliacoesPendentes: number;
  recomendacoesPublicadas: number;
};

type ItemRecente = {
  id: number;
  titulo: string;
  tipo: string;
  status: string;
  capaUrl: string | null;
  criadoEm: string;
};

type DadosDashboard = {
  biblioteca: {
    nome: string;
    plano: string;
    statusModulo: string;
  };

  indicadores: IndicadoresBiblioteca;

  armazenamento: {
    contratadoBytes: string;
    extraBytes: string;
    limiteBytes: string;
    utilizadoBytes: string;
    disponivelBytes: string;
  };

  itensRecentes: ItemRecente[];
};

type ErroApi = {
  error?: string;
  codigo?: string;
};

const rotulosTipo: Record<string, string> = {
  LIVRO: "Livro",
  EBOOK: "E-book",
  ARTIGO_CIENTIFICO: "Artigo científico",
  REVISTA: "Revista",
  PERIODICO: "Periódico",
  APOSTILA: "Apostila",
  TCC: "TCC",
  MONOGRAFIA: "Monografia",
  DISSERTACAO: "Dissertação",
  TESE: "Tese",
  PESQUISA: "Pesquisa",
  DOCUMENTO: "Documento",
  VIDEO: "Vídeo",
  DOCUMENTARIO: "Documentário",
  AUDIO: "Áudio",
  AUDIOLIVRO: "Audiolivro",
  PODCAST: "Podcast",
  LINK_EXTERNO: "Link externo",
  OUTRO: "Outro",
};

const rotulosStatus: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em revisão",
  PUBLICADO: "Publicado",
  RESTRITO: "Restrito",
  INDISPONIVEL: "Indisponível",
  ARQUIVADO: "Arquivado",
};

function formatarBytes(valor: string) {
  const bytes = Number(valor || 0);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const unidades = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1
  );

  const resultado =
    bytes / Math.pow(1024, indice);

  return `${resultado.toLocaleString("pt-BR", {
    minimumFractionDigits: indice === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} ${unidades[indice]}`;
}

function formatarData(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function classeStatus(status: string) {
  switch (status) {
    case "PUBLICADO":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";

    case "EM_REVISAO":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200";

    case "ARQUIVADO":
    case "INDISPONIVEL":
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

    case "RESTRITO":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200";

    default:
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
  }
}

function CardIndicador({
  titulo,
  valor,
  icone,
  alerta = false,
}: {
  titulo: string;
  valor: number;
  icone: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 shadow-sm transition",
        "bg-white dark:bg-slate-900",
        alerta && valor > 0
          ? "border-red-300 dark:border-red-800"
          : "border-slate-200 dark:border-slate-800",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {titulo}
          </p>

          <p
            className={[
              "mt-2 text-3xl font-bold",
              alerta && valor > 0
                ? "text-red-700 dark:text-red-300"
                : "text-slate-950 dark:text-white",
            ].join(" ")}
          >
            {valor.toLocaleString("pt-BR")}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="rounded-xl bg-slate-100 p-2 text-xl dark:bg-slate-800"
        >
          {icone}
        </span>
      </div>
    </div>
  );
}

function CarregandoDashboard() {
  return (
    <div className="space-y-6" aria-label="Carregando biblioteca">
      <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, indice) => (
          <div
            key={indice}
            className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export default function BibliotecaDashboardPage() {
  const [dados, setDados] =
    useState<DadosDashboard | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  const carregarDashboard = useCallback(
    async () => {
      setCarregando(true);
      setErro(null);

      try {
        const resposta = await fetch(
          "/api/admin/biblioteca/dashboard",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const corpo = (await resposta.json()) as
          | DadosDashboard
          | ErroApi;

        if (!resposta.ok) {
          throw new Error(
            "error" in corpo &&
              typeof corpo.error === "string"
              ? corpo.error
              : "Não foi possível carregar a Biblioteca Virtual."
          );
        }

        setDados(corpo as DadosDashboard);
      } catch (error) {
        setDados(null);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a Biblioteca Virtual."
        );
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  useEffect(() => {
    void carregarDashboard();
  }, [carregarDashboard]);

  if (carregando) {
    return (
      <main className="phanyx-biblioteca-page min-h-screen bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-6">
        <CarregandoDashboard />
      </main>
    );
  }

  if (erro || !dados) {
  return (
    <main className="phanyx-biblioteca-page phanyx-biblioteca-page min-h-screen p-4 sm:p-6">
      <section className="phanyx-biblioteca-erro mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span
            className="phanyx-biblioteca-erro-icone rounded-xl p-3 text-2xl"
            aria-hidden="true"
          >
            🔒
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="phanyx-biblioteca-erro-titulo text-xl font-bold">
              Biblioteca Virtual indisponível
            </h1>

            <p
              className="phanyx-biblioteca-erro-texto mt-2 text-sm leading-6"
              role="alert"
            >
              {erro ||
                "Você não possui acesso à Biblioteca Virtual."}
            </p>

            <button
              type="button"
              onClick={() => void carregarDashboard()}
              className="phanyx-biblioteca-erro-botao mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

  const limite =
    Number(dados.armazenamento.limiteBytes) || 0;

  const utilizado =
    Number(dados.armazenamento.utilizadoBytes) || 0;

  const percentualArmazenamento =
    limite > 0
      ? Math.min(
          100,
          Math.max(0, (utilizado / limite) * 100)
        )
      : 0;

  const indicadores = dados.indicadores;

  return (
    <main className="phanyx-biblioteca-page min-h-screen bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  📚 {dados.biblioteca.nome}
                </h1>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                  {dados.biblioteca.statusModulo}
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Gerencie o acervo físico e digital,
                circulação, recomendações acadêmicas e
                utilização do armazenamento da instituição.
              </p>

              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Plano da biblioteca:{" "}
                {dados.biblioteca.plano}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void carregarDashboard()
              }
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 dark:focus:ring-offset-slate-900"
            >
              Atualizar painel
            </button>
          </div>
        </header>

        <section
          aria-labelledby="indicadores-biblioteca"
          className="space-y-4"
        >
          <h2
            id="indicadores-biblioteca"
            className="text-lg font-bold text-slate-950 dark:text-white"
          >
            Visão geral
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CardIndicador
              titulo="Itens no acervo"
              valor={indicadores.totalItens}
              icone="📚"
            />

            <CardIndicador
              titulo="Itens publicados"
              valor={indicadores.itensPublicados}
              icone="✅"
            />

            <CardIndicador
              titulo="Arquivos disponíveis"
              valor={indicadores.arquivosDisponiveis}
              icone="📄"
            />

            <CardIndicador
              titulo="Empréstimos ativos"
              valor={indicadores.emprestimosAtivos}
              icone="🤝"
            />

            <CardIndicador
              titulo="Empréstimos atrasados"
              valor={indicadores.emprestimosAtrasados}
              icone="⏰"
              alerta
            />

            <CardIndicador
              titulo="Reservas aguardando"
              valor={indicadores.reservasAguardando}
              icone="🕒"
            />

            <CardIndicador
              titulo="Avaliações pendentes"
              valor={indicadores.avaliacoesPendentes}
              icone="⭐"
            />

            <CardIndicador
              titulo="Recomendações ativas"
              valor={
                indicadores.recomendacoesPublicadas
              }
              icone="🎓"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                Itens cadastrados recentemente
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Últimos materiais adicionados ao acervo da
                instituição.
              </p>
            </div>

            {dados.itensRecentes.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-4xl" aria-hidden="true">
                  📖
                </div>

                <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">
                  Nenhum item cadastrado
                </p>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Os primeiros livros, artigos e mídias
                  aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {dados.itensRecentes.map((item) => (
                  <article
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-xl dark:border-slate-700 dark:bg-slate-800">
                      {item.capaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.capaUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden="true">📘</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-950 dark:text-white">
                        {item.titulo}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>
                          {rotulosTipo[item.tipo] ||
                            item.tipo}
                        </span>

                        <span aria-hidden="true">•</span>

                        <span>
                          {formatarData(item.criadoEm)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold",
                        classeStatus(item.status),
                      ].join(" ")}
                    >
                      {rotulosStatus[item.status] ||
                        item.status}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              Armazenamento
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Espaço utilizado pelos arquivos da biblioteca.
            </p>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <span className="text-2xl font-bold text-slate-950 dark:text-white">
                  {formatarBytes(
                    dados.armazenamento.utilizadoBytes
                  )}
                </span>

                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {percentualArmazenamento.toLocaleString(
                    "pt-BR",
                    {
                      maximumFractionDigits: 1,
                    }
                  )}
                  %
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={[
                    "h-full rounded-full transition-all",
                    percentualArmazenamento >= 90
                      ? "bg-red-600"
                      : percentualArmazenamento >= 75
                        ? "bg-amber-500"
                        : "bg-emerald-600",
                  ].join(" ")}
                  style={{
                    width: `${percentualArmazenamento}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Limite total:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {formatarBytes(
                    dados.armazenamento.limiteBytes
                  )}
                </strong>
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Disponível:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {formatarBytes(
                    dados.armazenamento.disponivelBytes
                  )}
                </strong>
              </p>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600 dark:text-slate-300">
                    Contratado
                  </dt>
                  <dd className="font-semibold text-slate-950 dark:text-white">
                    {formatarBytes(
                      dados.armazenamento
                        .contratadoBytes
                    )}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600 dark:text-slate-300">
                    Espaço extra
                  </dt>
                  <dd className="font-semibold text-slate-950 dark:text-white">
                    {formatarBytes(
                      dados.armazenamento.extraBytes
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}