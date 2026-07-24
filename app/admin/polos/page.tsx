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

type FeedbackTipo = "sucesso" | "aviso" | "erro" | "";

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
const [salvandoEdicao, setSalvandoEdicao] = useState(false);

function iniciarEdicao(polo: Polo) {
  setEditandoId(polo.id);
  setEditNome(polo.nome || "");
  setEditCodigo(polo.codigo || "");
  setEditCnpj(polo.cnpj || "");
  setEditCidade(polo.cidade || "");
  setEditEstado(polo.estado || "");
  setEditEndereco(polo.endereco || "");
  setEditDescricao(polo.descricao || "");
}

async function salvarEdicao() {
  if (!editandoId) return;

  try {
    setSalvandoEdicao(true);

    const res = await fetch("/api/admin/polos", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id: editandoId,
        nome: editNome,
        codigo: editCodigo,
        cnpj: editCnpj,
        cidade: editCidade,
        estado: editEstado,
        endereco: editEndereco,
        descricao: editDescricao,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao atualizar polo");
    }

    setEditandoId(null);

    await carregarPolos();

    setFeedback("Polo atualizado com sucesso.");
    setFeedbackTipo("sucesso");
  } catch (error: unknown) {
    setFeedback(
      error instanceof Error
        ? error.message
        : "Erro ao atualizar polo."
    );
    setFeedbackTipo("erro");
  } finally {
    setSalvandoEdicao(false);
  }
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
      await carregarPolos();

setFeedback(
  data?.aviso || "Polo criado com sucesso."
);

setFeedbackTipo(
  data?.aviso ? "aviso" : "sucesso"
);
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
    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200"
    : feedbackTipo === "aviso"
      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
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

        <div className="flex gap-2">
          <button
  type="button"
  onClick={salvarEdicao}
  disabled={salvandoEdicao}
  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {salvandoEdicao ? "Salvando..." : "Salvar"}
</button>

          <button
  type="button"
  onClick={() => setEditandoId(null)}
  disabled={salvandoEdicao}
  className="rounded-xl bg-gray-400 px-4 py-2 text-sm text-white hover:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
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
            Status: {polo.ativo ? "Ativo" : "Aguardando ativação"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4">
  <button
    type="button"
    onClick={() => iniciarEdicao(polo)}
    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
  >
    Editar dados
  </button>

  {!polo.ativo && (
    <span className="text-xs text-amber-700 dark:text-amber-300">
      Ativação sujeita ao limite e à contratação do plano.
    </span>
  )}
</div>
</div>

<div
  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
    polo.ativo
      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
      : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
  }`}
>
  {polo.ativo ? "Ativo" : "Aguardando ativação"}
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