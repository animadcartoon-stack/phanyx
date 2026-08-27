"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type AtividadeResponse = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima: number;
  status: string;
  turmaId: number;
};

type Turma = {
  id: number;
  nome?: string | null;
};

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

function toDatetimeLocal(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(
    value
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const pad = (
    numero: number
  ) =>
    String(numero).padStart(
      2,
      "0"
    );

  const year =
    date.getFullYear();

  const month = pad(
    date.getMonth() + 1
  );

  const day = pad(
    date.getDate()
  );

  const hours = pad(
    date.getHours()
  );

  const minutes = pad(
    date.getMinutes()
  );

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditarAtividadePage() {
  const params = useParams();

  const atividadeId = String(
    params?.atividadeId || ""
  );

  const t = useTranslations(
    "ProfessorEditActivity"
  );

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    prazo,
    setPrazo,
  ] = useState("");

  const [
    notaMaxima,
    setNotaMaxima,
  ] = useState("10");

  const [
    status,
    setStatus,
  ] = useState(
    "RASCUNHO"
  );

  const [
    turmaId,
    setTurmaId,
  ] = useState("");

  const [
    turmas,
    setTurmas,
  ] = useState<Turma[]>([]);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erroCarregamento,
    setErroCarregamento,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] =
    useState<FeedbackTipo>(
      ""
    );

  const [
    erroTitulo,
    setErroTitulo,
  ] = useState("");

  const [
    erroTurmaId,
    setErroTurmaId,
  ] = useState("");

  const [
    erroNotaMaxima,
    setErroNotaMaxima,
  ] = useState("");

  const [
    erroPrazo,
    setErroPrazo,
  ] = useState("");

  const statusNormalizado =
    String(status || "")
      .trim()
      .toUpperCase();

  const podeEditar =
    statusNormalizado ===
    "RASCUNHO";

  const turmasUnicas =
    useMemo(() => {
      const mapa =
        new Map<
          number,
          Turma
        >();

      for (const turma of turmas) {
        if (
          !mapa.has(
            turma.id
          )
        ) {
          mapa.set(
            turma.id,
            turma
          );
        }
      }

      return Array.from(
        mapa.values()
      ).sort((a, b) => {
        const nomeA =
          a.nome?.trim() ||
          String(a.id);

        const nomeB =
          b.nome?.trim() ||
          String(b.id);

        return nomeA.localeCompare(
          nomeB
        );
      });
    }, [turmas]);

  const turmaAtualNaLista =
    useMemo(() => {
      if (!turmaId) {
        return true;
      }

      return turmasUnicas.some(
        (turma) =>
          String(
            turma.id
          ) === turmaId
      );
    }, [
      turmaId,
      turmasUnicas,
    ]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer =
      setTimeout(() => {
        setFeedback("");
        setFeedbackTipo("");
      }, 3500);

    return () =>
      clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(
    tipo: Exclude<
      FeedbackTipo,
      ""
    >,
    mensagem: string
  ) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  function limparErrosCampo() {
    setErroTitulo("");
    setErroTurmaId("");
    setErroNotaMaxima("");
    setErroPrazo("");
  }

  function labelStatus(
    valor: string
  ) {
    const normalizado =
      String(valor || "")
        .trim()
        .toUpperCase();

    if (
      normalizado ===
      "RASCUNHO"
    ) {
      return t(
        "status.draft"
      );
    }

    if (
      normalizado ===
      "PUBLICADA"
    ) {
      return t(
        "status.published"
      );
    }

    if (
      normalizado ===
      "ENCERRADA"
    ) {
      return t(
        "status.closed"
      );
    }

    return t(
      "status.unknown"
    );
  }

  function statusClasses(
    valor: string
  ) {
    const normalizado =
      String(valor || "")
        .trim()
        .toUpperCase();

    if (
      normalizado ===
      "PUBLICADA"
    ) {
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300";
    }

    if (
      normalizado ===
      "ENCERRADA"
    ) {
      return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    }

    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  }

  const carregarDados =
    useCallback(
      async () => {
        if (!atividadeId) {
          setErroCarregamento(
            t(
              "feedback.loadError"
            )
          );

          setCarregando(false);
          return;
        }

        try {
          setCarregando(true);
          setErroCarregamento(
            ""
          );
          setFeedback("");
          setFeedbackTipo("");

          const [
            atividadeRes,
            turmasRes,
          ] =
            await Promise.all([
              fetch(
                `/api/professor/atividades/${atividadeId}`,
                {
                  credentials:
                    "include",
                  cache:
                    "no-store",
                }
              ),

              fetch(
                "/api/professor/turmas",
                {
                  credentials:
                    "include",
                  cache:
                    "no-store",
                }
              ),
            ]);

          if (
            !atividadeRes.ok
          ) {
            throw new Error(
              t(
                "feedback.loadError"
              )
            );
          }

          if (
            !turmasRes.ok
          ) {
            throw new Error(
              t(
                "feedback.classesLoadError"
              )
            );
          }

          const atividadeJson =
            await atividadeRes.json();

          const turmasJson =
            await turmasRes.json();

          if (
            !atividadeJson ||
            typeof atividadeJson !==
              "object" ||
            !atividadeJson.id
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          if (
            !Array.isArray(
              turmasJson
            )
          ) {
            throw new Error(
              t(
                "feedback.classesInvalidResponse"
              )
            );
          }

          const atividade =
            atividadeJson as AtividadeResponse;

          setTitulo(
            atividade.titulo ||
              ""
          );

          setDescricao(
            atividade.descricao ||
              ""
          );

          setPrazo(
            toDatetimeLocal(
              atividade.prazo
            )
          );

          setNotaMaxima(
            String(
              typeof atividade.notaMaxima ===
                "number"
                ? atividade.notaMaxima
                : 10
            )
          );

          setStatus(
            String(
              atividade.status ||
                "RASCUNHO"
            ).toUpperCase()
          );

          setTurmaId(
            atividade.turmaId
              ? String(
                  atividade.turmaId
                )
              : ""
          );

          setTurmas(
            turmasJson as Turma[]
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
        } finally {
          setCarregando(false);
        }
      },
      [atividadeId, t]
    );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  function validarFormulario() {
    let valido = true;

    limparErrosCampo();

    if (!titulo.trim()) {
      setErroTitulo(
        t(
          "validation.titleRequired"
        )
      );

      valido = false;
    }

    if (
      !turmaId ||
      !Number.isFinite(
        Number(turmaId)
      ) ||
      Number(turmaId) <= 0
    ) {
      setErroTurmaId(
        t(
          "validation.classRequired"
        )
      );

      valido = false;
    }

    const notaNumerica =
      Number(notaMaxima);

    if (
      !Number.isFinite(
        notaNumerica
      ) ||
      notaNumerica <= 0
    ) {
      setErroNotaMaxima(
        t(
          "validation.invalidMaximumGrade"
        )
      );

      valido = false;
    }

    if (prazo) {
      const dataPrazo =
        new Date(prazo);

      if (
        Number.isNaN(
          dataPrazo.getTime()
        )
      ) {
        setErroPrazo(
          t(
            "validation.invalidDeadline"
          )
        );

        valido = false;
      }
    }

    return valido;
  }

  async function salvarAtividade() {
    setFeedback("");
    setFeedbackTipo("");

    if (!podeEditar) {
      mostrarFeedback(
        "erro",
        t(
          "feedback.editBlocked"
        )
      );

      return;
    }

    if (
      !validarFormulario()
    ) {
      mostrarFeedback(
        "erro",
        t(
          "validation.formInvalid"
        )
      );

      return;
    }

    try {
      setSalvando(true);

      const notaNumerica =
        Number(notaMaxima);

      const res =
        await fetch(
          `/api/professor/atividades/${atividadeId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify(
              {
                titulo:
                  titulo.trim(),

                descricao:
                  descricao.trim(),

                prazo: prazo
                  ? new Date(
                      prazo
                    ).toISOString()
                  : "",

                notaMaxima:
                  notaNumerica,

                status:
                  statusNormalizado,

                turmaId:
                  Number(
                    turmaId
                  ),
              }
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.saveError"
          )
        );
      }

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.saveSuccess"
        )
      );

      setTimeout(() => {
        window.location.href =
          `/professor/atividades/${atividadeId}`;
      }, 700);
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.saveError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setSalvando(false);
    }
  }

  const feedbackClasses =
    useMemo(() => {
      if (
        feedbackTipo ===
        "sucesso"
      ) {
        return "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300";
      }

      if (
        feedbackTipo ===
        "erro"
      ) {
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
      }

      return "";
    }, [feedbackTipo]);

  return (
    <div className="phanyx-professor-editar-atividade space-y-6 p-6 text-slate-900 dark:text-slate-100 md:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>
      </div>

      {feedback && (
        <div
          aria-live="polite"
          className={`rounded-3xl border p-4 text-sm font-medium shadow-sm ${feedbackClasses}`}
        >
          {feedback}
        </div>
      )}

      {carregando && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      )}

      {!carregando &&
        erroCarregamento && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-800 dark:bg-red-950/40">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {
                erroCarregamento
              }
            </p>

            <button
              type="button"
              onClick={() =>
                void carregarDados()
              }
              className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {t(
                "actions.retry"
              )}
            </button>
          </div>
        )}

      {!carregando &&
        !erroCarregamento && (
          <>
            {!podeEditar && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {t(
                  "blockedMessage",
                  {
                    status:
                      labelStatus(
                        status
                      ),
                  }
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <label
                    htmlFor="titulo-atividade"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.title"
                    )}
                  </label>

                  <input
                    id="titulo-atividade"
                    value={titulo}
                    onChange={(e) => {
                      setTitulo(
                        e.target.value
                      );

                      if (
                        erroTitulo
                      ) {
                        setErroTitulo(
                          ""
                        );
                      }
                    }}
                    disabled={
                      !podeEditar
                    }
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none dark:bg-slate-950 dark:text-white ${
                      erroTitulo
                        ? "border-red-400 focus:border-red-500 dark:border-red-700"
                        : "border-slate-300 focus:border-violet-500 dark:border-slate-700"
                    } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400`}
                    placeholder={t(
                      "fields.titlePlaceholder"
                    )}
                  />

                  {erroTitulo && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">
                      {
                        erroTitulo
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="descricao-atividade"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.description"
                    )}
                  </label>

                  <textarea
                    id="descricao-atividade"
                    value={
                      descricao
                    }
                    onChange={(e) =>
                      setDescricao(
                        e.target.value
                      )
                    }
                    disabled={
                      !podeEditar
                    }
                    rows={5}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                    placeholder={t(
                      "fields.descriptionPlaceholder"
                    )}
                  />
                </div>

                <div>
                  <label
                    htmlFor="prazo-atividade"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.deadline"
                    )}
                  </label>

                  <input
                    id="prazo-atividade"
                    type="datetime-local"
                    value={prazo}
                    onChange={(e) => {
                      setPrazo(
                        e.target.value
                      );

                      if (
                        erroPrazo
                      ) {
                        setErroPrazo(
                          ""
                        );
                      }
                    }}
                    disabled={
                      !podeEditar
                    }
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400 ${
                      erroPrazo
                        ? "border-red-400 dark:border-red-700"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  />

                  {erroPrazo && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">
                      {
                        erroPrazo
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div>
                  <label
                    htmlFor="turma-atividade"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.class"
                    )}
                  </label>

                  <select
                    id="turma-atividade"
                    value={
                      turmaId
                    }
                    onChange={(e) => {
                      setTurmaId(
                        e.target.value
                      );

                      if (
                        erroTurmaId
                      ) {
                        setErroTurmaId(
                          ""
                        );
                      }
                    }}
                    disabled={
                      !podeEditar
                    }
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400 ${
                      erroTurmaId
                        ? "border-red-400 dark:border-red-700"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <option value="">
                      {t(
                        "fields.classPlaceholder"
                      )}
                    </option>

                    {!turmaAtualNaLista &&
                      turmaId && (
                        <option
                          value={
                            turmaId
                          }
                        >
                          {t(
                            "currentClassFallback",
                            {
                              id:
                                turmaId,
                            }
                          )}
                        </option>
                      )}

                    {turmasUnicas.map(
                      (
                        turma
                      ) => (
                        <option
                          key={
                            turma.id
                          }
                          value={
                            turma.id
                          }
                        >
                          {turma.nome?.trim() ||
                            t(
                              "classFallback",
                              {
                                id:
                                  turma.id,
                              }
                            )}
                        </option>
                      )
                    )}
                  </select>

                  {erroTurmaId && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">
                      {
                        erroTurmaId
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="nota-maxima-atividade"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.maximumGrade"
                    )}
                  </label>

                  <input
                    id="nota-maxima-atividade"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={
                      notaMaxima
                    }
                    onChange={(e) => {
                      setNotaMaxima(
                        e.target.value
                      );

                      if (
                        erroNotaMaxima
                      ) {
                        setErroNotaMaxima(
                          ""
                        );
                      }
                    }}
                    disabled={
                      !podeEditar
                    }
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-400 ${
                      erroNotaMaxima
                        ? "border-red-400 dark:border-red-700"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  />

                  {erroNotaMaxima && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">
                      {
                        erroNotaMaxima
                      }
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.status"
                    )}
                  </p>

                  <div
                    className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${statusClasses(
                      status
                    )}`}
                  >
                    {labelStatus(
                      status
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "statusHelp"
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="button"
                    onClick={
                      salvarAtividade
                    }
                    disabled={
                      salvando ||
                      !podeEditar
                    }
                    className={`rounded-2xl px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      podeEditar
                        ? "bg-violet-600 text-white hover:bg-violet-700"
                        : "bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {salvando
                      ? t(
                          "actions.saving"
                        )
                      : !podeEditar
                        ? t(
                            "actions.blocked"
                          )
                        : t(
                            "actions.save"
                          )}
                  </button>

                  <Link
                    href={`/professor/atividades/${atividadeId}`}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t(
                      "actions.cancel"
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}