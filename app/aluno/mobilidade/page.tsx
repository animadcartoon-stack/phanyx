"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type StatusCandidatura =
  | "RASCUNHO"
  | "ENVIADA"
  | "EM_ANALISE"
  | "DOCUMENTACAO_PENDENTE"
  | "ELEGIVEL"
  | "INELEGIVEL"
  | "EM_SELECAO"
  | "CLASSIFICADA"
  | "LISTA_ESPERA"
  | "APROVADA"
  | "REPROVADA"
  | "DESISTENTE"
  | "CANCELADA";

type StatusDocumento =
  | "NAO_ENVIADO"
  | "ENVIADO"
  | "EM_ANALISE"
  | "APROVADO"
  | "REJEITADO"
  | "CORRECAO_SOLICITADA"
  | "EXPIRADO";

type Documento = {
  id: number;
  tipo: string;
  titulo: string;
  descricaoRequisito:
    | string
    | null;
  obrigatorio: boolean;
  exigeValidade: boolean;
  ordem: number;

  arquivoNome:
    | string
    | null;

  mimeType:
    | string
    | null;

  tamanho:
    | number
    | null;

  validadeAte:
    | string
    | null;

  status:
    StatusDocumento;

  enviadoEm:
    | string
    | null;

  analisadoEm:
    | string
    | null;

  motivoRejeicao:
    | string
    | null;

  observacoes:
    | string
    | null;
};

type Candidatura = {
  id: number;
  status:
    StatusCandidatura;

  motivoStatus:
    | string
    | null;

  enviadaEm:
    | string
    | null;

  analisadaEm:
    | string
    | null;

  classificacao:
    | number
    | null;

  createdAt:
    string;

  updatedAt:
    string;

  oferta: {
    id: number;
    titulo: string;

    codigo:
      | string
      | null;

    ano:
      | number
      | null;

    periodo:
      | string
      | null;

    mobilidadeInicio:
      | string
      | null;

    mobilidadeFim:
      | string
      | null;

    programa: {
      id: number;
      nome: string;
      tipo: string;
      direcao: string;

      instituicaoParceira: {
        id: number;
        nome: string;
        paisCodigo: string;

        paisNome:
          | string
          | null;

        cidade:
          | string
          | null;
      } | null;
    };
  };

  documentos:
    Documento[];

  documentosResumo: {
    total: number;
    obrigatorios: number;
    aprovados: number;
    pendentes: number;
  };
};

type RespostaApi =
  | {
      ok: true;

      aluno: {
        id: number;
        nome: string;
      };

      candidaturas:
        Candidatura[];
    }
  | {
      ok: false;
      codigo?: string;
    };

export default function MobilidadeAlunoPage() {
  const t =
    useTranslations(
      "StudentMobility"
    );

  const locale =
    useLocale();

  const [
    candidaturas,
    setCandidaturas,
  ] =
    useState<Candidatura[]>(
      []
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState(false);

  function statusCandidatura(
    status:
      StatusCandidatura
  ) {
    switch (status) {
      case "RASCUNHO":
        return t(
          "statuses.RASCUNHO"
        );

      case "ENVIADA":
        return t(
          "statuses.ENVIADA"
        );

      case "EM_ANALISE":
        return t(
          "statuses.EM_ANALISE"
        );

      case "DOCUMENTACAO_PENDENTE":
        return t(
          "statuses.DOCUMENTACAO_PENDENTE"
        );

      case "ELEGIVEL":
        return t(
          "statuses.ELEGIVEL"
        );

      case "INELEGIVEL":
        return t(
          "statuses.INELEGIVEL"
        );

      case "EM_SELECAO":
        return t(
          "statuses.EM_SELECAO"
        );

      case "CLASSIFICADA":
        return t(
          "statuses.CLASSIFICADA"
        );

      case "LISTA_ESPERA":
        return t(
          "statuses.LISTA_ESPERA"
        );

      case "APROVADA":
        return t(
          "statuses.APROVADA"
        );

      case "REPROVADA":
        return t(
          "statuses.REPROVADA"
        );

      case "DESISTENTE":
        return t(
          "statuses.DESISTENTE"
        );

      case "CANCELADA":
        return t(
          "statuses.CANCELADA"
        );
    }
  }

  function statusDocumento(
    status:
      StatusDocumento
  ) {
    switch (status) {
      case "NAO_ENVIADO":
        return t(
          "documentStatuses.NAO_ENVIADO"
        );

      case "ENVIADO":
        return t(
          "documentStatuses.ENVIADO"
        );

      case "EM_ANALISE":
        return t(
          "documentStatuses.EM_ANALISE"
        );

      case "APROVADO":
        return t(
          "documentStatuses.APROVADO"
        );

      case "REJEITADO":
        return t(
          "documentStatuses.REJEITADO"
        );

      case "CORRECAO_SOLICITADA":
        return t(
          "documentStatuses.CORRECAO_SOLICITADA"
        );

      case "EXPIRADO":
        return t(
          "documentStatuses.EXPIRADO"
        );
    }
  }

  function classeStatusDocumento(
    status:
      StatusDocumento
  ) {
    switch (status) {
      case "APROVADO":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";

      case "REJEITADO":
        return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200";

      case "CORRECAO_SOLICITADA":
      case "EXPIRADO":
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";

      case "ENVIADO":
      case "EM_ANALISE":
        return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";

      default:
        return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    }
  }

  function formatarData(
    valor:
      | string
      | null
  ) {
    if (!valor) {
      return null;
    }

    const parte =
      valor.slice(
        0,
        10
      );

    const [
      ano,
      mes,
      dia,
    ] =
      parte
        .split("-")
        .map(Number);

    if (
      !ano ||
      !mes ||
      !dia
    ) {
      return null;
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "medium",
      }
    ).format(
      new Date(
        ano,
        mes - 1,
        dia
      )
    );
  }

  async function carregar() {
    setCarregando(
      true
    );

    setErro(
      false
    );

    try {
      const resposta =
        await fetch(
          "/api/aluno/mobilidade",
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const corpo =
        (await resposta.json()) as
          RespostaApi;

      if (
        !resposta.ok ||
        !corpo.ok
      ) {
        throw new Error();
      }

      setCandidaturas(
        corpo.candidaturas
      );
    } catch {
      setErro(
        true
      );

      setCandidaturas(
        []
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white md:text-3xl">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </p>
      </section>

      {carregando && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("loading")}
        </div>
      )}

      {!carregando &&
        erro && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/30">
            <p className="font-semibold text-rose-800 dark:text-rose-200">
              {t(
                "errorTitle"
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t("tryAgain")}
            </button>
          </div>
        )}

      {!carregando &&
        !erro &&
        candidaturas.length ===
          0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-bold text-slate-950 dark:text-white">
              {t(
                "emptyTitle"
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t(
                "emptyDescription"
              )}
            </p>
          </div>
        )}

      {!carregando &&
        !erro &&
        candidaturas.map(
          (candidatura) => {
            const parceira =
              candidatura
                .oferta
                .programa
                .instituicaoParceira;

            const inicio =
              formatarData(
                candidatura
                  .oferta
                  .mobilidadeInicio
              );

            const fim =
              formatarData(
                candidatura
                  .oferta
                  .mobilidadeFim
              );

            return (
              <article
                key={
                  candidatura.id
                }
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {t(
                          "application",
                          {
                            id:
                              candidatura.id,
                          }
                        )}
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">
                        {
                          candidatura
                            .oferta
                            .titulo
                        }
                      </h2>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {
                          candidatura
                            .oferta
                            .programa
                            .nome
                        }
                      </p>
                    </div>

                    <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                      {statusCandidatura(
                        candidatura.status
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    {parceira && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t(
                            "partner"
                          )}
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                          {
                            parceira.nome
                          }
                        </span>
                      </div>
                    )}

                    {candidatura
                      .oferta
                      .ano && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t(
                            "year"
                          )}
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                          {
                            candidatura
                              .oferta
                              .ano
                          }
                        </span>
                      </div>
                    )}

                    {candidatura
                      .oferta
                      .periodo && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t(
                            "period"
                          )}
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                          {
                            candidatura
                              .oferta
                              .periodo
                          }
                        </span>
                      </div>
                    )}

                    {(inicio ||
                      fim) && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t(
                            "mobilityPeriod"
                          )}
                        </span>

                        <span className="font-medium text-slate-900 dark:text-white">
                          {inicio ??
                            "—"}{" "}
                          —{" "}
                          {fim ??
                            "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  {candidatura.motivoStatus && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <span className="font-semibold">
                        {t(
                          "applicationReason"
                        )}
                        :{" "}
                      </span>

                      {
                        candidatura.motivoStatus
                      }
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950 dark:text-white">
                        {t(
                          "documents"
                        )}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "approvedOfTotal",
                          {
                            approved:
                              candidatura
                                .documentosResumo
                                .aprovados,

                            total:
                              candidatura
                                .documentosResumo
                                .total,
                          }
                        )}
                      </p>
                    </div>

                    {candidatura
                      .documentosResumo
                      .pendentes >
                      0 && (
                      <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        {t(
                          "pendingRequired",
                          {
                            count:
                              candidatura
                                .documentosResumo
                                .pendentes,
                          }
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {candidatura
                      .documentos
                      .map(
                        (
                          documento
                        ) => {
                          const validade =
                            formatarData(
                              documento.validadeAte
                            );

                          return (
                            <div
                              key={
                                documento.id
                              }
                              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold text-slate-950 dark:text-white">
                                      {
                                        documento.titulo
                                      }
                                    </h4>

                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {documento.obrigatorio
                                        ? t(
                                            "required"
                                          )
                                        : t(
                                            "optional"
                                          )}
                                    </span>

                                    {documento.exigeValidade && (
                                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200">
                                        {t(
                                          "validityRequired"
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {documento.descricaoRequisito && (
                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                      {
                                        documento.descricaoRequisito
                                      }
                                    </p>
                                  )}

                                  {documento.arquivoNome ? (
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                      {t(
                                        "file",
                                        {
                                          name:
                                            documento.arquivoNome,
                                        }
                                      )}
                                    </p>
                                  ) : (
                                    <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                                      {t(
                                        "waitingUpload"
                                      )}
                                    </p>
                                  )}

                                  {validade && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {t(
                                        "validUntil",
                                        {
                                          date:
                                            validade,
                                        }
                                      )}
                                    </p>
                                  )}

                                  {documento.motivoRejeicao && (
                                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                      <span className="font-bold">
                                        {t(
                                          "reviewReason"
                                        )}
                                        :{" "}
                                      </span>

                                      {
                                        documento.motivoRejeicao
                                      }
                                    </div>
                                  )}

                                  {documento.observacoes && (
                                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                      <span className="font-semibold">
                                        {t(
                                          "reviewNotes"
                                        )}
                                        :{" "}
                                      </span>

                                      {
                                        documento.observacoes
                                      }
                                    </p>
                                  )}
                                </div>

                                <span
                                  className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${classeStatusDocumento(
                                    documento.status
                                  )}`}
                                >
                                  {statusDocumento(
                                    documento.status
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                  </div>
                </div>
              </article>
            );
          }
        )}
    </div>
  );
}
