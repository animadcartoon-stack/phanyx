"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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
};

type AutorizacaoCorrecao = {
  id: number;
  status: string;
  motivoAutorizacao: string;
  autorizadoEm: string;
  validoAte: string;
  utilizadoEm?: string | null;
  limiteEnvios: number;
  enviosRealizados: number;

  autorizadoPor: {
    id: number;
    nome: string;
  };
};

type JornadaHistorico = {
  id: number;
  dataLocal: string;
  status: string;
  horasTrabalhadas?: string | null;
  horasExtras?: string | null;
  horasAtraso?: string | null;
  observacoes?: string | null;
  marcacoes: MarcacaoHistorico[];
  autorizacao?: AutorizacaoCorrecao | null;

  ultimaSolicitacao?: {
    id: number;
    status: string;
    motivoFuncionario: string;
    enviadoEm?: string | null;
    aplicadoEm?: string | null;
  } | null;
};

type RespostaHistorico = {
  sucesso?: boolean;
  pagina?: number;
  limite?: number;
  total?: number;
  totalPaginas?: number;
  fusoHorario?: string;
  jornadas?: JornadaHistorico[];
  error?: string;
};

type ItemEdicao = {
  chave: string;
  id: number | null;
  tipo: "ENTRADA" | "SAIDA";
  hora: string;
};

type RespostaCorrecao = {
  sucesso?: boolean;
  mensagem?: string;
  whatsappStatus?: string;
  error?: string;
};

type MeusPontosMobileProps = {
  slug: string;
};

const CHAVE_DISPOSITIVO =
  "phanyx-rh-ponto-dispositivo-v1";

function gerarChaveLocal() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
  ].join("-");
}

function obterDispositivoId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existente =
      window.localStorage.getItem(
        CHAVE_DISPOSITIVO
      );

    if (existente) {
      return existente;
    }

    const novo =
      `dispositivo:${gerarChaveLocal()}`;

    window.localStorage.setItem(
      CHAVE_DISPOSITIVO,
      novo
    );

    return novo;
  } catch {
    return `temporario:${gerarChaveLocal()}`;
  }
}

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

function horaParaEdicao(
  dataHora: string,
  fusoHorario: string
) {
  const data = new Date(dataHora);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  try {
    const partes =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: fusoHorario,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }
      ).formatToParts(data);

    const hora =
      partes.find(
        (parte) =>
          parte.type === "hour"
      )?.value || "";

    const minuto =
      partes.find(
        (parte) =>
          parte.type === "minute"
      )?.value || "";

    return hora && minuto
      ? `${hora}:${minuto}`
      : "";
  } catch {
    return data
      .toTimeString()
      .slice(0, 5);
  }
}

function formatarDataHoraCompleta(
  dataIso: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return dataIso;
  }

  return data.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
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

function tipoNormalizado(
  tipo: string
): "ENTRADA" | "SAIDA" {
  return rotuloTipo(tipo) === "Saída"
    ? "SAIDA"
    : "ENTRADA";
}

function rotuloLocalizacao(
  status: string
) {
  switch (status) {
    case "DENTRO_DO_RAIO":
      return "Dentro do local autorizado";

    case "FORA_DO_RAIO_PERMITIDA":
      return "Fora do raio — autorizado";

    case "CORRECAO_AUTORIZADA":
      return "Correção autorizada pelo RH";

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

function numero(valor: unknown) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
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

  const [jornadas, setJornadas] =
    useState<JornadaHistorico[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState({
    dataInicio: "",
    dataFim: "",
    tipo:
      "TODOS" as TipoFiltro,
    situacao:
      "TODOS" as SituacaoFiltro,
  });

  const [jornadaEditando, setJornadaEditando] =
    useState<JornadaHistorico | null>(
      null
    );

  const [itensEdicao, setItensEdicao] =
    useState<ItemEdicao[]>([]);

  const [
    motivoFuncionario,
    setMotivoFuncionario,
  ] = useState("");

  const [
    enviandoCorrecao,
    setEnviandoCorrecao,
  ] = useState(false);

  const carregarHistorico =
    useCallback(
      async (
        paginaAlvo: number,
        filtros: {
          dataInicio: string;
          dataFim: string;
          tipo: TipoFiltro;
          situacao: SituacaoFiltro;
        }
      ) => {
        try {
          setLoading(true);
          setErro("");

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
            filtros.tipo
          );

          parametros.set(
            "situacao",
            filtros.situacao
          );

          if (filtros.dataInicio) {
            parametros.set(
              "dataInicio",
              filtros.dataInicio
            );
          }

          if (filtros.dataFim) {
            parametros.set(
              "dataFim",
              filtros.dataFim
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

          setJornadas(
            Array.isArray(dados.jornadas)
              ? dados.jornadas
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
          setJornadas([]);

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar seus pontos."
          );
        } finally {
          setLoading(false);
        }
      },
      [slug]
    );

  useEffect(() => {
    carregarHistorico(
      1,
      filtrosAplicados
    );
  }, [
    carregarHistorico,
    filtrosAplicados,
  ]);

  const quantidadeMarcacoes =
    useMemo(() => {
      return jornadas.reduce(
        (totalAtual, jornada) =>
          totalAtual +
          jornada.marcacoes.filter(
            (marcacao) =>
              marcacao.status !==
              "INVALIDADA"
          ).length,
        0
      );
    }, [jornadas]);

  function buscar() {
    setSucesso("");

    setFiltrosAplicados({
      dataInicio,
      dataFim,
      tipo,
      situacao,
    });
  }

  function limparFiltros() {
    const limpos = {
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
    setSucesso("");

    setFiltrosAplicados(limpos);
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

    carregarHistorico(
      novaPagina,
      filtrosAplicados
    );
  }

  function abrirEditor(
    jornada: JornadaHistorico
  ) {
    if (
      jornada.autorizacao?.status !==
      "ATIVA"
    ) {
      setErro(
        "Esta jornada não possui uma autorização ativa do RH."
      );

      return;
    }

    const validas =
      jornada.marcacoes.filter(
        (marcacao) =>
          marcacao.status !==
          "INVALIDADA"
      );

    setItensEdicao(
      validas.map((marcacao) => ({
        chave:
          `original:${marcacao.id}`,

        id: marcacao.id,

        tipo:
          tipoNormalizado(
            marcacao.tipo
          ),

        hora:
          horaParaEdicao(
            marcacao.dataHora,
            fusoHorario
          ),
      }))
    );

    setMotivoFuncionario("");
    setErro("");
    setSucesso("");
    setJornadaEditando(jornada);
  }

  function fecharEditor() {
    if (enviandoCorrecao) {
      return;
    }

    setJornadaEditando(null);
    setItensEdicao([]);
    setMotivoFuncionario("");
  }

  function adicionarMarcacao(
    tipoAdicionar:
      | "ENTRADA"
      | "SAIDA"
  ) {
    setItensEdicao((anteriores) => [
      ...anteriores,

      {
        chave:
          `nova:${gerarChaveLocal()}`,

        id: null,
        tipo: tipoAdicionar,
        hora: "",
      },
    ]);
  }

  function atualizarItem(
    chave: string,
    campo: "tipo" | "hora",
    valor: string
  ) {
    setItensEdicao((anteriores) =>
      anteriores.map((item) =>
        item.chave === chave
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  }

  function removerItem(
    chave: string
  ) {
    setItensEdicao((anteriores) =>
      anteriores.filter(
        (item) =>
          item.chave !== chave
      )
    );
  }

  async function enviarCorrecao() {
    if (
      !jornadaEditando?.autorizacao
    ) {
      return;
    }

    try {
      setEnviandoCorrecao(true);
      setErro("");
      setSucesso("");

      if (
        motivoFuncionario
          .trim()
          .length < 10
      ) {
        throw new Error(
          "Informe o motivo da correção com pelo menos 10 caracteres."
        );
      }

      if (itensEdicao.length === 0) {
        throw new Error(
          "Adicione ao menos uma entrada ou saída."
        );
      }

      const itemInvalido =
        itensEdicao.find(
          (item) =>
            !item.hora ||
            !/^\d{2}:\d{2}$/.test(
              item.hora
            )
        );

      if (itemInvalido) {
        throw new Error(
          "Preencha todos os horários antes de enviar."
        );
      }

      const resposta = await fetch(
        `/api/rh-app/${encodeURIComponent(
          slug
        )}/ponto/correcoes`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            autorizacaoId:
              jornadaEditando
                .autorizacao.id,

            motivoFuncionario:
              motivoFuncionario.trim(),

            dispositivoId:
              obterDispositivoId(),

            marcacoes:
              itensEdicao.map(
                (item) => ({
                  id: item.id,
                  tipo: item.tipo,
                  hora: item.hora,
                })
              ),
          }),
        }
      );

      const dados: RespostaCorrecao =
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
            "Não foi possível enviar a correção."
        );
      }

      const complementoWhatsapp =
        dados.whatsappStatus ===
        "PENDENTE_CONFIGURACAO"
          ? " O responsável foi notificado dentro do PHANYX; o WhatsApp ficou pendente de configuração institucional."
          : dados.whatsappStatus ===
              "SEM_TELEFONE"
            ? " O responsável foi notificado dentro do PHANYX; não há telefone cadastrado para o aviso por WhatsApp."
            : "";

      setSucesso(
        (dados.mensagem ||
          "Correção aplicada com sucesso.") +
          complementoWhatsapp
      );

      setJornadaEditando(null);
      setItensEdicao([]);
      setMotivoFuncionario("");

      await carregarHistorico(
        pagina,
        filtrosAplicados
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a correção."
      );
    } finally {
      setEnviandoCorrecao(false);
    }
  }

  return (
    <section
      id="meus-pontos"
      className="rounded-[30px] border border-slate-700 bg-slate-900 p-6 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Meus pontos
          </p>

          <h2 className="mt-2 text-xl font-black text-white">
            Histórico por dia
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Cada card reúne todas as
            entradas e saídas daquele dia.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-blue-800 bg-blue-950 px-3 py-2 text-xs font-black text-blue-200">
          {total} dias
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
              Corrigidas
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

      {sucesso && (
        <div className="mt-5 rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-200">
          {sucesso}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 text-sm font-bold text-slate-300">
            Carregando seus pontos...
          </div>
        ) : jornadas.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
            Nenhuma jornada encontrada
            com os filtros informados.
          </div>
        ) : (
          jornadas.map((jornada) => {
            const atuais =
              jornada.marcacoes.filter(
                (marcacao) =>
                  marcacao.status !==
                  "INVALIDADA"
              );

            const anteriores =
              jornada.marcacoes.filter(
                (marcacao) =>
                  marcacao.status ===
                  "INVALIDADA"
              );

            const autorizacaoAtiva =
              jornada.autorizacao
                ?.status === "ATIVA";

            return (
              <article
                key={jornada.id}
                className="rounded-[26px] border border-slate-700 bg-slate-950/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Jornada
                    </p>

                    <h3 className="mt-1 text-xl font-black text-white">
                      {formatarDataLocal(
                        jornada.dataLocal
                      )}
                    </h3>
                  </div>

                  <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-black text-slate-200">
                    {jornada.status}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {atuais.length === 0 ? (
                    <p className="rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
                      Nenhuma marcação válida
                      neste dia.
                    </p>
                  ) : (
                    atuais.map(
                      (
                        marcacao,
                        indice
                      ) => {
                        const entrada =
                          rotuloTipo(
                            marcacao.tipo
                          ) === "Entrada";

                        return (
                          <div
                            key={
                              marcacao.id
                            }
                            className={`rounded-2xl border p-4 ${
                              entrada
                                ? "border-emerald-800 bg-emerald-950/25"
                                : "border-blue-800 bg-blue-950/25"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold text-slate-400">
                                  {indice +
                                    1}
                                  ª marcação
                                </p>

                                <p className="mt-1 font-black text-white">
                                  {rotuloTipo(
                                    marcacao.tipo
                                  )}
                                </p>
                              </div>

                              <p className="font-mono text-sm font-black text-blue-200">
                                {formatarHora(
                                  marcacao.dataHora,
                                  fusoHorario
                                )}
                              </p>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-400">
                              {rotuloLocalizacao(
                                marcacao.statusLocalizacao
                              )}
                            </p>

                            {marcacao.localNome && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  marcacao.localNome
                                }
                              </p>
                            )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Trabalhadas
                    </p>

                    <p className="mt-1 text-sm font-black text-white">
                      {numero(
                        jornada.horasTrabalhadas
                      ).toFixed(2)}
                      h
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Extras
                    </p>

                    <p className="mt-1 text-sm font-black text-emerald-300">
                      {numero(
                        jornada.horasExtras
                      ).toFixed(2)}
                      h
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Atraso
                    </p>

                    <p className="mt-1 text-sm font-black text-red-300">
                      {numero(
                        jornada.horasAtraso
                      ).toFixed(2)}
                      h
                    </p>
                  </div>
                </div>

                {jornada.autorizacao && (
                  <div
                    className={`mt-4 rounded-2xl border p-4 ${
                      autorizacaoAtiva
                        ? "border-emerald-800 bg-emerald-950/30"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <p className="text-sm font-black text-white">
                      {autorizacaoAtiva
                        ? "Correção autorizada"
                        : `Autorização ${jornada.autorizacao.status.toLocaleLowerCase("pt-BR")}`}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      <strong>
                        Autorizado por:
                      </strong>{" "}
                      {
                        jornada
                          .autorizacao
                          .autorizadoPor
                          .nome
                      }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      <strong>
                        Motivo:
                      </strong>{" "}
                      {
                        jornada
                          .autorizacao
                          .motivoAutorizacao
                      }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      <strong>
                        Válida até:
                      </strong>{" "}
                      {formatarDataHoraCompleta(
                        jornada
                          .autorizacao
                          .validoAte
                      )}
                    </p>

                    {autorizacaoAtiva && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEditor(
                            jornada
                          )
                        }
                        className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white"
                      >
                        Editar ponto
                      </button>
                    )}
                  </div>
                )}

                {!jornada.autorizacao && (
                  <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-sm font-black text-slate-200">
                      Edição bloqueada
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      O botão Editar ponto
                      aparece somente quando
                      o RH autoriza este dia.
                    </p>
                  </div>
                )}

                {jornada.ultimaSolicitacao && (
                  <div className="mt-4 rounded-2xl border border-amber-800 bg-amber-950/25 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-200">
                      Última correção
                    </p>

                    <p className="mt-2 text-sm text-amber-100">
                      {
                        jornada
                          .ultimaSolicitacao
                          .motivoFuncionario
                      }
                    </p>

                    <p className="mt-2 text-xs text-amber-300">
                      Situação:{" "}
                      {
                        jornada
                          .ultimaSolicitacao
                          .status
                      }
                    </p>
                  </div>
                )}

                {anteriores.length > 0 && (
                  <details className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-300">
                      Ver {anteriores.length} marcação(ões) substituída(s)
                    </summary>

                    <div className="mt-3 space-y-2">
                      {anteriores.map(
                        (marcacao) => (
                          <div
                            key={
                              marcacao.id
                            }
                            className="flex items-center justify-between gap-3 rounded-xl border border-red-900 bg-red-950/25 p-3 text-xs text-red-200 line-through"
                          >
                            <span>
                              {rotuloTipo(
                                marcacao.tipo
                              )}
                            </span>

                            <span className="font-mono">
                              {formatarHora(
                                marcacao.dataHora,
                                fusoHorario
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </details>
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
          <br />
          {quantidadeMarcacoes} marcações
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

      {jornadaEditando &&
        jornadaEditando.autorizacao && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[30px] border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Correção autorizada
                </p>

                <h2 className="mt-2 text-xl font-black text-white">
                  {formatarDataLocal(
                    jornadaEditando
                      .dataLocal
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharEditor}
                disabled={enviandoCorrecao}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-950 text-xl font-black text-slate-200 disabled:opacity-50"
                aria-label="Fechar editor"
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-800 bg-emerald-950/30 p-4">
              <p className="text-sm font-black text-emerald-100">
                Autorizado por
              </p>

              <p className="mt-1 text-sm text-emerald-200">
                {
                  jornadaEditando
                    .autorizacao
                    .autorizadoPor.nome
                }
              </p>

              <p className="mt-2 text-xs leading-5 text-emerald-300">
                {
                  jornadaEditando
                    .autorizacao
                    .motivoAutorizacao
                }
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {itensEdicao.map(
                (item, indice) => (
                  <div
                    key={item.chave}
                    className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {indice + 1}ª marcação
                      </p>

                      <button
                        type="button"
                        disabled={
                          enviandoCorrecao
                        }
                        onClick={() =>
                          removerItem(
                            item.chave
                          )
                        }
                        className="rounded-xl border border-red-800 bg-red-950/30 px-3 py-2 text-xs font-black text-red-200 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <select
                        value={item.tipo}
                        disabled={
                          enviandoCorrecao
                        }
                        onChange={(evento) =>
                          atualizarItem(
                            item.chave,
                            "tipo",
                            evento.target.value
                          )
                        }
                        className="min-h-12 rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-bold text-white"
                      >
                        <option value="ENTRADA">
                          Entrada
                        </option>

                        <option value="SAIDA">
                          Saída
                        </option>
                      </select>

                      <input
                        type="time"
                        value={item.hora}
                        disabled={
                          enviandoCorrecao
                        }
                        onChange={(evento) =>
                          atualizarItem(
                            item.chave,
                            "hora",
                            evento.target.value
                          )
                        }
                        className="min-h-12 rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 font-bold text-white"
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  enviandoCorrecao
                }
                onClick={() =>
                  adicionarMarcacao(
                    "ENTRADA"
                  )
                }
                className="min-h-12 rounded-2xl border border-emerald-700 bg-emerald-950/30 px-4 py-3 font-black text-emerald-200 disabled:opacity-50"
              >
                + Adicionar entrada
              </button>

              <button
                type="button"
                disabled={
                  enviandoCorrecao
                }
                onClick={() =>
                  adicionarMarcacao(
                    "SAIDA"
                  )
                }
                className="min-h-12 rounded-2xl border border-blue-700 bg-blue-950/30 px-4 py-3 font-black text-blue-200 disabled:opacity-50"
              >
                + Adicionar saída
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-sm font-black text-slate-200">
                Motivo da correção
              </label>

              <textarea
                value={motivoFuncionario}
                disabled={
                  enviandoCorrecao
                }
                onChange={(evento) =>
                  setMotivoFuncionario(
                    evento.target.value
                  )
                }
                placeholder="Explique o que foi corrigido ou acrescentado."
                className="min-h-[120px] w-full rounded-2xl border border-slate-600 bg-slate-950 p-4 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-800 bg-amber-950/25 p-4">
              <p className="text-xs leading-5 text-amber-200">
                Ao enviar, as marcações
                anteriores serão preservadas
                como histórico, o responsável
                do RH será notificado
                imediatamente dentro do
                PHANYX e o aviso de WhatsApp
                será registrado conforme a
                configuração da instituição.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={fecharEditor}
                disabled={
                  enviandoCorrecao
                }
                className="min-h-12 rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 font-black text-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={enviarCorrecao}
                disabled={
                  enviandoCorrecao
                }
                className="min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"
              >
                {enviandoCorrecao
                  ? "Enviando..."
                  : "Enviar correção"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}