"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslations } from "next-intl";

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
};

type Questao = {
  id: number;
  enunciado: string;
  alternativas?: Alternativa[];
};

type Prova = {
  id: number;
  questoes: Questao[];
};

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

export default function AlternativaPage() {
  const params = useParams();
  const router = useRouter();

  const t = useTranslations(
    "ProfessorEditAlternative"
  );

  const provaId = String(
    params?.provaId || ""
  );

  const questaoId = String(
    params?.questaoId || ""
  );

  const altId = String(
    params?.altId || ""
  );

  const [
    texto,
    setTexto,
  ] = useState("");

  const [
    correta,
    setCorreta,
  ] = useState(false);

  const [
    alternativaCarregada,
    setAlternativaCarregada,
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

  const carregarAlternativa =
    useCallback(
      async () => {
        if (
          !provaId ||
          !questaoId ||
          !altId
        ) {
          setAlternativaCarregada(
            false
          );

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
          setAlternativaCarregada(
            false
          );

          const res =
            await fetch(
              `/api/professor/provas/${provaId}`,
              {
                cache:
                  "no-store",
              }
            );

          if (!res.ok) {
            throw new Error(
              t(
                "feedback.examLoadError"
              )
            );
          }

          const prova =
            (await res.json()) as Prova;

          if (
            !Array.isArray(
              prova?.questoes
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          const questao =
            prova.questoes.find(
              (item) =>
                String(
                  item.id
                ) ===
                questaoId
            );

          if (!questao) {
            throw new Error(
              t(
                "feedback.questionNotFound"
              )
            );
          }

          const alternativa =
            Array.isArray(
              questao.alternativas
            )
              ? questao.alternativas.find(
                  (item) =>
                    String(
                      item.id
                    ) ===
                    altId
                )
              : undefined;

          if (!alternativa) {
            throw new Error(
              t(
                "feedback.notFound"
              )
            );
          }

          setTexto(
            alternativa.texto ||
              ""
          );

          setCorreta(
            Boolean(
              alternativa.correta
            )
          );

          setAlternativaCarregada(
            true
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

          setAlternativaCarregada(
            false
          );

          setErro(mensagem);
        } finally {
          setLoading(false);
        }
      },
      [
        provaId,
        questaoId,
        altId,
        t,
      ]
    );

  useEffect(() => {
    void carregarAlternativa();
  }, [carregarAlternativa]);

  async function salvarAlternativa(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setFeedback("");
    setFeedbackTipo("");

    const textoNormalizado =
      texto.trim();

    if (!textoNormalizado) {
      const mensagem =
        t(
          "validation.textRequired"
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
          `/api/professor/provas/${provaId}/questoes/${questaoId}/alternativas/${altId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                texto:
                  textoNormalizado,
                correta,
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
          `/professor/provas/${provaId}/questoes/${questaoId}`
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

  async function excluirAlternativaConfirmada() {
    try {
      setExcluindo(true);
      setErro("");
      setFeedback("");
      setFeedbackTipo("");

      const res =
        await fetch(
          `/api/professor/provas/${provaId}/questoes/${questaoId}/alternativas/${altId}`,
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
          `/professor/provas/${provaId}/questoes/${questaoId}`
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

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("loading")}
      </div>
    );
  }

  if (
    erro &&
    !alternativaCarregada
  ) {
    return (
      <div className="space-y-4 p-6">
        <div className="text-red-600 dark:text-red-300">
          {erro}
        </div>

        <button
          type="button"
          onClick={() =>
            void carregarAlternativa()
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

  if (!alternativaCarregada) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("notFound")}
      </div>
    );
  }

  return (
    <>
      <div className="phanyx-professor-editar-alternativa p-6 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-2xl space-y-6">
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
                  "description"
                )}
              </p>
            </div>

            <Link
              href={`/professor/provas/${provaId}/questoes/${questaoId}`}
              className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("back")}
            </Link>
          </div>

          <form
            onSubmit={
              salvarAlternativa
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
                htmlFor="texto-alternativa"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.text"
                )}
              </label>

              <input
                id="texto-alternativa"
                type="text"
                value={texto}
                onChange={(e) =>
                  setTexto(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                placeholder={t(
                  "fields.placeholder"
                )}
                required
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={correta}
                onChange={(e) =>
                  setCorreta(
                    e.target.checked
                  )
                }
              />

              {t(
                "fields.correct"
              )}
            </label>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  setModalExcluirAberto(
                    true
                  )
                }
                disabled={
                  excluindo ||
                  salvando
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
                  salvando ||
                  excluindo
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
                  excluirAlternativaConfirmada
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