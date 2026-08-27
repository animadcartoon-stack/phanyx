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

type Tentativa = {
  id: number;
  finalizada: boolean;
  notaFinal?: number | null;
  aluno?: {
    id: number;
    nome?: string | null;
  };
};

export default function TentativasPage() {
  const params = useParams();

  const provaId = String(
    params?.provaId || ""
  );

  const t = useTranslations(
    "ProfessorExamAttempts"
  );

  const locale = useLocale();

  const [
    tentativas,
    setTentativas,
  ] = useState<Tentativa[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const formatadorNota = useMemo(
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

  const carregar = useCallback(
    async () => {
      if (!provaId) {
        setTentativas([]);
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

        const res = await fetch(
          `/api/professor/provas/${provaId}/tentativas`,
          {
            cache: "no-store",
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

        if (!Array.isArray(data)) {
          throw new Error(
            t(
              "feedback.invalidResponse"
            )
          );
        }

        setTentativas(
          data as Tentativa[]
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

        setTentativas([]);
        setErro(mensagem);
      } finally {
        setLoading(false);
      }
    },
    [provaId, t]
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function nomeAluno(
    tentativa: Tentativa
  ) {
    const nome =
      tentativa.aluno?.nome?.trim();

    if (nome) {
      return nome;
    }

    if (
      tentativa.aluno?.id !=
      null
    ) {
      return t(
        "studentFallback",
        {
          id: tentativa.aluno.id,
        }
      );
    }

    return t(
      "studentUnknown"
    );
  }

  function notaTentativa(
    tentativa: Tentativa
  ) {
    if (
      tentativa.notaFinal ===
        null ||
      tentativa.notaFinal ===
        undefined
    ) {
      return "—";
    }

    return formatadorNota.format(
      tentativa.notaFinal
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="phanyx-professor-tentativas space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("description")}
        </p>
      </div>

      {erro && (
        <div
          aria-live="assertive"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40"
        >
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {erro}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregar()
            }
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            {t(
              "actions.retry"
            )}
          </button>
        </div>
      )}

      {!erro &&
        tentativas.length ===
          0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("empty")}
          </div>
        )}

      {!erro &&
        tentativas.length >
          0 && (
          <div className="space-y-3">
            {tentativas.map(
              (
                tentativa
              ) => (
                <div
                  key={
                    tentativa.id
                  }
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900 dark:text-white">
                      {nomeAluno(
                        tentativa
                      )}
                    </div>

                    <div
                      className={`mt-1 text-sm font-medium ${
                        tentativa.finalizada
                          ? "text-green-700 dark:text-green-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {tentativa.finalizada
                        ? t(
                            "status.finished"
                          )
                        : t(
                            "status.inProgress"
                          )}
                    </div>

                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t(
                        "grade",
                        {
                          grade:
                            notaTentativa(
                              tentativa
                            ),
                        }
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/professor/tentativas/${tentativa.id}`}
                    className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {t(
                      "actions.view"
                    )}
                  </Link>
                </div>
              )
            )}
          </div>
        )}
    </div>
  );
}