"use client";

import { useEffect, useState } from "react";
import { PERMISSOES_PHANYX } from "@/lib/permissoes-phanyx";

export default function DepartamentoPermissoesPage({
  params,
}: {
  params: { id: string };
}) {
  const departamentoId = params.id;

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarPermissoes() {
    try {
      setErro("");

      const res = await fetch(
        `/api/admin/departamentos/${departamentoId}/permissoes`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar permissões.");
      }

      setSelecionadas(
        Array.isArray(data)
          ? data.filter((p) => p.ativo).map((p) => p.chave)
          : []
      );
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar permissões.");
    }
  }

  function alternar(chave: string) {
    setSelecionadas((atuais) =>
      atuais.includes(chave)
        ? atuais.filter((item) => item !== chave)
        : [...atuais, chave]
    );
  }

  async function salvar() {
    try {
      setLoading(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/admin/departamentos/${departamentoId}/permissoes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chaves: selecionadas }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar permissões.");
      }

      setMensagem("Permissões salvas com sucesso.");
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar permissões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPermissoes();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          🔐 Permissões do Departamento
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Defina quais áreas e funções os funcionários deste departamento poderão acessar.
        </p>
      </div>

      {mensagem && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-2">
          {PERMISSOES_PHANYX.map((permissao) => {
            const marcada = selecionadas.includes(permissao.chave);

            return (
              <button
                key={permissao.chave}
                type="button"
                onClick={() => alternar(permissao.chave)}
                className={`rounded-2xl border p-4 text-left transition ${
                  marcada
                    ? "border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                }`}
              >
                <div className="font-semibold">
                  {marcada ? "✅ " : "⬜ "}
                  {permissao.nome}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {permissao.chave}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={loading}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {loading ? "Salvando..." : "Salvar permissões"}
        </button>
      </div>
    </div>
  );
}