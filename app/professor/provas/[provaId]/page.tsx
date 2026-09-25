"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
};

type Questao = {
  id: number;
  enunciado: string;  tipo:
    | "MULTIPLA_ESCOLHA"
    | "DISCURSIVA";
  valor: number;
  ordem: number;
  alternativas: Alternativa[];
};

type TurmaProfessor = {
  id: number;
  nome: string;
  disciplinaId: number;
  disciplina?: {
    id: number;
    nome: string;
  } | null;
};

type Prova = {
  id: number;
  titulo: string;
  notaMaxima: number;
  tempoMin?: number | null;
  turmaId: number;
  disciplinaId: number;
  turma?: {
    id: number;
    nome: string;
  } | null;
  disciplina?: {
    id: number;
    nome: string;
  } | null;
  status:
    | "RASCUNHO"
    | "PUBLICADA"
    | "ENCERRADA";
  ativa?: boolean;
  questoes: Questao[];
};

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

export default function ProvaPage() {
  const params = useParams();

  const provaId = String(
    params?.provaId || ""
  );

  const t = useTranslations(
    "ProfessorExamDetail"
  );

  const [
    prova,
    setProva,
  ] = useState<Prova | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    acaoLoading,
    setAcaoLoading,
  ] = useState<
    | ""
    | "publicar"
    | "encerrar"
  >("");

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
    modalEncerrarAberto,
    setModalEncerrarAberto,
  ] = useState(false);

  const [
    turmasProfessor,
    setTurmasProfessor,
  ] = useState<TurmaProfessor[]>([]);

  const [
    disciplinaIdEdicao,
    setDisciplinaIdEdicao,
  ] = useState("");

  const [
    turmaIdEdicao,
    setTurmaIdEdicao,
  ] = useState("");

  const [
    salvandoVinculo,
    setSalvandoVinculo,
  ] = useState(false);

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

  async function carregarProva() {
    if (!provaId) {
      setErro(
        t(
          "feedback.loadError"
        )
      );

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res =
        await fetch(
          `/api/professor/provas/${provaId}`,
          {
            cache: "no-store",
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.loadError"
          )
        );
      }

      setProva({
        ...data,

        status:
          data.status ||
          (data.ativa
            ? "PUBLICADA"
            : "RASCUNHO"),

        questoes:
          (
            data.questoes ||
            []
          ).map(
            (
              questao: any
            ) => ({
              ...questao,

              tipo:
                questao.tipo ===
                "discursiva"
                  ? "DISCURSIVA"
                  : questao.tipo ===
                      "multipla_escolha"
                    ? "MULTIPLA_ESCOLHA"
                    : questao.tipo,
            })
          ),
      });
    } catch {
      setErro(
        t(
          "feedback.loadError"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProva();
  }, [provaId, t]);

  useEffect(() => {
    let ativo = true;

    async function carregarTurmasProfessor() {
      try {
        const res =
          await fetch(
            "/api/professor/turmas",
            {
              cache: "no-store",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error();
        }

        const lista =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.turmas)
              ? data.turmas
              : [];

        if (ativo) {
          setTurmasProfessor(
            lista
          );
        }
      } catch {
        if (ativo) {
          setTurmasProfessor(
            []
          );

          mostrarFeedback(
            "erro",
            t(
              "academicLink.loadError"
            )
          );
        }
      }
    }

    carregarTurmasProfessor();

    return () => {
      ativo = false;
    };
  }, [t]);

  useEffect(() => {
    if (!prova) {
      return;
    }

    setDisciplinaIdEdicao(
      String(
        prova.disciplinaId ||
          prova.disciplina?.id ||
          ""
      )
    );

    setTurmaIdEdicao(
      String(
        prova.turmaId ||
          prova.turma?.id ||
          ""
      )
    );
  }, [
    prova?.id,
    prova?.disciplinaId,
    prova?.turmaId,
  ]);

  const disciplinasDisponiveis =
    useMemo(() => {
      const mapa =
        new Map<
          number,
          {
            id: number;
            nome: string;
          }
        >();

      for (
        const turma of
          turmasProfessor
      ) {
        const id =
          Number(
            turma.disciplinaId ||
              turma.disciplina?.id
          );

        if (
          !Number.isFinite(id) ||
          id <= 0
        ) {
          continue;
        }

        mapa.set(id, {
          id,
          nome:
            turma.disciplina?.nome ||
            String(id),
        });
      }

      return Array.from(
        mapa.values()
      ).sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
      );
    }, [turmasProfessor]);

  const turmasDisponiveis =
    useMemo(() => {
      const disciplinaId =
        Number(
          disciplinaIdEdicao
        );

      if (
        !Number.isFinite(
          disciplinaId
        ) ||
        disciplinaId <= 0
      ) {
        return [];
      }

      return turmasProfessor
        .filter(
          (turma) =>
            Number(
              turma.disciplinaId ||
                turma.disciplina?.id
            ) === disciplinaId
        )
        .sort((a, b) =>
          a.nome.localeCompare(
            b.nome,
            "pt-BR"
          )
        );
    }, [
      turmasProfessor,
      disciplinaIdEdicao,
    ]);

  async function salvarVinculoAcademico() {
    if (!prova) {
      return;
    }

    const disciplinaId =
      Number(
        disciplinaIdEdicao
      );

    const turmaId =
      Number(
        turmaIdEdicao
      );

    if (
      !Number.isFinite(
        disciplinaId
      ) ||
      disciplinaId <= 0 ||
      !Number.isFinite(
        turmaId
      ) ||
      turmaId <= 0
    ) {
      mostrarFeedback(
        "erro",
        t(
          "academicLink.saveError"
        )
      );

      return;
    }

    try {
      setSalvandoVinculo(true);

      const res =
        await fetch(
          `/api/professor/provas/${prova.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "include",
            body: JSON.stringify({
              disciplinaId,
              turmaId,
            }),
          }
        );

      const data =
        await res
          .json()
          .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t(
              "academicLink.saveError"
            )
        );
      }

      await carregarProva();

      mostrarFeedback(
        "sucesso",
        t(
          "academicLink.saveSuccess"
        )
      );
    } catch {
      mostrarFeedback(
        "erro",
        t(
          "academicLink.saveError"
        )
      );
    } finally {
      setSalvandoVinculo(
        false
      );
    }
  }



  const totalQuestoes =
    prova?.questoes?.length ||
    0;

  const totalDiscursivas =
    useMemo(() => {
      return (
        prova?.questoes ||
        []
      ).filter(
        (questao) =>
          questao.tipo ===
          "DISCURSIVA"
      ).length;
    }, [prova]);

  const totalMultiplaEscolha =
    useMemo(() => {
      return (
        prova?.questoes ||
        []
      ).filter(
        (questao) =>
          questao.tipo ===
          "MULTIPLA_ESCOLHA"
      ).length;
    }, [prova]);

  async function publicarProva() {
    if (!prova) {
      return;
    }

    try {
      setAcaoLoading(
        "publicar"
      );

      const res =
        await fetch(
          `/api/professor/provas/${prova.id}/publicar`,
          {
            method: "POST",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.publishError"
          )
        );
      }

      await carregarProva();

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.publishSuccess"
        )
      );
    } catch {
      mostrarFeedback(
        "erro",
        t(
          "feedback.publishError"
        )
      );
    } finally {
      setAcaoLoading("");
    }
  }

  async function encerrarProva() {
    if (!prova) {
      return;
    }

    try {
      setAcaoLoading(
        "encerrar"
      );

      const res =
        await fetch(
          `/api/professor/provas/${prova.id}/encerrar`,
          {
            method: "POST",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.closeError"
          )
        );
      }

      setModalEncerrarAberto(
        false
      );

      await carregarProva();

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.closeSuccess"
        )
      );
    } catch {
      mostrarFeedback(
        "erro",
        t(
          "feedback.closeError"
        )
      );
    } finally {
      setAcaoLoading("");
    }
  }

  function getStatusLabel(
    status: Prova["status"]
  ) {
    if (
      status ===
      "PUBLICADA"
    ) {
      return t(
        "statuses.published"
      );
    }

    if (
      status ===
      "ENCERRADA"
    ) {
      return t(
        "statuses.closed"
      );
    }

    return t(
      "statuses.draft"
    );
  }

  function getStatusClasses(
    status: Prova["status"]
  ) {
    if (
      status ===
      "PUBLICADA"
    ) {
      return "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300";
    }

    if (
      status ===
      "ENCERRADA"
    ) {
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
    }

    return "border-yellow-200 bg-yellow-100 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300";
  }

  if (loading) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("loading")}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-6 text-red-600 dark:text-red-300">
        {erro}
      </div>
    );
  }

  if (!prova) {
    return (
      <div className="p-6 text-slate-600 dark:text-slate-300">
        {t("notFound")}
      </div>
    );
  }

  return (
    <>
      <div className="phanyx-professor-prova-detalhe p-6 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-6xl space-y-6">
          {feedback && (
            <div
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
                feedbackTipo ===
                "sucesso"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/professor/provas"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ←{" "}
                  {t(
                    "back"
                  )}
                </a>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    prova.status
                  )}`}
                >
                  {getStatusLabel(
                    prova.status
                  )}
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {prova.titulo}
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  {t(
                    "description"
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`/professor/provas/${prova.id}/tentativas`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.viewAttempts"
                )}
              </a>

              {prova.status ===
                "RASCUNHO" && (
                <button
                  type="button"
                  onClick={
                    publicarProva
                  }
                  disabled={
                    acaoLoading ===
                    "publicar"
                  }
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acaoLoading ===
                  "publicar"
                    ? t(
                        "actions.publishing"
                      )
                    : t(
                        "actions.publish"
                      )}
                </button>
              )}

              {prova.status !==
                "ENCERRADA" && (
                <button
                  type="button"
                  onClick={() =>
                    setModalEncerrarAberto(
                      true
                    )
                  }
                  disabled={
                    acaoLoading ===
                    "encerrar"
                  }
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acaoLoading ===
                  "encerrar"
                    ? t(
                        "actions.closing"
                      )
                    : t(
                        "actions.close"
                      )}
                </button>
              )}
            </div>
          </div>

          {prova.status ===
            "RASCUNHO" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    "academicLink.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  {t(
                    "academicLink.description"
                  )}
                </p>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "academicLink.discipline"
                    )}
                  </span>

                  <select
                    value={
                      disciplinaIdEdicao
                    }
                    onChange={(event) => {
                      setDisciplinaIdEdicao(
                        event.target.value
                      );

                      setTurmaIdEdicao(
                        ""
                      );
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      {t(
                        "academicLink.selectDiscipline"
                      )}
                    </option>

                    {disciplinasDisponiveis.map(
                      (disciplina) => (
                        <option
                          key={
                            disciplina.id
                          }
                          value={
                            disciplina.id
                          }
                        >
                          {
                            disciplina.nome
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "academicLink.group"
                    )}
                  </span>

                  <select
                    value={
                      turmaIdEdicao
                    }
                    onChange={(event) =>
                      setTurmaIdEdicao(
                        event.target.value
                      )
                    }
                    disabled={
                      !disciplinaIdEdicao
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      {t(
                        "academicLink.selectGroup"
                      )}
                    </option>

                    {turmasDisponiveis.map(
                      (turma) => (
                        <option
                          key={
                            turma.id
                          }
                          value={
                            turma.id
                          }
                        >
                          {
                            turma.nome
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={
                    salvarVinculoAcademico
                  }
                  disabled={
                    salvandoVinculo ||
                    !disciplinaIdEdicao ||
                    !turmaIdEdicao
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvandoVinculo
                    ? t(
                        "academicLink.saving"
                      )
                    : t(
                        "academicLink.save"
                      )}
                </button>
              </div>
            </div>
          )}



          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(
                  "summary.maximumGrade"
                )}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {
                  prova.notaMaxima
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(
                  "summary.time"
                )}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {prova.tempoMin
                  ? t(
                      "summary.minutes",
                      {
                        count:
                          prova.tempoMin,
                      }
                    )
                  : t(
                      "summary.free"
                    )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(
                  "summary.questions"
                )}
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {totalQuestoes}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t(
                  "summary.types"
                )}
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {t(
                  "summary.typeCounts",
                  {
                    multiple:
                      totalMultiplaEscolha,
                    discursive:
                      totalDiscursivas,
                  }
                )}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    "questions.title"
                  )}
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {t(
                    "questions.description"
                  )}
                </p>
              </div>

              <a
                href={`/professor/provas/${prova.id}/questoes/nova`}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                {t(
                  "questions.new"
                )}
              </a>
            </div>

            <div className="mt-6 space-y-4">
              {prova.questoes
                .length ===
                0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {t(
                    "questions.empty"
                  )}
                </div>
              )}

              {prova.questoes.map(
                (questao) => (
                  <div
                    key={
                      questao.id
                    }
                    className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {t(
                              "questions.number",
                              {
                                number:
                                  questao.ordem,
                              }
                            )}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              questao.tipo ===
                              "DISCURSIVA"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            }`}
                          >
                            {questao.tipo ===
                            "DISCURSIVA"
                              ? t(
                                  "questionTypes.discursive"
                                )
                              : t(
                                  "questionTypes.multipleChoice"
                                )}
                          </span>

                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                            {t(
                              "questions.value",
                              {
                                value:
                                  questao.valor,
                              }
                            )}
                          </span>
                        </div>

                        <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                          {
                            questao.enunciado
                          }
                        </p>

                        {questao.tipo ===
                          "MULTIPLA_ESCOLHA" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t(
                              "questions.alternatives",
                              {
                                count:
                                  questao
                                    .alternativas
                                    ?.length ||
                                  0,
                              }
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`/professor/provas/${prova.id}/questoes/${questao.id}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t(
                            "actions.edit"
                          )}
                        </a>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {prova.status ===
            "RASCUNHO" &&
            prova.questoes
              .length ===
              0 && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
                {t(
                  "publishWarning"
                )}
              </div>
            )}
        </div>
      </div>

      {modalEncerrarAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-950/50">
                ⚠️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t(
                    "closeModal.title"
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t.rich(
                    "closeModal.message",
                    {
                      title:
                        prova.titulo,

                      strong:
                        (
                          chunks
                        ) => (
                          <strong className="font-semibold text-slate-900 dark:text-white">
                            {
                              chunks
                            }
                          </strong>
                        ),
                    }
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "closeModal.warning"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setModalEncerrarAberto(
                    false
                  )
                }
                disabled={
                  acaoLoading ===
                  "encerrar"
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "closeModal.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={
                  encerrarProva
                }
                disabled={
                  acaoLoading ===
                  "encerrar"
                }
                className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acaoLoading ===
                "encerrar"
                  ? t(
                      "actions.closing"
                    )
                  : t(
                      "closeModal.confirm"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}