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
    <div className="phanyx-config-page max-w-3xl space-y-6">
      <div>
        <h1 className="phanyx-config-title text-3xl font-black">
          📍 Google Business
        </h1>

        <p className="phanyx-config-muted mt-2">
          Configure a presença local da sua instituição no Google.
        </p>
      </div>

      <div className="phanyx-config-card space-y-5 p-6 shadow-sm">
  <div className="phanyx-config-soft-card rounded-2xl p-5">
    <h2 className="phanyx-config-title text-lg font-bold">
      Integração Google Business
    </h2>

    <p className="phanyx-config-muted mt-2 text-sm leading-6">
      Conecte o perfil Google Business da instituição para futuramente exibir
      métricas locais, reputação, avaliações e presença no Google.
    </p>
  </div>

  <label className="phanyx-config-check-row flex cursor-pointer items-center gap-3 rounded-xl p-4">
    <input
      type="checkbox"
      checked={ativo}
      onChange={(e) => setAtivo(e.target.checked)}
    />

    <span className="phanyx-config-check-label font-semibold">
      Ativar Google Business nesta instituição
    </span>
  </label>

  {ativo && (
    <div className="phanyx-config-warning rounded-2xl p-5">
      <p className="font-bold">
  Google Business conectado ao PHANYX
</p>

<p className="mt-2 text-sm leading-6">
  O PHANYX já está preparado para integração com a API oficial do Google
  Business. Algumas métricas poderão depender de aprovação/liberação do
  Google.
</p>
    </div>
  )}

  {mensagem && (
    <div className="phanyx-config-info rounded-xl p-4">
      {mensagem}
    </div>
  )}

  <div className="flex flex-wrap gap-3">
    <button
      onClick={conectarGoogleBusiness}
      className="phanyx-primary-action"
    >
      Conectar Google Business
    </button>

    <button
      onClick={salvar}
      disabled={salvando}
      className="phanyx-secondary-action disabled:opacity-60"
    >
      {salvando ? "Salvando..." : "Salvar configuração"}
    </button>
  </div>
</div>
    </div>
  );
}