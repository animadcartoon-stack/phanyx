"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslations } from "next-intl";

type TipoQuestao =
  | "MULTIPLA_ESCOLHA"
  | "DISCURSIVA";

type Alternativa = {
  texto: string;
  correta: boolean;
};

export default function NovaQuestaoPage() {
  const params = useParams();
  const router = useRouter();

  const t = useTranslations(
    "ProfessorNewQuestion"
  );

  const provaId = String(
    params?.provaId || ""
  );

  const [
    enunciado,
    setEnunciado,
  ] = useState("");

  const [
    respostaModelo,
    setRespostaModelo,
  ] = useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoQuestao>(
      "MULTIPLA_ESCOLHA"
    );

  const [
    valor,
    setValor,
  ] = useState("1");

  const [
    alternativas,
    setAlternativas,
  ] = useState<
    Alternativa[]
  >([
    {
      texto: "",
      correta: true,
    },
    {
      texto: "",
      correta: false,
    },
    {
      texto: "",
      correta: false,
    },
    {
      texto: "",
      correta: false,
    },
  ]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const descricaoTipo =
    useMemo(() => {
      if (
        tipo ===
        "DISCURSIVA"
      ) {
        return t(
          "questionType.descriptions.discursive"
        );
      }

      return t(
        "questionType.descriptions.multipleChoice"
      );
    }, [tipo, t]);

  function atualizarAlternativa(
    index: number,
    texto: string
  ) {
    setAlternativas(
      (atuais) =>
        atuais.map(
          (
            alternativa,
            i
          ) =>
            i === index
              ? {
                  ...alternativa,
                  texto,
                }
              : alternativa
        )
    );
  }

  function marcarCorreta(
    index: number
  ) {
    setAlternativas(
      (atuais) =>
        atuais.map(
          (
            alternativa,
            i
          ) => ({
            ...alternativa,
            correta:
              i === index,
          })
        )
    );
  }

  function adicionarAlternativa() {
    setAlternativas(
      (atuais) => [
        ...atuais,
        {
          texto: "",
          correta: false,
        },
      ]
    );
  }

  function removerAlternativa(
    index: number
  ) {
    setAlternativas(
      (atuais) => {
        if (
          atuais.length <= 2
        ) {
          return atuais;
        }

        const novas =
          atuais
            .filter(
              (
                _,
                i
              ) =>
                i !== index
            )
            .map(
              (alternativa) => ({
                ...alternativa,
              })
            );

        if (
          !novas.some(
            (alternativa) =>
              alternativa.correta
          )
        ) {
          novas[0] = {
            ...novas[0],
            correta: true,
          };
        }

        return novas;
      }
    );
  }

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");

    const valorNumerico =
      Number(valor);

    if (
      !enunciado.trim()
    ) {
      setErro(
        t(
          "validation.statementRequired"
        )
      );

      return;
    }

    if (
      !Number.isFinite(
        valorNumerico
      ) ||
      valorNumerico <= 0
    ) {
      setErro(
        t(
          "validation.invalidValue"
        )
      );

      return;
    }

    const alternativasValidas =
      alternativas
        .map(
          (
            alternativa
          ) => ({
            texto:
              alternativa.texto.trim(),
            correta:
              alternativa.correta,
          })
        )
        .filter(
          (
            alternativa
          ) =>
            alternativa.texto
              .length > 0
        );

    if (
      tipo ===
      "MULTIPLA_ESCOLHA"
    ) {
      if (
        alternativasValidas.length <
        2
      ) {
        setErro(
          t(
            "validation.minimumAlternatives"
          )
        );

        return;
      }

      const corretas =
        alternativasValidas.filter(
          (
            alternativa
          ) =>
            alternativa.correta
        ).length;

      if (corretas !== 1) {
        setErro(
          t(
            "validation.oneCorrectAlternative"
          )
        );

        return;
      }
    }

    try {
      setLoading(true);
      setErro("");

      const res =
        await fetch(
          `/api/professor/provas/${provaId}/questoes`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                enunciado:
                  enunciado.trim(),

                tipo,

                valor:
                  valorNumerico,

                respostaModelo:
                  tipo ===
                    "DISCURSIVA" &&
                  respostaModelo.trim()
                    ? respostaModelo.trim()
                    : null,

                alternativas:
                  tipo ===
                  "MULTIPLA_ESCOLHA"
                    ? alternativasValidas
                    : [],
              }
            ),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.createError"
          )
        );
      }

      router.push(
        `/professor/provas/${provaId}/questoes/${data.id}`
      );
    } catch {
      setErro(
        t(
          "feedback.createError"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Link
            href={`/professor/provas/${provaId}`}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← {t("back")}
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            {t(
              "description"
            )}
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {erro && (
            <div
              aria-live="assertive"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            >
              {erro}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="tipo-questao"
                className="block text-sm font-medium text-slate-900 dark:text-white"
              >
                {t(
                  "questionType.label"
                )}
              </label>

              <select
                id="tipo-questao"
                value={tipo}
                onChange={(e) =>
                  setTipo(
                    e.target
                      .value as TipoQuestao
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="MULTIPLA_ESCOLHA">
                  {t(
                    "questionType.multipleChoice"
                  )}
                </option>

                <option value="DISCURSIVA">
                  {t(
                    "questionType.discursive"
                  )}
                </option>
              </select>

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {descricaoTipo}
              </p>
            </div>

            <div>
              <label
                htmlFor="valor-questao"
                className="block text-sm font-medium text-slate-900 dark:text-white"
              >
                {t(
                  "value.label"
                )}
              </label>

              <input
                id="valor-questao"
                type="number"
                min="0.1"
                step="0.1"
                value={valor}
                onChange={(e) =>
                  setValor(
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="enunciado-questao"
              className="block text-sm font-medium text-slate-900 dark:text-white"
            >
              {t(
                "statement.label"
              )}
            </label>

            <textarea
              id="enunciado-questao"
              value={enunciado}
              onChange={(e) =>
                setEnunciado(
                  e.target.value
                )
              }
              placeholder={t(
                "statement.placeholder"
              )}
              rows={6}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              required
            />
          </div>

          {tipo ===
            "MULTIPLA_ESCOLHA" && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {t(
                  "alternatives.title"
                )}
              </h2>

              <p className="text-sm text-slate-700 dark:text-slate-300">
                {t(
                  "alternatives.description"
                )}
              </p>

              {alternativas.map(
                (
                  alternativa,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center"
                  >
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                      <input
                        type="radio"
                        name="alternativa-correta"
                        checked={
                          alternativa.correta
                        }
                        onChange={() =>
                          marcarCorreta(
                            index
                          )
                        }
                        className="h-4 w-4"
                      />

                      {t(
                        "alternatives.correct"
                      )}
                    </label>

                    <input
                      type="text"
                      value={
                        alternativa.texto
                      }
                      onChange={(
                        e
                      ) =>
                        atualizarAlternativa(
                          index,
                          e.target
                            .value
                        )
                      }
                      placeholder={t(
                        "alternatives.placeholder",
                        {
                          number:
                            index +
                            1,
                        }
                      )}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removerAlternativa(
                          index
                        )
                      }
                      disabled={
                        alternativas.length <=
                        2
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t(
                        "alternatives.remove"
                      )}
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={
                  adicionarAlternativa
                }
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
              >
                +{" "}
                {t(
                  "alternatives.add"
                )}
              </button>
            </div>
          )}

          {tipo ===
            "DISCURSIVA" && (
            <div>
              <label
                htmlFor="resposta-modelo"
                className="block text-sm font-medium text-slate-900 dark:text-white"
              >
                {t(
                  "modelAnswer.label"
                )}
              </label>

              <textarea
                id="resposta-modelo"
                value={
                  respostaModelo
                }
                onChange={(e) =>
                  setRespostaModelo(
                    e.target.value
                  )
                }
                placeholder={t(
                  "modelAnswer.placeholder"
                )}
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/professor/provas/${provaId}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t(
                "actions.cancel"
              )}
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? t(
                    "actions.creating"
                  )
                : t(
                    "actions.create"
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}