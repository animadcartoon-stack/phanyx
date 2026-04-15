"use client";

import { useProfessor } from "@/app/context/ProfessorContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FeedbackTipo = "sucesso" | "erro" | "";

export default function DisciplinasProfessor() {
  const { disciplinas } = useProfessor();
  const router = useRouter();

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [disciplinaParaExcluir, setDisciplinaParaExcluir] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

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

  async function confirmarExclusaoDisciplina() {
    if (!disciplinaParaExcluir) return;

    try {
      setExcluindoId(disciplinaParaExcluir.id);

      const res = await fetch(
        `/api/professor/disciplinas/${disciplinaParaExcluir.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir disciplina");
      }

      setDisciplinaParaExcluir(null);
      mostrarFeedback("sucesso", "Disciplina excluída com sucesso.");

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (e: any) {
      mostrarFeedback("erro", e?.message || "Erro ao excluir disciplina");
    } finally {
      setExcluindoId(null);
    }
  }

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

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">📚 Disciplinas</h1>

          <button
            onClick={() => router.push("/professor/disciplinas/nova")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Nova disciplina
          </button>
        </div>

        <div className="space-y-4">
          {disciplinas.map((d) => (
            <div
              key={d.id}
              onClick={() => router.push(`/professor/disciplinas/${d.id}`)}
              className="cursor-pointer rounded-lg border bg-white p-4 transition hover:shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-gray-900">{d.nome}</h2>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDisciplinaParaExcluir({
                      id: Number(d.id),
                      nome: d.nome,
                    });
                  }}
                  disabled={excluindoId === Number(d.id)}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {excluindoId === Number(d.id) ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))}

          {disciplinas.length === 0 && (
            <p className="text-gray-600">Nenhuma disciplina criada ainda.</p>
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
                onClick={confirmarExclusaoDisciplina}
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