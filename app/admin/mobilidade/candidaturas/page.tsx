"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type StatusCandidatura =
  | "RASCUNHO"
  | "ENVIADA"
  | "EM_ANALISE"
  | "DOCUMENTACAO_PENDENTE"
  | "ELEGIVEL"
  | "INELEGIVEL"
  | "EM_SELECAO"
  | "CLASSIFICADA"
  | "LISTA_ESPERA"
  | "APROVADA"
  | "REPROVADA"
  | "DESISTENTE"
  | "CANCELADA";

type VinculoCandidato =
  | "ALUNO_PHANYX"
  | "ALUNO_EXTERNO";

type Oferta = {
  id: number;
  titulo: string;
  codigo: string | null;
  status: string;
  ano: number | null;
  periodo: string | null;
  vagas: number | null;

  programa: {
    id: number;
    nome: string;
    direcao: string;

    instituicaoParceira: {
      id: number;
      nome: string;
      paisCodigo: string;
    } | null;
  };
};

type Candidatura = {
  id: number;
  ofertaId: number;
  alunoId: number | null;
  matriculaId: number | null;
  vinculoCandidato: VinculoCandidato;
  nomeSnapshot: string;
  emailSnapshot: string | null;
  telefoneSnapshot: string | null;
  instituicaoOrigemNome: string | null;
  paisOrigemCodigo: string | null;
  status: StatusCandidatura;
  motivoStatus: string | null;
  enviadaEm: string | null;
  analisadaEm: string | null;
  notaFinal: number | null;
  classificacao: number | null;
  createdAt: string;
  updatedAt: string;

  oferta: Oferta;

  aluno: {
    id: number;
    nome: string;
    nomeSocial: string | null;
    matricula: string | null;
  } | null;

  matricula: {
    id: number;
    numeroMatricula: string;
    numeroMatriculaLegado: string | null;
    status: string;
    semestre: number | null;
    periodoLetivo: string | null;

    curso: {
      id: number;
      nome: string;
      codigo: string | null;
    } | null;
  } | null;

  documentosResumo: {
    total: number;
    obrigatorios: number;
    pendentes: number;
    aprovados: number;
  };
};

type MatriculaBusca = {
  id: number;
  numeroMatricula: string;
  numeroMatriculaLegado: string | null;
  status: string;
  modalidade: string | null;
  semestre: number | null;
  periodoLetivo: string | null;
  cursoId: number | null;
  elegivelPeloCurso: boolean;

  curso: {
    id: number;
    nome: string;
    codigo: string | null;
    ativo: boolean;
  } | null;
};

type AlunoBusca = {
  id: number;
  nome: string;
  nomeRegistro: string;
  email: string;
  telefone: string | null;
  paisTelefone: string | null;
  matriculaGeral: string | null;
  nacionalidade: string | null;
  paisResidencia: string | null;
  statusAluno: string | null;
  matriculas: MatriculaBusca[];
};

type RespostaLista = {
  ok: true;

  permissoes: {
    podeGerenciar: boolean;
  };

  resumo: {
    total: number;
    pendentes: number;
    aprovadas: number;
    naoAprovadas: number;
  };

  candidaturas: Candidatura[];
  ofertas: Oferta[];
};

type RespostaErro = {
  ok?: false;
  codigo?: string;
};

type FormNova = {
  ofertaId: string;
  vinculoCandidato: VinculoCandidato;
  status: StatusCandidatura;

  alunoId: number | null;
  matriculaId: number | null;

  nomeSnapshot: string;
  emailSnapshot: string;
  telefoneSnapshot: string;
  instituicaoOrigemNome: string;
  paisOrigemCodigo: string;
};

type FormProcessar = {
  status: StatusCandidatura;
  motivoStatus: string;
  notaFinal: string;
  classificacao: string;
};

const NOVA_INICIAL: FormNova = {
  ofertaId: "",
  vinculoCandidato: "ALUNO_PHANYX",
  status: "ENVIADA",

  alunoId: null,
  matriculaId: null,

  nomeSnapshot: "",
  emailSnapshot: "",
  telefoneSnapshot: "",
  instituicaoOrigemNome: "",
  paisOrigemCodigo: "",
};

const PROCESSAR_INICIAL: FormProcessar = {
  status: "ENVIADA",
  motivoStatus: "",
  notaFinal: "",
  classificacao: "",
};

export default function AdminMobilityApplicationsPage() {
  const locale = useLocale();

  const t = useTranslations(
    "AdminMobilityApplications"
  );

  const [
    candidaturas,
    setCandidaturas,
  ] = useState<Candidatura[]>([]);

  const [
    ofertas,
    setOfertas,
  ] = useState<Oferta[]>([]);

  const [
    resumo,
    setResumo,
  ] = useState({
    total: 0,
    pendentes: 0,
    aprovadas: 0,
    naoAprovadas: 0,
  });

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("");

  const [
    filtroVinculo,
    setFiltroVinculo,
  ] = useState("");

  const [
    filtroOferta,
    setFiltroOferta,
  ] = useState("");

  const [
    modalNova,
    setModalNova,
  ] = useState(false);

  const [
    formNova,
    setFormNova,
  ] = useState<FormNova>(
    NOVA_INICIAL
  );

  const [
    buscaAluno,
    setBuscaAluno,
  ] = useState("");

  const [
    alunosEncontrados,
    setAlunosEncontrados,
  ] = useState<AlunoBusca[]>([]);

  const [
    buscandoAluno,
    setBuscandoAluno,
  ] = useState(false);

  const [
    alunoSelecionado,
    setAlunoSelecionado,
  ] = useState<AlunoBusca | null>(
    null
  );

  const [
    modalProcessar,
    setModalProcessar,
  ] = useState(false);

  const [
    candidaturaSelecionada,
    setCandidaturaSelecionada,
  ] = useState<Candidatura | null>(
    null
  );

  const [
    formProcessar,
    setFormProcessar,
  ] = useState<FormProcessar>(
    PROCESSAR_INICIAL
  );

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900";

  const mostrarToast = useCallback(
    (
      tipo: "sucesso" | "erro",
      mensagem: string
    ) => {
      setToast({
        tipo,
        mensagem,
      });

      window.setTimeout(
        () => setToast(null),
        4200
      );
    },
    []
  );

  function traduzirErro(
    codigo?: string
  ) {
    const mapa: Record<
      string,
      string
    > = {
      NAO_AUTENTICADO:
        "errors.unauthorized",

      SEM_PERMISSAO:
        "errors.forbidden",

      SEM_PERMISSAO_GERENCIAR:
        "errors.forbiddenManage",

      OFERTA_INVALIDA:
        "errors.invalidOffer",

      VINCULO_INVALIDO:
        "errors.invalidType",

      STATUS_INVALIDO:
        "errors.invalidStatus",

      ALUNO_INVALIDO:
        "errors.invalidStudent",

      MATRICULA_INVALIDA:
        "errors.invalidEnrollment",

      CURSO_NAO_ELEGIVEL:
        "errors.ineligibleCourse",

      NOME_OBRIGATORIO:
        "errors.nameRequired",

      EMAIL_INVALIDO:
        "errors.invalidEmail",

      PAIS_INVALIDO:
        "errors.invalidCountry",

      NOTA_INVALIDA:
        "errors.invalidScore",

      CLASSIFICACAO_INVALIDA:
        "errors.invalidRanking",

      CANDIDATURA_DUPLICADA:
        "errors.duplicate",

      CANDIDATURA_NAO_ENCONTRADA:
        "errors.notFound",

      ID_INVALIDO:
        "errors.invalidId",
    };

    return codigo &&
      mapa[codigo]
      ? t(mapa[codigo])
      : t("errors.generic");
  }

  const carregar = useCallback(
    async () => {
      setCarregando(true);

      try {
        const params =
          new URLSearchParams();

        if (busca.trim()) {
          params.set(
            "q",
            busca.trim()
          );
        }

        if (filtroStatus) {
          params.set(
            "status",
            filtroStatus
          );
        }

        if (filtroVinculo) {
          params.set(
            "vinculo",
            filtroVinculo
          );
        }

        if (filtroOferta) {
          params.set(
            "ofertaId",
            filtroOferta
          );
        }

        const resposta =
          await fetch(
            `/api/admin/mobilidade/candidaturas?${params.toString()}`,
            {
              credentials:
                "include",
              cache:
                "no-store",
            }
          );

        const corpo =
          (await resposta.json()) as
            | RespostaLista
            | RespostaErro;

        if (
          !resposta.ok ||
          !(
            "candidaturas" in
            corpo
          )
        ) {
          throw new Error(
            traduzirErro(
              "codigo" in corpo
                ? corpo.codigo
                : undefined
            )
          );
        }

        setCandidaturas(
          corpo.candidaturas
        );

        setOfertas(
          corpo.ofertas
        );

        setResumo(
          corpo.resumo
        );

        setPodeGerenciar(
          corpo.permissoes
            .podeGerenciar
        );
      } catch (
        erro: unknown
      ) {
        mostrarToast(
          "erro",
          erro instanceof Error
            ? erro.message
            : t("errors.load")
        );
      } finally {
        setCarregando(false);
      }
    },
    [
      busca,
      filtroStatus,
      filtroVinculo,
      filtroOferta,
      mostrarToast,
      t,
    ]
  );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void carregar();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [carregar]);

  useEffect(() => {
    if (
      !modalNova ||
      formNova.vinculoCandidato !==
        "ALUNO_PHANYX"
    ) {
      return;
    }

    const termo =
      buscaAluno.trim();

    if (termo.length < 2) {
      setAlunosEncontrados([]);
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          setBuscandoAluno(
            true
          );

          try {
            const params =
              new URLSearchParams({
                q: termo,
              });

            if (
              formNova.ofertaId
            ) {
              params.set(
                "ofertaId",
                formNova.ofertaId
              );
            }

            const resposta =
              await fetch(
                `/api/admin/mobilidade/candidaturas/alunos?${params.toString()}`,
                {
                  credentials:
                    "include",
                  cache:
                    "no-store",
                }
              );

            const corpo =
              (await resposta.json()) as {
                ok?: boolean;
                alunos?: AlunoBusca[];
                codigo?: string;
              };

            if (
              !resposta.ok
            ) {
              throw new Error(
                traduzirErro(
                  corpo.codigo
                )
              );
            }

            setAlunosEncontrados(
              corpo.alunos ??
                []
            );
          } catch (
            erro: unknown
          ) {
            mostrarToast(
              "erro",
              erro instanceof
                Error
                ? erro.message
                : t(
                    "errors.studentSearch"
                  )
            );
          } finally {
            setBuscandoAluno(
              false
            );
          }
        },
        350
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    buscaAluno,
    formNova.ofertaId,
    formNova.vinculoCandidato,
    modalNova,
    mostrarToast,
    t,
  ]);

  function formatarData(
    valor: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "medium",
      }
    ).format(data);
  }

  function statusTexto(
    status: StatusCandidatura
  ) {
    switch (status) {
      case "RASCUNHO":
        return t(
          "statuses.draft"
        );

      case "ENVIADA":
        return t(
          "statuses.submitted"
        );

      case "EM_ANALISE":
        return t(
          "statuses.review"
        );

      case "DOCUMENTACAO_PENDENTE":
        return t(
          "statuses.documentsPending"
        );

      case "ELEGIVEL":
        return t(
          "statuses.eligible"
        );

      case "INELEGIVEL":
        return t(
          "statuses.ineligible"
        );

      case "EM_SELECAO":
        return t(
          "statuses.selection"
        );

      case "CLASSIFICADA":
        return t(
          "statuses.ranked"
        );

      case "LISTA_ESPERA":
        return t(
          "statuses.waitingList"
        );

      case "APROVADA":
        return t(
          "statuses.approved"
        );

      case "REPROVADA":
        return t(
          "statuses.rejected"
        );

      case "DESISTENTE":
        return t(
          "statuses.withdrawn"
        );

      case "CANCELADA":
        return t(
          "statuses.cancelled"
        );
    }
  }

  function statusClasse(
    status: StatusCandidatura
  ) {
    if (
      status === "APROVADA" ||
      status === "ELEGIVEL"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    }

    if (
      status === "REPROVADA" ||
      status === "INELEGIVEL" ||
      status === "CANCELADA"
    ) {
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200";
    }

    if (
      status === "EM_ANALISE" ||
      status === "EM_SELECAO" ||
      status === "CLASSIFICADA"
    ) {
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200";
    }

    if (
      status ===
      "DOCUMENTACAO_PENDENTE"
    ) {
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    }

    return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
  }

  function abrirNova() {
    setFormNova({
      ...NOVA_INICIAL,

      ofertaId:
        ofertas[0]?.id.toString() ??
        "",
    });

    setBuscaAluno("");
    setAlunosEncontrados([]);
    setAlunoSelecionado(
      null
    );
    setModalNova(true);
  }

  function selecionarAluno(
    aluno: AlunoBusca
  ) {
    setAlunoSelecionado(
      aluno
    );

    setFormNova(
      (atual) => ({
        ...atual,
        alunoId:
          aluno.id,
        matriculaId:
          null,
      })
    );
  }

  const matriculaSelecionada =
    useMemo(() => {
      if (
        !alunoSelecionado ||
        !formNova.matriculaId
      ) {
        return null;
      }

      return (
        alunoSelecionado.matriculas.find(
          (matricula) =>
            matricula.id ===
            formNova.matriculaId
        ) ?? null
      );
    }, [
      alunoSelecionado,
      formNova.matriculaId,
    ]);

  async function salvarNova(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !formNova.ofertaId
    ) {
      mostrarToast(
        "erro",
        t(
          "errors.invalidOffer"
        )
      );
      return;
    }

    if (
      formNova.vinculoCandidato ===
      "ALUNO_PHANYX"
    ) {
      if (
        !formNova.alunoId
      ) {
        mostrarToast(
          "erro",
          t(
            "errors.invalidStudent"
          )
        );
        return;
      }

      if (
        !formNova.matriculaId
      ) {
        mostrarToast(
          "erro",
          t(
            "errors.enrollmentRequired"
          )
        );
        return;
      }

      if (
        matriculaSelecionada &&
        !matriculaSelecionada.elegivelPeloCurso
      ) {
        mostrarToast(
          "erro",
          t(
            "errors.ineligibleCourse"
          )
        );
        return;
      }
    } else if (
      !formNova.nomeSnapshot.trim()
    ) {
      mostrarToast(
        "erro",
        t(
          "errors.nameRequired"
        )
      );
      return;
    }

    setSalvando(true);

    try {
      const resposta =
        await fetch(
          "/api/admin/mobilidade/candidaturas",
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ofertaId:
                  Number(
                    formNova.ofertaId
                  ),

                vinculoCandidato:
                  formNova.vinculoCandidato,

                status:
                  formNova.status,

                alunoId:
                  formNova.alunoId,

                matriculaId:
                  formNova.matriculaId,

                nomeSnapshot:
                  formNova.nomeSnapshot,

                emailSnapshot:
                  formNova.emailSnapshot,

                telefoneSnapshot:
                  formNova.telefoneSnapshot,

                instituicaoOrigemNome:
                  formNova.instituicaoOrigemNome,

                paisOrigemCodigo:
                  formNova.paisOrigemCodigo,
              }),
          }
        );

      const corpo =
        (await resposta.json()) as
          | {
              ok: true;
              id: number;
            }
          | RespostaErro;

      if (
        !resposta.ok
      ) {
        throw new Error(
          traduzirErro(
            "codigo" in corpo
              ? corpo.codigo
              : undefined
          )
        );
      }

      setModalNova(false);

      mostrarToast(
        "sucesso",
        t(
          "messages.created"
        )
      );

      await carregar();
    } catch (
      erro: unknown
    ) {
      mostrarToast(
        "erro",
        erro instanceof
          Error
          ? erro.message
          : t(
              "errors.save"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirProcessar(
    candidatura: Candidatura
  ) {
    setCandidaturaSelecionada(
      candidatura
    );

    setFormProcessar({
      status:
        candidatura.status,

      motivoStatus:
        candidatura.motivoStatus ??
        "",

      notaFinal:
        candidatura.notaFinal ===
        null
          ? ""
          : String(
              candidatura.notaFinal
            ),

      classificacao:
        candidatura.classificacao ===
        null
          ? ""
          : String(
              candidatura.classificacao
            ),
    });

    setModalProcessar(
      true
    );
  }

  async function salvarProcessamento(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !candidaturaSelecionada
    ) {
      return;
    }

    setSalvando(true);

    try {
      const resposta =
        await fetch(
          `/api/admin/mobilidade/candidaturas/${candidaturaSelecionada.id}`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  formProcessar.status,

                motivoStatus:
                  formProcessar.motivoStatus,

                notaFinal:
                  formProcessar.notaFinal,

                classificacao:
                  formProcessar.classificacao,
              }),
          }
        );

      const corpo =
        (await resposta.json()) as
          | {
              ok: true;
            }
          | RespostaErro;

      if (
        !resposta.ok
      ) {
        throw new Error(
          traduzirErro(
            "codigo" in corpo
              ? corpo.codigo
              : undefined
          )
        );
      }

      setModalProcessar(
        false
      );

      mostrarToast(
        "sucesso",
        t(
          "messages.updated"
        )
      );

      await carregar();
    } catch (
      erro: unknown
    ) {
      mostrarToast(
        "erro",
        erro instanceof
          Error
          ? erro.message
          : t(
              "errors.save"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-full bg-slate-50/70 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-950 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin/mobilidade"
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300"
              >
                ← {t("back")}
              </Link>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {t("title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
                {t("subtitle")}
              </p>
            </div>

            {podeGerenciar && (
              <button
                type="button"
                onClick={
                  abrirNova
                }
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + {t("actions.new")}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              t("summary.total"),
              resumo.total,
              "📝",
            ],
            [
              t("summary.pending"),
              resumo.pendentes,
              "⏳",
            ],
            [
              t("summary.approved"),
              resumo.aprovadas,
              "✅",
            ],
            [
              t("summary.notApproved"),
              resumo.naoAprovadas,
              "🚫",
            ],
          ].map(
            ([
              titulo,
              valor,
              icone,
            ]) => (
              <div
                key={String(
                  titulo
                )}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {titulo}
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {valor}
                    </p>
                  </div>

                  <span className="h-fit rounded-xl bg-slate-100 p-2 text-xl dark:bg-slate-800">
                    {icone}
                  </span>
                </div>
              </div>
            )
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px_300px_auto]">
            <input
              type="search"
              value={busca}
              onChange={(
                event
              ) =>
                setBusca(
                  event.target.value
                )
              }
              placeholder={t(
                "filters.search"
              )}
              className={campo}
            />

            <select
              value={
                filtroStatus
              }
              onChange={(
                event
              ) =>
                setFiltroStatus(
                  event.target.value
                )
              }
              className={campo}
            >
              <option value="">
                {t(
                  "filters.allStatuses"
                )}
              </option>

              {[
                "RASCUNHO",
                "ENVIADA",
                "EM_ANALISE",
                "DOCUMENTACAO_PENDENTE",
                "ELEGIVEL",
                "INELEGIVEL",
                "EM_SELECAO",
                "CLASSIFICADA",
                "LISTA_ESPERA",
                "APROVADA",
                "REPROVADA",
                "DESISTENTE",
                "CANCELADA",
              ].map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusTexto(
                      status as StatusCandidatura
                    )}
                  </option>
                )
              )}
            </select>

            <select
              value={
                filtroVinculo
              }
              onChange={(
                event
              ) =>
                setFiltroVinculo(
                  event.target.value
                )
              }
              className={campo}
            >
              <option value="">
                {t(
                  "filters.allTypes"
                )}
              </option>

              <option value="ALUNO_PHANYX">
                {t(
                  "types.phanyx"
                )}
              </option>

              <option value="ALUNO_EXTERNO">
                {t(
                  "types.external"
                )}
              </option>
            </select>

            <select
              value={
                filtroOferta
              }
              onChange={(
                event
              ) =>
                setFiltroOferta(
                  event.target.value
                )
              }
              className={campo}
            >
              <option value="">
                {t(
                  "filters.allOffers"
                )}
              </option>

              {ofertas.map(
                (oferta) => (
                  <option
                    key={
                      oferta.id
                    }
                    value={
                      oferta.id
                    }
                  >
                    {
                      oferta.titulo
                    }
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              ↻ {t("actions.refresh")}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {carregando ? (
            <div className="space-y-3 p-5">
              {Array.from({
                length: 5,
              }).map(
                (
                  _,
                  indice
                ) => (
                  <div
                    key={indice}
                    className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                  />
                )
              )}
            </div>
          ) : candidaturas.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                📝
              </div>

              <h2 className="mt-4 text-lg font-bold">
                {t(
                  "empty.title"
                )}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "empty.description"
                )}
              </p>

              {podeGerenciar && (
                <button
                  type="button"
                  onClick={
                    abrirNova
                  }
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {t(
                    "actions.new"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-4">
                      {t("table.candidate")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.type")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.offer")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.academicLink")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.documents")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.result")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.status")}
                    </th>

                    <th className="px-5 py-4">
                      {t("table.date")}
                    </th>

                    <th className="px-5 py-4 text-right">
                      {t("table.actions")}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {candidaturas.map(
                    (
                      candidatura
                    ) => (
                      <tr
                        key={
                          candidatura.id
                        }
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold">
                            {
                              candidatura.nomeSnapshot
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {candidatura.emailSnapshot ??
                              "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {candidatura.vinculoCandidato ===
                          "ALUNO_PHANYX"
                            ? `🎓 ${t(
                                "types.phanyx"
                              )}`
                            : `🌍 ${t(
                                "types.external"
                              )}`}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div className="font-medium">
                            {
                              candidatura.oferta.titulo
                            }
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {
                              candidatura.oferta.programa.nome
                            }
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {candidatura.matricula ? (
                            <>
                              <div className="font-medium">
                                {candidatura.matricula.curso?.nome ??
                                  "—"}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {
                                  candidatura.matricula.numeroMatricula
                                }
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">
                                {candidatura.instituicaoOrigemNome ??
                                  "—"}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {candidatura.paisOrigemCodigo ??
                                  "—"}
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {
                              candidatura.documentosResumo.aprovados
                            }
                            /
                            {
                              candidatura.documentosResumo.obrigatorios
                            }
                          </div>

                          {candidatura.documentosResumo.pendentes >
                            0 && (
                            <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                              {t(
                                "table.pendingDocuments",
                                {
                                  count:
                                    candidatura.documentosResumo.pendentes,
                                }
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {candidatura.notaFinal ===
                            null
                              ? "—"
                              : candidatura.notaFinal}
                          </div>

                          {candidatura.classificacao !==
                            null && (
                            <div className="mt-1 text-xs text-slate-500">
                              {t(
                                "table.ranking",
                                {
                                  value:
                                    candidatura.classificacao,
                                }
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasse(
                              candidatura.status
                            )}`}
                          >
                            {statusTexto(
                              candidatura.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {formatarData(
                            candidatura.enviadaEm ??
                              candidatura.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {podeGerenciar && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirProcessar(
                                  candidatura
                                )
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            >
                              {t(
                                "actions.process"
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalNova && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {t(
                    "modal.newTitle"
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t(
                    "modal.newDescription"
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalNova(
                    false
                  )
                }
                className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                salvarNova
              }
              className="max-h-[calc(94vh-100px)] overflow-y-auto"
            >
              <div className="space-y-6 p-5 sm:p-6">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    {t(
                      "fields.offer"
                    )}{" "}
                    *
                  </span>

                  <select
                    required
                    value={
                      formNova.ofertaId
                    }
                    onChange={(
                      event
                    ) => {
                      setFormNova(
                        (atual) => ({
                          ...atual,
                          ofertaId:
                            event.target.value,
                          alunoId:
                            null,
                          matriculaId:
                            null,
                        })
                      );

                      setAlunoSelecionado(
                        null
                      );
                    }}
                    className={campo}
                  >
                    <option value="">
                      {t(
                        "fields.selectOffer"
                      )}
                    </option>

                    {ofertas.map(
                      (oferta) => (
                        <option
                          key={
                            oferta.id
                          }
                          value={
                            oferta.id
                          }
                        >
                          {
                            oferta.titulo
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFormNova(
                        (atual) => ({
                          ...atual,
                          vinculoCandidato:
                            "ALUNO_PHANYX",
                        })
                      );

                      setAlunoSelecionado(
                        null
                      );
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      formNova.vinculoCandidato ===
                      "ALUNO_PHANYX"
                        ? "bg-white text-blue-700 shadow dark:bg-slate-900 dark:text-blue-300"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    🎓 {t("types.phanyx")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormNova(
                        (atual) => ({
                          ...atual,
                          vinculoCandidato:
                            "ALUNO_EXTERNO",
                          alunoId:
                            null,
                          matriculaId:
                            null,
                        })
                      );

                      setAlunoSelecionado(
                        null
                      );
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      formNova.vinculoCandidato ===
                      "ALUNO_EXTERNO"
                        ? "bg-white text-blue-700 shadow dark:bg-slate-900 dark:text-blue-300"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    🌍 {t("types.external")}
                  </button>
                </div>

                {formNova.vinculoCandidato ===
                "ALUNO_PHANYX" ? (
                  <section className="space-y-4">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.searchStudent"
                        )}
                      </span>

                      <input
                        type="search"
                        value={
                          buscaAluno
                        }
                        onChange={(
                          event
                        ) =>
                          setBuscaAluno(
                            event.target.value
                          )
                        }
                        placeholder={t(
                          "fields.searchStudentPlaceholder"
                        )}
                        className={campo}
                      />
                    </label>

                    {buscandoAluno && (
                      <p className="text-sm text-slate-500">
                        {t(
                          "fields.searching"
                        )}
                      </p>
                    )}

                    {!alunoSelecionado &&
                      alunosEncontrados.length >
                        0 && (
                        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                          {alunosEncontrados.map(
                            (
                              aluno
                            ) => (
                              <button
                                key={
                                  aluno.id
                                }
                                type="button"
                                onClick={() =>
                                  selecionarAluno(
                                    aluno
                                  )
                                }
                                className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                              >
                                <div className="font-semibold">
                                  {
                                    aluno.nome
                                  }
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    aluno.email
                                  }
                                  {" · "}
                                  {aluno.matriculaGeral ??
                                    "—"}
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      )}

                    {alunoSelecionado && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold">
                              {
                                alunoSelecionado.nome
                              }
                            </div>

                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              {
                                alunoSelecionado.email
                              }
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAlunoSelecionado(
                                null
                              );

                              setFormNova(
                                (
                                  atual
                                ) => ({
                                  ...atual,
                                  alunoId:
                                    null,
                                  matriculaId:
                                    null,
                                })
                              );
                            }}
                            className="text-xs font-semibold text-blue-700 dark:text-blue-300"
                          >
                            {t(
                              "actions.changeStudent"
                            )}
                          </button>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-semibold">
                            {t(
                              "fields.enrollment"
                            )}
                          </div>

                          {alunoSelecionado.matriculas.length ===
                          0 ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                              {t(
                                "fields.noEnrollments"
                              )}
                            </div>
                          ) : (
                            alunoSelecionado.matriculas.map(
                              (
                                matricula
                              ) => (
                                <label
                                  key={
                                    matricula.id
                                  }
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                                    matricula.elegivelPeloCurso
                                      ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                                      : "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="matricula"
                                    checked={
                                      formNova.matriculaId ===
                                      matricula.id
                                    }
                                    onChange={() =>
                                      setFormNova(
                                        (
                                          atual
                                        ) => ({
                                          ...atual,
                                          matriculaId:
                                            matricula.id,
                                        })
                                      )
                                    }
                                  />

                                  <div>
                                    <div className="text-sm font-semibold">
                                      {matricula.curso?.nome ??
                                        t(
                                          "fields.noCourse"
                                        )}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-500">
                                      {
                                        matricula.numeroMatricula
                                      }
                                      {" · "}
                                      {
                                        matricula.status
                                      }
                                    </div>

                                    {!matricula.elegivelPeloCurso && (
                                      <div className="mt-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                                        {t(
                                          "fields.courseNotEligible"
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              )
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <section className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.name"
                        )}{" "}
                        *
                      </span>

                      <input
                        required
                        value={
                          formNova.nomeSnapshot
                        }
                        onChange={(
                          event
                        ) =>
                          setFormNova(
                            (
                              atual
                            ) => ({
                              ...atual,
                              nomeSnapshot:
                                event.target.value,
                            })
                          )
                        }
                        className={campo}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.email"
                        )}
                      </span>

                      <input
                        type="email"
                        value={
                          formNova.emailSnapshot
                        }
                        onChange={(
                          event
                        ) =>
                          setFormNova(
                            (
                              atual
                            ) => ({
                              ...atual,
                              emailSnapshot:
                                event.target.value,
                            })
                          )
                        }
                        className={campo}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.phone"
                        )}
                      </span>

                      <input
                        value={
                          formNova.telefoneSnapshot
                        }
                        onChange={(
                          event
                        ) =>
                          setFormNova(
                            (
                              atual
                            ) => ({
                              ...atual,
                              telefoneSnapshot:
                                event.target.value,
                            })
                          )
                        }
                        className={campo}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.originCountry"
                        )}
                      </span>

                      <input
                        maxLength={2}
                        value={
                          formNova.paisOrigemCodigo
                        }
                        onChange={(
                          event
                        ) =>
                          setFormNova(
                            (
                              atual
                            ) => ({
                              ...atual,
                              paisOrigemCodigo:
                                event.target.value
                                  .toUpperCase()
                                  .slice(
                                    0,
                                    2
                                  ),
                            })
                          )
                        }
                        placeholder="FR"
                        className={campo}
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.originInstitution"
                        )}
                      </span>

                      <input
                        value={
                          formNova.instituicaoOrigemNome
                        }
                        onChange={(
                          event
                        ) =>
                          setFormNova(
                            (
                              atual
                            ) => ({
                              ...atual,
                              instituicaoOrigemNome:
                                event.target.value,
                            })
                          )
                        }
                        className={campo}
                      />
                    </label>
                  </section>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    {t(
                      "fields.initialStatus"
                    )}
                  </span>

                  <select
                    value={
                      formNova.status
                    }
                    onChange={(
                      event
                    ) =>
                      setFormNova(
                        (
                          atual
                        ) => ({
                          ...atual,
                          status:
                            event.target.value as StatusCandidatura,
                        })
                      )
                    }
                    className={campo}
                  >
                    <option value="RASCUNHO">
                      {t(
                        "statuses.draft"
                      )}
                    </option>

                    <option value="ENVIADA">
                      {t(
                        "statuses.submitted"
                      )}
                    </option>

                    <option value="EM_ANALISE">
                      {t(
                        "statuses.review"
                      )}
                    </option>
                  </select>
                </label>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() =>
                    setModalNova(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700"
                >
                  {t(
                    "actions.cancel"
                  )}
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {salvando
                    ? t(
                        "actions.saving"
                      )
                    : t(
                        "actions.save"
                      )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalProcessar &&
        candidaturaSelecionada && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {t(
                      "modal.processTitle"
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {
                      candidaturaSelecionada.nomeSnapshot
                    }
                    {" · "}
                    {
                      candidaturaSelecionada.oferta.titulo
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalProcessar(
                      false
                    )
                  }
                  className="rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={
                  salvarProcessamento
                }
              >
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold">
                      {t(
                        "fields.status"
                      )}
                    </span>

                    <select
                      value={
                        formProcessar.status
                      }
                      onChange={(
                        event
                      ) =>
                        setFormProcessar(
                          (
                            atual
                          ) => ({
                            ...atual,
                            status:
                              event.target.value as StatusCandidatura,
                          })
                        )
                      }
                      className={campo}
                    >
                      {[
                        "RASCUNHO",
                        "ENVIADA",
                        "EM_ANALISE",
                        "DOCUMENTACAO_PENDENTE",
                        "ELEGIVEL",
                        "INELEGIVEL",
                        "EM_SELECAO",
                        "CLASSIFICADA",
                        "LISTA_ESPERA",
                        "APROVADA",
                        "REPROVADA",
                        "DESISTENTE",
                        "CANCELADA",
                      ].map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {statusTexto(
                              status as StatusCandidatura
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-semibold">
                      {t(
                        "fields.score"
                      )}
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        formProcessar.notaFinal
                      }
                      onChange={(
                        event
                      ) =>
                        setFormProcessar(
                          (
                            atual
                          ) => ({
                            ...atual,
                            notaFinal:
                              event.target.value,
                          })
                        )
                      }
                      className={campo}
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-sm font-semibold">
                      {t(
                        "fields.ranking"
                      )}
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        formProcessar.classificacao
                      }
                      onChange={(
                        event
                      ) =>
                        setFormProcessar(
                          (
                            atual
                          ) => ({
                            ...atual,
                            classificacao:
                              event.target.value,
                          })
                        )
                      }
                      className={campo}
                    />
                  </label>

                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold">
                      {t(
                        "fields.statusReason"
                      )}
                    </span>

                    <textarea
                      rows={5}
                      value={
                        formProcessar.motivoStatus
                      }
                      onChange={(
                        event
                      ) =>
                        setFormProcessar(
                          (
                            atual
                          ) => ({
                            ...atual,
                            motivoStatus:
                              event.target.value,
                          })
                        )
                      }
                      className={campo}
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setModalProcessar(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700"
                  >
                    {t(
                      "actions.cancel"
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      salvando
                    }
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {salvando
                      ? t(
                          "actions.saving"
                        )
                      : t(
                          "actions.save"
                        )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {toast && (
        <div className="fixed right-4 top-20 z-[200] max-w-sm">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl ${
              toast.tipo ===
              "sucesso"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"
            }`}
          >
            {
              toast.mensagem
            }
          </div>
        </div>
      )}
    </main>
  );
}
