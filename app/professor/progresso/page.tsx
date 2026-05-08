"use client";

import { useState } from "react";
import PhanyxToast from "@/components/ui/PhanyxToast";

export default function ProgressoProfessor() {
  const [progresso, setProgresso] = useState(50);
  const [sucesso, setSucesso] = useState("");

  return (
    <div className="p-6 text-black">
      {sucesso && (
  <PhanyxToast
    tipo="sucesso"
    titulo="Tudo certo"
    mensagem={sucesso}
    onClose={() => setSucesso("")}
  />
)}
      <h1 className="text-2xl font-bold mb-6">
        Lançar Progresso do Aluno
      </h1>

      <div className="bg-white p-4 border rounded mb-6">
        <p><strong>Aluno:</strong> João da Silva</p>
        <p><strong>Curso:</strong> Bacharel Livre em Teologia</p>
        <p><strong>Semestre:</strong> 2º Semestre</p>
      </div>

      <div className="bg-white p-4 border rounded mb-6">
        <label className="block mb-2 font-semibold">
          Progresso do semestre (%)
        </label>

        <input
          type="number"
          min={0}
          max={100}
          value={progresso}
          onChange={(e) => setProgresso(Number(e.target.value))}
          className="border p-2 w-full mb-4"
        />

        <div className="w-full bg-gray-200 rounded h-4">
          <div
            className="bg-green-600 h-4 rounded"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <p className="mt-2 font-semibold">{progresso}% concluído</p>
      </div>

      <button
  onClick={() => {
    localStorage.setItem("progressoSemestre2", progresso.toString());
    setSucesso("Progresso salvo e enviado ao aluno.");
  }}
  className="px-6 py-2 bg-blue-600 text-white rounded"
>
  Salvar Progresso
</button>

    </div>
  );
}
