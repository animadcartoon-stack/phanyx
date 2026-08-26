"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Disciplina = {
  id: number;
  nome?: string;
  titulo?: string;
};

type Turma = {
  id: number;
  nome?: string;
  disciplinaId?: number;
};

type AlunoTurma = {
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
};

type Curso = {
  id: number;
  nome?: string;
  codigo?: string | null;
};

type TipoPublico =
  | "TURMA"
  | "ALUNOS_SELECIONADOS";

function formatarDataResumo(
  valor: string,
  locale: string
) {
  if (!valor) {
    return "";
  }

  try {
    const data = new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return valor;
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(data);
  } catch {
    return valor;
  }
}

export default function NovaProvaPage() {
  const router = useRouter();

  const t =
    useTranslations(
      "ProfessorNewExam"
    );

  const locale =
    useLocale();

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    notaMaxima,
    setNotaMaxima,
  ] = useState("10");

  const [
    tempoMin,
    setTempoMin,
  ] = useState("");

  const [
    tentativasMax,
    setTentativasMax,
  ] = useState("1");

  const [
    disponivelEm,
    setDisponivelEm,
  ] = useState("");

  const [
    expiraEm,
    setExpiraEm,
  ] = useState("");

  const [
    notaDisponivelEm,
    setNotaDisponivelEm,
  ] = useState("");

  const [
    mostrarNotaAoFinal,
    setMostrarNotaAoFinal,
  ] = useState(false);

  const [
    tipoPublico,
    setTipoPublico,
  ] =
    useState<TipoPublico>(
      "TURMA"
    );

  const [
    exigirAulasConcluidas,
    setExigirAulasConcluidas,
  ] = useState(false);

  const [
    alunosTurma,
    setAlunosTurma,
  ] = useState<
    AlunoTurma[]
  >([]);

  const [
    alunosSelecionadosIds,
    setAlunosSelecionadosIds,
  ] = useState<number[]>(
    []
  );

  const [
    loadingAlunos,
    setLoadingAlunos,
  ] = useState(false);

  const [
    disciplinaId,
    setDisciplinaId,
  ] = useState("");

  const [
    turmaId,
    setTurmaId,
  ] = useState("");

  const [
    disciplinas,
    setDisciplinas,
  ] = useState<
    Disciplina[]
  >([]);

  const [
    turmas,
    setTurmas,
  ] = useState<Turma[]>(
    []
  );

  const [
    cursos,
    setCursos,
  ] = useState<Curso[]>(
    []
  );

  const [
    cursoFiltroId,
    setCursoFiltroId,
  ] = useState("");

  const [
    turmaFiltroId,
    setTurmaFiltroId,
  ] = useState("");

  const [
    disciplinaFiltroId,
    setDisciplinaFiltroId,
  ] = useState("");

  const [
    buscaAluno,
    setBuscaAluno,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingInicial,
    setLoadingInicial,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoadingInicial(
          true
        );

        setErro("");

        const [
          resDisciplinas,
          resTurmas,
          resCursos,
        ] =
          await Promise.all([
            fetch(
              "/api/professor/disciplinas"
            ),
            fetch(
              "/api/professor/turmas"
            ),
            fetch(
              "/api/professor/cursos"
            ),
          ]);

        const disciplinasData =
          resDisciplinas.ok
            ? await resDisciplinas.json()
            : [];

        const turmasData =
          resTurmas.ok
            ? await resTurmas.json()
            : [];

        const cursosData =
          resCursos.ok
            ? await resCursos.json()
            : [];

        setDisciplinas(
          Array.isArray(
            disciplinasData
          )
            ? disciplinasData
            : []
        );

        setTurmas(
          Array.isArray(
            turmasData
          )
            ? turmasData
            : []
        );

        setCursos(
          Array.isArray(
            cursosData
          )
            ? cursosData
            : []
        );
      } catch {
        setErro(
          t(
            "feedback.loadFormError"
          )
        );
      } finally {
        setLoadingInicial(
          false
        );
      }
    }

    carregarDados();
  }, [t]);

  useEffect(() => {
    if (!disciplinaId) {
      setTurmaId("");
      return;
    }

    const turmaSelecionadaAindaExiste =
      turmas.some(
        (turma) =>
          String(
            turma.id
          ) ===
            String(
              turmaId
            ) &&
          String(
            turma.disciplinaId
          ) ===
            String(
              disciplinaId
            )
      );

    if (
      !turmaSelecionadaAindaExiste
    ) {
      setTurmaId("");
    }
  }, [
    disciplinaId,
    turmaId,
    turmas,
  ]);

  useEffect(() => {
    setAlunosSelecionadosIds(
      []
    );
  }, [turmaId]);

  useEffect(() => {
    async function carregarAlunosDaTurma() {
      if (!turmaId) {
        setAlunosTurma([]);
        return;
      }

      try {
        setLoadingAlunos(
          true
        );

        const params =
          new URLSearchParams();

        if (
          cursoFiltroId
        ) {
          params.set(
            "cursoId",
            cursoFiltroId
          );
        }

        if (
          turmaFiltroId ||
          turmaId
        ) {
          params.set(
            "turmaId",
            turmaFiltroId ||
              turmaId
          );
        }

        if (
          disciplinaFiltroId ||
          disciplinaId
        ) {
          params.set(
            "disciplinaId",
            disciplinaFiltroId ||
              disciplinaId
          );
        }

        if (
          buscaAluno.trim()
        ) {
          params.set(
            "busca",
            buscaAluno.trim()
          );
        }

        const res =
          await fetch(
            `/api/professor/alunos?${params.toString()}`,
            {
              cache:
                "no-store",
              credentials:
                "include",
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            t(
              "feedback.loadStudentsError"
            )
          );
        }

        setAlunosTurma(
          Array.isArray(
            data?.alunos
          )
            ? data.alunos
            : []
        );
      } catch {
        setAlunosTurma(
          []
        );
      } finally {
        setLoadingAlunos(
          false
        );
      }
    }

    carregarAlunosDaTurma();
  }, [
    turmaId,
    cursoFiltroId,
    turmaFiltroId,
    disciplinaFiltroId,
    buscaAluno,
    disciplinaId,
    t,
  ]);

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");

    if (!disciplinaId) {
      setErro(
        t(
          "validation.subjectRequired"
        )
      );

      return;
    }

    if (!turmaId) {
      setErro(
        t(
          "validation.classRequired"
        )
      );

      return;
    }

    if (
      tipoPublico ===
        "ALUNOS_SELECIONADOS" &&
      alunosSelecionadosIds.length ===
        0
    ) {
      setErro(
        t(
          "validation.studentRequired"
        )
      );

      return;
    }

    if (
      disponivelEm &&
      expiraEm &&
      new Date(
        expiraEm
      ).getTime() <=
        new Date(
          disponivelEm
        ).getTime()
    ) {
      setErro(
        t(
          "validation.invalidPeriod"
        )
      );

      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res =
        await fetch(
          "/api/professor/provas",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              {
                titulo,
                descricao:
                  descricao ||
                  null,

                notaMaxima:
                  Number(
                    notaMaxima
                  ),

                tempoMin:
                  tempoMin
                    ? Number(
                        tempoMin
                      )
                    : null,

                tentativasMax:
                  tentativasMax
                    ? Number(
                        tentativasMax
                      )
                    : 1,

                disponivelEm:
                  disponivelEm
                    ? new Date(
                        disponivelEm
                      ).toISOString()
                    : null,

                expiraEm:
                  expiraEm
                    ? new Date(
                        expiraEm
                      ).toISOString()
                    : null,

                notaDisponivelEm:
                  notaDisponivelEm
                    ? new Date(
                        notaDisponivelEm
                      ).toISOString()
                    : null,

                mostrarNotaAoFinal,
                tipoPublico,
                exigirAulasConcluidas,

                alunosIds:
                  alunosSelecionadosIds,

                disciplinaId:
                  Number(
                    disciplinaId
                  ),

                turmaId:
                  Number(
                    turmaId
                  ),
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
        `/professor/provas/${data.id}`
      );
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.createError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setLoading(false);
    }
  }

  const disciplinaSelecionada =
    useMemo(() => {
      return disciplinas.find(
        (disciplina) =>
          String(
            disciplina.id
          ) ===
          String(
            disciplinaId
          )
      );
    }, [
      disciplinas,
      disciplinaId,
    ]);

  const turmasFiltradas =
    useMemo(() => {
      if (!disciplinaId) {
        return [];
      }

      return turmas.filter(
        (turma) =>
          String(
            turma.disciplinaId
          ) ===
          String(
            disciplinaId
          )
      );
    }, [
      turmas,
      disciplinaId,
    ]);

  return (
    <div className="phanyx-professor-nova-prova p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <a
              href="/professor/provas"
              className="inline-block text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← {t("back")}
            </a>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t("title")}
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {t(
                  "description"
                )}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            {t(
              "draftNotice"
            )}
          </div>
        </div>

        {loadingInicial ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t(
              "loadingForm"
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-2"
            >
              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                  {erro}
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    "examData.title"
                  )}
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {t(
                    "examData.description"
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(
                    "fields.title"
                  )}
                </label>

                <input
                  type="text"
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "placeholders.title"
                  )}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t(
                    "fields.description"
                  )}
                </label>

                <textarea
                  value={
                    descricao
                  }
                  onChange={(e) =>
                    setDescricao(
                      e.target.value
                    )
                  }
                  placeholder={t(
                    "placeholders.description"
                  )}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.subject"
                    )}
                  </label>

                  <select
                    value={
                      disciplinaId
                    }
                    onChange={(
                      e
                    ) =>
                      setDisciplinaId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  >
                    <option value="">
                      {t(
                        "options.selectSubject"
                      )}
                    </option>

                    {disciplinas.map(
                      (
                        disciplina
                      ) => (
                        <option
                          key={
                            disciplina.id
                          }
                          value={
                            disciplina.id
                          }
                        >
                          {disciplina.nome ||
                            disciplina.titulo ||
                            t(
                              "fallbacks.subject",
                              {
                                id: disciplina.id,
                              }
                            )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.class"
                    )}
                  </label>

                  <select
                    value={
                      turmaId
                    }
                    onChange={(
                      e
                    ) =>
                      setTurmaId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800"
                    disabled={
                      !disciplinaId
                    }
                    required
                  >
                    <option value="">
                      {t(
                        "options.selectClass"
                      )}
                    </option>

                    {turmasFiltradas.map(
                      (turma) => (
                        <option
                          key={
                            turma.id
                          }
                          value={
                            turma.id
                          }
                        >
                          {turma.nome ||
                            t(
                              "fallbacks.class",
                              {
                                id: turma.id,
                              }
                            )}
                        </option>
                      )
                    )}
                  </select>

                  {!disciplinaId && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(
                        "hints.selectSubjectFirst"
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.maximumGrade"
                    )}
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={
                      notaMaxima
                    }
                    onChange={(
                      e
                    ) =>
                      setNotaMaxima(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.timeMinutes"
                    )}
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      tempoMin
                    }
                    onChange={(
                      e
                    ) =>
                      setTempoMin(
                        e.target.value
                      )
                    }
                    placeholder={t(
                      "placeholders.time"
                    )}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.maxAttempts"
                    )}
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      tentativasMax
                    }
                    onChange={(
                      e
                    ) =>
                      setTentativasMax(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.availableAt"
                    )}
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      disponivelEm
                    }
                    aria-label={t(
                      "fields.availableAt"
                    )}
                    onChange={(
                      e
                    ) =>
                      setDisponivelEm(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t(
                      "fields.closesAt"
                    )}
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      expiraEm
                    }
                    aria-label={t(
                      "fields.closesAt"
                    )}
                    onChange={(
                      e
                    ) =>
                      setExpiraEm(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="nova-prova-publico-card rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(
                    "audience.title"
                  )}
                </h3>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {t(
                    "audience.description"
                  )}
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <input
                      type="radio"
                      name="tipoPublico"
                      checked={
                        tipoPublico ===
                        "TURMA"
                      }
                      onChange={() => {
                        setTipoPublico(
                          "TURMA"
                        );

                        setAlunosSelecionadosIds(
                          []
                        );
                      }}
                    />

                    {t(
                      "audience.wholeClass"
                    )}
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <input
                      type="radio"
                      name="tipoPublico"
                      checked={
                        tipoPublico ===
                        "ALUNOS_SELECIONADOS"
                      }
                      onChange={() =>
                        setTipoPublico(
                          "ALUNOS_SELECIONADOS"
                        )
                      }
                    />

                    {t(
                      "audience.selectedStudents"
                    )}
                  </label>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={
                      exigirAulasConcluidas
                    }
                    onChange={(
                      e
                    ) =>
                      setExigirAulasConcluidas(
                        e.target
                          .checked
                      )
                    }
                  />

                  {t(
                    "audience.requireLessons"
                  )}
                </label>

                {tipoPublico ===
                  "ALUNOS_SELECIONADOS" && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {t(
                            "students.title"
                          )}
                        </h4>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "students.description"
                          )}
                        </p>
                      </div>

                      {loadingAlunos && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-sky-300">
                          {t(
                            "students.loading"
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <select
                        value={
                          cursoFiltroId
                        }
                        onChange={(
                          e
                        ) =>
                          setCursoFiltroId(
                            e.target
                              .value
                          )
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">
                          {t(
                            "students.allCourses"
                          )}
                        </option>

                        {cursos.map(
                          (
                            curso
                          ) => (
                            <option
                              key={
                                curso.id
                              }
                              value={
                                curso.id
                              }
                            >
                              {curso.nome ||
                                t(
                                  "fallbacks.course",
                                  {
                                    id: curso.id,
                                  }
                                )}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={
                          turmaFiltroId
                        }
                        onChange={(
                          e
                        ) =>
                          setTurmaFiltroId(
                            e.target
                              .value
                          )
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">
                          {t(
                            "students.allClasses"
                          )}
                        </option>

                        {turmas.map(
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
                              {turma.nome ||
                                t(
                                  "fallbacks.class",
                                  {
                                    id: turma.id,
                                  }
                                )}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={
                          disciplinaFiltroId
                        }
                        onChange={(
                          e
                        ) =>
                          setDisciplinaFiltroId(
                            e.target
                              .value
                          )
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">
                          {t(
                            "students.allSubjects"
                          )}
                        </option>

                        {disciplinas.map(
                          (
                            disciplina
                          ) => (
                            <option
                              key={
                                disciplina.id
                              }
                              value={
                                disciplina.id
                              }
                            >
                              {disciplina.nome ||
                                disciplina.titulo ||
                                t(
                                  "fallbacks.subject",
                                  {
                                    id: disciplina.id,
                                  }
                                )}
                            </option>
                          )
                        )}
                      </select>

                      <input
                        value={
                          buscaAluno
                        }
                        onChange={(
                          e
                        ) =>
                          setBuscaAluno(
                            e.target
                              .value
                          )
                        }
                        placeholder={t(
                          "students.search"
                        )}
                        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {!loadingAlunos &&
                      alunosTurma.length ===
                        0 && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          {t(
                            "students.noneFound"
                          )}
                        </p>
                      )}

                    {alunosTurma.length >
                      0 && (
                      <div className="mt-4 grid max-h-72 gap-2 overflow-auto pr-1">
                        {alunosTurma.map(
                          (
                            aluno
                          ) => {
                            const marcado =
                              alunosSelecionadosIds.includes(
                                aluno.alunoId
                              );

                            return (
                              <label
                                key={
                                  aluno.alunoId
                                }
                                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 transition hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    marcado
                                  }
                                  onChange={(
                                    e
                                  ) => {
                                    if (
                                      e
                                        .target
                                        .checked
                                    ) {
                                      setAlunosSelecionadosIds(
                                        (
                                          prev
                                        ) =>
                                          prev.includes(
                                            aluno.alunoId
                                          )
                                            ? prev
                                            : [
                                                ...prev,
                                                aluno.alunoId,
                                              ]
                                      );
                                    } else {
                                      setAlunosSelecionadosIds(
                                        (
                                          prev
                                        ) =>
                                          prev.filter(
                                            (
                                              id
                                            ) =>
                                              id !==
                                              aluno.alunoId
                                          )
                                      );
                                    }
                                  }}
                                />

                                <span>
                                  <span className="block font-semibold">
                                    {
                                      aluno.nome
                                    }
                                  </span>

                                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                                    {aluno.matricula ||
                                      t(
                                        "students.noRegistration"
                                      )}

                                    {aluno.email
                                      ? ` • ${aluno.email}`
                                      : ""}
                                  </span>
                                </span>
                              </label>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="nova-prova-nota-card rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t(
                    "gradeRelease.title"
                  )}
                </h3>

                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {t(
                    "gradeRelease.description"
                  )}
                </p>

                <label className="nova-prova-nota-opcao mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={
                      mostrarNotaAoFinal
                    }
                    onChange={(
                      e
                    ) =>
                      setMostrarNotaAoFinal(
                        e.target
                          .checked
                      )
                    }
                  />

                  {t(
                    "gradeRelease.showImmediately"
                  )}
                </label>

                {!mostrarNotaAoFinal && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-slate-800 dark:text-slate-100">
                      {t(
                        "gradeRelease.dateLabel"
                      )}
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        notaDisponivelEm
                      }
                      aria-label={t(
                        "gradeRelease.dateLabel"
                      )}
                      onChange={(
                        e
                      ) =>
                        setNotaDisponivelEm(
                          e.target
                            .value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {t(
                        "gradeRelease.pendingHint"
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <a
                  href="/professor/provas"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(
                    "actions.cancel"
                  )}
                </a>

                <button
                  type="submit"
                  disabled={
                    loading
                  }
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

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    "summary.title"
                  )}
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "fields.title"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {titulo ||
                        t(
                          "summary.notDefined"
                        )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "fields.description"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {descricao ||
                        t(
                          "summary.noDescription"
                        )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "fields.subject"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {disciplinaSelecionada?.nome ||
                        disciplinaSelecionada?.titulo ||
                        t(
                          "summary.notSelected"
                        )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "fields.maximumGrade"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {notaMaxima ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "summary.time"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {tempoMin
                        ? t(
                            "summary.minutes",
                            {
                              value:
                                tempoMin,
                            }
                          )
                        : t(
                            "summary.noTimeLimit"
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "summary.attempts"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {tentativasMax ||
                        "1"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "summary.opening"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {disponivelEm
                        ? formatarDataResumo(
                            disponivelEm,
                            locale
                          )
                        : t(
                            "summary.immediate"
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "summary.closing"
                      )}
                    </p>

                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {expiraEm
                        ? formatarDataResumo(
                            expiraEm,
                            locale
                          )
                        : t(
                            "summary.noDeadline"
                          )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {t(
                        "summary.initialStatus"
                      )}
                    </p>

                    <p className="font-medium text-yellow-700 dark:text-yellow-300">
                      {t(
                        "statuses.draft"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t(
                    "nextStep.title"
                  )}
                </h2>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {t(
                    "nextStep.description"
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}