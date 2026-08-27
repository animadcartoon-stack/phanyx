"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfessor } from "@/app/context/ProfessorContext";

export default function NovaDisciplina() {
  const { criarDisciplina } =
    useProfessor();

  const router = useRouter();

  const t = useTranslations(
    "ProfessorNewDiscipline"
  );

  const [
    nome,
    setNome,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    professorEmail,
    setProfessorEmail,
  ] = useState("");

  const [
    cargaHoraria,
    setCargaHoraria,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  function emailValido(
    valor: string
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      valor
    );
  }

  function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (salvando) {
      return;
    }

    setErro("");

    const nomeNormalizado =
      nome.trim();

    const descricaoNormalizada =
      descricao.trim();

    const emailNormalizado =
      professorEmail
        .trim()
        .toLowerCase();

    const carga =
      Number(cargaHoraria);

    if (!nomeNormalizado) {
      setErro(
        t(
          "validation.nameRequired"
        )
      );
      return;
    }

    if (!emailNormalizado) {
      setErro(
        t(
          "validation.emailRequired"
        )
      );
      return;
    }

    if (
      !emailValido(
        emailNormalizado
      )
    ) {
      setErro(
        t(
          "validation.invalidEmail"
        )
      );
      return;
    }

    if (
      !Number.isFinite(carga) ||
      carga < 0
    ) {
      setErro(
        t(
          "validation.invalidWorkload"
        )
      );
      return;
    }

    try {
      setSalvando(true);

      const id =
        criarDisciplina(
          nomeNormalizado,
          emailNormalizado,
          carga,
          descricaoNormalizada
        );

      const disciplinaId =
        Number(id);

      if (
        !Number.isFinite(
          disciplinaId
        ) ||
        disciplinaId <= 0
      ) {
        throw new Error(
          t(
            "feedback.createError"
          )
        );
      }

      router.push(
        `/professor/disciplinas/${disciplinaId}`
      );
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
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 text-slate-900 dark:text-slate-100">
      <button
        onClick={() =>
          router.back()
        }
        className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        type="button"
      >
        {t("back")}
      </button>

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
        <div
          aria-live="assertive"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
        >
          {erro}
        </div>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label
            htmlFor="disciplina-nome"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.name"
            )}
          </label>

          <input
            id="disciplina-nome"
            value={nome}
            onChange={(e) =>
              setNome(
                e.target.value
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            placeholder={t(
              "fields.namePlaceholder"
            )}
            required
          />
        </div>

        <div>
          <label
            htmlFor="disciplina-descricao"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.description"
            )}
          </label>

          <textarea
            id="disciplina-descricao"
            value={descricao}
            onChange={(e) =>
              setDescricao(
                e.target.value
              )
            }
            rows={5}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            placeholder={t(
              "fields.descriptionPlaceholder"
            )}
          />
        </div>

        <div>
          <label
            htmlFor="disciplina-professor-email"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.professorEmail"
            )}
          </label>

          <input
            id="disciplina-professor-email"
            type="email"
            value={
              professorEmail
            }
            onChange={(e) =>
              setProfessorEmail(
                e.target.value
              )
            }
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            placeholder={t(
              "fields.professorEmailPlaceholder"
            )}
            required
          />

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t(
              "fields.professorEmailHelp"
            )}
          </p>
        </div>

        <div>
          <label
            htmlFor="disciplina-carga-horaria"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {t(
              "fields.workload"
            )}
          </label>

          <div className="mt-2 flex items-center gap-3">
            <input
              id="disciplina-carga-horaria"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={
                cargaHoraria
              }
              onChange={(e) =>
                setCargaHoraria(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              placeholder={t(
                "fields.workloadPlaceholder"
              )}
              required
            />

            <span className="shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">
              {t(
                "fields.hours"
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            disabled={
              salvando
            }
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t(
              "actions.cancel"
            )}
          </button>

          <button
            type="submit"
            disabled={
              salvando
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando
              ? t(
                  "actions.creating"
                )
              : t(
                  "actions.create"
                )}
          </button>
        </div>
      </form>
    </div>
  );
}