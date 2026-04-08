"use client";

import { useParams, useRouter } from "next/navigation";
import { useProfessor } from "@/app/context/ProfessorContext";
import { useState } from "react";

export default function AulaProfessorPage() {
  const router = useRouter();
  const params = useParams();

  const disciplinaId = String(params.id);
  const aulaId = String(params.aulaId);

  const {
    disciplinas,
    editarAula,
    excluirAula,
    adicionarMaterial,
  } = useProfessor();

  const disciplina = disciplinas.find(
    (d) => d.id === disciplinaId
  );

  const aula = disciplina?.aulas.find(
    (a) => a.id === aulaId
  );

  const [modoEdicao, setModoEdicao] = useState(false);
  const [titulo, setTitulo] = useState(aula?.titulo || "");
  const [video, setVideo] = useState(aula?.video || "");
  const [arquivo, setArquivo] = useState<File | null>(null);

  if (!disciplina || !aula) {
    return (
      <div className="p-8">
        <p>Aula não encontrada.</p>
      </div>
    );
  }

  function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    editarAula(disciplinaId, aulaId, titulo, video);
    setModoEdicao(false);
  }

  function handleExcluir() {
    const confirmar = confirm(
      "Tem certeza que deseja excluir esta aula?"
    );

    if (!confirmar) return;

    excluirAula(disciplinaId, aulaId);
    router.push(`/professor/disciplinas/${disciplinaId}`);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!arquivo) return;

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

const data = await resUploadUrl.json();

if (!resUploadUrl.ok) {
  throw new Error(data?.error || "Erro ao gerar upload");
}

const resUploadDireto = await fetch(data.uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": arquivo.type || "application/octet-stream",
  },
  body: arquivo,
});

if (!resUploadDireto.ok) {
  throw new Error("Erro ao enviar arquivo para o storage");
}

const dataFinal = {
  nome: arquivo.name,
  url: data.arquivoUrl,
};

    adicionarMaterial(disciplinaId, aulaId, {
      id: Date.now().toString(),
      nome: data.nome,
      tipo: "arquivo",
      url: data.url,
    });

    setArquivo(null);
  }

  const embed = video
    .replace("watch?v=", "embed/")
    .replace("youtu.be/", "youtube.com/embed/");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Voltar */}
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      {!modoEdicao ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {aula.titulo}
            </h1>
            <p className="text-gray-600">
              {disciplina.nome}
            </p>
          </div>

          {/* Vídeo */}
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={embed}
              className="w-full h-full"
              allowFullScreen
            />
          </div>

          {/* Materiais da aula */}
          <div className="bg-white border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Materiais da aula
            </h2>

            <form
              onSubmit={handleUpload}
              className="space-y-3"
            >
              <input
                type="file"
                onChange={(e) =>
                  setArquivo(e.target.files?.[0] || null)
                }
                className="w-full border rounded-lg p-2 text-gray-900"
                required
              />

              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Enviar arquivo
              </button>
            </form>

            {/* Lista de materiais */}
            <div className="space-y-2">
              {aula.materiais?.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  className="block border rounded-lg p-3 hover:bg-gray-50"
                >
                  📎 {m.nome}
                </a>
              ))}

              {(!aula.materiais ||
                aula.materiais.length === 0) && (
                <p className="text-gray-600 text-sm">
                  Nenhum material adicionado.
                </p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={() => setModoEdicao(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
            >
              Editar aula
            </button>

            <button
              onClick={handleExcluir}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Excluir aula
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={salvarEdicao}
          className="space-y-4 bg-white border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Editar aula
          </h2>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />

          <input
            value={video}
            onChange={(e) => setVideo(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Salvar
            </button>

            <button
              type="button"
              onClick={() => setModoEdicao(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

