"use client";

import {
  FormEvent,
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
import { useProfessor } from "@/app/context/ProfessorContext";

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

export default function DisciplinaProfessor() {
  const params = useParams();
  const router = useRouter();

  const t = useTranslations(
    "ProfessorDisciplineDetail"
  );

  const locale = useLocale();

  const disciplinaId = String(
    params?.id || ""
  );

  const {
    disciplinas,
    adicionarAula,
    matriculas,
    notas,
  } = useProfessor();

  const disciplina =
    disciplinas.find(
      (item) =>
        String(item.id) ===
        disciplinaId
    );

  const alunosDaDisciplina =
    matriculas.filter(
      (matricula) =>
        String(
          matricula.disciplinaId
        ) === disciplinaId
    );

  const notasDaDisciplina =
    notas.filter(
      (nota) =>
        String(
          nota.disciplinaId
        ) === disciplinaId
    );

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    video,
    setVideo,
  ] = useState("");

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
    adicionando,
    setAdicionando,
  ] = useState(false);

  const formatadorNota =
    useMemo(
      () =>
        new Intl.NumberFormat(
          locale,
          {
            maximumFractionDigits: 2,
          }
        ),
      [locale]
    );

  function urlValida(
    valor: string
  ) {
    try {
      const url = new URL(
        valor
      );

      return (
        url.protocol ===
          "http:" ||
        url.protocol ===
          "https:"
      );
    } catch {
      return false;
    }
  }

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

  function handleAddAula(
    event: FormEvent
  ) {
    event.preventDefault();

    if (adicionando) {
      return;
    }

    const tituloNormalizado =
      titulo.trim();

    const videoNormalizado =
      video.trim();

    setFeedback("");
    setFeedbackTipo("");

    if (!tituloNormalizado) {
      mostrarFeedback(
        "erro",
        t(
          "validation.lessonTitleRequired"
        )
      );
      return;
    }

    if (!videoNormalizado) {
      mostrarFeedback(
        "erro",
        t(
          "validation.videoRequired"
        )
      );
      return;
    }

    if (
      !urlValida(
        videoNormalizado
      )
    ) {
      mostrarFeedback(
        "erro",
        t(
          "validation.invalidVideoUrl"
        )
      );
      return;
    }

    try {
      setAdicionando(true);

      adicionarAula(
        disciplinaId,
        tituloNormalizado,
        videoNormalizado
      );

      setTitulo("");
      setVideo("");

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.lessonAdded"
        )
      );
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.lessonAddError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setAdicionando(false);
    }
  }

  if (!disciplina) {
    return (
      <div className="max-w-3xl">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-950">
            📚
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

  const aulas =
    Array.isArray(
      disciplina.aulas
    )
      ? disciplina.aulas
      : [];

  return (
    <div className="max-w-3xl space-y-6 text-slate-900 dark:text-slate-100">
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
          {disciplina.nome}
        </h1>

        {disciplina.descricao ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
            {
              disciplina.descricao
            }
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "noDescription"
            )}
          </p>
        )}
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
            {t(
              "students.eyebrow"
            )}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {t(
              "students.title"
            )}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "students.description"
            )}
          </p>
        </div>

        {alunosDaDisciplina.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            {t(
              "students.empty"
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {alunosDaDisciplina.map(
              (
                matricula,
                index
              ) => {
                const notaAluno =
                  notasDaDisciplina.find(
                    (nota) =>
                      nota.alunoEmail ===
                      matricula.alunoEmail
                  );

                return (
                  <div
                    key={`${matricula.alunoEmail}-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="break-all text-sm font-medium text-slate-700 dark:text-slate-200">
                      {
                        matricula.alunoEmail
                      }
                    </span>

                    {notaAluno ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                          {t(
                            "students.grade",
                            {
                              grade:
                                formatadorNota.format(
                                  notaAluno.nota
                                ),
                            }
                          )}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            notaAluno.aprovado
                              ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          }`}
                        >
                          {notaAluno.aprovado
                            ? t(
                                "students.approved"
                              )
                            : t(
                                "students.failed"
                              )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {t(
                          "students.noGrade"
                        )}
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-400">
          {t(
            "exam.eyebrow"
          )}
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
          {t(
            "exam.title"
          )}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t(
            "exam.description"
          )}
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/professor/disciplinas/${disciplinaId}/prova`
            )
          }
          className="mt-5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
        >
          {t(
            "exam.action"
          )}
        </button>
      </section>

      <form
        onSubmit={
          handleAddAula
        }
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
            {t(
              "newLesson.eyebrow"
            )}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {t(
              "newLesson.title"
            )}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "newLesson.description"
            )}
          </p>
        </div>

        <div>
          <label
            htmlFor="aula-titulo"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.lessonTitle"
            )}
          </label>

          <input
            id="aula-titulo"
            value={titulo}
            onChange={(event) =>
              setTitulo(
                event.target.value
              )
            }
            placeholder={t(
              "fields.lessonTitlePlaceholder"
            )}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="aula-video"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.videoUrl"
            )}
          </label>

          <input
            id="aula-video"
            type="url"
            value={video}
            onChange={(event) =>
              setVideo(
                event.target.value
              )
            }
            placeholder={t(
              "fields.videoUrlPlaceholder"
            )}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              adicionando
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adicionando
              ? t(
                  "actions.addingLesson"
                )
              : t(
                  "actions.addLesson"
                )}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
            {t(
              "lessons.eyebrow"
            )}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {t(
              "lessons.title"
            )}
          </h2>
        </div>

        {aulas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t(
              "lessons.empty"
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {aulas.map(
              (aula) => (
                <button
                  key={
                    aula.id
                  }
                  type="button"
                  onClick={() =>
                    router.push(
                      `/professor/disciplinas/${disciplinaId}/aula/${aula.id}`
                    )
                  }
                  className="block w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {
                      aula.titulo
                    }
                  </p>

                  <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                    {t(
                      "actions.openLesson"
                    )}
                  </p>
                </button>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}