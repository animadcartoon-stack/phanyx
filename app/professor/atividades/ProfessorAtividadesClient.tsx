"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type AtividadeItem = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  createdAt?: string | null;
  notaMaxima: number;
  status: string;

  enviadoParaApoioDocenteEm?: string | null;
  publicadoPeloApoioDocenteEm?: string | null;

  publicadoPor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
  } | null;

  anexos?: {
    id: number;
    titulo?: string | null;
    url: string;
    arquivoNome?: string | null;
    mimeType?: string | null;
    tamanho?: number | null;
  }[];

  disciplina?: {
    id: number;
    nome?: string | null;
    titulo?: string | null;
  } | null;

  turma?: {
    id: number;
    nome?: string | null;
  } | null;

  alunos?: {
    id: number;
    nome?: string | null;
    email?: string | null;
    matricula?: string | null;
    enviadoParaApoioDocenteEm?: string | null;
    publicadoPeloApoioDocenteEm?: string | null;
    publicadoPor?: {
      id: number;
      nome?: string | null;
      email?: string | null;
    } | null;
  }[];
};

function normalizarTexto(
  valor?: string | number | null
) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarData(
  data: string | null | undefined,
  locale: string,
  fallback: string
) {
  if (!data) return fallback;

  try {
    return new Date(data).toLocaleString(locale);
  } catch {
    return data;
  }
}

function formatarDataCriacao(
  data: string,
  locale: string
) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(data));
  } catch {
    return data;
  }
}

function formatarTempoRelativo(
  data: string | null | undefined,
  locale: string
) {
  if (!data) return "";

  try {
    const agora = Date.now();
    const dataReferencia = new Date(data).getTime();
    const diferencaMs = dataReferencia - agora;

    const minuto = 1000 * 60;
    const hora = minuto * 60;
    const dia = hora * 24;

    const absoluto = Math.abs(diferencaMs);

    const formatador = new Intl.RelativeTimeFormat(
      locale,
      {
        numeric: "auto",
      }
    );

    if (absoluto < minuto) {
      return formatador.format(0, "second");
    }

    if (absoluto < hora) {
      return formatador.format(
        Math.round(diferencaMs / minuto),
        "minute"
      );
    }

    if (absoluto < dia) {
      return formatador.format(
        Math.round(diferencaMs / hora),
        "hour"
      );
    }

    return formatador.format(
      Math.round(diferencaMs / dia),
      "day"
    );
  } catch {
    return "";
  }
}

function textoBuscaAtividade(
  atividade: AtividadeItem,
  locale: string
) {
  return normalizarTexto(
    [
      atividade.titulo,
      atividade.descricao,
      atividade.status,
      atividade.turma?.nome,
      atividade.disciplina?.nome,
      atividade.disciplina?.titulo,
      atividade.prazo
        ? new Date(
            atividade.prazo
          ).toLocaleDateString(locale)
        : "",
      atividade.createdAt
        ? new Date(
            atividade.createdAt
          ).toLocaleDateString(locale)
        : "",
      ...(atividade.alunos || []).flatMap(
        (aluno) => [
          aluno.nome,
          aluno.email,
          aluno.matricula,
        ]
      ),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getStatusBadge(status: string) {
  if (status === "PUBLICADA") {
    return "bg-green-100 text-green-700";
  }

  if (
    status === "AGUARDANDO_PUBLICACAO"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "ENCERRADA") {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default function ProfessorAtividadesClient() {
  const t = useTranslations(
    "ProfessorActivities"
  );

  const locale = useLocale();

  const [atividades, setAtividades] =
    useState<AtividadeItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] = useState<
    "sucesso" | "erro" | ""
  >("");

  const [
    acaoEmAndamento,
    setAcaoEmAndamento,
  ] = useState<string>("");

  async function carregarAtividades() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        "/api/professor/atividades"
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
            t("errorLoad")
        );
      }

      setAtividades(
        Array.isArray(json)
          ? json
          : []
      );
    } catch (e: any) {
      setErro(
        e?.message ||
          t("errorLoad")
      );
    } finally {
      setLoading(false);
    }
  }

  function mostrarFeedback(
    tipo: "sucesso" | "erro",
    mensagem: string
  ) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);

    setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3000);
  }

  useEffect(() => {
    carregarAtividades();
  }, []);

  function getStatusLabel(
    status: string
  ) {
    if (status === "PUBLICADA") {
      return t(
        "statuses.published"
      );
    }

    if (
      status ===
      "AGUARDANDO_PUBLICACAO"
    ) {
      return t(
        "statuses.awaitingPublication"
      );
    }

    if (status === "ENCERRADA") {
      return t(
        "statuses.closed"
      );
    }

    return t("statuses.draft");
  }

  const atividadesFiltradas =
    useMemo(() => {
      const termo =
        normalizarTexto(busca);

      if (!termo) {
        return atividades;
      }

      return atividades.filter(
        (atividade) =>
          textoBuscaAtividade(
            atividade,
            locale
          ).includes(termo)
      );
    }, [
      atividades,
      busca,
      locale,
    ]);

  const sugestoesBusca =
    useMemo(() => {
      const termo =
        normalizarTexto(busca);

      if (!termo) {
        return [];
      }

      return atividadesFiltradas
        .slice(0, 8)
        .map((atividade) => ({
          chave: String(
            atividade.id
          ),

          titulo:
            atividade.titulo,

          turma:
            atividade.turma
              ?.nome ||
            t(
              "fallbacks.classUnavailable"
            ),

          disciplina:
            atividade.disciplina
              ?.nome ||
            atividade.disciplina
              ?.titulo ||
            t(
              "fallbacks.subjectUnavailable"
            ),

          prazo: formatarData(
            atividade.prazo,
            locale,
            t(
              "fallbacks.noDeadline"
            )
          ),

          alunos:
            atividade.alunos
              ?.map(
                (aluno) =>
                  aluno.nome
              )
              .filter(Boolean)
              .join(", ") ||
            "",
        }));
    }, [
      busca,
      atividadesFiltradas,
      locale,
      t,
    ]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("title")}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {t("description")}
            </p>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                feedbackTipo ===
                "sucesso"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback}
            </div>
          )}

          <a
            href="/professor/atividades/nova"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t("newActivity")}
          </a>
        </div>

        <div className="relative rounded-2xl border bg-white p-4 shadow-sm">
          <input
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            placeholder={t(
              "search.placeholder"
            )}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          {busca.trim() && (
            <div className="absolute left-4 right-4 top-[68px] z-50 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
              {sugestoesBusca.length ===
              0 ? (
                <p className="px-3 py-3 text-sm text-slate-500">
                  {t(
                    "search.noSuggestions"
                  )}
                </p>
              ) : (
                sugestoesBusca.map(
                  (item) => (
                    <button
                      key={
                        item.chave
                      }
                      type="button"
                      onClick={() =>
                        setBusca(
                          item.titulo
                        )
                      }
                      className="w-full rounded-xl px-3 py-3 text-left hover:bg-blue-50"
                    >
                      <p className="text-sm font-black text-slate-900">
                        {
                          item.titulo
                        }
                      </p>

                      <p className="text-xs text-slate-600">
                        {t(
                          "class",
                          {
                            name: item.turma,
                          }
                        )}{" "}
                        •{" "}
                        {
                          item.disciplina
                        }
                      </p>

                      <p className="text-xs font-semibold text-blue-700">
                        {t(
                          "deadline"
                        )}
                        :{" "}
                        {
                          item.prazo
                        }
                      </p>

                      {item.alunos && (
                        <p className="mt-1 text-xs text-slate-500">
                          {t(
                            "students"
                          )}
                          :{" "}
                          {
                            item.alunos
                          }
                        </p>
                      )}
                    </button>
                  )
                )
              )}
            </div>
          )}
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
          atividadesFiltradas.length ===
            0 && (
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                {t(
                  "empty.title"
                )}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {t(
                  "empty.description"
                )}
              </p>
            </div>
          )}

        {!loading &&
          !erro &&
          atividadesFiltradas.length >
            0 && (
            <div className="grid gap-4">
              {atividadesFiltradas.map(
                (atividade) => (
                  <div
                    key={
                      atividade.id
                    }
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-gray-900">
                            {
                              atividade.titulo
                            }
                          </h2>

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

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "subject"
                              )}
                              :
                            </strong>{" "}
                            {atividade
                              .disciplina
                              ?.nome ||
                              atividade
                                .disciplina
                                ?.titulo ||
                              t(
                                "fallbacks.notInformed"
                              )}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "deadline"
                              )}
                              :
                            </strong>{" "}
                            {formatarData(
                              atividade.prazo,
                              locale,
                              t(
                                "fallbacks.noDeadline"
                              )
                            )}
                          </span>

                          <span>
                            <strong className="font-medium text-gray-700">
                              {t(
                                "maximumGrade"
                              )}
                              :
                            </strong>{" "}
                            {
                              atividade.notaMaxima
                            }
                          </span>

                          {atividade
                            .turma
                            ?.nome && (
                            <span>
                              <strong className="font-medium text-gray-700">
                                {t(
                                  "classLabel"
                                )}
                                :
                              </strong>{" "}
                              {
                                atividade
                                  .turma
                                  .nome
                              }
                            </span>
                          )}
                        </div>

                        {atividade.createdAt && (
                          <span className="block text-sm text-gray-500">
                            <strong className="font-medium text-gray-700">
                              {t(
                                "createdAt"
                              )}
                              :
                            </strong>{" "}
                            {formatarDataCriacao(
                              atividade.createdAt,
                              locale
                            )}{" "}
                            •{" "}
                            {formatarTempoRelativo(
                              atividade.createdAt,
                              locale
                            )}
                          </span>
                        )}

                        {atividade.descricao && (
                          <p className="text-sm text-gray-600">
                            {
                              atividade.descricao
                            }
                          </p>
                        )}

                        {atividade.anexos &&
                          atividade
                            .anexos
                            .length >
                            0 && (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                {t(
                                  "attachments"
                                )}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {atividade.anexos.map(
                                  (
                                    anexo
                                  ) => (
                                    <a
                                      key={
                                        anexo.id
                                      }
                                      href={
                                        anexo.url
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"
                                    >
                                      📎{" "}
                                      {anexo.arquivoNome ||
                                        anexo.titulo ||
                                        t(
                                          "fallbacks.file"
                                        )}
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/professor/atividades/${atividade.id}/editar`}
                          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {t("open")}
                        </a>

                        {atividade.status ===
                          "AGUARDANDO_PUBLICACAO" && (
                          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                            <strong>
                              📤{" "}
                              {t(
                                "support.sent"
                              )}
                            </strong>

                            {atividade.enviadoParaApoioDocenteEm && (
                              <p className="mt-1">
                                {t(
                                  "support.sentAt"
                                )}
                                :{" "}
                                {formatarData(
                                  atividade.enviadoParaApoioDocenteEm,
                                  locale,
                                  "-"
                                )}
                              </p>
                            )}
                          </div>
                        )}

                        {atividade.status ===
                          "PUBLICADA" &&
                          atividade.publicadoPeloApoioDocenteEm && (
                            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                              <strong>
                                ✅{" "}
                                {t(
                                  "support.published"
                                )}
                              </strong>

                              {atividade
                                .publicadoPor
                                ?.nome && (
                                <p className="mt-1">
                                  {t(
                                    "support.publishedBy"
                                  )}
                                  :{" "}
                                  {
                                    atividade
                                      .publicadoPor
                                      .nome
                                  }
                                </p>
                              )}

                              <p className="mt-1">
                                {t(
                                  "support.publishedAt"
                                )}
                                :{" "}
                                {formatarData(
                                  atividade.publicadoPeloApoioDocenteEm,
                                  locale,
                                  "-"
                                )}
                              </p>
                            </div>
                          )}

                        {atividade.status ===
                          "RASCUNHO" && (
                          <button
                            onClick={async () => {
                              try {
                                setAcaoEmAndamento(
                                  `publicar-${atividade.id}`
                                );

                                const res =
                                  await fetch(
                                    `/api/professor/atividades/${atividade.id}/publicar`,
                                    {
                                      method:
                                        "POST",
                                    }
                                  );

                                const data =
                                  await res.json();

                                if (
                                  !res.ok
                                ) {
                                  mostrarFeedback(
                                    "erro",
                                    data?.error ||
                                      t(
                                        "feedback.publishError"
                                      )
                                  );

                                  return;
                                }

                                mostrarFeedback(
                                  "sucesso",
                                  t(
                                    "feedback.publishSuccess"
                                  )
                                );

                                await carregarAtividades();
                              } catch (
                                error
                              ) {
                                console.error(
                                  error
                                );

                                mostrarFeedback(
                                  "erro",
                                  t(
                                    "feedback.publishError"
                                  )
                                );
                              } finally {
                                setAcaoEmAndamento(
                                  ""
                                );
                              }
                            }}
                            disabled={
                              acaoEmAndamento ===
                              `publicar-${atividade.id}`
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {acaoEmAndamento ===
                            `publicar-${atividade.id}`
                              ? t(
                                  "actions.publishing"
                                )
                              : t(
                                  "actions.publish"
                                )}
                          </button>
                        )}

                        {atividade.status ===
                          "RASCUNHO" && (
                          <button
                            onClick={async () => {
                              try {
                                setAcaoEmAndamento(
                                  `apoio-${atividade.id}`
                                );

                                const res =
                                  await fetch(
                                    `/api/professor/atividades/${atividade.id}/enviar-apoio-docente`,
                                    {
                                      method:
                                        "POST",
                                    }
                                  );

                                const data =
                                  await res.json();

                                if (
                                  !res.ok
                                ) {
                                  mostrarFeedback(
                                    "erro",
                                    data?.error ||
                                      t(
                                        "feedback.supportError"
                                      )
                                  );

                                  return;
                                }

                                mostrarFeedback(
                                  "sucesso",
                                  t(
                                    "feedback.supportSuccess"
                                  )
                                );

                                await carregarAtividades();
                              } catch (
                                error
                              ) {
                                console.error(
                                  error
                                );

                                mostrarFeedback(
                                  "erro",
                                  t(
                                    "feedback.supportError"
                                  )
                                );
                              } finally {
                                setAcaoEmAndamento(
                                  ""
                                );
                              }
                            }}
                            disabled={
                              acaoEmAndamento ===
                              `apoio-${atividade.id}`
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {acaoEmAndamento ===
                            `apoio-${atividade.id}`
                              ? t(
                                  "actions.sending"
                                )
                              : t(
                                  "actions.sendSupport"
                                )}
                          </button>
                        )}

                        {atividade.status ===
                          "PUBLICADA" && (
                          <button
                            onClick={async () => {
                              try {
                                setAcaoEmAndamento(
                                  `despublicar-${atividade.id}`
                                );

                                const res =
                                  await fetch(
                                    `/api/professor/atividades/${atividade.id}/despublicar`,
                                    {
                                      method:
                                        "POST",
                                    }
                                  );

                                const data =
                                  await res.json();

                                if (
                                  !res.ok
                                ) {
                                  mostrarFeedback(
                                    "erro",
                                    data?.error ||
                                      t(
                                        "feedback.returnDraftError"
                                      )
                                  );

                                  return;
                                }

                                mostrarFeedback(
                                  "sucesso",
                                  t(
                                    "feedback.returnDraftSuccess"
                                  )
                                );

                                await carregarAtividades();
                              } catch (
                                error
                              ) {
                                console.error(
                                  error
                                );

                                mostrarFeedback(
                                  "erro",
                                  t(
                                    "feedback.returnDraftError"
                                  )
                                );
                              } finally {
                                setAcaoEmAndamento(
                                  ""
                                );
                              }
                            }}
                            disabled={
                              acaoEmAndamento ===
                              `despublicar-${atividade.id}`
                            }
                            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {acaoEmAndamento ===
                            `despublicar-${atividade.id}`
                              ? t(
                                  "actions.returning"
                                )
                              : t(
                                  "actions.returnDraft"
                                )}
                          </button>
                        )}

                        {atividade.status ===
                          "RASCUNHO" && (
                          <button
                            onClick={async () => {
                              try {
                                setAcaoEmAndamento(
                                  `excluir-${atividade.id}`
                                );

                                const res =
                                  await fetch(
                                    `/api/professor/atividades/${atividade.id}`,
                                    {
                                      method:
                                        "DELETE",
                                    }
                                  );

                                const data =
                                  await res.json();

                                if (
                                  !res.ok
                                ) {
                                  mostrarFeedback(
                                    "erro",
                                    data?.error ||
                                      t(
                                        "feedback.deleteError"
                                      )
                                  );

                                  return;
                                }

                                mostrarFeedback(
                                  "sucesso",
                                  t(
                                    "feedback.deleteSuccess"
                                  )
                                );

                                await carregarAtividades();
                              } catch (
                                error
                              ) {
                                console.error(
                                  error
                                );

                                mostrarFeedback(
                                  "erro",
                                  t(
                                    "feedback.deleteError"
                                  )
                                );
                              } finally {
                                setAcaoEmAndamento(
                                  ""
                                );
                              }
                            }}
                            disabled={
                              acaoEmAndamento ===
                              `excluir-${atividade.id}`
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {acaoEmAndamento ===
                            `excluir-${atividade.id}`
                              ? t(
                                  "actions.deleting"
                                )
                              : t(
                                  "actions.delete"
                                )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}