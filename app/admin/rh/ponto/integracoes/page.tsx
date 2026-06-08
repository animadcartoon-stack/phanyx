"use client";

import { useEffect, useState } from "react";

type Integracao = {
  id: number;
  nome: string;
  provedor: string;
  status: string;
  ativo: boolean;
  baseUrl?: string | null;
};

export default function IntegracoesPontoPage() {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);

  const [nome, setNome] = useState("");
  const [provedor, setProvedor] = useState("API_GENERICA");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [token, setToken] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregarIntegracoes() {
    const res = await fetch(
      "/api/admin/rh/ponto/integracoes",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const data = await res.json();

    setIntegracoes(Array.isArray(data) ? data : []);
  }

  async function salvar() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        "/api/admin/rh/ponto/integracoes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            nome,
            provedor,
            baseUrl,
            apiKey,
            usuario,
            senha,
            token,
            observacoes,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar.");
      }

      setSucesso("Integração salva com sucesso.");

      setNome("");
      setBaseUrl("");
      setApiKey("");
      setUsuario("");
      setSenha("");
      setToken("");
      setObservacoes("");

      await carregarIntegracoes();
    } catch (error: any) {
      setErro(error?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarIntegracoes();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          🔗 Integrações de Ponto
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Conecte relógios de ponto e sistemas externos ao PHANYX.
        </p>
      </div>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
          {sucesso}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-bold">
          Nova Integração
        </h2>

        <div className="grid gap-4 md:grid-cols-2">

          <input
            placeholder="Nome da integração"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
          />

          <select
            value={provedor}
            onChange={(e) => setProvedor(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="API_GENERICA">API Genérica</option>
            <option value="CONTROL_ID">Control iD</option>
            <option value="TOPDATA">TopData</option>
            <option value="HENRY">Henry</option>
            <option value="AHGORA">Ahgora</option>
            <option value="OUTRO">Outro</option>
          </select>

          <input
            placeholder="Base URL"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
          />

          <input
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
          />

          <input
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
          />

          <input
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
          />

          <input
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
          />
        </div>

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="mt-4 min-h-[120px] w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"
        />

        <button
          onClick={salvar}
          disabled={loading}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Salvando..." : "Salvar Integração"}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-bold">
          Integrações Configuradas
        </h2>

        <div className="space-y-3">
          {integracoes.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="font-semibold">
                {item.nome}
              </div>

              <div className="text-sm text-slate-500">
                {item.provedor}
              </div>

              <div className="text-sm text-slate-500">
                {item.baseUrl || "-"}
              </div>

              <div className="mt-2">
                Status: {item.status}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">

  <button
    type="button"
    onClick={async () => {
      try {
        const res = await fetch(
          `/api/admin/rh/ponto/integracoes/${item.id}/testar`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setErro(data.error || "Erro ao testar conexão.");
          return;
        }

        setSucesso("Conexão testada com sucesso.");

        await carregarIntegracoes();
      } catch {
        setErro("Erro ao testar conexão.");
      }
    }}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    🔍 Testar Conexão
  </button>

<button
  type="button"
  onClick={async () => {
    try {
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/admin/rh/ponto/integracoes/${item.id}/sincronizar`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao sincronizar.");
        return;
      }

      setSucesso(
        `Sincronização concluída. ${data.registrosImportados || 0} registros importados.`
      );

      await carregarIntegracoes();
    } catch {
      setErro("Erro ao sincronizar.");
    }
  }}
  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
>
  🔄 Sincronizar Marcações
</button>

</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}