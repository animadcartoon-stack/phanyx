"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAluno } from "@/app/context/AlunoContext";
import PhanyxToast from "@/components/ui/PhanyxToast";

const NOTA_MINIMA = 7;

type AlternativaApi = {
  id: number;
  texto: string;
  ordem?: number | null;
};

type QuestaoApi = {
  id: number;
  enunciado: string;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  valor: number;
  ordem?: number | null;
  alternativas?: AlternativaApi[];
};

type ProvaApi = {
  id: number;
  titulo: string;
  notaMaxima: number;
  tempoMin?: number | null;
  questoes: QuestaoApi[];
};

type IniciarResponse = {
  tentativaId: number;
  prova: ProvaApi;
};

type ResultadoProva = {
  nota: number;
  aprovado: boolean | null;
  tempo: number;
  possuiDiscursivas: boolean;
};

export default function ProvaPage() {
  const router = useRouter();
  const params = useParams<{ disciplinaId: string }>();
  const t = useTranslations("StudentExam");

  const disciplinaId = Number(params.disciplinaId);
  const { salvarNota, notas } = useAluno();

  const notaDaDisciplina = useMemo(() => {
    return notas.find((nota) => nota.disciplinaId === disciplinaId);
  }, [notas, disciplinaId]);

  const inicioProvaRef = useRef(Date.now());
  const finalizouNestaSessaoRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [prova, setProva] = useState<ProvaApi | null>(null);
  const [tentativaId, setTentativaId] = useState<number | null>(null);
  const [respostas, setRespostas] = useState<Record<number, number | string>>(
    {}
  );
  const [erro, setErro] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProva | null>(null);

  useEffect(() => {
    if (notaDaDisciplina && !finalizouNestaSessaoRef.current) {
      router.replace(`/aluno/disciplinas/${disciplinaId}`);
    }
  }, [notaDaDisciplina, router, disciplinaId]);

  useEffect(() => {
    let mounted = true;

    async function carregarEIniciar() {
      if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
        if (mounted) {
          setErroCarregamento(t("invalidSubject"));
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErroCarregamento("");

      try {
        const res = await fetch(
          `/api/aluno/provas/disciplinas/${disciplinaId}/iniciar`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const data = (await res.json().catch(() => null)) as
          | IniciarResponse
          | null;

        if (!mounted) {
          return;
        }

        if (!res.ok || !data?.prova || !data?.tentativaId) {
          setProva(null);
          setTentativaId(null);
          setErroCarregamento(
            res.status === 403 ? t("accessUnavailable") : t("examUnavailable")
          );
          return;
        }

        const questoesOrdenadas = (data.prova.questoes ?? [])
          .slice()
          .sort((a, b) => {
            const ordemA = a.ordem ?? 0;
            const ordemB = b.ordem ?? 0;

            if (ordemA !== ordemB) {
              return ordemA - ordemB;
            }

            return a.id - b.id;
          });

        const provaNormalizada: ProvaApi = {
          ...data.prova,
          questoes: questoesOrdenadas.map((questao) => ({
            ...questao,
            alternativas:
              questao.tipo === "MULTIPLA_ESCOLHA"
                ? (questao.alternativas ?? []).slice().sort((a, b) => {
                    const ordemA = a.ordem ?? 0;
                    const ordemB = b.ordem ?? 0;

                    if (ordemA !== ordemB) {
                      return ordemA - ordemB;
                    }

                    return a.id - b.id;
                  })
                : [],
          })),
        };

        inicioProvaRef.current = Date.now();
        setProva(provaNormalizada);
        setTentativaId(data.tentativaId);
      } catch (error) {
        console.error("Failed to start exam:", error);

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

    carregarEIniciar();

    return () => {
      mounted = false;
    };
  }, [disciplinaId, t]);

  const questoes = prova?.questoes ?? [];

  async function salvarRespostaNoServidor(
    questao: QuestaoApi,
    valor: number | string
  ) {
    if (!tentativaId) {
      throw new Error("Missing attempt identifier");
    }

    const respostaTexto =
      questao.tipo === "DISCURSIVA" ? String(valor).trim() : null;

    const alternativaId =
      questao.tipo === "MULTIPLA_ESCOLHA" && typeof valor === "number"
        ? valor
        : null;

    const res = await fetch(
      `/api/aluno/provas/tentativas/${tentativaId}/responder`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questaoId: questao.id,
          alternativaId,
          respostaTexto,
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Unable to save answer");
    }
  }

  async function responderQuestao(
    questao: QuestaoApi,
    valor: number | string
  ) {
    setRespostas((anteriores) => ({
      ...anteriores,
      [questao.id]: valor,
    }));

    setErro("");

    if (!tentativaId || questao.tipo !== "MULTIPLA_ESCOLHA") {
      return;
    }

    try {
      await salvarRespostaNoServidor(questao, valor);
    } catch (error) {
      console.error("Failed to save answer:", error);
      setErro(t("saveAnswerError"));
    }
  }

  async function finalizarProva() {
    if (!prova || !tentativaId || questoes.length === 0 || finalizando) {
      return;
    }

    const possuiRespostaPendente = questoes.some((questao) => {
      const resposta = respostas[questao.id];

      if (questao.tipo === "MULTIPLA_ESCOLHA") {
        return typeof resposta !== "number";
      }

      return typeof resposta !== "string" || resposta.trim().length === 0;
    });

    if (possuiRespostaPendente) {
      setErro(t("answerAllQuestions"));
      return;
    }

    try {
      setFinalizando(true);
      setErro("");

      for (const questao of questoes) {
        await salvarRespostaNoServidor(questao, respostas[questao.id]);
      }

      const res = await fetch(
        `/api/aluno/provas/tentativas/${tentativaId}/finalizar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          setErro(t("authenticationRequired"));
        } else if (res.status === 403) {
          setErro(t("accessUnavailable"));
        } else if (res.status === 409) {
          setErro(t("attemptUnavailable"));
        } else {
          setErro(t("finishError"));
        }

        return;
      }

      const notaRecebida = Number(data?.notaFinal ?? data?.nota ?? 0);
      const notaFinal = Number(notaRecebida.toFixed(1));
      const tempoEmSegundos = Math.floor(
        (Date.now() - inicioProvaRef.current) / 1000
      );
      const possuiDiscursivas = questoes.some(
        (questao) => questao.tipo === "DISCURSIVA"
      );
      const aprovado = possuiDiscursivas ? null : notaFinal >= NOTA_MINIMA;

      if (!possuiDiscursivas) {
        finalizouNestaSessaoRef.current = true;

        await salvarNota(
          disciplinaId,
          notaFinal,
          Boolean(aprovado),
          tempoEmSegundos,
          []
        );
      }

      setResultado({
        nota: notaFinal,
        aprovado,
        tempo: tempoEmSegundos,
        possuiDiscursivas,
      });
    } catch (error) {
      console.error("Failed to finish exam:", error);
      setErro(t("finishError"));
    } finally {
      setFinalizando(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <p>{t("loadingExam")}</p>
      </main>
    );
  }

  if (!prova || questoes.length === 0) {
    return (
      <main className="min-h-screen bg-white p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p>{erroCarregamento || t("examUnavailable")}</p>

          <button
            type="button"
            onClick={() =>
              router.push(`/aluno/disciplinas/${disciplinaId}`)
            }
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
          >
            {t("back")}
          </button>
        </div>
      </main>
    );
  }

  if (resultado) {
    return (
      <main className="min-h-screen space-y-6 bg-white p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
        {erro && (
          <PhanyxToast
            tipo="erro"
            titulo={t("errorTitle")}
            mensagem={erro}
            onClose={() => setErro("")}
          />
        )}

        <h1 className="text-3xl font-bold">
          {resultado.possuiDiscursivas
            ? t("partialResultTitle")
            : t("resultTitle")}
        </h1>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xl">
            {t("grade")}: <strong>{resultado.nota}</strong>
          </p>

          {resultado.aprovado === null ? (
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
              {t("awaitingTeacherCorrection")}
            </p>
          ) : (
            <p
              className={`text-lg font-semibold ${
                resultado.aprovado
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {resultado.aprovado ? t("passed") : t("failed")}
            </p>
          )}

          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">📋 {t("reviewTitle")}</h2>

            {questoes.map((questao, index) => {
              const resposta = respostas[questao.id];

              return (
                <div
                  key={questao.id}
                  className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <p className="font-medium">
                    {index + 1}. {questao.enunciado}
                  </p>

                  {questao.tipo === "DISCURSIVA" ? (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t("essayPending")}
                      </p>
                      <p>
                        {t("yourAnswer")}: {" "}
                        <strong>{String(resposta ?? "") || "—"}</strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        {t("yourAnswer")}: {" "}
                        <strong>
                          {questao.alternativas?.find(
                            (alternativa) => alternativa.id === resposta
                          )?.texto ?? "—"}
                        </strong>
                      </p>
                      <p className="font-semibold text-blue-700 dark:text-blue-300">
                        {t("objectiveProcessed")}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            ⏱ {t("timeSpent", {
              minutes: Math.floor(resultado.tempo / 60),
              seconds: resultado.tempo % 60,
            })}
          </p>

          {resultado.aprovado === true && (
            <p className="font-medium text-green-700 dark:text-green-300">
              🎉 {t("certificateInformation")}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          {t("backToSubject")}
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-white p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("errorTitle")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      <h1 className="text-3xl font-bold">📝 {prova.titulo}</h1>

      <div className="space-y-6">
        {questoes.map((questao, index) => (
          <div
            key={questao.id}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="font-semibold">
              {index + 1}. {questao.enunciado}
            </h2>

            {questao.tipo === "MULTIPLA_ESCOLHA" ? (
              <div className="space-y-2">
                {(questao.alternativas ?? []).map((alternativa) => (
                  <label
                    key={alternativa.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 dark:text-slate-100 dark:hover:border-blue-800 dark:hover:bg-blue-950/40"
                  >
                    <input
                      type="radio"
                      name={`questao-${questao.id}`}
                      checked={respostas[questao.id] === alternativa.id}
                      onChange={() =>
                        responderQuestao(questao, alternativa.id)
                      }
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>{alternativa.texto}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950"
                  placeholder={t("answerPlaceholder")}
                  value={
                    typeof respostas[questao.id] === "string"
                      ? String(respostas[questao.id])
                      : ""
                  }
                  onChange={(event) =>
                    responderQuestao(questao, event.target.value)
                  }
                />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t("essayCorrectionInformation")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={finalizarProva}
        disabled={finalizando}
        className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-70"
      >
        {finalizando ? t("finishingExam") : t("finishExam")}
      </button>
    </main>
  );
}