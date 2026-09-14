"use client";

import React, {
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

import withAuth from "@/lib/withAuth";

type MatriculaResumo = {
  id: number;
  status: string;

  aluno?: {
    id: number;
    nome: string;
    nomeSocial?: string | null;
  } | null;

  instituicao?: {
    id: number;
    nome: string;
  } | null;

  polo?: {
    id: number;
    nome: string;
  } | null;

  curso?: {
    id: number;
    nome: string;
  } | null;

  turmaPrincipal?: {
    id: number;
    nome: string;
  } | null;
};

type TransferenciaItem = {
  id: number;

  itemMatriculaOrigemId:
    number;

  itemMatriculaDestinoId?:
    number | null;

  disciplinaId:
    number;

  disciplinaNomeSnapshot:
    string;

  turmaOrigemId?:
    number | null;

  turmaOrigemNomeSnapshot?:
    string | null;

  turmaDestinoId?:
    number | null;

  turmaDestinoNomeSnapshot?:
    string | null;

  tipoItem:
    string;

  statusOrigem:
    string;

  statusDestino?:
    string | null;

  situacao:
    string;
};

type Transferencia = {
  id: number;

  tipo:
    string;

  status:
    string;

  dataTransferencia:
    string;

  motivo:
    string;

  observacoes?:
    string | null;

  alunoOrigemNomeSnapshot?:
    string | null;

  alunoDestinoNomeSnapshot?:
    string | null;

  instituicaoOrigemNomeSnapshot?:
    string | null;

  instituicaoDestinoNomeSnapshot?:
    string | null;

  poloOrigemNomeSnapshot?:
    string | null;

  poloDestinoNomeSnapshot?:
    string | null;

  cursoOrigemNomeSnapshot?:
    string | null;

  cursoDestinoNomeSnapshot?:
    string | null;

  turmaOrigemNomeSnapshot?:
    string | null;

  turmaDestinoNomeSnapshot?:
    string | null;

  instituicaoExternaNome?:
    string | null;

  realizadoPorNomeSnapshot?:
    string | null;

  concluidaEm?:
    string | null;

  canceladaEm?:
    string | null;

  motivoCancelamento?:
    string | null;

  createdAt:
    string;

  itens:
    TransferenciaItem[];
};

function HistoricoTransferenciasPage() {
  const t =
    useTranslations(
      "AdminHistoricoTransferenciasMatricula"
    );

  const locale =
    useLocale();

  const router =
    useRouter();

  const params =
    useParams();

  const matriculaId =
    Number(params?.id);

  const [
    matricula,
    setMatricula,
  ] =
    useState<MatriculaResumo | null>(
      null
    );

  const [
    transferencias,
    setTransferencias,
  ] =
    useState<Transferencia[]>([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const resposta =
          await fetch(
            `/api/admin/matriculas/${matriculaId}/transferencias`,
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const dados =
          await resposta
            .json()
            .catch(
              () => null
            );

        if (
          !resposta.ok ||
          !dados?.success
        ) {
          throw new Error(
            dados?.error ||
            "LOAD_ERROR"
          );
        }

        if (!ativo) {
          return;
        }

        setMatricula(
          dados.matricula ??
          null
        );

        setTransferencias(
          Array.isArray(
            dados.transferencias
          )
            ? dados.transferencias
            : []
        );
      } catch (error) {
        console.error(
          "Transfer history error:",
          error
        );

        if (ativo) {
          setErro(
            t("errors.load")
          );
        }
      } finally {
        if (ativo) {
          setCarregando(
            false
          );
        }
      }
    }

    if (
      Number.isInteger(
        matriculaId
      ) &&
      matriculaId > 0
    ) {
      void carregar();
    }

    return () => {
      ativo = false;
    };
  }, [
    matriculaId,
    t,
  ]);

  const formatarData =
    useMemo(
      () =>
        (
          valor:
            string | null | undefined
        ) => {
          if (!valor) {
            return "-";
          }

          const data =
            new Date(valor);

          if (
            Number.isNaN(
              data.getTime()
            )
          ) {
            return "-";
          }

          return new Intl
            .DateTimeFormat(
              locale,
              {
                dateStyle:
                  "short",
              }
            )
            .format(data);
        },
      [locale]
    );

  const formatarDataHora =
    useMemo(
      () =>
        (
          valor:
            string | null | undefined
        ) => {
          if (!valor) {
            return "-";
          }

          const data =
            new Date(valor);

          if (
            Number.isNaN(
              data.getTime()
            )
          ) {
            return "-";
          }

          return new Intl
            .DateTimeFormat(
              locale,
              {
                dateStyle:
                  "short",

                timeStyle:
                  "short",
              }
            )
            .format(data);
        },
      [locale]
    );

  function statusLabel(
    status: string
  ) {
    const mapa: Record<
      string,
      string
    > = {
      PENDENTE:
        "status.pending",

      CONCLUIDA:
        "status.completed",

      CANCELADA:
        "status.cancelled",
    };

    const chave =
      mapa[status];

    return chave
      ? t(chave)
      : status;
  }

  function tipoLabel(
    tipo: string
  ) {
    const mapa: Record<
      string,
      string
    > = {
      POLO:
        "type.campus",

      CURSO_TURMA:
        "type.courseClass",

      INSTITUICAO_PHANYX:
        "type.phanyxInstitution",

      INSTITUICAO_EXTERNA:
        "type.externalInstitution",

      REATRIBUICAO_ALUNO:
        "type.studentReassignment",
    };

    const chave =
      mapa[tipo];

    return chave
      ? t(chave)
      : tipo;
  }

  function statusClasses(
    status: string
  ) {
    if (
      status ===
      "CONCLUIDA"
    ) {
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
    }

    if (
      status ===
      "CANCELADA"
    ) {
      return "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200";
    }

    return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-6xl p-6 text-slate-600 dark:text-neutral-300">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matriculas"
              )
            }
            className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          >
            {"<- "}
            {t("actions.back")}
          </button>

          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {t("description")}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/matriculas/${matriculaId}/transferir`
            )
          }
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t(
            "actions.newTransfer"
          )}
        </button>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {erro}
        </div>
      )}

      {matricula && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label={t(
                "summary.student"
              )}
              value={
                matricula.aluno
                  ?.nomeSocial ||
                matricula.aluno
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "summary.currentCampus"
              )}
              value={
                matricula.polo
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "summary.course"
              )}
              value={
                matricula.curso
                  ?.nome ||
                "-"
              }
            />

            <Info
              label={t(
                "summary.currentClass"
              )}
              value={
                matricula
                  .turmaPrincipal
                  ?.nome ||
                "-"
              }
            />
          </div>
        </section>
      )}

      {transferencias.length ===
        0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-950">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t(
              "empty.title"
            )}
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
            {t(
              "empty.description"
            )}
          </p>
        </section>
      )}

      <div className="space-y-5">
        {transferencias.map(
          (
            transferencia,
            indice
          ) => {
            const migrados =
              transferencia.itens.filter(
                (item) =>
                  item.situacao ===
                  "MIGRADO"
              ).length;

            return (
              <article
                key={
                  transferencia.id
                }
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
              >
                <div className="border-b border-slate-200 p-5 dark:border-neutral-700">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                        {t(
                          "card.transferNumber",
                          {
                            number:
                              transferencia.id,
                          }
                        )}
                      </div>

                      <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                        {
                          transferencia.poloOrigemNomeSnapshot ||
                          transferencia.instituicaoOrigemNomeSnapshot ||
                          "-"
                        }
                        {" → "}
                        {
                          transferencia.poloDestinoNomeSnapshot ||
                          transferencia.instituicaoDestinoNomeSnapshot ||
                          transferencia.instituicaoExternaNome ||
                          "-"
                        }
                      </h2>

                      <div className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                        {tipoLabel(
                          transferencia.tipo
                        )}
                        {" · "}
                        {formatarData(
                          transferencia.dataTransferencia
                        )}

                        {indice ===
                          0 && (
                          <>
                            {" · "}
                            <span className="font-semibold">
                              {t(
                                "card.latest"
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={[
                        "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold",
                        statusClasses(
                          transferencia.status
                        ),
                      ].join(" ")}
                    >
                      {statusLabel(
                        transferencia.status
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Info
                      label={t(
                        "card.originClass"
                      )}
                      value={
                        transferencia.turmaOrigemNomeSnapshot ||
                        "-"
                      }
                    />

                    <Info
                      label={t(
                        "card.destinationClass"
                      )}
                      value={
                        transferencia.turmaDestinoNomeSnapshot ||
                        "-"
                      }
                    />

                    <Info
                      label={t(
                        "card.responsible"
                      )}
                      value={
                        transferencia.realizadoPorNomeSnapshot ||
                        "-"
                      }
                    />

                    <Info
                      label={t(
                        "card.completedAt"
                      )}
                      value={
                        transferencia.status ===
                        "CONCLUIDA"
                          ? formatarDataHora(
                              transferencia.concluidaEm
                            )
                          : "-"
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Info
                      label={t(
                        "card.reason"
                      )}
                      value={
                        transferencia.motivo ||
                        "-"
                      }
                    />

                    <Info
                      label={t(
                        "card.notes"
                      )}
                      value={
                        transferencia.observacoes ||
                        "-"
                      }
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-950 dark:text-white">
                        {t(
                          "card.subjects"
                        )}
                      </h3>

                      <div className="text-sm text-slate-600 dark:text-neutral-300">
                        {t(
                          "card.itemsCount",
                          {
                            count:
                              transferencia
                                .itens
                                .length,
                          }
                        )}

                        {" · "}

                        {t(
                          "card.migratedCount",
                          {
                            count:
                              migrados,
                          }
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {transferencia.itens.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="font-medium text-slate-900 dark:text-white">
                              {
                                item.disciplinaNomeSnapshot
                              }
                            </span>

                            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                              {
                                item.statusOrigem
                              }
                              {" → "}
                              {
                                item.statusDestino ||
                                item.situacao
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {transferencia.status ===
                    "CANCELADA" &&
                    transferencia.motivoCancelamento && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      <strong>
                        {t(
                          "card.cancellationReason"
                        )}
                        :
                      </strong>{" "}
                      {
                        transferencia.motivoCancelamento
                      }
                    </div>
                  )}
                </div>
              </article>
            );
          }
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value:
    string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
        {label}
      </div>

      <div className="mt-1 whitespace-pre-wrap font-medium text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default withAuth(
  HistoricoTransferenciasPage,
  ["admin"]
);
