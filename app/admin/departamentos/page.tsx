"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

interface Departamento {
  id: number;
  nome: string;
  slug?: string | null;
  ativo: boolean;
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminDepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [departamentoParaExcluir, setDepartamentoParaExcluir] =
    useState<Departamento | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  async function carregarDepartamentos() {
    const res = await fetch("/api/departamento", {
      credentials: "include",
    });
    const data = await res.json();
    setDepartamentos(Array.isArray(data) ? data : []);
  }

  async function criarDepartamento(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/departamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar departamento");
      }

      setNome("");
      setSlug("");
      await carregarDepartamentos();
      mostrarFeedback("sucesso", "Departamento criado com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao criar departamento");
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(dep: Departamento) {
    setEditandoId(dep.id);
    setEditNome(dep.nome);
    setEditSlug(dep.slug || "");
    setEditAtivo(dep.ativo);
  }

  async function salvarEdicao(id: number) {
    try {
      setSalvandoId(id);

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
        throw new Error(data.error || "Erro ao atualizar departamento");
      }

      setEditandoId(null);
      await carregarDepartamentos();
      mostrarFeedback("sucesso", "Departamento atualizado com sucesso.");
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message || "Erro ao atualizar departamento"
      );
    } finally {
      setSalvandoId(null);
    }
  }

  async function confirmarExclusaoDepartamento() {
    if (!departamentoParaExcluir) return;

    try {
      setExcluindoId(departamentoParaExcluir.id);

      const res = await fetch(`/api/departamento/${departamentoParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir departamento");
      }

      setDepartamentoParaExcluir(null);
      await carregarDepartamentos();
      mostrarFeedback("sucesso", "Departamento excluído com sucesso.");
    } catch (error: any) {
      mostrarFeedback(
        "erro",
        error?.message || "Erro ao excluir departamento"
      );
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarDepartamentos();
  }, []);

  return (
    <>
      <div className="max-w-4xl space-y-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackTipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}

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

          <button
            disabled={criando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {criando ? "Criando..." : "Criar departamento"}
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
                      disabled={salvandoId === d.id}
                      className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                    >
                      {salvandoId === d.id ? "Salvando..." : "Salvar"}
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
                      onClick={() => setDepartamentoParaExcluir(d)}
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

      {departamentoParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tem certeza que deseja excluir o departamento{" "}
                  <strong>"{departamentoParaExcluir.nome}"</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDepartamentoParaExcluir(null)}
                disabled={excluindoId === departamentoParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoDepartamento}
                disabled={excluindoId === departamentoParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === departamentoParaExcluir.id
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(AdminDepartamentosPage, ["admin"]);