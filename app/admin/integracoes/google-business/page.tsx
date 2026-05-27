"use client";

import { useEffect, useState } from "react";

export default function GoogleBusinessPage() {
  const [perfil, setPerfil] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/integracoes/google-business", {
        cache: "no-store",
      });

      const data = await res.json();

      setPerfil(data?.perfil || "");
      setAtivo(Boolean(data?.ativo));
    } catch {
      setMensagem("Erro ao carregar configuração.");
    }
  }

  async function conectarGoogleBusiness() {
  try {
    setMensagem("");

    window.location.href =
      "/api/admin/integracoes/google-business/connect";
  } catch {
    setMensagem("Não foi possível iniciar a conexão com o Google Business.");
  }
}

  async function salvar() {
    try {
      setSalvando(true);
      setMensagem("");

      const res = await fetch("/api/admin/integracoes/google-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          perfil,
          ativo,
        }),
      });

      if (!res.ok) {
  const erro = await res.json().catch(() => null);
  throw new Error(erro?.detalhe || erro?.error || "Erro ao salvar configuração.");
}

      setMensagem("Google Business salvo com sucesso.");
    } catch (error: any) {
  setMensagem(error?.message || "Erro ao salvar configuração.");
} finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          📍 Google Business
        </h1>

        <p className="mt-2 text-slate-600">
          Configure a presença local da sua instituição no Google.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <h2 className="text-lg font-bold text-slate-900">
      Integração Google Business
    </h2>

    <p className="mt-2 text-sm leading-6 text-slate-600">
      Conecte o perfil Google Business da instituição para futuramente exibir
      métricas locais, reputação, avaliações e presença no Google.
    </p>
  </div>

  <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
    <input
      type="checkbox"
      checked={ativo}
      onChange={(e) => setAtivo(e.target.checked)}
    />

    <span className="font-semibold text-slate-800">
      Ativar Google Business nesta instituição
    </span>
  </label>

  {ativo && (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="font-bold text-amber-900">
        Google Business conectado ao PHANYX
      </p>

      <p className="mt-2 text-sm leading-6 text-amber-800">
        O PHANYX já está preparado para integração com a API oficial do Google
        Business. Algumas métricas poderão depender de aprovação/liberação do
        Google.
      </p>
    </div>
  )}

  {mensagem && (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
      {mensagem}
    </div>
  )}

  <div className="flex flex-wrap gap-3">
    <button
      onClick={conectarGoogleBusiness}
      className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
    >
      Conectar Google Business
    </button>

    <button
      onClick={salvar}
      disabled={salvando}
      className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-60"
    >
      {salvando ? "Salvando..." : "Salvar configuração"}
    </button>
  </div>
</div>
    </div>
  );
}