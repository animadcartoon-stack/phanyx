"use client";

import { useEffect, useState } from "react";

type UsuarioChat = {
  id: number;
  nome: string;
  email: string;
  role: string;
};

type ConversaAberta = {
  id: number;
  nome: string;
  role: string;
};

type MensagemChat = {
  id: number;
  conversaId: number;
  autorId: number;
  texto: string | null;
  tipo: string;
  criadoEm: string;
  anexos?: any[];
};

export default function ChatGlobalWidget() {
  const [aberto, setAberto] = useState(false);
  const [modoNovaConversa, setModoNovaConversa] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioChat[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [conversaAberta, setConversaAberta] =
    useState<ConversaAberta | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [textoMensagem, setTextoMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [meuUsuarioId, setMeuUsuarioId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!conversaAberta) return;

    carregarMensagens(conversaAberta.id);

    const intervalo = setInterval(() => {
      carregarMensagens(conversaAberta.id);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [conversaAberta]);

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

  async function abrirConversa(usuario: UsuarioChat) {
    try {
      const res = await fetch("/api/chat/conversas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuarioId: usuario.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setConversaAberta({
        id: data.conversa.id,
        nome: usuario.nome,
        role: usuario.role,
      });

      setModoNovaConversa(false);
    } catch (error) {
      console.error("Erro ao abrir conversa:", error);
    }
  }

  async function carregarMensagens(conversaId: number) {
    try {
      const res = await fetch(`/api/chat/conversas/${conversaId}/mensagens`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setMensagens(data.mensagens || []);

      if (data.usuarioId) {
        setMeuUsuarioId(data.usuarioId);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }

  async function enviarMensagem() {
    if (!conversaAberta) return;

    const texto = textoMensagem.trim();

    if (!texto || enviando) return;

    setEnviando(true);

    try {
      const res = await fetch(
        `/api/chat/conversas/${conversaAberta.id}/mensagens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ texto }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setTextoMensagem("");
      await carregarMensagens(conversaAberta.id);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setEnviando(false);
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
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
          <div className="bg-blue-600 px-4 py-3 text-white">
            <p className="font-bold">Chat interno PHANYX</p>
            <p className="text-xs text-blue-100">Você está online</p>
          </div>

          <div className="border-b border-slate-700 bg-slate-900 p-3">
            <button
              type="button"
              onClick={carregarUsuarios}
              className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Nova conversa
            </button>
          </div>

          {!modoNovaConversa && !conversaAberta && (
            <div className="p-4 text-sm text-slate-300">
              Nenhuma conversa aberta ainda.
            </div>
          )}

          {!modoNovaConversa && conversaAberta && (
            <div className="flex h-80 flex-col">
              <div className="border-b border-slate-700 bg-slate-900 px-4 py-3">
                <div className="flex items-start justify-between">
  <div>
    <button
      type="button"
      onClick={() => {
        setConversaAberta(null);
        setModoNovaConversa(true);
      }}
      className="mb-1 text-xs text-blue-400 hover:text-blue-300"
    >
      ← Voltar
    </button>

    <p className="text-sm font-bold text-white">
      {conversaAberta.nome}
    </p>

    <p className="text-xs text-slate-400">
      {nomeRole(conversaAberta.role)}
    </p>
  </div>

  <button
    type="button"
    onClick={() => {
      setConversaAberta(null);
      setModoNovaConversa(false);
      setAberto(false);
    }}
    className="text-slate-400 hover:text-white"
  >
    ✕
  </button>
</div>
                <p className="text-xs text-slate-400">
                  {nomeRole(conversaAberta.role)}
                </p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
                {mensagens.length === 0 && (
                  <p className="text-slate-400">
                    Nenhuma mensagem ainda. Envie a primeira mensagem.
                  </p>
                )}

                {mensagens.map((mensagem) => {
                  const minha = mensagem.autorId === meuUsuarioId;

                  return (
                    <div
                      key={mensagem.id}
                      className={`flex ${minha ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                          minha
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-100"
                        }`}
                      >
                        {mensagem.texto}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-700 bg-slate-900 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textoMensagem}
                    onChange={(e) => setTextoMensagem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        enviarMensagem();
                      }
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={enviarMensagem}
                    disabled={enviando || !textoMensagem.trim()}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {modoNovaConversa && (
            <div className="max-h-80 overflow-y-auto p-3">
              {!carregandoUsuarios &&
                usuarios.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    onClick={() => abrirConversa(usuario)}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:bg-blue-950"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-lg">
                      👤
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {usuario.nome}
                      </p>
                      <p className="text-xs text-slate-400">
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