"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Notificacao = {
  id: number;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  link?: string | null;
  lida: boolean;
  criadoEm: string;
};

export default function PhanyxNotificationBell({ modoSuporte = false, mostrarLinkTodas = true }: { modoSuporte?: boolean; mostrarLinkTodas?: boolean } = {}) {
  const t = useTranslations("AdminNavigation");
  const tCommon = useTranslations("Common");
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
    <div className={`relative z-60 max-lg:top-auto! lg:fixed lg:right-6 lg:z-[9998] ${modoSuporte ? "top-48 md:top-32" : "top-6"}`}>
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        aria-label={t("notifications")}
        aria-expanded={aberto}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-xl text-white shadow-lg lg:h-12 lg:w-12 lg:shadow-xl"
      >
        🔔

        {totalNaoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {totalNaoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-3 max-h-[min(420px,55dvh)] w-[min(20rem,calc(100vw-4.75rem))] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-2xl lg:w-80">
          <p className="mb-3 text-sm font-bold text-white">
            {t("notifications")}
          </p>

          {notificacoes.length === 0 && (
            <p className="text-sm text-slate-400">
              {tCommon("portalNotificationsEmpty")}
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

  const nomePeloTitulo = item.titulo?.startsWith("Nova mensagem de ")
    ? item.titulo.replace("Nova mensagem de ", "")
    : "";

  const nomePelaDescricao = item.descricao?.includes(":")
    ? item.descricao.split(":")[0]
    : item.descricao?.replace(" enviou uma mensagem.", "");

  const remetenteNome =
    params.get("nome") ||
    nomePeloTitulo ||
    nomePelaDescricao ||
    "Conversa";

  const remetenteRole =
    params.get("role") ||
    item.tipo ||
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
              <div className="mb-1 flex items-center gap-2">
  {!item.lida && (
    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
  )}

  <p className="font-semibold text-white">
    {item.titulo}
  </p>
</div>

              {item.descricao && (
                <p className="mt-1 text-xs text-slate-400">
                  {item.descricao}
                </p>
              )}
            </button>
          ))}

{mostrarLinkTodas && (<div className="mt-3 border-t border-slate-800 pt-3">
  <button
    type="button"
    onClick={() => {
      setAberto(false);
      window.location.href = "/admin/notificacoes";
    }}
    className="w-full rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    {t("viewAllNotifications")} →
  </button>
</div>)}

        </div>
      )}
    </div>
  );
}
