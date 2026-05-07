"use client";

import { useEffect, useState } from "react";

export default function PerfilAdminPage() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/funcionarios/me");

      const data = await res.json();

      setDados(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/funcionarios/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (!res.ok) {
        alert("Erro ao salvar perfil");
        return;
      }

      alert("Perfil atualizado com sucesso");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar");
    }
  }

  if (loading) {
    return <div className="p-10">Carregando...</div>;
  }

  return (
    <main className="max-w-3xl p-8">
      <div className="rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          Meu perfil
        </h1>

        <p className="mt-2 text-slate-500">
          Atualize seus dados administrativos.
        </p>

        <form onSubmit={salvar} className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nome
            </label>

            <input
              type="text"
              value={dados?.nome || ""}
              onChange={(e) =>
                setDados({
                  ...dados,
                  nome: e.target.value,
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Telefone
            </label>

            <input
              type="text"
              value={dados?.telefone || ""}
              onChange={(e) =>
                setDados({
                  ...dados,
                  telefone: e.target.value,
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Cargo
            </label>

            <input
              type="text"
              value={dados?.cargo || ""}
              onChange={(e) =>
                setDados({
                  ...dados,
                  cargo: e.target.value,
                })
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Salvar alterações
          </button>
        </form>
      </div>
    </main>
  );
}