"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";

function EsqueciSenhaContent() {
  const t = useTranslations("PublicLogin.recovery");
  const searchParams = useSearchParams();
  const portal = searchParams.get("portal") || "admin";

  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function enviar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(t("requestFailed"));
      }

      setEnviado(true);
    } catch (e: any) {
      setErro(e?.message || t("requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="absolute right-4 top-4 w-56">
        <SeletorIdioma />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-gray-500">
            {t("description")}
          </p>
        </div>

        {enviado ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {t("sent")}
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              aria-label={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            {erro && <p className="text-red-600 text-sm">{erro}</p>}

            <button
              onClick={enviar}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
            >
              {loading ? t("sending") : t("sendLink")}
            </button>
          </>
        )}

        <a
          href={`/login?portal=${portal}`}
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          {t("backToLogin")}
        </a>
      </div>
    </main>
  );
}

export default function EsqueciSenhaPage() {
  const t = useTranslations("PublicLogin");
  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <EsqueciSenhaContent />
    </Suspense>
  );
}
