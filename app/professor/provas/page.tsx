"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirmDialog } from "@/components/providers/ConfirmDialogProvider";

type Disciplina = {
  id: number;
  nome?: string;
  titulo?: string;
};

type Turma = {
  id: number;
  nome?: string;
};

type Prova = {
  id: number;
  titulo: string;
  notaMaxima: number;
  tempoMin?: number | null;
  ativa: boolean;
  status: "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
  createdAt?: string;
  disciplina?: Disciplina | null;
  turma?: Turma | null;
};

export default function ProfessorProvasPage() {
  const [provas, setProvas] = useState<Prova[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [acaoLoading, setAcaoLoading] = useState<{
    provaId: number;
    acao: "publicar" | "encerrar" | "excluir";
  } | null>(null);

  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();

  async function carregarProvas() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/provas");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar provas");
      }

      setProvas(
  Array.isArray(data)
    ? data.map((p) => ({
        ...p,
        status: p.ativa ? "PUBLICADA" : "RASCUNHO",
      }))
    : []
);
    } catch (e: any) {
      setErro(e.message);
      showToast(e.message || "Erro ao carregar provas", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProvas();
  }, []);

  async function publicarProva(provaId: number) {
    try {
      setAcaoLoading({ provaId, acao: "publicar" });

      const res = await fetch(`/api/professor/provas/${provaId}/publicar`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao publicar prova");
      }

      await carregarProvas();
      showToast("Prova publicada com sucesso", "success");
    } catch (e: any) {
      showToast(e.message || "Erro ao publicar prova", "error");
    } finally {
      setAcaoLoading(null);
    }
  }

  async function encerrarProva(provaId: number) {
    const confirmou = await confirm({
      title: "Encerrar prova",
      message: "Tem certeza que deseja encerrar esta prova?",
      confirmText: "Encerrar",
      cancelText: "Cancelar",
      confirmVariant: "primary",
    });

    if (!confirmou) return;

    try {
      setAcaoLoading({ provaId, acao: "encerrar" });

      const res = await fetch(`/api/professor/provas/${provaId}/encerrar`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao encerrar prova");
      }

      await carregarProvas();
      showToast("Prova encerrada com sucesso", "success");
    } catch (e: any) {
      showToast(e.message || "Erro ao encerrar prova", "error");
    } finally {
      setAcaoLoading(null);
    }
  }

  async function excluirProva(provaId: number) {
    const confirmou = await confirm({
      title: "Excluir prova",
      message:
        "Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      confirmVariant: "danger",
    });

    if (!confirmou) return;

    try {
      setAcaoLoading({ provaId, acao: "excluir" });

      const res = await fetch(`/api/professor/provas/${provaId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir prova");
      }

      await carregarProvas();
      showToast("Prova excluída com sucesso", "success");
    } catch (e: any) {
      showToast(e.message || "Erro ao excluir prova", "error");
    } finally {
      setAcaoLoading(null);
    }
  }

  const totalProvas = provas.length;

  const totalRascunho = useMemo(() => {
    return provas.filter((p) => p.status === "RASCUNHO").length;
  }, [provas]);

  const totalPublicadas = useMemo(() => {
    return provas.filter((p) => p.status === "PUBLICADA").length;
  }, [provas]);

  const totalEncerradas = useMemo(() => {
    return provas.filter((p) => p.status === "ENCERRADA").length;
  }, [provas]);

  function getStatusLabel(status: Prova["status"]) {
    if (status === "PUBLICADA") return "Publicada";
    if (status === "ENCERRADA") return "Encerrada";
    return "Rascunho";
  }

  function getStatusClasses(status: Prova["status"]) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (status === "ENCERRADA") {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }

    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Provas</h1>
            <p className="text-sm text-gray-500">
              Gerencie as provas das suas disciplinas, publique avaliações e acompanhe tentativas.
            </p>
          </div>

          <a
            href="/professor/provas/nova"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nova prova
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total de provas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalProvas}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Em rascunho
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {totalRascunho}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Publicadas
            </p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {totalPublicadas}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Encerradas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-700">
              {totalEncerradas}
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando provas...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && provas.length === 0 && (
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="max-w-xl space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Nenhuma prova cadastrada ainda
              </h2>
              <p className="text-sm text-gray-500">
                Crie sua primeira prova para começar a montar avaliações, adicionar questões e acompanhar tentativas dos alunos.
              </p>

              <div className="pt-2">
                <a
                  href="/professor/provas/nova"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Criar primeira prova
                </a>
              </div>
            </div>
          </div>
        )}

        {!loading && !erro && provas.length > 0 && (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Lista de provas
              </h2>
              <p className="text-sm text-gray-500">
                Visualize o status e acesse rapidamente as principais ações.
              </p>
            </div>

            <div className="divide-y">
              {provas.map((prova) => (
                <div
                  key={prova.id}
                  className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {prova.titulo}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          prova.status
                        )}`}
                      >
                        {getStatusLabel(prova.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>
                        <strong className="font-medium text-gray-700">
                          Disciplina:
                        </strong>{" "}
                        {prova.disciplina?.nome ||
                          prova.disciplina?.titulo ||
                          "-"}
                      </span>

                      <span>
                        <strong className="font-medium text-gray-700">
                          Turma:
                        </strong>{" "}
                        {prova.turma?.nome || "-"}
                      </span>

                      <span>
                        <strong className="font-medium text-gray-700">
                          Nota máx.:
                        </strong>{" "}
                        {prova.notaMaxima}
                      </span>

                      <span>
                        <strong className="font-medium text-gray-700">
                          Tempo:
                        </strong>{" "}
                        {prova.tempoMin ? `${prova.tempoMin} min` : "Livre"}
                      </span>

                      {prova.createdAt && (
                        <span>
                          <strong className="font-medium text-gray-700">
                            Criada em:
                          </strong>{" "}
                          {new Date(prova.createdAt).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/professor/provas/${prova.id}`}
                      className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Editar
                    </a>

                    <a
                      href={`/professor/provas/${prova.id}/tentativas`}
                      className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Tentativas
                    </a>

                    {prova.status === "RASCUNHO" && (
                      <button
                        onClick={() => publicarProva(prova.id)}
                        disabled={
                          acaoLoading?.provaId === prova.id &&
                          acaoLoading?.acao === "publicar"
                        }
                        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {acaoLoading?.provaId === prova.id &&
                        acaoLoading?.acao === "publicar"
                          ? "Publicando..."
                          : "Publicar"}
                      </button>
                    )}

                    {prova.status !== "ENCERRADA" && (
                      <button
                        onClick={() => encerrarProva(prova.id)}
                        disabled={
                          acaoLoading?.provaId === prova.id &&
                          acaoLoading?.acao === "encerrar"
                        }
                        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {acaoLoading?.provaId === prova.id &&
                        acaoLoading?.acao === "encerrar"
                          ? "Encerrando..."
                          : "Encerrar"}
                      </button>
                    )}

                    {prova.status === "RASCUNHO" && (
                      <button
                        onClick={() => excluirProva(prova.id)}
                        disabled={
                          acaoLoading?.provaId === prova.id &&
                          acaoLoading?.acao === "excluir"
                        }
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {acaoLoading?.provaId === prova.id &&
                        acaoLoading?.acao === "excluir"
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}