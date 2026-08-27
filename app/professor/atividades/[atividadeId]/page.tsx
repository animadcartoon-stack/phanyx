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

type EntregaItem = {
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
  } | null;
};

type AtividadeDetalhe = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima: number;
  status: string;
  disciplina?: {
    id: number;
    nome?: string | null;
    titulo?: string | null;
  } | null;
  turma?: {
    id: number;
    nome?: string | null;
  } | null;
  entregas?: EntregaItem[];
};

type AcaoAtividade =
  | "publicar"
  | "rascunho"
  | "encerrar"
  | null;

export default function ProfessorAtividadeDetalhePage() {
  const params = useParams();

  const atividadeId = String(
    params?.atividadeId || ""
  );

  const t = useTranslations(
    "ProfessorActivityDetail"
  );

  const locale = useLocale();

  const [
    atividade,
    setAtividade,
  ] =
    useState<AtividadeDetalhe | null>(
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

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    acaoLoading,
    setAcaoLoading,
  ] =
    useState<AcaoAtividade>(
      null
    );

  const formatadorData =
    useMemo(
      () =>
        new Intl.DateTimeFormat(
          locale,
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ),
      [locale]
    );

  const formatadorNumero =
    useMemo(
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

  const carregarAtividade =
    useCallback(
      async () => {
        if (!atividadeId) {
          setAtividade(null);
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

          const res =
            await fetch(
              `/api/professor/atividades/${atividadeId}`,
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
            !json.id
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          const atividadeRecebida =
            json as AtividadeDetalhe;

          setAtividade({
            ...atividadeRecebida,
            entregas:
              Array.isArray(
                atividadeRecebida.entregas
              )
                ? atividadeRecebida.entregas
                : [],
          });
        } catch (
          error: unknown
        ) {
          const mensagemErro =
            error instanceof Error
              ? error.message
              : t(
                  "feedback.loadError"
                );

          setAtividade(null);
          setErro(
            mensagemErro
          );
        } finally {
          setLoading(false);
        }
      },
      [atividadeId, t]
    );

  useEffect(() => {
    void carregarAtividade();
  }, [carregarAtividade]);

  useEffect(() => {
    if (!mensagem) {
      return;
    }

    const timer =
      setTimeout(() => {
        setMensagem("");
      }, 3500);

    return () =>
      clearTimeout(timer);
  }, [mensagem]);

  function formatarData(
    valor?: string | null
  ) {
    if (!valor) {
      return t(
        "dates.noDate"
      );
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return t(
        "dates.noDate"
      );
    }

    return formatadorData.format(
      data
    );
  }

  function formatarNumero(
    valor:
      | number
      | null
      | undefined
  ) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "—";
    }

    return formatadorNumero.format(
      valor
    );
  }

  function getStatusBadge(
    status: string
  ) {
    const valor = String(
      status || ""
    )
      .trim()
      .toUpperCase();

    if (
      valor === "PUBLICADA"
    ) {
      return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300";
    }

    if (
      valor === "ENCERRADA"
    ) {
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
    }

    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  }

  function getStatusLabel(
    status: string
  ) {
    const valor = String(
      status || ""
    )
      .trim()
      .toUpperCase();

    if (
      valor === "PUBLICADA"
    ) {
      return t(
        "status.published"
      );
    }

    if (
      valor === "ENCERRADA"
    ) {
      return t(
        "status.closed"
      );
    }

    if (
      valor === "RASCUNHO"
    ) {
      return t(
        "status.draft"
      );
    }

    return t(
      "status.unknown"
    );
  }

  function nomeAluno(
    entrega: EntregaItem
  ) {
    const nome =
      entrega.aluno?.nome?.trim();

    if (nome) {
      return nome;
    }

    if (
      entrega.aluno?.id !==
      undefined &&
      entrega.aluno?.id !==
      null
    ) {
      return t(
        "studentFallback",
        {
          id:
            entrega.aluno.id,
        }
      );
    }

    return t(
      "studentUnknown"
    );
  }

  async function voltarParaRascunho() {
    try {
      setAcaoLoading(
        "rascunho"
      );
      setMensagem("");
      setErro("");

      const res =
        await fetch(
          `/api/professor/atividades/${atividadeId}/rascunho`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.unpublishError"
          )
        );
      }

      setMensagem(
        t(
          "feedback.unpublishSuccess"
        )
      );

      await carregarAtividade();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.unpublishError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setAcaoLoading(
        null
      );
    }
  }

  async function publicarAtividade() {
    try {
      setAcaoLoading(
        "publicar"
      );
      setMensagem("");
      setErro("");

      const res =
        await fetch(
          `/api/professor/atividades/${atividadeId}/publicar`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.publishError"
          )
        );
      }

      setMensagem(
        t(
          "feedback.publishSuccess"
        )
      );

      await carregarAtividade();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.publishError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setAcaoLoading(
        null
      );
    }
  }

  async function encerrarAtividade() {
    try {
      setAcaoLoading(
        "encerrar"
      );
      setMensagem("");
      setErro("");

      const res =
        await fetch(
          `/api/professor/atividades/${atividadeId}/encerrar`,
          {
            method: "POST",
            credentials:
              "include",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.closeError"
          )
        );
      }

      setMensagem(
        t(
          "feedback.closeSuccess"
        )
      );

      await carregarAtividade();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.closeError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setAcaoLoading(
        null
      );
    }
  }

  return (
    <div className="phanyx-professor-atividade-detalhe p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Link
            href="/professor/atividades"
            className="inline-block text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("back")}
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("loading")}
          </div>
        )}

        {!loading &&
          erro &&
          !atividade && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-950/40">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {erro}
              </p>

              <button
                type="button"
                onClick={() =>
                  void carregarAtividade()
                }
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {t(
                  "actions.retry"
                )}
              </button>
            </div>
          )}

        {!loading &&
          atividade && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {
                          atividade.titulo
                        }
                      </h1>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(
                          atividade.status
                        )}`}
                      >
                        {getStatusLabel(
                          atividade.status
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>
                        <strong className="font-medium text-slate-700 dark:text-slate-200">
                          {t(
                            "details.subject"
                          )}
                        </strong>{" "}
                        {atividade
                          .disciplina
                          ?.nome ||
                          atividade
                            .disciplina
                            ?.titulo ||
                          t(
                            "details.notProvided"
                          )}
                      </span>

                      <span>
                        <strong className="font-medium text-slate-700 dark:text-slate-200">
                          {t(
                            "details.deadline"
                          )}
                        </strong>{" "}
                        {formatarData(
                          atividade.prazo
                        )}
                      </span>

                      <span>
                        <strong className="font-medium text-slate-700 dark:text-slate-200">
                          {t(
                            "details.maximumGrade"
                          )}
                        </strong>{" "}
                        {formatarNumero(
                          atividade.notaMaxima
                        )}
                      </span>

                      {atividade
                        .turma
                        ?.nome && (
                        <span>
                          <strong className="font-medium text-slate-700 dark:text-slate-200">
                            {t(
                              "details.class"
                            )}
                          </strong>{" "}
                          {
                            atividade
                              .turma
                              .nome
                          }
                        </span>
                      )}
                    </div>

                    {atividade.descricao && (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {
                          atividade.descricao
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {atividade.status ===
                      "RASCUNHO" && (
                      <button
                        type="button"
                        onClick={
                          publicarAtividade
                        }
                        disabled={
                          acaoLoading !==
                          null
                        }
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {acaoLoading ===
                        "publicar"
                          ? t(
                              "actions.publishing"
                            )
                          : t(
                              "actions.publish"
                            )}
                      </button>
                    )}

                    {atividade.status ===
                      "PUBLICADA" && (
                      <>
                        <button
                          type="button"
                          onClick={
                            voltarParaRascunho
                          }
                          disabled={
                            acaoLoading !==
                            null
                          }
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {acaoLoading ===
                          "rascunho"
                            ? t(
                                "actions.unpublishing"
                              )
                            : t(
                                "actions.unpublish"
                              )}
                        </button>

                        <button
                          type="button"
                          onClick={
                            encerrarAtividade
                          }
                          disabled={
                            acaoLoading !==
                            null
                          }
                          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {acaoLoading ===
                          "encerrar"
                            ? t(
                                "actions.closing"
                              )
                            : t(
                                "actions.close"
                              )}
                        </button>
                      </>
                    )}

                    {atividade.status ===
                      "ENCERRADA" && (
                      <span className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t(
                          "closedMessage"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {mensagem && (
                <div
                  aria-live="polite"
                  className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 shadow-sm dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                >
                  {
                    mensagem
                  }
                </div>
              )}

              {erro && (
                <div
                  aria-live="assertive"
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                >
                  {erro}
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t(
                      "submissions.title"
                    )}
                  </h2>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "submissions.description"
                    )}
                  </p>
                </div>

                {!atividade.entregas ||
                atividade.entregas
                  .length ===
                  0 ? (
                  <div className="px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "submissions.empty"
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {atividade.entregas.map(
                      (
                        entrega
                      ) => (
                        <div
                          key={
                            entrega.id
                          }
                          className="space-y-3 px-6 py-5"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <h3 className="font-medium text-slate-900 dark:text-white">
                                {nomeAluno(
                                  entrega
                                )}
                              </h3>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                <span>
                                  <strong className="font-medium text-slate-700 dark:text-slate-200">
                                    {t(
                                      "submissions.submittedAt"
                                    )}
                                  </strong>{" "}
                                  {formatarData(
                                    entrega.entregueEm
                                  )}
                                </span>

                                <span>
                                  <strong className="font-medium text-slate-700 dark:text-slate-200">
                                    {t(
                                      "submissions.grade"
                                    )}
                                  </strong>{" "}
                                  {formatarNumero(
                                    entrega.nota
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {entrega.texto && (
                            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                              <strong className="font-medium text-slate-800 dark:text-slate-100">
                                {t(
                                  "submissions.text"
                                )}
                              </strong>{" "}
                              <span className="whitespace-pre-wrap">
                                {
                                  entrega.texto
                                }
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 text-sm">
                            {entrega.link && (
                              <a
                                href={
                                  entrega.link
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {t(
                                  "actions.openLink"
                                )}
                              </a>
                            )}

                            {entrega.arquivoUrl && (
                              <a
                                href={
                                  entrega.arquivoUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {t(
                                  "actions.openFile"
                                )}
                              </a>
                            )}

                            <Link
                              href={`/professor/entregas/${entrega.id}`}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {t(
                                "actions.gradeSubmission"
                              )}
                            </Link>
                          </div>

                          {entrega.feedback && (
                            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                              <strong className="font-medium">
                                {t(
                                  "submissions.feedback"
                                )}
                              </strong>{" "}
                              <span className="whitespace-pre-wrap">
                                {
                                  entrega.feedback
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
}