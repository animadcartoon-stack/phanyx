"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  cidade?: string | null;
  estado?: string | null;
  endereco?: string | null;
  ativo: boolean;
  createdAt?: string;
};

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminPolosPage() {
  const [polos, setPolos] = useState<Polo[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [criando, setCriando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  async function carregarPolos() {
    try {
      setCarregando(true);

      const res = await fetch("/api/admin/polos", {
        credentials: "include",
      });

      const data = await res.json();
      setPolos(Array.isArray(data) ? data : []);
    } catch {
      setPolos([]);
      setFeedback("Erro ao carregar polos.");
      setFeedbackTipo("erro");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPolos();
  }, []);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  async function criarPolo(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/admin/polos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nome,
          codigo,
          descricao,
          cidade,
          estado,
          endereco,
          ativo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar polo");
      }

      setNome("");
      setCodigo("");
      setDescricao("");
      setCidade("");
      setEstado("");
      setEndereco("");
      setAtivo(true);

      await carregarPolos();
      setFeedback("Polo criado com sucesso.");
      setFeedbackTipo("sucesso");
    } catch (error: any) {
      setFeedback(error?.message || "Erro ao criar polo");
      setFeedbackTipo("erro");
    } finally {
      setCriando(false);
    }
  }

  const polosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return polos;

    return polos.filter((polo) => {
      return (
        String(polo.nome || "").toLowerCase().includes(termo) ||
        String(polo.codigo || "").toLowerCase().includes(termo) ||
        String(polo.cidade || "").toLowerCase().includes(termo) ||
        String(polo.estado || "").toLowerCase().includes(termo) ||
        String(polo.endereco || "").toLowerCase().includes(termo) ||
        String(polo.descricao || "").toLowerCase().includes(termo)
      );
    });
  }, [polos, busca]);

  return (
    <div className="max-w-6xl space-y-6">
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

      <div>
        <h1 className="text-2xl font-bold">🏢 Polos</h1>
        <p className="mt-1 text-gray-600">
          Cadastre os polos, unidades, campi ou filiais da sua instituição.
        </p>
      </div>

      <form
        onSubmit={criarPolo}
        className="rounded-2xl border bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-lg font-semibold">Novo polo</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nome do polo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
            required
          />

          <input
            type="text"
            placeholder="Código do polo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          />

          <input
            type="text"
            placeholder="Cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          />

          <input
            type="text"
            placeholder="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          />

          <input
            type="text"
            placeholder="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 md:col-span-2"
          />

          <textarea
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="min-h-[100px] w-full rounded-xl border px-3 py-2 md:col-span-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          Polo ativo
        </label>

        <button
          type="submit"
          disabled={criando}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {criando ? "Criando..." : "Criar polo"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Lista de polos</h2>

          <input
            type="text"
            placeholder="Buscar por nome, código, cidade, estado..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 md:w-[420px]"
          />
        </div>

        {carregando ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
            Carregando polos...
          </div>
        ) : polosFiltrados.length === 0 ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
            Nenhum polo encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {polosFiltrados.map((polo) => (
              <div
                key={polo.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">{polo.nome}</p>
                    <p className="text-sm text-slate-600">
                      Código: {polo.codigo || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Cidade/Estado:{" "}
                      {[polo.cidade, polo.estado].filter(Boolean).join(" - ") || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Endereço: {polo.endereco || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Descrição: {polo.descricao || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Status: {polo.ativo ? "Ativo" : "Inativo"}
                    </p>
                  </div>

                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      polo.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {polo.ativo ? "Ativo" : "Inativo"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminPolosPage, ["admin"]);