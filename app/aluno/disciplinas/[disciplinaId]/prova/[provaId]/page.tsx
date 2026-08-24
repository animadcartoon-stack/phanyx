"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";

type Alternativa = {
  id: number;
  texto: string;
};

type Questao = {
  id: number;
  pergunta: string;
  tipo: string;
  valor: number;
  alternativas: Alternativa[];
};

type Prova = {
  id: number;
  titulo: string;
  notaMaxima: number;
  ativa: boolean;
  questoes: Questao[];
};

type ResultadoFinal = {
  mensagem?: string;
  nota?: number;
  notaFinal?: number;
  notaMaxima?: number;
  aprovado?: boolean;
};

type RespostaQuestao = {
  alternativaId?: number;
  respostaTexto?: string;
};

function questaoEhMultiplaEscolha(questao: Questao) {
  return String(questao.tipo || "").toUpperCase() === "MULTIPLA_ESCOLHA";
}

export default function ExecutarProvaPage() {
  const params = useParams<{ disciplinaId: string; provaId: string }>();
  const router = useRouter();
  const t = useTranslations("StudentExamExecution");

  const disciplinaId = Number(params.disciplinaId);
  const provaId = Number(params.provaId);

  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [prova, setProva] = useState<Prova | null>(null);
  const [tentativaId, setTentativaId] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [erro, setErro] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [salvandoQuestaoId, setSalvandoQuestaoId] = useState<number | null>(
    null
  );
  const [ultimaQuestaoSalvaId, setUltimaQuestaoSalvaId] = useState<
    number | null
  >(null);
  const [respostas, setRespostas] = useState<
    Record<number, RespostaQuestao>
  >({});

  useEffect(() => {
    let mounted = true;

    async function iniciarPaginaDaProva() {
      if (!Number.isFinite(provaId) || provaId <= 0) {
        if (mounted) {
          setErroCarregamento(t("invalidExam"));
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErroCarregamento("");

      try {
        const respostaProva = await fetch(`/api/aluno/provas/${provaId}`, {
          credentials: "include",
          cache: "no-store",
        });

        const provaData = await respostaProva.json().catch(() => null);

        if (!respostaProva.ok || !provaData?.id) {
          if (!mounted) {
            return;
          }

          setProva(null);
          setErroCarregamento(
            respostaProva.status === 401
              ? t("authenticationRequired")
              : respostaProva.status === 403
                ? t("accessUnavailable")
                : t("examNotFound")
          );
          return;
        }

        const respostaTentativa = await fetch(
          `/api/aluno/provas/${provaId}/iniciar`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const tentativaData = await respostaTentativa.json().catch(() => null);

        if (!respostaTentativa.ok) {
          if (!mounted) {
            return;
          }

          setProva(null);
          setTentativaId(null);
          setErroCarregamento(
            respostaTentativa.status === 401
              ? t("authenticationRequired")
              : respostaTentativa.status === 409
                ? t("attemptUnavailable")
                : respostaTentativa.status === 403
                  ? t("accessUnavailable")
                  : t("loadError")
          );
          return;
        }

        const idTentativa = Number(
          tentativaData?.tentativaId ?? tentativaData?.tentativa?.id
        );

        if (!Number.isFinite(idTentativa) || idTentativa <= 0) {
          throw new Error("Invalid attempt identifier");
        }

        if (!mounted) {
          return;
        }

        setProva(provaData as Prova);
        setTentativaId(idTentativa);
      } catch (error) {
        console.error("Failed to load exam:", error);

        if (!mounted) {
          return;
        }

        setProva(null);
        setTentativaId(null);
        setErroCarregamento(t("loadError"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    iniciarPaginaDaProva();

    return () => {
      mounted = false;
    };
  }, [provaId, t]);

  const questoes = useMemo(() => prova?.questoes ?? [], [prova]);

  function questaoEstaRespondida(questao: Questao) {
    const resposta = respostas[questao.id];

    if (questaoEhMultiplaEscolha(questao)) {
      return Number.isFinite(Number(resposta?.alternativaId));
    }

    return Boolean(resposta?.respostaTexto?.trim());
  }

  async function enviarResposta(questao: Questao) {
    if (!tentativaId) {
      throw new Error("Missing attempt identifier");
    }

    const resposta = respostas[questao.id] ?? {};

    const response = await fetch(
      `/api/aluno/provas/tentativas/${tentativaId}/responder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          questaoId: questao.id,
          alternativaId: questaoEhMultiplaEscolha(questao)
            ? resposta.alternativaId ?? null
            : null,
          respostaTexto: questaoEhMultiplaEscolha(questao)
            ? null
            : resposta.respostaTexto?.trim() ?? "",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Unable to save answer");
    }
  }

  async function salvarQuestao(questao: Questao) {
    if (salvandoQuestaoId || finalizando) {
      return;
    }

    if (!questaoEstaRespondida(questao)) {
      setErro(t("answerRequired"));
      return;
    }

    try {
      setErro("");
      setSalvandoQuestaoId(questao.id);
      setUltimaQuestaoSalvaId(null);

      await enviarResposta(questao);
      setUltimaQuestaoSalvaId(questao.id);
    } catch (error) {
      console.error("Failed to save answer:", error);
      setErro(t("saveAnswerError"));
    } finally {
      setSalvandoQuestaoId(null);
    }
  }

  async function finalizar() {
    if (!tentativaId || finalizando) {
      return;
    }

    if (questoes.some((questao) => !questaoEstaRespondida(questao))) {
      setErro(t("answerAllQuestions"));
      return;
    }

    try {
      setErro("");
      setFinalizando(true);
      setUltimaQuestaoSalvaId(null);

      for (const questao of questoes) {
        await enviarResposta(questao);
      }

      const response = await fetch(
        `/api/aluno/provas/tentativas/${tentativaId}/finalizar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          setErro(t("authenticationRequired"));
        } else if (response.status === 403) {
          setErro(t("accessUnavailable"));
        } else if (response.status === 409 || response.status === 400) {
          setErro(t("attemptUnavailable"));
        } else {
          setErro(t("finishError"));
        }

        return;
      }

      setResultado(data as ResultadoFinal);
    } catch (error) {
      console.error("Failed to finish exam:", error);
      setErro(t("finishError"));
    } finally {
      setFinalizando(false);
    }
  }

  const notaExibida = Number(resultado?.notaFinal ?? resultado?.nota ?? 0);
  const notaMaximaExibida = Number(
    resultado?.notaMaxima ?? prova?.notaMaxima ?? 10
  );
  const possuiQuestoesDiscursivas = questoes.some(
    (questao) => !questaoEhMultiplaEscolha(questao)
  );

  const aprovado = resultado
    ? possuiQuestoesDiscursivas
      ? null
      : typeof resultado.aprovado === "boolean"
        ? resultado.aprovado
        : notaMaximaExibida > 0
          ? notaExibida >= notaMaximaExibida * 0.6
          : false
    : null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        {t("loadingExam")}
      </div>
    );
  }

  if (!prova) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        <p>{erroCarregamento || t("examNotFound")}</p>

        <button
          type="button"
          onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          {t("backToSubject")}
        </button>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="max-w-3xl space-y-6 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <h1 className="text-2xl font-bold">
            📊 {possuiQuestoesDiscursivas
              ? t("partialResultTitle")
              : t("resultTitle")}
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {possuiQuestoesDiscursivas
              ? t("awaitingTeacherCorrection")
              : t("completedSuccessfully")}
          </p>

          <div className="mt-6 space-y-3">
            <p className="text-3xl font-bold">
              {t("grade")}: {notaExibida} / {notaMaximaExibida}
            </p>

            {aprovado === null ? (
              <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                {t("resultPending")}
              </p>
            ) : (
              <p
                className={`text-lg font-semibold ${
                  aprovado
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {aprovado ? t("passed") : t("failed")}
              </p>
            )}
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() =>
                router.push(`/aluno/disciplinas/${disciplinaId}`)
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              {t("backToSubject")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 p-6 text-slate-900 dark:text-white">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("errorTitle")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">{prova.titulo}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {t("instructions")}
        </p>
      </div>

      <div className="space-y-4">
        {questoes.map((questao, index) => (
          <div
            key={questao.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("questionMeta", {
                    number: index + 1,
                    points: questao.valor,
                  })}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {questao.pergunta}
                </p>
              </div>

              <button
                type="button"
                onClick={() => salvarQuestao(questao)}
                disabled={Boolean(salvandoQuestaoId) || finalizando}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 transition hover:border-blue-400 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                {salvandoQuestaoId === questao.id
                  ? t("saving")
                  : ultimaQuestaoSalvaId === questao.id
                    ? t("saved")
                    : t("save")}
              </button>
            </div>

            {questaoEhMultiplaEscolha(questao) ? (
              <div className="mt-4 space-y-2">
                {(questao.alternativas ?? []).map((alternativa) => (
                  <label
                    key={alternativa.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-blue-950/40"
                  >
                    <input
                      type="radio"
                      name={`q-${questao.id}`}
                      checked={
                        respostas[questao.id]?.alternativaId === alternativa.id
                      }
                      onChange={() => {
                        setUltimaQuestaoSalvaId(null);
                        setRespostas((anteriores) => ({
                          ...anteriores,
                          [questao.id]: {
                            alternativaId: alternativa.id,
                          },
                        }));
                      }}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>{alternativa.texto}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <textarea
                  value={respostas[questao.id]?.respostaTexto ?? ""}
                  onChange={(event) => {
                    setUltimaQuestaoSalvaId(null);
                    setRespostas((anteriores) => ({
                      ...anteriores,
                      [questao.id]: {
                        respostaTexto: event.target.value,
                      },
                    }));
                  }}
                  maxLength={20000}
                  className="min-h-[120px] w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
                  placeholder={t("answerPlaceholder")}
                />
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {t("essayCorrectionInformation")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
          disabled={finalizando}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:border-blue-400 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          ← {t("back")}
        </button>

        <button
          type="button"
          onClick={finalizar}
          disabled={finalizando || Boolean(salvandoQuestaoId)}
          className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
        >
          {finalizando ? t("finishingExam") : t("finishExam")}
        </button>
      </div>
    </div>
  );
}