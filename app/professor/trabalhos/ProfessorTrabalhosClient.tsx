"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Trabalho = {
  entregaId: number;
  atividadeId: number;
  titulo: string;
  notaMaxima: number;
  alunoId: number;
  aluno: string;
  matricula?: string;
  turmaId: number;
  turma: string;
  curso?: string;
  semestre: string;
  periodoLetivo: string;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string;
  corrigidaEm?: string | null;
  status: "Enviado" | "Avaliado";
  historicos?: {
    id: number;
    texto?: string | null;
    link?: string | null;
    arquivoUrl?: string | null;
    nota?: number | null;
    feedback?: string | null;
    entregueEm?: string | null;
    corrigidaEm?: string | null;
    versao: number;
  }[];
};

function normalizarTexto(
  valor: string
) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();
}

function calcularSimilaridade(
  busca: string,
  texto: string
) {
  const b =
    normalizarTexto(busca);

  const t =
    normalizarTexto(texto);

  if (!b || !t) {
    return 0;
  }

  if (t.startsWith(b)) {
    return 100;
  }

  if (t.includes(b)) {
    return 90;
  }

  let iguais = 0;

  for (const letra of b) {
    if (t.includes(letra)) {
      iguais++;
    }
  }

  return Math.round(
    (iguais /
      Math.max(
        b.length,
        1
      )) *
      70
  );
}

function formatarData(
  data: string | null | undefined,
  locale: string
) {
  if (!data) {
    return "-";
  }

  try {
    const valor =
      new Date(data);

    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {
      return data;
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "medium",
      }
    ).format(valor);
  } catch {
    return data;
  }
}

export default function ProfessorTrabalhosClient() {
  const t =
    useTranslations(
      "ProfessorWorks"
    );

  const locale =
    useLocale();

  const [
    trabalhos,
    setTrabalhos,
  ] = useState<Trabalho[]>([]);

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    abertos,
    setAbertos,
  ] = useState<
    Record<string, boolean>
  >({});

  function getStatusLabel(
    status: Trabalho["status"]
  ) {
    if (
      status === "Avaliado"
    ) {
      return t(
        "statuses.evaluated"
      );
    }

    return t(
      "statuses.sent"
    );
  }

  async function carregarTrabalhos() {
    try {
      setLoading(true);
      setErro("");

      const res =
        await fetch(
          "/api/professor/trabalhos",
          {
            credentials:
              "include",
            cache: "no-store",
          }
        );

      const json =
        (await res.json()) as {
          error?: string;
          trabalhos?: Trabalho[];
        };

      if (!res.ok) {
        throw new Error(
          t("errorLoad")
        );
      }

      setTrabalhos(
        Array.isArray(
          json.trabalhos
        )
          ? json.trabalhos
          : []
      );
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t("errorLoad");

      setErro(mensagem);
      setTrabalhos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTrabalhos();
  }, []);

  function alternar(
    chave: string
  ) {
    setAbertos(
      (prev) => ({
        ...prev,
        [chave]:
          !prev[chave],
      })
    );
  }

  const sugestoes =
    useMemo(() => {
      const termo =
        normalizarTexto(
          busca
        );

      if (!termo) {
        return [];
      }

      const opcoes =
        trabalhos
          .flatMap(
            (trabalho) => [
              trabalho.aluno,
              trabalho.matricula ||
                "",
              trabalho.turma,
              trabalho.curso ||
                "",
              trabalho.semestre,
              trabalho.periodoLetivo,
              trabalho.titulo,
              getStatusLabel(
                trabalho.status
              ),
              String(
                trabalho.nota ??
                  ""
              ),
              trabalho.feedback ||
                "",
            ]
          )
          .filter(Boolean);

      const unicas =
        Array.from(
          new Set(opcoes)
        );

      return unicas
        .map((opcao) => ({
          texto: opcao,
          score:
            calcularSimilaridade(
              busca,
              opcao
            ),
        }))
        .filter(
          (item) =>
            item.score >= 35
        )
        .sort((a, b) => {
          if (
            b.score !==
            a.score
          ) {
            return (
              b.score -
              a.score
            );
          }

          return a.texto.localeCompare(
            b.texto,
            locale
          );
        })
        .slice(0, 8);
    }, [
      busca,
      trabalhos,
      locale,
      t,
    ]);

  const trabalhosFiltrados =
    useMemo(() => {
      const termo =
        normalizarTexto(
          busca
        );

      if (!termo) {
        return trabalhos;
      }

      return trabalhos
        .map(
          (trabalho) => {
            const textoBusca =
              [
                trabalho.aluno,
                trabalho.matricula,
                trabalho.turma,
                trabalho.curso,
                trabalho.semestre,
                trabalho.periodoLetivo,
                trabalho.titulo,
                getStatusLabel(
                  trabalho.status
                ),
                String(
                  trabalho.nota ??
                    ""
                ),
                trabalho.feedback ||
                  "",
              ].join(" ");

            return {
              trabalho,
              score:
                calcularSimilaridade(
                  busca,
                  textoBusca
                ),
            };
          }
        )
        .filter(
          (item) =>
            item.score >= 35
        )
        .sort((a, b) => {
          if (
            b.score !==
            a.score
          ) {
            return (
              b.score -
              a.score
            );
          }

          return a.trabalho.aluno.localeCompare(
            b.trabalho.aluno,
            locale
          );
        })
        .map(
          (item) =>
            item.trabalho
        );
    }, [
      busca,
      trabalhos,
      locale,
      t,
    ]);

  const agrupado =
    useMemo(() => {
      const mapa: Record<
        string,
        Record<
          string,
          Record<
            string,
            Trabalho[]
          >
        >
      > = {};

      for (
        const trabalho
        of trabalhosFiltrados
      ) {
        const periodo =
          trabalho.periodoLetivo ||
          t(
            "fallbacks.periodUnavailable"
          );

        const semestre =
          trabalho.semestre ||
          t(
            "fallbacks.semesterUnavailable"
          );

        const turma =
          trabalho.turma ||
          t(
            "fallbacks.classUnavailable"
          );

        if (!mapa[periodo]) {
          mapa[periodo] =
            {};
        }

        if (
          !mapa[periodo][
            semestre
          ]
        ) {
          mapa[periodo][
            semestre
          ] = {};
        }

        if (
          !mapa[periodo][
            semestre
          ][turma]
        ) {
          mapa[periodo][
            semestre
          ][turma] = [];
        }

        mapa[periodo][
          semestre
        ][turma].push(
          trabalho
        );
      }

      return mapa;
    }, [
      trabalhosFiltrados,
      t,
    ]);

  return (
    <main className="space-y-5 p-4 text-slate-900">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {t("title")}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {t(
            "description"
          )}
        </p>
      </section>

      <section className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          {t(
            "search.label"
          )}
        </label>

        <input
          type="search"
          value={busca}
          onChange={(e) =>
            setBusca(
              e.target.value
            )
          }
          placeholder={t(
            "search.placeholder"
          )}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
        />

        {busca &&
          sugestoes.length >
            0 && (
            <div className="absolute left-4 right-4 top-[88px] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {sugestoes.map(
                (
                  sugestao
                ) => (
                  <button
                    key={
                      sugestao.texto
                    }
                    type="button"
                    onClick={() =>
                      setBusca(
                        sugestao.texto
                      )
                    }
                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50"
                  >
                    {
                      sugestao.texto
                    }
                  </button>
                )
              )}
            </div>
          )}
      </section>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          {t("loading")}
        </div>
      )}

      {!loading &&
        trabalhosFiltrados.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
            {t("empty")}
          </div>
        )}

      {!loading &&
        Object.entries(
          agrupado
        ).map(
          ([
            periodo,
            semestres,
          ]) => {
            const chavePeriodo =
              `periodo-${periodo}`;

            const periodoAberto =
              abertos[
                chavePeriodo
              ] ?? true;

            return (
              <section
                key={periodo}
                className="rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  aria-expanded={
                    periodoAberto
                  }
                  onClick={() =>
                    alternar(
                      chavePeriodo
                    )
                  }
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                      {t(
                        "grouping.yearPeriod"
                      )}
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-900">
                      {
                        periodo
                      }
                    </h2>
                  </div>

                  <span className="text-2xl font-black text-slate-500">
                    {periodoAberto
                      ? "−"
                      : "+"}
                  </span>
                </button>

                {periodoAberto && (
                  <div className="space-y-4 border-t border-slate-100 p-4">
                    {Object.entries(
                      semestres
                    ).map(
                      ([
                        semestre,
                        turmas,
                      ]) => {
                        const chaveSemestre =
                          `${chavePeriodo}-semestre-${semestre}`;

                        const semestreAberto =
                          abertos[
                            chaveSemestre
                          ] ??
                          true;

                        return (
                          <div
                            key={
                              semestre
                            }
                            className="rounded-2xl border border-slate-200 bg-slate-50"
                          >
                            <button
                              type="button"
                              aria-expanded={
                                semestreAberto
                              }
                              onClick={() =>
                                alternar(
                                  chaveSemestre
                                )
                              }
                              className="flex w-full items-center justify-between px-4 py-3 text-left"
                            >
                              <h3 className="font-black text-slate-900">
                                {
                                  semestre
                                }
                              </h3>

                              <span className="text-xl font-black text-slate-500">
                                {semestreAberto
                                  ? "−"
                                  : "+"}
                              </span>
                            </button>

                            {semestreAberto && (
                              <div className="space-y-3 border-t border-slate-200 p-3">
                                {Object.entries(
                                  turmas
                                ).map(
                                  ([
                                    turma,
                                    lista,
                                  ]) => {
                                    const chaveTurma =
                                      `${chaveSemestre}-turma-${turma}`;

                                    const turmaAberta =
                                      abertos[
                                        chaveTurma
                                      ] ??
                                      true;

                                    return (
                                      <div
                                        key={
                                          turma
                                        }
                                        className="rounded-2xl border border-slate-200 bg-white"
                                      >
                                        <button
                                          type="button"
                                          aria-expanded={
                                            turmaAberta
                                          }
                                          onClick={() =>
                                            alternar(
                                              chaveTurma
                                            )
                                          }
                                          className="flex w-full items-center justify-between px-4 py-3 text-left"
                                        >
                                          <div>
                                            <h4 className="font-black text-slate-900">
                                              {
                                                turma
                                              }
                                            </h4>

                                            <p className="text-xs text-slate-500">
                                              {t(
                                                "counts.works",
                                                {
                                                  count:
                                                    lista.length,
                                                }
                                              )}
                                            </p>
                                          </div>

                                          <span className="text-xl font-black text-slate-500">
                                            {turmaAberta
                                              ? "−"
                                              : "+"}
                                          </span>
                                        </button>

                                        {turmaAberta && (
                                          <div className="space-y-3 border-t border-slate-100 p-3">
                                            {lista
                                              .slice()
                                              .sort(
                                                (
                                                  a,
                                                  b
                                                ) =>
                                                  a.aluno.localeCompare(
                                                    b.aluno,
                                                    locale
                                                  )
                                              )
                                              .map(
                                                (
                                                  trabalho
                                                ) => (
                                                  <TrabalhoAluno
                                                    key={
                                                      trabalho.entregaId
                                                    }
                                                    trabalho={
                                                      trabalho
                                                    }
                                                  />
                                                )
                                              )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            );
          }
        )}
    </main>
  );
}

function TrabalhoAluno({
  trabalho,
}: {
  trabalho: Trabalho;
}) {
  const t =
    useTranslations(
      "ProfessorWorks"
    );

  const locale =
    useLocale();

  const avaliado =
    trabalho.status ===
    "Avaliado";

  const qtdVersoes =
    trabalho.historicos
      ?.length || 0;

  const statusLabel =
    avaliado
      ? t(
          "statuses.evaluated"
        )
      : t(
          "statuses.sent"
        );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("student")}
          </p>

          <h5 className="mt-1 text-lg font-black text-slate-900">
            {trabalho.aluno}
          </h5>

          <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
            <p>
              <strong className="text-slate-800">
                {t(
                  "labels.work"
                )}
                :
              </strong>{" "}
              {trabalho.titulo}
            </p>

            {trabalho.matricula && (
              <p>
                <strong className="text-slate-800">
                  {t(
                    "labels.registration"
                  )}
                  :
                </strong>{" "}
                {
                  trabalho.matricula
                }
              </p>
            )}

            <p>
              <strong className="text-slate-800">
                {t(
                  "labels.deliveredAt"
                )}
                :
              </strong>{" "}
              {formatarData(
                trabalho.entregueEm,
                locale
              )}
            </p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
            avaliado
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {trabalho.texto && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          {trabalho.texto}
        </div>
      )}

      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm md:grid-cols-4">
        <ResumoItem
          titulo={t(
            "summary.correction"
          )}
          valor={
            avaliado
              ? formatarData(
                  trabalho.corrigidaEm,
                  locale
                )
              : t(
                  "statuses.pending"
                )
          }
        />

        <ResumoItem
          titulo={t(
            "summary.file"
          )}
          valor={
            trabalho.arquivoUrl
              ? t(
                  "attachments.sent"
                )
              : t(
                  "attachments.notSent"
                )
          }
        />

        <ResumoItem
          titulo={t(
            "summary.link"
          )}
          valor={
            trabalho.link
              ? t(
                  "links.sent"
                )
              : t(
                  "links.notSent"
                )
          }
        />

        <ResumoItem
          titulo={t(
            "summary.versions"
          )}
          valor={
            qtdVersoes > 0
              ? t(
                  "versions.previous",
                  {
                    count:
                      qtdVersoes,
                  }
                )
              : t(
                  "versions.none"
                )
          }
        />
      </div>

      {avaliado ? (
        <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 md:grid-cols-[160px_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              {t("grade")}
            </p>

            <p className="mt-1 text-2xl font-black text-blue-900">
              ⭐{" "}
              {trabalho.nota ??
                "-"}{" "}
              /{" "}
              {
                trabalho.notaMaxima
              }
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {t("feedback")}
            </p>

            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
              {trabalho.feedback ||
                t(
                  "noFeedback"
                )}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          {t(
            "correctionPending"
          )}
        </div>
      )}

      {trabalho.historicos &&
        trabalho.historicos
          .length > 0 && (
          <details className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <summary className="cursor-pointer text-sm font-black text-amber-900">
              {t(
                "history.title"
              )}
            </summary>

            <div className="mt-3 space-y-3">
              {trabalho.historicos.map(
                (
                  historico
                ) => (
                  <div
                    key={
                      historico.id
                    }
                    className="rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-700"
                  >
                    <p className="font-bold text-slate-900">
                      {t(
                        "history.version",
                        {
                          number:
                            historico.versao,
                        }
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t(
                        "history.sentAt"
                      )}
                      :{" "}
                      {formatarData(
                        historico.entregueEm,
                        locale
                      )}
                    </p>

                    {historico.texto && (
                      <p className="mt-2 whitespace-pre-line">
                        {
                          historico.texto
                        }
                      </p>
                    )}

                    {historico.arquivoUrl && (
                      <a
                        href={
                          historico.arquivoUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-sm font-bold text-blue-600 hover:underline"
                      >
                        {t(
                          "history.openFile"
                        )}
                      </a>
                    )}

                    {historico.link && (
                      <a
                        href={
                          historico.link
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-sm font-bold text-blue-600 hover:underline"
                      >
                        {t(
                          "history.openLink"
                        )}
                      </a>
                    )}
                  </div>
                )
              )}
            </div>
          </details>
        )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {trabalho.arquivoUrl && (
            <a
              href={
                trabalho.arquivoUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"
            >
              📎{" "}
              {t(
                "actions.openFile"
              )}
            </a>
          )}

          {trabalho.link && (
            <a
              href={
                trabalho.link
              }
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"
            >
              🌐{" "}
              {t(
                "actions.openLink"
              )}
            </a>
          )}
        </div>

        <Link
          href={`/professor/trabalhos/${trabalho.entregaId}`}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {avaliado
            ? t(
                "actions.editCorrection"
              )
            : t(
                "actions.correctSubmission"
              )}
        </Link>
      </div>
    </article>
  );
}

function ResumoItem({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {valor}
      </p>
    </div>
  );
}