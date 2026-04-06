"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

      if (json.user?.role === "admin") {
        window.location.href = "/admin";
        return;
      }

      if (json.user?.role === "professor") {
        window.location.href = "/professor";
        return;
      }

      if (json.user?.role === "aluno") {
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

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={handleEnterKey}
          className="w-full border rounded-lg p-2"
        />

        {erro && <p className="text-red-600 text-sm">{erro}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}