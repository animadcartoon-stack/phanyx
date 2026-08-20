"use client";

import { useEffect, useRef, useState } from "react";

type UsuarioChat = {
  id: number;
  nome: string;
  email: string;
  role: string;
  online?: boolean;
};

type TurmaChat = {
  id: number;
  nome: string;
  semestre?: string | null;
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

const EMOJIS_RAPIDOS = Array.from(
  new Set(
    `
    😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘
    😋 😛 😜 🤪 🤨 🧐 🤓 😎 🤩 🥳 😏 😒 😞 😔 😟 😕
    🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶
    😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🫡 🫠

    👍 👎 👌 🤌 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️
    ✋ 🤚 🖐️ 🖖 👋 🤝 👏 🙌 🫶 🙏 💪

    ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓
    💗 💖 💘 💝

    🎉 🎊 🎈 🎁 🎂 🥂 ✨ ⭐ 🌟 💫 🔥 ✅ ❌ ⚠️
    💯 🚀 💡 📌 📎 📝 📚 🎓 💻 📱 📅 ⏰ 🔔 📣
    🎵 🎬 🎨 📷

    🌞 🌙 🌈 🌸 🌻 🌹 🍀 🌳 🐶 🐱 🦋 🍎 🍓 🍕
    🍔 🍰 ☕ 🏆 🥇 ⚽ 🏀 🚗 ✈️ 🏠
    `
      .trim()
      .split(/\s+/)
  )
);

const GIFS_RAPIDOS = [
  "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  "https://media.giphy.com/media/IwAZ6dvvvaTtdI8SD5/giphy.gif",
  "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif",
  "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif",
  "https://media.giphy.com/media/FpR7QUejI3uW1z5vXm/giphy.gif",
  "https://media.giphy.com/media/OybPkol4N2zkXfopZn/giphy.gif",
  "https://media.giphy.com/media/3ohjV6sH93mHU45AHK/giphy.gif",
  "https://media.giphy.com/media/TiSnPeQUmEZ4dyjpHa/giphy.gif",
  "https://media.giphy.com/media/ekqaUtvIzvtsijg3p9/giphy.gif",
  "https://media.giphy.com/media/dyFrmQPBobmx69JiHZ/giphy.gif",
  "https://media.giphy.com/media/q4YtZsDOUUzfoLYjFQ/giphy.gif",
  "https://media.giphy.com/media/z5W8pA96qnpaIWbQNt/giphy.gif",
  "https://media.giphy.com/media/Ov09jGgEThFKpxZ9eC/giphy.gif",
  "https://media.giphy.com/media/5xtDarmwsuR9sDRObyU/giphy.gif",
  "https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif",
];

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

  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mostrarGifs, setMostrarGifs] = useState(false);

  useEffect(() => {
    setMostrarGifs(false);
    setMostrarEmojis(false);
  }, [aberto, conversaAberta?.id, modoNovaConversa]);

  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const [modoTurmas, setModoTurmas] = useState(false);
  const [turmasChat, setTurmasChat] = useState<TurmaChat[]>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  const [usuarioRole, setUsuarioRole] = useState<string>("");

  const [chatMaximizado, setChatMaximizado] = useState(false);

  const [chatTamanho, setChatTamanho] = useState({
    largura: 320,
    altura: 560,
  });

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [chatPosicao, setChatPosicao] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const chatTamanhoRestauradoRef = useRef({
    largura: 320,
    altura: 560,
  });

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
    function abrirChatPelaNotificacao(event: any) {
      const conversaId = Number(event.detail?.conversaId);

      setAberto(true);
      setChatMaximizado(false);
      setModoNovaConversa(false);
      setModoTurmas(false);
      setMostrarEmojis(false);
      setMostrarGifs(false);

      if (!Number.isFinite(conversaId) || conversaId <= 0) {
        setConversaAberta(null);
        setMensagens([]);
        return;
      }

      setConversaAberta({
        id: conversaId,
        nome: event.detail?.remetenteNome || `Conversa #${conversaId}`,
        role: event.detail?.remetenteRole || "",
      });

      carregarMensagens(conversaId);
    }

    window.addEventListener("phanyx:abrir-chat", abrirChatPelaNotificacao);

    return () => {
      window.removeEventListener("phanyx:abrir-chat", abrirChatPelaNotificacao);
    };
  }, []);


  useEffect(() => {
    if (!conversaAberta) return;

    carregarMensagens(conversaAberta.id);

    const intervalo = setInterval(() => {
      carregarMensagens(conversaAberta.id);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [conversaAberta]);

  function iniciarArrasteChat(e: React.MouseEvent<HTMLDivElement>) {
    if (chatMaximizado || e.button !== 0) return;

    const elementoClicado = e.target as HTMLElement;

    if (elementoClicado.closest("button")) return;

    const container = chatContainerRef.current;

    if (!container) return;

    e.preventDefault();

    const retangulo = container.getBoundingClientRect();
    const deslocamentoX = e.clientX - retangulo.left;
    const deslocamentoY = e.clientY - retangulo.top;

    const userSelectAnterior = document.body.style.userSelect;
    const cursorAnterior = document.body.style.cursor;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    setChatPosicao({
      x: retangulo.left,
      y: retangulo.top,
    });

    function mover(ev: MouseEvent) {
      const margem = 8;
      const larguraContainer = container.offsetWidth;
      const alturaContainer = container.offsetHeight;

      const limiteX = Math.max(
        margem,
        window.innerWidth - larguraContainer - margem
      );

      const limiteY = Math.max(
        margem,
        window.innerHeight - alturaContainer - margem
      );

      const x = Math.min(
        Math.max(margem, ev.clientX - deslocamentoX),
        limiteX
      );

      const y = Math.min(
        Math.max(margem, ev.clientY - deslocamentoY),
        limiteY
      );

      setChatPosicao({ x, y });
    }

    function soltar() {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);

      document.body.style.userSelect = userSelectAnterior;
      document.body.style.cursor = cursorAnterior;
    }

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function reposicionarChatNoPadrao() {
    if (chatMaximizado) {
      setChatTamanho(chatTamanhoRestauradoRef.current);
    }

    setChatMaximizado(false);
    setChatPosicao(null);
  }

  function iniciarRedimensionamento(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    const inicioX = e.clientX;
    const inicioY = e.clientY;
    const larguraInicial = chatTamanho.largura;
    const alturaInicial = chatTamanho.altura;

    function mover(ev: MouseEvent) {
      const novaLargura = Math.max(320, larguraInicial - (ev.clientX - inicioX));
      const novaAltura = Math.max(420, alturaInicial - (ev.clientY - inicioY));

      setChatTamanho({
        largura: Math.min(novaLargura, window.innerWidth - 40),
        altura: Math.min(novaAltura, window.innerHeight - 80),
      });
    }

    function soltar() {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    }

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function iniciarRedimensionamentoAltura(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    const inicioY = e.clientY;
    const alturaInicial = chatTamanho.altura;

    function mover(ev: MouseEvent) {
      const novaAltura = Math.max(420, alturaInicial - (ev.clientY - inicioY));

      setChatTamanho((atual) => ({
        ...atual,
        altura: Math.min(novaAltura, window.innerHeight - 80),
      }));
    }

    function soltar() {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    }

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  async function carregarUsuarios() {
    setConversaAberta(null);
    setMensagens([]);
    setModoNovaConversa(true);
    setCarregandoUsuarios(true);

    try {
      const res = await fetch("/api/chat/usuarios", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        setUsuarios([]);
        return;
      }

      setUsuarios(data.usuarios || []);
      setUsuarioRole(data.usuarioRole || "");
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

  async function carregarTurmasChat() {
    setModoTurmas(true);
    setCarregandoTurmas(true);

    try {
      const res = await fetch("/api/chat/turmas", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        setTurmasChat([]);
        return;
      }

      setTurmasChat(data.turmas || []);
    } catch (error) {
      console.error("Erro ao carregar turmas do chat:", error);
      setTurmasChat([]);
    } finally {
      setCarregandoTurmas(false);
    }
  }

  async function abrirConversaTurma(turma: TurmaChat) {
    try {
      const res = await fetch("/api/chat/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ turmaId: turma.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setConversaAberta({
        id: data.conversa.id,
        nome: data.conversa.titulo || turma.nome,
        role: "GRUPO",
      });

      setModoNovaConversa(false);
      setModoTurmas(false);
      await carregarMensagens(data.conversa.id);
    } catch (error) {
      console.error("Erro ao abrir conversa da turma:", error);
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

  async function enviarArquivo(file: File | null) {
    if (!file || !conversaAberta || enviando) return;

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/chat/conversas/${conversaAberta.id}/anexos`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      await carregarMensagens(conversaAberta.id);
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    } finally {
      setEnviando(false);
    }
  }

  function adicionarEmoji(emoji: string) {
    setTextoMensagem((prev) => prev + emoji);
    setMostrarEmojis(false);
  }

  async function enviarGif(url: string) {
    if (!conversaAberta || enviando) return;

    setEnviando(true);

    try {
      const res = await fetch(
        `/api/chat/conversas/${conversaAberta.id}/mensagens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ texto: `[GIF]${url}` }),
        }
      );

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      setMostrarGifs(false);
      await carregarMensagens(conversaAberta.id);
    } catch (error) {
      console.error("Erro ao enviar GIF:", error);
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
    <div
      ref={chatContainerRef}
      style={
        aberto && chatPosicao && !chatMaximizado
          ? {
            left: chatPosicao.x,
            top: chatPosicao.y,
          }
          : undefined
      }
      className={`fixed z-[9999] ${chatMaximizado
        ? "left-10 top-10"
        : aberto && chatPosicao
          ? ""
          : "bottom-6 right-6"
        }`}
    >
      {aberto && (
        <div
          style={{
            width: chatTamanho.largura,
            height: chatTamanho.altura,
          }}
          className="relative mb-3 flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
        >
          <div
            onMouseDown={iniciarArrasteChat}
            className="phanyx-chat-cabecalho flex cursor-move select-none items-start justify-between bg-blue-600 px-4 py-3 text-white"
            title={
              chatMaximizado
                ? "Restaure o chat para poder arrastar"
                : "Arraste para movimentar o chat"
            }
          >
            <div>
              <p className="font-bold">Chat interno PHANYX</p>
              <p className="text-xs text-blue-100">Você está online</p>
            </div>

            <div
              className="flex gap-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={reposicionarChatNoPadrao}
                className="phanyx-chat-controle rounded-md px-2 text-sm hover:bg-white/20"
                title="Voltar ao canto inferior direito"
                aria-label="Voltar o chat à posição padrão"
              >
                ↘
              </button>

              <button
                type="button"
                onClick={() => {
                  if (chatMaximizado) {
                    setChatTamanho(chatTamanhoRestauradoRef.current);
                    setChatMaximizado(false);
                    return;
                  }

                  chatTamanhoRestauradoRef.current = chatTamanho;

                  setChatTamanho({
                    largura: Math.max(320, window.innerWidth - 80),
                    altura: Math.max(420, window.innerHeight - 120),
                  });

                  setChatMaximizado(true);
                }}
                className="phanyx-chat-controle rounded-md px-2 text-sm hover:bg-white/20"
                title={chatMaximizado ? "Restaurar tamanho" : "Maximizar"}
                aria-label={chatMaximizado ? "Restaurar tamanho do chat" : "Maximizar chat"}
              >
                {chatMaximizado ? "🗗" : "🗖"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (chatMaximizado) {
                    setChatTamanho(chatTamanhoRestauradoRef.current);
                  }

                  setMostrarGifs(false);
                  setMostrarEmojis(false);
                  setAberto(false);
                  setChatMaximizado(false);
                }}
                className="phanyx-chat-controle rounded-md px-2 text-sm hover:bg-white/20"
                title="Fechar"
                aria-label="Fechar chat"
              >
                ✕
              </button>
            </div>
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
            <div className="flex min-h-0 flex-1 flex-col">
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
                        className={`max-w-[75%] rounded-2xl px-3 py-2 ${minha
                          ? "phanyx-chat-mensagem-minha bg-blue-600 text-white"
                          : "phanyx-chat-mensagem-recebida bg-slate-800 text-slate-100"
                          }`}
                      >
                        {mensagem.anexos && mensagem.anexos.length > 0 ? (
                          <div className="space-y-2">
                            {mensagem.anexos.map((anexo: any) => {
                              const mime = anexo.tipoMime || "";

                              if (mime.startsWith("image/")) {
                                return (
                                  <a
                                    key={anexo.id}
                                    href={anexo.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <img
                                      src={anexo.url}
                                      alt={anexo.nomeArquivo}
                                      className="max-h-40 rounded-xl"
                                    />
                                  </a>
                                );
                              }

                              if (mime.startsWith("video/")) {
                                return (
                                  <video
                                    key={anexo.id}
                                    src={anexo.url}
                                    controls
                                    className="max-h-40 rounded-xl"
                                  />
                                );
                              }

                              return (
                                <a
                                  key={anexo.id}
                                  href={anexo.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block underline"
                                >
                                  📎 {anexo.nomeArquivo}
                                </a>
                              );
                            })}
                          </div>
                        ) : mensagem.texto?.startsWith("[GIF]") ? (
                          <img
                            src={mensagem.texto.replace("[GIF]", "")}
                            alt="GIF enviado"
                            className="max-h-40 rounded-xl"
                          />
                        ) : (
                          <span
                            style={{
                              color: minha
                                ? "#ffffff"
                                : "#f8fafc",
                              WebkitTextFillColor: minha
                                ? "#ffffff"
                                : "#f8fafc",
                            }}
                          >
                            {mensagem.texto}
                          </span>
                        )}


                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-700 bg-slate-900 p-3">

                {mostrarEmojis && (
                  <div className="phanyx-chat-emoji-panel mb-2 rounded-xl border p-2">
                    <div className="phanyx-chat-emoji-header flex items-center justify-between gap-3 border-b pb-2">
                      <span className="phanyx-chat-emoji-title text-xs font-semibold">
                        Escolha um emoji
                      </span>

                      <button
                        type="button"
                        onClick={() => setMostrarEmojis(false)}
                        className="phanyx-chat-emoji-cancel rounded-lg border px-2 py-1 text-xs font-semibold"
                        title="Fechar emojis"
                      >
                        ✕ Fechar
                      </button>
                    </div>

                    <div
                      className="phanyx-chat-emoji-grid mt-2 grid grid-cols-6 gap-2"
                      onWheel={(event) => event.stopPropagation()}
                    >
                      {EMOJIS_RAPIDOS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => adicionarEmoji(emoji)}
                          className="phanyx-chat-emoji-opcao rounded-lg p-1 text-xl"
                          title={`Adicionar ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mostrarGifs && (
                  <div className="phanyx-chat-gif-panel mb-2 rounded-xl border p-2">
                    <div className="phanyx-chat-gif-header flex items-center justify-between gap-3 border-b pb-2">
                      <span className="phanyx-chat-gif-title text-xs font-semibold">
                        Escolha um GIF
                      </span>

                      <button
                        type="button"
                        onClick={() => setMostrarGifs(false)}
                        className="phanyx-chat-gif-cancel rounded-lg border px-2 py-1 text-xs font-semibold"
                        title="Cancelar envio de GIF"
                      >
                        ✕ Cancelar
                      </button>
                    </div>

                    <div
                      className="phanyx-chat-gif-grid mt-2 grid grid-cols-2 gap-2"
                      onWheel={(event) => event.stopPropagation()}
                    >
                      {GIFS_RAPIDOS.map((gif) => (
                        <button
                          key={gif}
                          type="button"
                          onClick={() => enviarGif(gif)}
                          disabled={enviando}
                          className="phanyx-chat-gif-option overflow-hidden rounded-lg border disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <img
                            src={gif}
                            alt="Enviar este GIF"
                            className="h-20 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarEmojis((prev) => !prev);
                      setMostrarGifs(false);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm text-white"
                  >
                    😊
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarGifs((prev) => !prev);
                      setMostrarEmojis(false);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-white"
                  >
                    GIF
                  </button>

                  <input
                    ref={inputArquivoRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      enviarArquivo(file);
                      e.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm text-white"
                    title="Enviar arquivo"
                  >
                    📎
                  </button>

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
                    placeholder="Digite..."
                    className="min-w-0 flex-[2] rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={enviarMensagem}
                    disabled={enviando || !textoMensagem.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white disabled:opacity-50"
                    title="Enviar"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          )}

          {modoNovaConversa && (
            <div className="max-h-80 overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-white">
                  {modoTurmas ? "Escolher turma" : "Iniciar conversa"}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (modoTurmas) {
                      setModoTurmas(false);
                    } else {
                      setModoNovaConversa(false);
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Voltar
                </button>
              </div>

              {!modoTurmas && usuarioRole !== "ALUNO" && (
                <div className="mb-3 grid grid-cols-1 gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Conversas
                  </p>

                  {usuarioRole === "PROFESSOR" && (
                    <button
                      type="button"
                      onClick={carregarTurmasChat}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-left text-sm font-semibold text-white hover:bg-blue-950"
                    >
                      👥 Conversa da turma
                    </button>
                  )}
                </div>
              )}

              {!modoTurmas && usuarioRole === "ALUNO" && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Escolha seu professor
                </p>
              )}

              {!modoTurmas && carregandoUsuarios && (
                <p className="py-4 text-sm text-slate-400">
                  Carregando usuários...
                </p>
              )}

              {!modoTurmas && !carregandoUsuarios && usuarios.length === 0 && (
                <p className="py-4 text-sm text-slate-400">
                  Nenhum contato individual disponível.
                </p>
              )}

              {!modoTurmas &&
                !carregandoUsuarios &&
                usuarios.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    onClick={() => abrirConversa(usuario)}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:bg-blue-950"
                  >
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-lg">
                      👤

                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${usuario.online ? "bg-green-500" : "bg-slate-400"
                          }`}
                        title={usuario.online ? "Online" : "Offline"}
                      />
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

              {modoTurmas && carregandoTurmas && (
                <p className="py-4 text-sm text-slate-400">
                  Carregando turmas...
                </p>
              )}

              {modoTurmas && !carregandoTurmas && turmasChat.length === 0 && (
                <p className="py-4 text-sm text-slate-400">
                  Nenhuma turma disponível.
                </p>
              )}

              {modoTurmas &&
                !carregandoTurmas &&
                turmasChat.map((turma) => (
                  <button
                    key={turma.id}
                    type="button"
                    onClick={() => abrirConversaTurma(turma)}
                    className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:bg-blue-950"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-lg">
                      👥
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {turma.nome}
                      </p>
                      <p className="text-xs text-slate-400">
                        {turma.semestre || "Turma"}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {aberto && (
            <>
              <div
                onMouseDown={iniciarRedimensionamento}
                className="phanyx-chat-resize-handle absolute left-0 top-0 z-30 h-4 w-4 cursor-nwse-resize"
                title="Arrastar para redimensionar"
              />

              <div
                onMouseDown={iniciarRedimensionamento}
                className="phanyx-chat-resize-handle absolute bottom-0 left-0 top-4 z-20 w-2 cursor-ew-resize"
                title="Arrastar lateral"
              />

              <div
                onMouseDown={iniciarRedimensionamentoAltura}
                className="phanyx-chat-resize-handle absolute left-4 right-4 top-0 z-20 h-2 cursor-ns-resize"
                title="Arrastar para cima"
              />
            </>
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