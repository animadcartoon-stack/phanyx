"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ArquivoUpload = {
  key: string;
  url: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
};

export default function NovoMaterialAulaPage() {
  const params = useParams();
  const router = useRouter();
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const aulaId = params?.aulaId ? Number(params.aulaId) : null;

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("arquivo");
  const [urlExterna, setUrlExterna] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoEnviado, setArquivoEnviado] = useState<ArquivoUpload | null>(null);

  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

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

  async function handleSalvarMaterial(e: React.FormEvent) {
    e.preventDefault();

    if (!aulaId) {
      setErro("Aula inválida.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const body =
        tipo === "link" || tipo === "video"
          ? {
              titulo,
              tipo,
              url: urlExterna,
              aulaId,
            }
          : {
              titulo,
              tipo: "arquivo",
              url: arquivoEnviado?.url || "",
              arquivoNome: arquivoEnviado?.nomeOriginal || "",
              mimeType: arquivoEnviado?.mimeType || "",
              tamanho: arquivoEnviado?.tamanho || null,
              aulaId,
            };

     const res = await fetch("/api/professor/materiais", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar material");
      }

      setMensagem("Material criado com sucesso.");

      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar material");
    } finally {
      setSalvando(false);
    }
  }

  const precisaArquivo =
    tipo === "arquivo" || tipo === "pdf" || tipo === "doc" || tipo === "ppt";

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Voltar
          </button>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Novo material da aula
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Adicione um arquivo, link ou vídeo a esta aula.
          </p>
        </div>

        <form
          onSubmit={handleSalvarMaterial}
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
              placeholder="Ex.: Slides da aula 1"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setErro("");
                setMensagem("");
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="arquivo">Arquivo</option>
              <option value="pdf">PDF</option>
              <option value="doc">Documento</option>
              <option value="ppt">Apresentação</option>
              <option value="link">Link</option>
              <option value="video">Vídeo</option>
            </select>
          </div>

          {precisaArquivo ? (
            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Upload do arquivo
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione o arquivo e depois envie para a nuvem.
                </p>
              </div>

              <input
  ref={inputArquivoRef}
  type="file"
  accept=".pdf,.ppt,.pptx,.mp4,.mov,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setArquivo(file);
                  setArquivoEnviado(null);
                  setMensagem("");
                }}
                className="hidden"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => inputArquivoRef.current?.click()}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Selecionar arquivo
                </button>

                <button
                  type="button"
                  onClick={handleUploadArquivo}
                  disabled={!arquivo || uploadingArquivo}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingArquivo ? "Enviando arquivo..." : "Enviar arquivo"}
                </button>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {arquivo ? (
                  <>
                    Arquivo selecionado: <strong>{arquivo.name}</strong>
                  </>
                ) : (
                  "Nenhum arquivo selecionado."
                )}
              </div>

              {arquivoEnviado && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <p>
                    <strong>Arquivo enviado:</strong> {arquivoEnviado.nomeOriginal}
                  </p>
                  <p>
                    <strong>Key:</strong> {arquivoEnviado.key}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                value={urlExterna}
                onChange={(e) => setUrlExterna(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder={
                  tipo === "video" ? "https://youtube.com/..." : "https://..."
                }
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}