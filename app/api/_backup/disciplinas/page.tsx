"use client";

import { useEffect, useState } from "react";
import withAuth from "@/components/auth/withAuth";

function AdminDisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [professorId, setProfessorId] = useState("");

  async function carregarDados() {
    const [resDisc, resProf] = await Promise.all([
      fetch("/api/disciplina", { credentials: "include" }),
      fetch("/api/professor", { credentials: "include" }),
    ]);

    const discData = await resDisc.json();
    const profData = await resProf.json();

    setDisciplinas(discData);
    setProfessores(profData);
  }

  async function criarDisciplina() {
    const res = await fetch("/api/disciplina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nome,
        professorId: Number(professorId),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setNome("");
    setProfessorId("");
    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📚 Disciplinas</h1>

      <div className="bg-white p-4 border rounded-lg space-y-3 max-w-md">
        <input
          placeholder="Nome da disciplina"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <select
          value={professorId}
          onChange={(e) => setProfessorId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Selecione o professor</option>
          {professores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <button
          onClick={criarDisciplina}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Criar disciplina
        </button>
      </div>

      <div className="space-y-2">
        {disciplinas.map((d) => (
          <div key={d.id} className="border p-3 rounded bg-white">
            <p className="font-medium">{d.nome}</p>
            <p className="text-sm text-gray-600">
              Professor: {d.professor?.nome}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuth(AdminDisciplinasPage, ["admin"]);