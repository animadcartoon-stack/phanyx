"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LancarNotasPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");

  function salvar() {
    alert("Nota salva com sucesso (simulado)");
    router.back();
  }

  return (
    <div className="space-y-6 max-w-xl">
      <button
        onClick={() => router.back()}
        className="text-blue-600 hover:underline"
      >
        ⬅ Voltar
      </button>

      <h1 className="text-2xl font-bold">
        📝 Lançar notas – Aluno {params.id}
      </h1>

      <div className="space-y-4">
        <label className="block">
          Nota
          <input
            type="number"
            min={0}
            max={10}
            className="w-full border p-2 rounded mt-1"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </label>

        <label className="block">
          Feedback
          <textarea
            className="w-full border p-2 rounded mt-1"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </label>

        <button
          onClick={salvar}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          💾 Salvar nota
        </button>
      </div>
    </div>
  );
}

