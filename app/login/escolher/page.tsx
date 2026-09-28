import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";

export async function generateMetadata() {
  const t = await getTranslations("PublicLogin.choosePage");
  return { title: { absolute: t("metadataTitle") } };
}

export default async function EscolherPortalPage() {
  const t = await getTranslations("PublicLogin.choosePage");
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-8 text-white">
      <div className="mx-auto flex max-w-5xl justify-end">
        <SeletorIdioma className="w-56" />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur md:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/10 shadow-xl">
              <Image
                src="/icon.png"
                alt="PHANYX"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-blue-200">
              {t("welcome")}
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              {t("title")}
            </h1>

            <p className="mt-4 text-sm leading-7 text-blue-100 md:text-base">
              {t("description")}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link
              href="/login?portal=aluno"
              className="group rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                👨‍🎓
              </div>

              <h2 className="mt-5 text-xl font-black">{t("studentTitle")}</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("studentDescription")}
              </p>

              <span className="mt-5 inline-flex text-sm font-bold text-blue-700">
                {t("studentAction")} →
              </span>
            </Link>

            <Link
              href="/login?portal=professor"
              className="group rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                👨‍🏫
              </div>

              <h2 className="mt-5 text-xl font-black">{t("teacherTitle")}</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("teacherDescription")}
              </p>

              <span className="mt-5 inline-flex text-sm font-bold text-blue-700">
                {t("teacherAction")} →
              </span>
            </Link>

            <Link
              href="/login?portal=admin"
              className="group rounded-3xl border border-white/10 bg-white p-5 text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                🏢
              </div>

              <h2 className="mt-5 text-xl font-black">{t("institutionTitle")}</h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("institutionDescription")}
              </p>

              <span className="mt-5 inline-flex text-sm font-bold text-blue-700">
                {t("institutionAction")} →
              </span>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-blue-200 underline-offset-4 hover:underline"
            >
                {t("backToSite")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
