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

      setNotificacoes(
  (data.notificacoes || []).filter(
    (n: any) => !n.lida
  )
);
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
        <div className="mt-3 max-h-[420px] w-80 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
          <p className="mb-3 text-sm font-bold text-white">
            Notificações
          </p>

          {notificacoes.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhuma notificação.
            </p>
          )}

          {notificacoes.map((item) => (
            <button
  key={item.id}
  type="button"
 onClick={async () => {
  try {
    await fetch("/api/notificacoes", {
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
      atual.filter((n) => n.id !== item.id)
    );

    setTotalNaoLidas((atual) =>
      Math.max(0, atual - 1)
    );

    if (item.link?.includes("conversaId=")) {
  const params = new URLSearchParams(item.link.split("?")[1] || "");

  const conversaId = Number(params.get("conversaId"));
  <div className="mb-1 flex items-center gap-2">
  {!item.lida && (
    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
  )}

  <p className="font-semibold text-white">
    {item.titulo}
  </p>
</div>
  const remetenteNome =
    params.get("nome") ||
    item.titulo.replace("Nova mensagem de ", "") ||
    "Conversa";

  const remetenteRole =
    params.get("role") ||
    "CHAT";

  window.dispatchEvent(
    new CustomEvent("phanyx:abrir-chat", {
      detail: {
        conversaId,
        remetenteNome,
        remetenteRole,
      },
    })
  );

  setAberto(false);
  return;
}

    if (item.link) {
      window.location.href = item.link;
      return;
    }

    setAberto(false);
  } catch (error) {
    console.error(error);
  }
}}
  className="mb-2 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:bg-blue-950"
>
              <p className="font-semibold text-white">
                {item.titulo}
              </p>

              {item.descricao && (
                <p className="mt-1 text-xs text-slate-400">
                  {item.descricao}
                </p>
              )}
            </button>
          ))}

<div className="mt-3 border-t border-slate-800 pt-3">
  <button
    type="button"
    onClick={() => {
      setAberto(false);
      window.location.href = "/admin/notificacoes";
    }}
    className="w-full rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Ver todas as notificações →
  </button>
</div>

        </div>
      )}
    </div>
  );
}