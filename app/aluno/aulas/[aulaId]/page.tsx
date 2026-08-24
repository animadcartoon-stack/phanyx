import MaterialViewer from "@/components/material/MaterialViewer";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { getLocale, getTranslations } from "next-intl/server";

type Material = {
  id: number;
  titulo: string;
  tipo: string;
  url: string;
  arquivoNome?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
};

async function getMateriais(aulaId: string): Promise<Material[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/aluno/materiais?aulaId=${aulaId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

async function getStatusMatriculaAluno() {
  const user = await getUserFromToken();

  if (!user || user.role !== "ALUNO") {
    return {
      status: null,
      acessoAulasLiberado: false,
    };
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: user.id,
      instituicaoId: user.instituicaoId,
    },
  });

  if (!aluno) {
    return {
      status: null,
      acessoAulasLiberado: false,
    };
  }

  const matricula = await prisma.matricula.findFirst({
    where: {
      alunoId: aluno.id,
      instituicaoId: user.instituicaoId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    status: matricula?.status ?? null,
    acessoAulasLiberado: matricula?.status === "ATIVA",
  };
}

export default async function AulaPage({
  params,
}: {
  params: { aulaId: string };
}) {
  const t = await getTranslations("StudentLessonPage");
  const locale = await getLocale();
  const statusMatricula = await getStatusMatriculaAluno();

  const nomesStatus: Record<string, string> = {
    ATIVA: t("enrollmentStatus.active"),
    PENDENTE: t("enrollmentStatus.pending"),
    INADIMPLENTE: t("enrollmentStatus.overdue"),
    TRANCADA: t("enrollmentStatus.suspended"),
    CANCELADA: t("enrollmentStatus.cancelled"),
    CONCLUIDA: t("enrollmentStatus.completed"),
  };

  const statusOriginal = String(statusMatricula.status || "").toUpperCase();
  const statusExibido = statusOriginal
    ? nomesStatus[statusOriginal] || statusMatricula.status
    : t("common.unavailable");

  if (!statusMatricula.acessoAulasLiberado) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm dark:border-orange-800 dark:bg-orange-950/40">
          <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {t("blocked.title")}
          </h1>

          <p className="mt-3 text-orange-800 dark:text-orange-200">
            {t("blocked.statusPrefix")}{" "}
            <strong>{statusExibido}</strong>.
          </p>

          <p className="mt-2 text-orange-800 dark:text-orange-200">
            {t("blocked.reason")}
          </p>

          <p className="mt-2 text-orange-800 dark:text-orange-200">
            {t("blocked.availableResources")}
          </p>
        </div>
      </div>
    );
  }

  const materiais = await getMateriais(params.aulaId);
  const materialPrincipal = materiais[0] || null;

  function formatarTipoMaterial(tipo: string) {
    const tipos: Record<string, string> = {
      VIDEO: t("materialTypes.video"),
      AUDIO: t("materialTypes.audio"),
      DOCUMENTO: t("materialTypes.document"),
      IMAGEM: t("materialTypes.image"),
      LINK: t("materialTypes.link"),
      ARQUIVO: t("materialTypes.file"),
      PDF: "PDF",
    };

    return tipos[String(tipo || "").toUpperCase()] || tipo;
  }

  return (
    <div
      lang={locale}
      className="min-h-screen bg-slate-100 p-6 dark:bg-slate-950"
    >
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("lessonTitle", { id: params.aulaId })}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              {t("description")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {materialPrincipal ? (
              <>
                <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
                  {materialPrincipal.titulo}
                </h2>
                <MaterialViewer material={materialPrincipal} />
              </>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-300">
                {t("noMainMaterial")}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              {t("materialsTitle")}
            </h2>

            {materiais.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {t("noMaterials")}
              </p>
            ) : (
              <div className="space-y-3">
                {materiais.map((material) => (
                  <div
                    key={material.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {material.titulo}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          {t("typeLabel")}: {formatarTipoMaterial(material.tipo)}
                        </p>
                      </div>

                      {material.url && (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          {t("open")}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("progress.title")}
            </h2>
            <div className="mt-4 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-3 w-1/3 rounded-full bg-blue-600" />
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              {t("progress.completed", { percent: 33 })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("nextSteps.title")}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• {t("nextSteps.watchMain")}</li>
              <li>• {t("nextSteps.openSupplementary")}</li>
              <li>• {t("nextSteps.markCompleted")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}