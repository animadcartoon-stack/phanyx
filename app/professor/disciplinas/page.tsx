"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfessor } from "@/app/context/ProfessorContext";

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

type DisciplinaExclusao = {
  id: number;
  nome: string;
};

export default function DisciplinasProfessor() {
  const { disciplinas } =
    useProfessor();

  const router = useRouter();

  const t = useTranslations(
    "ProfessorDisciplines"
  );

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] =
    useState<FeedbackTipo>("");

  const [
    disciplinaParaExcluir,
    setDisciplinaParaExcluir,
  ] =
    useState<DisciplinaExclusao | null>(
      null
    );

  const [
    excluindoId,
    setExcluindoId,
  ] =
    useState<number | null>(
      null
    );

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

  async function confirmarExclusaoDisciplina() {
    if (
      !disciplinaParaExcluir ||
      excluindoId !== null
    ) {
      return;
    }

    try {
      setExcluindoId(
        disciplinaParaExcluir.id
      );

      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch(
        `/api/professor/disciplinas/${disciplinaParaExcluir.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      let data: {
        error?: string;
      } = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t(
              "feedback.deleteError"
            )
        );
      }

      setDisciplinaParaExcluir(
        null
      );

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.deleteSuccess"
        )
      );

      setTimeout(() => {
        window.location.reload();
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
      setExcluindoId(null);
    }
  }

  return (
    <>
      <div className="space-y-6 text-slate-900 dark:text-slate-100">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {t("title")}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "description"
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/professor/disciplinas/nova"
                )
              }
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {t(
                "actions.new"
              )}
            </button>
          </div>
        </section>

        {disciplinas.length ===
        0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-950">
              📚
            </div>

            <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
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
            {disciplinas.map(
              (disciplina) => {
                const id =
                  Number(
                    disciplina.id
                  );

                const excluindo =
                  excluindoId === id;

                return (
                  <div
                    key={
                      disciplina.id
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      router.push(
                        `/professor/disciplinas/${disciplina.id}`
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();

                        router.push(
                          `/professor/disciplinas/${disciplina.id}`
                        );
                      }
                    }}
                    className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                          {t(
                            "card.label"
                          )}
                        </p>

                        <h2 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">
                          {
                            disciplina.nome
                          }
                        </h2>

                        <p className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                          {t(
                            "actions.open"
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          setDisciplinaParaExcluir(
                            {
                              id,
                              nome:
                                disciplina.nome,
                            }
                          );
                        }}
                        disabled={
                          excluindo
                        }
                        className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {excluindo
                          ? t(
                              "actions.deleting"
                            )
                          : t(
                              "actions.delete"
                            )}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {disciplinaParaExcluir && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="excluir-disciplina-titulo"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-xl dark:bg-red-950/60">
                🗑️
              </div>

              <div className="flex-1">
                <h2
                  id="excluir-disciplina-titulo"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  {t(
                    "deleteModal.title"
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "deleteModal.message",
                    {
                      name:
                        disciplinaParaExcluir.nome,
                    }
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
                  setDisciplinaParaExcluir(
                    null
                  )
                }
                disabled={
                  excluindoId ===
                  disciplinaParaExcluir.id
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={
                  confirmarExclusaoDisciplina
                }
                disabled={
                  excluindoId ===
                  disciplinaParaExcluir.id
                }
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId ===
                disciplinaParaExcluir.id
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