"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type SistemaCelular = "android" | "ios" | "outro";

function detectarSistema(): SistemaCelular {
  if (typeof window === "undefined") return "outro";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "outro";
}

function estaInstalado() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & {
      standalone?: boolean;
    }).standalone === true
  );
}

export default function PhanyxRhAppPage() {
  const router = useRouter();
  const t = useTranslations("RhAppEntry");

  const [sistema, setSistema] =
    useState<SistemaCelular>("outro");

  const [instalado, setInstalado] = useState(false);
  const [mostrarInstalacao, setMostrarInstalacao] =
    useState(false);

useEffect(() => {
  const slugSalvo = localStorage.getItem(
    "phanyx_rh_instituicao_slug"
  );

  if (slugSalvo) {
    router.replace(
      `/rh-app/${encodeURIComponent(slugSalvo)}`
    );
  }
}, [router]);

  useEffect(() => {
    setSistema(detectarSistema());
    setInstalado(estaInstalado());
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-8 text-center text-white">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-3 shadow-xl">
              <Image
                src="/icon.png"
                alt="PHANYX RH"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-blue-100">
              {t("employeeApp")}
            </p>

            <h1 className="mt-2 text-3xl font-black">
              PHANYX RH
            </h1>

            <p className="mt-3 text-sm leading-6 text-blue-100">
              {t("heroDescription")}
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {t("quickSecure")}
              </p>

              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p>{t("photo")}</p>
                <p>{t("location")}</p>
                <p>{t("officialTime")}</p>
                <p>{t("individualAccess")}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 text-center">
  <p className="font-black text-amber-900 dark:text-amber-200">
    {t("openInstitutionLink")}
  </p>

  <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-100">
    {t("firstAccess")}
  </p>
</div>
            {!instalado && (
              <button
                type="button"
                onClick={() =>
                  setMostrarInstalacao((atual) => !atual)
                }
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                {t("howToInstall")}
              </button>
            )}

            {instalado && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50 p-4 text-center">
                <p className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                  {t("installed")}
                </p>
              </div>
            )}

            {mostrarInstalacao && sistema === "ios" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <p className="font-black text-slate-900 dark:text-white">
                  {t("installIphone")}
                </p>

                <ol className="mt-3 list-decimal space-y-1 pl-5">
                  <li>{t("iosStep1")}</li>
                  <li>{t("iosStep2")}</li>
                  <li>
                    {t("iosStep3")}
                  </li>
                  <li>{t("iosStep4")}</li>
                </ol>
              </div>
            )}

            {mostrarInstalacao && sistema !== "ios" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <p className="font-black text-slate-900 dark:text-white">
                  {t("installAndroid")}
                </p>

                <ol className="mt-3 list-decimal space-y-1 pl-5">
                  <li>{t("androidStep1")}</li>
                  <li>
                    {t("androidStep2")}
                  </li>
                  <li>
                    {t("androidStep3")}
                  </li>
                  <li>{t("androidStep4")}</li>
                </ol>
              </div>
            )}

            <p className="text-center text-xs leading-5 text-slate-600 dark:text-slate-400">
              {t("installationNote")}
            </p>
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
          {t("footer")}
        </p>
      </div>
    </main>
  );
}
