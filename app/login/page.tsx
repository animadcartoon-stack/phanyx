"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";

type Portal = "admin" | "professor" | "aluno";

function LoginContent() {
  const searchParams = useSearchParams();

  const portal = useMemo<Portal>(() => {
    const valor = searchParams.get("portal");

    if (valor === "professor") return "professor";
    if (valor === "aluno") return "aluno";
    return "admin";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);

  const titulo = useMemo(() => {
    if (portal === "professor") return "Login do Professor";
    if (portal === "aluno") return "Login do Aluno";
    return "Login da Instituição";
  }, [portal]);

  const subtitulo = useMemo(() => {
    if (portal === "professor") {
      return "Acesse sua área docente com seu email e senha.";
    }

    if (portal === "aluno") {
      return "Acesse sua área do aluno com seu email e senha.";
    }

    return "Acesse o painel administrativo da instituição.";
  }, [portal]);

  async function handleLogin() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    email,
    senha,
    portal,
  }),
});

      const json = await res.json();

      if (!res.ok) {
        setErro(json.error || "Email ou senha inválidos");
        return;
      }

      if (json.user?.precisaTrocarSenha) {
        window.location.href = "/primeiro-acesso";
        return;
      }

      const role = String(json.user?.role || "").toLowerCase();

if (
  ["admin", "gerencia", "secretaria", "coordenador", "financeiro", "suporte"].includes(role)
) {
  window.location.href = "/admin";
  return;
}

if (role === "professor") {
  window.location.href = "/professor";
  return;
}

if (role === "aluno") {
  window.location.href = "/aluno";
  return;
}

      setErro("Perfil de usuário inválido");
    } catch {
      setErro("Não foi possível fazer login");
    } finally {
      setLoading(false);
    }
  }

  function handleEnterKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleLogin();
    }
  }

  return (
  <>
    <InstallPromptPHANYX />

    return (
  <main className="min-h-screen bg-slate-50">
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/images/portal-login-hero.png"
          alt="PHANYX"
          width={320}
          height={220}
          className="h-auto w-full max-w-[200px]"
          priority
        />

        <h1 className="mt-6 text-3xl font-black text-slate-900">
          Escolha seu acesso
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Entre como aluno, professor ou instituição.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href="/login?portal=aluno"
          className={`block rounded-3xl border p-5 shadow-sm transition ${
            portal === "aluno"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
              👨‍🎓
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Área do aluno
              </h2>
              <p className="text-sm text-slate-500">
                Aulas, atividades, boletim e certificados.
              </p>
            </div>
          </div>
        </a>

        <a
          href="/login?portal=professor"
          className={`block rounded-3xl border p-5 shadow-sm transition ${
            portal === "professor"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
              👨‍🏫
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Área do professor
              </h2>
              <p className="text-sm text-slate-500">
                Turmas, avaliações e materiais.
              </p>
            </div>
          </div>
        </a>

        <a
          href="/login?portal=admin"
          className={`block rounded-3xl border p-5 shadow-sm transition ${
            portal === "admin"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              🏢
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Instituição
              </h2>
              <p className="text-sm text-slate-500">
                Gestão acadêmica e administrativa.
              </p>
            </div>
          </div>
        </a>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-black">{titulo}</h2>
          <p className="text-sm text-slate-500">{subtitulo}</p>
        </div>

        <div className="mt-5 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleEnterKey}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
          />

          <div className="relative">
            <input
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 outline-none"
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>

          {erro && (
            <p className="text-sm font-medium text-red-600">
              {erro}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 py-4 text-white font-bold disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <a
            href={`/esqueci-senha?portal=${portal}`}
            className="block text-center text-sm font-medium text-blue-600"
          >
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  </main>
);
  </>
);
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}