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

type FeedbackTipo = "sucesso" | "erro" | "";

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
  const params = useParams<{ turmaId: string }>();
  const turmaId = Number(params.turmaId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [turma, setTurma] = useState<TurmaApi | null>(null);
  const [aulas, setAulas] = useState<AulaApi[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoMin, setDuracaoMin] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  const [aulaParaExcluir, setAulaParaExcluir] = useState<{
    id: number;
    titulo: string;
  } | null>(null);

  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const [aulaEditando, setAulaEditando] = useState<AulaApi | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editDuracaoMin, setEditDuracaoMin] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  function abrirEdicao(aula: AulaApi) {
    setAulaEditando(aula);
    setEditTitulo(aula.titulo || "");
    setEditDescricao(aula.descricao || "");
    setEditDuracaoMin(aula.duracaoMin ? String(aula.duracaoMin) : "");
    setEditVideoUrl(aula.videoUrl || "");
  }

  async function salvarEdicaoAula(e: React.FormEvent) {
    e.preventDefault();

    if (!aulaEditando) return;

    try {
      setSalvandoEdicao(true);
      setErro("");

      const res = await fetch(`/api/professor/aulas/${aulaEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          titulo: editTitulo,
          descricao: editDescricao,
          duracaoMin: editDuracaoMin ? Number(editDuracaoMin) : null,
          videoUrl: editVideoUrl ? normalizeYoutubeUrl(editVideoUrl) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao editar aula");
      }

      setAulaEditando(null);
      mostrarFeedback("sucesso", "Aula editada com sucesso!");
      await carregarDados();
    } catch (e: any) {
      mostrarFeedback("erro", e?.message || "Erro ao editar aula");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirAulaConfirmada() {
    if (!aulaParaExcluir) return;

    try {
      setExcluindoId(aulaParaExcluir.id);

      const res = await fetch(`/api/professor/aulas/${aulaParaExcluir.id}`, {
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

      setAulaParaExcluir(null);
      mostrarFeedback("sucesso", "Aula excluída com sucesso.");
      await carregarDados();
    } catch (e: any) {
      mostrarFeedback("erro", e?.message || "Erro ao excluir aula");
    } finally {
      setExcluindoId(null);
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

      const listaTurmas = Array.isArray(turmasData)
  ? turmasData
  : Array.isArray(turmasData?.turmas)
  ? turmasData.turmas
  : [];

const turmaEncontrada = listaTurmas.find(
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
      setFeedback("");
      setFeedbackTipo("");

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
          videoUrl: videoUrl ? normalizeYoutubeUrl(videoUrl) : null,
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

      mostrarFeedback("sucesso", "Aula criada com sucesso!");
      await carregarDados();
    } catch (e: any) {
      setErro(e.message || "Erro ao criar aula");
      mostrarFeedback("erro", e.message || "Erro ao criar aula");
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
    <>
      <div className="max-w-5xl space-y-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackTipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}

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
            Disciplina: <strong>{turma.disciplina?.nome || "Disciplina"}</strong>
          </p>
        </div>

        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form
          onSubmit={handleCriarAula}
          className="space-y-4 rounded-lg border bg-white p-6"
        >
          <h2 className="font-semibold text-gray-900">Nova aula</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-lg border p-2 text-gray-900"
              placeholder="Ex.: Introdução ao Direito Constitucional"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg border p-2 text-gray-900"
              rows={4}
              placeholder="Resumo do conteúdo da aula"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Duração (minutos)
            </label>
            <input
              type="number"
              min="1"
              value={duracaoMin}
              onChange={(e) => setDuracaoMin(e.target.value)}
              className="w-full rounded-lg border p-2 text-gray-900"
              placeholder="Ex.: 20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Link do vídeo
            </label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded-lg border p-2 text-gray-900"
              placeholder="Cole link do YouTube ou deixe em branco"
            />
            <p className="mt-1 text-xs text-gray-500">
              O vídeo é opcional. Os materiais e links de apoio serão adicionados depois.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
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
                className="space-y-3 rounded-lg border bg-white p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">
                    {aula.ordem ? `${aula.ordem}. ` : ""}
                    {aula.titulo}
                  </h3>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="text-sm text-gray-500">
                      {aula.duracaoMin ? `${aula.duracaoMin} min` : "Sem duração"}
                    </span>

                    <button
                      onClick={() => abrirEdicao(aula)}
                      className="rounded bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        router.push(
                          `/professor/turmas/${turmaId}/aulas/${aula.id}/presencas`
                        )
                      }
                      className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700"
                    >
                      Fazer chamada
                    </button>

                    <button
                      onClick={() =>
                        router.push(`/professor/aulas/${aula.id}/materiais/novo`)
                      }
                      className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                    >
                      Materiais
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAulaParaExcluir({
                          id: aula.id,
                          titulo: aula.titulo,
                        });
                      }}
                      disabled={excluindoId === aula.id}
                      className="rounded bg-red-600 px-3 py-1 text-xs text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {excluindoId === aula.id ? "Excluindo..." : "Excluir"}
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

                <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                  Nesta aula, o professor poderá adicionar arquivos, PDFs, documentos,
                  imagens e links de apoio pelo botão <strong>Materiais</strong>.
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {aulaEditando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={salvarEdicaoAula}
            className="w-full max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Editar aula</h2>

              <button
                type="button"
                onClick={() => setAulaEditando(null)}
                className="rounded-full px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Título
              </label>
              <input
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                className="w-full rounded-lg border p-2 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="w-full rounded-lg border p-2 text-gray-900"
                rows={4}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Duração (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={editDuracaoMin}
                onChange={(e) => setEditDuracaoMin(e.target.value)}
                className="w-full rounded-lg border p-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Link do vídeo
              </label>
              <input
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                className="w-full rounded-lg border p-2 text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAulaEditando(null)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvandoEdicao}
                className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      )}

      {aulaParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tem certeza que deseja excluir a aula{" "}
                  <strong>"{aulaParaExcluir.titulo}"</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAulaParaExcluir(null)}
                disabled={excluindoId === aulaParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirAulaConfirmada}
                disabled={excluindoId === aulaParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === aulaParaExcluir.id
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}