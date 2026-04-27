"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function EsqueciSenhaContent() {
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao solicitar redefinição.");
      }

      setEnviado(true);
    } catch (e: any) {
      setErro(e?.message || "Erro ao solicitar redefinição.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
          <p className="text-sm text-gray-500">
            Informe seu email para receber o link de redefinição.
          </p>
        </div>

        {enviado ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Se este email estiver cadastrado, enviaremos um link de redefinição.
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="Seu email"
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
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </>
        )}

        <a
          href={`/login?portal=${portal}`}
          className="block text-center text-sm text-blue-600 hover:underline"
        >
          Voltar para o login
        </a>
      </div>
    </main>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EsqueciSenhaContent />
    </Suspense>
  );
}