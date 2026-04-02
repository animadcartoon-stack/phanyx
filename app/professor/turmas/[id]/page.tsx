"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Aluno = {
  id: string;
  nome: string;
  email: string;
};

export default function AlunosDaTurmaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // ALUNOS SIMULADOS
  const alunos: Aluno[] = [
    { id: "1", nome: "João Silva", email: "joao@email.com" },
    { id: "2", nome: "Maria Oliveira", email: "maria@email.com" },
    { id: "3", nome: "Pedro Santos", email: "pedro@email.com" },
  ];

  const [notasSalvas, setNotasSalvas] = useState<Record<string, any>>({});

  useEffect(() => {
    const notas: Record<string, any> = {};

    alunos.forEach((aluno) => {
      const item = localStorage.getItem(`nota-${aluno.id}`);
      if (item) {
        notas[aluno.id] = JSON.parse(item);
      }
    });

    setNotasSalvas(notas);
  }, []);

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ⬅ Voltar
      </button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">👩‍🎓 Alunos da Turma</h1>

        <p className="text-gray-600">
          Turma: <strong>{id}</strong>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            Aulas da turma
          </h2>

          <button
            onClick={() => router.push(`/professor/turmas/${id}/aulas`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Gerenciar aulas
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-3">
            Boletim da turma
          </h2>

          <button
            onClick={() => router.push(`/professor/turmas/${id}/boletim`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ver boletim
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>

          <tbody>
            {alunos.map((aluno) => {
              const nota = notasSalvas[aluno.id];

              return (
                <tr key={aluno.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{aluno.nome}</td>
                  <td className="p-3">{aluno.email}</td>

                  <td className="p-3">
                    {nota ? (
                      <span className="text-green-600 font-medium">
                        ✅ Nota lançada ({nota.nota})
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        ❌ Pendente
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => router.push(`/professor/notas/${aluno.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      {nota ? "✏️ Editar nota" : "📝 Lançar nota"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}