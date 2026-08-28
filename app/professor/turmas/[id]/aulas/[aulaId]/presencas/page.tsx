"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslations } from "next-intl";

type AlunoPresencaApi = {
  itemMatriculaId: number;
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  statusAluno?: string | null;
  statusItemMatricula?: string | null;
  presenca?: {
    id: number;
    status: string;
    observacao?: string | null;
  } | null;
};

type RespostaApi = {
  turma: {
    id: number;
    nome: string;
  };
  aula: {
    id: number;
    titulo: string;
  };
  alunos: AlunoPresencaApi[];
};

type StatusPresenca =
  | "PRESENTE"
  | "FALTA"
  | "JUSTIFICADA"
  | "ATESTADO";

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

type RegistroJson = Record<
  string,
  unknown
>;

const STATUS_PRESENCA:
  StatusPresenca[] = [
    "PRESENTE",
    "FALTA",
    "JUSTIFICADA",
    "ATESTADO",
  ];

function isRecord(
  value: unknown
): value is RegistroJson {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function lerJson(
  response: Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mensagemDaApi(
  data: unknown
) {
  if (
    isRecord(data) &&
    typeof data.error ===
      "string" &&
    data.error.trim()
  ) {
    return data.error;
  }

  return "";
}

function numeroPositivo(
  value: unknown
) {
  const numero =
    Number(value);

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function statusPresencaValido(
  value: unknown
): StatusPresenca | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const status =
    value.toUpperCase() as StatusPresenca;

  return STATUS_PRESENCA.includes(
    status
  )
    ? status
    : null;
}

function normalizarAluno(
  value: unknown
): AlunoPresencaApi | null {
  if (!isRecord(value)) {
    return null;
  }

  const alunoId =
    numeroPositivo(
      value.alunoId
    );

  const itemMatriculaId =
    numeroPositivo(
      value.itemMatriculaId
    );

  if (
    !alunoId ||
    !itemMatriculaId
  ) {
    return null;
  }

  const presencaRaw =
    isRecord(
      value.presenca
    )
      ? value.presenca
      : null;

  const presencaId =
    numeroPositivo(
      presencaRaw?.id
    );

  const presencaStatus =
    statusPresencaValido(
      presencaRaw?.status
    );

  return {
    itemMatriculaId,
    alunoId,

    nome:
      typeof value.nome ===
      "string"
        ? value.nome
        : "",

    email:
      typeof value.email ===
      "string"
        ? value.email
        : null,

    matricula:
      typeof value.matricula ===
      "string"
        ? value.matricula
        : null,

    statusAluno:
      typeof value.statusAluno ===
      "string"
        ? value.statusAluno
        : null,

    statusItemMatricula:
      typeof value.statusItemMatricula ===
      "string"
        ? value.statusItemMatricula
        : null,

    presenca:
      presencaId &&
      presencaStatus
        ? {
            id:
              presencaId,

            status:
              presencaStatus,

            observacao:
              typeof presencaRaw
                ?.observacao ===
              "string"
                ? presencaRaw.observacao
                : null,
          }
        : null,
  };
}

function normalizarResposta(
  value: unknown
): RespostaApi | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isRecord(value.turma) ||
    !isRecord(value.aula) ||
    !Array.isArray(
      value.alunos
    )
  ) {
    return null;
  }

  const turmaId =
    numeroPositivo(
      value.turma.id
    );

  const aulaId =
    numeroPositivo(
      value.aula.id
    );

  if (
    !turmaId ||
    !aulaId
  ) {
    return null;
  }

  const alunos =
    value.alunos
      .map(
        normalizarAluno
      )
      .filter(
        (
          item
        ): item is AlunoPresencaApi =>
          Boolean(item)
      );

  return {
    turma: {
      id:
        turmaId,

      nome:
        typeof value.turma
          .nome ===
        "string"
          ? value.turma.nome
          : "",
    },

    aula: {
      id:
        aulaId,

      titulo:
        typeof value.aula
          .titulo ===
        "string"
          ? value.aula.titulo
          : "",
    },

    alunos,
  };
}

export default function PresencasDaAulaPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
      aulaId: string;
    }>();

  const t =
    useTranslations(
      "ProfessorClassAttendance"
    );

  const turmaIdTexto =
    String(
      params?.id || ""
    ).trim();

  const aulaIdTexto =
    String(
      params?.aulaId || ""
    ).trim();

  const turmaId =
    /^\d+$/.test(
      turmaIdTexto
    )
      ? Number(
          turmaIdTexto
        )
      : 0;

  const aulaId =
    /^\d+$/.test(
      aulaIdTexto
    )
      ? Number(
          aulaIdTexto
        )
      : 0;

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    erroCarregamento,
    setErroCarregamento,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] = useState<FeedbackTipo>(
    ""
  );

  const [
    dados,
    setDados,
  ] = useState<RespostaApi | null>(
    null
  );

  const [
    statusPorAluno,
    setStatusPorAluno,
  ] = useState<
    Record<
      number,
      StatusPresenca
    >
  >({});

  const [
    observacaoPorAluno,
    setObservacaoPorAluno,
  ] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setFeedback("");
          setFeedbackTipo("");
        },
        4000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [feedback]);

  function mostrarFeedback(
    tipo: Exclude<
      FeedbackTipo,
      ""
    >,
    mensagem: string
  ) {
    setFeedbackTipo(
      tipo
    );

    setFeedback(
      mensagem
    );
  }

  const carregarDados =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            turmaId
          ) ||
          turmaId <= 0
        ) {
          setDados(null);

          setErroCarregamento(
            t(
              "feedback.invalidClass"
            )
          );

          setLoading(false);
          return;
        }

        if (
          !Number.isInteger(
            aulaId
          ) ||
          aulaId <= 0
        ) {
          setDados(null);

          setErroCarregamento(
            t(
              "feedback.invalidLesson"
            )
          );

          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setErroCarregamento(
            ""
          );

          const res =
            await fetch(
              `/api/professor/turmas/${turmaId}/aulas/${aulaId}/presencas`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const data =
            await lerJson(
              res
            );

          if (!res.ok) {
            throw new Error(
              mensagemDaApi(
                data
              ) ||
                t(
                  "feedback.loadError"
                )
            );
          }

          const normalizada =
            normalizarResposta(
              data
            );

          if (!normalizada) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setDados(
            normalizada
          );

          const novoStatus: Record<
            number,
            StatusPresenca
          > = {};

          const novaObservacao: Record<
            number,
            string
          > = {};

          for (
            const aluno of
            normalizada.alunos
          ) {
            novoStatus[
              aluno.alunoId
            ] =
              statusPresencaValido(
                aluno.presenca
                  ?.status
              ) ??
              "PRESENTE";

            novaObservacao[
              aluno.alunoId
            ] =
              aluno.presenca
                ?.observacao ??
              "";
          }

          setStatusPorAluno(
            novoStatus
          );

          setObservacaoPorAluno(
            novaObservacao
          );
        } catch (
          error: unknown
        ) {
          setDados(null);

          setErroCarregamento(
            error instanceof Error
              ? error.message
              : t(
                  "feedback.loadError"
                )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        aulaId,
        turmaId,
        t,
      ]
    );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  function aplicarStatusEmTodos(
    status: StatusPresenca
  ) {
    if (!dados) {
      return;
    }

    const novoStatus: Record<
      number,
      StatusPresenca
    > = {};

    for (
      const aluno of
      dados.alunos
    ) {
      novoStatus[
        aluno.alunoId
      ] = status;
    }

    setStatusPorAluno(
      (prev) => ({
        ...prev,
        ...novoStatus,
      })
    );
  }

  async function salvarChamada() {
    if (
      !dados ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      setFeedback("");
      setFeedbackTipo("");

      const presencas =
        dados.alunos.map(
          (aluno) => ({
            alunoId:
              aluno.alunoId,

            status:
              statusPorAluno[
                aluno
                  .alunoId
              ] ||
              "PRESENTE",

            observacao:
              observacaoPorAluno[
                aluno
                  .alunoId
              ]?.trim() ||
              "",
          })
        );

      const res =
        await fetch(
          `/api/professor/turmas/${turmaId}/aulas/${aulaId}/presencas`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify(
              {
                presencas,
              }
            ),
          }
        );

      const data =
        await lerJson(
          res
        );

      if (!res.ok) {
        throw new Error(
          mensagemDaApi(
            data
          ) ||
            t(
              "feedback.saveError"
            )
        );
      }

      await carregarDados();

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.saveSuccess"
        )
      );
    } catch (
      error: unknown
    ) {
      mostrarFeedback(
        "erro",
        error instanceof Error
          ? error.message
          : t(
              "feedback.saveError"
            )
      );
    } finally {
      setSaving(false);
    }
  }

  const resumo =
    useMemo(() => {
      const valores =
        Object.values(
          statusPorAluno
        );

      return {
        total:
          valores.length,

        presentes:
          valores.filter(
            (status) =>
              status ===
              "PRESENTE"
          ).length,

        faltas:
          valores.filter(
            (status) =>
              status ===
              "FALTA"
          ).length,

        justificadas:
          valores.filter(
            (status) =>
              status ===
              "JUSTIFICADA"
          ).length,

        atestados:
          valores.filter(
            (status) =>
              status ===
              "ATESTADO"
          ).length,
      };
    }, [statusPorAluno]);

  function labelPresenca(
    status: StatusPresenca
  ) {
    switch (status) {
      case "PRESENTE":
        return t(
          "attendance.present"
        );

      case "FALTA":
        return t(
          "attendance.absent"
        );

      case "JUSTIFICADA":
        return t(
          "attendance.justified"
        );

      case "ATESTADO":
        return t(
          "attendance.medicalCertificate"
        );
    }
  }

  function classeStatusPresenca(
    status: StatusPresenca
  ) {
    switch (status) {
      case "PRESENTE":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";

      case "FALTA":
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";

      case "JUSTIFICADA":
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";

      case "ATESTADO":
        return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
    }
  }

  function labelStatusAluno(
    status?: string | null
  ) {
    switch (status) {
      case "ATIVO":
        return t(
          "studentStatus.active"
        );

      case "TRANCADO":
        return t(
          "studentStatus.locked"
        );

      case "SUSPENSO":
        return t(
          "studentStatus.suspended"
        );

      case "INADIMPLENTE":
        return t(
          "studentStatus.delinquent"
        );

      case "TRANSFERIDO":
        return t(
          "studentStatus.transferred"
        );

      case "DESLIGADO":
        return t(
          "studentStatus.inactive"
        );

      case "FORMADO":
        return t(
          "studentStatus.graduated"
        );

      case "CANCELADO":
        return t(
          "studentStatus.cancelled"
        );

      case "PAUSA_MEDICA":
        return t(
          "studentStatus.medicalLeave"
        );

      case "FALTANTE":
        return t(
          "studentStatus.missing"
        );

      default:
        return t(
          "common.notProvided"
        );
    }
  }

  function labelStatusItem(
    status?: string | null
  ) {
    switch (status) {
      case "A_CURSAR":
        return t(
          "disciplineStatus.toTake"
        );

      case "EM_CURSO":
        return t(
          "disciplineStatus.inProgress"
        );

      case "CONCLUIDO":
        return t(
          "disciplineStatus.completed"
        );

      case "TRANCADO":
        return t(
          "disciplineStatus.locked"
        );

      case "REPROVADO":
        return t(
          "disciplineStatus.failed"
        );

      case "CANCELADO":
        return t(
          "disciplineStatus.cancelled"
        );

      default:
        return t(
          "common.notProvided"
        );
    }
  }

  if (loading) {
    return (
      <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t(
              "actions.back"
            )}
          </button>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950/40">
            <p className="font-black text-red-800 dark:text-red-200">
              {t(
                "errorTitle"
              )}
            </p>

            {erroCarregamento && (
              <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-300">
                {
                  erroCarregamento
                }
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                void carregarDados()
              }
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              {t(
                "actions.retry"
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t(
            "actions.back"
          )}
        </button>

        {feedback && (
          <div
            role="status"
            className={`rounded-2xl border p-4 text-sm font-semibold shadow-sm ${
              feedbackTipo ===
              "sucesso"
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {feedback}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {t("title")}
              </h1>

              <div className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-slate-800 dark:text-slate-100">
                    {t(
                      "fields.class"
                    )}
                    :
                  </strong>{" "}
                  {
                    dados.turma
                      .nome
                  }
                </p>

                <p>
                  <strong className="font-semibold text-slate-800 dark:text-slate-100">
                    {t(
                      "fields.lesson"
                    )}
                    :
                  </strong>{" "}
                  {
                    dados.aula
                      .titulo
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <ResumoCard
                label={t(
                  "summary.total"
                )}
                valor={
                  resumo.total
                }
                classe="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />

              <ResumoCard
                label={t(
                  "summary.present"
                )}
                valor={
                  resumo.presentes
                }
                classe="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              />

              <ResumoCard
                label={t(
                  "summary.absent"
                )}
                valor={
                  resumo.faltas
                }
                classe="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              />

              <ResumoCard
                label={t(
                  "summary.justified"
                )}
                valor={
                  resumo.justificadas
                }
                classe="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              />

              <ResumoCard
                label={t(
                  "summary.medicalCertificates"
                )}
                valor={
                  resumo.atestados
                }
                classe="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {t(
                  "attendanceEntry.title"
                )}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "attendanceEntry.description"
                )}
              </p>
            </div>

            {dados.alunos.length >
              0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    aplicarStatusEmTodos(
                      "PRESENTE"
                    )
                  }
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                >
                  {t(
                    "actions.allPresent"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    aplicarStatusEmTodos(
                      "FALTA"
                    )
                  }
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
                >
                  {t(
                    "actions.allAbsent"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    aplicarStatusEmTodos(
                      "JUSTIFICADA"
                    )
                  }
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
                >
                  {t(
                    "actions.allJustified"
                  )}
                </button>
              </div>
            )}
          </div>

          {dados.alunos.length ===
          0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
              <p className="font-bold text-slate-900 dark:text-white">
                {t(
                  "empty.title"
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "empty.description"
                )}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {dados.alunos.map(
                (aluno) => {
                  const statusAtual =
                    statusPorAluno[
                      aluno
                        .alunoId
                    ] ||
                    "PRESENTE";

                  return (
                    <article
                      key={
                        aluno.alunoId
                      }
                      className="rounded-3xl border border-slate-200 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              {
                                aluno.nome
                              }
                            </h3>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${classeStatusPresenca(
                                statusAtual
                              )}`}
                            >
                              {labelPresenca(
                                statusAtual
                              )}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                            <p>
                              <strong className="font-semibold text-slate-800 dark:text-slate-100">
                                {t(
                                  "fields.enrollment"
                                )}
                                :
                              </strong>{" "}
                              {aluno.matricula ||
                                t(
                                  "common.notProvided"
                                )}
                            </p>

                            <p>
                              <strong className="font-semibold text-slate-800 dark:text-slate-100">
                                {t(
                                  "fields.email"
                                )}
                                :
                              </strong>{" "}
                              {aluno.email ||
                                t(
                                  "common.notProvided"
                                )}
                            </p>

                            <p>
                              <strong className="font-semibold text-slate-800 dark:text-slate-100">
                                {t(
                                  "fields.studentStatus"
                                )}
                                :
                              </strong>{" "}
                              {labelStatusAluno(
                                aluno.statusAluno
                              )}
                            </p>

                            <p>
                              <strong className="font-semibold text-slate-800 dark:text-slate-100">
                                {t(
                                  "fields.disciplineStatus"
                                )}
                                :
                              </strong>{" "}
                              {labelStatusItem(
                                aluno.statusItemMatricula
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="grid w-full gap-4 xl:max-w-xl xl:grid-cols-[220px_1fr]">
                          <div>
                            <label
                              htmlFor={`presenca-${aluno.alunoId}`}
                              className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                            >
                              {t(
                                "fields.attendance"
                              )}
                            </label>

                            <select
                              id={`presenca-${aluno.alunoId}`}
                              value={
                                statusAtual
                              }
                              onChange={(
                                event
                              ) =>
                                setStatusPorAluno(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,
                                    [aluno.alunoId]:
                                      event
                                        .target
                                        .value as StatusPresenca,
                                  })
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="PRESENTE">
                                {t(
                                  "attendance.present"
                                )}
                              </option>

                              <option value="FALTA">
                                {t(
                                  "attendance.absent"
                                )}
                              </option>

                              <option value="JUSTIFICADA">
                                {t(
                                  "attendance.justified"
                                )}
                              </option>

                              <option value="ATESTADO">
                                {t(
                                  "attendance.medicalCertificate"
                                )}
                              </option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`observacao-${aluno.alunoId}`}
                              className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                            >
                              {t(
                                "fields.observation"
                              )}
                            </label>

                            <input
                              id={`observacao-${aluno.alunoId}`}
                              value={
                                observacaoPorAluno[
                                  aluno
                                    .alunoId
                                ] ||
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                setObservacaoPorAluno(
                                  (
                                    prev
                                  ) => ({
                                    ...prev,
                                    [aluno.alunoId]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                              placeholder={t(
                                "placeholders.observation"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={
              salvarChamada
            }
            disabled={
              saving ||
              dados.alunos
                .length === 0
            }
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? t(
                  "actions.saving"
                )
              : t(
                  "actions.save"
                )}
          </button>
        </div>
      </div>
    </main>
  );
}

function ResumoCard({
  label,
  valor,
  classe,
}: {
  label: string;
  valor: number;
  classe: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-center ${classe}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">
        {valor}
      </p>
    </div>
  );
}