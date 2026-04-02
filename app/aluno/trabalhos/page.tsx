"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

type Trabalho = {
  disciplina: string;
  titulo: string;
  arquivoNome: string;
};

export default function TrabalhosAlunoPage() {
  const [disciplina, setDisciplina] = useState("");
  const [titulo, setTitulo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const { user } = useAuth();

function handleEnviar(e: React.FormEvent) {
  e.preventDefault();

  if (!disciplina || !titulo || !arquivo) {
    alert("Preencha todos os campos e selecione um arquivo.");
    return;
  }

  setTrabalhos((prev) => [
  {
    disciplina,
    titulo,
    arquivoNome: arquivo.name,
  },
  ...prev,
]);

  alert("Trabalho enviado com sucesso!");

  setDisciplina("");
  setTitulo("");
  setArquivo(null);
}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Trabalhos do Aluno
      </h1>

      {/* Formulário */}
      <form
        onSubmit={handleEnviar}
        className="bg-white border rounded-lg p-6 space-y-4"
      >
        <input
          type="text"
          placeholder="Disciplina"
          value={disciplina}
          onChange={(e) => setDisciplina(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full border rounded-lg p-2"
        />

        {/* Upload de arquivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arquivo do trabalho
          </label>

          <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            Upload de arquivo
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                setArquivo(e.target.files?.[0] || null)
              }
            />
          </label>

          {arquivo && (
            <p className="text-sm text-gray-600 mt-2">
              Arquivo selecionado: {arquivo.name}
            </p>
          )}
        </div>
          
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Enviar trabalho
        </button>
      </form>

      {/* Lista de trabalhos enviados */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">
          Trabalhos enviados
        </h2>

        {trabalhos.length === 0 ? (
          <p className="text-gray-500">
            Nenhum trabalho enviado ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {trabalhos.map((t, index) => (
              <li
                key={index}
                className="border rounded-lg p-3"
              >
                <p className="font-semibold">
                  {t.disciplina}
                </p>
                <p className="text-sm">{t.titulo}</p>
                <p className="text-xs text-gray-500">
                  Arquivo: {t.arquivoNome}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
