"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatusAdesao = "PAGO" | "PENDENTE" | "PROCESSANDO" | "CANCELADO" | "ERRO";

function SucessoContent() {
  const searchParams = useSearchParams();
  const adesaoId = searchParams.get("adesao") || searchParams.get("ref");

  const [status, setStatus] = useState<StatusAdesao>("PROCESSANDO");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!adesaoId) {
      setLoading(false);
      setErro("ID da adesão não informado na URL.");
      return;
    }

    let ativo = true;

    async function consultarStatus() {
      try {
        const res = await fetch(`/api/adesao/status/${adesaoId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao consultar status da adesão.");
        }

        const novoStatus = (json?.adesao?.status || "PENDENTE") as StatusAdesao;

        if (!ativo) return;

        setStatus(novoStatus);
        setErro("");
        setLoading(false);

        if (novoStatus === "PAGO") {
          return;
        }
      } catch (error: any) {
        if (!ativo) return;
        setErro(error?.message || "Erro ao consultar status da adesão.");
        setLoading(false);
      }
    }

    consultarStatus();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/adesao/status/${adesaoId}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) return;

        const novoStatus = (json?.adesao?.status || "PENDENTE") as StatusAdesao;

        if (!ativo) return;

        setStatus(novoStatus);

        if (novoStatus === "PAGO" || novoStatus === "CANCELADO" || novoStatus === "ERRO") {
          clearInterval(interval);
        }
      } catch {
        // mantém tentando
      }
    }, 5000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [adesaoId]);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          {status === "PAGO" ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-4xl">
                ✅
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
                  Pagamento confirmado
                </p>

                <h1 className="mt-3 text-4xl font-bold">
                  Sua adesão ao PHANYX foi aprovada
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                  Recebemos a confirmação do pagamento e iniciamos a ativação da sua
                  instituição automaticamente.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h2 className="text-lg font-semibold text-white">
                  O que acontece agora
                </h2>

                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  <p>1. Sua instituição está sendo vinculada ao plano contratado.</p>
                  <p>2. O usuário administrador principal está sendo preparado.</p>
                  <p>3. O email de acesso será enviado automaticamente.</p>
                  <p>4. No primeiro login, será solicitada a troca da senha.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-4xl">
                ⏳
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
                  Aguardando confirmação
                </p>

                <h1 className="mt-3 text-4xl font-bold">
                  Estamos acompanhando seu pagamento
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                  Assim que o pagamento for confirmado, a ativação da sua instituição
                  será concluída automaticamente.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-white">Status atual:</span>{" "}
                  {loading ? "Carregando..." : status}
                </p>
              </div>
            </>
          )}

          {adesaoId ? (
            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
              <span className="font-semibold text-white">ID da adesão:</span>{" "}
              {adesaoId}
            </div>
          ) : null}

          {erro ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
              {erro}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
            Caso o email não apareça em instantes, verifique também a caixa de
            spam, promoções ou lixo eletrônico.
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/login?portal=admin"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Ir para o login administrativo
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

export default function SucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
              Carregando confirmação...
            </div>
          </div>
        </div>
      }
    >
      <SucessoContent />
    </Suspense>
  );
}