"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type AtividadeResumo = {
  id: number;
  titulo?: string | null;
};

type AlunoEntrega = {
  id?: number | null;
  nome?: string | null;
  email?: string | null;
};

type EntregaApi = {
  id: number;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string | null;
  corrigidaEm?: string | null;
  aluno?: AlunoEntrega | null;
};

type AtividadeDetalhe = {
  id: number;
  titulo?: string | null;
  notaMaxima?: number | null;
  entregas?: EntregaApi[];
};

type EntregaLista = EntregaApi & {
  atividadeId: number;
  atividadeTitulo: string;
  notaMaxima: number | null;
};

export default function ProfessorEntregasPage() {
  const t = useTranslations(
    "ProfessorSubmissions"
  );

  const locale = useLocale();

  const [
    entregas,
    setEntregas,
  ] = useState<EntregaLista[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const formatadorNumero =
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

  function formatarData(
    valor?: string | null
  ) {
    if (!valor) {
      return t(
        "date.notProvided"
      );
    }

    const data = new Date(
      valor
    );

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return t(
        "date.notProvided"
      );
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(data);
  }

  function nomeAluno(
    entrega: EntregaLista
  ) {
    const nome =
      entrega.aluno?.nome?.trim();

    if (nome) {
      return nome;
    }

    const email =
      entrega.aluno?.email?.trim();

    if (email) {
      return email;
    }

    if (
      entrega.aluno?.id
    ) {
      return t(
        "studentFallbackWithId",
        {
          id:
            entrega.aluno.id,
        }
      );
    }

    return t(
      "studentFallback"
    );
  }

  const carregarEntregas =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErro("");

          const resAtividades =
            await fetch(
              "/api/professor/atividades",
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          if (
            !resAtividades.ok
          ) {
            throw new Error(
              t(
                "feedback.loadError"
              )
            );
          }

          const atividadesJson =
            await resAtividades.json();

          if (
            !Array.isArray(
              atividadesJson
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidActivitiesResponse"
              )
            );
          }

          const atividades =
            atividadesJson as AtividadeResumo[];

          const detalhes =
            await Promise.all(
              atividades.map(
                async (
                  atividade
                ) => {
                  try {
                    const res =
                      await fetch(
                        `/api/professor/atividades/${atividade.id}`,
                        {
                          credentials:
                            "include",
                          cache:
                            "no-store",
                        }
                      );

                    if (
                      !res.ok
                    ) {
                      return null;
                    }

                    const json =
                      await res.json();

                    if (
                      !json ||
                      typeof json !==
                        "object"
                    ) {
                      return null;
                    }

                    return json as AtividadeDetalhe;
                  } catch {
                    return null;
                  }
                }
              )
            );

          const lista:
            EntregaLista[] =
            [];

          for (
            const detalhe of
            detalhes
          ) {
            if (
              !detalhe ||
              !Array.isArray(
                detalhe.entregas
              )
            ) {
              continue;
            }

            const atividadeTitulo =
              detalhe.titulo?.trim() ||
              t(
                "activityFallback"
              );

            for (
              const entrega of
              detalhe.entregas
            ) {
              if (
                !entrega ||
                typeof entrega.id !==
                  "number"
              ) {
                continue;
              }

              lista.push({
                ...entrega,

                atividadeId:
                  detalhe.id,

                atividadeTitulo,

                notaMaxima:
                  typeof detalhe.notaMaxima ===
                  "number"
                    ? detalhe.notaMaxima
                    : null,
              });
            }
          }

          lista.sort(
            (
              anterior,
              posterior
            ) => {
              const dataAnterior =
                anterior.entregueEm
                  ? new Date(
                      anterior.entregueEm
                    ).getTime()
                  : 0;

              const dataPosterior =
                posterior.entregueEm
                  ? new Date(
                      posterior.entregueEm
                    ).getTime()
                  : 0;

              return (
                dataPosterior -
                dataAnterior
              );
            }
          );

          setEntregas(lista);
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
          setEntregas([]);
        } finally {
          setLoading(false);
        }
      },
      [t]
    );

  useEffect(() => {
    void carregarEntregas();
  }, [carregarEntregas]);

  return (
    <div className="space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
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
              void carregarEntregas()
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
        entregas.length ===
          0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-950">
              📥
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
        )}

      {!loading &&
        !erro &&
        entregas.length > 0 && (
          <div className="space-y-4">
            {entregas.map(
              (entrega) => {
                const corrigida =
                  entrega.corrigidaEm !==
                    null &&
                  entrega.corrigidaEm !==
                    undefined;

                return (
                  <article
                    key={
                      entrega.id
                    }
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                          {t(
                            "fields.student"
                          )}
                        </p>

                        <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                          {nomeAluno(
                            entrega
                          )}
                        </h2>

                        <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                          <p>
                            <strong className="font-semibold text-slate-800 dark:text-slate-100">
                              {t(
                                "fields.activity"
                              )}
                              :
                            </strong>{" "}
                            {
                              entrega.atividadeTitulo
                            }
                          </p>

                          <p>
                            <strong className="font-semibold text-slate-800 dark:text-slate-100">
                              {t(
                                "fields.submittedAt"
                              )}
                              :
                            </strong>{" "}
                            {formatarData(
                              entrega.entregueEm
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            corrigida
                              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {corrigida
                            ? t(
                                "status.corrected"
                              )
                            : t(
                                "status.pending"
                              )}
                        </span>

                        {entrega.nota !==
                          null &&
                          entrega.nota !==
                            undefined && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                            {entrega.notaMaxima !==
                            null
                              ? t(
                                  "grade.withMaximum",
                                  {
                                    grade:
                                      formatadorNumero.format(
                                        entrega.nota
                                      ),
                                    maximum:
                                      formatadorNumero.format(
                                        entrega.notaMaxima
                                      ),
                                  }
                                )
                              : t(
                                  "grade.withoutMaximum",
                                  {
                                    grade:
                                      formatadorNumero.format(
                                        entrega.nota
                                      ),
                                  }
                                )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/professor/entregas/${entrega.id}`}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {corrigida
                          ? t(
                              "actions.review"
                            )
                          : t(
                              "actions.correct"
                            )}
                      </Link>

                      <Link
                        href={`/professor/atividades/${entrega.atividadeId}`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {t(
                          "actions.viewActivity"
                        )}
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
    </div>
  );
}