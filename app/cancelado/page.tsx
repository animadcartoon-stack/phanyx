"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CanceladoContent() {
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-amber-500/20 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-4xl">
            ⚠️
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
              Cobrança não concluída
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              Não foi possível concluir sua adesão agora
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              A cobrança foi cancelada, expirou ou ainda não pôde ser confirmada.
              Você pode gerar uma nova tentativa de adesão em poucos segundos.
            </p>
          </div>

          {motivo ? (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              <span className="font-semibold text-white">Motivo informado:</span>{" "}
              {motivo}
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <h2 className="text-lg font-semibold text-white">
              O que você pode fazer agora
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <p>1. Voltar para a tela de adesão.</p>
              <p>2. Conferir os dados informados.</p>
              <p>3. Gerar uma nova cobrança ou assinatura.</p>
              <p>4. Concluir o pagamento novamente.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/adesao"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Tentar novamente
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CanceladoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
              Carregando status da cobrança...
            </div>
          </div>
        </div>
      }
    >
      <CanceladoContent />
    </Suspense>
  );
}