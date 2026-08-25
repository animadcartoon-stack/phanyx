"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type TipoDisciplinaRematricula =
  | "PROXIMO_SEMESTRE"
  | "PENDENCIA_ANTERIOR"
  | "EXTRACURRICULAR";

type HorarioTurma = {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFim?: string | null;
};

type OpcaoTurma = {
  turmaDisciplinaId: number;
  turmaId: number;
  turmaNome: string;
  turmaCodigo?: string | null;
  periodoLetivo?: string | null;
  professor?: {
    id: number;
    nome: string;
  } | null;
  polo?: {
    id: number;
    nome: string;
  } | null;
  predio?: string | null;
  ala?: string | null;
  andar?: string | null;
  sala?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  statusTurma: string;
  capacidadeMaxima?: number | null;
  ocupacao: number;
  vagasDisponiveis?: number | null;
  semVagas: boolean;
  horarios: HorarioTurma[];
};

type PreRequisito = {
  disciplinaId: number;
  nome: string;
  codigo?: string | null;
  cumprido: boolean;
};

type DisciplinaRematricula = {
  disciplinaId: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  cargaHoraria: number;
  tipo: TipoDisciplinaRematricula;
  semestreOrigemNumero?: number | null;
  obrigatoria: boolean;
  contaCargaMinima: boolean;
  contaCargaMaxima: boolean;
  preRequisitos: PreRequisito[];
  preRequisitosPendentes: PreRequisito[];
  opcoesTurma: OpcaoTurma[];
  bloqueada: boolean;
  motivosBloqueio: string[];
};

type ItemRematriculaExistente = {
  id: number;
  disciplinaId: number;
  turmaDisciplinaId: number;
  tipo: TipoDisciplinaRematricula;
  cargaHorariaSnapshot: number;
  semestreOrigemNumero?: number | null;
  obrigatoria: boolean;
};

type RespostaRematricula = {
  error?: string;
  mensagem?: string;

  mostrarPagina: boolean;
  visibilidadeManual: boolean;
  periodoAberto: boolean;
  motivoIndisponibilidade?: string | null;

  aluno?: {
    id: number;
    nome: string;
    statusAluno: string;
    polo?: {
      id: number;
      nome: string;
    } | null;
  };

  matriculaAtual?: {
    id: number;
    numeroMatricula?: string | null;
    status: string;
    semestreAtual?: number | null;
    curso?: {
      id: number;
      nome: string;
      codigo?: string | null;
    } | null;
  } | null;

  proximoSemestreNumero?: number;

  periodo?: {
    id: number;
    titulo?: string | null;
    periodoLetivo: string;
    semestreNumero?: number | null;
    dataInicio: string;
    dataFim: string;
    dataInicioAulas?: string | null;
    instrucoes?: string | null;
    exigeAprovacao: boolean;
    permiteRascunho: boolean;
    bloqueiaInadimplente: boolean;
    cargaMinima: number;
    cargaMaxima?: number | null;
    curso?: {
      id: number;
      nome: string;
      codigo?: string | null;
    } | null;
    cursoSemestre: {
      id: number;
      numero: number;
      titulo?: string | null;
      descricao?: string | null;
    };
  } | null;

  regras?: {
    cargaMinima: number;
    cargaMaxima?: number | null;
    exigeAprovacao: boolean;
    permiteRascunho: boolean;
    bloqueiaInadimplente: boolean;
  };

  bloqueios?: {
    inadimplencia: boolean;
    mensagemInadimplencia?: string | null;
  };

  disciplinas?: DisciplinaRematricula[];

  rematricula?: {
    id: number;
    protocolo?: string | null;
    status: string;
    cargaHorariaSelecionada: number;
    declaracaoAceitaEm?: string | null;
    enviadaEm?: string | null;
    aprovadaEm?: string | null;
    devolvidaEm?: string | null;
    recusadaEm?: string | null;
    motivoDevolucao?: string | null;
    motivoRecusa?: string | null;
    itens: ItemRematriculaExistente[];
  } | null;

  selecaoAtual?: {
    turmaDisciplinaIds: number[];
    disciplinaIds: number[];
    cargaHorariaSelecionada: number;
  };

  edicaoPermitida?: boolean;
  envioPermitido?: boolean;

  gradeCurricular?: {
    pdfDisponivel: boolean;
    pdfUrl?: string | null;
    mensagem?: string | null;
  };
};

type SelecaoDisciplinas = Record<number, number>;

type AcaoRematriculaAluno = "SALVAR_RASCUNHO" | "ENVIAR";

type MensagemTela = {
  tipo: "erro" | "sucesso" | "aviso";
  texto: string;
};

const CHAVES_DIAS_SEMANA: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

type TradutorRematricula = (
  chave: any,
  valores?: Record<string, any>,
) => string;

function formatarDataHora(
  valor: string | null | undefined,
  locale: string,
  t: TradutorRematricula,
) {
  if (!valor) {
    return t("common.notInformed");
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return t("common.invalidDate");
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function nomeTipoDisciplina(
  tipo: TipoDisciplinaRematricula,
  t: TradutorRematricula,
) {
  if (tipo === "PROXIMO_SEMESTRE") {
    return t("disciplineTypes.nextSemester");
  }

  if (tipo === "PENDENCIA_ANTERIOR") {
    return t("disciplineTypes.previousPending");
  }

  return t("disciplineTypes.extracurricular");
}

function classeTipoDisciplina(tipo: TipoDisciplinaRematricula) {
  if (tipo === "PROXIMO_SEMESTRE") {
    return "phanyx-rematricula-badge-tipo phanyx-rematricula-badge-proximo";
  }

  if (tipo === "PENDENCIA_ANTERIOR") {
    return "phanyx-rematricula-badge-tipo phanyx-rematricula-badge-pendencia";
  }

  return "phanyx-rematricula-badge-tipo phanyx-rematricula-badge-extra";
}

function nomeStatusRematricula(
  status: string | null | undefined,
  t: TradutorRematricula,
) {
  const chaves: Record<string, string> = {
    RASCUNHO: "status.draft",
    ENVIADA: "status.sent",
    EM_ANALISE: "status.underReview",
    APROVADA: "status.approved",
    DEVOLVIDA: "status.returned",
    RECUSADA: "status.rejected",
    CANCELADA: "status.cancelled",
    EXPIRADA: "status.expired",
  };

  return status
    ? chaves[status]
      ? t(chaves[status])
      : status
    : t("status.notStarted");
}

function minutosHorario(valor?: string | null) {
  if (!valor) {
    return null;
  }

  const partes = valor.split(":");
  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    return null;
  }

  return horas * 60 + minutos;
}

function horariosConflitam(horarioA: HorarioTurma, horarioB: HorarioTurma) {
  if (horarioA.diaSemana !== horarioB.diaSemana) {
    return false;
  }

  const inicioA = minutosHorario(horarioA.horaInicio);
  const fimA = minutosHorario(horarioA.horaFim) ?? inicioA;
  const inicioB = minutosHorario(horarioB.horaInicio);
  const fimB = minutosHorario(horarioB.horaFim) ?? inicioB;

  if (inicioA === null || fimA === null || inicioB === null || fimB === null) {
    return false;
  }

  return inicioA < fimB && inicioB < fimA;
}

function descreverLocal(turma: OpcaoTurma, t: TradutorRematricula) {
  const partes = [
    turma.predio,
    turma.ala,
    turma.andar ? t("location.floor", { value: turma.andar }) : null,
    turma.sala ? t("location.room", { value: turma.sala }) : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : t("location.notInformed");
}

function formatarHorarios(horarios: HorarioTurma[], t: TradutorRematricula) {
  if (horarios.length === 0) {
    return t("schedule.notInformed");
  }

  return horarios
    .map((horario) => {
      const dia = CHAVES_DIAS_SEMANA[horario.diaSemana]
        ? t(`days.${CHAVES_DIAS_SEMANA[horario.diaSemana]}`)
        : t("days.fallback", { number: horario.diaSemana });

      return horario.horaFim
        ? t("schedule.range", {
            day: dia,
            start: horario.horaInicio,
            end: horario.horaFim,
          })
        : t("schedule.start", {
            day: dia,
            start: horario.horaInicio,
          });
    })
    .join(" · ");
}

export default function RematriculaAlunoPage() {
  const t = useTranslations("StudentReenrollment");
  const locale = useLocale();
  const tr = t as unknown as TradutorRematricula;
  const [dados, setDados] = useState<RespostaRematricula | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState<MensagemTela | null>(null);

  const [selecionadas, setSelecionadas] = useState<SelecaoDisciplinas>({});

  const [declaracaoAceita, setDeclaracaoAceita] = useState(false);

  const [processandoAcao, setProcessandoAcao] =
    useState<AcaoRematriculaAluno | null>(null);

  const [confirmarEnvio, setConfirmarEnvio] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch("/api/aluno/rematricula", {
        credentials: "include",
        cache: "no-store",
      });

      const json = (await resposta.json()) as RespostaRematricula;

      if (!resposta.ok) {
        throw new Error(json.error || t("errors.load"));
      }

      setDados(json);

      const selecaoInicial: SelecaoDisciplinas = {};

      for (const item of json.rematricula?.itens || []) {
        selecaoInicial[item.disciplinaId] = item.turmaDisciplinaId;
      }

      setSelecionadas(selecaoInicial);

      setDeclaracaoAceita(Boolean(json.rematricula?.declaracaoAceitaEm));
    } catch (e) {
      setErro(e instanceof Error ? e.message : t("errors.load"));
    } finally {
      setCarregando(false);
    }
  }, [t]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const disciplinas = dados?.disciplinas || [];

  const disciplinasSelecionadas = useMemo(() => {
    return disciplinas.filter(
      (disciplina) => selecionadas[disciplina.disciplinaId] !== undefined,
    );
  }, [disciplinas, selecionadas]);

  const cargaSelecionadaMaxima = useMemo(() => {
    return disciplinasSelecionadas.reduce(
      (total, disciplina) =>
        total + (disciplina.contaCargaMaxima ? disciplina.cargaHoraria : 0),
      0,
    );
  }, [disciplinasSelecionadas]);

  const cargaSelecionadaMinima = useMemo(() => {
    return disciplinasSelecionadas.reduce(
      (total, disciplina) =>
        total + (disciplina.contaCargaMinima ? disciplina.cargaHoraria : 0),
      0,
    );
  }, [disciplinasSelecionadas]);

  const cargaMinima =
    dados?.regras?.cargaMinima ?? dados?.periodo?.cargaMinima ?? 0;

  const cargaMaxima =
    dados?.regras?.cargaMaxima ?? dados?.periodo?.cargaMaxima ?? null;

  const atingiuCargaMinima = cargaSelecionadaMinima >= cargaMinima;

  const ultrapassouCargaMaxima =
    cargaMaxima !== null && cargaSelecionadaMaxima > cargaMaxima;

  const grupos = useMemo(() => {
    return {
      proximoSemestre: disciplinas.filter(
        (disciplina) => disciplina.tipo === "PROXIMO_SEMESTRE",
      ),
      pendencias: disciplinas.filter(
        (disciplina) => disciplina.tipo === "PENDENCIA_ANTERIOR",
      ),
      extras: disciplinas.filter(
        (disciplina) => disciplina.tipo === "EXTRACURRICULAR",
      ),
    };
  }, [disciplinas]);

  function encontrarTurma(
    disciplina: DisciplinaRematricula,
    turmaDisciplinaId: number,
  ) {
    return (
      disciplina.opcoesTurma.find(
        (turma) => turma.turmaDisciplinaId === turmaDisciplinaId,
      ) || null
    );
  }

  function existeConflitoComSelecao(
    disciplinaNova: DisciplinaRematricula,
    turmaNovaId: number,
  ) {
    const turmaNova = encontrarTurma(disciplinaNova, turmaNovaId);

    if (!turmaNova) {
      return null;
    }

    for (const disciplinaSelecionada of disciplinasSelecionadas) {
      if (disciplinaSelecionada.disciplinaId === disciplinaNova.disciplinaId) {
        continue;
      }

      const turmaSelecionadaId =
        selecionadas[disciplinaSelecionada.disciplinaId];

      const turmaSelecionada = encontrarTurma(
        disciplinaSelecionada,
        turmaSelecionadaId,
      );

      if (!turmaSelecionada) {
        continue;
      }

      for (const horarioNovo of turmaNova.horarios) {
        for (const horarioAtual of turmaSelecionada.horarios) {
          if (horariosConflitam(horarioNovo, horarioAtual)) {
            return {
              disciplina: disciplinaSelecionada.nome,
              horario: t("conflicts.slot", {
                day: CHAVES_DIAS_SEMANA[horarioNovo.diaSemana]
                  ? t(`days.${CHAVES_DIAS_SEMANA[horarioNovo.diaSemana]}`)
                  : t("days.fallback", { number: horarioNovo.diaSemana }),
                time: horarioNovo.horaInicio,
              }),
            };
          }
        }
      }
    }

    return null;
  }

  function selecionarDisciplina(disciplina: DisciplinaRematricula) {
    setMensagem(null);

    if (!dados?.edicaoPermitida || disciplina.bloqueada) {
      return;
    }

    const jaSelecionada = selecionadas[disciplina.disciplinaId] !== undefined;

    if (jaSelecionada) {
      setSelecionadas((atual) => {
        const proxima = { ...atual };
        delete proxima[disciplina.disciplinaId];
        return proxima;
      });

      return;
    }

    const primeiraTurmaDisponivel = disciplina.opcoesTurma.find(
      (turma) => !turma.semVagas,
    );

    if (!primeiraTurmaDisponivel) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.noAvailableClass"),
      });
      return;
    }

    const novaCarga =
      cargaSelecionadaMaxima +
      (disciplina.contaCargaMaxima ? disciplina.cargaHoraria : 0);

    if (cargaMaxima !== null && novaCarga > cargaMaxima) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.wouldExceedMaximum", { hours: cargaMaxima }),
      });
      return;
    }

    const conflito = existeConflitoComSelecao(
      disciplina,
      primeiraTurmaDisponivel.turmaDisciplinaId,
    );

    if (conflito) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.scheduleConflict", {
          subject: conflito.disciplina,
          schedule: conflito.horario,
        }),
      });
      return;
    }

    setSelecionadas((atual) => ({
      ...atual,
      [disciplina.disciplinaId]: primeiraTurmaDisponivel.turmaDisciplinaId,
    }));
  }

  function alterarTurma(
    disciplina: DisciplinaRematricula,
    turmaDisciplinaId: number,
  ) {
    setMensagem(null);

    const turma = encontrarTurma(disciplina, turmaDisciplinaId);

    if (!turma || turma.semVagas) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.selectedClassFull"),
      });
      return;
    }

    const conflito = existeConflitoComSelecao(disciplina, turmaDisciplinaId);

    if (conflito) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.scheduleConflict", {
          subject: conflito.disciplina,
          schedule: conflito.horario,
        }),
      });
      return;
    }

    setSelecionadas((atual) => ({
      ...atual,
      [disciplina.disciplinaId]: turmaDisciplinaId,
    }));
  }

  async function salvarRematricula(acao: AcaoRematriculaAluno) {
    setMensagem(null);

    if (!dados?.periodo?.id) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.periodNotFound"),
      });

      return;
    }

    if (!dados.edicaoPermitida) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.editNotAllowed"),
      });

      return;
    }

    if (acao === "SALVAR_RASCUNHO" && !dados.periodo.permiteRascunho) {
      setMensagem({
        tipo: "erro",
        texto: t("errors.draftNotAllowed"),
      });

      return;
    }

    if (acao === "ENVIAR") {
      if (disciplinasSelecionadas.length === 0) {
        setMensagem({
          tipo: "erro",
          texto: t("errors.selectOneSubject"),
        });

        return;
      }

      if (!atingiuCargaMinima) {
        setMensagem({
          tipo: "erro",
          texto: t("errors.minimumLoad", { hours: cargaMinima }),
        });

        return;
      }

      if (ultrapassouCargaMaxima) {
        setMensagem({
          tipo: "erro",
          texto: t("errors.maximumLoadExceeded"),
        });

        return;
      }

      if (!declaracaoAceita) {
        setMensagem({
          tipo: "erro",
          texto: t("errors.acceptDeclaration"),
        });

        return;
      }
    }

    const itens = disciplinasSelecionadas.map((disciplina) => ({
      disciplinaId: disciplina.disciplinaId,

      turmaDisciplinaId: selecionadas[disciplina.disciplinaId],
    }));

    setProcessandoAcao(acao);

    try {
      const resposta = await fetch("/api/aluno/rematricula", {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          acao,

          periodoMatriculaId: dados.periodo.id,

          itens,

          declaracaoAceita,

          observacoes: null,
        }),
      });

      const resultado = (await resposta.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;

        rematricula?: {
          id: number;
          protocolo?: string | null;
          status: string;
        } | null;
      };

      if (!resposta.ok) {
        throw new Error(resultado.error || t("errors.save"));
      }

      setConfirmarEnvio(false);

      await carregar();

      setMensagem({
        tipo: "sucesso",
        texto:
          acao === "ENVIAR"
            ? dados.periodo.exigeAprovacao
              ? t("success.sentForReview")
              : t("success.sent")
            : t("success.draftSaved"),
      });
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : t("errors.save"),
      });
    } finally {
      setProcessandoAcao(null);
    }
  }

  if (carregando) {
    return (
      <main className="phanyx-aluno-rematricula-page min-h-screen">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="font-semibold">{t("loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="phanyx-aluno-rematricula-page min-h-screen">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800 shadow-sm dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <h1 className="text-xl font-black">{t("errorTitle")}</h1>

            <p className="mt-2 text-sm">{erro}</p>

            <button
              type="button"
              onClick={carregar}
              className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
            >
              {t("actions.retry")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!dados?.mostrarPagina) {
    return (
      <main className="phanyx-aluno-rematricula-page min-h-screen">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-4xl">🔒</div>

            <h1 className="mt-4 text-2xl font-black">
              {t("unavailable.title")}
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {dados.mensagem || t("unavailable.description")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!dados.periodoAberto || !dados.periodo) {
    return (
      <main className="phanyx-aluno-rematricula-page min-h-screen">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
              {t("academic")}
            </p>

            <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <h2 className="font-bold">{t("closed.title")}</h2>

              <p className="mt-1 text-sm">
                {dados.mensagem || t("closed.description")}
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="phanyx-aluno-rematricula-page min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white shadow-lg dark:border-blue-900">
          <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                {t("hero.available")}
              </p>

              <h1 className="phanyx-rematricula-hero-titulo mt-2 text-3xl font-black md:text-4xl">
                {dados.periodo.titulo || t("title")}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">
                {t("hero.description", {
                  semester: dados.periodo.cursoSemestre.numero,
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-blue-100">
                {t("hero.deadline")}
              </p>

              <p className="mt-1 text-lg font-black">
                {formatarDataHora(dados.periodo.dataFim, locale, tr)}
              </p>
            </div>
          </div>
        </section>

        {mensagem && (
          <div
            className={`rounded-2xl border p-4 text-sm font-semibold ${
              mensagem.tipo === "erro"
                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                : mensagem.tipo === "sucesso"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        {dados.bloqueios?.inadimplencia && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <h2 className="font-black">{t("blocked.title")}</h2>

            <p className="mt-1 text-sm">
              {dados.bloqueios.mensagemInadimplencia}
            </p>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            titulo={t("summary.course")}
            valor={
              dados.periodo.curso?.nome ||
              dados.matriculaAtual?.curso?.nome ||
              t("common.notInformed")
            }
          />

          <ResumoCard
            titulo={t("summary.destinationSemester")}
            valor={t("common.semesterNumber", {
              number: dados.periodo.cursoSemestre.numero,
            })}
          />

          <ResumoCard
            titulo={t("summary.classStart")}
            valor={formatarDataHora(dados.periodo.dataInicioAulas, locale, tr)}
          />

          <ResumoCard
            titulo={t("summary.status")}
            valor={nomeStatusRematricula(dados.rematricula?.status, tr)}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {dados.periodo.instrucoes && (
              <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
                <h2 className="font-black text-blue-950 dark:text-blue-100">
                  {t("institutionInstructions.title")}
                </h2>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-blue-800 dark:text-blue-200">
                  {dados.periodo.instrucoes}
                </p>
              </section>
            )}

            <GrupoDisciplinas
              titulo={t("groups.nextSemester.title", {
                semester: dados.periodo.cursoSemestre.numero,
              })}
              descricao={t("groups.nextSemester.description")}
              disciplinas={grupos.proximoSemestre}
              selecionadas={selecionadas}
              edicaoPermitida={Boolean(dados.edicaoPermitida)}
              onSelecionar={selecionarDisciplina}
              onAlterarTurma={alterarTurma}
            />

            {grupos.pendencias.length > 0 && (
              <GrupoDisciplinas
                titulo={t("groups.pending.title")}
                descricao={t("groups.pending.description")}
                disciplinas={grupos.pendencias}
                selecionadas={selecionadas}
                edicaoPermitida={Boolean(dados.edicaoPermitida)}
                onSelecionar={selecionarDisciplina}
                onAlterarTurma={alterarTurma}
              />
            )}

            {grupos.extras.length > 0 && (
              <GrupoDisciplinas
                titulo={t("groups.extras.title")}
                descricao={t("groups.extras.description")}
                disciplinas={grupos.extras}
                selecionadas={selecionadas}
                edicaoPermitida={Boolean(dados.edicaoPermitida)}
                onSelecionar={selecionarDisciplina}
                onAlterarTurma={alterarTurma}
              />
            )}
          </div>

          <aside className="space-y-5">
            <section className="sticky top-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-black">
                {t("selectionSummary.title")}
              </h2>

              <div className="mt-5 space-y-4">
                <ResumoLinha
                  titulo={t("selectionSummary.subjects")}
                  valor={String(disciplinasSelecionadas.length)}
                />

                <ResumoLinha
                  titulo={t("selectionSummary.selectedLoad")}
                  valor={t("common.hoursValue", {
                    hours: cargaSelecionadaMaxima,
                  })}
                />

                <ResumoLinha
                  titulo={t("selectionSummary.minimumLoad")}
                  valor={t("common.hoursValue", {
                    hours: cargaMinima,
                  })}
                />

                <ResumoLinha
                  titulo={t("selectionSummary.maximumLoad")}
                  valor={
                    cargaMaxima === null
                      ? t("selectionSummary.noLimit")
                      : t("common.hoursValue", {
                          hours: cargaMaxima,
                        })
                  }
                />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{t("selectionSummary.minimumProgress")}</span>
                  <span>
                    {cargaMinima > 0
                      ? Math.min(
                          Math.round(
                            (cargaSelecionadaMinima / cargaMinima) * 100,
                          ),
                          100,
                        )
                      : 100}
                    %
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      atingiuCargaMinima ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{
                      width: `${
                        cargaMinima > 0
                          ? Math.min(
                              (cargaSelecionadaMinima / cargaMinima) * 100,
                              100,
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {!atingiuCargaMinima && (
                <p className="phanyx-rematricula-aviso-carga mt-4 rounded-xl border p-3 text-xs font-semibold">
                  {t("selectionSummary.needMore", {
                    hours: Math.max(cargaMinima - cargaSelecionadaMinima, 0),
                  })}
                </p>
              )}

              {ultrapassouCargaMaxima && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 dark:bg-red-950/30 dark:text-red-200">
                  {t("selectionSummary.maximumExceeded")}
                </p>
              )}

              <label className="phanyx-rematricula-declaracao mt-5 flex items-start gap-3 rounded-2xl border p-4">
                <input
                  type="checkbox"
                  checked={declaracaoAceita}
                  disabled={!dados.edicaoPermitida}
                  onChange={(evento) =>
                    setDeclaracaoAceita(evento.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />

                <span className="phanyx-rematricula-declaracao-texto text-xs leading-5">
                  {t("declaration")}
                </span>
              </label>

              <div className="mt-5 grid gap-3">
                {dados.periodo.permiteRascunho && (
                  <button
                    type="button"
                    onClick={() => salvarRematricula("SALVAR_RASCUNHO")}
                    disabled={
                      processandoAcao !== null || !dados.edicaoPermitida
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {processandoAcao === "SALVAR_RASCUNHO"
                      ? t("actions.savingDraft")
                      : dados.rematricula?.status === "RASCUNHO"
                        ? t("actions.updateDraft")
                        : t("actions.saveDraft")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmarEnvio(true)}
                  disabled={
                    processandoAcao !== null ||
                    !dados.envioPermitido ||
                    disciplinasSelecionadas.length === 0 ||
                    !atingiuCargaMinima ||
                    ultrapassouCargaMaxima ||
                    !declaracaoAceita
                  }
                  title={
                    disciplinasSelecionadas.length === 0
                      ? t("tooltips.selectOneSubject")
                      : !atingiuCargaMinima
                        ? t("tooltips.minimumNotReached")
                        : ultrapassouCargaMaxima
                          ? t("tooltips.maximumExceeded")
                          : !declaracaoAceita
                            ? t("tooltips.acceptDeclaration")
                            : t("tooltips.send")
                  }
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processandoAcao === "ENVIAR"
                    ? t("actions.sending")
                    : dados.periodo.exigeAprovacao
                      ? t("actions.sendForReview")
                      : t("actions.confirm")}
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
                {t("afterSendNotice")}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-black">{t("curriculum.title")}</h2>

              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {t("curriculum.description")}
              </p>

              {dados.gradeCurricular?.pdfDisponivel &&
              dados.gradeCurricular.pdfUrl ? (
                <a
                  href={dados.gradeCurricular.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-slate-700"
                >
                  {t("curriculum.openPdf")}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  {t("curriculum.pdfPreparing")}
                </button>
              )}
            </section>
          </aside>
        </section>
      </div>

      <PhanyxConfirmModal
        aberto={confirmarEnvio}
        titulo={
          dados.periodo.exigeAprovacao
            ? t("confirmation.reviewTitle")
            : t("confirmation.confirmTitle")
        }
        mensagem={
          dados.periodo.exigeAprovacao
            ? t("confirmation.reviewMessage", {
                count: disciplinasSelecionadas.length,
                hours: cargaSelecionadaMaxima,
              })
            : t("confirmation.confirmMessage", {
                count: disciplinasSelecionadas.length,
                hours: cargaSelecionadaMaxima,
              })
        }
        textoConfirmar={
          processandoAcao === "ENVIAR"
            ? t("actions.sending")
            : dados.periodo.exigeAprovacao
              ? t("actions.sendForReview")
              : t("actions.confirm")
        }
        textoCancelar={t("actions.back")}
        onConfirmar={() => salvarRematricula("ENVIAR")}
        onCancelar={() => {
          if (processandoAcao !== "ENVIAR") {
            setConfirmarEnvio(false);
          }
        }}
      />
    </main>
  );
}

function ResumoCard({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="phanyx-rematricula-resumo-card rounded-2xl border p-5 shadow-sm">
      <p className="phanyx-rematricula-resumo-label text-xs font-bold uppercase tracking-wide">
        {titulo}
      </p>

      <p className="phanyx-rematricula-resumo-valor mt-2 font-black">{valor}</p>
    </div>
  );
}

function ResumoLinha({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="phanyx-rematricula-resumo-linha flex items-center justify-between gap-4 border-b pb-3 text-sm last:border-0">
      <span className="phanyx-rematricula-resumo-linha-titulo">{titulo}</span>

      <strong className="phanyx-rematricula-resumo-linha-valor">{valor}</strong>
    </div>
  );
}

function GrupoDisciplinas({
  titulo,
  descricao,
  disciplinas,
  selecionadas,
  edicaoPermitida,
  onSelecionar,
  onAlterarTurma,
}: {
  titulo: string;
  descricao: string;
  disciplinas: DisciplinaRematricula[];
  selecionadas: SelecaoDisciplinas;
  edicaoPermitida: boolean;
  onSelecionar: (disciplina: DisciplinaRematricula) => void;
  onAlterarTurma: (
    disciplina: DisciplinaRematricula,
    turmaDisciplinaId: number,
  ) => void;
}) {
  const t = useTranslations("StudentReenrollment");
  const tr = t as unknown as TradutorRematricula;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <h2 className="text-xl font-black">{titulo}</h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {descricao}
        </p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">
          {t("subjects.emptyCategory")}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {disciplinas.map((disciplina) => {
            const selecionada =
              selecionadas[disciplina.disciplinaId] !== undefined;

            const turmaSelecionada = selecionadas[disciplina.disciplinaId];

            return (
              <article
                key={disciplina.disciplinaId}
                className={`phanyx-rematricula-disciplina-item p-5 transition ${
                  selecionada ? "phanyx-rematricula-disciplina-selecionada" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selecionada}
                    disabled={!edicaoPermitida || disciplina.bloqueada}
                    onChange={() => onSelecionar(disciplina)}
                    className="mt-1 h-5 w-5 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="phanyx-rematricula-disciplina-titulo font-black">
                        {disciplina.nome}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-black ${classeTipoDisciplina(
                          disciplina.tipo,
                        )}`}
                      >
                        {nomeTipoDisciplina(disciplina.tipo, tr)}
                      </span>

                      {disciplina.obrigatoria && (
                        <span className="phanyx-rematricula-badge-obrigatoria inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
                          {t("subjects.required")}
                        </span>
                      )}
                    </div>

                    <p className="phanyx-rematricula-disciplina-meta mt-1 text-xs">
                      {disciplina.codigo ? `${disciplina.codigo} · ` : ""}
                      {t("common.hoursLong", {
                        hours: disciplina.cargaHoraria,
                      })}
                      {disciplina.semestreOrigemNumero
                        ? ` · ${t("common.semesterNumber", {
                            number: disciplina.semestreOrigemNumero,
                          })}`
                        : ""}
                    </p>

                    {disciplina.descricao && (
                      <p className="phanyx-rematricula-disciplina-descricao mt-2 text-sm leading-6">
                        {disciplina.descricao}
                      </p>
                    )}

                    {disciplina.preRequisitos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {disciplina.preRequisitos.map((requisito) => (
                          <span
                            key={requisito.disciplinaId}
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                              requisito.cumprido
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                : "phanyx-rematricula-prerequisito-pendente"
                            }`}
                          >
                            {requisito.cumprido ? "✓" : "✕"} {requisito.nome}
                          </span>
                        ))}
                      </div>
                    )}

                    {disciplina.bloqueada && (
                      <div className="phanyx-rematricula-alerta-bloqueio mt-3 rounded-xl border p-3 text-xs font-semibold">
                        {disciplina.motivosBloqueio.map((motivo) => (
                          <p key={motivo}>{motivo}</p>
                        ))}
                      </div>
                    )}

                    {selecionada && (
                      <div className="mt-4">
                        <label className="text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          {t("subjects.class")}
                        </label>

                        <select
                          value={turmaSelecionada}
                          onChange={(evento) =>
                            onAlterarTurma(
                              disciplina,
                              Number(evento.target.value),
                            )
                          }
                          disabled={!edicaoPermitida}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        >
                          {disciplina.opcoesTurma.map((turma) => (
                            <option
                              key={turma.turmaDisciplinaId}
                              value={turma.turmaDisciplinaId}
                              disabled={turma.semVagas}
                            >
                              {turma.turmaNome}
                              {turma.turmaCodigo
                                ? ` — ${turma.turmaCodigo}`
                                : ""}
                              {turma.semVagas
                                ? ` — ${t("subjects.noSeats")}`
                                : ""}
                            </option>
                          ))}
                        </select>

                        {disciplina.opcoesTurma
                          .filter(
                            (turma) =>
                              turma.turmaDisciplinaId === turmaSelecionada,
                          )
                          .map((turma) => (
                            <div
                              key={turma.turmaDisciplinaId}
                              className="phanyx-rematricula-turma-card mt-3 grid gap-3 rounded-2xl border p-4 text-xs sm:grid-cols-2"
                            >
                              <InformacaoTurma
                                titulo={t("classInfo.teacher")}
                                valor={
                                  turma.professor?.nome ||
                                  t("common.notInformed")
                                }
                              />

                              <InformacaoTurma
                                titulo={t("classInfo.seats")}
                                valor={
                                  turma.vagasDisponiveis === null ||
                                  turma.vagasDisponiveis === undefined
                                    ? t("classInfo.noLimitInformed")
                                    : t("classInfo.availableSeats", {
                                        count: turma.vagasDisponiveis,
                                      })
                                }
                              />

                              <InformacaoTurma
                                titulo={t("classInfo.schedule")}
                                valor={formatarHorarios(turma.horarios, tr)}
                              />

                              <InformacaoTurma
                                titulo={t("classInfo.location")}
                                valor={descreverLocal(turma, tr)}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InformacaoTurma({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <span className="phanyx-rematricula-turma-info-label block font-black uppercase tracking-wide">
        {titulo}
      </span>

      <span className="mt-1 block font-semibold text-slate-800 dark:text-slate-100">
        {valor}
      </span>
    </div>
  );
}