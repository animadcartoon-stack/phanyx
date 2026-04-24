"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/components/auth/withAuth";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
  cnpj?: string | null;
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
  const [cnpj, setCnpj] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [criando, setCriando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

const [editandoId, setEditandoId] = useState<number | null>(null);
const [editNome, setEditNome] = useState("");
const [editCodigo, setEditCodigo] = useState("");
const [editCnpj, setEditCnpj] = useState("");
const [editCidade, setEditCidade] = useState("");
const [editEstado, setEditEstado] = useState("");
const [editEndereco, setEditEndereco] = useState("");
const [editDescricao, setEditDescricao] = useState("");
const [editAtivo, setEditAtivo] = useState(true);

function iniciarEdicao(polo: any) {
  setEditandoId(polo.id);
  setEditNome(polo.nome || "");
  setEditCodigo(polo.codigo || "");
  setEditCnpj(polo.cnpj || "");
  setEditCidade(polo.cidade || "");
  setEditEstado(polo.estado || "");
  setEditEndereco(polo.endereco || "");
  setEditDescricao(polo.descricao || "");
  setEditAtivo(polo.ativo);
}

async function salvarEdicao() {
  await fetch("/api/admin/polos", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: editandoId,
      nome: editNome,
      codigo: editCodigo,
      cnpj: editCnpj,
      cidade: editCidade,
      estado: editEstado,
      endereco: editEndereco,
      descricao: editDescricao,
      ativo: editAtivo,
    }),
  });

  setEditandoId(null);
  carregarPolos();
}

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
          cnpj,
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
      setCnpj("");
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
        String(polo.cnpj || "").toLowerCase().includes(termo) ||
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
  placeholder="CNPJ do polo"
  value={cnpj}
  onChange={(e) => setCnpj(e.target.value)}
  className="w-full rounded-xl border px-3 py-2"
/>

<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
</div>

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
    {editandoId === polo.id ? (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="Nome do polo"
          />

          <input
            value={editCodigo}
            onChange={(e) => setEditCodigo(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="Código do polo"
          />

          <input
            value={editCnpj}
            onChange={(e) => setEditCnpj(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="CNPJ do polo"
          />

          <input
            value={editCidade}
            onChange={(e) => setEditCidade(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="Cidade"
          />

          <input
            value={editEstado}
            onChange={(e) => setEditEstado(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="Estado"
          />

          <input
            value={editEndereco}
            onChange={(e) => setEditEndereco(e.target.value)}
            className="rounded-xl border px-3 py-2"
            placeholder="Endereço"
          />

          <textarea
            value={editDescricao}
            onChange={(e) => setEditDescricao(e.target.value)}
            className="min-h-[90px] rounded-xl border px-3 py-2 md:col-span-2"
            placeholder="Descrição"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={editAtivo}
            onChange={(e) => setEditAtivo(e.target.checked)}
          />
          Polo ativo
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={salvarEdicao}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white"
          >
            Salvar
          </button>

          <button
            type="button"
            onClick={() => setEditandoId(null)}
            className="rounded-xl bg-gray-400 px-4 py-2 text-sm text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">{polo.nome}</p>

          <p className="text-sm text-slate-600">
            Código: {polo.codigo || "-"}
          </p>

          <p className="text-sm text-slate-600">
            CNPJ: {polo.cnpj || "-"}
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

          <div className="mt-3 flex gap-4">
            <button
              type="button"
              onClick={() => iniciarEdicao(polo)}
              className="text-sm font-medium text-blue-600"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/polos", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    ...polo,
                    ativo: !polo.ativo,
                  }),
                });

                await carregarPolos();
              }}
              className="text-sm font-medium text-red-600"
            >
              {polo.ativo ? "Inativar" : "Ativar"}
            </button>
          </div>
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
    )}
  </div>
))}
          </div>
        )}
      </div>
    </div>

  );
}

export default withAuth(AdminPolosPage, ["admin"]);