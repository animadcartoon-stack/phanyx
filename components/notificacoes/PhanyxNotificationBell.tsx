"use client";

import { useEffect, useState } from "react";

type Notificacao = {
  id: number;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  link?: string | null;
  lida: boolean;
  criadoEm: string;
};

export default function PhanyxNotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);

  async function carregar() {
    try {
      const res = await fetch("/api/notificacoes", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) return;

      setNotificacoes(data.notificacoes || []);
      setTotalNaoLidas(data.totalNaoLidas || 0);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregar();

    const intervalo = setInterval(carregar, 10000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="fixed right-6 top-6 z-[9998]">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-xl text-white shadow-xl"
      >
        🔔

        {totalNaoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {totalNaoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="mt-3 w-80 rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
          <p className="mb-3 text-sm font-bold text-white">
            Notificações
          </p>

          {notificacoes.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhuma notificação.
            </p>
          )}

          {notificacoes.map((item) => (
            <div
              key={item.id}
              className="mb-2 rounded-xl border border-slate-800 bg-slate-900 p-3"
            >
              <p className="font-semibold text-white">
                {item.titulo}
              </p>

              {item.descricao && (
                <p className="mt-1 text-xs text-slate-400">
                  {item.descricao}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}