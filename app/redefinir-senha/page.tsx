"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function redefinir() {
    try {
      setLoading(true);
      setErro("");

      if (!token) throw new Error("Token inválido.");
      if (senha.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres.");
      if (senha !== confirmarSenha) throw new Error("As senhas não conferem.");

      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, senha }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Erro ao redefinir senha.");

      setSucesso(true);
    } catch (e: any) {
      setErro(e?.message || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <p className="text-sm text-gray-500">Crie uma nova senha de acesso.</p>
        </div>

        {sucesso ? (
          <>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Senha redefinida com sucesso.
            </div>

            <a
              href="/login"
              className="block w-full rounded-lg bg-blue-600 py-2 text-center text-white"
            >
              Voltar para o login
            </a>
          </>
        ) : (
          <>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Nova senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border rounded-lg p-2 pr-12"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
              >
                {mostrarSenha ? "🙈" : "👁️"}
              </button>
            </div>

            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            {erro && <p className="text-red-600 text-sm">{erro}</p>}

            <button
              onClick={redefinir}
              disabled={loading || !senha || !confirmarSenha}
              className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <RedefinirSenhaContent />
    </Suspense>
  );
}