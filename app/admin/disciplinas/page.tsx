"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

interface Curso {
  id: number;
  nome: string;
}

interface Disciplina {
  id: number;
  nome: string;
  curso?: Curso | null;
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminDisciplinasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState<string>("");
  const [busca, setBusca] = useState("");

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [disciplinaParaExcluir, setDisciplinaParaExcluir] =
    useState<Disciplina | null>(null);

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

  async function carregarDados() {
    const resDisc = await fetch("/api/disciplina", {
      credentials: "include",
    });
    const dataDisc = await resDisc.json();
    setDisciplinas(Array.isArray(dataDisc) ? dataDisc : []);

    try {
      const resCursos = await fetch("/api/curso", {
        credentials: "include",
      });
      const dataCursos = await resCursos.json();
      setCursos(Array.isArray(dataCursos) ? dataCursos : []);
    } catch {
      setCursos([]);
    }
  }

  async function handleCriarDisciplina(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/disciplina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          cursoId: cursoId ? Number(cursoId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar disciplina");
      }

      setNome("");
      setCursoId("");
      setMostrarForm(false);
      await carregarDados();
      mostrarFeedback("sucesso", "Disciplina criada com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao criar disciplina");
    } finally {
      setCriando(false);
    }
  }

  async function confirmarExclusao() {
    if (!disciplinaParaExcluir) return;

    try {
      setExcluindoId(disciplinaParaExcluir.id);

      const res = await fetch(`/api/disciplina/${disciplinaParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir disciplina");
      }

      setDisciplinaParaExcluir(null);
      await carregarDados();
      mostrarFeedback("sucesso", "Disciplina excluída com sucesso.");
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || "Erro ao excluir disciplina");
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const disciplinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return disciplinas;

    return disciplinas.filter((d) => {
      const id = String(d.id || "").toLowerCase();
      const nomeTexto = String(d.nome || "").toLowerCase();
      const cursoTexto = String(d.curso?.nome || "").toLowerCase();

      return (
        id.includes(termo) ||
        nomeTexto.includes(termo) ||
        cursoTexto.includes(termo)
      );
    });
  }, [disciplinas, busca]);

  return (
    <>
      <div className="space-y-6">
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">📚 Gestão de Disciplinas</h1>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <input
              type="text"
              placeholder="Buscar por nome da disciplina, curso ou ID"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded p-2 border md:w-[380px]"
            />

            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="rounded bg-purple-600 px-4 py-2 text-white"
            >
              + Nova Disciplina
            </button>
          </div>
        </div>

        {mostrarForm && (
          <form
            onSubmit={handleCriarDisciplina}
            className="space-y-4 rounded-lg bg-white p-6 shadow"
          >
            <h2 className="font-semibold">Nova disciplina</h2>

            <input
              type="text"
              placeholder="Nome da disciplina"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded border p-2"
              required
            />

            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">Sem curso vinculado</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <button
              disabled={criando}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {criando ? "Criando..." : "Criar disciplina"}
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Curso</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {disciplinasFiltradas.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{d.id}</td>
                  <td className="p-3">{d.nome}</td>
                  <td className="p-3">{d.curso?.nome ?? "—"}</td>
                  <td className="space-x-2 p-3">
                    <button
                      onClick={() => router.push(`/admin/disciplinas/${d.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDisciplinaParaExcluir(d)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {disciplinasFiltradas.length === 0 && (
            <div className="p-4 text-gray-500">
              Nenhuma disciplina encontrada para essa busca.
            </div>
          )}
        </div>
      </div>

      {disciplinaParaExcluir && (
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
                  Tem certeza que deseja excluir a disciplina{" "}
                  <strong>"{disciplinaParaExcluir.nome}"</strong>?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDisciplinaParaExcluir(null)}
                disabled={excluindoId === disciplinaParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindoId === disciplinaParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === disciplinaParaExcluir.id
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

export default withAuth(AdminDisciplinasPage, ["admin"]);