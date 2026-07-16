"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type TipoFiltro =
  | "TODOS"
  | "ENTRADA"
  | "SAIDA";

type SituacaoFiltro =
  | "TODOS"
  | "VALIDA"
  | "INVALIDADA"
  | "CORRIGIDA";

type MarcacaoHistorico = {
  id: number;
  tipo: string;
  dataHora: string;
  dataLocal: string;
  status: string;
  statusLocalizacao: string;
  comprovanteCodigo: string;
  distanciaMetros?: number | null;
  origem: string;
  localNome?: string | null;
  corrigida: boolean;

  ultimoAjuste?: {
    acao: string;
    motivo: string;
    criadoEm: string;
    criadoPorNome?: string | null;
  } | null;
};

type RespostaHistorico = {
  sucesso?: boolean;
  pagina?: number;
  limite?: number;
  total?: number;
  totalPaginas?: number;
  fusoHorario?: string;
  marcacoes?: MarcacaoHistorico[];
  error?: string;
};

type MeusPontosMobileProps = {
  slug: string;
};

function formatarDataLocal(
  dataLocal: string
) {
  const correspondencia =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dataLocal
    );

  if (!correspondencia) {
    return dataLocal || "-";
  }

  const [, ano, mes, dia] =
    correspondencia;

  return `${dia}/${mes}/${ano}`;
}

function formatarHora(
  dataHora: string,
  fusoHorario: string
) {
  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return "--:--";
  }

  try {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(data);
  } catch {
    return data.toLocaleTimeString(
      "pt-BR"
    );
  }
}

function rotuloTipo(tipo: string) {
  switch (
    String(tipo || "").toUpperCase()
  ) {
    case "ENTRADA":
    case "RETORNO_ALMOCO":
      return "Entrada";

    case "SAIDA":
    case "SAIDA_ALMOCO":
      return "Saída";

    default:
      return tipo || "Marcação";
  }
}

function rotuloLocalizacao(
  status: string
) {
  switch (status) {
    case "DENTRO_DO_RAIO":
      return "Dentro do local autorizado";

    case "FORA_DO_RAIO_PERMITIDA":
      return "Fora do raio — autorizado";

    case "NAO_EXIGIDA":
      return "Localização não exigida";

    case "SEM_LOCAL_ATIVO":
      return "Sem local cadastrado";

    case "NAO_VERIFICADA":
      return "Localização não verificada";

    default:
      return status
        .replaceAll("_", " ")
        .toLocaleLowerCase("pt-BR");
  }
}

export default function MeusPontosMobile({
  slug,
}: MeusPontosMobileProps) {
  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [tipo, setTipo] =
    useState<TipoFiltro>("TODOS");

  const [situacao, setSituacao] =
    useState<SituacaoFiltro>("TODOS");

  const [pagina, setPagina] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(1);

  const [
    fusoHorario,
    setFusoHorario,
  ] = useState(
    "America/Sao_Paulo"
  );

  const [marcacoes, setMarcacoes] =
    useState<MarcacaoHistorico[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const carregarHistorico =
    useCallback(
      async (
        paginaAlvo = 1,
        filtros?: {
          dataInicio: string;
          dataFim: string;
          tipo: TipoFiltro;
          situacao: SituacaoFiltro;
        }
      ) => {
        try {
          setLoading(true);
          setErro("");

          const filtrosAtuais =
            filtros || {
              dataInicio,
              dataFim,
              tipo,
              situacao,
            };

          const parametros =
            new URLSearchParams();

          parametros.set(
            "pagina",
            String(paginaAlvo)
          );

          parametros.set(
            "limite",
            "10"
          );

          parametros.set(
            "tipo",
            filtrosAtuais.tipo
          );

          parametros.set(
            "situacao",
            filtrosAtuais.situacao
          );

          if (
            filtrosAtuais.dataInicio
          ) {
            parametros.set(
              "dataInicio",
              filtrosAtuais.dataInicio
            );
          }

          if (
            filtrosAtuais.dataFim
          ) {
            parametros.set(
              "dataFim",
              filtrosAtuais.dataFim
            );
          }

          const resposta = await fetch(
            `/api/rh-app/${encodeURIComponent(
              slug
            )}/ponto/historico?${parametros.toString()}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

          const dados: RespostaHistorico =
            await resposta.json();

          if (!resposta.ok) {
            if (resposta.status === 401) {
              window.location.href =
                `/rh-app/${encodeURIComponent(
                  slug
                )}/login`;

              return;
            }

            throw new Error(
              dados.error ||
                "Não foi possível carregar seus pontos."
            );
          }

          setMarcacoes(
            Array.isArray(
              dados.marcacoes
            )
              ? dados.marcacoes
              : []
          );

          setPagina(
            Number(dados.pagina || 1)
          );

          setTotal(
            Number(dados.total || 0)
          );

          setTotalPaginas(
            Math.max(
              1,
              Number(
                dados.totalPaginas || 1
              )
            )
          );

          setFusoHorario(
            dados.fusoHorario ||
              "America/Sao_Paulo"
          );
        } catch (error) {
          setMarcacoes([]);

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar seus pontos."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        dataFim,
        dataInicio,
        situacao,
        slug,
        tipo,
      ]
    );

  useEffect(() => {
    carregarHistorico(1);
  }, [carregarHistorico]);

  function buscar() {
    carregarHistorico(1);
  }

  function limparFiltros() {
    const filtrosLimpos = {
      dataInicio: "",
      dataFim: "",
      tipo:
        "TODOS" as TipoFiltro,
      situacao:
        "TODOS" as SituacaoFiltro,
    };

    setDataInicio("");
    setDataFim("");
    setTipo("TODOS");
    setSituacao("TODOS");

    carregarHistorico(
      1,
      filtrosLimpos
    );
  }

  function mudarPagina(
    novaPagina: number
  ) {
    if (
      novaPagina < 1 ||
      novaPagina > totalPaginas ||
      loading
    ) {
      return;
    }

    carregarHistorico(novaPagina);
  }

  return (
    <section className="rounded-[30px] border border-slate-700 bg-slate-900 p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Meus pontos
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            Histórico de marcações
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Consulte suas entradas,
            saídas, comprovantes e
            correções realizadas pelo RH.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-blue-800 bg-blue-950 px-3 py-2 text-xs font-black text-blue-200">
          {total}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Data inicial
          </label>

          <input
            type="date"
            value={dataInicio}
            onChange={(evento) =>
              setDataInicio(
                evento.target.value
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Data final
          </label>

          <input
            type="date"
            value={dataFim}
            onChange={(evento) =>
              setDataFim(
                evento.target.value
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Tipo
          </label>

          <select
            value={tipo}
            onChange={(evento) =>
              setTipo(
                evento.target
                  .value as TipoFiltro
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            <option value="TODOS">
              Entrada e saída
            </option>

            <option value="ENTRADA">
              Entrada
            </option>

            <option value="SAIDA">
              Saída
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
            Situação
          </label>

          <select
            value={situacao}
            onChange={(evento) =>
              setSituacao(
                evento.target
                  .value as SituacaoFiltro
              )
            }
            className="min-h-12 w-full rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            <option value="TODOS">
              Todas
            </option>

            <option value="VALIDA">
              Válidas
            </option>

            <option value="INVALIDADA">
              Invalidadas
            </option>

            <option value="CORRIGIDA">
              Corrigidas pelo RH
            </option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={buscar}
          disabled={loading}
          className="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-50"
        >
          {loading
            ? "Carregando..."
            : "Buscar pontos"}
        </button>

        <button
          type="button"
          onClick={limparFiltros}
          disabled={loading}
          className="min-h-12 rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 font-black text-slate-200 disabled:opacity-50"
        >
          Limpar filtros
        </button>
      </div>

      {erro && (
        <div className="mt-5 rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          {erro}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 text-sm font-bold text-slate-300">
            Carregando seus pontos...
          </div>
        ) : marcacoes.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
            Nenhuma marcação encontrada
            com os filtros informados.
          </div>
        ) : (
          marcacoes.map((marcacao) => {
            const entrada =
              rotuloTipo(
                marcacao.tipo
              ) === "Entrada";

            const invalidada =
              marcacao.status ===
              "INVALIDADA";

            return (
              <article
                key={marcacao.id}
                className={`rounded-2xl border p-4 ${
                  invalidada
                    ? "border-red-800 bg-red-950/30"
                    : entrada
                      ? "border-emerald-800 bg-emerald-950/25"
                      : "border-blue-800 bg-blue-950/25"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {formatarDataLocal(
                        marcacao.dataLocal
                      )}
                    </p>

                    <h3 className="mt-1 text-lg font-black text-white">
                      {rotuloTipo(
                        marcacao.tipo
                      )}
                    </h3>
                  </div>

                  <p className="shrink-0 font-mono text-sm font-black text-blue-200">
                    {formatarHora(
                      marcacao.dataHora,
                      fusoHorario
                    )}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      invalidada
                        ? "bg-red-900 text-red-100"
                        : "bg-emerald-900 text-emerald-100"
                    }`}
                  >
                    {marcacao.status}
                  </span>

                  {marcacao.corrigida && (
                    <span className="rounded-full bg-amber-900 px-3 py-1 text-xs font-black text-amber-100">
                      Corrigida pelo RH
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>
                    <strong>Local:</strong>{" "}
                    {marcacao.localNome ||
                      "Não informado"}
                  </p>

                  <p>
                    <strong>
                      Localização:
                    </strong>{" "}
                    {rotuloLocalizacao(
                      marcacao.statusLocalizacao
                    )}
                  </p>

                  {typeof marcacao.distanciaMetros ===
                    "number" && (
                    <p>
                      <strong>
                        Distância:
                      </strong>{" "}
                      {Math.round(
                        marcacao.distanciaMetros
                      )}{" "}
                      metros
                    </p>
                  )}

                  <p className="break-all">
                    <strong>
                      Comprovante:
                    </strong>{" "}
                    {
                      marcacao.comprovanteCodigo
                    }
                  </p>
                </div>

                {marcacao.ultimoAjuste && (
                  <div className="mt-4 rounded-2xl border border-amber-800 bg-amber-950/30 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-200">
                      Última correção
                    </p>

                    <p className="mt-2 text-sm text-amber-100">
                      {
                        marcacao
                          .ultimoAjuste
                          .motivo
                      }
                    </p>

                    {marcacao
                      .ultimoAjuste
                      .criadoPorNome && (
                      <p className="mt-2 text-xs text-amber-300">
                        Responsável:{" "}
                        {
                          marcacao
                            .ultimoAjuste
                            .criadoPorNome
                        }
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={
            pagina <= 1 || loading
          }
          onClick={() =>
            mudarPagina(pagina - 1)
          }
          className="min-h-11 rounded-2xl border border-slate-600 bg-slate-950 px-4 py-2 text-sm font-black text-slate-200 disabled:opacity-40"
        >
          Anterior
        </button>

        <p className="text-xs font-bold text-slate-400">
          Página {pagina} de{" "}
          {totalPaginas}
        </p>

        <button
          type="button"
          disabled={
            pagina >= totalPaginas ||
            loading
          }
          onClick={() =>
            mudarPagina(pagina + 1)
          }
          className="min-h-11 rounded-2xl border border-slate-600 bg-slate-950 px-4 py-2 text-sm font-black text-slate-200 disabled:opacity-40"
        >
          Próxima
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
        <p className="text-sm font-black text-slate-200">
          Correção de ponto
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          A edição não fica liberada
          livremente. Quando o RH
          autorizar uma correção
          específica, ela aparecerá
          nesta área para você
          preencher e enviar.
        </p>
      </div>
    </section>
  );
}