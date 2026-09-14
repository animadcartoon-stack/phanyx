"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useTranslations,
} from "next-intl";

type TurmaOpcao = {
  id: number;
  nome: string;
  periodoLetivo?: string | null;
  semestre?: string | null;
  modalidade?: string | null;
  statusTurma?: string | null;

  polo?: {
    id: number;
    nome: string;
  } | null;

  curso?: {
    id: number;
    nome: string;
  } | null;

  _count?: {
    disciplinas: number;
  };
};

type CursoSemestreOpcao = {
  id: number;
  numero: number;
  titulo?: string | null;
  descricao?: string | null;

  _count?: {
    disciplinas: number;
  };
};

type CursoOpcao = {
  id: number;
  nome: string;
  codigo?: string | null;
  semestres: CursoSemestreOpcao[];
};

type DadosPagina = {
  success: boolean;

  matricula: {
    id: number;
    status: string;

    aluno?: {
      id: number;
      nome: string;
      nomeSocial?: string | null;
    } | null;

    polo?: {
      id: number;
      nome: string;
    } | null;

    curso?: {
      id: number;
      nome: string;
    } | null;

    cursoSemestre?: {
      id: number;
      numero: number;
      titulo?: string | null;
    } | null;

    turmaPrincipal?: {
      id: number;
      nome: string;
    } | null;
  };

  opcoes: {
    outrasTurmas: TurmaOpcao[];
    outrosCursos: CursoOpcao[];
  };

  disponibilidade: {
    possuiOutraTurma: boolean;
    possuiOutroCurso: boolean;
  };
};

export default function CursoTurmaTransferencia({
  matriculaId,
}: {
  matriculaId: number;
}) {
  const t =
    useTranslations(
      "AdminTransferenciaMatricula"
    );

  const router =
    useRouter();

  const [
    dados,
    setDados,
  ] =
    useState<DadosPagina | null>(
      null
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
    useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const resposta =
          await fetch(
            `/api/admin/matriculas/${matriculaId}/transferencias/analisar-curso-turma`,
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const json =
          await resposta
            .json()
            .catch(
              () => null
            );

        if (
          !resposta.ok ||
          !json?.success
        ) {
          throw new Error(
            json?.error ||
            "LOAD_ERROR"
          );
        }

        if (ativo) {
          setDados(json);
        }
      } catch (error) {
        console.error(
          "Course/class transfer load error:",
          error
        );

        if (ativo) {
          setErro(
            t(
              "courseClassTransfer.errors.load"
            )
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [
    matriculaId,
    t,
  ]);

  if (carregando) {
    return (
      <div className="mx-auto max-w-6xl p-6 text-slate-600 dark:text-neutral-300">
        {t(
          "courseClassTransfer.loading"
        )}
      </div>
    );
  }

  if (
    erro ||
    !dados
  ) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/matriculas/${matriculaId}/transferir`
            )
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {"<- "}
          {t(
            "courseClassTransfer.back"
          )}
        </button>

        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {erro ||
            t(
              "courseClassTransfer.errors.load"
            )}
        </div>
      </div>
    );
  }

  const matricula =
    dados.matricula;

  const outrasTurmas =
    dados.opcoes
      .outrasTurmas;

  const outrosCursos =
    dados.opcoes
      .outrosCursos;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/matriculas/${matriculaId}/transferir`
            )
          }
          className="mb-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          {"<- "}
          {t(
            "courseClassTransfer.back"
          )}
        </button>

        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          {t(
            "courseClassTransfer.title"
          )}
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
          {t(
            "courseClassTransfer.description"
          )}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          {t(
            "courseClassTransfer.currentEnrollment"
          )}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info
            label={t(
              "courseClassTransfer.student"
            )}
            value={
              matricula.aluno
                ?.nomeSocial ||
              matricula.aluno
                ?.nome ||
              "-"
            }
          />

          <Info
            label={t(
              "courseClassTransfer.currentCampus"
            )}
            value={
              matricula.polo
                ?.nome ||
              "-"
            }
          />

          <Info
            label={t(
              "courseClassTransfer.currentCourse"
            )}
            value={
              matricula.curso
                ?.nome ||
              "-"
            }
          />

          <Info
            label={t(
              "courseClassTransfer.currentClass"
            )}
            value={
              matricula
                .turmaPrincipal
                ?.nome ||
              "-"
            }
          />
        </div>
      </section>

      <div>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {t(
            "courseClassTransfer.whatChange"
          )}
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">
          {t(
            "courseClassTransfer.whatChangeHelp"
          )}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {t(
                  "courseClassTransfer.classOnly.title"
                )}
              </h3>

              <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                {t(
                  "courseClassTransfer.classOnly.description"
                )}
              </p>
            </div>

            <span
              className={[
                "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",

                outrasTurmas.length >
                0
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-slate-300 bg-slate-100 text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
              ].join(" ")}
            >
              {outrasTurmas.length >
              0
                ? t(
                    "courseClassTransfer.available"
                  )
                : t(
                    "courseClassTransfer.unavailable"
                  )}
            </span>
          </div>

          {outrasTurmas.length ===
          0 ? (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="font-semibold">
                {t(
                  "courseClassTransfer.classOnly.emptyTitle"
                )}
              </div>

              <p className="mt-1">
                {t(
                  "courseClassTransfer.classOnly.emptyDescription"
                )}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {outrasTurmas.map(
                (turma) => (
                  <div
                    key={
                      turma.id
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="font-semibold text-slate-950 dark:text-white">
                      {
                        turma.nome
                      }
                    </div>

                    <div className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                      {
                        turma.periodoLetivo ||
                        "-"
                      }
                      {" · "}
                      {
                        turma.modalidade ||
                        "-"
                      }
                    </div>

                    <div className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                      {t(
                        "courseClassTransfer.subjectCount",
                        {
                          count:
                            turma
                              ._count
                              ?.disciplinas ??
                            0,
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {t(
                  "courseClassTransfer.courseAndClass.title"
                )}
              </h3>

              <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
                {t(
                  "courseClassTransfer.courseAndClass.description"
                )}
              </p>
            </div>

            <span
              className={[
                "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",

                outrosCursos.length >
                0
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-slate-300 bg-slate-100 text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
              ].join(" ")}
            >
              {outrosCursos.length >
              0
                ? t(
                    "courseClassTransfer.available"
                  )
                : t(
                    "courseClassTransfer.unavailable"
                  )}
            </span>
          </div>

          {outrosCursos.length ===
          0 ? (
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="font-semibold">
                {t(
                  "courseClassTransfer.courseAndClass.emptyTitle"
                )}
              </div>

              <p className="mt-1">
                {t(
                  "courseClassTransfer.courseAndClass.emptyDescription"
                )}
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {outrosCursos.map(
                (curso) => (
                  <div
                    key={
                      curso.id
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="font-semibold text-slate-950 dark:text-white">
                      {
                        curso.nome
                      }
                    </div>

                    <div className="mt-2 space-y-1">
                      {curso.semestres.map(
                        (
                          semestre
                        ) => (
                          <div
                            key={
                              semestre.id
                            }
                            className="text-sm text-slate-600 dark:text-neutral-300"
                          >
                            {semestre.numero}
                            {" · "}
                            {semestre.titulo ||
                              t(
                                "courseClassTransfer.unnamedTerm"
                              )}
                            {" · "}
                            {t(
                              "courseClassTransfer.subjectCount",
                              {
                                count:
                                  semestre
                                    ._count
                                    ?.disciplinas ??
                                  0,
                              }
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        {t(
          "courseClassTransfer.otherCampusNotice"
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
        {t(
          "courseClassTransfer.eligibilityNotice"
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
        {label}
      </div>

      <div className="mt-1 font-medium text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}
