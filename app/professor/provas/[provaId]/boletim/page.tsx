"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type AlunoBoletim = {
  tentativaId: number;
  alunoId: number;
  alunoNome: string;
  nota: number;
  finalizada: boolean;
  startedAt?: string;
  finishedAt?: string | null;
  status:
    | "FINALIZADA"
    | "EM_ANDAMENTO";
};

type BoletimProvaResponse = {
  prova: {
    id: number;
    titulo: string;
    notaMaxima: number;
    status: string;
  };
  totalAlunos: number;
  mediaTurma: number;
  alunos: AlunoBoletim[];
};

type FaixaDesempenho =
  | "good"
  | "attention"
  | "low";

export default function BoletimProvaPage() {
  const params = useParams();

  const provaId = String(
    params?.provaId || ""
  );

  const t = useTranslations(
    "ProfessorExamGradebook"
  );

  const locale = useLocale();

  const [
    data,
    setData,
  ] =
    useState<BoletimProvaResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const formatadorNumero =
    useMemo(
      () =>
        new Intl.NumberFormat(
          locale,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }
        ),
      [locale]
    );

  const formatadorData =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          locale,
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ),
      [locale]
    );

  const carregarBoletim =
    useCallback(
      async () => {
        if (!provaId) {
          setData(null);

          setErro(
            t(
              "feedback.loadError"
            )
          );

          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setErro("");

          const res =
            await fetch(
              `/api/professor/provas/${provaId}/boletim`,
              {
                cache:
                  "no-store",
              }
            );

          if (!res.ok) {
            throw new Error(
              t(
                "feedback.loadError"
              )
            );
          }

          const json =
            await res.json();

          if (
            !json ||
            typeof json !==
              "object" ||
            !json.prova ||
            !Array.isArray(
              json.alunos
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setData(
            json as BoletimProvaResponse
          );
        } catch (
          error: unknown
        ) {
          const mensagem =
            error instanceof Error
              ? error.message
              : t(
                  "feedback.loadError"
                );

          setData(null);
          setErro(mensagem);
        } finally {
          setLoading(false);
        }
      },
      [provaId, t]
    );

  useEffect(() => {
    void carregarBoletim();
  }, [carregarBoletim]);

  function formatarData(
    valor?: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const dataConvertida =
      new Date(valor);

    if (
      Number.isNaN(
        dataConvertida.getTime()
      )
    ) {
      return "—";
    }

    return formatadorData.format(
      dataConvertida
    );
  }

  function formatarNumero(
    valor:
      | number
      | null
      | undefined
  ) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "—";
    }

    return formatadorNumero.format(
      valor
    );
  }

  function obterPercentual(
    nota: number
  ) {
    const notaMaxima =
      Number(
        data?.prova
          ?.notaMaxima || 0
      );

    if (
      !Number.isFinite(
        notaMaxima
      ) ||
      notaMaxima <= 0
    ) {
      return 0;
    }

    return (
      Number(nota || 0) /
      notaMaxima
    );
  }

  function obterFaixa(
    nota: number
  ): FaixaDesempenho {
    const percentual =
      obterPercentual(nota);

    if (
      percentual >= 0.7
    ) {
      return "good";
    }

    if (
      percentual >= 0.5
    ) {
      return "attention";
    }

    return "low";
  }

  function getNotaClass(
    nota: number
  ) {
    const faixa =
      obterFaixa(nota);

    if (
      faixa === "good"
    ) {
      return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";
    }

    if (
      faixa ===
      "attention"
    ) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    }

    return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
  }

  function textoFaixa(
    nota: number
  ) {
    const faixa =
      obterFaixa(nota);

    if (
      faixa === "good"
    ) {
      return t(
        "performance.good"
      );
    }

    if (
      faixa ===
      "attention"
    ) {
      return t(
        "performance.attention"
      );
    }

    return t(
      "performance.low"
    );
  }

  function statusTentativa(
    status:
      | "FINALIZADA"
      | "EM_ANDAMENTO"
  ) {
    return status ===
      "FINALIZADA"
      ? t(
          "attemptStatus.finished"
        )
      : t(
          "attemptStatus.inProgress"
        );
  }

  function statusProva(
    status?: string
  ) {
    const valor = String(
      status || ""
    )
      .trim()
      .toUpperCase();

    if (
      valor ===
      "RASCUNHO"
    ) {
      return t(
        "examStatus.draft"
      );
    }

    if (
      valor ===
      "PUBLICADA"
    ) {
      return t(
        "examStatus.published"
      );
    }

    if (
      valor ===
      "ENCERRADA"
    ) {
      return t(
        "examStatus.closed"
      );
    }

    if (
      valor ===
      "CANCELADA"
    ) {
      return t(
        "examStatus.cancelled"
      );
    }

    return (
      status ||
      "—"
    );
  }

  return (
    <div className="phanyx-professor-boletim-prova p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Link
            href={`/professor/provas/${provaId}`}
            className="inline-block text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("back")}
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "description"
            )}
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("loading")}
          </div>
        )}

        {!loading &&
          erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-950/40">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {erro}
              </p>

              <button
                type="button"
                onClick={() =>
                  void carregarBoletim()
                }
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {t(
                  "actions.retry"
                )}
              </button>
            </div>
          )}

        {!loading &&
          !erro &&
          data && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {
                    data.prova
                      .titulo
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "examSummary",
                    {
                      max:
                        formatarNumero(
                          data
                            .prova
                            .notaMaxima
                        ),
                      status:
                        statusProva(
                          data
                            .prova
                            .status
                        ),
                    }
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "summary.students"
                    )}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {
                      data.totalAlunos
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "summary.average"
                    )}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatarNumero(
                      data.mediaTurma
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "summary.performance"
                    )}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {textoFaixa(
                      data.mediaTurma
                    )}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t(
                      "students.title"
                    )}
                  </h2>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "students.description"
                    )}
                  </p>
                </div>

                {data.alunos
                  .length ===
                0 ? (
                  <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "students.empty"
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {data.alunos.map(
                      (
                        aluno
                      ) => (
                        <div
                          key={
                            aluno.tentativaId
                          }
                          className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {
                                aluno.alunoNome
                              }
                            </h3>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                              <span>
                                <strong className="font-medium text-slate-700 dark:text-slate-200">
                                  {t(
                                    "students.status"
                                  )}
                                </strong>{" "}
                                {statusTentativa(
                                  aluno.status
                                )}
                              </span>

                              <span>
                                <strong className="font-medium text-slate-700 dark:text-slate-200">
                                  {t(
                                    "students.finishedAt"
                                  )}
                                </strong>{" "}
                                {formatarData(
                                  aluno.finishedAt
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getNotaClass(
                                aluno.nota
                              )}`}
                            >
                              {t(
                                "students.grade",
                                {
                                  grade:
                                    formatarNumero(
                                      aluno.nota
                                    ),
                                }
                              )}
                            </span>

                            <Link
                              href={`/professor/tentativas/${aluno.tentativaId}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {t(
                                "actions.viewAttempt"
                              )}
                            </Link>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
}