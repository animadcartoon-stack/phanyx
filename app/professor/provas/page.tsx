"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useToast } from "@/components/providers/ToastProvider";
import { useConfirmDialog } from "@/components/providers/ConfirmDialogProvider";

type Disciplina = {
  id: number;
  nome?: string;
  titulo?: string;
};

type Turma = {
  id: number;
  nome?: string;
};

type Prova = {
  id: number;
  titulo: string;
  notaMaxima: number;
  tempoMin?: number | null;
  ativa: boolean;
  status: "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
  createdAt?: string;
  disciplina?: Disciplina | null;
  turma?: Turma | null;
};

function formatarData(
  data: string | null | undefined,
  locale: string
) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString(locale);
  } catch {
    return data;
  }
}

export default function ProfessorProvasPage() {
  const t = useTranslations("ProfessorExams");
  const locale = useLocale();

  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [acaoLoading, setAcaoLoading] = useState<{
    provaId: number;
    acao: "publicar" | "encerrar" | "excluir";
  } | null>(null);

  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  async function carregarProvas() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/provas");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || t("feedback.loadError")
        );
      }

      setProvas(
        Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              status: p.ativa
                ? "PUBLICADA"
                : "RASCUNHO",
            }))
          : []
      );
    } catch (e: any) {
      const mensagem =
        e?.message || t("feedback.loadError");

      setErro(mensagem);
      showToast(mensagem, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProvas();
  }, []);

  async function publicarProva(
    provaId: number
  ) {
    try {
      setAcaoLoading({
        provaId,
        acao: "publicar",
      });

      const res = await fetch(
        `/api/professor/provas/${provaId}/publicar`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("feedback.publishError")
        );
      }

      await carregarProvas();

      showToast(
        t("feedback.publishSuccess"),
        "success"
      );
    } catch (e: any) {
      showToast(
        e?.message ||
          t("feedback.publishError"),
        "error"
      );
    } finally {
      setAcaoLoading(null);
    }
  }

  async function encerrarProva(
    provaId: number
  ) {
    const confirmou = await confirm({
      title: t("confirm.close.title"),
      message: t("confirm.close.message"),
      confirmText: t(
        "confirm.close.confirm"
      ),
      cancelText: t(
        "confirm.cancel"
      ),
      confirmVariant: "primary",
    });

    if (!confirmou) return;

    try {
      setAcaoLoading({
        provaId,
        acao: "encerrar",
      });

      const res = await fetch(
        `/api/professor/provas/${provaId}/encerrar`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("feedback.closeError")
        );
      }

      await carregarProvas();

      showToast(
        t("feedback.closeSuccess"),
        "success"
      );
    } catch (e: any) {
      showToast(
        e?.message ||
          t("feedback.closeError"),
        "error"
      );
    } finally {
      setAcaoLoading(null);
    }
  }

  async function excluirProva(
    provaId: number
  ) {
    const confirmou = await confirm({
      title: t("confirm.delete.title"),
      message: t(
        "confirm.delete.message"
      ),
      confirmText: t(
        "confirm.delete.confirm"
      ),
      cancelText: t(
        "confirm.cancel"
      ),
      confirmVariant: "danger",
    });

    if (!confirmou) return;

    try {
      setAcaoLoading({
        provaId,
        acao: "excluir",
      });

      const res = await fetch(
        `/api/professor/provas/${provaId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const contentType =
        res.headers.get("content-type") ||
        "";

      let data: any = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await res.json();
      } else {
        const texto = await res.text();

        if (!res.ok) {
          throw new Error(
            texto ||
              t("feedback.deleteError")
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("feedback.deleteError")
        );
      }

      await carregarProvas();

      showToast(
        t("feedback.deleteSuccess"),
        "success"
      );
    } catch (e: any) {
      showToast(
        e?.message ||
          t("feedback.deleteError"),
        "error"
      );
    } finally {
      setAcaoLoading(null);
    }
  }

  async function despublicarProva(
    provaId: number
  ) {
    const confirmou = await confirm({
      title: t(
        "confirm.unpublish.title"
      ),
      message: t(
        "confirm.unpublish.message"
      ),
      confirmText: t(
        "confirm.unpublish.confirm"
      ),
      cancelText: t(
        "confirm.cancel"
      ),
      confirmVariant: "primary",
    });

    if (!confirmou) return;

    try {
      const res = await fetch(
        `/api/professor/provas/${provaId}/despublicar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const contentType =
        res.headers.get("content-type") ||
        "";

      let data: any = null;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t(
              "feedback.unpublishError"
            )
        );
      }

      await carregarProvas();

      showToast(
        t(
          "feedback.unpublishSuccess"
        ),
        "success"
      );
    } catch (e: any) {
      showToast(
        e?.message ||
          t("feedback.unpublishError"),
        "error"
      );
    }
  }

  const totalProvas = provas.length;

  const totalRascunho =
    useMemo(() => {
      return provas.filter(
        (p) =>
          p.status === "RASCUNHO"
      ).length;
    }, [provas]);

  const totalPublicadas =
    useMemo(() => {
      return provas.filter(
        (p) =>
          p.status === "PUBLICADA"
      ).length;
    }, [provas]);

  const totalEncerradas =
    useMemo(() => {
      return provas.filter(
        (p) =>
          p.status === "ENCERRADA"
      ).length;
    }, [provas]);

  function getStatusLabel(
    status: Prova["status"]
  ) {
    if (status === "PUBLICADA") {
      return t("statuses.published");
    }

    if (status === "ENCERRADA") {
      return t("statuses.closed");
    }

    return t("statuses.draft");
  }

  function getStatusClasses(
    status: Prova["status"]
  ) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (status === "ENCERRADA") {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }

    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("title")}
            </h1>

            <p className="text-sm text-gray-500">
              {t("description")}
            </p>
          </div>

          <a
            href="/professor/provas/nova"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t("newExam")}
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("summary.total")}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalProvas}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("summary.drafts")}
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {totalRascunho}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("summary.published")}
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {totalPublicadas}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {t("summary.closed")}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-700">
              {totalEncerradas}
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            {t("loading")}
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading &&
          !erro &&
          provas.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <div className="max-w-xl space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("empty.title")}
                </h2>

                <p className="text-sm text-gray-500">
                  {t(
                    "empty.description"
                  )}
                </p>

                <div className="pt-2">
                  <a
                    href="/professor/provas/nova"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t(
                      "empty.createFirst"
                    )}
                  </a>
                </div>
              </div>
            </div>
          )}

        {!loading &&
          !erro &&
          provas.length > 0 && (
            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("list.title")}
                </h2>

                <p className="text-sm text-gray-500">
                  {t(
                    "list.description"
                  )}
                </p>
              </div>

              <div className="divide-y">
                {provas.map(
                  (prova) => (
                    <div
                      key={prova.id}
                      className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {
                              prova.titulo
                            }
                          </h3>

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              prova.status
                            )}`}
                          >
                            {getStatusLabel(
                              prova.status
                            )}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "labels.subject"
                              )}
                              :
                            </strong>{" "}
                            {prova
                              .disciplina
                              ?.nome ||
                              prova
                                .disciplina
                                ?.titulo ||
                              "-"}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "labels.class"
                              )}
                              :
                            </strong>{" "}
                            {prova
                              .turma
                              ?.nome ||
                              "-"}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "labels.maximumGrade"
                              )}
                              :
                            </strong>{" "}
                            {
                              prova.notaMaxima
                            }
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "labels.time"
                              )}
                              :
                            </strong>{" "}
                            {prova.tempoMin
                              ? t(
                                  "labels.minutes",
                                  {
                                    count:
                                      prova.tempoMin,
                                  }
                                )
                              : t(
                                  "labels.free"
                                )}
                          </span>

                          {prova.createdAt && (
                            <span>
                              <strong className="font-medium text-gray-700">
                                {t(
                                  "labels.createdAt"
                                )}
                                :
                              </strong>{" "}
                              {formatarData(
                                prova.createdAt,
                                locale
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/professor/provas/${prova.id}`}
                          className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {t(
                            "actions.edit"
                          )}
                        </a>

                        <a
                          href={`/professor/provas/${prova.id}/tentativas`}
                          className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {t(
                            "actions.attempts"
                          )}
                        </a>

                        {prova.status ===
                          "RASCUNHO" && (
                          <>
                            <button
                              onClick={() =>
                                publicarProva(
                                  prova.id
                                )
                              }
                              disabled={
                                acaoLoading?.provaId ===
                                  prova.id &&
                                acaoLoading?.acao ===
                                  "publicar"
                              }
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {acaoLoading?.provaId ===
                                prova.id &&
                              acaoLoading?.acao ===
                                "publicar"
                                ? t(
                                    "actions.publishing"
                                  )
                                : t(
                                    "actions.publish"
                                  )}
                            </button>

                            <button
                              onClick={() =>
                                excluirProva(
                                  prova.id
                                )
                              }
                              disabled={
                                acaoLoading?.provaId ===
                                  prova.id &&
                                acaoLoading?.acao ===
                                  "excluir"
                              }
                              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {acaoLoading?.provaId ===
                                prova.id &&
                              acaoLoading?.acao ===
                                "excluir"
                                ? t(
                                    "actions.deleting"
                                  )
                                : t(
                                    "actions.delete"
                                  )}
                            </button>
                          </>
                        )}

                        {prova.status ===
                          "PUBLICADA" && (
                          <>
                            <button
                              onClick={() =>
                                despublicarProva(
                                  prova.id
                                )
                              }
                              className="rounded-lg bg-gray-500 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600"
                            >
                              {t(
                                "actions.unpublish"
                              )}
                            </button>

                            <button
                              onClick={() =>
                                encerrarProva(
                                  prova.id
                                )
                              }
                              disabled={
                                acaoLoading?.provaId ===
                                  prova.id &&
                                acaoLoading?.acao ===
                                  "encerrar"
                              }
                              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                            >
                              {acaoLoading?.provaId ===
                                prova.id &&
                              acaoLoading?.acao ===
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

                        {prova.status ===
                          "ENCERRADA" && (
                          <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
                            {t(
                              "actions.examClosed"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}