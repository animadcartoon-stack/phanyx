"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function GoogleBusinessPage() {
  const t = useTranslations("AdminIntegracoes.googleBusiness");
  const common = useTranslations("AdminIntegracoes.common");

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
      setMensagem(common("loadError"));
    }
  }

  function conectarGoogleBusiness() {
    try {
      setMensagem("");
      window.location.href =
        "/api/admin/integracoes/google-business/connect";
    } catch {
      setMensagem(t("connectError"));
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
        throw new Error(
          erro?.detalhe || erro?.error || common("saveError")
        );
      }

      setMensagem(t("success"));
    } catch (error) {
      setMensagem(
        error instanceof Error
          ? error.message
          : common("saveError")
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="phanyx-google-config-page max-w-3xl space-y-6">
      <div>
        <h1 className="phanyx-config-title text-3xl font-black">
          {"\u{1F4CD}"} Google Business
        </h1>

        <p className="phanyx-config-muted mt-2">
          {t("description")}
        </p>
      </div>

      <div className="phanyx-config-card space-y-5 p-6 shadow-sm">
        <div className="phanyx-config-soft-card rounded-2xl p-5">
          <h2 className="phanyx-config-title text-lg font-bold">
            {t("integrationTitle")}
          </h2>

          <p className="phanyx-config-muted mt-2 text-sm leading-6">
            {t("integrationDescription")}
          </p>
        </div>

        <label className="phanyx-config-check-row flex cursor-pointer items-center gap-3 rounded-xl p-4">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />

          <span className="phanyx-config-check-label font-semibold">
            {t("activate")}
          </span>
        </label>

        {ativo && (
          <div className="phanyx-config-warning rounded-2xl p-5">
            <p className="font-bold">
              {t("connectedTitle")}
            </p>

            <p className="mt-2 text-sm leading-6">
              {t("connectedDescription")}
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
            type="button"
            onClick={conectarGoogleBusiness}
            className="phanyx-primary-action"
          >
            {t("connect")}
          </button>

          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="phanyx-secondary-action disabled:opacity-60"
          >
            {salvando ? common("saving") : common("saveConfiguration")}
          </button>
        </div>
      </div>
    </div>
  );
}
