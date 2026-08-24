"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAluno } from "@/app/context/AlunoContext";

type AulaItem = {
  id: number;
  titulo: string;
  videoUrl?: string | null;
};

type DisciplinaComAulas = {
  id: number;
  aulas: AulaItem[];
};

type StatusMatricula =
  | "ATIVA"
  | "TRANCADA"
  | "CANCELADA"
  | "CONCLUIDA"
  | "A_INICIAR"
  | "SUSPENSA";

type StatusMatriculaResponse = {
  status: StatusMatricula | string | null;
  acessoAulasLiberado: boolean;
};

export default function AulaPage() {
  const params = useParams();
  const t = useTranslations("StudentLesson");

  const disciplinaId = Number(params.disciplinaId);
  const aulaId = Number(params.aulaId);

  const {
    disciplinasMatriculadas,
    marcarAulaComoConcluida,
    aulaConcluida,
  } = useAluno();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [acessoAulasLiberado, setAcessoAulasLiberado] = useState(false);
  const [statusMatricula, setStatusMatricula] = useState<string | null>(null);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);
  const [erroProgresso, setErroProgresso] = useState("");

  useEffect(() => {
    async function carregarStatusMatricula() {
      try {
        const res = await fetch("/api/aluno/status-matricula", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setAcessoAulasLiberado(false);
          setStatusMatricula(null);
          return;
        }

        const data: StatusMatriculaResponse = await res.json();
        setAcessoAulasLiberado(Boolean(data.acessoAulasLiberado));
        setStatusMatricula(data.status);
      } catch (error) {
        console.error("Failed to load enrollment status:", error);
        setAcessoAulasLiberado(false);
        setStatusMatricula(null);
      } finally {
        setLoadingStatus(false);
      }
    }

    carregarStatusMatricula();
  }, []);

  function traduzirStatusMatricula(status: string | null) {
    switch (status?.toUpperCase()) {
      case "ATIVA":
        return t("status.active");
      case "TRANCADA":
        return t("status.locked");
      case "CANCELADA":
        return t("status.cancelled");
      case "CONCLUIDA":
        return t("status.completed");
      case "A_INICIAR":
        return t("status.notStarted");
      case "SUSPENSA":
        return t("status.suspended");
      default:
        return t("status.unavailable");
    }
  }

  const disciplina = disciplinasMatriculadas.find(
    (item) => Number(item.id) === disciplinaId
  ) as unknown as DisciplinaComAulas | undefined;

  if (!disciplina) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        {t("subjectNotFound")}
      </div>
    );
  }

  const aula = disciplina.aulas.find((item) => Number(item.id) === aulaId);

  if (!aula) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
        {t("lessonNotFound")}
      </div>
    );
  }

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        {t("loadingEnrollmentStatus")}
      </div>
    );
  }

  if (!acessoAulasLiberado) {
    return (
      <div className="max-w-3xl rounded-2xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950/40">
        <h1 className="text-2xl font-bold text-orange-950 dark:text-orange-100">
          {t("accessUnavailableTitle")}
        </h1>

        <p className="mt-3 text-orange-900 dark:text-orange-200">
          {t("accessUnavailableStatus", {
            status: traduzirStatusMatricula(statusMatricula),
          })}
        </p>

        <p className="mt-2 text-orange-900 dark:text-orange-200">
          {t("accessUnavailableDescription")}
        </p>

        <p className="mt-2 text-orange-900 dark:text-orange-200">
          {t("contactOffice")}
        </p>
      </div>
    );
  }

  const concluida = aulaConcluida(disciplinaId, aulaId);

  async function concluirAula() {
    if (salvandoProgresso || concluida) {
      return;
    }

    try {
      setSalvandoProgresso(true);
      setErroProgresso("");

      await marcarAulaComoConcluida({
        disciplinaId,
        aulaId,
      });
    } catch (error) {
      console.error("Failed to save lesson progress:", error);
      setErroProgresso(t("saveProgressError"));
    } finally {
      setSalvandoProgresso(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        🎥 {aula.titulo}
      </h1>

      {aula.videoUrl ? (
        <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-sm">
          <iframe
            src={aula.videoUrl}
            title={aula.titulo}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {t("videoUnavailable")}
        </div>
      )}

      {!concluida && (
        <button
          type="button"
          onClick={concluirAula}
          disabled={salvandoProgresso}
          className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-70"
        >
          {salvandoProgresso ? t("savingProgress") : t("markCompleted")}
        </button>
      )}

      {erroProgresso && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {erroProgresso}
        </div>
      )}

      {concluida && (
        <div
          role="status"
          className="font-semibold text-green-700 dark:text-green-300"
        >
          ✅ {t("lessonCompleted")}
        </div>
      )}
    </div>
  );
}