"use client";

import {
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type Disciplina = {
  nome: string;
  totalAulas: number;
  assistidas: number;
};

export default function ProgressoAlunoPage() {
  const t =
    useTranslations("AdminProgress");

  const [aluno] =
    useState(
      "João da Silva"
    );

  const [
    disciplinas,
    setDisciplinas,
  ] = useState<Disciplina[]>([]);

  function assistirAula(
    index: number
  ) {
    const novas =
      [...disciplinas];

    if (
      novas[index].assistidas <
      novas[index].totalAulas
    ) {
      novas[index].assistidas += 1;
      setDisciplinas(novas);
    }
  }

  return (
    <main className="space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">
          {t("header.title")}
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t(
            "header.description"
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <strong>
          {t("student.label")}:
        </strong>{" "}
        {aluno}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-5 bg-slate-100 p-3 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span>
              {t(
                "table.discipline"
              )}
            </span>

            <span>
              {t(
                "table.lessons"
              )}
            </span>

            <span>
              {t(
                "table.watched"
              )}
            </span>

            <span>
              {t(
                "table.progress"
              )}
            </span>

            <span>
              {t(
                "table.action"
              )}
            </span>
          </div>

          {disciplinas.map(
            (d, i) => {
              const progresso =
                d.totalAulas > 0
                  ? Math.round(
                      (
                        d.assistidas /
                        d.totalAulas
                      ) * 100
                    )
                  : 0;

              return (
                <div
                  key={i}
                  className="grid grid-cols-5 items-center border-t border-slate-200 p-3 dark:border-slate-700"
                >
                  <span>
                    {d.nome}
                  </span>

                  <span>
                    {d.totalAulas}
                  </span>

                  <span>
                    {d.assistidas}
                  </span>

                  <div className="mr-4 h-4 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-4 rounded bg-green-600"
                      style={{
                        width:
                          `${progresso}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      assistirAula(i)
                    }
                    className="w-fit rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {t(
                      "actions.addLesson"
                    )}
                  </button>
                </div>
              );
            }
          )}

          {disciplinas.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("table.empty")}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
