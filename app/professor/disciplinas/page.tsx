"use client";

import { useProfessor } from "@/app/context/ProfessorContext";
import { useRouter } from "next/navigation";

export default function DisciplinasProfessor() {
  const { disciplinas } = useProfessor();
  const router = useRouter();

  async function excluirDisciplina(id: number, nome: string) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a disciplina "${nome}"?`
    );

    if (!confirmar) return;

    try {
      const res = await fetch(`/api/professor/disciplinas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao excluir disciplina");
      }

      alert("Disciplina excluída com sucesso.");

      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Erro ao excluir disciplina");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          📚 Disciplinas
        </h1>

        <button
          onClick={() => router.push("/professor/disciplinas/nova")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Nova disciplina
        </button>
      </div>

      <div className="space-y-4">
        {disciplinas.map((d) => (
          <div
            key={d.id}
            onClick={() => router.push(`/professor/disciplinas/${d.id}`)}
            className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{d.nome}</h2>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  excluirDisciplina(Number(d.id), d.nome);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {disciplinas.length === 0 && (
          <p className="text-gray-600">
            Nenhuma disciplina criada ainda.
          </p>
        )}
      </div>
    </div>
  );
}