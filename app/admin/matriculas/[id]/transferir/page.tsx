"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import withAuth from "@/lib/withAuth";

type TipoTransferencia =
  | "POLO"
  | "CURSO_TURMA"
  | "INSTITUICAO_PHANYX"
  | "INSTITUICAO_EXTERNA"
  | "REATRIBUICAO_ALUNO";

type MatriculaTransferencia = {
  id: number;
  numeroMatricula?: string | null;
  status?: string | null;
  periodoLetivo?: string | null;
  modalidade?: string | null;
  semestre?: number | null;

  cursoSemestre?: {
    id: number;
    numero: number;
    titulo?: string | null;
  } | null;

  aluno?: {
    id: number;
    nome: string;
    nomeSocial?: string | null;
  } | null;

  curso?: {
    id: number;
    nome: string;
  } | null;

  polo?: {
    id: number;
    nome: string;
  } | null;

  instituicao?: {
    id: number;
    nome: string;
  } | null;

  turmaPrincipal?: {
    id: number;
    nome: string;
  } | null;
};

function normalizarMatricula(
  payload: unknown,
  matriculaId: number
): MatriculaTransferencia | null {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return (
      (payload.find(
        (item: any) =>
          Number(item?.id) === matriculaId
      ) as MatriculaTransferencia | undefined) ??
      null
    );
  }

  if (typeof payload === "object") {
    const objeto = payload as any;

    if (Number(objeto?.id) === matriculaId) {
      return objeto as MatriculaTransferencia;
    }

    const colecoes = [
      objeto?.matriculas,
      objeto?.items,
      objeto?.data,
      objeto?.registros,
    ];

    for (const colecao of colecoes) {
      if (Array.isArray(colecao)) {
        const encontrada = colecao.find(
          (item: any) =>
            Number(item?.id) === matriculaId
        );

        if (encontrada) {
          return encontrada as MatriculaTransferencia;
        }
      }
    }
  }

  return null;
}

function TransferenciaMatriculaPage() {
  const t = useTranslations(
    "AdminTransferenciaMatricula"
  );

  const router = useRouter();
  const params = useParams();

  const matriculaId = Number(params?.id);

  const [matricula, setMatricula] =
    useState<MatriculaTransferencia | null>(null);

  const [tipo, setTipo] =
    useState<TipoTransferencia | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [avancou, setAvancou] =
    useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarMatricula() {
      if (
        !Number.isInteger(matriculaId) ||
        matriculaId <= 0
      ) {
        setErro(t("errors.invalidEnrollment"));
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro("");

      try {
        /*
         * Primeiro tenta a rota individual.
         * Caso o GET ainda não exista nela,
         * tenta a coleção administrativa.
         */
        const endpoints = [
          `/api/admin/matriculas/${matriculaId}`,
          `/api/matricula?id=${matriculaId}`,
          "/api/matricula",
          "/api/admin/matriculas",
        ];

        for (const endpoint of endpoints) {
          try {
            const resposta = await fetch(endpoint, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            });

            if (!resposta.ok) {
              continue;
            }

            const payload =
              await resposta.json();

            const encontrada =
              normalizarMatricula(
                payload,
                matriculaId
              );

            if (encontrada) {
              if (ativo) {
                setMatricula(encontrada);
                setCarregando(false);
              }

              return;
            }
          } catch {
            // tenta o próximo endpoint
          }
        }

        if (ativo) {
          setErro(t("errors.notFound"));
        }
      } catch (error) {
        console.error(
          "Erro ao carregar matrícula para transferência:",
          error
        );

        if (ativo) {
          setErro(t("errors.load"));
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarMatricula();

    return () => {
      ativo = false;
    };
  }, [matriculaId, t]);

  const tipos: Array<{
    id: TipoTransferencia;
    titulo: string;
    descricao: string;
    simbolo: string;
  }> = [
    {
      id: "POLO",
      titulo: t("types.campus.title"),
      descricao: t("types.campus.description"),
      simbolo: "P",
    },
    {
      id: "CURSO_TURMA",
      titulo: t("types.courseClass.title"),
      descricao: t(
        "types.courseClass.description"
      ),
      simbolo: "C",
    },
    {
      id: "INSTITUICAO_PHANYX",
      titulo: t(
        "types.phanyxInstitution.title"
      ),
      descricao: t(
        "types.phanyxInstitution.description"
      ),
      simbolo: "PH",
    },
    {
      id: "INSTITUICAO_EXTERNA",
      titulo: t(
        "types.externalInstitution.title"
      ),
      descricao: t(
        "types.externalInstitution.description"
      ),
      simbolo: "EX",
    },
    {
      id: "REATRIBUICAO_ALUNO",
      titulo: t(
        "types.studentReassignment.title"
      ),
      descricao: t(
        "types.studentReassignment.description"
      ),
      simbolo: "A",
    },
  ];

  function continuar() {
    if (!tipo) {
      setErro(t("errors.selectType"));
      return;
    }

    setErro("");

    router.push(
      `/admin/matriculas/${matriculaId}/transferir/destino?tipo=${encodeURIComponent(tipo)}`
    );
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          {t("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push("/admin/matriculas")
            }
            className="mb-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            ← {t("back")}
          </button>

          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200">
          {t("enrollmentId", {
            id: matriculaId,
          })}
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {erro}
        </div>
      )}

      {matricula && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("origin.title")}
            </h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {matricula.status || "—"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info
              label={t("origin.student")}
              value={
                matricula.aluno?.nomeSocial ||
                matricula.aluno?.nome ||
                "—"
              }
            />

            <Info
              label={t("origin.enrollment")}
              value={
                matricula.numeroMatricula ||
                `#${matricula.id}`
              }
            />

            <Info
              label={t("origin.institution")}
              value={
                matricula.instituicao?.nome ||
                "—"
              }
            />

            <Info
              label={t("origin.campus")}
              value={
                matricula.polo?.nome || "—"
              }
            />

            <Info
              label={t("origin.course")}
              value={
                matricula.curso?.nome || "—"
              }
            />

            <Info
              label={t("origin.class")}
              value={
                matricula.turmaPrincipal?.nome ||
                "—"
              }
            />


            <Info
              label={t("origin.modality")}
              value={
                matricula.modalidade ||
                "—"
              }
            />

            <Info
              label={t("origin.courseSemester")}
              value={
                matricula.semestre
                  ? `${matricula.semestre}º semestre`
                  : "—"
              }
            />

            <Info
              label={t("origin.module")}
              value={
                matricula.cursoSemestre?.titulo ||
                "—"
              }
            />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {t("chooseType.title")}
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("chooseType.description")}
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {tipos.map((opcao) => {
            const selecionado =
              tipo === opcao.id;

            return (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  setTipo(opcao.id);
                  setAvancou(false);
                  setErro("");
                }}
                className={[
                  "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition",
                  selecionado
                    ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-100 dark:border-cyan-500 dark:bg-cyan-950/30 dark:ring-cyan-950"
                    : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-800 dark:hover:bg-slate-900",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 min-w-10 items-center justify-center rounded-xl text-xs font-bold",
                    selecionado
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  ].join(" ")}
                >
                  {opcao.simbolo}
                </span>

                <span>
                  <span className="block font-semibold text-slate-950 dark:text-white">
                    {opcao.titulo}
                  </span>

                  <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {opcao.descricao}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/admin/matriculas")
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={continuar}
            disabled={!tipo}
            className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("continue")} →
          </button>
        </div>
      </section>

      {avancou && tipo && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <h2 className="font-semibold text-blue-950 dark:text-blue-100">
            {t("next.title")}
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-200">
            {t(`next.${tipo}`)}
          </p>
        </section>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>

      <div className="mt-1 font-medium text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default withAuth(
  TransferenciaMatriculaPage,
  ["admin"]
);
