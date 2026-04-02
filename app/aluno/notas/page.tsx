"use client";

import { useEffect, useState } from "react";

type Nota = {
  alunoId: string;
  nome: string;
  email: string;
  disciplina: string;
  nota: string;
  feedback: string;
};

export default function NotasAlunoPage() {
  // 🔹 SIMULAÇÃO: aluno logado
  const alunoId = "1";

  const [notas, setNotas] = useState<Nota[]>([]);

  useEffect(() => {
    const todasNotas: Nota[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);

      if (chave?.startsWith("nota-")) {
        const item = localStorage.getItem(chave);
        if (item) {
          const nota = JSON.parse(item);

          if (nota.alunoId === alunoId) {
            todasNotas.push(nota);
          }
        }
      }
    }

    setNotas(todasNotas);
  }, []);

  function situacao(nota: number) {
    if (nota >= 7) return "✅ Aprovado";
    if (nota >= 5) return "⚠️ Recuperação";
    return "❌ Reprovado";
  }

  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">
        📊 Minhas Notas
      </h1>

      {notas.length === 0 ? (
        <p className="text-gray-600">
          Nenhuma nota lançada até o momento.
        </p>
      ) : (
        <div className="space-y-4">
          {notas.map((nota, index) => (
            <div
              key={index}
              className="border rounded-lg p-6 space-y-2"
            >
              <h2 className="text-xl font-semibold">
                📘 {nota.disciplina}
              </h2>

              <p>
                <strong>Nota:</strong>{" "}
                <span className="text-blue-600 font-bold">
                  {nota.nota}
                </span>
              </p>

              <p>
                <strong>Situação:</strong>{" "}
                {situacao(Number(nota.nota))}
              </p>

              {nota.feedback && (
                <p className="text-gray-700">
                  <strong>Feedback:</strong>{" "}
                  {nota.feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
