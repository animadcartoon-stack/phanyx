import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { consultarMetricasPlataforma } from "@/lib/master/metricas-plataforma";

export const dynamic = "force-dynamic";

export default async function EscalabilidadePhanyxPage() {
  const sessao = await getUserFromToken();
  if (!sessao) redirect("/login?portal=admin");
  const usuario = await prisma.user.findUnique({ where: { id: sessao.id }, select: { isMasterAdmin: true } });
  if (!usuario?.isMasterAdmin) redirect("/admin");
  const t = await getTranslations("PlatformMetrics");
  const locale = await getLocale();
  let dados: Awaited<ReturnType<typeof consultarMetricasPlataforma>> | null = null;
  try { dados = await consultarMetricasPlataforma(prisma); }
  catch (error) { console.error("Erro ao consultar métricas da plataforma:", error); }
  const metricas = ["instituicoes", "instituicoesAtivas", "alunos", "alunosAtivos", "professores", "professoresAtivos", "cursosAtivos", "matriculasAtivas", "turmasAtivas", "usuariosAtivos", "provas", "documentos"] as const;

  return <div className="min-h-screen space-y-6 bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <Link href="/master" className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">← {t("back")}</Link>
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h1 className="text-2xl font-black">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("description")}</p>
      {dados && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t("queriedAt", { date: new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(dados.geradoEm)) })} · America/Sao_Paulo</p>}
    </header>
    <p role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{t("scope")}</p>
    {dados ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("title")}>
      {metricas.map(chave => <div key={chave} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm text-slate-600 dark:text-slate-300">{t(`metrics.${chave}`)}</h2>
        <p className="mt-2 text-3xl font-bold">{new Intl.NumberFormat(locale).format(dados[chave])}</p>
      </div>)}
    </section> : <p role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{t("unavailable")}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-bold">{t("capacityTitle")}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("capacityDescription")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[100, 500, 1000, 3000].map(quantidade => <div key={quantidade} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold">{t("loadTest", { count: quantidade })}</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{t("notMeasured")}</p>
        </div>)}
      </div>
    </section>
  </div>;
}
