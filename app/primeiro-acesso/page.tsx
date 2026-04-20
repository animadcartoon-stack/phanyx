"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrimeiroAcessoPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSalvando(true);

      const res = await fetch("/api/auth/primeiro-acesso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error || "Erro ao atualizar senha.");
        return;
      }

      const meRes = await fetch("/api/auth/me", {
  credentials: "include",
  cache: "no-store",
});

const meData = await meRes.json();
const role = String(meData?.user?.role || "").toUpperCase();

if (role === "ALUNO") {
  router.push("/aluno");
  return;
}

if (role === "PROFESSOR") {
  router.push("/professor");
  return;
}

router.push("/admin");
    } catch {
      setErro("Erro ao atualizar senha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-400">
            PHANYX
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Primeiro acesso
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Por segurança, defina agora sua nova senha de acesso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
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
            {salvando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}