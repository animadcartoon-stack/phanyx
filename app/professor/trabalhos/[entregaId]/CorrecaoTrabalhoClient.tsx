"use client";

import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Historico = {
  id: number;
  versao: number;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  entregueEm?: string | null;
};

type Trabalho = {
  entregaId: number;
  titulo: string;
  descricao?: string | null;
  notaMaxima: number;
  prazo?: string | null;
  aluno: string;
  matricula?: string | null;
  curso?: string | null;
  turma: string;
  semestre: string;
  periodoLetivo: string;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string | null;
  corrigidaEm?: string | null;
  historicos?: Historico[];
  status: string;
};

type Props = {
  entregaId: number;
};

type FeedbackTipo =
  | "erro"
  | "sucesso"
  | "";

export default function CorrecaoTrabalhoClient({
  entregaId,
}: Props) {
  const t = useTranslations(
    "ProfessorWorkSubmissionDetail"
  );

  const locale = useLocale();

  const [
    trabalho,
    setTrabalho,
  ] = useState<Trabalho | null>(
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
    feedbackTela,
    setFeedbackTela,
  ] = useState<{
    tipo: FeedbackTipo;
    mensagem: string;
  }>({
    tipo: "",
    mensagem: "",
  });

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

  const entregaIdValido =
    Number.isInteger(
      entregaId
    ) && entregaId > 0;

  function formatarData(
    data?: string | null
  ) {
    if (!data) {
      return t(
        "common.notProvided"
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
        "common.notProvided"
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

  function formatarNumero(
    valor: number
  ) {
    return formatadorNumero.format(
      valor
    );
  }

  const carregarTrabalho =
    useCallback(
      async () => {
        if (
          !entregaIdValido
        ) {
          setTrabalho(null);

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
              `/api/professor/trabalhos/${entregaId}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          let json: unknown =
            null;

          try {
            json =
              await res.json();
          } catch {
            json = null;
          }

          if (!res.ok) {
            const mensagem =
              json &&
              typeof json ===
                "object" &&
              "error" in json &&
              typeof (
                json as {
                  error?: unknown;
                }
              ).error ===
                "string"
                ? String(
                    (
                      json as {
                        error: string;
                      }
                    ).error
                  )
                : t(
                    "feedback.loadError"
                  );

            throw new Error(
              mensagem
            );
          }

          if (
            !json ||
            typeof json !==
              "object" ||
            !(
              "trabalho" in json
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          const dados =
            (
              json as {
                trabalho?: Trabalho | null;
              }
            ).trabalho ??
            null;

          if (!dados) {
            setTrabalho(null);

            setErroCarregamento(
              t(
                "feedback.notFound"
              )
            );

            return;
          }

          setTrabalho(dados);

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
            dados.feedback ??
              ""
          );
        } catch (
          error: unknown
        ) {
          setTrabalho(null);

          setErroCarregamento(
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
        entregaId,
        entregaIdValido,
        t,
      ]
    );

  useEffect(() => {
    void carregarTrabalho();
  }, [carregarTrabalho]);

  async function salvarCorrecao() {
    if (
      !trabalho ||
      salvando
    ) {
      return;
    }

    setFeedbackTela({
      tipo: "",
      mensagem: "",
    });

    const notaTexto =
      nota.trim();

    if (!notaTexto) {
      setFeedbackTela({
        tipo: "erro",
        mensagem: t(
          "validation.gradeRequired"
        ),
      });
      return;
    }

    const notaNumerica =
      Number(notaTexto);

    if (
      !Number.isFinite(
        notaNumerica
      ) ||
      notaNumerica < 0
    ) {
      setFeedbackTela({
        tipo: "erro",
        mensagem: t(
          "validation.invalidGrade"
        ),
      });
      return;
    }

    if (
      notaNumerica >
      trabalho.notaMaxima
    ) {
      setFeedbackTela({
        tipo: "erro",
        mensagem: t(
          "validation.gradeAboveMaximum",
          {
            maximum:
              formatarNumero(
                trabalho.notaMaxima
              ),
          }
        ),
      });
      return;
    }

    try {
      setSalvando(true);

      const resp =
        await fetch(
          "/api/professor/trabalhos",
          {
            method: "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                entregaId:
                  trabalho.entregaId,

                nota:
                  notaNumerica,

                feedback:
                  feedback.trim(),
              }
            ),
          }
        );

      let json: unknown =
        null;

      try {
        json =
          await resp.json();
      } catch {
        json = null;
      }

      if (!resp.ok) {
        const mensagem =
          json &&
          typeof json ===
            "object" &&
          "error" in json &&
          typeof (
            json as {
              error?: unknown;
            }
          ).error ===
            "string"
            ? String(
                (
                  json as {
                    error: string;
                  }
                ).error
              )
            : t(
                "feedback.saveError"
              );

        throw new Error(
          mensagem
        );
      }

      await carregarTrabalho();

      setFeedbackTela({
        tipo: "sucesso",
        mensagem: t(
          "feedback.saveSuccess"
        ),
      });
    } catch (
      error: unknown
    ) {
      setFeedbackTela({
        tipo: "erro",
        mensagem:
          error instanceof Error
            ? error.message
            : t(
                "feedback.saveError"
              ),
      });
    } finally {
      setSalvando(false);
    }
  }

  function statusTraduzido(
    status: string
  ) {
    const normalizado =
      status
        .trim()
        .toLocaleLowerCase();

    if (
      normalizado ===
      "enviado"
    ) {
      return t(
        "status.sent"
      );
    }

    if (
      normalizado ===
      "avaliado"
    ) {
      return t(
        "status.graded"
      );
    }

    if (
      normalizado ===
        "revisao" ||
      normalizado ===
        "revisão"
    ) {
      return t(
        "status.review"
      );
    }

    return status;
  }

  function classeStatus(
    status: string
  ) {
    const normalizado =
      status
        .trim()
        .toLocaleLowerCase();

    if (
      normalizado ===
      "enviado"
    ) {
      return "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
    }

    if (
      normalizado ===
      "avaliado"
    ) {
      return "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    }

    if (
      normalizado ===
        "revisao" ||
      normalizado ===
        "revisão"
    ) {
      return "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
    }

    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }

  return (
    <main className="phanyx-professor-correcao-page space-y-6 p-4 text-slate-900 dark:text-slate-100">
      <div>
        <Link
          href="/professor/trabalhos"
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {t(
            "actions.back"
          )}
        </Link>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("loading")}
        </div>
      )}

      {!loading &&
        erroCarregamento && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/40">
            <p className="font-bold text-red-800 dark:text-red-200">
              {t(
                "errorTitle"
              )}
            </p>

            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {
                erroCarregamento
              }
            </p>

            <button
              type="button"
              onClick={() =>
                void carregarTrabalho()
              }
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              {t(
                "actions.retry"
              )}
            </button>
          </div>
        )}

      {!loading &&
        !erroCarregamento &&
        trabalho && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                    {t(
                      "eyebrow"
                    )}
                  </p>

                  <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                    {t(
                      "title"
                    )}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "submissionReference",
                      {
                        id:
                          trabalho.entregaId,
                      }
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <HeaderInfo
                    titulo={t(
                      "fields.student"
                    )}
                    valor={
                      trabalho.aluno
                    }
                  />

                  <HeaderInfo
                    titulo={t(
                      "fields.class"
                    )}
                    valor={
                      trabalho.turma
                    }
                  />

                  <HeaderInfo
                    titulo={t(
                      "fields.course"
                    )}
                    valor={
                      trabalho.curso ||
                      t(
                        "common.notProvided"
                      )
                    }
                  />

                  <div className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                      {t(
                        "fields.status"
                      )}
                    </p>

                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classeStatus(
                          trabalho.status
                        )}`}
                      >
                        {statusTraduzido(
                          trabalho.status
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <InfoCard
                titulo={t(
                  "fields.submittedAt"
                )}
                valor={formatarData(
                  trabalho.entregueEm
                )}
              />

              <InfoCard
                titulo={t(
                  "fields.correctedAt"
                )}
                valor={formatarData(
                  trabalho.corrigidaEm
                )}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card
                titulo={t(
                  "activity.title"
                )}
              >
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-100">
                      {t(
                        "fields.activityTitle"
                      )}
                      :
                    </strong>{" "}
                    {
                      trabalho.titulo
                    }
                  </p>

                  <p>
                    <strong className="text-slate-800 dark:text-slate-100">
                      {t(
                        "fields.maximumGrade"
                      )}
                      :
                    </strong>{" "}
                    {formatarNumero(
                      trabalho.notaMaxima
                    )}
                  </p>

                  <p>
                    <strong className="text-slate-800 dark:text-slate-100">
                      {t(
                        "fields.deadline"
                      )}
                      :
                    </strong>{" "}
                    {formatarData(
                      trabalho.prazo
                    )}
                  </p>

                  <div className="whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    {trabalho.descricao ||
                      t(
                        "activity.noDescription"
                      )}
                  </div>
                </div>
              </Card>

              <Card
                titulo={t(
                  "academic.title"
                )}
              >
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <AcademicLine
                    label={t(
                      "fields.enrollment"
                    )}
                    value={
                      trabalho.matricula ||
                      t(
                        "common.notProvided"
                      )
                    }
                  />

                  <AcademicLine
                    label={t(
                      "fields.course"
                    )}
                    value={
                      trabalho.curso ||
                      t(
                        "common.notProvided"
                      )
                    }
                  />

                  <AcademicLine
                    label={t(
                      "fields.class"
                    )}
                    value={
                      trabalho.turma ||
                      t(
                        "common.notProvided"
                      )
                    }
                  />

                  <AcademicLine
                    label={t(
                      "fields.semester"
                    )}
                    value={
                      trabalho.semestre ||
                      t(
                        "common.notProvided"
                      )
                    }
                  />

                  <AcademicLine
                    label={t(
                      "fields.academicPeriod"
                    )}
                    value={
                      trabalho.periodoLetivo ||
                      t(
                        "common.notProvided"
                      )
                    }
                  />
                </div>
              </Card>
            </section>

            <Card
              titulo={t(
                "submission.title"
              )}
            >
              <div className="space-y-4">
                <div className="whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {trabalho.texto ||
                    t(
                      "submission.noText"
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {trabalho.link ? (
                    <a
                      href={
                        trabalho.link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      🌐{" "}
                      {t(
                        "actions.openSubmittedLink"
                      )}
                    </a>
                  ) : (
                    <span className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {t(
                        "submission.noLink"
                      )}
                    </span>
                  )}

                  {trabalho.arquivoUrl ? (
                    <a
                      href={
                        trabalho.arquivoUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                      📎{" "}
                      {t(
                        "actions.openSubmittedFile"
                      )}
                    </a>
                  ) : (
                    <span className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {t(
                        "submission.noFile"
                      )}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <Card
              titulo={t(
                "grading.title"
              )}
            >
              <div className="grid gap-4">
                {feedbackTela.mensagem && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                      feedbackTela.tipo ===
                      "sucesso"
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {
                      feedbackTela.mensagem
                    }
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="nota-trabalho"
                      className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                    >
                      {t(
                        "fields.grade"
                      )}
                    </label>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {t(
                        "grading.maximumGrade",
                        {
                          maximum:
                            formatarNumero(
                              trabalho.notaMaxima
                            ),
                        }
                      )}
                    </span>
                  </div>

                  <input
                    id="nota-trabalho"
                    type="number"
                    min={0}
                    max={
                      trabalho.notaMaxima
                    }
                    step="0.1"
                    value={nota}
                    onChange={(
                      event
                    ) =>
                      setNota(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder={t(
                      "grading.gradePlaceholder"
                    )}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "grading.gradeHelp",
                      {
                        maximum:
                          formatarNumero(
                            trabalho.notaMaxima
                          ),
                      }
                    )}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="feedback-trabalho"
                    className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                  >
                    {t(
                      "fields.feedback"
                    )}
                  </label>

                  <textarea
                    id="feedback-trabalho"
                    rows={6}
                    value={feedback}
                    onChange={(
                      event
                    ) =>
                      setFeedback(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder={t(
                      "grading.feedbackPlaceholder"
                    )}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={
                      salvarCorrecao
                    }
                    disabled={
                      salvando
                    }
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              </div>
            </Card>

            <Card
              titulo={t(
                "history.title"
              )}
            >
              {trabalho.historicos &&
              trabalho.historicos
                .length > 0 ? (
                <div className="space-y-3">
                  {trabalho.historicos.map(
                    (
                      historico
                    ) => (
                      <div
                        key={
                          historico.id
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <p className="font-black text-slate-900 dark:text-white">
                          {t(
                            "history.version",
                            {
                              version:
                                historico.versao,
                            }
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "history.submittedAt",
                            {
                              date: formatarData(
                                historico.entregueEm
                              ),
                            }
                          )}
                        </p>

                        {historico.texto && (
                          <p className="mt-3 whitespace-pre-line text-slate-700 dark:text-slate-300">
                            {
                              historico.texto
                            }
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-3">
                          {historico.link && (
                            <a
                              href={
                                historico.link
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {t(
                                "actions.openLink"
                              )}
                            </a>
                          )}

                          {historico.arquivoUrl && (
                            <a
                              href={
                                historico.arquivoUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {t(
                                "actions.openFile"
                              )}
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {t(
                    "history.empty"
                  )}
                </div>
              )}
            </Card>
          </>
        )}
    </main>
  );
}

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">
        {titulo}
      </h2>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

function InfoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">
        {valor}
      </p>
    </section>
  );
}

function HeaderInfo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="font-bold text-slate-900 dark:text-white">
        {valor}
      </p>
    </div>
  );
}

function AcademicLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p>
      <strong className="text-slate-800 dark:text-slate-100">
        {label}:
      </strong>{" "}
      {value}
    </p>
  );
}