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
import {
  useLocale,
  useTranslations,
} from "next-intl";

type RespostaItem = {
  id: number;
  nota?: number | null;
  respostaTexto?: string | null;
  alternativa?: {
    id: number;
    texto: string;
  } | null;
  questao: {
    id: number;
    pergunta: string;
    tipo?: string;
  };
};

type TentativaDetalhe = {
  id: number;
  aluno?: {
    nome?: string | null;
    email?: string | null;
  };
  prova?: {
    titulo?: string | null;
  };
  respostas?: RespostaItem[];
};

export default function VerTentativaPage() {
  const params =
    useParams<{
      tentativaId: string;
    }>();

  const router = useRouter();

  const t = useTranslations(
    "ProfessorEvaluationAttemptDetail"
  );

  const locale = useLocale();

  const tentativaId = String(
    params?.tentativaId || ""
  ).trim();

  const tentativaValida =
    /^\d+$/.test(tentativaId) &&
    Number(tentativaId) > 0;

  const [
    tentativa,
    setTentativa,
  ] =
    useState<TentativaDetalhe | null>(
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

  const carregar =
    useCallback(
      async () => {
        if (!tentativaValida) {
          setTentativa(null);
          setErro(
            t(
              "feedback.invalidAttempt"
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
                credentials:
                  "include",
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
            typeof json.id !==
              "number"
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setTentativa(
            json as TentativaDetalhe
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
          setTentativa(null);
        } finally {
          setLoading(false);
        }
      },
      [
        tentativaId,
        tentativaValida,
        t,
      ]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const respostas =
    Array.isArray(
      tentativa?.respostas
    )
      ? tentativa.respostas
      : [];

  const nomeAluno =
    tentativa?.aluno?.nome?.trim() ||
    tentativa?.aluno?.email?.trim() ||
    t("studentFallback");

  const tituloProva =
    tentativa?.prova?.titulo?.trim() ||
    t("examFallback");

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-950/40">
          <p className="font-semibold text-red-700 dark:text-red-300">
            {t("errorTitle")}
          </p>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {erro}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {t(
                "actions.retry"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              {t(
                "actions.back"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tentativa) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("notFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {t(
                  "fields.student"
                )}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {nomeAluno}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {t(
                  "fields.exam"
                )}
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {tituloProva}
              </p>
            </div>
          </div>
        </section>

        {respostas.length ===
        0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-950">
              📝
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
            {respostas.map(
              (
                resposta,
                index
              ) => {
                const respostaAluno =
                  resposta
                    .alternativa
                    ?.texto ||
                  resposta
                    .respostaTexto ||
                  t(
                    "answer.empty"
                  );

                return (
                  <article
                    key={
                      resposta.id
                    }
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
                      {t(
                        "questionNumber",
                        {
                          number:
                            index +
                            1,
                        }
                      )}
                    </p>

                    <p className="mt-3 font-semibold leading-7 text-slate-900 dark:text-white">
                      {
                        resposta
                          .questao
                          ?.pergunta
                      }
                    </p>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                        {t(
                          "fields.studentAnswer"
                        )}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {
                          respostaAluno
                        }
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t(
                          "fields.grade"
                        )}
                      </span>

                      <span className="font-bold text-slate-900 dark:text-white">
                        {resposta.nota ===
                        null ||
                        resposta.nota ===
                          undefined
                          ? t(
                              "grade.empty"
                            )
                          : formatadorNota.format(
                              resposta.nota
                            )}
                      </span>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}