"use client";

import { useEffect, useState } from "react";

type UsuarioChat = {
  id: number;
  nome: string;
  email: string;
  role: string;
};

export default function ChatGlobalWidget() {
  const [aberto, setAberto] = useState(false);
  const [modoNovaConversa, setModoNovaConversa] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioChat[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

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

  async function carregarUsuarios() {
    setModoNovaConversa(true);
    setCarregandoUsuarios(true);

    try {
      const res = await fetch("/api/chat/usuarios", {
        credentials: "include",
      });

      const data = await res.json();

      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error("Erro ao carregar usuários do chat:", error);
      setUsuarios([]);
    } finally {
      setCarregandoUsuarios(false);
    }
  }

  function nomeRole(role: string) {
    if (role === "ADMIN") return "Admin";
    if (role === "PROFESSOR") return "Professor";
    if (role === "ALUNO") return "Aluno";
    if (role === "SECRETARIA") return "Secretaria";
    if (role === "COORDENADOR") return "Coordenação";
    if (role === "FINANCEIRO") return "Financeiro";
    if (role === "SUPORTE") return "Suporte";
    if (role === "SUPER_ADMIN") return "Master PHANYX";
    return role;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {aberto && (
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="bg-blue-600 px-4 py-3 text-white">
            <p className="font-bold">Chat interno PHANYX</p>
            <p className="text-xs text-blue-100">Você está online</p>
          </div>

          <div className="border-b bg-slate-50 p-3">
            <button
              type="button"
              onClick={carregarUsuarios}
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Nova conversa
            </button>
          </div>

          {!modoNovaConversa && (
            <div className="p-4 text-sm text-slate-600">
              Nenhuma conversa aberta ainda.
            </div>
          )}

          {modoNovaConversa && (
            <div className="max-h-80 overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">
                  Iniciar conversa
                </p>

                <button
                  type="button"
                  onClick={() => setModoNovaConversa(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Voltar
                </button>
              </div>

              {carregandoUsuarios && (
                <p className="py-4 text-sm text-slate-500">
                  Carregando usuários...
                </p>
              )}

              {!carregandoUsuarios && usuarios.length === 0 && (
                <p className="py-4 text-sm text-slate-500">
                  Nenhum usuário encontrado.
                </p>
              )}

              {!carregandoUsuarios &&
                usuarios.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    className="mb-2 flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left hover:bg-blue-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg">
                      👤
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {usuario.nome}
                      </p>
                      <p className="text-xs text-slate-500">
                        {nomeRole(usuario.role)}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}
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