"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type TipoManifestacao =
  | "Sugestão"
  | "Reclamação"
  | "Elogio"
  | "Relato";

export default function OuvidoriaAlunoClient() {
  const t = useTranslations("StudentOmbudsman");

  const [tipo, setTipo] =
    useState<TipoManifestacao>("Sugestão");

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  async function enviarManifestacao() {
    setErro("");
    setSucesso("");

    if (!mensagem.trim()) {
      setErro(t("validation.messageRequired"));
      return;
    }

    try {
      setEnviando(true);

      const res = await fetch("/api/ouvidoria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          origem: "ALUNO",
          tipo,
          mensagem: mensagem.trim(),
        }),
      });

      const textoResposta = await res.text();

      let data: {
        error?: string;
      } | null = null;

      try {
        data = textoResposta
          ? JSON.parse(textoResposta)
          : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error(
          "Erro retornado pela ouvidoria:",
          data?.error || textoResposta
        );

        throw new Error(t("errors.submit"));
      }

      setMensagem("");
      setTipo("Sugestão");
      setSucesso(t("success"));
    } catch (error) {
      console.error(
        "Erro ao enviar manifestação:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : t("errors.submit")
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700 dark:text-blue-300">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          {t("description")}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="space-y-5">
          <div>
            <label
              htmlFor="tipo-manifestacao"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t("form.typeLabel")}
            </label>

            <select
              id="tipo-manifestacao"
              value={tipo}
              onChange={(event) =>
                setTipo(
                  event.target
                    .value as TipoManifestacao
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
            >
              <option value="Sugestão">
                {t("types.suggestion")}
              </option>

              <option value="Reclamação">
                {t("types.complaint")}
              </option>

              <option value="Elogio">
                {t("types.compliment")}
              </option>

              <option value="Relato">
                {t("types.report")}
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mensagem-manifestacao"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t("form.messageLabel")}
            </label>

            <textarea
              id="mensagem-manifestacao"
              value={mensagem}
              onChange={(event) =>
                setMensagem(event.target.value)
              }
              rows={8}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-blue-950"
              placeholder={t(
                "form.messagePlaceholder"
              )}
            />
          </div>

          {sucesso && (
            <div
              role="status"
              className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
            >
              {sucesso}
            </div>
          )}

          {erro && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200"
            >
              {erro}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={enviarManifestacao}
              disabled={enviando}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold !text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
              }}
            >
              {enviando
                ? t("form.submitting")
                : t("form.submit")}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/40">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          {t("howItWorks.title")}
        </h2>

        <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li>• {t("howItWorks.forwarded")}</li>
          <li>• {t("howItWorks.tracking")}</li>
          <li>• {t("howItWorks.suggestions")}</li>
          <li>• {t("howItWorks.analysis")}</li>
        </ul>
      </div>
    </div>
  );
}