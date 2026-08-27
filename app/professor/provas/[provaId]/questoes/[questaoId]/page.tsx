"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslations } from "next-intl";

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
  ordem?: number;
};

type TipoQuestao =
  | "MULTIPLA_ESCOLHA"
  | "DISCURSIVA";

type Questao = {
  id: number;
  enunciado: string;
  pergunta?: string;
  tipo:
    | TipoQuestao
    | "multipla_escolha"
    | "discursiva";
  valor: number;
  ordem: number;
  alternativas?: Alternativa[];
};

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

function normalizarTipoQuestao(
  valor:
    | Questao["tipo"]
    | string
    | null
    | undefined
): TipoQuestao {
  const normalizado = String(
    valor || ""
  )
    .trim()
    .toUpperCase();

  if (
    normalizado ===
      "MULTIPLA_ESCOLHA" ||
    normalizado ===
      "MULTIPLA ESCOLHA"
  ) {
    return "MULTIPLA_ESCOLHA";
  }

  return "DISCURSIVA";
}

export default function QuestaoPage() {
  const params = useParams();
  const router = useRouter();

  const t = useTranslations(
    "ProfessorEditQuestion"
  );

  const provaId = String(
    params?.provaId || ""
  );

  const questaoId = String(
    params?.questaoId || ""
  );

  const [
    questao,
    setQuestao,
  ] = useState<Questao | null>(
    null
  );

  const [
    enunciado,
    setEnunciado,
  ] = useState("");

  const [
    pergunta,
    setPergunta,
  ] = useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoQuestao>(
      "MULTIPLA_ESCOLHA"
    );

  const [
    valor,
    setValor,
  ] = useState("1");

  const [
    novaAlternativa,
    setNovaAlternativa,
  ] = useState("");

  const [
    novaAlternativaCorreta,
    setNovaAlternativaCorreta,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    salvandoAlternativa,
    setSalvandoAlternativa,
  ] = useState(false);

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] =
    useState<FeedbackTipo>(
      ""
    );

  const [
    modalExcluirAberto,
    setModalExcluirAberto,
  ] = useState(false);

  const [
    erroAlternativa,
    setErroAlternativa,
  ] = useState("");

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
    tipoFeedback: Exclude<
      FeedbackTipo,
      ""
    >,
    mensagem: string
  ) {
    setFeedbackTipo(
      tipoFeedback
    );

    setFeedback(mensagem);
  }

  async function carregarQuestao() {
    if (
      !provaId ||
      !questaoId
    ) {
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

      const resProva =
        await fetch(
          `/api/professor/provas/${provaId}`,
          {
            cache: "no-store",
          }
        );

      if (!resProva.ok) {
        throw new Error(
          t(
            "feedback.examLoadError"
          )
        );
      }

      const prova =
        await resProva.json();

      const questaoEncontrada:
        | Questao
        | undefined =
        Array.isArray(
          prova?.questoes
        )
          ? prova.questoes.find(
              (
                item: Questao
              ) =>
                String(
                  item.id
                ) ===
                String(
                  questaoId
                )
            )
          : undefined;

      if (
        !questaoEncontrada
      ) {
        throw new Error(
          t(
            "feedback.notFound"
          )
        );
      }

      const tipoInterface =
        normalizarTipoQuestao(
          questaoEncontrada.tipo
        );

      setQuestao({
        ...questaoEncontrada,
        tipo: tipoInterface,
        alternativas:
          Array.isArray(
            questaoEncontrada.alternativas
          )
            ? questaoEncontrada.alternativas
            : [],
      });

      setEnunciado(
        questaoEncontrada.enunciado ||
          ""
      );

      setPergunta(
        questaoEncontrada.pergunta ||
          ""
      );

      setTipo(
        tipoInterface
      );

      setValor(
        String(
          questaoEncontrada.valor ??
            1
        )
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

      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarQuestao();
  }, [
    provaId,
    questaoId,
    t,
  ]);

  async function salvarQuestao(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setFeedback("");
    setFeedbackTipo("");

    if (
      !enunciado.trim()
    ) {
      const mensagem =
        t(
          "validation.statementRequired"
        );

      setErro(mensagem);

      mostrarFeedback(
        "erro",
        mensagem
      );

      return;
    }

    const valorNumerico =
      Number(valor);

    if (
      !Number.isFinite(
        valorNumerico
      ) ||
      valorNumerico <= 0
    ) {
      const mensagem =
        t(
          "validation.invalidValue"
        );

      setErro(mensagem);

      mostrarFeedback(
        "erro",
        mensagem
      );

      return;
    }

    try {
      setSalvando(true);

      const res =
        await fetch(
          `/api/professor/provas/${provaId}/questoes/${questaoId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                enunciado:
                  enunciado.trim(),

                pergunta:
                  pergunta.trim()
                    ? pergunta.trim()
                    : null,

                tipo,

                valor:
                  valorNumerico,
              }
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

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.saveSuccess"
        )
      );

      setTimeout(() => {
        router.push(
          `/professor/provas/${provaId}`
        );
      }, 700);
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

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirQuestaoConfirmada() {
    try {
      setExcluindo(true);
      setErro("");
      setFeedback("");
      setFeedbackTipo("");

      const res =
        await fetch(
          `/api/professor/provas/${provaId}/questoes/${questaoId}`,
          {
            method: "DELETE",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.deleteError"
          )
        );
      }

      setModalExcluirAberto(
        false
      );

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.deleteSuccess"
        )
      );

      setTimeout(() => {
        router.push(
          `/professor/provas/${provaId}`
        );
      }, 700);
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.deleteError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setExcluindo(false);
    }
  }

  async function criarAlternativa(
    e: FormEvent
  ) {
    e.preventDefault();

    setErroAlternativa("");
    setFeedback("");
    setFeedbackTipo("");

    if (
      !novaAlternativa.trim()
    ) {
      const mensagem =
        t(
          "validation.alternativeRequired"
        );

      setErroAlternativa(
        mensagem
      );

      mostrarFeedback(
        "erro",
        mensagem
      );

      return;
    }

    try {
      setSalvandoAlternativa(
        true
      );

      const res =
        await fetch(
          `/api/professor/provas/${provaId}/questoes/${questaoId}/alternativas`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                texto:
                  novaAlternativa.trim(),

                correta:
                  novaAlternativaCorreta,
              }
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.alternativeCreateError"
          )
        );
      }

      setNovaAlternativa(
        ""
      );

      setNovaAlternativaCorreta(
        false
      );

      setErroAlternativa(
        ""
      );

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.alternativeCreateSuccess"
        )
      );

      await carregarQuestao();
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.alternativeCreateError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setSalvandoAlternativa(
        false
      );
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
    !questao
  ) {
    return (
      <div className="p-6 text-red-600 dark:text-red-300">
        {erro}
      </div>
    );
  }

  if (!questao) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("notFound")}
      </div>
    );
  }

  return (
    <>
      <div className="phanyx-professor-editar-questao p-6 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-4xl space-y-6">
          {feedback && (
            <div
              aria-live="polite"
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t("title")}
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "questionNumber",
                  {
                    number:
                      questao.ordem,
                  }
                )}
              </p>
            </div>

            <a
              href={`/professor/provas/${provaId}`}
              className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("back")}
            </a>
          </div>

          <form
            onSubmit={
              salvarQuestao
            }
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {erro && (
              <div
                aria-live="assertive"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              >
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="enunciado-questao"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.statement"
                )}
              </label>

              <textarea
                id="enunciado-questao"
                value={
                  enunciado
                }
                onChange={(e) =>
                  setEnunciado(
                    e.target.value
                  )
                }
                rows={5}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="pergunta-complementar"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.complementaryQuestion"
                )}
              </label>

              <input
                id="pergunta-complementar"
                type="text"
                value={
                  pergunta
                }
                onChange={(e) =>
                  setPergunta(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                placeholder={t(
                  "fields.optional"
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="tipo-questao"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t(
                    "fields.type"
                  )}
                </label>

                <select
                  id="tipo-questao"
                  value={tipo}
                  onChange={(e) =>
                    setTipo(
                      e.target
                        .value as TipoQuestao
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="MULTIPLA_ESCOLHA">
                    {t(
                      "questionTypes.multipleChoice"
                    )}
                  </option>

                  <option value="DISCURSIVA">
                    {t(
                      "questionTypes.discursive"
                    )}
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="valor-questao"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t(
                    "fields.value"
                  )}
                </label>

                <input
                  id="valor-questao"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={valor}
                  onChange={(e) =>
                    setValor(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  setModalExcluirAberto(
                    true
                  )
                }
                disabled={
                  excluindo
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindo
                  ? t(
                      "actions.deleting"
                    )
                  : t(
                      "actions.delete"
                    )}
              </button>

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

          {tipo ===
            "MULTIPLA_ESCOLHA" && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    "alternatives.title"
                  )}
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "alternatives.description"
                  )}
                </p>
              </div>

              <form
                onSubmit={
                  criarAlternativa
                }
                className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="nova-alternativa"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "alternatives.textLabel"
                    )}
                  </label>

                  <input
                    id="nova-alternativa"
                    type="text"
                    value={
                      novaAlternativa
                    }
                    onChange={(e) => {
                      setNovaAlternativa(
                        e.target.value
                      );

                      if (
                        erroAlternativa
                      ) {
                        setErroAlternativa(
                          ""
                        );
                      }
                    }}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-white ${
                      erroAlternativa
                        ? "border-red-400 focus:border-red-500 dark:border-red-700"
                        : "border-slate-300 focus:border-blue-500 dark:border-slate-700"
                    }`}
                    placeholder={t(
                      "alternatives.placeholder"
                    )}
                  />

                  {erroAlternativa && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-300">
                      {
                        erroAlternativa
                      }
                    </p>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={
                      novaAlternativaCorreta
                    }
                    onChange={(e) =>
                      setNovaAlternativaCorreta(
                        e.target
                          .checked
                      )
                    }
                  />

                  {t(
                    "alternatives.markCorrect"
                  )}
                </label>

                <button
                  type="submit"
                  disabled={
                    salvandoAlternativa
                  }
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoAlternativa
                    ? t(
                        "alternatives.adding"
                      )
                    : t(
                        "alternatives.add"
                      )}
                </button>
              </form>

              <div className="space-y-3">
                {questao.alternativas &&
                questao
                  .alternativas
                  .length > 0 ? (
                  questao.alternativas
                    .slice()
                    .sort(
                      (a, b) =>
                        (a.ordem ??
                          0) -
                        (b.ordem ??
                          0)
                    )
                    .map(
                      (
                        alternativa
                      ) => (
                        <div
                          key={
                            alternativa.id
                          }
                          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm text-slate-900 dark:text-slate-100">
                              {
                                alternativa.texto
                              }
                            </p>

                            <p
                              className={`text-xs font-medium ${
                                alternativa.correta
                                  ? "text-green-600 dark:text-green-300"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {alternativa.correta
                                ? t(
                                    "alternatives.correct"
                                  )
                                : t(
                                    "alternatives.incorrect"
                                  )}
                            </p>
                          </div>

                          <a
                            href={`/professor/provas/${provaId}/questoes/${questaoId}/alternativas/${alternativa.id}`}
                            className="w-fit text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {t(
                              "actions.edit"
                            )}
                          </a>
                        </div>
                      )
                    )
                ) : (
                  <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {t(
                      "alternatives.empty"
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalExcluirAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-xl dark:bg-red-950/50">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t(
                    "deleteModal.title"
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "deleteModal.message"
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "deleteModal.warning"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setModalExcluirAberto(
                    false
                  )
                }
                disabled={
                  excluindo
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "deleteModal.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={
                  excluirQuestaoConfirmada
                }
                disabled={
                  excluindo
                }
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindo
                  ? t(
                      "actions.deleting"
                    )
                  : t(
                      "deleteModal.confirm"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}