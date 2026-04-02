"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGrades } from "@/app/context/GradesContext";


export default function LancarNotaPage({
  params,
}: {
  params: { alunoId: string };
}) {
  const router = useRouter();
  const { salvarNota } = useGrades();

  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");

  const aluno = {
    id: params.alunoId,
    nome: "João Silva",
    email: "joao@email.com",
    
  };

  function handleSalvar() {
    salvarNota({
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      email: aluno.email,
      disciplina: "Disciplina",
      nota: Number(nota),
      feedback,
    });

    alert("✅ Nota salva com sucesso!");
    router.back();
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ⬅ Voltar
      </button>

      <h1 className="text-3xl font-bold">📝 Lançar Nota</h1>

      <div className="border p-4 rounded space-y-2">
        <p><strong>Aluno:</strong> {aluno.nome}</p>
        <p><strong>Email:</strong> {aluno.email}</p>
        <p><strong>Disciplina:</strong> Disciplina</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block font-medium">Nota</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium">Feedback</label>
          <textarea
            className="w-full border p-2 rounded"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        <button
          onClick={handleSalvar}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          💾 Salvar Nota
        </button>
      </div>
    </main>
  );
}
