"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Aula = {
  id: number;
  titulo: string;
  descricao?: string | null;
  duracaoMin?: number | null;
  videoUrl?: string | null;
  ordem?: number | null;
};

export default function ProfessorAulasPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const t = useTranslations(
    "ProfessorDisciplineLessons"
  );

  const locale = useLocale();

  const disciplinaId = Number(
    params?.id || 0
  );

  const disciplinaValida =
    Number.isFinite(
      disciplinaId
    ) &&
    disciplinaId > 0;

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    duracaoMin,
    setDuracaoMin,
  ] = useState("");

  const [
    videoUrl,
    setVideoUrl,
  ] = useState("");

  const [
    aulas,
    setAulas,
  ] = useState<Aula[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const formatadorNumero =
    useMemo(
      () =>
        new Intl.NumberFormat(
          locale,
          {
            maximumFractionDigits: 0,
          }
        ),
      [locale]
    );

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

  const carregarAulas =
    useCallback(
      async () => {
        if (!disciplinaValida) {
          setAulas([]);
          setErro(
            t(
              "feedback.invalidDiscipline"
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
              `/api/professor/disciplinas/${disciplinaId}/aulas`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          if (!res.ok) {
            let mensagem =
              t(
                "feedback.loadError"
              );

            try {
              const data =
                await res.json();

              if (
                typeof data?.error ===
                "string"
              ) {
                mensagem =
                  data.error;
              }
            } catch {
              // Mantém a mensagem traduzida.
            }

            throw new Error(
              mensagem
            );
          }

          const data =
            await res.json();

          if (
            !Array.isArray(
              data
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setAulas(
            data as Aula[]
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
          setAulas([]);
        } finally {
          setLoading(false);
        }
      },
      [
        disciplinaId,
        disciplinaValida,
        t,
      ]
    );

  useEffect(() => {
    void carregarAulas();
  }, [carregarAulas]);

  async function criarAula(
    event: FormEvent
  ) {
    event.preventDefault();

    if (salvando) {
      return;
    }

    setErro("");
    setSucesso("");

    if (!disciplinaValida) {
      setErro(
        t(
          "feedback.invalidDiscipline"
        )
      );
      return;
    }

    const tituloNormalizado =
      titulo.trim();

    const descricaoNormalizada =
      descricao.trim();

    const videoNormalizado =
      videoUrl.trim();

    if (!tituloNormalizado) {
      setErro(
        t(
          "validation.titleRequired"
        )
      );
      return;
    }

    let duracao:
      | number
      | null = null;

    if (
      duracaoMin.trim()
    ) {
      duracao = Number(
        duracaoMin
      );

      if (
        !Number.isFinite(
          duracao
        ) ||
        duracao <= 0
      ) {
        setErro(
          t(
            "validation.invalidDuration"
          )
        );
        return;
      }
    }

    if (
      videoNormalizado &&
      !urlValida(
        videoNormalizado
      )
    ) {
      setErro(
        t(
          "validation.invalidVideoUrl"
        )
      );
      return;
    }

    try {
      setSalvando(true);

      const res =
        await fetch(
          `/api/professor/disciplinas/${disciplinaId}/aulas`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                titulo:
                  tituloNormalizado,

                descricao:
                  descricaoNormalizada,

                duracaoMin:
                  duracao,

                videoUrl:
                  videoNormalizado,
              }
            ),
          }
        );

      if (!res.ok) {
        let mensagem =
          t(
            "feedback.createError"
          );

        try {
          const data =
            await res.json();

          if (
            typeof data?.error ===
            "string"
          ) {
            mensagem =
              data.error;
          }
        } catch {
          // Mantém a mensagem traduzida.
        }

        throw new Error(
          mensagem
        );
      }

      setTitulo("");
      setDescricao("");
      setDuracaoMin("");
      setVideoUrl("");

      setSucesso(
        t(
          "feedback.createSuccess"
        )
      );

      await carregarAulas();
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.createError"
            );

      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
      </section>

      <form
        onSubmit={
          criarAula
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

        {erro && (
          <div
            aria-live="assertive"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          >
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            aria-live="polite"
            className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
          >
            {sucesso}
          </div>
        )}

        <div>
          <label
            htmlFor="aula-titulo"
            className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.title"
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
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            placeholder={t(
              "fields.titlePlaceholder"
            )}
            required
          />
        </div>

        <div>
          <label
            htmlFor="aula-descricao"
            className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.description"
            )}
          </label>

          <textarea
            id="aula-descricao"
            value={descricao}
            onChange={(event) =>
              setDescricao(
                event.target.value
              )
            }
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            rows={4}
            placeholder={t(
              "fields.descriptionPlaceholder"
            )}
          />
        </div>

        <div>
          <label
            htmlFor="aula-duracao"
            className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.duration"
            )}
          </label>

          <input
            id="aula-duracao"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={
              duracaoMin
            }
            onChange={(event) =>
              setDuracaoMin(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            placeholder={t(
              "fields.durationPlaceholder"
            )}
          />
        </div>

        <div>
          <label
            htmlFor="aula-video"
            className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.videoUrl"
            )}
          </label>

          <input
            id="aula-video"
            type="url"
            value={videoUrl}
            onChange={(event) =>
              setVideoUrl(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            placeholder={t(
              "fields.videoUrlPlaceholder"
            )}
          />

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t(
              "fields.videoUrlHelp"
            )}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              salvando ||
              !disciplinaValida
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando
              ? t(
                  "actions.saving"
                )
              : t(
                  "actions.create"
                )}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
            {t(
              "lessonList.eyebrow"
            )}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {t(
              "lessonList.title"
            )}
          </h2>
        </div>

        {loading ? (
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            {t(
              "lessonList.loading"
            )}
          </p>
        ) : aulas.length ===
          0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
              🎓
            </div>

            <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
              {t(
                "lessonList.emptyTitle"
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "lessonList.emptyDescription"
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {aulas.map(
              (aula) => (
                <article
                  key={
                    aula.id
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {aula.ordem
                      ? `${formatadorNumero.format(
                          aula.ordem
                        )}. `
                      : ""}
                    {
                      aula.titulo
                    }
                  </h3>

                  {aula.descricao && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {
                        aula.descricao
                      }
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {aula.duracaoMin &&
                      aula.duracaoMin >
                        0
                        ? t(
                            "lessonList.duration",
                            {
                              minutes:
                                formatadorNumero.format(
                                  aula.duracaoMin
                                ),
                            }
                          )
                        : t(
                            "lessonList.durationNotProvided"
                          )}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        aula.videoUrl
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {aula.videoUrl
                        ? t(
                            "lessonList.videoAvailable"
                          )
                        : t(
                            "lessonList.videoUnavailable"
                          )}
                    </span>
                  </div>

                  {aula.videoUrl && (
                    <a
                      href={
                        aula.videoUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t(
                        "actions.openVideo"
                      )}
                    </a>
                  )}
                </article>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}