"use client";

import {
  Suspense,
  useState,
} from "react";
import {
  useTranslations,
} from "next-intl";
import {
  useSearchParams,
} from "next/navigation";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";
import PasswordStrength from "@/components/auth/PasswordStrength";
import {
  validatePassword,
} from "@/lib/password-policy";

function RedefinirSenhaContent() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token") || "";

  const t = useTranslations(
    "PublicLogin.resetPassword"
  );

  const tPassword =
    useTranslations(
      "PublicLogin.passwordSecurity"
    );

  const tLogin =
    useTranslations("PublicLogin");

  const [senha, setSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [sucesso, setSucesso] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  function traduzirErro(
    codigo?: string
  ) {
    switch (codigo) {
      case "RESET_TOKEN_INVALID":
        return t("tokenInvalid");

      case "RESET_LINK_INVALID_OR_EXPIRED":
        return t("linkExpired");

      case "PASSWORD_POLICY_INVALID":
        return tPassword(
          "policyInvalid"
        );

      default:
        return t("resetFailed");
    }
  }

  async function redefinir() {
    try {
      setLoading(true);
      setErro("");

      if (!token) {
        throw new Error(
          t("tokenInvalid")
        );
      }

      const validacao =
        validatePassword(senha);

      if (!validacao.ok) {
        throw new Error(
          tPassword("policyInvalid")
        );
      }

      if (
        senha !==
        confirmarSenha
      ) {
        throw new Error(
          t("passwordsMismatch")
        );
      }

      const res = await fetch(
        "/api/auth/redefinir-senha",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            token,
            senha,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          traduzirErro(
            String(
              data?.codigo || ""
            )
          )
        );
      }

      setSucesso(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("resetFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-100 px-4 py-20">
      <div className="absolute right-4 top-4 w-56">
        <SeletorIdioma />
      </div>

      <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-md">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-950">
            {t("title")}
          </h1>

          <p className="text-sm text-gray-500">
            {t("description")}
          </p>
        </div>

        {sucesso ? (
          <>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {t("success")}
            </div>

            <a
              href="/login"
              className="block w-full rounded-lg bg-blue-600 py-2 text-center font-medium text-white transition hover:bg-blue-500"
            >
              {t("backToLogin")}
            </a>
          </>
        ) : (
          <>
            <div className="relative">
              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                name="new-password"
                autoComplete="new-password"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={
                  t("newPassword")
                }
                aria-label={
                  t("newPassword")
                }
                value={senha}
                onChange={(event) =>
                  setSenha(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 p-2 pr-20 text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarSenha(
                    (current) =>
                      !current
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600"
                aria-label={
                  mostrarSenha
                    ? tLogin(
                        "hidePassword"
                      )
                    : tLogin(
                        "showPassword"
                      )
                }
              >
                {mostrarSenha
                  ? tLogin(
                      "hidePassword"
                    )
                  : tLogin(
                      "showPassword"
                    )}
              </button>
            </div>

            <PasswordStrength
              password={senha}
            />

            <input
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              name="confirm-password"
              autoComplete="new-password"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={
                t("confirmPassword")
              }
              aria-label={
                t("confirmPassword")
              }
              value={
                confirmarSenha
              }
              onChange={(event) =>
                setConfirmarSenha(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-700 p-2 text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {erro ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            ) : null}

            <button
              type="button"
              onClick={redefinir}
              disabled={
                loading ||
                !senha ||
                !confirmarSenha
              }
              className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? t("submitting")
                : t("submit")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  const t =
    useTranslations("PublicLogin");

  return (
    <Suspense
      fallback={
        <div>{t("loading")}</div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
