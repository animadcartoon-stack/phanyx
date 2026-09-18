"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

export default function AdminNotasPage() {
  const t =
    useTranslations("AdminGrades");

  const [
    disciplinas,
    setDisciplinas,
  ] = useState<any[]>([]);

  const [
    alunos,
    setAlunos,
  ] = useState<any[]>([]);

  const [
    notas,
    setNotas,
  ] = useState<any[]>([]);

  const [
    disciplinaId,
    setDisciplinaId,
  ] = useState("");

  const [
    alunoId,
    setAlunoId,
  ] = useState("");

  const [
    valor,
    setValor,
  ] = useState("");

  useEffect(() => {
    fetch("/api/disciplina")
      .then((res) => res.json())
      .then(setDisciplinas);
  }, []);

  useEffect(() => {
    if (!disciplinaId) {
      setAlunos([]);
      setNotas([]);
      return;
    }

    fetch(
      `/api/matricula?disciplinaId=${disciplinaId}`
    )
      .then((res) => res.json())
      .then(setAlunos);

    fetch(
      `/api/nota?disciplinaId=${disciplinaId}`
    )
      .then((res) => res.json())
      .then(setNotas);
  }, [disciplinaId]);

  async function salvarNota(
    e: React.FormEvent
  ) {
    e.preventDefault();

    await fetch("/api/nota", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        alunoId:
          Number(alunoId),
        disciplinaId:
          Number(disciplinaId),
        valor:
          Number(valor),
      }),
    });

    setValor("");

    const res =
      await fetch(
        `/api/nota?disciplinaId=${disciplinaId}`
      );

    setNotas(
      await res.json()
    );
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

      <form
        onSubmit={salvarNota}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold">
            {t(
              "fields.discipline"
            )}
          </label>

          <select
            value={disciplinaId}
            onChange={(e) =>
              setDisciplinaId(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">
              {t(
                "fields.selectDiscipline"
              )}
            </option>

            {disciplinas.map(
              (d: any) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.nome}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            {t(
              "fields.student"
            )}
          </label>

          <select
            value={alunoId}
            onChange={(e) =>
              setAlunoId(
                e.target.value
              )
            }
            disabled={
              !disciplinaId
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">
              {t(
                "fields.selectStudent"
              )}
            </option>

            {alunos.map(
              (a: any) => (
                <option
                  key={
                    a.aluno.id
                  }
                  value={
                    a.aluno.id
                  }
                >
                  {a.aluno.nome}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            {t(
              "fields.grade"
            )}
          </label>

          <input
            type="number"
            step="0.1"
            value={valor}
            onChange={(e) =>
              setValor(
                e.target.value
              )
            }
            placeholder={t(
              "fields.gradePlaceholder"
            )}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={
            !disciplinaId ||
            !alunoId ||
            !valor
          }
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(
            "actions.save"
          )}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">
          {t("list.title")}
        </h2>

        {!disciplinaId ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t(
              "list.selectDiscipline"
            )}
          </div>
        ) : notas.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("list.empty")}
          </div>
        ) : (
          notas.map(
            (n: any) => (
              <div
                key={n.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="font-semibold">
                  {n.aluno.nome}
                </span>

                <span className="text-slate-500 dark:text-slate-400">
                  {" — "}
                  {t(
                    "list.gradeValue",
                    {
                      value:
                        n.valor,
                    }
                  )}
                </span>
              </div>
            )
          )
        )}
      </section>
    </main>
  );
}
