"use client";

import { useEffect, useState } from "react";

type ChamadoOuvidoria = {
  id: number;
  origem: string;
  tipo: string;
  titulo?: string | null;
  mensagem: string;
  status: string;
  prioridade: string;
  sentimento: string;
  criadoEm: string;
  resposta?: string | null;
};
  
export default function OuvidoriaAdminPage() {
  const [filtro, setFiltro] = useState("Todos");

  const [chamados, setChamados] = useState<ChamadoOuvidoria[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);

  const [chamadoSelecionado, setChamadoSelecionado] =
  useState<ChamadoOuvidoria | null>(null);
  const [respostaTexto, setRespostaTexto] = useState("");
  const [salvandoResposta, setSalvandoResposta] = useState(false);

  const [modalNovoChamado, setModalNovoChamado] = useState(false);

  const [novoTipo, setNovoTipo] = useState("Sugestão");
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaMensagem, setNovaMensagem] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState("NORMAL");

useEffect(() => {
  async function carregarOuvidoria() {
    try {
      const res = await fetch("/api/ouvidoria", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar ouvidoria");
      }

      setChamados(data.registros || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  carregarOuvidoria();
}, []);

async function marcarComoResolvido(id: number) {
  try {
    setAtualizandoId(id);

    const res = await fetch(`/api/ouvidoria/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        status: "RESOLVIDO",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao atualizar manifestação.");
    }

    setChamados((atuais) =>
      atuais.map((item) =>
        item.id === id ? { ...item, status: "RESOLVIDO" } : item
      )
    );
  } catch (error) {
    console.error(error);
    alert("Não foi possível marcar como resolvido.");
  } finally {
    setAtualizandoId(null);
  }
}

function gerarRespostaSugerida(item: ChamadoOuvidoria) {
  if (item.tipo.toLowerCase().includes("elogio")) {
    return `Agradecemos muito pelo seu retorno. Ficamos felizes em saber que sua experiência foi positiva. Sua mensagem é muito importante para nossa instituição.`;
  }

  if (item.tipo.toLowerCase().includes("sugest")) {
    return `Agradecemos sua sugestão. Sua contribuição é muito importante para a melhoria contínua da instituição. Nossa equipe irá analisar a possibilidade de implementar essa melhoria.`;
  }

  if (item.tipo.toLowerCase().includes("reclama")) {
    return `Agradecemos por compartilhar sua manifestação. Sentimos muito pela experiência relatada. Nossa equipe irá verificar a situação com atenção e encaminhar ao setor responsável para buscar uma solução.`;
  }

  return `Agradecemos seu contato. Sua manifestação foi recebida e será analisada pela instituição com a atenção necessária.`;
}

async function salvarNovoChamado() {
  if (!novaMensagem.trim()) {
    alert("Escreva a mensagem da manifestação antes de salvar.");
    return;
  }

  try {
    const res = await fetch("/api/ouvidoria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        origem: "ADMIN",
        tipo: novoTipo,
        titulo: novoTitulo,
        mensagem: novaMensagem,
        prioridade: novaPrioridade,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao criar manifestação.");
    }

    setChamados((atuais) => [data.registro, ...atuais]);

    setModalNovoChamado(false);
    setNovoTipo("Sugestão");
    setNovoTitulo("");
    setNovaMensagem("");
    setNovaPrioridade("NORMAL");
  } catch (error) {
    console.error(error);
    alert("Não foi possível criar a manifestação.");
  }
}

function abrirModalResposta(item: ChamadoOuvidoria) {
  setChamadoSelecionado(item);
  setRespostaTexto(item.resposta || gerarRespostaSugerida(item));
}

async function salvarResposta() {
  if (!chamadoSelecionado) return;

  if (!respostaTexto.trim()) {
    alert("Escreva uma resposta antes de salvar.");
    return;
  }

  try {
    setSalvandoResposta(true);

    const res = await fetch(`/api/ouvidoria/${chamadoSelecionado.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        resposta: respostaTexto,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao salvar resposta.");
    }

    setChamados((atuais) =>
      atuais.map((item) =>
        item.id === chamadoSelecionado.id
          ? {
              ...item,
              resposta: respostaTexto,
              status: "RESOLVIDO",
            }
          : item
      )
    );

    setChamadoSelecionado(null);
    setRespostaTexto("");
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar a resposta.");
  } finally {
    setSalvandoResposta(false);
  }
}

  const chamadosFiltrados = chamados.filter((item) => {
  if (filtro === "Todos") return true;

  return (
    item.status === filtro.toUpperCase() ||
    item.sentimento === filtro.toUpperCase() ||
    item.origem === filtro.toUpperCase()
  );
});

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX IA
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Ouvidoria inteligente
        </h1>

        <p className="mt-2 max-w-4xl text-slate-600">
          Centralize sugestões, reclamações, elogios e relatos internos de
          alunos e professores com análise automática da IA PHANYX.
        </p>
      </div>
<div className="mt-4">
  <button
    type="button"
    onClick={() => setModalNovoChamado(true)}
    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
  >
    + Nova manifestação
  </button>
</div>
      <div className="rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
          Painel executivo
        </p>

        <h2 className="mt-4 text-4xl font-black">
          Ouvidoria conectada à Reputação IA
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Reclamações internas, sugestões e elogios passam a alimentar o módulo
          reputacional da instituição, ajudando a IA a identificar riscos,
          gargalos e oportunidades de melhoria.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500">Total</p>
          <h3 className="mt-2 text-3xl font-black">{chamados.length}</h3>
        </div>

        <div className="rounded-2xl border bg-red-50 p-5 shadow-sm">
          <h3 className="mt-2 text-3xl font-black text-red-900">
  {chamados.filter((item) => item.sentimento === "CRITICO").length}
</h3>
        </div>

        <div className="rounded-2xl border bg-amber-50 p-5 shadow-sm">
          <h3 className="mt-2 text-3xl font-black text-amber-900">
  {chamados.filter((item) => item.status === "EM_ANALISE").length}
</h3>
        </div>

        <div className="rounded-2xl border bg-emerald-50 p-5 shadow-sm">
          <h3 className="mt-2 text-3xl font-black text-emerald-900">
  {chamados.filter((item) => item.status === "RESOLVIDO").length}
</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Todos", "Aluno", "Professor", "Crítico", "Neutro", "Positivo", "Pendente", "Em análise", "Resolvido"].map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFiltro(item)}
              className={`rounded-full px-4 py-2 text-xs font-black ${
                filtro === item
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <div className="space-y-4">

        {carregando && (
  <div className="rounded-3xl border bg-white p-6 text-sm font-semibold text-slate-600">
    Carregando manifestações...
  </div>
)}

{!carregando && chamadosFiltrados.length === 0 && (
  <div className="rounded-3xl border border-dashed bg-white p-8 text-center">
    <h3 className="text-xl font-black text-slate-900">
      Nenhuma manifestação encontrada
    </h3>
    <p className="mt-2 text-sm text-slate-500">
      Quando alunos ou professores enviarem manifestações, elas aparecerão aqui.
    </p>
  </div>
)}

        {!carregando && chamadosFiltrados.map((item) => (
          <div
  key={item.id}
  className="rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-slate-900">
                  Manifestação #{item.id}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {item.origem} • {item.tipo}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {item.status}
                </span>

                <span
  className={`rounded-full px-3 py-1 text-xs font-bold ${
    item.sentimento === "CRITICO"
      ? "bg-red-100 text-red-700"
      : item.sentimento === "POSITIVO"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-yellow-100 text-yellow-800"
  }`}
>
  {item.sentimento}
</span>

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  {item.prioridade}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              “{item.mensagem}”
            </p>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-700">
                Sugestão da IA PHANYX
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Responder com empatia, reconhecer o relato, explicar que a
                instituição irá verificar o caso e encaminhar ao setor
                responsável.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Ver detalhes
              </button>

              <button
  type="button"
  onClick={() => abrirModalResposta(item)}
  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
>
  Responder
</button>

              <button
  type="button"
  onClick={() => marcarComoResolvido(item.id)}
  disabled={
  atualizandoId === item.id ||
  item.status === "RESOLVIDO" ||
  !item.resposta
}
  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {item.status === "RESOLVIDO"
  ? "Resolvido"
  : !item.resposta
  ? "Responda primeiro"
  : atualizandoId === item.id
  ? "Atualizando..."
  : "Marcar como resolvido"}
</button>
            </div>
          </div>
        ))}
        {chamadoSelecionado && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-3xl border bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
            Ouvidoria
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Responder manifestação
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setChamadoSelecionado(null)}
          className="rounded-full bg-slate-100 px-3 py-2 font-black text-slate-500 hover:bg-slate-200"
        >
          ×
        </button>
      </div>

      <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
        <p className="text-xs font-black uppercase text-slate-500">
          Manifestação recebida
        </p>

        <p className="mt-2 text-sm font-bold text-slate-900">
          {chamadoSelecionado.origem} • {chamadoSelecionado.tipo}
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          “{chamadoSelecionado.mensagem}”
        </p>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Resposta da instituição
        </label>

        <textarea
          value={respostaTexto}
          onChange={(e) => setRespostaTexto(e.target.value)}
          rows={7}
          className="w-full rounded-2xl border p-4 text-sm text-slate-900"
        />
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => setChamadoSelecionado(null)}
          className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(respostaTexto)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Copiar resposta
        </button>

        <button
          type="button"
          onClick={salvarResposta}
          disabled={salvandoResposta}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvandoResposta ? "Salvando..." : "Salvar resposta"}
        </button>
      </div>
    </div>
  </div>
)}

{modalNovoChamado && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">
          Nova manifestação
        </h2>

        <button
          onClick={() => setModalNovoChamado(false)}
          className="rounded-xl bg-slate-800 px-3 py-2 text-white hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Tipo
          </label>

          <select
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
          >
            <option>Sugestão</option>
            <option>Reclamação</option>
            <option>Elogio</option>
            <option>Relato</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Prioridade
          </label>

          <select
            value={novaPrioridade}
            onChange={(e) => setNovaPrioridade(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
          >
            <option value="BAIXA">Baixa</option>
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Título
          </label>

          <input
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            placeholder="Digite um título"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Mensagem
          </label>

          <textarea
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            rows={6}
            placeholder="Descreva a manifestação..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white"
          />
        </div>

      </div>

      <div className="mt-6 flex justify-end gap-3">

        <button
          onClick={() => setModalNovoChamado(false)}
          className="rounded-xl border border-slate-600 px-5 py-3 font-bold text-slate-300"
        >
          Cancelar
        </button>

        <button
          onClick={salvarNovoChamado}
          className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
        >
          Salvar manifestação
        </button>

      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}