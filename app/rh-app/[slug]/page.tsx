"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import InstallPromptPhanyxRH from "@/components/pwa/InstallPromptPhanyxRH";

type DadosInstituicao = {
  slug: string;
  nome: string;
  nomeCadastro?: string | null;
  logoUrl?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pontoMobileAtivo: boolean;
};

export default function RhAppInstituicaoPage() {
  const params = useParams<{ slug: string }>();

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
    if (!slug) return;

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
        throw new Error(
          resultado?.error ||
            "Instituição não encontrada."
        );
      }

      setDados(resultado);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o PHANYX RH."
      );
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <InstallPromptPhanyxRH
  nomeInstituicao={dados.nome}
/>
        <p className="text-sm font-bold">
          Carregando PHANYX RH...
        </p>
      </main>
    );
  }

  if (erro || !dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-900 bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-black">
            PHANYX RH
          </h1>

          <p className="mt-3 text-sm text-red-300">
            {erro || "Instituição não encontrada."}
          </p>
        </div>
      </main>
    );
  }

  const destino = `/rh-app/${dados.slug}/ponto`;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full overflow-hidden rounded-[32px] border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 px-6 py-8 text-center">
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
          alt={`Logo de ${dados.nome}`}
          className="h-full w-full object-contain"
        />
      </div>
    )}

    <p className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-blue-100">
      RH Ponto
    </p>

    <h1 className="mt-3 text-2xl font-black leading-tight text-white">
      {dados.nome.replace(
        /^([^-]+)-(.+)$/,
        "$1 – $2"
      )}
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
      href={`/login?portal=admin&destino=${encodeURIComponent(
        destino
      )}&instituicao=${encodeURIComponent(
        dados.slug
      )}`}
      className="flex min-h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 py-4 text-center font-black text-white transition hover:bg-blue-700"
    >
      Entrar no PHANYX RH
    </Link>
  ) : (
    <div className="rounded-2xl border border-amber-800 bg-amber-950/40 p-4">
      <p className="font-black text-amber-200">
        Ponto Mobile indisponível
      </p>

      <p className="mt-2 text-sm leading-6 text-amber-100">
        Esta instituição ainda não ativou o registro de ponto pelo celular.
      </p>
    </div>
  )}

  <p className="text-center text-xs leading-5 text-slate-400">
    O registro de ponto só estará disponível para funcionários liberados
    individualmente pelo RH.
  </p>
</div>
        </section>
      </div>
    </main>
  );
}