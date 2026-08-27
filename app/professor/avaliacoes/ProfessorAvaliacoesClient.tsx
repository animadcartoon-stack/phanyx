"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Resultado = {
  aluno: string;
  prova: string;
  nota: number | null;
  status: string;
  tentativaId: number;
};

function statusClass(
  status: string
) {
  const valor = String(
    status || ""
  )
    .trim()
    .toUpperCase();

  if (valor === "APROVADO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (valor === "REPROVADO") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function ProfessorAvaliacoesClient() {
  const router = useRouter();

  const t = useTranslations(
    "ProfessorEvaluationsResults"
  );

  const locale = useLocale();

  const [
    dados,
    setDados,
  ] = useState<Resultado[]>([]);

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

  function statusLabel(
    status: string
  ) {
    const valor = String(
      status || ""
    )
      .trim()
      .toUpperCase();

    if (valor === "APROVADO") {
      return t(
        "status.approved"
      );
    }

    if (valor === "REPROVADO") {
      return t(
        "status.failed"
      );
    }

    return t(
      "status.pending"
    );
  }

  const carregar =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErro("");

          const res =
            await fetch(
              "/api/professor/avaliacoes",
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
            !Array.isArray(
              json
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setDados(
            json as Resultado[]
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

          setErro(
            mensagem
          );

          setDados([]);
        } finally {
          setLoading(false);
        }
      },
      [t]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-5 px-1 py-2 text-slate-900 dark:text-slate-100 sm:px-0">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
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

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-800 dark:bg-red-950/40">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregar()
            }
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {t(
              "actions.retry"
            )}
          </button>
        </div>
      )}

      {loading && !erro && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      )}

      {!loading &&
        !erro &&
        dados.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("empty")}
          </div>
        )}

      {!loading &&
        !erro &&
        dados.length > 0 && (
          <div className="space-y-4">
            {dados.map(
              (resultado) => (
                <button
                  key={
                    resultado.tentativaId
                  }
                  type="button"
                  onClick={() =>
                    router.push(
                      `/professor/avaliacoes/${resultado.tentativaId}`
                    )
                  }
                  className="block w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                        {t(
                          "fields.student"
                        )}
                      </p>

                      <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                        {
                          resultado.aluno
                        }
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        <strong className="font-semibold text-slate-800 dark:text-slate-100">
                          {t(
                            "fields.exam"
                          )}
                          :
                        </strong>{" "}
                        {
                          resultado.prova
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                        {t(
                          "fields.grade"
                        )}
                        :{" "}
                        {resultado.nota ===
                        null
                          ? t(
                              "grade.empty"
                            )
                          : formatadorNota.format(
                              resultado.nota
                            )}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                          resultado.status
                        )}`}
                      >
                        {statusLabel(
                          resultado.status
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:bg-slate-950 dark:text-blue-400">
                    {t(
                      "actions.viewAnswers"
                    )}
                  </div>
                </button>
              )
            )}
          </div>
        )}
    </div>
  );
}