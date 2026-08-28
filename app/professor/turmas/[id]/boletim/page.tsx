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

type BoletimItem = {
  alunoId: number;
  nome: string;
  email: string | null;
  nota: number | null;
  status: string;
};

type BoletimResponse = {
  turma: {
    id: number;
    nome: string;
  };
  disciplina: {
    id: number | null;
    nome: string;
  };
  resumo: {
    totalAlunos: number;
    mediaTurma: number;
    melhorNota: number;
    piorNota: number;
  };
  boletim: BoletimItem[];
};

type StatusFiltro =
  | "TODOS"
  | "SEM PROVA"
  | "APROVADO"
  | "REPROVADO";

type RegistroJson = Record<
  string,
  unknown
>;

const ITENS_POR_PAGINA = 25;

function isRecord(
  value: unknown
): value is RegistroJson {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function lerJson(
  response: Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mensagemDaApi(
  data: unknown
) {
  if (
    isRecord(data) &&
    typeof data.error ===
      "string" &&
    data.error.trim()
  ) {
    return data.error;
  }

  return "";
}

function numeroPositivo(
  value: unknown
) {
  const numero =
    Number(value);

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function numeroFinito(
  value: unknown,
  fallback = 0
) {
  const numero =
    Number(value);

  return Number.isFinite(
    numero
  )
    ? numero
    : fallback;
}

function notaOuNull(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numero =
    Number(value);

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
}

function normalizarTexto(
  valor?:
    | string
    | number
    | null
) {
  return String(
    valor ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function normalizarItem(
  value: unknown
): BoletimItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const alunoId =
    numeroPositivo(
      value.alunoId
    );

  if (!alunoId) {
    return null;
  }

  return {
    alunoId,

    nome:
      typeof value.nome ===
      "string"
        ? value.nome
        : "",

    email:
      typeof value.email ===
      "string"
        ? value.email
        : null,

    nota:
      notaOuNull(
        value.nota
      ),

    status:
      typeof value.status ===
      "string"
        ? value.status
            .trim()
            .toUpperCase()
        : "",
  };
}

function normalizarResposta(
  value: unknown
): BoletimResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isRecord(value.turma) ||
    !isRecord(
      value.disciplina
    ) ||
    !isRecord(value.resumo) ||
    !Array.isArray(
      value.boletim
    )
  ) {
    return null;
  }

  const turmaId =
    numeroPositivo(
      value.turma.id
    );

  if (!turmaId) {
    return null;
  }

  const disciplinaIdRaw =
    value.disciplina.id;

  const disciplinaId =
    disciplinaIdRaw === null ||
    disciplinaIdRaw ===
      undefined
      ? null
      : numeroPositivo(
          disciplinaIdRaw
        );

  const boletim =
    value.boletim
      .map(
        normalizarItem
      )
      .filter(
        (
          item
        ): item is BoletimItem =>
          Boolean(item)
      );

  return {
    turma: {
      id:
        turmaId,

      nome:
        typeof value.turma
          .nome ===
        "string"
          ? value.turma.nome
          : "",
    },

    disciplina: {
      id:
        disciplinaId,

      nome:
        typeof value
          .disciplina
          .nome ===
        "string"
          ? value.disciplina
              .nome
          : "",
    },

    resumo: {
      totalAlunos:
        numeroFinito(
          value.resumo
            .totalAlunos,
          boletim.length
        ),

      mediaTurma:
        numeroFinito(
          value.resumo
            .mediaTurma
        ),

      melhorNota:
        numeroFinito(
          value.resumo
            .melhorNota
        ),

      piorNota:
        numeroFinito(
          value.resumo
            .piorNota
        ),
    },

    boletim,
  };
}

function statusClasse(
  status: string
) {
  if (
    status ===
    "APROVADO"
  ) {
    return "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200";
  }

  if (
    status ===
    "REPROVADO"
  ) {
    return "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200";
  }

  if (
    status ===
    "SEM PROVA"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

export default function BoletimTurmaPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const locale =
    useLocale();

  const t =
    useTranslations(
      "ProfessorClassGradebook"
    );

  const idTexto =
    String(
      params?.id || ""
    ).trim();

  const turmaId =
    /^\d+$/.test(
      idTexto
    )
      ? Number(idTexto)
      : 0;

  const [
    data,
    setData,
  ] =
    useState<BoletimResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    statusFiltro,
    setStatusFiltro,
  ] =
    useState<StatusFiltro>(
      "TODOS"
    );

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState(1);

  const formatadorNota =
    useMemo(
      () =>
        new Intl.NumberFormat(
          locale,
          {
            minimumFractionDigits:
              2,
            maximumFractionDigits:
              2,
          }
        ),
      [locale]
    );

  const formatarNota =
    useCallback(
      (
        nota:
          | number
          | null
          | undefined
      ) => {
        if (
          nota === null ||
          nota === undefined ||
          !Number.isFinite(
            nota
          )
        ) {
          return t(
            "common.notProvided"
          );
        }

        return formatadorNota.format(
          nota
        );
      },
      [
        formatadorNota,
        t,
      ]
    );

  const labelStatus =
    useCallback(
      (
        status: string
      ) => {
        switch (
          String(
            status || ""
          ).toUpperCase()
        ) {
          case "APROVADO":
            return t(
              "status.approved"
            );

          case "REPROVADO":
            return t(
              "status.failed"
            );

          case "SEM PROVA":
            return t(
              "status.noExam"
            );

          default:
            return t(
              "status.unknown"
            );
        }
      },
      [t]
    );

  const carregar =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            turmaId
          ) ||
          turmaId <= 0
        ) {
          setData(null);

          setErro(
            t(
              "feedback.invalidClass"
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
              `/api/professor/turmas/${turmaId}/boletim`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const json =
            await lerJson(
              res
            );

          if (!res.ok) {
            throw new Error(
              mensagemDaApi(
                json
              ) ||
                t(
                  "feedback.loadError"
                )
            );
          }

          const normalizada =
            normalizarResposta(
              json
            );

          if (!normalizada) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setData(
            normalizada
          );
        } catch (
          error: unknown
        ) {
          setData(null);

          setErro(
            error instanceof Error
              ? error.message
              : t(
                  "feedback.loadError"
                )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        turmaId,
        t,
      ]
    );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    busca,
    statusFiltro,
  ]);

  const disciplinas =
    useMemo(() => {
      const texto =
        data?.disciplina
          ?.nome || "";

      return texto
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);
    }, [data]);

  const boletimFiltrado =
    useMemo(() => {
      if (!data) {
        return [];
      }

      const termo =
        normalizarTexto(
          busca
        );

      return data.boletim.filter(
        (item) => {
          const status =
            String(
              item.status || ""
            ).toUpperCase();

          const passaStatus =
            statusFiltro ===
            "TODOS"
              ? true
              : status ===
                statusFiltro;

          const textoBusca =
            normalizarTexto(
              [
                item.nome,
                item.email,
                item.status,
                labelStatus(
                  item.status
                ),
                item.nota ===
                null
                  ? t(
                      "status.noExam"
                    )
                  : formatarNota(
                      item.nota
                    ),
              ].join(" ")
            );

          const passaBusca =
            !termo ||
            textoBusca.includes(
              termo
            );

          return (
            passaStatus &&
            passaBusca
          );
        }
      );
    }, [
      data,
      busca,
      statusFiltro,
      labelStatus,
      formatarNota,
      t,
    ]);

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        boletimFiltrado.length /
          ITENS_POR_PAGINA
      )
    );

  useEffect(() => {
    setPaginaAtual(
      (pagina) =>
        Math.min(
          Math.max(
            pagina,
            1
          ),
          totalPaginas
        )
    );
  }, [totalPaginas]);

  const boletimPaginado =
    useMemo(() => {
      const inicio =
        (paginaAtual - 1) *
        ITENS_POR_PAGINA;

      return boletimFiltrado.slice(
        inicio,
        inicio +
          ITENS_POR_PAGINA
      );
    }, [
      boletimFiltrado,
      paginaAtual,
    ]);

  const resumoStatus =
    useMemo(() => {
      const base =
        data?.boletim || [];

      return {
        todos:
          base.length,

        semProva:
          base.filter(
            (item) =>
              item.status ===
              "SEM PROVA"
          ).length,

        aprovados:
          base.filter(
            (item) =>
              item.status ===
              "APROVADO"
          ).length,

        reprovados:
          base.filter(
            (item) =>
              item.status ===
              "REPROVADO"
          ).length,
      };
    }, [data]);

  const filtros: {
    valor: StatusFiltro;
    label: string;
  }[] = [
    {
      valor: "TODOS",
      label: t(
        "filters.all",
        {
          count:
            resumoStatus.todos,
        }
      ),
    },
    {
      valor:
        "SEM PROVA",
      label: t(
        "filters.noExam",
        {
          count:
            resumoStatus.semProva,
        }
      ),
    },
    {
      valor:
        "APROVADO",
      label: t(
        "filters.approved",
        {
          count:
            resumoStatus.aprovados,
        }
      ),
    },
    {
      valor:
        "REPROVADO",
      label: t(
        "filters.failed",
        {
          count:
            resumoStatus.reprovados,
        }
      ),
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white md:p-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white md:p-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <p className="font-black">
              {t(
                "errorTitle"
              )}
            </p>

            <p className="mt-1">
              {erro}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
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
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              {t(
                "actions.back"
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white md:p-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-bold">
            {t(
              "notFound"
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
          >
            {t(
              "actions.back"
            )}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="phanyx-professor-boletim-page min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {t(
              "actions.back"
            )}
          </button>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <a
              href={`/api/professor/turmas/${turmaId}/boletim/csv`}
              download
              className="w-fit rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
            >
              {t(
                "actions.exportCsv"
              )}
            </a>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t(
                "exportHelp"
              )}
            </span>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {t(
                  "title",
                  {
                    className:
                      data.turma
                        .nome,
                  }
                )}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "description"
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <p className="font-bold text-slate-900 dark:text-white">
                {t(
                  "disciplines.count",
                  {
                    count:
                      disciplinas.length,
                  }
                )}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t(
                  "disciplines.linked"
                )}
              </p>
            </div>
          </div>

          <details className="boletim-disciplinas-box mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <summary className="boletim-disciplinas-summary cursor-pointer text-sm font-bold text-slate-800 dark:text-slate-100">
              {t(
                "disciplines.show"
              )}
            </summary>

            {disciplinas.length ===
            0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "disciplines.empty"
                )}
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {disciplinas.map(
                  (
                    disciplina,
                    index
                  ) => (
                    <span
                      key={`${disciplina}-${index}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {
                        disciplina
                      }
                    </span>
                  )
                )}
              </div>
            )}
          </details>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <ResumoCard
            label={t(
              "summary.totalStudents"
            )}
            valor={String(
              data.resumo
                .totalAlunos
            )}
          />

          <ResumoCard
            label={t(
              "summary.classAverage"
            )}
            valor={formatarNota(
              data.resumo
                .mediaTurma
            )}
          />

          <ResumoCard
            label={t(
              "summary.highestGrade"
            )}
            valor={formatarNota(
              data.resumo
                .melhorNota
            )}
            valorClasse="text-green-600 dark:text-green-300"
          />

          <ResumoCard
            label={t(
              "summary.lowestGrade"
            )}
            valor={formatarNota(
              data.resumo
                .piorNota
            )}
            valorClasse="text-red-600 dark:text-red-300"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                {t(
                  "students.title"
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "students.displaying",
                  {
                    filtered:
                      boletimFiltrado.length,
                    total:
                      data.boletim
                        .length,
                  }
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                type="search"
                value={busca}
                onChange={(
                  event
                ) =>
                  setBusca(
                    event.target
                      .value
                  )
                }
                placeholder={t(
                  "search.placeholder"
                )}
                aria-label={t(
                  "search.label"
                )}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 lg:w-[360px] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

              <div className="flex flex-wrap gap-2">
                {filtros.map(
                  ({
                    valor,
                    label,
                  }) => (
                    <button
                      key={
                        valor
                      }
                      type="button"
                      onClick={() =>
                        setStatusFiltro(
                          valor
                        )
                      }
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        statusFiltro ===
                        valor
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">
                    {t(
                      "table.student"
                    )}
                  </th>

                  <th className="px-4 py-3">
                    {t(
                      "table.email"
                    )}
                  </th>

                  <th className="px-4 py-3">
                    {t(
                      "table.grade"
                    )}
                  </th>

                  <th className="px-4 py-3">
                    {t(
                      "table.status"
                    )}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {boletimPaginado.map(
                  (item) => (
                    <tr
                      key={
                        item.alunoId
                      }
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-950 dark:text-white">
                          {
                            item.nome
                          }
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "table.studentId",
                            {
                              id:
                                item.alunoId,
                            }
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.email ||
                          t(
                            "common.notProvided"
                          )}
                      </td>

                      <td className="px-4 py-4 text-sm font-black text-slate-950 dark:text-white">
                        {formatarNota(
                          item.nota
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClasse(
                            item.status
                          )}`}
                        >
                          {labelStatus(
                            item.status
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}

                {boletimPaginado.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={
                        4
                      }
                      className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      {t(
                        "students.emptyFiltered"
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {boletimFiltrado.length >
            ITENS_POR_PAGINA && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "pagination.page",
                  {
                    current:
                      paginaAtual,
                    total:
                      totalPaginas,
                  }
                )}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    paginaAtual <=
                    1
                  }
                  onClick={() =>
                    setPaginaAtual(
                      (prev) =>
                        Math.max(
                          1,
                          prev -
                            1
                        )
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                  {t(
                    "pagination.previous"
                  )}
                </button>

                <button
                  type="button"
                  disabled={
                    paginaAtual >=
                    totalPaginas
                  }
                  onClick={() =>
                    setPaginaAtual(
                      (prev) =>
                        Math.min(
                          totalPaginas,
                          prev +
                            1
                        )
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                >
                  {t(
                    "pagination.next"
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResumoCard({
  label,
  valor,
  valorClasse = "text-slate-950 dark:text-white",
}: {
  label: string;
  valor: string;
  valorClasse?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${valorClasse}`}
      >
        {valor}
      </p>
    </div>
  );
}