import MaterialViewer from "@/components/material/MaterialViewer";
import { getTranslations } from "next-intl/server";

type Material = {
  id: number;
  titulo: string;
  tipo: string;
  url: string;
};

async function getMateriais(aulaId: string): Promise<Material[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/aluno/materiais?aulaId=${aulaId}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export default async function AulaMaterialPage({
  params,
}: {
  params: { aulaId: string };
}) {
  const t = await getTranslations("StudentLessonPage");
  const materiais = await getMateriais(params.aulaId);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-white md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("materialsTitle")}
          </h1>
        </div>

        {materiais.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {t("noMainMaterial")}
          </div>
        ) : (
          <div className="space-y-6">
            {materiais.map((material) => (
              <section
                key={material.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  {material.titulo}
                </h2>

                <MaterialViewer material={material} />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}