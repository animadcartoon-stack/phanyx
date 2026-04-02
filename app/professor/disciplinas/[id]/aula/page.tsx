"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Aula = {
  id: number;
  titulo: string;
  descricao?: string | null;
  duracaoMin?: number | null;
  videoUrl?: string | null;
  ordem?: number | null;
};

export default function ProfessorAulasPage() {
  const params = useParams<{ disciplinaId: string }>();
  const disciplinaId = Number(params.disciplinaId);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoMin, setDuracaoMin] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarAulas() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        `/api/professor/disciplinas/${disciplinaId}/aulas`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar aulas");
      }

      setAulas(data);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar aulas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(disciplinaId) && disciplinaId > 0) {
      carregarAulas();
    }
  }, [disciplinaId]);

  async function criarAula(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/professor/disciplinas/${disciplinaId}/aulas`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            titulo,
            descricao,
            duracaoMin,
            videoUrl,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar aula");
      }

      setTitulo("");
      setDescricao("");
      setDuracaoMin("");
      setVideoUrl("");
      setSucesso("Aula criada com sucesso.");

      await carregarAulas();
    } catch (e: any) {
      setErro(e.message || "Erro ao criar aula");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Aulas da disciplina</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastre e gerencie as aulas desta disciplina.
        </p>
      </div>

      <form
        onSubmit={criarAula}
        className="rounded-2xl border bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900">Nova aula</h2>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {sucesso}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            placeholder="Ex.: Introdução à disciplina"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            rows={4}
            placeholder="Resumo da aula"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duração (min)
          </label>
          <input
            type="number"
            value={duracaoMin}
            onChange={(e) => setDuracaoMin(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            placeholder="60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            URL do vídeo
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full rounded-xl border px-4 py-2"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Criar aula"}
        </button>
      </form>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Aulas cadastradas</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Carregando aulas...</p>
        ) : aulas.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Nenhuma aula cadastrada.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {aulas.map((aula) => (
              <div key={aula.id} className="rounded-xl border p-4">
                <h3 className="font-semibold text-gray-900">
                  {aula.ordem ? `${aula.ordem}. ` : ""}
                  {aula.titulo}
                </h3>

                {aula.descricao && (
                  <p className="mt-1 text-sm text-gray-600">{aula.descricao}</p>
                )}

                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Duração: {aula.duracaoMin ?? 0} min</span>
                  <span>Vídeo: {aula.videoUrl ? "Sim" : "Não"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}