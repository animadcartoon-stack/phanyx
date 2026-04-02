"use client";

import { useEffect, useState } from "react";

export default function AdminNotasPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [notas, setNotas] = useState([]);

  const [disciplinaId, setDisciplinaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    fetch("/api/disciplina")
      .then(res => res.json())
      .then(setDisciplinas);
  }, []);

  useEffect(() => {
    if (!disciplinaId) return;

    fetch(`/api/matricula?disciplinaId=${disciplinaId}`)
      .then(res => res.json())
      .then(setAlunos);

    fetch(`/api/nota?disciplinaId=${disciplinaId}`)
      .then(res => res.json())
      .then(setNotas);

  }, [disciplinaId]);

  async function salvarNota(e: any) {
    e.preventDefault();

    await fetch("/api/nota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alunoId: Number(alunoId),
        disciplinaId: Number(disciplinaId),
        valor: Number(valor),
      }),
    });

    setValor("");

    const res = await fetch(`/api/nota?disciplinaId=${disciplinaId}`);
    setNotas(await res.json());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Lançamento de Notas</h1>

      <form onSubmit={salvarNota} className="space-y-4">
        <select
          value={disciplinaId}
          onChange={(e) => setDisciplinaId(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Selecione disciplina</option>
          {disciplinas.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>

        <select
          value={alunoId}
          onChange={(e) => setAlunoId(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Selecione aluno</option>
          {alunos.map((a: any) => (
            <option key={a.aluno.id} value={a.aluno.id}>
              {a.aluno.nome}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Nota"
          className="border p-2 rounded w-full"
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Salvar nota
        </button>
      </form>

      <div className="space-y-2">
        {notas.map((n: any) => (
          <div key={n.id} className="border p-3 rounded">
            {n.aluno.nome} — Nota: {n.valor}
          </div>
        ))}
      </div>
    </div>
  );
}