"use client";

import { Suspense, useMemo, useState } from "react";
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

    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-gray-500">{subtitulo}</p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleEnterKey}
          className="w-full border rounded-lg p-2"
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
    className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-500 hover:text-slate-800"
  >
    {mostrarSenha ? "🙈" : "👁️"}
  </button>
</div>

        {erro && <p className="text-red-600 text-sm">{erro}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

<a
  href={`/esqueci-senha?portal=${portal}`}
  className="block text-center text-sm text-blue-600 hover:underline"
>
  Esqueci minha senha
</a>

      </div>
        </main>
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