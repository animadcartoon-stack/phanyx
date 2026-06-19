"use client";

import { useEffect, useMemo, useState } from "react";

type Notificacao = {
  id: number;
  tipo: string;
  categoria?: string | null;
  titulo: string;
  descricao?: string | null;
  link?: string | null;
  quantidade?: number;
  lida: boolean;
  criadoEm: string;
};

function dataHoraBR(data: string) {
  return new Date(data).toLocaleString("pt-BR");
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("TODAS");

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/notificacoes", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Erro ao carregar notificações."
        );
      }

      setNotificacoes(Array.isArray(data?.notificacoes) ? data.notificacoes : []);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }

  async function marcarComoLida(id: number) {
    try {
      const res = await fetch("/api/admin/notificacoes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id,
          lida: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Erro ao atualizar notificação."
        );
      }

      setNotificacoes((atual) =>
        atual.map((item) =>
          item.id === id
            ? { ...item, lida: true }
            : item
        )
      );
    } catch (error: any) {
      setErro(error?.message || "Erro ao atualizar.");
    }
  }

  async function abrirNotificacao(item: Notificacao) {
  try {
    await fetch("/api/admin/notificacoes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id: item.id,
        lida: true,
      }),
    });

    setNotificacoes((atual) =>
      atual.map((n) =>
        n.id === item.id ? { ...n, lida: true } : n
      )
    );

    if (item.link) {
      window.location.href = item.link;
    }
  } catch (error: any) {
    setErro(error?.message || "Erro ao abrir notificação.");
  }
}

  useEffect(() => {
    carregar();
  }, []);

  const naoLidas = useMemo(
    () => notificacoes.filter((n) => !n.lida).length,
    [notificacoes]
  );

  const categorias = useMemo(() => {
    const unicas = Array.from(
      new Set(
        notificacoes
          .map((n) => n.categoria)
          .filter(Boolean)
      )
    );

    return unicas;
  }, [notificacoes]);

  const notificacoesFiltradas = useMemo(() => {
  if (filtro === "TODAS") return notificacoes;

  if (filtro === "NAO_LIDAS") {
    return notificacoes.filter((n) => !n.lida);
  }

  return notificacoes.filter(
    (n) =>
      String(n.categoria || n.tipo || "").toUpperCase() === filtro
  );
}, [notificacoes, filtro]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-blue-600 dark:text-blue-400">
          PHANYX
        </p>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Central de Notificações
        </h1>

        <p className="text-sm text-slate-700 dark:text-slate-300">
          Todas as notificações do sistema em um único lugar.
        </p>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {erro}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            Total
          </div>

          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {notificacoes.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            Não lidas
          </div>

          <div className="mt-2 text-3xl font-bold text-amber-600">
            {naoLidas}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            Categorias
          </div>

          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {categorias.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Notificações
        </h2>

<div className="mt-4 flex flex-wrap gap-2">
  {[
    { chave: "TODAS", label: "Todas" },
    { chave: "NAO_LIDAS", label: "Não lidas" },
    { chave: "RH", label: "RH" },
    { chave: "FINANCEIRO", label: "Financeiro" },
    { chave: "ACADEMICO", label: "Acadêmico" },
    { chave: "OUVIDORIA", label: "Ouvidoria" },
    { chave: "CHAT", label: "Chat" },
    { chave: "BIBLIOTECA", label: "Biblioteca" },
  ].map((item) => (
    <button
      key={item.chave}
      type="button"
      onClick={() => setFiltro(item.chave)}
      className={[
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        filtro === item.chave
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200",
      ].join(" ")}
    >
      {item.label}
    </button>
  ))}
</div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-left">Título</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-slate-600 dark:text-slate-300"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : notificacoesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-slate-600 dark:text-slate-300"
                  >
                    Nenhuma notificação encontrada.
                  </td>
                </tr>
              ) : (
                notificacoesFiltradas.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-3">
                      {item.categoria || item.tipo}
                    </td>

                    <td className="p-3 font-semibold">
                      {item.titulo}
                    </td>

                    <td className="p-3">
                      {item.descricao || "-"}
                    </td>

                    <td className="p-3">
                      {dataHoraBR(item.criadoEm)}
                    </td>

                    <td className="p-3">
                      {item.lida ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Lida
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Não lida
                        </span>
                      )}
                    </td>

                    <td className="p-3">
  <button
    onClick={() => abrirNotificacao(item)}
    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Abrir
  </button>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}