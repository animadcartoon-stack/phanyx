"use client";

import { useEffect, useState } from "react";

type AtividadeDetalhe = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima?: number | null;
  disciplina?: { nome?: string | null } | null;
  turma?: { nome?: string | null } | null;
  anexos?: {
    id: number;
    titulo: string;
    url: string;
    arquivoNome?: string | null;
  }[];
  entregas?: {
    id: number;
    texto?: string | null;
    link?: string | null;
    arquivoUrl?: string | null;
    entregueEm?: string | null;
    nota?: number | null;
    feedback?: string | null;
  }[];
};

export default function EntregaTrabalhoAlunoClient({
  atividadeId,
}: {
  atividadeId: string;
}) {
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregarAtividade() {
  try {
    setLoading(true);
    setErro("");

    const res = await fetch(`/api/aluno/atividades/${atividadeId}`, {
      credentials: "include",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || "Erro ao carregar atividade.");
    }

    setAtividade(json);
    setTexto(json?.entregas?.[0]?.texto || "");
    setLink(json?.entregas?.[0]?.link || "");
  } catch (e: any) {
    setErro(e?.message || "Erro ao carregar atividade.");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  carregarAtividade();
}, [atividadeId]);

  async function enviarEntrega() {
  try {
    setMensagem("");
    setErro("");
    setSalvando(true);

    let arquivoUrl = "";

    if (arquivo) {
      if (arquivo.size > 500 * 1024 * 1024) {
        throw new Error("O arquivo excede o limite de 500 MB.");
      }

      const resUploadUrl = await fetch(
        `/api/aluno/atividades/${atividadeId}/upload-url`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nomeOriginal: arquivo.name,
            mimeType: arquivo.type || "application/octet-stream",
            tamanho: arquivo.size,
          }),
        }
      );

      const jsonUploadUrl = await resUploadUrl.json();

      if (!resUploadUrl.ok || !jsonUploadUrl?.uploadUrl) {
        throw new Error(jsonUploadUrl?.error || "Erro ao preparar upload.");
      }

      const resUploadDireto = await fetch(jsonUploadUrl.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": arquivo.type || "application/octet-stream",
        },
        body: arquivo,
      });

      if (!resUploadDireto.ok) {
        throw new Error("Erro ao enviar arquivo.");
      }

      arquivoUrl = jsonUploadUrl.arquivoUrl;
    }

    const response = await fetch(
      `/api/aluno/atividades/${atividadeId}/entregar`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto,
          link,
          arquivoUrl,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao enviar atividade.");
    }

    setMensagem("Atividade enviada com sucesso.");
    setTexto("");
    setLink("");
    setArquivo(null);
    await carregarAtividade();
  } catch (error: any) {
    setErro(error.message || "Erro ao enviar atividade.");
  } finally {
    setSalvando(false);
  }
}

if (loading) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-300">
          Carregando atividade...
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">
          Enviar atividade
        </h1>

{atividade && (
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
    <h2 className="text-xl font-black text-slate-900 dark:text-white">
      {atividade.titulo}
    </h2>

    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
      <p className="text-slate-700 dark:text-slate-300">
        <strong>Disciplina:</strong>{" "}
        {atividade.disciplina?.nome || "-"}
      </p>

      <p className="text-slate-700 dark:text-slate-300">
        <strong>Turma:</strong>{" "}
        {atividade.turma?.nome || "-"}
      </p>

      <p className="text-slate-700 dark:text-slate-300">
        <strong>Prazo:</strong>{" "}
        {atividade.prazo
          ? new Date(atividade.prazo).toLocaleString("pt-BR")
          : "Sem prazo"}
      </p>

      <p className="text-slate-700 dark:text-slate-300">
        <strong>Nota máxima:</strong>{" "}
        {atividade.notaMaxima}
      </p>
    </div>

    {atividade.descricao && (
      <>
        <hr className="my-5 border-slate-200 dark:border-slate-800" />

        <h3 className="font-bold text-slate-900 dark:text-white">
          Orientações
        </h3>

        <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
          {atividade.descricao}
        </div>
      </>
    )}
  </div>
)}

        <p className="mt-2 text-sm text-slate-500">
          Envie texto, link ou arquivo para o professor.
        </p>

{mensagem && (
  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
    {mensagem}
  </div>
)}

{erro && (
  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
    {erro}
  </div>
)}

{atividade?.anexos && atividade.anexos.length > 0 && (
  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/40">
    <h3 className="font-bold text-blue-800 dark:text-blue-200">
      Arquivos da atividade
    </h3>

    <div className="mt-4 space-y-2">
      {atividade.anexos.map((anexo) => (
        <a
          key={anexo.id}
          href={anexo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-blue-200 bg-white px-4 py-3 font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300"
        >
          📎 {anexo.arquivoNome || anexo.titulo}
        </a>
      ))}
    </div>
  </div>
)}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium">
            Texto da resposta
          </label>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Link externo
          </label>

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">
            Arquivo
          </label>

          <input
            type="file"
            onChange={(e) =>
              setArquivo(e.target.files?.[0] || null)
            }
          />

          {arquivo && (
            <p className="mt-2 text-sm text-slate-500">
              {arquivo.name}
            </p>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={enviarEntrega}
            disabled={salvando}
            className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando
              ? "Enviando..."
              : "Enviar atividade"}
          </button>
        </div>
      </div>
    </div>
  );
}