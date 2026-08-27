"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Alternativa = {
  id: number;
  texto: string;
  correta?: boolean;
};

type Questao = {
  id: number;
  enunciado: string;
  pergunta?: string;
  tipo:
    | "MULTIPLA_ESCOLHA"
    | "DISCURSIVA";
  valor: number;
};

type Resposta = {
  id: number;
  respostaTexto?: string | null;
  nota?: number | null;
  feedback?: string | null;
  questao: Questao;
  alternativa?: Alternativa | null;
};

type Aluno = {
  id: number;
  nome?: string;
};

type Prova = {
  id: number;
  titulo: string;
};

type Tentativa = {
  id: number;
  notaFinal?: number | null;
  finalizada: boolean;
  startedAt: string;
  finishedAt?: string | null;
  aluno: Aluno;
  prova: Prova;
  nome?: string | null;
  respostas: Resposta[];
};

type EstadoCorrecao = {
  respostaId: number;
  nota: string;
  feedback: string;
};

export default function TentativaPage() {
  const params = useParams();
  const router = useRouter();

  const tentativaId = String(
    params?.tentativaId || ""
  );

  const t = useTranslations(
    "ProfessorAttemptDetail"
  );

  const locale = useLocale();

  const [
    tentativa,
    setTentativa,
  ] = useState<Tentativa | null>(
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

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    correcoes,
    setCorrecoes,
  ] = useState<
    EstadoCorrecao[]
  >([]);

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

  const carregarTentativa =
    useCallback(
      async () => {
        if (!tentativaId) {
          setTentativa(null);
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
              `/api/professor/tentativas/${tentativaId}`,
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

          const data =
            await res.json();

          if (
            !data ||
            typeof data !==
              "object" ||
            !Array.isArray(
              data.respostas
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          const tentativaRecebida =
            data as Tentativa;

          setTentativa(
            tentativaRecebida
          );

          const discursivas =
            (
              tentativaRecebida.respostas ||
              []
            )
              .filter(
                (
                  resposta
                ) =>
                  resposta
                    .questao
                    ?.tipo ===
                  "DISCURSIVA"
              )
              .map(
                (
                  resposta
                ) => ({
                  respostaId:
                    resposta.id,

                  nota:
                    resposta.nota !==
                      null &&
                    resposta.nota !==
                      undefined
                      ? String(
                          resposta.nota
                        )
                      : "",

                  feedback:
                    resposta.feedback ||
                    "",
                })
              );

          setCorrecoes(
            discursivas
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

          setTentativa(null);
          setErro(mensagem);
        } finally {
          setLoading(false);
        }
      },
      [tentativaId, t]
    );

  useEffect(() => {
    void carregarTentativa();
  }, [carregarTentativa]);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSucesso("");
      }, 3500);

    return () =>
      clearTimeout(timer);
  }, [sucesso]);

  const respostasDiscursivas =
    useMemo(() => {
      return (
        tentativa?.respostas ||
        []
      ).filter(
        (resposta) =>
          resposta.questao
            ?.tipo ===
          "DISCURSIVA"
      );
    }, [tentativa]);

  const totalQuestoes =
    tentativa?.respostas
      ?.length || 0;

  const totalDiscursivas =
    useMemo(() => {
      return (
        tentativa?.respostas ||
        []
      ).filter(
        (resposta) =>
          resposta.questao
            ?.tipo ===
          "DISCURSIVA"
      ).length;
    }, [tentativa]);

  const totalObjetivas =
    useMemo(() => {
      return (
        tentativa?.respostas ||
        []
      ).filter(
        (resposta) =>
          resposta.questao
            ?.tipo ===
          "MULTIPLA_ESCOLHA"
      ).length;
    }, [tentativa]);

  function atualizarCorrecao(
    respostaId: number,
    campo:
      | "nota"
      | "feedback",
    valor: string
  ) {
    setCorrecoes(
      (anteriores) =>
        anteriores.map(
          (item) =>
            item.respostaId ===
            respostaId
              ? {
                  ...item,
                  [campo]:
                    valor,
                }
              : item
        )
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

  function formatarData(
    data?: string | null
  ) {
    if (!data) {
      return "—";
    }

    const dataConvertida =
      new Date(data);

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

  function nomeAluno() {
    const nome =
      tentativa?.aluno?.nome?.trim();

    if (nome) {
      return nome;
    }

    if (
      tentativa?.aluno?.id !==
      undefined
    ) {
      return t(
        "studentFallback",
        {
          id:
            tentativa.aluno.id,
        }
      );
    }

    return t(
      "studentUnknown"
    );
  }

  async function enviarCorrecao(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    for (const resposta of respostasDiscursivas) {
      const correcao =
        correcoes.find(
          (item) =>
            item.respostaId ===
            resposta.id
        );

      if (
        !correcao ||
        correcao.nota.trim() ===
          ""
      ) {
        setErro(
          t(
            "validation.gradeRequired",
            {
              number:
                respostasDiscursivas.findIndex(
                  (item) =>
                    item.id ===
                    resposta.id
                ) + 1,
            }
          )
        );

        return;
      }

      const notaNumerica =
        Number(
          correcao.nota
        );

      if (
        !Number.isFinite(
          notaNumerica
        ) ||
        notaNumerica < 0 ||
        notaNumerica >
          resposta.questao.valor
      ) {
        setErro(
          t(
            "validation.invalidGrade",
            {
              max:
                formatarNumero(
                  resposta
                    .questao
                    .valor
                ),
            }
          )
        );

        return;
      }
    }

    try {
      setSalvando(true);

      const payload = {
        respostas:
          correcoes.map(
            (item) => ({
              respostaId:
                item.respostaId,

              nota: Number(
                item.nota
              ),

              feedback:
                item.feedback.trim(),
            })
          ),
      };

      const res =
        await fetch(
          `/api/professor/tentativas/${tentativaId}/corrigir-discursivas`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.saveError"
          )
        );
      }

      setSucesso(
        t(
          "feedback.saveSuccess"
        )
      );

      await carregarTentativa();
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.saveError"
            );

      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("loading")}
      </div>
    );
  }

  if (
    erro &&
    !tentativa
  ) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-red-600 dark:text-red-300">
          {erro}
        </div>

        <button
          type="button"
          onClick={() =>
            void carregarTentativa()
          }
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t(
            "actions.retry"
          )}
        </button>
      </div>
    );
  }

  if (!tentativa) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("notFound")}
      </div>
    );
  }

  return (
    <div className="phanyx-professor-detalhe-tentativa p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {sucesso && (
          <div
            aria-live="polite"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
          >
            {sucesso}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("back")}
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t(
                  "title",
                  {
                    id:
                      tentativa.id,
                  }
                )}
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "exam",
                  {
                    title:
                      tentativa
                        .prova
                        ?.titulo ||
                      "—",
                  }
                )}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                tentativa.finalizada
                  ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              {tentativa.finalizada
                ? t(
                    "status.finished"
                  )
                : t(
                    "status.inProgress"
                  )}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "summary.student"
              )}
            </p>

            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {nomeAluno()}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "summary.currentGrade"
              )}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatarNumero(
                tentativa.notaFinal
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "summary.answers"
              )}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalQuestoes}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "summary.objective"
              )}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalObjetivas}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "summary.discursive"
              )}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalDiscursivas}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "dates.startedAt"
              )}
            </p>

            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {formatarData(
                tentativa.startedAt
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(
                "dates.finishedAt"
              )}
            </p>

            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {formatarData(
                tentativa.finishedAt
              )}
            </p>
          </div>
        </div>

        {erro && (
          <div
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          >
            {erro}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t(
                "answers.title"
              )}
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t(
                "answers.description"
              )}
            </p>
          </div>

          {tentativa.respostas.length ===
          0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {t(
                "answers.empty"
              )}
            </div>
          ) : (
            tentativa.respostas.map(
              (
                resposta,
                index
              ) => (
                <div
                  key={
                    resposta.id
                  }
                  className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {t(
                            "answers.questionNumber",
                            {
                              number:
                                index +
                                1,
                            }
                          )}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            resposta
                              .questao
                              .tipo ===
                            "DISCURSIVA"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          }`}
                        >
                          {resposta
                            .questao
                            .tipo ===
                          "DISCURSIVA"
                            ? t(
                                "questionTypes.discursive"
                              )
                            : t(
                                "questionTypes.multipleChoice"
                              )}
                        </span>

                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                          {t(
                            "answers.value",
                            {
                              value:
                                formatarNumero(
                                  resposta
                                    .questao
                                    .valor
                                ),
                            }
                          )}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {
                          resposta
                            .questao
                            .enunciado
                        }
                      </h3>

                      {resposta
                        .questao
                        .pergunta && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {
                            resposta
                              .questao
                              .pergunta
                          }
                        </p>
                      )}
                    </div>

                    {resposta
                      .questao
                      .tipo ===
                      "DISCURSIVA" && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {t(
                          "answers.currentGrade"
                        )}{" "}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatarNumero(
                            resposta.nota
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {resposta
                    .questao
                    .tipo ===
                    "MULTIPLA_ESCOLHA" && (
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t(
                          "answers.selectedAlternative"
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                        {resposta
                          .alternativa
                          ?.texto ||
                          t(
                            "answers.noAlternative"
                          )}
                      </p>
                    </div>
                  )}

                  {resposta
                    .questao
                    .tipo ===
                    "DISCURSIVA" && (
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t(
                          "answers.studentAnswer"
                        )}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                        {resposta.respostaTexto ||
                          t(
                            "answers.noAnswer"
                          )}
                      </p>
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>

        {respostasDiscursivas.length >
          0 && (
          <form
            onSubmit={
              enviarCorrecao
            }
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t(
                  "grading.title"
                )}
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "grading.description"
                )}
              </p>
            </div>

            {respostasDiscursivas.map(
              (
                resposta,
                index
              ) => {
                const correcao =
                  correcoes.find(
                    (item) =>
                      item.respostaId ===
                      resposta.id
                  );

                return (
                  <div
                    key={
                      resposta.id
                    }
                    className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t(
                          "grading.discursiveNumber",
                          {
                            number:
                              index +
                              1,
                          }
                        )}
                      </p>

                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        {
                          resposta
                            .questao
                            .enunciado
                        }
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "grading.maximumValue",
                          {
                            value:
                              formatarNumero(
                                resposta
                                  .questao
                                  .valor
                              ),
                          }
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {t(
                          "answers.studentAnswer"
                        )}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                        {resposta.respostaTexto ||
                          t(
                            "answers.noAnswer"
                          )}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label
                          htmlFor={`nota-${resposta.id}`}
                          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                          {t(
                            "grading.grade"
                          )}
                        </label>

                        <input
                          id={`nota-${resposta.id}`}
                          type="number"
                          min="0"
                          max={
                            resposta
                              .questao
                              .valor
                          }
                          step="0.1"
                          value={
                            correcao?.nota ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            atualizarCorrecao(
                              resposta.id,
                              "nota",
                              e
                                .target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                          placeholder={t(
                            "grading.maximumPlaceholder",
                            {
                              value:
                                formatarNumero(
                                  resposta
                                    .questao
                                    .valor
                                ),
                            }
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`feedback-${resposta.id}`}
                          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                          {t(
                            "grading.feedback"
                          )}
                        </label>

                        <input
                          id={`feedback-${resposta.id}`}
                          type="text"
                          value={
                            correcao?.feedback ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            atualizarCorrecao(
                              resposta.id,
                              "feedback",
                              e
                                .target
                                .value
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                          placeholder={t(
                            "grading.feedbackPlaceholder"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  salvando
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
}