"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type TipoManifestacao =
  | "Sugestão"
  | "Reclamação"
  | "Elogio"
  | "Relato";

export default function OuvidoriaProfessorPage() {
  const t = useTranslations(
    "ProfessorOmbudsman"
  );

  const [tipo, setTipo] =
    useState<TipoManifestacao>(
      "Sugestão"
    );

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  function getTipoLabel(
    valor: TipoManifestacao
  ) {
    switch (valor) {
      case "Sugestão":
        return t(
          "types.suggestion"
        );

      case "Reclamação":
        return t(
          "types.complaint"
        );

      case "Elogio":
        return t(
          "types.praise"
        );

      case "Relato":
        return t(
          "types.report"
        );

      default:
        return valor;
    }
  }

  async function enviarManifestacao() {
    setErro("");
    setSucesso("");

    if (!mensagem.trim()) {
      setErro(
        t(
          "feedback.messageRequired"
        )
      );

      return;
    }

    try {
      setEnviando(true);

      const res = await fetch(
        "/api/ouvidoria",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            origem: "PROFESSOR",
            tipo,
            mensagem:
              mensagem.trim(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.sendError"
          )
        );
      }

      setMensagem("");
      setTipo("Sugestão");

      setSucesso(
        t(
          "feedback.sendSuccess"
        )
      );
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.sendError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700 dark:text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm phanyx-theme-card dark:border-slate-700 dark:bg-slate-900">
        <div className="space-y-5">
          <div>
            <label
              htmlFor="tipo-manifestacao"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t(
                "form.typeLabel"
              )}
            </label>

            <select
              id="tipo-manifestacao"
              value={tipo}
              onChange={(e) =>
                setTipo(
                  e.target
                    .value as TipoManifestacao
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900/30"
            >
              <option value="Sugestão">
                {getTipoLabel(
                  "Sugestão"
                )}
              </option>

              <option value="Reclamação">
                {getTipoLabel(
                  "Reclamação"
                )}
              </option>

              <option value="Elogio">
                {getTipoLabel(
                  "Elogio"
                )}
              </option>

              <option value="Relato">
                {getTipoLabel(
                  "Relato"
                )}
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="mensagem-ouvidoria"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t(
                "form.messageLabel"
              )}
            </label>

            <textarea
              id="mensagem-ouvidoria"
              value={mensagem}
              onChange={(e) =>
                setMensagem(
                  e.target.value
                )
              }
              rows={8}
              className="
                w-full
                rounded-2xl
                border-2
                border-slate-300
                bg-white
                p-4
                text-slate-900
                shadow-md
                outline-none
                placeholder:text-slate-400
                hover:border-blue-400
                focus:border-blue-600
                focus:ring-4
                focus:ring-blue-100
                dark:border-slate-600
                dark:bg-slate-900
                dark:text-white
                dark:placeholder:text-slate-500
                dark:focus:ring-blue-900/30
              "
              placeholder={t(
                "form.messagePlaceholder"
              )}
            />
          </div>

          {sucesso && (
            <div
              aria-live="polite"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              {sucesso}
            </div>
          )}

          {erro && (
            <div
              aria-live="assertive"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
            >
              {erro}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={
                enviarManifestacao
              }
              disabled={
                enviando
              }
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando
                ? t(
                    "form.sending"
                  )
                : t(
                    "form.send"
                  )}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          {t(
            "howItWorks.title"
          )}
        </h2>

        <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li>
            •{" "}
            {t(
              "howItWorks.forwarded"
            )}
          </li>

          <li>
            •{" "}
            {t(
              "howItWorks.tracking"
            )}
          </li>

          <li>
            •{" "}
            {t(
              "howItWorks.suggestions"
            )}
          </li>

          <li>
            •{" "}
            {t(
              "howItWorks.complaints"
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}