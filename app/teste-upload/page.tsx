"use client";

import { useState } from "react";

type ArquivoResposta = {
  key: string;
  url: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
};

export default function TesteUploadPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ArquivoResposta | null>(null);
  const [erro, setErro] = useState("");

  async function handleUpload() {
    if (!arquivo) {
      setErro("Selecione um arquivo.");
      return;
    }

    setEnviando(true);
    setErro("");
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar arquivo.");
      }

      setResultado(data.arquivo);
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : "Erro inesperado no upload.";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Teste de Upload</h1>

      <input
  type="file"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
      setErro("");
    }
  }}
  className="block w-full"
/>

{arquivo && (
  <p className="text-sm text-gray-400">
    Arquivo selecionado: {arquivo.name}
  </p>
)}

      <button
        onClick={handleUpload}
        disabled={enviando}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar arquivo"}
      </button>

      {erro && (
        <div className="rounded bg-red-100 text-red-700 p-3">
          {erro}
        </div>
      )}

      {resultado && (
        <div className="rounded bg-green-100 text-green-800 p-4 space-y-2">
          <p><strong>Nome:</strong> {resultado.nomeOriginal}</p>
          <p><strong>Key:</strong> {resultado.key}</p>
          <p><strong>Tipo:</strong> {resultado.mimeType}</p>
          <p><strong>Tamanho:</strong> {resultado.tamanho} bytes</p>
          <p><strong>URL/Key:</strong> {resultado.url}</p>
        </div>
      )}
    </div>
  );
}