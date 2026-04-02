"use client";

import { useState } from "react";

type Trabalho = {
  aluno: string;
  disciplina: string;
  titulo: string;
  observacao: string;
  status: "Enviado" | "Avaliado";
  nota?: number;
  feedback?: string;
};

export default function TrabalhosProfessorPage() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([
    {
      aluno: "João da Silva",
      disciplina: "Antigo Testamento",
      titulo: "Análise do Pentateuco",
      observacao: "Trabalho em PDF",
      status: "Enviado",
    },
  ]);

  function avaliar(index: number, nota: number, feedback: string) {
    const novos = [...trabalhos];
    novos[index] = {
      ...novos[index],
      status: "Avaliado",
      nota,
      feedback,
    };
    setTrabalhos(novos);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Avaliação de Trabalhos
      </h1>

      <div className="bg-white rounded shadow">
        <div className="grid grid-cols-8 font-semibold bg-gray-100 p-3">
          <span>Aluno</span>
          <span>Disciplina</span>
          <span>Título</span>
          <span>Status</span>
          <span>Nota</span>
          <span>Feedback</span>
          <span></span>
          <span></span>
        </div>

        {trabalhos.map((t, i) => (
          <TrabalhoRow
            key={i}
            trabalho={t}
            onAvaliar={(nota, feedback) =>
              avaliar(i, nota, feedback)
            }
          />
        ))}
      </div>
    </main>
  );
}

function TrabalhoRow({
  trabalho,
  onAvaliar,
}: {
  trabalho: Trabalho;
  onAvaliar: (nota: number, feedback: string) => void;
}) {
  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");

  return (
    <div className="grid grid-cols-8 p-3 border-t items-center">
      <span>{trabalho.aluno}</span>
      <span>{trabalho.disciplina}</span>
      <span>{trabalho.titulo}</span>

      <span
        className={
          trabalho.status === "Avaliado"
            ? "text-green-600 font-semibold"
            : "text-blue-600 font-semibold"
        }
      >
        {trabalho.status}
      </span>

      {trabalho.status === "Avaliado" ? (
        <>
          <span>{trabalho.nota}</span>
          <span className="text-sm">{trabalho.feedback}</span>
          <span></span>
          <span></span>
        </>
      ) : (
        <>
          <input
  type="number"
  min={0}
  max={10}
  className="border p-1 rounded w-20 bg-white text-black"
  placeholder="Nota"
  value={nota}
  onChange={(e) => setNota(e.target.value)}
/>


          <input
            className="border p-1 rounded"
            placeholder="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button
            onClick={() =>
              onAvaliar(Number(nota), feedback)
            }
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Avaliar
          </button>

          <span></span>
        </>
      )}
    </div>
  );
}
