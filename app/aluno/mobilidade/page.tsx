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

  
  const [
    arquivoPorDocumento,
    setArquivoPorDocumento,
  ] =
    useState<
      Record<number, File | null>
    >({});

  const [
    validadePorDocumento,
    setValidadePorDocumento,
  ] =
    useState<
      Record<number, string>
    >({});

  const [
    enviandoDocumentoId,
    setEnviandoDocumentoId,
  ] =
    useState<number | null>(
      null
    );

  const [
    progressoPorDocumento,
    setProgressoPorDocumento,
  ] =
    useState<
      Record<number, number>
    >({});

  const [
    mensagemPorDocumento,
    setMensagemPorDocumento,
  ] =
    useState<
      Record<
        number,
        {
          tipo:
            | "sucesso"
            | "erro";
          texto: string;
        }
      >
    >({});
  function mimeArquivoMobilidade(
    nome: string
  ) {
    const extensao =
      nome
        .split(".")
        .pop()
        ?.toLowerCase() ??
      "";

    const mimes:
      Record<string, string> = {
        pdf:
          "application/pdf",

        jpg:
          "image/jpeg",

        jpeg:
          "image/jpeg",

        png:
          "image/png",

        webp:
          "image/webp",

        doc:
          "application/msword",

        docx:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

    return (
      mimes[extensao] ??
      null
    );
  }

  function mensagemErroUpload(
    codigo?: string
  ) {
    switch (codigo) {
      case "VALIDADE_OBRIGATORIA":
      case "VALIDADE_INVALIDA":
        return t(
          "upload.errors.validity"
        );

      case "ARQUIVO_MUITO_GRANDE":
      case "ARQUIVO_TAMANHO_INVALIDO":
        return t(
          "upload.errors.size"
        );

      case "ARQUIVO_FORMATO_INVALIDO":
      case "ARQUIVO_NOME_INVALIDO":
        return t(
          "upload.errors.format"
        );

      case "DOCUMENTO_NAO_EDITAVEL":
        return t(
          "upload.errors.locked"
        );

      case "BLOB_NAO_CONFIGURADO":
        return t(
          "upload.errors.unavailable"
        );

      default:
        return t(
          "upload.errors.generic"
        );
    }
  }

  function enviarPutComProgresso(
    url: string,
    arquivo: File,
    mimeType: string,
    documentoId: number
  ) {
    return new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const xhr =
          new XMLHttpRequest();

        xhr.open(
          "PUT",
          url,
          true
        );

        xhr.setRequestHeader(
          "Content-Type",
          mimeType
        );

        xhr.upload.onprogress =
          (
            evento
          ) => {
            if (
              !evento.lengthComputable
            ) {
              return;
            }

            const progresso =
              Math.min(
                100,
                Math.round(
                  (
                    evento.loaded /
                    evento.total
                  ) *
                    100
                )
              );

            setProgressoPorDocumento(
              (
                anterior
              ) => ({
                ...anterior,

                [documentoId]:
                  progresso,
              })
            );
          };

        xhr.onload =
          () => {
            if (
              xhr.status >=
                200 &&
              xhr.status <
                300
            ) {
              resolve();
              return;
            }

            reject(
              new Error(
                "UPLOAD_PUT_FALHOU"
              )
            );
          };

        xhr.onerror =
          () => {
            reject(
              new Error(
                "UPLOAD_PUT_FALHOU"
              )
            );
          };

        xhr.send(
          arquivo
        );
      }
    );
  }

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

  async function enviarDocumento(
    candidaturaId: number,
    documento: Documento
  ) {
    const arquivo =
      arquivoPorDocumento[
        documento.id
      ] ??
      null;

    const validade =
      validadePorDocumento[
        documento.id
      ] ??
      documento.validadeAte
        ?.slice(
          0,
          10
        ) ??
      "";

    if (!arquivo) {
      setMensagemPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]: {
            tipo:
              "erro",

            texto:
              t(
                "upload.errors.missingFile"
              ),
          },
        })
      );

      return;
    }

    if (
      documento.exigeValidade &&
      !validade
    ) {
      setMensagemPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]: {
            tipo:
              "erro",

            texto:
              t(
                "upload.errors.validity"
              ),
          },
        })
      );

      return;
    }

    if (
      arquivo.size >
      25 *
        1024 *
        1024
    ) {
      setMensagemPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]: {
            tipo:
              "erro",

            texto:
              t(
                "upload.errors.size"
              ),
          },
        })
      );

      return;
    }

    const mimeType =
      mimeArquivoMobilidade(
        arquivo.name
      );

    if (!mimeType) {
      setMensagemPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]: {
            tipo:
              "erro",

            texto:
              t(
                "upload.errors.format"
              ),
          },
        })
      );

      return;
    }

    setEnviandoDocumentoId(
      documento.id
    );

    setProgressoPorDocumento(
      (
        anterior
      ) => ({
        ...anterior,

        [documento.id]:
          0,
      })
    );

    setMensagemPorDocumento(
      (
        anterior
      ) => {
        const novo = {
          ...anterior,
        };

        delete novo[
          documento.id
        ];

        return novo;
      }
    );

    try {
      const respostaAutorizar =
        await fetch(
          `/api/aluno/mobilidade/candidaturas/${candidaturaId}/documentos/${documento.id}/upload`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                nomeOriginal:
                  arquivo.name,

                mimeType,

                tamanhoBytes:
                  arquivo.size,

                validadeAte:
                  validade ||
                  null,
              }),
          }
        );

      const autorizado =
        (await respostaAutorizar.json()) as {
          ok?: boolean;
          codigo?: string;
          presignedUrl?: string;
          pathname?: string;
          mimeType?: string;
        };

      if (
        !respostaAutorizar.ok ||
        !autorizado.ok ||
        !autorizado.presignedUrl ||
        !autorizado.pathname ||
        !autorizado.mimeType
      ) {
        throw new Error(
          mensagemErroUpload(
            autorizado.codigo
          )
        );
      }

      await enviarPutComProgresso(
        autorizado.presignedUrl,
        arquivo,
        autorizado.mimeType,
        documento.id
      );

      const respostaFinalizar =
        await fetch(
          `/api/aluno/mobilidade/candidaturas/${candidaturaId}/documentos/${documento.id}/upload/finalizar`,
          {
            method:
              "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                pathname:
                  autorizado.pathname,

                nomeOriginal:
                  arquivo.name,

                validadeAte:
                  validade ||
                  null,
              }),
          }
        );

      const finalizado =
        (await respostaFinalizar.json()) as {
          ok?: boolean;
          codigo?: string;
        };

      if (
        !respostaFinalizar.ok ||
        !finalizado.ok
      ) {
        throw new Error(
          mensagemErroUpload(
            finalizado.codigo
          )
        );
      }

      setProgressoPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]:
            100,
        })
      );

      setArquivoPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]:
            null,
        })
      );

      setMensagemPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]: {
            tipo:
              "sucesso",

            texto:
              t(
                "upload.success"
              ),
          },
        })
      );

      await carregar();
    } catch (
      erroUpload
    ) {
      const texto =
        erroUpload instanceof
          Error &&
        erroUpload.message ===
          "UPLOAD_PUT_FALHOU"
          ? t(
              "upload.errors.transfer"
            )
          : erroUpload instanceof
                Error &&
              erroUpload.message
            ? erroUpload.message
            : t(
                "upload.errors.generic"
              );

      setMensagemPorDocumento(
        (
          anterior
        ) => ({
          ...anterior,

          [documento.id]: {
            tipo:
              "erro",

            texto,
          },
        })
      );
    } finally {
      setEnviandoDocumentoId(
        null
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


                          const arquivoSelecionado =

                            arquivoPorDocumento[

                              documento.id

                            ] ??

                            null;


                          const validadeSelecionada =

                            validadePorDocumento[

                              documento.id

                            ] ??

                            documento.validadeAte

                              ?.slice(

                                0,

                                10

                              ) ??

                            "";


                          const enviando =

                            enviandoDocumentoId ===

                            documento.id;


                          const progresso =

                            progressoPorDocumento[

                              documento.id

                            ] ??

                            0;


                          const mensagem =

                            mensagemPorDocumento[

                              documento.id

                            ];


                          const podeEnviar =

                            documento.status !==

                              "APROVADO" &&

                            documento.status !==

                              "EM_ANALISE";

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

                                  {podeEnviar ? (


                                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">


                                      <p className="text-sm font-bold text-slate-950 dark:text-white">


                                        {documento.arquivoNome


                                          ? t(


                                              "upload.replaceTitle"


                                            )


                                          : t(


                                              "upload.title"


                                            )}


                                      </p>



                                      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end">


                                        {documento.exigeValidade && (


                                          <label className="block w-full lg:max-w-[230px]">


                                            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">


                                              {t(


                                                "upload.validity"


                                              )}


                                            </span>



                                            <input


                                              type="date"


                                              value={


                                                validadeSelecionada


                                              }


                                              disabled={


                                                enviando


                                              }


                                              onChange={(


                                                evento


                                              ) =>


                                                setValidadePorDocumento(


                                                  (


                                                    anterior


                                                  ) => ({


                                                    ...anterior,


                                                    [documento.id]:


                                                      evento.target.value,


                                                  })


                                                )


                                              }


                                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900"


                                            />


                                          </label>


                                        )}



                                        <div className="flex flex-1 flex-col gap-2">


                                          <input


                                            id={`arquivo-mobilidade-${documento.id}`}


                                            type="file"


                                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"


                                            disabled={


                                              enviando


                                            }


                                            onClick={(


                                              evento


                                            ) => {


                                              evento.currentTarget.value =


                                                "";


                                            }}


                                            onChange={(


                                              evento


                                            ) => {


                                              const selecionado =


                                                evento.target.files?.[0] ??


                                                null;



                                              setArquivoPorDocumento(


                                                (


                                                  anterior


                                                ) => ({


                                                  ...anterior,


                                                  [documento.id]:


                                                    selecionado,


                                                })


                                              );



                                              setMensagemPorDocumento(


                                                (


                                                  anterior


                                                ) => {


                                                  const novo = {


                                                    ...anterior,


                                                  };



                                                  delete novo[


                                                    documento.id


                                                  ];



                                                  return novo;


                                                }


                                              );


                                            }}


                                            className="sr-only"


                                          />



                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">


                                            <label


                                              htmlFor={`arquivo-mobilidade-${documento.id}`}


                                              className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-950/40 ${


                                                enviando


                                                  ? "pointer-events-none opacity-60"


                                                  : ""


                                              }`}


                                            >


                                              {t(


                                                "upload.selectFile"


                                              )}


                                            </label>



                                            {arquivoSelecionado && (


                                              <span className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">


                                                {t(


                                                  "upload.selectedFile",


                                                  {


                                                    name:


                                                      arquivoSelecionado.name,


                                                  }


                                                )}


                                              </span>


                                            )}


                                          </div>


                                        </div>


                                      </div>



                                      {enviando && (


                                        <div className="mt-4">


                                          <div className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800">


                                            <div


                                              className="h-full rounded-full bg-blue-600 transition-all"


                                              style={{


                                                width:


                                                  `${progresso}%`,


                                              }}


                                            />


                                          </div>



                                          <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">


                                            {t(


                                              "upload.progress",


                                              {


                                                progress:


                                                  progresso,


                                              }


                                            )}


                                          </p>


                                        </div>


                                      )}



                                      {mensagem && (


                                        <div


                                          className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${


                                            mensagem.tipo ===


                                            "sucesso"


                                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"


                                              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"


                                          }`}


                                        >


                                          {


                                            mensagem.texto


                                          }


                                        </div>


                                      )}



                                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">


                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">


                                          {t(


                                            "upload.formats"


                                          )}


                                        </p>



                                        <button


                                          type="button"


                                          disabled={


                                            enviando ||


                                            !arquivoSelecionado ||


                                            (


                                              documento.exigeValidade &&


                                              !validadeSelecionada


                                            )


                                          }


                                          onClick={() =>


                                            void enviarDocumento(


                                              candidatura.id,


                                              documento


                                            )


                                          }


                                          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"


                                        >


                                          {enviando


                                            ? t(


                                                "upload.sending"


                                              )


                                            : documento.arquivoNome


                                              ? t(


                                                  "upload.replace"


                                                )


                                              : t(


                                                  "upload.send"


                                                )}


                                        </button>


                                      </div>


                                    </div>


                                  ) : (


                                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">


                                      {documento.status ===


                                      "APROVADO"


                                        ? t(


                                            "upload.lockedApproved"


                                          )


                                        : t(


                                            "upload.lockedReview"


                                          )}


                                    </div>


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
