"use client";

import { useState } from "react";

type Disciplina = {
  nome: string;
  totalAulas: number;
  assistidas: number;
};

export default function ProgressoAlunoPage() {
  const [aluno, setAluno] = useState("João da Silva");

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([
    { nome: "Antigo Testamento", totalAulas: 20, assistidas: 5 },
    { nome: "Novo Testamento", totalAulas: 18, assistidas: 10 },
    { nome: "Teologia Sistemática", totalAulas: 25, assistidas: 0 },
  ]);

  function assistirAula(index: number) {
    const novas = [...disciplinas];
    if (novas[index].assistidas < novas[index].totalAulas) {
      novas[index].assistidas += 1;
      setDisciplinas(novas);
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-2">Progresso do Aluno</h1>
      <p className="mb-6 text-gray-600">
        Acompanhamento acadêmico — IBE
      </p>

      <div className="bg-white p-4 rounded shadow mb-6">
        <strong>Aluno:</strong> {aluno}
      </div>

      <div className="bg-white rounded shadow">
        <div className="grid grid-cols-5 font-semibold bg-gray-100 p-3">
          <span>Disciplina</span>
          <span>Aulas</span>
          <span>Assistidas</span>
          <span>Progresso</span>
          <span>Ação</span>
        </div>

        {disciplinas.map((d, i) => {
          const progresso = Math.round(
            (d.assistidas / d.totalAulas) * 100
          );

          return (
            <div
              key={i}
              className="grid grid-cols-5 p-3 border-t items-center"
            >
              <span>{d.nome}</span>
              <span>{d.totalAulas}</span>
              <span>{d.assistidas}</span>

              <div className="w-full bg-gray-200 rounded h-4">
                <div
                  className="bg-green-600 h-4 rounded"
                  style={{ width: `${progresso}%` }}
                />
              </div>

              <button
                onClick={() => assistirAula(i)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                + Aula
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
