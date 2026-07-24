"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type TipoRestricao =
  | "NENHUMA"
  | "SOMENTE_AVISO"
  | "RESTRICAO_PARCIAL"
  | "BLOQUEIO_PORTAL";

type TipoRestricaoAplicavel =
  | "SOMENTE_AVISO"
  | "RESTRICAO_PARCIAL"
  | "BLOQUEIO_PORTAL";

type PoloOption = {
  id: number;
  nome: string;
};

type AlunoPainel = {
  alunoId: number;
  nome: string;
  statusAluno?: string | null;

  matricula: {
    id: number;
    numero?: string | null;
    status: string;
    semestreAtual?: number | null;
    cursoSemestreId?: number | null;
  };

  polo?: PoloOption | null;

  situacaoPainel: string;
  statusRematricula?: string | null;
  prazoEncerrado: boolean;

  realizouRematricula: boolean;
  naoRealizou: boolean;
  necessitaRegularizacao: boolean;
  pendenteAposPrazo: boolean;
  podeReceberRestricao: boolean;

  rematricula?: {
    id: number;
    protocolo?: string | null;
    status: string;
    cargaHorariaSelecionada?: number | null;
    enviadaEm?: string | null;
    atualizadaEm?: string | null;
    _count?: {
      itens: number;
    };
  } | null;

  restricao: {
    id?: number | null;
    tipoAtual: TipoRestricao;
    origem?: string | null;
    ativa: boolean;
    motivo?: string | null;
    mensagemAluno?: string | null;
    aplicadaEm?: string | null;
    removidaEm?: string | null;
  };

  tipoRestricaoAtual: TipoRestricao;
};

type ResumoPainel = {
  elegiveis: number;
  naoIniciaram: number;
  naoRealizaram: number;
  rascunhos: number;
  enviadas: number;
  emAnalise: number;
  aprovadas: number;
  devolvidas: number;
  recusadas: number;
  prazoPerdido: number;
  pendentesAposPrazo: number;
  comRestricao: number;
  semRestricao: number;
};

type RespostaAlunos = {
  ok?: boolean;

  periodo?: {
    id: number;
    titulo?: string | null;
    periodoLetivo: string;
    dataInicio: string;
    dataFim: string;
    status: string;
    prazoEncerrado: boolean;
    semestreAtual: number;
    semestreDestino: number;
    curso?: {
      id: number;
      nome: string;
      codigo?: string | null;
    } | null;
  };

  resumo?: ResumoPainel;

  filtrosDisponiveis?: {
    polos: PoloOption[];
    situacoes: string[];
    tiposRestricao: string[];
  };

  paginacao?: {
    pagina: number;
    limite: number;
    totalRegistros: number;
    totalPaginas: number;
  };

  alunos?: AlunoPainel[];
  error?: string;
};

type MensagemTela = {
  tipo: "sucesso" | "erro";
  texto: string;
};

type ConfirmacaoRestricao = {
  acao: "APLICAR" | "REMOVER";
} | null;

const RESUMO_INICIAL: ResumoPainel = {
  elegiveis: 0,
  naoIniciaram: 0,
  naoRealizaram: 0,
  rascunhos: 0,
  enviadas: 0,
  emAnalise: 0,
  aprovadas: 0,
  devolvidas: 0,
  recusadas: 0,
  prazoPerdido: 0,
  pendentesAposPrazo: 0,
  comRestricao: 0,
  semRestricao: 0,
};

function nomeSituacao(valor?: string | null) {
  const nomes: Record<string, string> = {
    NAO_INICIOU: "Não iniciou",
    PRAZO_PERDIDO: "Prazo perdido",
    RASCUNHO: "Rascunho",
    ENVIADA: "Enviada",
    EM_ANALISE: "Em análise",
    APROVADA: "Aprovada",
    DEVOLVIDA: "Devolvida",
    RECUSADA: "Recusada",
    CANCELADA: "Cancelada",
    EXPIRADA: "Expirada",
  };

  return valor
    ? nomes[valor] || valor
    : "Não iniciou";
}

function nomeRestricao(tipo: TipoRestricao) {
  const nomes: Record<TipoRestricao, string> = {
    NENHUMA: "Sem restrição",
    SOMENTE_AVISO: "Somente aviso",
    RESTRICAO_PARCIAL: "Restrição parcial",
    BLOQUEIO_PORTAL: "Portal bloqueado",
  };

  return nomes[tipo];
}

function classeSituacao(valor?: string | null) {
  if (valor === "APROVADA") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (
    valor === "ENVIADA" ||
    valor === "EM_ANALISE"
  ) {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }

  if (
    valor === "PRAZO_PERDIDO" ||
    valor === "RECUSADA" ||
    valor === "EXPIRADA"
  ) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (
    valor === "RASCUNHO" ||
    valor === "DEVOLVIDA"
  ) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function classeRestricao(tipo: TipoRestricao) {
  if (tipo === "BLOQUEIO_PORTAL") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (tipo === "RESTRICAO_PARCIAL") {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }

  if (tipo === "SOMENTE_AVISO") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function formatarData(valor?: string | null) {
  if (!valor) {
    return "—";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default function AlunosRematriculaPage() {
  const params = useParams<{
    id: string;
  }>();

  const periodoId = Number(params.id);

  const [dados, setDados] =
    useState<RespostaAlunos | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [processando, setProcessando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState<MensagemTela | null>(null);

  const [buscaDigitada, setBuscaDigitada] =
    useState("");

  const [buscaAplicada, setBuscaAplicada] =
    useState("");

  const [situacao, setSituacao] =
    useState("TODOS");

  const [poloId, setPoloId] =
    useState("");

  const [tipoRestricaoFiltro, setTipoRestricaoFiltro] =
    useState("TODOS");

  const [pagina, setPagina] =
    useState(1);

  const [selecionados, setSelecionados] =
    useState<Set<number>>(
      new Set(),
    );

  const [tipoRestricao, setTipoRestricao] =
    useState<TipoRestricaoAplicavel>(
      "SOMENTE_AVISO",
    );

  const [motivo, setMotivo] =
    useState(
      "Rematrícula não realizada dentro do prazo.",
    );

  const [mensagemAluno, setMensagemAluno] =
    useState("");

  const [
    confirmacaoRestricao,
    setConfirmacaoRestricao,
  ] = useState<ConfirmacaoRestricao>(
    null,
  );

  const carregarAlunos =
    useCallback(async () => {
      if (
        !Number.isInteger(periodoId) ||
        periodoId <= 0
      ) {
        setMensagem({
          tipo: "erro",
          texto:
            "Período de rematrícula inválido.",
        });

        setCarregando(false);

        return;
      }

      setCarregando(true);

      try {
        const parametros =
          new URLSearchParams({
            pagina: String(pagina),
            limite: "25",
            situacao,
            tipoRestricao:
              tipoRestricaoFiltro,
          });

        if (buscaAplicada) {
          parametros.set(
            "busca",
            buscaAplicada,
          );
        }

        if (poloId) {
          parametros.set(
            "poloId",
            poloId,
          );
        }

        const resposta = await fetch(
          `/api/admin/rematriculas-semestrais/${periodoId}/alunos?${parametros.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const resultado =
          (await resposta.json()) as RespostaAlunos;

        if (!resposta.ok) {
          throw new Error(
            resultado.error ||
              "Não foi possível carregar os alunos.",
          );
        }

        setDados(resultado);
      } catch (error) {
        setMensagem({
          tipo: "erro",
          texto:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os alunos.",
        });
      } finally {
        setCarregando(false);
      }
    }, [
      periodoId,
      pagina,
      situacao,
      poloId,
      tipoRestricaoFiltro,
      buscaAplicada,
    ]);

  useEffect(() => {
    carregarAlunos();
  }, [carregarAlunos]);

  useEffect(() => {
    setSelecionados(new Set());
  }, [
    pagina,
    situacao,
    poloId,
    tipoRestricaoFiltro,
    buscaAplicada,
  ]);

  const alunos = dados?.alunos || [];
  const resumo =
    dados?.resumo || RESUMO_INICIAL;

  const alunosSelecionaveis =
    useMemo(
      () =>
        alunos.filter(
          (aluno) =>
            aluno.podeReceberRestricao ||
            aluno.tipoRestricaoAtual !==
              "NENHUMA",
        ),
      [alunos],
    );

  const todosSelecionados =
    alunosSelecionaveis.length > 0 &&
    alunosSelecionaveis.every(
      (aluno) =>
        selecionados.has(
          aluno.alunoId,
        ),
    );

  function aplicarBusca(
    evento: FormEvent,
  ) {
    evento.preventDefault();
    setPagina(1);
    setBuscaAplicada(
      buscaDigitada.trim(),
    );
  }

  function limparFiltros() {
    setBuscaDigitada("");
    setBuscaAplicada("");
    setSituacao("TODOS");
    setPoloId("");
    setTipoRestricaoFiltro(
      "TODOS",
    );
    setPagina(1);
  }

  function alternarAluno(
    alunoId: number,
  ) {
    setSelecionados((atuais) => {
      const proximo = new Set(
        atuais,
      );

      if (proximo.has(alunoId)) {
        proximo.delete(alunoId);
      } else {
        proximo.add(alunoId);
      }

      return proximo;
    });
  }

  function alternarTodos() {
    setSelecionados((atuais) => {
      const proximo = new Set(
        atuais,
      );

      if (todosSelecionados) {
        for (const aluno of alunosSelecionaveis) {
          proximo.delete(
            aluno.alunoId,
          );
        }
      } else {
        for (const aluno of alunosSelecionaveis) {
          proximo.add(
            aluno.alunoId,
          );
        }
      }

      return proximo;
    });
  }

  async function executarRestricao() {
    if (
      !confirmacaoRestricao ||
      selecionados.size === 0
    ) {
      return;
    }

    setProcessando(true);
    setMensagem(null);

    try {
      const resposta = await fetch(
        `/api/admin/rematriculas-semestrais/${periodoId}/restricoes`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            acao:
              confirmacaoRestricao.acao,
            alunoIds:
              Array.from(
                selecionados,
              ),

            ...(confirmacaoRestricao.acao ===
            "APLICAR"
              ? {
                  tipo:
                    tipoRestricao,
                  motivo:
                    motivo.trim(),
                  mensagemAluno:
                    mensagemAluno.trim(),
                }
              : {
                  motivo:
                    motivo.trim() ||
                    "Restrição removida pelo administrador.",
                }),
          }),
        },
      );

      const resultado =
        (await resposta.json()) as {
          message?: string;
          error?: string;
        };

      if (!resposta.ok) {
        throw new Error(
          resultado.error ||
            "Não foi possível processar a restrição.",
        );
      }

      setMensagem({
        tipo: "sucesso",
        texto:
          resultado.message ||
          "Ação realizada corretamente.",
      });

      setConfirmacaoRestricao(
        null,
      );

      setSelecionados(
        new Set(),
      );

      await carregarAlunos();
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível processar a restrição.",
      });
    } finally {
      setProcessando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/admin/rematriculas-semestrais"
              className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              ← Voltar para períodos
            </Link>

            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              Alunos da rematrícula
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {dados?.periodo?.titulo ||
                "Período de rematrícula"}
              {dados?.periodo?.curso?.nome
                ? ` · ${dados.periodo.curso.nome}`
                : ""}
            </p>
          </div>

          {dados?.periodo && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <strong className="block">
                {dados.periodo.periodoLetivo}
              </strong>

              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                {dados.periodo.semestreAtual}º →{" "}
                {dados.periodo.semestreDestino}º semestre
              </span>

              <span
                className={`mt-2 block text-xs font-bold ${
                  dados.periodo.prazoEncerrado
                    ? "text-red-700 dark:text-red-300"
                    : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {dados.periodo.prazoEncerrado
                  ? "Prazo encerrado"
                  : "Prazo em andamento"}
              </span>
            </div>
          )}
        </header>

        {mensagem && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              mensagem.tipo ===
              "sucesso"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {[
            ["Elegíveis", resumo.elegiveis],
            ["Não iniciaram", resumo.naoIniciaram],
            ["Rascunhos", resumo.rascunhos],
            ["Enviadas", resumo.enviadas],
            ["Em análise", resumo.emAnalise],
            ["Aprovadas", resumo.aprovadas],
            ["Devolvidas", resumo.devolvidas],
            ["Recusadas", resumo.recusadas],
            ["Prazo perdido", resumo.prazoPerdido],
            ["Após o prazo", resumo.pendentesAposPrazo],
            ["Com restrição", resumo.comRestricao],
            ["Sem restrição", resumo.semRestricao],
          ].map(([titulo, quantidade]) => (
            <div
              key={String(titulo)}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="block text-2xl font-black">
                {quantidade}
              </span>

              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                {titulo}
              </span>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <form
            onSubmit={aplicarBusca}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          >
            <input
              value={buscaDigitada}
              onChange={(evento) =>
                setBuscaDigitada(
                  evento.target.value,
                )
              }
              placeholder="Nome ou matrícula"
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            />

            <select
              value={situacao}
              onChange={(evento) => {
                setSituacao(
                  evento.target.value,
                );
                setPagina(1);
              }}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="TODOS">
                Todas as situações
              </option>
              <option value="NAO_REALIZOU">
                Não realizou
              </option>
              <option value="NAO_INICIOU">
                Não iniciou
              </option>
              <option value="RASCUNHO">
                Rascunho
              </option>
              <option value="ENVIADA">
                Enviada
              </option>
              <option value="EM_ANALISE">
                Em análise
              </option>
              <option value="APROVADA">
                Aprovada
              </option>
              <option value="DEVOLVIDA">
                Devolvida
              </option>
              <option value="RECUSADA">
                Recusada
              </option>
              <option value="PRAZO_PERDIDO">
                Prazo perdido
              </option>
              <option value="PENDENTE_APOS_PRAZO">
                Pendente após o prazo
              </option>
            </select>

            <select
              value={poloId}
              onChange={(evento) => {
                setPoloId(
                  evento.target.value,
                );
                setPagina(1);
              }}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">
                Todos os polos
              </option>

              {dados?.filtrosDisponiveis?.polos.map(
                (polo) => (
                  <option
                    key={polo.id}
                    value={polo.id}
                  >
                    {polo.nome}
                  </option>
                ),
              )}
            </select>

            <select
              value={
                tipoRestricaoFiltro
              }
              onChange={(evento) => {
                setTipoRestricaoFiltro(
                  evento.target.value,
                );
                setPagina(1);
              }}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="TODOS">
                Todas as restrições
              </option>
              <option value="NENHUMA">
                Sem restrição
              </option>
              <option value="SOMENTE_AVISO">
                Somente aviso
              </option>
              <option value="RESTRICAO_PARCIAL">
                Restrição parcial
              </option>
              <option value="BLOQUEIO_PORTAL">
                Portal bloqueado
              </option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Filtrar
              </button>

              <button
                type="button"
                onClick={
                  limparFiltros
                }
                className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold"
              >
                Limpar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Consequência
              </span>

              <select
                value={tipoRestricao}
                onChange={(evento) =>
                  setTipoRestricao(
                    evento.target
                      .value as TipoRestricaoAplicavel,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="SOMENTE_AVISO">
                  Somente aviso
                </option>
                <option value="RESTRICAO_PARCIAL">
                  Restrição parcial
                </option>
                <option value="BLOQUEIO_PORTAL">
                  Bloquear portal
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                Motivo administrativo
              </span>

              <input
                value={motivo}
                onChange={(evento) =>
                  setMotivo(
                    evento.target.value,
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold">
              Mensagem para o aluno
            </span>

            <textarea
              value={mensagemAluno}
              onChange={(evento) =>
                setMensagemAluno(
                  evento.target.value,
                )
              }
              rows={3}
              placeholder="Em branco, o sistema utilizará a mensagem padrão."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <strong className="text-sm">
              {selecionados.size} aluno
              {selecionados.size === 1
                ? ""
                : "s"}{" "}
              selecionado
              {selecionados.size === 1
                ? ""
                : "s"}
            </strong>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  selecionados.size ===
                    0 ||
                  processando
                }
                onClick={() =>
                  setConfirmacaoRestricao(
                    {
                      acao: "REMOVER",
                    },
                  )
                }
                className="h-10 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 disabled:opacity-50"
              >
                Definir sem restrição
              </button>

              <button
                type="button"
                disabled={
                  selecionados.size ===
                    0 ||
                  processando
                }
                onClick={() =>
                  setConfirmacaoRestricao(
                    {
                      acao: "APLICAR",
                    },
                  )
                }
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Aplicar consequência
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <input
              type="checkbox"
              checked={
                todosSelecionados
              }
              onChange={
                alternarTodos
              }
              disabled={
                alunosSelecionaveis.length ===
                0
              }
              className="h-4 w-4"
            />

            <strong>
              Selecionar alunos desta página
            </strong>
          </div>

          {carregando ? (
            <div className="p-10 text-center text-sm text-slate-600">
              Carregando alunos...
            </div>
          ) : alunos.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-600">
              Nenhum aluno encontrado com esses filtros.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {alunos.map((aluno) => {
                const selecionavel =
                  aluno.podeReceberRestricao ||
                  aluno.tipoRestricaoAtual !==
                    "NENHUMA";

                return (
                  <article
                    key={aluno.alunoId}
                    className="grid gap-4 p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
                  >
                    <input
                      type="checkbox"
                      checked={selecionados.has(
                        aluno.alunoId,
                      )}
                      disabled={
                        !selecionavel
                      }
                      onChange={() =>
                        alternarAluno(
                          aluno.alunoId,
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {aluno.nome}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classeSituacao(
                            aluno.situacaoPainel,
                          )}`}
                        >
                          {nomeSituacao(
                            aluno.situacaoPainel,
                          )}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classeRestricao(
                            aluno.tipoRestricaoAtual,
                          )}`}
                        >
                          {nomeRestricao(
                            aluno.tipoRestricaoAtual,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Matrícula:{" "}
                        {aluno.matricula
                          .numero ||
                          "Não informada"}
                        {" · "}
                        {aluno.polo?.nome ||
                          "Sem polo"}
                        {" · "}
                        {aluno.matricula
                          .semestreAtual ||
                          "—"}
                        º semestre
                      </p>

                      {aluno.rematricula && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Protocolo:{" "}
                          {aluno.rematricula
                            .protocolo ||
                            "—"}
                          {" · "}
                          Disciplinas:{" "}
                          {aluno.rematricula
                            ._count?.itens ||
                            0}
                          {" · "}
                          Atualizado em:{" "}
                          {formatarData(
                            aluno.rematricula
                              .atualizadaEm,
                          )}
                        </p>
                      )}

                      {aluno.restricao
                        .motivo && (
                        <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                          Motivo:{" "}
                          {
                            aluno.restricao
                              .motivo
                          }
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 lg:text-right">
                      {aluno.realizouRematricula ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          Rematrícula realizada
                        </span>
                      ) : aluno.pendenteAposPrazo ? (
                        <span className="font-semibold text-red-700 dark:text-red-300">
                          Pendente após o prazo
                        </span>
                      ) : (
                        <span>
                          Aguardando aluno
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {dados?.paginacao && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm dark:border-slate-700">
              <span>
                Página{" "}
                {dados.paginacao.pagina} de{" "}
                {dados.paginacao.totalPaginas}
                {" · "}
                {
                  dados.paginacao
                    .totalRegistros
                }{" "}
                registro(s)
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    dados.paginacao.pagina <=
                    1
                  }
                  onClick={() =>
                    setPagina((atual) =>
                      Math.max(
                        atual - 1,
                        1,
                      ),
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  disabled={
                    dados.paginacao.pagina >=
                    dados.paginacao.totalPaginas
                  }
                  onClick={() =>
                    setPagina((atual) =>
                      atual + 1,
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <PhanyxConfirmModal
        aberto={
          confirmacaoRestricao !==
          null
        }
        titulo={
          confirmacaoRestricao?.acao ===
          "APLICAR"
            ? "Aplicar consequência"
            : "Remover restrição"
        }
        mensagem={
          confirmacaoRestricao?.acao ===
          "APLICAR"
            ? `Aplicar “${nomeRestricao(
                tipoRestricao,
              )}” a ${selecionados.size} aluno(s)? Esta ação ficará registrada no histórico.`
            : `Definir ${selecionados.size} aluno(s) como “Sem restrição”? A remoção ficará registrada no histórico.`
        }
        textoConfirmar={
          processando
            ? "Processando..."
            : confirmacaoRestricao?.acao ===
                "APLICAR"
              ? "Aplicar"
              : "Remover restrição"
        }
        textoCancelar="Voltar"
        onConfirmar={
          executarRestricao
        }
        onCancelar={() => {
          if (!processando) {
            setConfirmacaoRestricao(
              null,
            );
          }
        }}
      />
    </main>
  );
}