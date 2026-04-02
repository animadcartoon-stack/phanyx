"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

interface Departamento {
  id: number;
  nome: string;
  slug?: string | null;
  ativo: boolean;
}

function AdminDepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);

  async function carregarDepartamentos() {
    const res = await fetch("/api/departamento", {
      credentials: "include",
    });
    const data = await res.json();
    setDepartamentos(Array.isArray(data) ? data : []);
  }

  async function criarDepartamento(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/departamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nome, slug }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao criar departamento");
      return;
    }

    setNome("");
    setSlug("");
    carregarDepartamentos();
  }

  function iniciarEdicao(dep: Departamento) {
    setEditandoId(dep.id);
    setEditNome(dep.nome);
    setEditSlug(dep.slug || "");
    setEditAtivo(dep.ativo);
  }

  async function salvarEdicao(id: number) {
    const res = await fetch(`/api/departamento/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome: editNome,
        slug: editSlug,
        ativo: editAtivo,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao atualizar departamento");
      return;
    }

    setEditandoId(null);
    carregarDepartamentos();
  }

  async function excluirDepartamento(id: number) {
    if (!confirm("Deseja excluir este departamento?")) return;

    const res = await fetch(`/api/departamento/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao excluir departamento");
      return;
    }

    carregarDepartamentos();
  }

  useEffect(() => {
    carregarDepartamentos();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">🏢 Departamentos</h1>

      <form
        onSubmit={criarDepartamento}
        className="bg-white border rounded-lg p-6 space-y-4"
      >
        <h2 className="font-semibold">Novo departamento</h2>

        <input
          placeholder="Nome do departamento"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border rounded-lg p-2"
          required
        />

        <input
          placeholder="Slug público (opcional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Criar departamento
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold">Lista de departamentos</h2>

        {departamentos.map((d) => (
          <div key={d.id} className="bg-white border rounded-lg p-4">
            {editandoId === d.id ? (
              <div className="space-y-3">
                <input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="border p-2 rounded w-full"
                  placeholder="Nome"
                />

                <input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="border p-2 rounded w-full"
                  placeholder="Slug"
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editAtivo}
                    onChange={(e) => setEditAtivo(e.target.checked)}
                  />
                  Ativo
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={() => salvarEdicao(d.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="bg-gray-400 text-white px-3 py-1 rounded"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium">{d.nome}</p>
                <p className="text-sm text-gray-600">Slug: {d.slug || "-"}</p>
                <p className="text-sm text-gray-600">
                  Status: {d.ativo ? "Ativo" : "Inativo"}
                </p>

                <div className="flex gap-4 mt-3">
                  <button
                    onClick={() => iniciarEdicao(d)}
                    className="text-blue-600 text-sm"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluirDepartamento(d.id)}
                    className="text-red-600 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AdminDepartamentosPage, ["admin"]);