"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfessor } from "@/app/context/ProfessorContext";

type PerguntaProva = {
  id: string;
  enunciado: string;
  alternativas: string[];
  correta: number;
};

type FeedbackTipo =
  | "erro"
  | "sucesso"
  | "";

export default function ProvaProfessorPage() {
  const router = useRouter();
  const params = useParams();

  const t = useTranslations(
    "ProfessorDisciplineExam"
  );

  const disciplinaId = String(
    params?.id || ""
  );

  const {
    disciplinas,
    salvarProva,
  } = useProfessor();

  const disciplina =
    disciplinas.find(
      (item) =>
        String(item.id) ===
        disciplinaId
    );

  const [
    perguntas,
    setPerguntas,
  ] = useState<PerguntaProva[]>(
    []
  );

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] =
    useState<FeedbackTipo>("");

  useEffect(() => {
    if (!disciplina) {
      return;
    }

    const perguntasExistentes =
      Array.isArray(
        disciplina.prova?.perguntas
      )
        ? disciplina.prova.perguntas
        : [];

    setPerguntas(
      perguntasExistentes.map(
        (pergunta) => ({
          id: String(
            pergunta.id
          ),

          enunciado:
            pergunta.enunciado ||
            "",

          alternativas:
            Array.isArray(
              pergunta.alternativas
            )
              ? [
                  ...pergunta.alternativas,
                ]
              : [
                  "",
                  "",
                  "",
                  "",
                ],

          correta:
            typeof pergunta.correta ===
            "number"
              ? pergunta.correta
              : 0,
        })
      )
    );
  }, [
    disciplina?.id,
    disciplina?.prova?.perguntas,
  ]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer =
      setTimeout(() => {
        setFeedback("");
        setFeedbackTipo("");
      }, 3500);

    return () =>
      clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(
    tipo: Exclude<
      FeedbackTipo,
      ""
    >,
    mensagem: string
  ) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  function adicionarPergunta() {
    setPerguntas(
      (anteriores) => [
        ...anteriores,
        {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          enunciado: "",
          alternativas: [
            "",
            "",
            "",
            "",
          ],
          correta: 0,
        },
      ]
    );
  }

  function removerPergunta(
    perguntaId: string
  ) {
    setPerguntas(
      (anteriores) =>
        anteriores.filter(
          (pergunta) =>
            pergunta.id !==
            perguntaId
        )
    );
  }

  function atualizarEnunciado(
    index: number,
    valor: string
  ) {
    setPerguntas(
      (anteriores) =>
        anteriores.map(
          (
            pergunta,
            perguntaIndex
          ) =>
            perguntaIndex ===
            index
              ? {
                  ...pergunta,
                  enunciado:
                    valor,
                }
              : pergunta
        )
    );
  }

  function atualizarCorreta(
    index: number,
    alternativaIndex: number
  ) {
    setPerguntas(
      (anteriores) =>
        anteriores.map(
          (
            pergunta,
            perguntaIndex
          ) =>
            perguntaIndex ===
            index
              ? {
                  ...pergunta,
                  correta:
                    alternativaIndex,
                }
              : pergunta
        )
    );
  }

  function atualizarAlternativa(
    perguntaIndex: number,
    alternativaIndex: number,
    valor: string
  ) {
    setPerguntas(
      (anteriores) =>
        anteriores.map(
          (
            pergunta,
            index
          ) => {
            if (
              index !==
              perguntaIndex
            ) {
              return pergunta;
            }

            const alternativas =
              [
                ...pergunta.alternativas,
              ];

            alternativas[
              alternativaIndex
            ] = valor;

            return {
              ...pergunta,
              alternativas,
            };
          }
        )
    );
  }

  function validarProva() {
    if (
      perguntas.length === 0
    ) {
      return t(
        "validation.questionRequired"
      );
    }

    for (
      let index = 0;
      index <
      perguntas.length;
      index += 1
    ) {
      const pergunta =
        perguntas[index];

      if (
        !pergunta.enunciado.trim()
      ) {
        return t(
          "validation.statementRequired",
          {
            number:
              index + 1,
          }
        );
      }

      if (
        pergunta.alternativas
          .length < 2
      ) {
        return t(
          "validation.alternativesRequired",
          {
            number:
              index + 1,
          }
        );
      }

      const possuiAlternativaVazia =
        pergunta.alternativas.some(
          (alternativa) =>
            !alternativa.trim()
        );

      if (
        possuiAlternativaVazia
      ) {
        return t(
          "validation.emptyAlternative",
          {
            number:
              index + 1,
          }
        );
      }

      if (
        !Number.isInteger(
          pergunta.correta
        ) ||
        pergunta.correta <
          0 ||
        pergunta.correta >=
          pergunta.alternativas
            .length
      ) {
        return t(
          "validation.correctAlternativeRequired",
          {
            number:
              index + 1,
          }
        );
      }
    }

    return "";
  }

  function salvar() {
    if (salvando) {
      return;
    }

    setFeedback("");
    setFeedbackTipo("");

    const erroValidacao =
      validarProva();

    if (erroValidacao) {
      mostrarFeedback(
        "erro",
        erroValidacao
      );
      return;
    }

    try {
      setSalvando(true);

      const perguntasNormalizadas =
        perguntas.map(
          (pergunta) => ({
            ...pergunta,

            enunciado:
              pergunta.enunciado.trim(),

            alternativas:
              pergunta.alternativas.map(
                (alternativa) =>
                  alternativa.trim()
              ),
          })
        );

      salvarProva(
        disciplinaId,
        perguntasNormalizadas
      );

      router.push(
        `/professor/disciplinas/${disciplinaId}`
      );
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.saveError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );

      setSalvando(false);
    }
  }

  if (!disciplina) {
    return (
      <div className="max-w-4xl text-slate-900 dark:text-slate-100">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-950">
            📝
          </div>

          <p className="mt-4 font-bold text-slate-900 dark:text-white">
            {t(
              "notFound.title"
            )}
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "notFound.description"
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {t(
              "actions.back"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 text-slate-900 dark:text-slate-100">
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-400">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
          {t(
            "title",
            {
              discipline:
                disciplina.nome,
            }
          )}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {t(
            "description"
          )}
        </p>
      </section>

      {feedback && (
        <div
          aria-live={
            feedbackTipo ===
            "erro"
              ? "assertive"
              : "polite"
          }
          className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
            feedbackTipo ===
            "sucesso"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {feedback}
        </div>
      )}

      {perguntas.length ===
      0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-950">
            ❓
          </div>

          <p className="mt-4 font-bold text-slate-900 dark:text-white">
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
        <div className="space-y-4">
          {perguntas.map(
            (
              pergunta,
              perguntaIndex
            ) => (
              <section
                key={
                  pergunta.id
                }
                className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-400">
                      {t(
                        "question.number",
                        {
                          number:
                            perguntaIndex +
                            1,
                        }
                      )}
                    </p>

                    <h2 className="mt-1 font-bold text-slate-900 dark:text-white">
                      {t(
                        "question.title"
                      )}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removerPergunta(
                        pergunta.id
                      )
                    }
                    className="w-fit rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
                  >
                    {t(
                      "actions.removeQuestion"
                    )}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor={`pergunta-${pergunta.id}`}
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.statement"
                    )}
                  </label>

                  <textarea
                    id={`pergunta-${pergunta.id}`}
                    value={
                      pergunta.enunciado
                    }
                    onChange={(
                      event
                    ) =>
                      atualizarEnunciado(
                        perguntaIndex,
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder={t(
                      "fields.statementPlaceholder"
                    )}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.alternatives"
                    )}
                  </p>

                  {pergunta.alternativas.map(
                    (
                      alternativa,
                      alternativaIndex
                    ) => (
                      <div
                        key={
                          alternativaIndex
                        }
                        className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                          pergunta.correta ===
                          alternativaIndex
                            ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                            : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                        }`}
                      >
                        <input
                          id={`correta-${pergunta.id}-${alternativaIndex}`}
                          type="radio"
                          name={`correta-${pergunta.id}`}
                          checked={
                            pergunta.correta ===
                            alternativaIndex
                          }
                          onChange={() =>
                            atualizarCorreta(
                              perguntaIndex,
                              alternativaIndex
                            )
                          }
                          className="h-4 w-4 shrink-0 accent-green-600"
                          aria-label={t(
                            "question.markCorrect",
                            {
                              number:
                                alternativaIndex +
                                1,
                            }
                          )}
                        />

                        <label
                          htmlFor={`alternativa-${pergunta.id}-${alternativaIndex}`}
                          className="sr-only"
                        >
                          {t(
                            "question.alternative",
                            {
                              number:
                                alternativaIndex +
                                1,
                            }
                          )}
                        </label>

                        <input
                          id={`alternativa-${pergunta.id}-${alternativaIndex}`}
                          value={
                            alternativa
                          }
                          onChange={(
                            event
                          ) =>
                            atualizarAlternativa(
                              perguntaIndex,
                              alternativaIndex,
                              event.target.value
                            )
                          }
                          placeholder={t(
                            "question.alternative",
                            {
                              number:
                                alternativaIndex +
                                1,
                            }
                          )}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                        />

                        {pergunta.correta ===
                          alternativaIndex && (
                          <span className="hidden shrink-0 text-xs font-bold text-green-700 dark:text-green-300 sm:inline">
                            {t(
                              "question.correct"
                            )}
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={
            adicionarPergunta
          }
          disabled={
            salvando
          }
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t(
            "actions.addQuestion"
          )}
        </button>

        <button
          type="button"
          onClick={salvar}
          disabled={
            salvando
          }
          className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}