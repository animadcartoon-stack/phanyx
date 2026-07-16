"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type FuncionarioOpcao = {
  id: number;
  nome: string;
  cargo?: string | null;
  codigoFuncionario?: string | null;

  departamento?: {
    nome: string;
  } | null;
};

type MarcacaoPonto = {
  id: number;
  tipo: string;
  dataHora: string;
  dataLocal: string;
  status: string;
  statusLocalizacao: string;
  comprovanteCodigo: string;
  origem: string;
  distanciaMetros?: number | null;
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

type ResponsavelAtual = {
  id: number;
  nome: string;
};

type RegistroPonto = {
  id: number;
  dataLocal: string;

  entrada?: string | null;
  saidaAlmoco?: string | null;
  retornoAlmoco?: string | null;
  saida?: string | null;

  horasTrabalhadas?: string | number | null;
  horasExtras?: string | number | null;
  horasAtraso?: string | number | null;

  status: string;
  observacoes?: string | null;

  funcionario: FuncionarioOpcao;
  marcacoes: MarcacaoPonto[];

  autorizacaoCorrecao?:
    | AutorizacaoCorrecao
    | null;
};

type RespostaPontos = {
  sucesso?: boolean;
  pagina?: number;
  limite?: number;
  total?: number;
  totalPaginas?: number;
  fusoHorario?: string;
  responsavelAtual?: ResponsavelAtual;
  pontos?: RegistroPonto[];
  error?: string;
};

type Filtros = {
  busca: string;
  dataInicio: string;
  dataFim: string;
  tipo: "TODOS" | "ENTRADA" | "SAIDA";
  statusMarcacao:
    | "TODOS"
    | "VALIDA"
    | "INVALIDADA";
  statusPonto: string;
};

const FILTROS_INICIAIS: Filtros = {
  busca: "",
  dataInicio: "",
  dataFim: "",
  tipo: "TODOS",
  statusMarcacao: "TODOS",
  statusPonto: "TODOS",
};

function numero(valor: unknown) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
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
    return "-";
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
      return "Entrada";

    case "RETORNO_ALMOCO":
      return "Entrada";

    case "SAIDA":
      return "Saída";

    case "SAIDA_ALMOCO":
      return "Saída";

    default:
      return tipo || "Marcação";
  }
}

function valorDataHoraLocalPadrao() {
  const data = new Date(
    Date.now() +
      24 * 60 * 60 * 1000
  );

  const deslocamento =
    data.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    data.getTime() - deslocamento
  )
    .toISOString()
    .slice(0, 16);
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

function saldoBanco(
  ponto: RegistroPonto
) {
  return (
    numero(ponto.horasExtras) -
    numero(ponto.horasAtraso)
  );
}

function marcacoesParaExibir(
  ponto: RegistroPonto
) {
  if (
    Array.isArray(ponto.marcacoes) &&
    ponto.marcacoes.length > 0
  ) {
    return ponto.marcacoes;
  }

  /*
   * Registros antigos ou manuais podem existir
   * somente nos quatro campos do resumo diário.
   */
  const marcacoes: MarcacaoPonto[] =
    [];

  const adicionar = (
    tipo: string,
    dataHora?: string | null
  ) => {
    if (!dataHora) return;

    marcacoes.push({
      id:
        marcacoes.length * -1 - 1,
      tipo,
      dataHora,
      dataLocal:
        ponto.dataLocal,
      status: "VALIDA",
      statusLocalizacao:
        "NAO_VERIFICADA",
      comprovanteCodigo:
        "REGISTRO-LEGADO",
      origem: "MANUAL",
      distanciaMetros: null,
      localNome: null,
    });
  };

  adicionar(
    "ENTRADA",
    ponto.entrada
  );

  adicionar(
    "SAIDA_ALMOCO",
    ponto.saidaAlmoco
  );

  adicionar(
    "RETORNO_ALMOCO",
    ponto.retornoAlmoco
  );

  adicionar(
    "SAIDA",
    ponto.saida
  );

  return marcacoes;
}

function classeStatusPonto(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "REGISTRADO":
      return "border-emerald-300 bg-emerald-100 !text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:!text-emerald-200";

    case "ABERTO":
      return "border-amber-300 bg-amber-100 !text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:!text-amber-200";

    case "CORRIGIDO":
      return "border-blue-300 bg-blue-100 !text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:!text-blue-200";

    case "INCONSISTENTE":
    case "PENDENTE":
      return "border-orange-300 bg-orange-100 !text-orange-800 dark:border-orange-700 dark:bg-orange-950/60 dark:!text-orange-200";

    case "INVALIDADO":
    case "CANCELADO":
      return "border-red-300 bg-red-100 !text-red-800 dark:border-red-700 dark:bg-red-950/60 dark:!text-red-200";

    default:
      return "border-slate-300 bg-slate-100 !text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:!text-slate-200";
  }
}

export default function PontoRHPage() {
  const [pontos, setPontos] =
    useState<RegistroPonto[]>([]);

  const [filtros, setFiltros] =
    useState<Filtros>(
      FILTROS_INICIAIS
    );

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState<Filtros>(
    FILTROS_INICIAIS
  );

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

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

    const [
  erroModalAutorizacao,
  setErroModalAutorizacao,
] = useState("");

  const [
    responsavelAtual,
    setResponsavelAtual,
  ] = useState<ResponsavelAtual | null>(
    null
  );

  const [sucesso, setSucesso] =
    useState("");

  const [
    modalAutorizacaoAberto,
    setModalAutorizacaoAberto,
  ] = useState(false);

  const [
    modoModalAutorizacao,
    setModoModalAutorizacao,
  ] = useState<
    "AUTORIZAR" | "CANCELAR"
  >("AUTORIZAR");

  const [
    pontoAutorizacao,
    setPontoAutorizacao,
  ] = useState<RegistroPonto | null>(
    null
  );

  const [
    motivoAutorizacao,
    setMotivoAutorizacao,
  ] = useState("");

  const [
    validoAte,
    setValidoAte,
  ] = useState(
    valorDataHoraLocalPadrao()
  );

  const [
    motivoCancelamento,
    setMotivoCancelamento,
  ] = useState("");

  const [
    processandoAutorizacao,
    setProcessandoAutorizacao,
  ] = useState(false);

  const [
    pontoExpandidoId,
    setPontoExpandidoId,
  ] = useState<number | null>(null);

  const carregarPontos =
    useCallback(
      async (
        paginaAlvo: number,
        filtrosAtuais: Filtros
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
            "20"
          );

          if (
            filtrosAtuais.busca.trim()
          ) {
            parametros.set(
              "busca",
              filtrosAtuais.busca.trim()
            );
          }

          if (
            filtrosAtuais.dataInicio
          ) {
            parametros.set(
              "dataInicio",
              filtrosAtuais.dataInicio
            );
          }

          if (filtrosAtuais.dataFim) {
            parametros.set(
              "dataFim",
              filtrosAtuais.dataFim
            );
          }

          parametros.set(
            "tipo",
            filtrosAtuais.tipo
          );

          parametros.set(
            "statusMarcacao",
            filtrosAtuais
              .statusMarcacao
          );

          parametros.set(
            "statusPonto",
            filtrosAtuais.statusPonto
          );

          const resposta = await fetch(
            `/api/admin/rh/ponto?${parametros.toString()}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

          const dados: RespostaPontos =
            await resposta.json();

          if (!resposta.ok) {
            throw new Error(
              dados.error ||
                "Não foi possível carregar os pontos."
            );
          }

          setPontos(
            Array.isArray(dados.pontos)
              ? dados.pontos
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

          setResponsavelAtual(
            dados.responsavelAtual ||
              null
          );
        } catch (error) {
          setPontos([]);

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os pontos."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    carregarPontos(
      1,
      FILTROS_INICIAIS
    );
  }, [carregarPontos]);

  const quantidadeMarcacoes =
    useMemo(() => {
      return pontos.reduce(
        (totalAtual, ponto) =>
          totalAtual +
          marcacoesParaExibir(
            ponto
          ).length,
        0
      );
    }, [pontos]);

  function aplicarFiltros() {
    setPontoExpandidoId(null);
    setFiltrosAplicados(filtros);

    carregarPontos(1, filtros);
  }

  function limparFiltros() {
    setFiltros(
      FILTROS_INICIAIS
    );

    setFiltrosAplicados(
      FILTROS_INICIAIS
    );

    setPontoExpandidoId(null);

    carregarPontos(
      1,
      FILTROS_INICIAIS
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

    setPontoExpandidoId(null);

    carregarPontos(
      novaPagina,
      filtrosAplicados
    );
  }

  function abrirModalAutorizar(
    ponto: RegistroPonto
  ) {
    setPontoAutorizacao(ponto);
    setModoModalAutorizacao(
      "AUTORIZAR"
    );

    setMotivoAutorizacao("");
    setMotivoCancelamento("");

    setValidoAte(
      valorDataHoraLocalPadrao()
    );

    setErro("");
    setErroModalAutorizacao("");
    setSucesso("");

    setModalAutorizacaoAberto(
      true
    );
  }

  function abrirModalCancelar(
    ponto: RegistroPonto
  ) {
    setPontoAutorizacao(ponto);
    setModoModalAutorizacao(
      "CANCELAR"
    );

    setMotivoCancelamento("");
    setErro("");
    setErroModalAutorizacao("");
    setSucesso("");

    setModalAutorizacaoAberto(
      true
    );
  }

  function fecharModalAutorizacao() {
    if (processandoAutorizacao) {
      return;
    }

    setModalAutorizacaoAberto(
      false
    );
    setErroModalAutorizacao("");
    setPontoAutorizacao(null);
  }

  async function enviarAutorizacao() {
    if (!pontoAutorizacao) {
      return;
    }

    try {
      setProcessandoAutorizacao(
        true
      );

      setErroModalAutorizacao("");
      setSucesso("");

      if (
        motivoAutorizacao
          .trim()
          .length < 10
      ) {
        throw new Error(
          "Informe o motivo da autorização com pelo menos 10 caracteres."
        );
      }

      if (!validoAte) {
        throw new Error(
          "Informe até quando a autorização será válida."
        );
      }

      const validadeIso =
        new Date(
          validoAte
        ).toISOString();

      const resposta = await fetch(
        "/api/admin/rh/ponto/autorizacoes",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            pontoFuncionarioRHId:
              pontoAutorizacao.id,

            motivoAutorizacao:
              motivoAutorizacao.trim(),

            validoAte:
              validadeIso,
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível autorizar a correção."
        );
      }

      setSucesso(
        dados.mensagem ||
          "Correção autorizada."
      );

      setModalAutorizacaoAberto(
        false
      );

      setPontoAutorizacao(null);

      await carregarPontos(
        pagina,
        filtrosAplicados
      );
    } catch (error) {
      setErroModalAutorizacao(
  error instanceof Error
    ? error.message
    : "Não foi possível autorizar a correção."
);
    } finally {
      setProcessandoAutorizacao(
        false
      );
    }
  }

  async function cancelarAutorizacao() {
    const autorizacao =
      pontoAutorizacao
        ?.autorizacaoCorrecao;

    if (
      !pontoAutorizacao ||
      !autorizacao
    ) {
      return;
    }

    try {
      setProcessandoAutorizacao(
        true
      );

      setErro("");
      setSucesso("");

      if (
        motivoCancelamento
          .trim()
          .length < 5
      ) {
        throw new Error(
          "Informe o motivo do cancelamento."
        );
      }

      const resposta = await fetch(
        "/api/admin/rh/ponto/autorizacoes",
        {
          method: "DELETE",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            autorizacaoId:
              autorizacao.id,

            motivoCancelamento:
              motivoCancelamento
                .trim(),
          }),
        }
      );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível cancelar a autorização."
        );
      }

      setSucesso(
        dados.mensagem ||
          "Autorização cancelada."
      );

      setModalAutorizacaoAberto(
        false
      );

      setPontoAutorizacao(null);

      await carregarPontos(
        pagina,
        filtrosAplicados
      );
    } catch (error) {
      setErroModalAutorizacao(
  error instanceof Error
    ? error.message
    : "Não foi possível autorizar a correção."
);
    } finally {
      setProcessandoAutorizacao(
        false
      );
    }
  }

  return (
    <div className="phanyx-rh-page w-full max-w-full space-y-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          ⏱️ Controle de Ponto
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Consulte todas as entradas e
          saídas registradas pelos
          funcionários.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {sucesso}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Jornadas encontradas
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {total}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Marcações nesta página
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {quantidadeMarcacoes}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Fuso horário
          </p>

          <p className="mt-2 break-words text-sm font-black text-slate-950 dark:text-white">
            {fusoHorario}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
              Funcionário
            </label>

            <input
              value={filtros.busca}
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    busca:
                      evento.target.value,
                  })
                )
              }
              placeholder="Nome, cargo ou código"
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
              Data inicial
            </label>

            <input
              type="date"
              value={
                filtros.dataInicio
              }
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    dataInicio:
                      evento.target.value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
              Data final
            </label>

            <input
              type="date"
              value={filtros.dataFim}
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    dataFim:
                      evento.target.value,
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
              Tipo
            </label>

            <select
              value={filtros.tipo}
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,
                    tipo:
                      evento.target
                        .value as Filtros["tipo"],
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
              Situação
            </label>

            <select
              value={
                filtros.statusMarcacao
              }
              onChange={(evento) =>
                setFiltros(
                  (anterior) => ({
                    ...anterior,

                    statusMarcacao:
                      evento.target
                        .value as Filtros["statusMarcacao"],
                  })
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={aplicarFiltros}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Carregando..."
              : "Buscar"}
          </button>

          <button
            type="button"
            onClick={limparFiltros}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
          Registros de Ponto
        </h2>

        {loading ? (
  <div className="rounded-2xl border !border-slate-200 !bg-slate-50 p-5 text-sm font-bold !text-slate-700 shadow-sm dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-200">
    Carregando pontos...
  </div>
) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700">
                  <th className="px-3 py-3">
                    Funcionário
                  </th>

                  <th className="px-3 py-3">
                    Data
                  </th>

                  <th className="px-3 py-3">
                    Marcações do dia
                  </th>

                  <th className="px-3 py-3">
                    Trabalhadas
                  </th>

                  <th className="px-3 py-3">
                    Extras
                  </th>

                  <th className="px-3 py-3">
                    Atraso
                  </th>

                  <th className="px-3 py-3">
                    Saldo
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="min-w-[190px] px-3 py-3 text-center">
  Ações
</th>
                </tr>
              </thead>

              <tbody>
                {pontos.map((ponto) => {
                  const marcacoes =
                    marcacoesParaExibir(
                      ponto
                    );

                  const expandido =
                    pontoExpandidoId ===
                    ponto.id;

                  const saldo =
                    saldoBanco(ponto);

                  return (
                    <Fragment key={ponto.id}>
                      <tr
                        className="border-b border-slate-100 align-top text-slate-700 dark:border-slate-800 dark:text-slate-200"
                      >
                        <td className="px-3 py-4">
                          <div className="font-bold">
                            {ponto.funcionario
                              ?.nome || "-"}
                          </div>

                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {ponto.funcionario
                              ?.cargo || "-"}

                            {ponto.funcionario
                              ?.departamento
                              ?.nome
                              ? ` • ${ponto.funcionario.departamento.nome}`
                              : ""}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 font-bold">
                          {formatarDataLocal(
                            ponto.dataLocal
                          )}
                        </td>

                        <td className="px-3 py-4">
                          {marcacoes.length ===
                          0 ? (
                            <span className="text-slate-500">
                              Sem marcações
                            </span>
                          ) : (
                            <div className="flex max-w-[420px] flex-wrap gap-2">
                              {marcacoes.map(
                                (marcacao) => (
                                  <span
                                    key={
                                      marcacao.id
                                    }
                                    className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                                      marcacao.status ===
                                      "INVALIDADA"
                                        ? "border-red-300 bg-red-50 text-red-700 line-through dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                                        : rotuloTipo(
                                              marcacao.tipo
                                            ) ===
                                            "Entrada"
                                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                                          : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                                    }`}
                                  >
                                    {formatarHora(
                                      marcacao.dataHora,
                                      fusoHorario
                                    )}{" "}
                                    {rotuloTipo(
                                      marcacao.tipo
                                    )}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-4 font-bold">
                          {numero(
                            ponto.horasTrabalhadas
                          ).toFixed(2)}
                          h
                        </td>

                        <td className="px-3 py-4 font-bold text-green-600">
                          {numero(
                            ponto.horasExtras
                          ).toFixed(2)}
                          h
                        </td>

                        <td className="px-3 py-4 font-bold text-red-600">
                          {numero(
                            ponto.horasAtraso
                          ).toFixed(2)}
                          h
                        </td>

                        <td
                          className={`px-3 py-4 font-black ${
                            saldo >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {saldo >= 0
                            ? "+"
                            : ""}
                          {saldo.toFixed(2)}h
                        </td>

                        <td className="px-3 py-4">
                          <span
  className={`inline-flex min-w-[104px] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${classeStatusPonto(
    ponto.status
  )}`}
>
  {ponto.status}
</span>
                        </td>

                        <td className="min-w-[190px] px-3 py-4">
  <div className="mx-auto flex w-[175px] flex-col gap-2">
    <button
      type="button"
      onClick={() =>
        setPontoExpandidoId(
          expandido ? null : ponto.id
        )
      }
      className="min-h-9 w-full rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:border-blue-700 hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
    >
      {expandido
        ? "Ocultar detalhes"
        : "Ver detalhes"}
    </button>

    {ponto.autorizacaoCorrecao?.status ===
    "ATIVA" ? (
      <>
        <span className="flex min-h-9 w-full items-center justify-center rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 text-center text-xs font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
          Correção autorizada
        </span>

        <button
          type="button"
          onClick={() =>
            abrirModalCancelar(ponto)
          }
          className="min-h-9 w-full rounded-xl border border-red-600 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/60"
        >
          Cancelar autorização
        </button>
      </>
    ) : (
      <button
        type="button"
        onClick={() =>
          abrirModalAutorizar(ponto)
        }
        className="min-h-9 w-full rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black !text-white shadow-sm transition hover:border-emerald-700 hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        Autorizar correção
      </button>
    )}
  </div>
</td>
                      </tr>

                      {expandido && (
                        <tr
                          key={`${ponto.id}-detalhes`}
                          className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50"
                        >
                          <td
                            colSpan={9}
                            className="px-4 py-5"
                          >
                            <div className="grid gap-3 lg:grid-cols-2">
                              {marcacoes.map(
                                (
                                  marcacao,
                                  indice
                                ) => (
                                  <div
                                    key={
                                      marcacao.id
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-black text-slate-950 dark:text-white">
                                          {indice +
                                            1}
                                          ª marcação —{" "}
                                          {rotuloTipo(
                                            marcacao.tipo
                                          )}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                          {formatarHora(
                                            marcacao.dataHora,
                                            fusoHorario
                                          )}
                                        </p>
                                      </div>

                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${
                                          marcacao.status ===
                                          "INVALIDADA"
                                            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200"
                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                                        }`}
                                      >
                                        {
                                          marcacao.status
                                        }
                                      </span>
                                    </div>

                                    <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                      <p>
                                        Local:{" "}
                                        {marcacao.localNome ||
                                          "Não informado"}
                                      </p>

                                      <p>
                                        Situação da
                                        localização:{" "}
                                        {
                                          marcacao.statusLocalizacao
                                        }
                                      </p>

                                      <p>
                                        Origem:{" "}
                                        {
                                          marcacao.origem
                                        }
                                      </p>

                                      <p className="break-all">
                                        Comprovante:{" "}
                                        {
                                          marcacao.comprovanteCodigo
                                        }
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {marcacoes.length ===
                              0 && (
                              <p className="text-sm text-slate-500">
                                Este registro não
                                possui marcações
                                individuais.
                              </p>
                            )}

                            {ponto
                              .autorizacaoCorrecao && (
                              <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                                <p className="font-black">
                                  Autorização de correção
                                </p>

                                <p className="mt-2">
                                  <strong>
                                    Situação:
                                  </strong>{" "}
                                  {
                                    ponto
                                      .autorizacaoCorrecao
                                      .status
                                  }
                                </p>

                                <p className="mt-1">
                                  <strong>
                                    Autorizado por:
                                  </strong>{" "}
                                  {
                                    ponto
                                      .autorizacaoCorrecao
                                      .autorizadoPor
                                      .nome
                                  }
                                </p>

                                <p className="mt-1">
                                  <strong>
                                    Válida até:
                                  </strong>{" "}
                                  {formatarDataHoraCompleta(
                                    ponto
                                      .autorizacaoCorrecao
                                      .validoAte
                                  )}
                                </p>

                                <p className="mt-1">
                                  <strong>
                                    Motivo:
                                  </strong>{" "}
                                  {
                                    ponto
                                      .autorizacaoCorrecao
                                      .motivoAutorizacao
                                  }
                                </p>
                              </div>
                            )}

                            {ponto.observacoes && (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                <strong>
                                  Observações:
                                </strong>{" "}
                                {
                                  ponto.observacoes
                                }
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={
              pagina <= 1 || loading
            }
            onClick={() =>
              mudarPagina(pagina - 1)
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            Anterior
          </button>

          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
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
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            Próxima
          </button>
        </div>
      </section>

      {modalAutorizacaoAberto &&
        pontoAutorizacao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-300 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                  Correção de ponto
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                  {modoModalAutorizacao ===
                  "AUTORIZAR"
                    ? "Autorizar funcionário"
                    : "Cancelar autorização"}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  processandoAutorizacao
                }
                onClick={
                  fecharModalAutorizacao
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-xl font-black text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="font-black text-slate-950 dark:text-white">
                {
                  pontoAutorizacao
                    .funcionario.nome
                }
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Ponto de{" "}
                {formatarDataLocal(
                  pontoAutorizacao
                    .dataLocal
                )}
              </p>
            </div>

{erroModalAutorizacao && (
  <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
    {erroModalAutorizacao}
  </div>
)}

            {modoModalAutorizacao ===
            "AUTORIZAR" ? (
              <>
                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
                    Autorizado por
                  </label>

                  <div className="rounded-xl border border-slate-300 bg-slate-100 p-3 font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    {responsavelAtual?.nome ||
                      "Usuário do RH conectado"}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Esse nome vem do usuário
                    autenticado e não pode ser
                    digitado pelo funcionário.
                  </p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
                    Motivo da autorização
                  </label>

                  <textarea
                    value={
                      motivoAutorizacao
                    }
                    onChange={(evento) =>
                      setMotivoAutorizacao(
                        evento.target
                          .value
                      )
                    }
                    placeholder="Exemplo: funcionário esqueceu de registrar a saída do expediente."
                    className="min-h-[120px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
  {motivoAutorizacao.trim().length}/10 caracteres mínimos
</p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
                    Autorização válida até
                  </label>

                  <input
                    type="datetime-local"
                    value={validoAte}
                    onChange={(evento) =>
                      setValidoAte(
                        evento.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <p>
                    <strong>
                      Autorizado por:
                    </strong>{" "}
                    {
                      pontoAutorizacao
                        .autorizacaoCorrecao
                        ?.autorizadoPor
                        .nome
                    }
                  </p>

                  <p className="mt-1">
                    <strong>
                      Válida até:
                    </strong>{" "}
                    {pontoAutorizacao
                      .autorizacaoCorrecao
                      ? formatarDataHoraCompleta(
                          pontoAutorizacao
                            .autorizacaoCorrecao
                            .validoAte
                        )
                      : "-"}
                  </p>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-slate-100">
                    Motivo do cancelamento
                  </label>

                  <textarea
                    value={
                      motivoCancelamento
                    }
                    onChange={(evento) =>
                      setMotivoCancelamento(
                        evento.target
                          .value
                      )
                    }
                    placeholder="Informe por que a autorização está sendo cancelada."
                    className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  processandoAutorizacao
                }
                onClick={
                  fecharModalAutorizacao
                }
                className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-black text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                Voltar
              </button>

              <button
                type="button"
                disabled={
                  processandoAutorizacao
                }
                onClick={
                  modoModalAutorizacao ===
                  "AUTORIZAR"
                    ? enviarAutorizacao
                    : cancelarAutorizacao
                }
                className={`min-h-12 rounded-xl px-4 py-3 font-black text-white disabled:opacity-50 ${
                  modoModalAutorizacao ===
                  "AUTORIZAR"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processandoAutorizacao
                  ? "Processando..."
                  : modoModalAutorizacao ===
                      "AUTORIZAR"
                    ? "Autorizar correção"
                    : "Cancelar autorização"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}