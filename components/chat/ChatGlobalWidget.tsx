"use client";

import { useEffect, useState } from "react";

export default function ChatGlobalWidget() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    async function atualizarPresenca() {
      await fetch("/api/chat/presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "ONLINE" }),
      });
    }

    atualizarPresenca();
    const intervalo = setInterval(atualizarPresenca, 30000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {aberto && (
        <div className="mb-3 w-80 rounded-2xl border bg-white shadow-2xl">
          <div className="rounded-t-2xl bg-blue-600 px-4 py-3 text-white">
            <p className="font-bold">Chat interno PHANYX</p>
            <p className="text-xs text-blue-100">Você está online</p>
          </div>

          <div className="p-4 text-sm text-slate-600">
            Nenhuma conversa aberta ainda.
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-2xl hover:bg-blue-700"
      >
        💬
      </button>
    </div>
  );
}