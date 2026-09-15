"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useTranslations,
} from "next-intl";

type Turma = {
  id: number;
  nome: string;
  periodoLetivo?: string | null;
  modalidade?: string | null;

  _count?: {
    disciplinas: number;
  };
};

type Curso = {
  id: number;
  nome: string;

  semestres: Array<{
    id: number;
    numero: number;
    titulo?: string | null;

    _count?: {
      disciplinas: number;
    };
  }>;
};

type Dados = {
  success: boolean;

  matricula: {
    id: number;

    aluno?: {
      nome: string;
      nomeSocial?: string | null;
    } | null;

    polo?: {
      nome: string;
    } | null;

    curso?: {
      nome: string;
    } | null;

    turmaPrincipal?: {
      id: number;
      nome: string;
    } | null;
  };

  opcoes: {
    outrasTurmas: Turma[];
    outrosCursos: Curso[];
  };
};

type Analise = {
  success: boolean;
  podeTransferir: boolean;

  matriculaAtual: {
    turma?: {
      id: number;
      nome: string;
    } | null;
  };

  destino: {
    turma: {
      id: number;
      nome: string;
    };
  };

  analise: {
    quantidadeAtual: number;
    quantidadeCompativel: number;
    quantidadeFaltante: number;
    quantidadeExtraTurma: number;

    compativeis: Array<{
      disciplinaId: number;
      nome: string;
      status: string;
    }>;

    faltantes: Array<{
      disciplinaId: number;
      nome: string;
    }>;
  };
};


type ResultadoTransferencia = {
  transferenciaId: number;

  origem: {
    turmaId: number;
    turmaNome: string;
  };

  destino: {
    turmaId: number;
    turmaNome: string;
  };

  quantidadeMigrada: number;
};

function hojeLocal() {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      agora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}-${dia}`;
}

export default function CursoTurmaTransferencia({
  matriculaId,
}: {
  matriculaId: number;
}) {
  const t =
    useTranslations(
      "AdminTransferenciaMatricula.courseClassTransfer"
    );

  const router =
    useRouter();

  const [
    dados,
    setDados,
  ] =
    useState<Dados | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    turmaSelecionada,
    setTurmaSelecionada,
  ] =
    useState<number | null>(
      null
    );

  const [
    analisando,
    setAnalisando,
  ] =
    useState(false);

  const [
    analise,
    setAnalise,
  ] =
    useState<Analise | null>(
      null
    );

  const [
    erroAnalise,
    setErroAnalise,
  ] =
    useState("");

  const [
    dataTransferencia,
    setDataTransferencia,
  ] =
    useState(
      hojeLocal()
    );

  const [
    motivo,
    setMotivo,
  ] =
    useState("");

  const [
    observacoes,
    setObservacoes,
  ] =
    useState("");

  const [
    confirmando,
    setConfirmando,
  ] =
    useState(false);

  const [
    erroConfirmacao,
    setErroConfirmacao,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState<ResultadoTransferencia | null>(
      null
    );

  useEffect(() => {
    let ativo =
      true;

    async function carregar() {
      try {
        const resposta =
          await fetch(
            `/api/admin/matriculas/${matriculaId}/transferencias/analisar-curso-turma`,
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const json =
          await resposta.json();

        if (
          !resposta.ok ||
          !json?.success
        ) {
          throw new Error(
            "LOAD_ERROR"
          );
        }

        if (ativo) {
          setDados(
            json
          );
        }
      } catch (error) {
        console.error(
          error
        );

        if (ativo) {
          setErro(
            t(
              "errors.load"
            )
          );
        }
      } finally {
        if (ativo) {
          setCarregando(
            false
          );
        }
      }
    }

    void carregar();

    return () => {
      ativo =
        false;
    };
  }, [
    matriculaId,
    t,
  ]);

  async function analisar(
    turmaId: number
  ) {
    try {
      setTurmaSelecionada(
        turmaId
      );

      setAnalise(
        null
      );

      setErroAnalise(
        ""
      );

      setAnalisando(
        true
      );

      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/transferencias/analisar-curso-turma`,
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
                modo:
                  "TURMA",

                turmaDestinoId:
                  turmaId,
              }),
          }
        );

      const json =
        await resposta.json();

      if (
        !resposta.ok ||
        !json?.success
      ) {
        throw new Error(
          json?.error ||
          "ANALYSIS_ERROR"
        );
      }

      setAnalise(
        json
      );

      setTimeout(
        () => {
          document
            .getElementById(
              "revisao-turma"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
            });
        },
        100
      );
    } catch (error) {
      console.error(
        error
      );

      setErroAnalise(
        t(
          "errors.analysis"
        )
      );
    } finally {
      setAnalisando(
        false
      );
    }
  }

  async function confirmarTransferencia() {
    if (
      !analise ||
      !analise.podeTransferir ||
      !turmaSelecionada
    ) {
      return;
    }

    if (!dataTransferencia) {
      setErroConfirmacao(
        t(
          "errors.dateRequired"
        )
      );

      return;
    }

    if (
      motivo.trim().length <
      3
    ) {
      setErroConfirmacao(
        t(
          "errors.reasonRequired"
        )
      );

      return;
    }

    try {
      setConfirmando(
        true
      );

      setErroConfirmacao(
        ""
      );

      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/transferencias/trocar-turma`,
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
                turmaDestinoId:
                  turmaSelecionada,

                dataTransferencia,

                motivo:
                  motivo.trim(),

                observacoes:
                  observacoes
                    .trim(),
              }),
          }
        );

      const json =
        await resposta
          .json()
          .catch(
            () => null
          );

      if (
        !resposta.ok ||
        !json?.success ||
        !json?.resultado
      ) {
        console.error(
          "Falha transferencia:",
          json
        );

        setErroConfirmacao(
          json?.error ||
          t(
            "errors.confirm"
          )
        );

        return;
      }

      setSucesso(
        json.resultado
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Erro ao confirmar transferencia:",
        error
      );

      setErroConfirmacao(
        t(
          "errors.confirm"
        )
      );
    } finally {
      setConfirmando(
        false
      );
    }
  }

  if (carregando) {
    return (
      <div className="p-6 text-slate-600 dark:text-neutral-300">
        {t(
          "loading"
        )}
      </div>
    );
  }

  if (
    erro ||
    !dados
  ) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          {erro ||
            t(
              "errors.load"
            )}
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/20">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {t(
              "success.badge"
            )}
          </div>

          <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
            {t(
              "success.title"
            )}
          </h1>

          <p className="mt-2 text-sm text-slate-700 dark:text-neutral-300">
            {t(
              "success.description"
            )}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info
              label={t(
                "success.transferNumber"
              )}
              value={
                `#${sucesso.transferenciaId}`
              }
            />

            <Info
              label={t(
                "success.migratedSubjects"
              )}
              value={
                String(
                  sucesso.quantidadeMigrada
                )
              }
            />

            <Info
              label={t(
                "success.origin"
              )}
              value={
                sucesso.origem
                  .turmaNome
              }
            />

            <Info
              label={t(
                "success.destination"
              )}
              value={
                sucesso.destino
                  .turmaNome
              }
            />
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matriculas"
              )
            }
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            {t(
              "success.backToEnrollments"
            )}
          </button>
        </div>
      </div>
    );
  }

  const {
    matricula,
    opcoes,
  } =
    dados;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <button
        type="button"
        onClick={() =>
          router.push(
            `/admin/matriculas/${matriculaId}/transferir`
          )
        }
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      >
        {"<- "}
        {t(
          "back"
        )}
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {t(
            "title"
          )}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
          {t(
            "description"
          )}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">
          {t(
            "currentEnrollment"
          )}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label={t(
              "student"
            )}
            value={
              matricula.aluno
                ?.nomeSocial ||
              matricula.aluno
                ?.nome ||
              "-"
            }
          />

          <Info
            label={t(
              "currentCampus"
            )}
            value={
              matricula.polo
                ?.nome ||
              "-"
            }
          />

          <Info
            label={t(
              "currentCourse"
            )}
            value={
              matricula.curso
                ?.nome ||
              "-"
            }
          />

          <Info
            label={t(
              "currentClass"
            )}
            value={
              matricula
                .turmaPrincipal
                ?.nome ||
              "-"
            }
          />
        </div>
      </section>

      <div>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          {t(
            "whatChange"
          )}
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
          {t(
            "whatChangeHelp"
          )}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              {t(
                "classOnly.title"
              )}
            </h3>

            <Status
              disponivel={
                opcoes
                  .outrasTurmas
                  .length >
                0
              }
              t={t}
            />
          </div>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {t(
              "classOnly.description"
            )}
          </p>

          {opcoes
            .outrasTurmas
            .length ===
          0 ? (
            <Aviso
              titulo={t(
                "classOnly.emptyTitle"
              )}
              texto={t(
                "classOnly.emptyDescription"
              )}
            />
          ) : (
            <div className="mt-5 space-y-3">
              {opcoes
                .outrasTurmas
                .map(
                  (
                    turma
                  ) => (
                    <button
                      key={
                        turma.id
                      }
                      type="button"
                      disabled={
                        analisando
                      }
                      onClick={() =>
                        void analisar(
                          turma.id
                        )
                      }
                      className={[
                        "w-full rounded-xl border p-4 text-left transition",

                        turmaSelecionada ===
                        turma.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/20 dark:ring-blue-950"
                          : "border-slate-200 bg-slate-50 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-900",
                      ].join(
                        " "
                      )}
                    >
                      <div className="font-bold text-slate-950 dark:text-white">
                        {
                          turma.nome
                        }
                      </div>

                      <div className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                        {turma.periodoLetivo ||
                          "-"}
                        {" · "}
                        {turma.modalidade ||
                          "-"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                        {t(
                          "subjectCount",
                          {
                            count:
                              turma
                                ._count
                                ?.disciplinas ??
                              0,
                          }
                        )}
                      </div>
                    </button>
                  )
                )}

              {analisando && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
                  {t(
                    "classOnly.analyzing"
                  )}
                </div>
              )}

              {erroAnalise && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                  {
                    erroAnalise
                  }
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              {t(
                "courseAndClass.title"
              )}
            </h3>

            <Status
              disponivel={
                opcoes
                  .outrosCursos
                  .length >
                0
              }
              t={t}
            />
          </div>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {t(
              "courseAndClass.description"
            )}
          </p>

          {opcoes
            .outrosCursos
            .length ===
          0 ? (
            <Aviso
              titulo={t(
                "courseAndClass.emptyTitle"
              )}
              texto={t(
                "courseAndClass.emptyDescription"
              )}
            />
          ) : (
            <div className="mt-5 space-y-3">
              {opcoes
                .outrosCursos
                .map(
                  (
                    curso
                  ) => (
                    <div
                      key={
                        curso.id
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <div className="font-bold text-slate-950 dark:text-white">
                        {
                          curso.nome
                        }
                      </div>

                      <div className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                        {t(
                          "courseAndClass.analysisRequired"
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          )}
        </section>
      </div>

      {analise && (
        <section
          id="revisao-turma"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <div className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            {t(
              "review.step"
            )}
          </div>

          <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
            {t(
              "review.title"
            )}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info
              label={t(
                "review.originClass"
              )}
              value={
                analise
                  .matriculaAtual
                  .turma
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "review.destinationClass"
              )}
              value={
                analise
                  .destino
                  .turma
                  .nome
              }
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label={t(
                "review.currentSubjects"
              )}
              value={
                analise
                  .analise
                  .quantidadeAtual
              }
            />

            <Metric
              label={t(
                "review.compatibleSubjects"
              )}
              value={
                analise
                  .analise
                  .quantidadeCompativel
              }
            />

            <Metric
              label={t(
                "review.missingSubjects"
              )}
              value={
                analise
                  .analise
                  .quantidadeFaltante
              }
            />

            <Metric
              label={t(
                "review.extraSubjects"
              )}
              value={
                analise
                  .analise
                  .quantidadeExtraTurma
              }
            />
          </div>

          <div
            className={[
              "mt-5 rounded-xl border p-4 text-sm",

              analise.podeTransferir
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200"
                : "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200",
            ].join(
              " "
            )}
          >
            <div className="font-bold">
              {analise.podeTransferir
                ? t(
                    "review.compatibleTitle"
                  )
                : t(
                    "review.incompatibleTitle"
                  )}
            </div>

            <div className="mt-1">
              {analise.podeTransferir
                ? t(
                    "review.compatibleDescription"
                  )
                : t(
                    "review.incompatibleDescription"
                  )}
            </div>
          </div>

          {analise.podeTransferir && (
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
                {t(
                  "review.validationNotice"
                )}
              </div>

              <div className="border-t border-slate-200 pt-5 dark:border-neutral-700">
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                  {t(
                    "form.title"
                  )}
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
                  {t(
                    "form.description"
                  )}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                    {t(
                      "form.transferDate"
                    )}
                  </span>

                  <input
                    type="date"
                    value={
                      dataTransferencia
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setDataTransferencia(
                          event.target.value
                        )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                    {t(
                      "form.reason"
                    )}
                  </span>

                  <input
                    type="text"
                    value={
                      motivo
                    }
                    maxLength={
                      500
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setMotivo(
                          event.target.value
                        )
                    }
                    placeholder={t(
                      "form.reasonPlaceholder"
                    )}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                  {t(
                    "form.observations"
                  )}
                </span>

                <textarea
                  rows={
                    4
                  }
                  value={
                    observacoes
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setObservacoes(
                        event.target.value
                      )
                  }
                  placeholder={t(
                    "form.observationsPlaceholder"
                  )}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                />
              </label>

              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                {t(
                  "form.auditNotice"
                )}
              </div>

              {erroConfirmacao && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                  {
                    erroConfirmacao
                  }
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    confirmando
                  }
                  onClick={() => {
                    setAnalise(
                      null
                    );

                    setTurmaSelecionada(
                      null
                    );

                    setErroConfirmacao(
                      ""
                    );
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  {t(
                    "form.cancel"
                  )}
                </button>

                <button
                  type="button"
                  disabled={
                    confirmando ||
                    !dataTransferencia ||
                    motivo.trim().length < 3
                  }
                  onClick={
                    () =>
                      void confirmarTransferencia()
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-neutral-700"
                >
                  {confirmando
                    ? t(
                        "form.confirming"
                      )
                    : t(
                        "form.confirm"
                      )}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        {t(
          "otherCampusNotice"
        )}
      </div>
    </div>
  );
}

function Status({
  disponivel,
  t,
}: {
  disponivel: boolean;
  t: any;
}) {
  return (
    <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
      {disponivel
        ? t(
            "available"
          )
        : t(
            "unavailable"
          )}
    </span>
  );
}

function Aviso({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
      <div className="font-bold">
        {titulo}
      </div>

      <div className="mt-1">
        {texto}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
        {label}
      </div>

      <div className="mt-1 font-medium text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-neutral-700 dark:bg-neutral-900">
      <div className="text-2xl font-bold text-slate-950 dark:text-white">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
        {label}
      </div>
    </div>
  );
}