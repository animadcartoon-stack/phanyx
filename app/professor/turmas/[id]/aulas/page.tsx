"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TurmaApi = {
  id: number;
  nome: string;
  semestre?: string;
  disciplina?: {
    id: number;
    nome: string;
  };
};

type AulaApi = {
  id: number;
  titulo: string;
  descricao?: string | null;
  duracaoMin?: number | null;
  ordem?: number | null;
  videoUrl?: string | null;
};

function normalizeYoutubeUrl(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }

    if (u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }

    if (u.pathname.includes("/embed/")) {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

export default function AulasDaTurmaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const turmaId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [turma, setTurma] = useState<TurmaApi | null>(null);
  const [aulas, setAulas] = useState<AulaApi[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoMin, setDuracaoMin] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  async function excluirAula(aulaId: number, titulo: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a aula "${titulo}"?`
    );

    if (!confirmar) return;

    try {
      const res = await fetch(`/api/professor/aulas/${aulaId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";

      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const texto = await res.text();
        throw new Error(
          texto?.includes("<!DOCTYPE")
            ? "A rota de exclusão da aula não respondeu JSON. Verifique o arquivo app/api/professor/aulas/[aulaId]/route.ts."
            : texto || "Erro ao excluir aula"
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir aula");
      }

      alert("Aula excluída com sucesso.");

      await carregarDados();
    } catch (e: any) {
      alert(e?.message || "Erro ao excluir aula");
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const resTurmas = await fetch("/api/professor/turmas", {
        credentials: "include",
      });

      const turmasData = await resTurmas.json();

      if (!resTurmas.ok) {
        throw new Error(turmasData?.error || "Erro ao carregar turmas");
      }

      const turmaEncontrada = (Array.isArray(turmasData) ? turmasData : []).find(
        (t: TurmaApi) => Number(t.id) === turmaId
      );

      if (!turmaEncontrada) {
        throw new Error("Turma não encontrada");
      }

      setTurma(turmaEncontrada);

      const resAulas = await fetch(`/api/professor/turmas/${turmaId}/aulas`, {
        credentials: "include",
      });

      const aulasData = await resAulas.json();

      if (!resAulas.ok) {
        throw new Error(aulasData?.error || "Erro ao carregar aulas");
      }

      setAulas(Array.isArray(aulasData) ? aulasData : []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar página");
      setTurma(null);
      setAulas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      setErro("Turma inválida");
      setLoading(false);
      return;
    }

    carregarDados();
  }, [turmaId]);

  async function handleCriarAula(e: React.FormEvent) {
    e.preventDefault();

    if (!turmaId || !Number.isFinite(turmaId)) {
      setErro("Turma inválida");
      return;
    }

    try {
      setSaving(true);
      setErro("");

      const res = await fetch(`/api/professor/turmas/${turmaId}/aulas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          titulo,
          descricao,
          duracaoMin: duracaoMin ? Number(duracaoMin) : null,
          videoUrl: normalizeYoutubeUrl(videoUrl),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar aula");
      }

      setTitulo("");
      setDescricao("");
      setDuracaoMin("");
      setVideoUrl("");

      await carregarDados();
    } catch (e: any) {
      setErro(e.message || "Erro ao criar aula");
    } finally {
      setSaving(false);
    }
  }

  const aulasOrdenadas = useMemo(() => {
    return [...aulas].sort((a, b) => {
      const ao = a.ordem ?? 999999;
      const bo = b.ordem ?? 999999;
      if (ao !== bo) return ao - bo;
      return a.id - b.id;
    });
  }, [aulas]);

  if (loading) {
    return <div className="p-8">Carregando aulas...</div>;
  }

  if (!turma) {
    return <div className="p-8">Turma não encontrada.</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aulas da turma</h1>
        <p className="text-gray-600">
          Turma: <strong>{turma.nome}</strong>
        </p>
        <p className="text-gray-600">
          Disciplina:{" "}
          <strong>{turma.disciplina?.nome || "Disciplina"}</strong>
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleCriarAula}
        className="space-y-4 bg-white border rounded-lg p-6"
      >
        <h2 className="font-semibold text-gray-900">Nova aula</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            placeholder="Ex.: Introdução ao Direito Constitucional"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            rows={4}
            placeholder="Resumo do conteúdo da aula"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração (minutos)
          </label>
          <input
            type="number"
            min="1"
            value={duracaoMin}
            onChange={(e) => setDuracaoMin(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            placeholder="Ex.: 20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link do vídeo
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            placeholder="Cole qualquer link do YouTube"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Adicionar aula"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">Aulas cadastradas</h2>

        {aulasOrdenadas.length === 0 ? (
          <p className="text-gray-600">Nenhuma aula criada ainda.</p>
        ) : (
          aulasOrdenadas.map((aula) => (
            <div
              key={aula.id}
              className="bg-white border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-gray-900">
                  {aula.ordem ? `${aula.ordem}. ` : ""}
                  {aula.titulo}
                </h3>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <span className="text-sm text-gray-500">
                    {aula.duracaoMin ? `${aula.duracaoMin} min` : "Sem duração"}
                  </span>

                  <button
                    onClick={() =>
                      router.push(
                        `/professor/turmas/${turmaId}/aulas/${aula.id}/presencas`
                      )
                    }
                    className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Fazer chamada
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirAula(aula.id, aula.titulo);
                    }}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {aula.descricao && (
                <p className="text-sm text-gray-600">{aula.descricao}</p>
              )}

              {aula.videoUrl && (
                <a
                  href={aula.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-blue-600 hover:underline"
                >
                  Abrir vídeo
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}