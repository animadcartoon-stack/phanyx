"use client";

import { useRouter } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";

export default function DisciplinasAluno() {
  const router = useRouter();
  const { disciplinasMatriculadas } = useAluno();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📘 Minhas Disciplinas</h1>

      {disciplinasMatriculadas.length === 0 ? (
        <p className="text-gray-600">
          Você ainda não está matriculado em nenhuma disciplina.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {disciplinasMatriculadas.map((disciplina) => (
            <div
              key={disciplina.id}
              onClick={() => router.push(`/aluno/disciplinas/${disciplina.id}`)}
              className="cursor-pointer rounded-xl border bg-white p-6 shadow transition hover:border-blue-500 hover:shadow-lg"
            >
              <h2 className="text-lg font-semibold">{disciplina.nome}</h2>

              <p className="mt-2 text-sm text-gray-600">
                {disciplina._count?.aulas ?? 0} aulas
              </p>

              {disciplina.professor?.nome && (
                <p className="mt-1 text-sm text-gray-500">
                  Professor: {disciplina.professor.nome}
                </p>
              )}

              {disciplina.turma?.nome && (
                <p className="text-sm text-gray-500">
                  Turma: {disciplina.turma.nome}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}