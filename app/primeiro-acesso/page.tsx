"use client";

import {
  useState,
  type FormEvent,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  useTranslations,
} from "next-intl";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";
import PasswordStrength from "@/components/auth/PasswordStrength";
import {
  validatePassword,
} from "@/lib/password-policy";

export default function PrimeiroAcessoPage() {
  const router = useRouter();

  const t = useTranslations(
    "PublicLogin.firstAccess"
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

  const [erro, setErro] =
    useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  function traduzirErro(
    codigo?: string
  ) {
    switch (codigo) {
      case "PASSWORD_POLICY_INVALID":
        return tPassword(
          "policyInvalid"
        );

      case "AUTH_TOKEN_MISSING":
        return t(
          "sessionExpired"
        );

      default:
        return t(
          "updateFailed"
        );
    }
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setErro("");

    const validacao =
      validatePassword(senha);

    if (!validacao.ok) {
      setErro(
        tPassword("policyInvalid")
      );
      return;
    }

    if (
      senha !==
      confirmarSenha
    ) {
      setErro(
        t("passwordsMismatch")
      );
      return;
    }

    try {
      setSalvando(true);

      const res = await fetch(
        "/api/auth/primeiro-acesso",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            senha,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        setErro(
          traduzirErro(
            String(
              data?.codigo || ""
            )
          )
        );
        return;
      }

      const meRes =
        await fetch(
          "/api/auth/me",
          {
            credentials:
              "include",
            cache: "no-store",
          }
        );

      const meData =
        await meRes.json();

      const role =
        String(
          meData?.user?.role ||
            ""
        ).toUpperCase();

      if (role === "ALUNO") {
        router.push("/aluno");
        return;
      }

      if (
        role === "PROFESSOR"
      ) {
        router.push(
          "/professor"
        );
        return;
      }

      router.push("/admin");
    } catch {
      setErro(
        t("updateFailed")
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-20 text-white">
      <div className="absolute right-4 top-4 w-56">
        <SeletorIdioma />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-400">
            PHANYX
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {t("title")}
          </h1>

          <p className="mt-3 text-sm text-slate-300">
            {t("description")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 pr-24 text-white outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() =>
                setMostrarSenha(
                  (current) =>
                    !current
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-300 hover:text-white"
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
            variant="dark"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />

          {erro ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {erro}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {salvando
              ? t("saving")
              : t("save")}
          </button>
        </form>
      </div>
    </main>
  );
}
