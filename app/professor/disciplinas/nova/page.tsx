"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfessor } from "@/app/context/ProfessorContext";

export default function NovaDisciplina() {
  const { criarDisciplina } = useProfessor();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [professorEmail, setProfessorEmail] = useState("prof@ibe.com");
  const [cargaHoraria, setCargaHoraria] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const id = criarDisciplina(
      nome,
      professorEmail,
      Number(cargaHoraria) || 0,
      descricao
    );

    router.push(`/professor/disciplinas/${id}`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
        type="button"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold text-gray-900">
        Nova Disciplina
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white border rounded-lg p-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email do professor
          </label>
          <input
            type="email"
            value={professorEmail}
            onChange={(e) => setProfessorEmail(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Carga horária
          </label>
          <input
            type="number"
            min="0"
            value={cargaHoraria}
            onChange={(e) => setCargaHoraria(e.target.value)}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>

        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          Criar disciplina
        </button>
      </form>
    </div>
  );
}