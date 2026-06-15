"use client";

import { useState } from "react";

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
  } catch (error: any) {
    setErro(error.message || "Erro ao enviar atividade.");
  } finally {
    setSalvando(false);
  }
}

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">
          Enviar atividade
        </h1>

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