"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import InstallPromptPhanyxRH from "@/components/pwa/InstallPromptPhanyxRH";

class LocalizedRhAppError extends Error {}

type DadosInstituicao = {
  slug: string;
  nome: string | null;
  nomeCadastro?: string | null;
  logoUrl?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pontoMobileAtivo: boolean;
};

export default function RhAppInstituicaoPage() {
  const params = useParams<{ slug: string }>();
  const t = useTranslations("RhAppAccess");

  const slug = useMemo(
    () =>
      decodeURIComponent(String(params?.slug || ""))
        .trim()
        .toLowerCase(),
    [params]
  );

  const [dados, setDados] =
    useState<DadosInstituicao | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!slug) {
      setErro(t("errors.institutionMissing"));
      setCarregando(false);
      return;
    }

    localStorage.setItem(
      "phanyx_rh_instituicao_slug",
      slug
    );

    carregarInstituicao();
  }, [slug]);

  async function carregarInstituicao() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        `/api/public/rh-app/${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new LocalizedRhAppError(
          t(
            resposta.status === 404
              ? "errors.institutionNotFound"
              : "errors.institutionLoad"
          )
        );
      }

      setDados(resultado);
    } catch (error) {
      setErro(
        error instanceof LocalizedRhAppError
          ? error.message
          : t("errors.institutionLoad")
      );
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 text-slate-900 dark:bg-slate-950 dark:text-white">
      <p className="text-sm font-bold">
        {t("loadingInstitution")}
      </p>
    </main>
  );
}

  if (erro || !dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-300 bg-white dark:border-red-900 dark:bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-black">
            PHANYX RH
          </h1>

          <p className="mt-3 text-sm text-red-700 dark:text-red-300">
            {erro || t("errors.institutionNotFound")}
          </p>
        </div>
      </main>
    );
  }


  const nomeInstituicao = String(
  dados.nome ||
    dados.nomeCadastro ||
    t("institutionFallback")
).trim();

const nomeInstituicaoExibicao =
  nomeInstituicao.replace(
    /^([^-]+)-(.+)$/,
    "$1 – $2"
  );

  const nomeInstituicaoCurto =
  nomeInstituicao
    .split(/\s*[–—-]\s*/)
    .map((parte) => parte.trim())
    .find(Boolean) || nomeInstituicao;

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 pb-28 text-slate-900 dark:bg-slate-950 dark:text-white">

      <InstallPromptPhanyxRH
  nomeInstituicao={nomeInstituicaoCurto}
/>

    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-2xl">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 px-6 py-8 text-center text-white">
  <img
    src="/logo-phanyx.png"
    alt="PHANYX"
    className="mx-auto h-auto w-full max-w-[190px] object-contain"
  />

  <div className="mt-7">
    {dados.logoUrl && (
      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-xl">
        <img
          src={dados.logoUrl}
          alt={t("institutionLogoAlt", {name: nomeInstituicao})}
          className="h-full w-full object-contain"
        />
      </div>
    )}

    <p className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-blue-100">
      {t("productName")}
    </p>

    <h1 className="mt-3 text-2xl font-black leading-tight text-white">
      {nomeInstituicaoExibicao}
    </h1>

    {(dados.cidade || dados.estado) && (
      <p className="mt-3 text-sm font-medium text-blue-100">
        {[dados.cidade, dados.estado]
          .filter(Boolean)
          .join(" - ")}
      </p>
    )}
  </div>
</div>

          <div className="space-y-5 p-6">
  {dados.pontoMobileAtivo ? (
    <Link
  href={`/rh-app/${encodeURIComponent(
    dados.slug
  )}/login`}
  className="flex min-h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 py-4 text-center font-black text-white transition hover:bg-blue-700"
>
  {t("enter")}
</Link>
  ) : (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
      <p className="font-black text-amber-900 dark:text-amber-200">
        {t("mobileUnavailable")}
      </p>

      <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-100">
        {t("mobileInactive")}
      </p>
    </div>
  )}

  <p className="text-center text-xs leading-5 text-slate-600 dark:text-slate-400">
    {t("employeeAuthorization")}
  </p>
</div>
        </section>
      </div>
    </main>
  );
}