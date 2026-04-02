"use client";

import { useEffect, useState } from "react";

export default function ProgressoAluno() {
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const valorSalvo = localStorage.getItem("progressoSemestre2");
    if (valorSalvo) {
      setProgresso(Number(valorSalvo));
    }
  }, []);

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-6">
        Progresso Acadêmico por Semestre
      </h1>

      {/* 2º Semestre conectado */}
      <div className="p-4 border rounded bg-white">
        <h2 className="text-xl font-semibold mb-2">2º Semestre</h2>
        <p>
          Status:{" "}
          <strong>
            {progresso === 100 ? "Concluído" : "Em andamento"}
          </strong>
        </p>
        <p>Progresso lançado pelo professor</p>

        <div className="w-full bg-gray-200 rounded h-4 mt-2">
          <div
            className={`h-4 rounded ${
              progresso === 100 ? "bg-green-600" : "bg-blue-600"
            }`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        <p className="mt-2 font-semibold">{progresso}% concluído</p>

        {progresso === 100 && (
          <p className="mt-3 text-green-700 font-bold">
            ✅ Certificado liberado
          </p>
        )}
      </div>
    </div>
  );
}
