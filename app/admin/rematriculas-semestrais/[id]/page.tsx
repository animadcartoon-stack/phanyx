"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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

function classeSituacao(valor?: string | null) {
  if (valor === "APROVADA") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200";
  }

  if (
    valor === "ENVIADA" ||
    valor === "EM_ANALISE"
  ) {
    return "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200";
  }

  if (
    valor === "PRAZO_PERDIDO" ||
    valor === "RECUSADA" ||
    valor === "EXPIRADA"
  ) {
    return "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200";
  }

  if (
    valor === "RASCUNHO" ||
    valor === "DEVOLVIDA"
  ) {
    return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
}

function classeRestricao(tipo: TipoRestricao) {
  if (tipo === "BLOQUEIO_PORTAL") {
    return "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200";
  }

  if (tipo === "RESTRICAO_PARCIAL") {
    return "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-200";
  }

  if (tipo === "SOMENTE_AVISO") {
    return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200";
  }

  return "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
}

export default function AlunosRematriculaPage() {
  const params = useParams<{
    id: string;
  }>();

  const periodoId = Number(params.id);

  const t = useTranslations("AdminSemesterReenrollmentStudents");
  const locale = useLocale();

  function nomeSituacao(valor?: string | null) {
    switch (valor) {
      case "PRAZO_PERDIDO": return t("situations.deadlineMissed");
      case "RASCUNHO": return t("situations.draft");
      case "ENVIADA": return t("situations.sent");
      case "EM_ANALISE": return t("situations.underReview");
      case "APROVADA": return t("situations.approved");
      case "DEVOLVIDA": return t("situations.returned");
      case "RECUSADA": return t("situations.rejected");
      case "CANCELADA": return t("situations.cancelled");
      case "EXPIRADA": return t("situations.expired");
      case "NAO_INICIOU":
      case null:
      case undefined:
      case "":
        return t("situations.notStarted");
      default:
        return valor;
    }
  }

  function nomeRestricao(tipo: TipoRestricao) {
    switch (tipo) {
      case "SOMENTE_AVISO": return t("restrictions.warningOnly");
      case "RESTRICAO_PARCIAL": return t("restrictions.partial");
      case "BLOQUEIO_PORTAL": return t("restrictions.portalBlocked");
      case "NENHUMA":
      default:
        return t("restrictions.none");
    }
  }

  function formatarData(valor?: string | null) {
    if (!valor) return "—";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return "—";
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(data);
  }

  function traduzirErroApi(
    mensagemApi: string | undefined,
    contexto: "CARREGAR" | "RESTRICAO",
  ) {
    switch (mensagemApi) {
      case "Não autorizado.":
        return t("apiErrors.unauthorized");
      case "Período de rematrícula inválido.":
        return t("errors.invalidPeriod");
      case "Período de rematrícula não encontrado.":
        return t("apiErrors.periodNotFound");
      case "O período não possui curso de destino.":
        return t("apiErrors.noDestinationCourse");
      case "Não foi possível identificar o semestre atual dos alunos elegíveis.":
      case "Não foi possível identificar o semestre dos alunos elegíveis.":
        return t("apiErrors.semesterNotIdentified");
      case "Ação de restrição inválida.":
        return t("apiErrors.invalidRestrictionAction");
      case "Selecione pelo menos um aluno.":
        return t("apiErrors.selectAtLeastOne");
      case "O limite é de 500 alunos por operação.":
        return t("apiErrors.tooManyStudents");
      case "Selecione um tipo de restrição válido.":
        return t("apiErrors.invalidRestrictionType");
      case "Não é possível aplicar restrições em um período cancelado.":
        return t("apiErrors.cancelledPeriod");
      case "A restrição somente pode ser aplicada depois do encerramento do prazo.":
        return t("apiErrors.beforeDeadline");
      case "Um ou mais alunos selecionados não são elegíveis para este período.":
        return t("apiErrors.ineligibleStudents");
      case "A restrição não pode ser aplicada a alunos com rematrícula enviada, em análise ou aprovada.":
        return t("apiErrors.completedStudents");
      default:
        return contexto === "CARREGAR"
          ? t("errors.loadStudents")
          : t("restrictionPanel.processError");
    }
  }

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
    useState(() =>
      t("restrictionPanel.defaultReason"),
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
            t("errors.invalidPeriod"),
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
            traduzirErroApi(
              resultado.error,
              "CARREGAR",
            ),
          );
        }

        setDados(resultado);
      } catch (error) {
        setMensagem({
          tipo: "erro",
          texto:
            error instanceof Error
              ? error.message
              : t("errors.loadStudents"),
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
      t,
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
                    t("restrictionPanel.defaultRemovalReason"),
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
          traduzirErroApi(
            resultado.error,
            "RESTRICAO",
          ),
        );
      }

      setMensagem({
        tipo: "sucesso",
        texto:
          confirmacaoRestricao.acao ===
          "APLICAR"
            ? t("restrictionPanel.applySuccess", {
                count: selecionados.size,
              })
            : t("restrictionPanel.removeSuccess", {
                count: selecionados.size,
              }),
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
            : t("restrictionPanel.processError"),
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
              {t("backToPeriods")}
            </Link>

            <h1 className="mt-3 text-2xl font-black sm:text-3xl">
              {t("title")}
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {dados?.periodo?.titulo ||
                t("periodFallback")}
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
                {t("periodCard.semesterTransition", {
                  current: dados.periodo.semestreAtual,
                  target: dados.periodo.semestreDestino,
                })}
              </span>

              <span
                className={`mt-2 block text-xs font-bold ${
                  dados.periodo.prazoEncerrado
                    ? "text-red-700 dark:text-red-300"
                    : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {dados.periodo.prazoEncerrado
                  ? t("periodCard.deadlineClosed")
                  : t("periodCard.deadlineOpen")}
              </span>
            </div>
          )}
        </header>

        {mensagem && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              mensagem.tipo ===
              "sucesso"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200"
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {[
            [t("summary.eligible"), resumo.elegiveis],
            [t("summary.notStarted"), resumo.naoIniciaram],
            [t("summary.drafts"), resumo.rascunhos],
            [t("summary.sent"), resumo.enviadas],
            [t("summary.underReview"), resumo.emAnalise],
            [t("summary.approved"), resumo.aprovadas],
            [t("summary.returned"), resumo.devolvidas],
            [t("summary.rejected"), resumo.recusadas],
            [t("summary.deadlineMissed"), resumo.prazoPerdido],
            [t("summary.afterDeadline"), resumo.pendentesAposPrazo],
            [t("summary.withRestriction"), resumo.comRestricao],
            [t("summary.withoutRestriction"), resumo.semRestricao],
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
              placeholder={t("filters.searchPlaceholder")}
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
                {t("filters.allSituations")}
              </option>
              <option value="NAO_REALIZOU">
                {t("filters.notCompleted")}
              </option>
              <option value="NAO_INICIOU">
                {t("situations.notStarted")}
              </option>
              <option value="RASCUNHO">
                {t("situations.draft")}
              </option>
              <option value="ENVIADA">
                {t("situations.sent")}
              </option>
              <option value="EM_ANALISE">
                {t("situations.underReview")}
              </option>
              <option value="APROVADA">
                {t("situations.approved")}
              </option>
              <option value="DEVOLVIDA">
                {t("situations.returned")}
              </option>
              <option value="RECUSADA">
                {t("situations.rejected")}
              </option>
              <option value="PRAZO_PERDIDO">
                {t("situations.deadlineMissed")}
              </option>
              <option value="PENDENTE_APOS_PRAZO">
                {t("filters.pendingAfterDeadline")}
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
                {t("filters.allCampuses")}
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
                {t("filters.allRestrictions")}
              </option>
              <option value="NENHUMA">
                {t("restrictions.none")}
              </option>
              <option value="SOMENTE_AVISO">
                {t("restrictions.warningOnly")}
              </option>
              <option value="RESTRICAO_PARCIAL">
                {t("restrictions.partial")}
              </option>
              <option value="BLOQUEIO_PORTAL">
                {t("restrictions.portalBlocked")}
              </option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("filters.apply")}
              </button>

              <button
                type="button"
                onClick={
                  limparFiltros
                }
                className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold"
              >
                {t("filters.clear")}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-sm font-semibold">
                {t("restrictionPanel.consequence")}
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
                  {t("restrictions.warningOnly")}
                </option>
                <option value="RESTRICAO_PARCIAL">
                  {t("restrictions.partial")}
                </option>
                <option value="BLOQUEIO_PORTAL">
                  {t("restrictionPanel.blockPortal")}
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">
                {t("restrictionPanel.adminReason")}
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
              {t("restrictionPanel.studentMessage")}
            </span>

            <textarea
              value={mensagemAluno}
              onChange={(evento) =>
                setMensagemAluno(
                  evento.target.value,
                )
              }
              rows={3}
              placeholder={t("restrictionPanel.studentMessagePlaceholder")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <strong className="text-sm">
              {t("restrictionPanel.selectedCount", {
                count: selecionados.size,
              })}
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
                className="h-10 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                {t("restrictionPanel.setNoRestriction")}
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
                {t("restrictionPanel.applyConsequence")}
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
              {t("students.selectPage")}
            </strong>
          </div>

          {carregando ? (
            <div className="p-10 text-center text-sm text-slate-600 dark:text-slate-400">
              {t("students.loading")}
            </div>
          ) : alunos.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-600 dark:text-slate-400">
              {t("students.empty")}
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
                        {t("students.enrollment")}:{" "}
                        {aluno.matricula.numero ||
                          t("students.notProvided")}
                        {" · "}
                        {aluno.polo?.nome ||
                          t("students.noCampus")}
                        {" · "}
                        {aluno.matricula.semestreAtual
                          ? t("students.semester", {
                              semester:
                                aluno.matricula.semestreAtual,
                            })
                          : "—"}
                      </p>

                      {aluno.rematricula && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {t("students.protocol")}:{" "}
                          {aluno.rematricula
                            .protocolo ||
                            "—"}
                          {" · "}
                          {t("students.subjects")}:{" "}
                          {aluno.rematricula
                            ._count?.itens ||
                            0}
                          {" · "}
                          {t("students.updatedAt")}:{" "}
                          {formatarData(
                            aluno.rematricula
                              .atualizadaEm,
                          )}
                        </p>
                      )}

                      {aluno.restricao
                        .motivo && (
                        <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                          {t("students.reason")}:{" "}
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
                          {t("students.completed")}
                        </span>
                      ) : aluno.pendenteAposPrazo ? (
                        <span className="font-semibold text-red-700 dark:text-red-300">
                          {t("students.pendingAfterDeadline")}
                        </span>
                      ) : (
                        <span>
                          {t("students.waitingStudent")}
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
                {t("pagination.summary", {
                  page: dados.paginacao.pagina,
                  pages:
                    dados.paginacao.totalPaginas,
                  count:
                    dados.paginacao.totalRegistros,
                })}
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
                  {t("pagination.previous")}
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
                  {t("pagination.next")}
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
            ? t("confirm.applyTitle")
            : t("confirm.removeTitle")
        }
        mensagem={
          confirmacaoRestricao?.acao ===
          "APLICAR"
            ? t("confirm.applyMessage", {
                restriction:
                  nomeRestricao(
                    tipoRestricao,
                  ),
                count:
                  selecionados.size,
              })
            : t("confirm.removeMessage", {
                count:
                  selecionados.size,
              })
        }
        textoConfirmar={
          processando
            ? t("confirm.processing")
            : confirmacaoRestricao?.acao ===
                "APLICAR"
              ? t("confirm.apply")
              : t("confirm.remove")
        }
        textoCancelar={t("confirm.back")}
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