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
import PhanyxToast from "@/components/ui/PhanyxToast";

type Entrega = {
  id: number;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string | null;
  corrigidaEm?: string | null;
  aluno?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;
  atividade?: {
    id: number;
    titulo: string;
    notaMaxima: number;
  } | null;
};

export default function CorrigirEntregaPage() {
  const params =
    useParams<{
      entregaId: string;
    }>();

  const t = useTranslations(
    "ProfessorSubmissionDetail"
  );

  const locale = useLocale();

  const entregaId = String(
    params?.entregaId || ""
  ).trim();

  const entregaValida =
    /^\d+$/.test(entregaId) &&
    Number(entregaId) > 0;

  const [
    entrega,
    setEntrega,
  ] = useState<Entrega | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erroCarregamento,
    setErroCarregamento,
  ] = useState("");

  const [
    erroAcao,
    setErroAcao,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    nota,
    setNota,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

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
    data?: string | null
  ) {
    if (!data) {
      return t(
        "date.notProvided"
      );
    }

    const valor =
      new Date(data);

    if (
      Number.isNaN(
        valor.getTime()
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
    ).format(valor);
  }

  const carregarEntrega =
    useCallback(
      async () => {
        if (!entregaValida) {
          setEntrega(null);

          setErroCarregamento(
            t(
              "feedback.invalidSubmission"
            )
          );

          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setErroCarregamento("");

          const res =
            await fetch(
              `/api/professor/entregas/${entregaId}`,
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
              const json =
                await res.json();

              if (
                typeof json?.error ===
                "string"
              ) {
                mensagem =
                  json.error;
              }
            } catch {
              // Mantém a mensagem traduzida.
            }

            throw new Error(
              mensagem
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

          const dados =
            json as Entrega;

          setEntrega(dados);

          setNota(
            dados.nota !==
                null &&
              dados.nota !==
                undefined
              ? String(
                  dados.nota
                )
              : ""
          );

          setFeedback(
            dados.feedback ||
              ""
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

          setErroCarregamento(
            mensagem
          );

          setEntrega(null);
        } finally {
          setLoading(false);
        }
      },
      [
        entregaId,
        entregaValida,
        t,
      ]
    );

  useEffect(() => {
    void carregarEntrega();
  }, [carregarEntrega]);

  async function salvar() {
    if (
      salvando ||
      !entrega
    ) {
      return;
    }

    setErroAcao("");
    setSucesso("");

    const notaTexto =
      nota.trim();

    let notaNumerica:
      | number
      | null = null;

    if (notaTexto) {
      notaNumerica =
        Number(notaTexto);

      if (
        !Number.isFinite(
          notaNumerica
        ) ||
        notaNumerica < 0
      ) {
        setErroAcao(
          t(
            "validation.invalidGrade"
          )
        );
        return;
      }

      const notaMaxima =
        entrega.atividade
          ?.notaMaxima;

      if (
        typeof notaMaxima ===
          "number" &&
        Number.isFinite(
          notaMaxima
        ) &&
        notaNumerica >
          notaMaxima
      ) {
        setErroAcao(
          t(
            "validation.gradeAboveMaximum",
            {
              maximum:
                formatadorNumero.format(
                  notaMaxima
                ),
            }
          )
        );
        return;
      }
    }

    const atividadeId =
      entrega.atividade?.id;

    const alunoId =
      entrega.aluno?.id;

    if (
      !atividadeId ||
      !alunoId
    ) {
      setErroAcao(
        t(
          "feedback.missingCorrectionData"
        )
      );
      return;
    }

    try {
      setSalvando(true);

      const res =
        await fetch(
          `/api/professor/atividades/${atividadeId}/corrigir`,
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
                alunoId,
                nota:
                  notaNumerica,
                feedback:
                  feedback.trim(),
              }
            ),
          }
        );

      if (!res.ok) {
        let mensagem =
          t(
            "feedback.saveError"
          );

        try {
          const json =
            await res.json();

          if (
            typeof json?.error ===
            "string"
          ) {
            mensagem =
              json.error;
          }
        } catch {
          // Mantém a mensagem traduzida.
        }

        throw new Error(
          mensagem
        );
      }

      setSucesso(
        t(
          "feedback.saveSuccess"
        )
      );

      await carregarEntrega();
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.saveError"
            );

      setErroAcao(
        mensagem
      );
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      </div>
    );
  }

  if (
    erroCarregamento
  ) {
    return (
      <div className="p-6 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-950/40">
          <p className="font-semibold text-red-700 dark:text-red-300">
            {t(
              "errorTitle"
            )}
          </p>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {
              erroCarregamento
            }
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                void carregarEntrega()
              }
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {t(
                "actions.retry"
              )}
            </button>

            <Link
              href="/professor/entregas"
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              {t(
                "actions.back"
              )}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!entrega) {
    return (
      <div className="p-6 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-4xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {t("notFound")}
        </div>
      </div>
    );
  }

  const nomeAluno =
    entrega.aluno?.nome?.trim() ||
    entrega.aluno?.email?.trim() ||
    (entrega.aluno?.id
      ? t(
          "studentFallbackWithId",
          {
            id:
              entrega.aluno.id,
          }
        )
      : t(
          "studentFallback"
        ));

  const notaMaxima =
    entrega.atividade
      ?.notaMaxima;

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {sucesso && (
          <PhanyxToast
            tipo="sucesso"
            titulo={t(
              "toast.successTitle"
            )}
            mensagem={sucesso}
            onClose={() =>
              setSucesso("")
            }
          />
        )}

        {erroAcao && (
          <PhanyxToast
            tipo="erro"
            titulo={t(
              "toast.errorTitle"
            )}
            mensagem={
              erroAcao
            }
            onClose={() =>
              setErroAcao("")
            }
          />
        )}

        <Link
          href="/professor/entregas"
          className="inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t(
            "actions.back"
          )}
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {entrega.atividade
              ?.titulo ||
              t(
                "activityFallback"
              )}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {t(
                  "fields.student"
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {nomeAluno}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {t(
                  "fields.submittedAt"
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {formatarData(
                  entrega.entregueEm
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {t(
                  "fields.maximumGrade"
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {typeof notaMaxima ===
                  "number"
                  ? formatadorNumero.format(
                      notaMaxima
                    )
                  : t(
                      "grade.notProvided"
                    )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {t(
                  "fields.correctedAt"
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {formatarData(
                  entrega.corrigidaEm
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {t(
                "content.text"
              )}
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
              {entrega.texto ||
                t(
                  "content.empty"
                )}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {t(
                "content.link"
              )}
            </p>

            {entrega.link ? (
              <a
                href={
                  entrega.link
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block break-all text-sm font-semibold text-blue-600 transition hover:underline dark:text-blue-400"
              >
                {t(
                  "actions.openLink"
                )}
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "content.empty"
                )}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {t(
                "content.file"
              )}
            </p>

            {entrega.arquivoUrl ? (
              <a
                href={
                  entrega.arquivoUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {t(
                  "actions.openFile"
                )}
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "content.empty"
                )}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
              {t(
                "correction.eyebrow"
              )}
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {t(
                "correction.title"
              )}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "correction.description"
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="entrega-nota"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              {t(
                "fields.grade"
              )}
            </label>

            <input
              id="entrega-nota"
              type="number"
              min="0"
              max={
                typeof notaMaxima ===
                  "number"
                  ? notaMaxima
                  : undefined
              }
              step="0.1"
              value={nota}
              onChange={(event) =>
                setNota(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder={t(
                "fields.gradePlaceholder"
              )}
            />

            {typeof notaMaxima ===
              "number" && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t(
                  "fields.maximumGradeHelp",
                  {
                    maximum:
                      formatadorNumero.format(
                        notaMaxima
                      ),
                  }
                )}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="entrega-feedback"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              {t(
                "fields.feedback"
              )}
            </label>

            <textarea
              id="entrega-feedback"
              value={feedback}
              onChange={(event) =>
                setFeedback(
                  event.target.value
                )
              }
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              rows={5}
              placeholder={t(
                "fields.feedbackPlaceholder"
              )}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={salvar}
              disabled={
                salvando
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando
                ? t(
                    "actions.saving"
                  )
                : t(
                    "actions.save"
                  )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}