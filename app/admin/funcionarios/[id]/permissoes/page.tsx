"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PERMISSOES_PHANYX } from "@/lib/permissoes-phanyx";

type PermissaoSalva = {
  chave: string;
  ativo: boolean;
};

type FuncionarioPermissoesPayload = {
  funcionario?: {
    id: number;
    nome: string;
    cargo?: string | null;
    departamento?: {
      id: number;
      nome: string;
    } | null;
  };
  permissoesIndividuais?: PermissaoSalva[];
  permissoesDepartamento?: PermissaoSalva[];
};

export default function FuncionarioPermissoesPage({
  params,
}: {
  params: { id: string };
}) {
  const funcionarioId = params.id;

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [herdadasDepartamento, setHerdadasDepartamento] = useState<string[]>(
    []
  );
  const [funcionarioNome, setFuncionarioNome] = useState("");
  const [funcionarioCargo, setFuncionarioCargo] = useState("");
  const [departamentoNome, setDepartamentoNome] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarPermissoes() {
    try {
      setCarregando(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/permissoes`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const data: FuncionarioPermissoesPayload & { error?: string } =
        await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar permissões.");
      }

      setFuncionarioNome(data?.funcionario?.nome || "");
      setFuncionarioCargo(data?.funcionario?.cargo || "");
      setDepartamentoNome(data?.funcionario?.departamento?.nome || "");

      setSelecionadas(
        Array.isArray(data?.permissoesIndividuais)
          ? data.permissoesIndividuais
              .filter((p) => p.ativo)
              .map((p) => p.chave)
          : []
      );

      setHerdadasDepartamento(
        Array.isArray(data?.permissoesDepartamento)
          ? data.permissoesDepartamento
              .filter((p) => p.ativo)
              .map((p) => p.chave)
          : []
      );
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar permissões.");
    } finally {
      setCarregando(false);
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
      setSalvando(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/admin/funcionarios/${funcionarioId}/permissoes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ chaves: selecionadas }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar permissões.");
      }

      setMensagem("Permissões individuais salvas com sucesso.");
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar permissões.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    carregarPermissoes();
  }, []);

  return (
    <div className="phanyx-funcionario-permissoes-page mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/funcionarios"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          ← Voltar para Funcionários
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          🔐 Permissões individuais do funcionário
        </h1>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Libere permissões extras somente para este funcionário, sem alterar as
          permissões do departamento.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {carregando ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Carregando dados do funcionário...
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Funcionário
              </p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {funcionarioNome || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cargo
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {funcionarioCargo || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Departamento
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {departamentoNome || "Sem departamento"}
              </p>
            </div>
          </div>
        )}
      </div>

      {mensagem && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <strong>Como funciona:</strong> as permissões herdadas do departamento
          continuam valendo. Aqui você marca apenas permissões extras para este
          funcionário.
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {PERMISSOES_PHANYX.map((permissao) => {
            const marcadaIndividual = selecionadas.includes(permissao.chave);
            const herdada = herdadasDepartamento.includes(permissao.chave);

            return (
              <button
  key={permissao.chave}
  type="button"
  onClick={() => alternar(permissao.chave)}
  className={`phanyx-permissao-funcionario-card ${
    marcadaIndividual
      ? "individual"
      : herdada
      ? "herdada"
      : "inativa"
  }`}
>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {marcadaIndividual ? "✅ " : herdada ? "🟢 " : "⬜ "}
                      {permissao.nome}
                    </div>

                    <div className="mt-1 text-xs opacity-80">
                      {permissao.chave}
                    </div>
                  </div>

                  {herdada && !marcadaIndividual && (
  <span className="phanyx-permissao-funcionario-badge herdada">
    Herdada
  </span>
)}

                  {marcadaIndividual && (
  <span className="phanyx-permissao-funcionario-badge individual">
    Individual
  </span>
)}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={salvar}
          disabled={salvando || carregando}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {salvando ? "Salvando..." : "Salvar permissões individuais"}
        </button>
      </div>
    </div>
  );
}