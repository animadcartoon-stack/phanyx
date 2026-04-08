"use client";

import { FormEvent, useEffect, useState } from "react";

type Turma = {
  id: number;
  nome?: string | null;
  disciplina?: {
    id: number;
    nome?: string | null;
  } | null;
};

type ArquivoUpload = {
  key: string;
  url: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
};

export default function NovaAtividadeProfessorPage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [notaMaxima, setNotaMaxima] = useState("10");
  
  const [turmaId, setTurmaId] = useState("");

  
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [arquivoEnviado, setArquivoEnviado] = useState<ArquivoUpload | null>(null);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const turmasRes = await fetch("/api/professor/turmas", {
  credentials: "include",
});
const turmasJson = await turmasRes.json();

if (!turmasRes.ok) {
  throw new Error(turmasJson.error || "Erro ao carregar turmas");
}

setTurmas(Array.isArray(turmasJson) ? turmasJson : []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleUploadArquivo() {
    if (!arquivo) {
      setErro("Selecione um arquivo para enviar.");
      return;
    }

    try {
      setUploadingArquivo(true);
      setErro("");
      setMensagem("");

      const resUploadUrl = await fetch("/api/professor/upload-url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nomeOriginal: arquivo.name,
    mimeType: arquivo.type || "application/octet-stream",
    tamanho: arquivo.size,
  }),
});

const jsonUploadUrl = await resUploadUrl.json();

if (!resUploadUrl.ok) {
  throw new Error(jsonUploadUrl?.error || "Erro ao gerar upload");
}

const resUploadDireto = await fetch(jsonUploadUrl.uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": arquivo.type || "application/octet-stream",
  },
  body: arquivo,
});

if (!resUploadDireto.ok) {
  throw new Error("Erro ao enviar arquivo para o storage");
}

const json = {
  arquivo: {
    url: jsonUploadUrl.arquivoUrl,
  },
};

      setArquivoEnviado({
  key: jsonUploadUrl.key,
  nomeOriginal: arquivo.name,
  mimeType: arquivo.type || "application/octet-stream",
  tamanho: arquivo.size,
  url: jsonUploadUrl.arquivoUrl,
});
      setMensagem("Arquivo enviado com sucesso.");
    } catch (e: any) {
      setErro(e.message || "Erro ao enviar arquivo");
    } finally {
      setUploadingArquivo(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch("/api/professor/atividades", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    titulo,
    descricao,
    prazo: prazo ? new Date(prazo).toISOString() : "",
    notaMaxima,
    turmaId,

    anexo: arquivoEnviado
      ? {
          nomeOriginal: arquivoEnviado.nomeOriginal,
          key: arquivoEnviado.key,
          url: arquivoEnviado.url,
          mimeType: arquivoEnviado.mimeType,
          tamanho: arquivoEnviado.tamanho,
        }
      : null,
  }),
});

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao criar atividade");
      }

      setMensagem("Atividade criada com sucesso.");
      setTitulo("");
      setDescricao("");
      setPrazo("");
      setNotaMaxima("10");
      setTurmaId("");
      setArquivo(null);
      setArquivoEnviado(null);
    } catch (e: any) {
      setErro(e.message || "Erro ao criar atividade");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <a
            href="/professor/atividades"
            className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Voltar para atividades
          </a>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Nova atividade
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Crie uma nova atividade para sua disciplina.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando dados...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
          >
            {mensagem && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {mensagem}
              </div>
            )}

            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Título
              </label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Ex.: Trabalho sobre Revolução Industrial"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Descreva a atividade"
              />
            </div>

            <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Turma
  </label>
  <select
    value={turmaId}
    onChange={(e) => setTurmaId(e.target.value)}
    required
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
  >
    <option value="">Selecione uma turma</option>
    {turmas.map((turma) => (
      <option key={turma.id} value={turma.id}>
        {turma.nome || `Turma ${turma.id}`}
        {turma.disciplina?.nome ? ` — ${turma.disciplina.nome}` : ""}
      </option>
    ))}
  </select>
</div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Prazo
                </label>
                <input
                  type="datetime-local"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nota máxima
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={notaMaxima}
                  onChange={(e) => setNotaMaxima(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Anexo da atividade
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Envie um PDF, imagem ou documento para acompanhar a atividade.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
  Selecionar arquivo
  <input
    type="file"
    onChange={(e) => {
      const file = e.target.files?.[0] || null;
      setArquivo(file);
      setArquivoEnviado(null);
      setMensagem("");
    }}
    className="hidden"
  />
</label>

              {arquivo && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  Arquivo selecionado: <strong>{arquivo.name}</strong>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUploadArquivo}
                  disabled={!arquivo || uploadingArquivo}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingArquivo ? "Enviando arquivo..." : "Enviar anexo"}
                </button>
              </div>

              {arquivoEnviado && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <p>
                    <strong>Arquivo enviado:</strong> {arquivoEnviado.nomeOriginal}
                  </p>
                  <p>
                    <strong>Key:</strong> {arquivoEnviado.key}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {arquivoEnviado.mimeType}
                  </p>
                  <p>
                    <strong>Tamanho:</strong> {arquivoEnviado.tamanho} bytes
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Criar atividade"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}